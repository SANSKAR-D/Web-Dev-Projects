import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar.jsx';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import client from '../api/client.js';

/* ── Heatmap helpers ─────────────────────── */
const getDaysInYear = () => {
  const days = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getHeatmapColor = (count) => {
  if (count === 0) return 'rgba(255,255,255,0.03)';
  if (count === 1) return 'rgba(184,144,42,0.25)';
  if (count === 2) return 'rgba(184,144,42,0.45)';
  if (count <= 4) return 'rgba(212,168,60,0.65)';
  return 'rgba(232,192,96,0.85)';
};

/* ── Difficulty Ring (SVG donut) ──────────── */
const DifficultyRing = ({ easy, medium, hard, total }) => {
  const r = 52, stroke = 10;
  const circumference = 2 * Math.PI * r;
  const safeTotal = total || 1;
  const easyPct = easy / safeTotal;
  const medPct = medium / safeTotal;
  const hardPct = hard / safeTotal;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
      {/* Background ring */}
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      {/* Easy arc */}
      <circle cx="70" cy="70" r={r} fill="none" stroke="#6DBF8A" strokeWidth={stroke}
        strokeDasharray={`${easyPct * circumference} ${circumference}`}
        strokeDashoffset={0} strokeLinecap="round" />
      {/* Medium arc */}
      <circle cx="70" cy="70" r={r} fill="none" stroke="#D4A83C" strokeWidth={stroke}
        strokeDasharray={`${medPct * circumference} ${circumference}`}
        strokeDashoffset={-easyPct * circumference} strokeLinecap="round" />
      {/* Hard arc */}
      <circle cx="70" cy="70" r={r} fill="none" stroke="#C05A4A" strokeWidth={stroke}
        strokeDasharray={`${hardPct * circumference} ${circumference}`}
        strokeDashoffset={-(easyPct + medPct) * circumference} strokeLinecap="round" />
      {/* Center text */}
      <text x="70" y="66" textAnchor="middle" dominantBaseline="middle"
        fill="#E8C060" fontSize="26" fontWeight="bold" fontFamily="'Fira Code', monospace"
        style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}>
        {total}
      </text>
      <text x="70" y="86" textAnchor="middle" dominantBaseline="middle"
        fill="#6A5A3A" fontSize="10" fontFamily="monospace"
        style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}>
        Solved
      </text>
    </svg>
  );
};

/* ── Main Component ──────────────────────── */
const Profile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const displayUsername = username || (user ? user.username : 'Unknown Scribe');
  usePageTitle(`${displayUsername}'s Profile`);
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await client.get('/auth/profile');
        setProfileData(res.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const stats = useMemo(() => {
    if (!profileData) return { easy: 0, medium: 0, hard: 0, total: 0, battleCount: 0 };
    return {
      easy: profileData.solvedByDifficulty?.easy || 0,
      medium: profileData.solvedByDifficulty?.medium || 0,
      hard: profileData.solvedByDifficulty?.hard || 0,
      total: profileData.questionsSolved || 0,
      battleCount: profileData.battleCount || 0
    };
  }, [profileData]);

  // Build heatmap data
  const heatmapData = useMemo(() => {
    const days = getDaysInYear();
    const countMap = {};
    if (profileData?.submissionDates) {
      profileData.submissionDates.forEach(dateStr => {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().split('T')[0];
        countMap[key] = (countMap[key] || 0) + 1;
      });
    }
    return days.map(d => ({
      date: d,
      key: d.toISOString().split('T')[0],
      count: countMap[d.toISOString().split('T')[0]] || 0
    }));
  }, [profileData]);

  // Group heatmap into weeks (columns)
  const heatmapWeeks = useMemo(() => {
    const weeks = [];
    let currentWeek = [];
    // Pad first week so it starts on Sunday
    const firstDay = heatmapData[0]?.date.getDay() || 0;
    for (let i = 0; i < firstDay; i++) currentWeek.push(null);
    heatmapData.forEach(d => {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length) weeks.push(currentWeek);
    return weeks;
  }, [heatmapData]);

  const totalSubmissions = useMemo(() => {
    return heatmapData.reduce((sum, d) => sum + d.count, 0);
  }, [heatmapData]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) {
      alert('Image too large. Max 500KB.');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        await client.put('/auth/avatar', { avatar: base64 });
        setProfileData(prev => ({ ...prev, avatar: base64 }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setUploading(false);
    }
  };

  const avatar = profileData?.avatar;
  const memberSince = profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', background: '#0D0B09', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          style={{ fontSize: '2rem' }}>⚙</motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#0D0B09', position: 'relative', overflowX: 'hidden' }}>
      <SacredGeometryCanvas />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '90px 20px 60px' }}>

          {/* ── Top section: Avatar + Info + Ring ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '30px',
              background: 'rgba(13,11,9,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(184,144,42,0.15)', borderRadius: '18px',
              padding: '30px', marginBottom: '20px', flexWrap: 'wrap',
              position: 'relative', overflow: 'hidden'
            }}
          >
            {/* Gold accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #D4A83C, #E8C060, #D4A83C, transparent)' }} />

            {/* Avatar */}
            <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: avatar ? `url(${avatar}) center/cover` : 'linear-gradient(135deg, #B8902A, #E8C060)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: avatar ? '0' : '2.5rem', color: '#0D0B09', fontWeight: 'bold',
                fontFamily: "'Playfair Display', serif",
                boxShadow: '0 0 30px rgba(212,168,60,0.25)',
                border: '3px solid rgba(232,192,96,0.3)',
                overflow: 'hidden'
              }}>
                {!avatar && displayUsername.charAt(0).toUpperCase()}
              </div>

              {/* Camera overlay */}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'rgba(13,11,9,0.9)', border: '2px solid rgba(184,144,42,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem'
              }}>
                {uploading ? '⟳' : '📷'}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>

            {/* User info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{
                fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
                fontSize: '1.8rem', color: '#E8C060', margin: '0 0 4px',
                textShadow: '0 2px 15px rgba(212,168,60,0.2)'
              }}>
                {displayUsername}
              </h1>
              <p style={{ color: '#6A5A3A', fontFamily: 'monospace', fontSize: '0.8rem', margin: '0 0 12px' }}>
                {memberSince && `Member since ${memberSince}`}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(109,191,138,0.08)', border: '1px solid rgba(109,191,138,0.2)' }}>
                  <span style={{ color: '#6DBF8A', fontSize: '0.8rem', fontFamily: 'monospace' }}>🔥 {stats.total} solved</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(212,168,60,0.08)', border: '1px solid rgba(212,168,60,0.2)' }}>
                  <span style={{ color: '#D4A83C', fontSize: '0.8rem', fontFamily: 'monospace' }}>⚔ {stats.battleCount} battles</span>
                </div>
              </div>
            </div>

            {/* Difficulty Ring */}
            <div style={{ flexShrink: 0 }}>
              <DifficultyRing easy={stats.easy} medium={stats.medium} hard={stats.hard} total={stats.total} />
            </div>
          </motion.div>

          {/* ── Difficulty breakdown cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}
          >
            {[
              { label: 'Easy', value: stats.easy, color: '#6DBF8A', bg: 'rgba(109,191,138,0.06)', border: 'rgba(109,191,138,0.2)' },
              { label: 'Medium', value: stats.medium, color: '#D4A83C', bg: 'rgba(212,168,60,0.06)', border: 'rgba(212,168,60,0.2)' },
              { label: 'Hard', value: stats.hard, color: '#C05A4A', bg: 'rgba(192,90,74,0.06)', border: 'rgba(192,90,74,0.2)' },
            ].map((d, i) => (
              <div key={d.label} style={{
                background: d.bg, border: `1px solid ${d.border}`, borderRadius: '14px',
                padding: '20px', textAlign: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: d.color, fontFamily: "'Fira Code', monospace" }}>
                  {d.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: d.color, opacity: 0.7, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {d.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── Heatmap ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              background: 'rgba(13,11,9,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(184,144,42,0.12)', borderRadius: '16px',
              padding: '24px', marginBottom: '20px', overflowX: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4A83C', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                {totalSubmissions} submissions in the last year
              </h2>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#5A4A3A' }}>
                Less
                {[0, 1, 2, 3, 5].map((c, i) => (
                  <div key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', background: getHeatmapColor(c) }} />
                ))}
                More
              </div>
            </div>

            {/* Month labels */}
            <div style={{ display: 'flex', gap: '0px', marginBottom: '6px', paddingLeft: '30px' }}>
              {heatmapWeeks.map((_, wi) => {
                // Show month label at first week of each month
                const firstCell = heatmapWeeks[wi]?.find(c => c !== null);
                if (!firstCell) return null;
                const prevWeek = wi > 0 ? heatmapWeeks[wi - 1]?.find(c => c !== null) : null;
                if (prevWeek && prevWeek.date.getMonth() === firstCell.date.getMonth()) return null;
                return (
                  <div key={wi} style={{
                    position: 'relative', left: `${wi * 15}px`,
                    color: '#5A4A3A', fontSize: '0.65rem', fontFamily: 'monospace',
                    position: 'absolute'
                  }}>
                    {MONTHS[firstCell.date.getMonth()]}
                  </div>
                );
              }).filter(Boolean)}
            </div>

            <div style={{ display: 'flex', gap: '2px', marginTop: '18px' }}>
              {/* Day labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '6px', justifyContent: 'flex-start' }}>
                {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                  <div key={i} style={{ height: '13px', fontSize: '0.6rem', color: '#4A3A2A', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Grid */}
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {Array.from({ length: 7 }).map((_, di) => {
                    const cell = week[di];
                    if (!cell) return <div key={di} style={{ width: '13px', height: '13px' }} />;
                    return (
                      <div key={di}
                        title={`${cell.key}: ${cell.count} submission${cell.count !== 1 ? 's' : ''}`}
                        style={{
                          width: '13px', height: '13px', borderRadius: '2px',
                          background: getHeatmapColor(cell.count),
                          border: '1px solid rgba(0,0,0,0.1)',
                          cursor: 'default',
                          transition: 'transform 0.1s ease'
                        }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.3)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Badges ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              background: 'rgba(13,11,9,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(184,144,42,0.12)', borderRadius: '16px',
              padding: '24px'
            }}
          >
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4A83C', marginBottom: '16px', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 16px' }}>
              Relics of Honor
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { icon: '🔥', name: 'First Flame', desc: 'Solve your first problem', earned: stats.total >= 1 },
                { icon: '⚔️', name: 'Arena Warrior', desc: 'Fight your first battle', earned: stats.battleCount >= 1 },
                { icon: '🟢', name: 'Easy Mastery', desc: 'Solve 10 Easy problems', earned: stats.easy >= 10 },
                { icon: '🟡', name: 'Medium Mastery', desc: 'Solve 10 Medium problems', earned: stats.medium >= 10 },
                { icon: '🔴', name: 'Hard Mastery', desc: 'Solve 5 Hard problems', earned: stats.hard >= 5 },
                { icon: '📖', name: 'The Century', desc: 'Solve 100 problems', earned: stats.total >= 100 },
              ].map((badge, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', borderRadius: '12px',
                  background: badge.earned ? 'rgba(184,144,42,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${badge.earned ? 'rgba(184,144,42,0.2)' : 'rgba(255,255,255,0.04)'}`,
                  flex: '1 1 260px',
                  opacity: badge.earned ? 1 : 0.4,
                  transition: 'opacity 0.3s ease'
                }}>
                  <span style={{ fontSize: '1.5rem', filter: badge.earned ? 'none' : 'grayscale(1)' }}>{badge.icon}</span>
                  <div>
                    <div style={{ color: badge.earned ? '#E0D0A0' : '#4A3A2A', fontSize: '0.88rem', fontWeight: 600 }}>{badge.name}</div>
                    <div style={{ color: '#4A3A2A', fontSize: '0.7rem' }}>{badge.desc}</div>
                  </div>
                  {badge.earned && (
                    <span style={{ marginLeft: 'auto', color: '#6DBF8A', fontSize: '0.75rem' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
