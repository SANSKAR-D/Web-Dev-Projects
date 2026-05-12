import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar.jsx';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';
import client from '../api/client.js';

const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

const RANK_STYLES = {
    0: { glyph: '♛', color: '#FFD700', shadow: '0 0 30px rgba(255, 215, 0, 0.6)', label: '1st', bg: 'rgba(255, 215, 0, 0.08)', border: 'rgba(255, 215, 0, 0.5)' },
    1: { glyph: '♜', color: '#C0C0C0', shadow: '0 0 20px rgba(192, 192, 192, 0.4)', label: '2nd', bg: 'rgba(192, 192, 192, 0.06)', border: 'rgba(192, 192, 192, 0.4)' },
    2: { glyph: '♞', color: '#CD7F32', shadow: '0 0 15px rgba(205, 127, 50, 0.4)', label: '3rd', bg: 'rgba(205, 127, 50, 0.06)', border: 'rgba(205, 127, 50, 0.4)' },
};

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [nextRefreshIn, setNextRefreshIn] = useState('');

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await client.get('/problems/leaderboard');
            setLeaders(res.data);
            const now = Date.now();
            setLastRefreshed(now);
            localStorage.setItem('kc_leaderboard_data', JSON.stringify(res.data));
            localStorage.setItem('kc_leaderboard_ts', now.toString());
        } catch (err) {
            setError('Failed to load leaderboard.');
            // Try to load from cache
            const cached = localStorage.getItem('kc_leaderboard_data');
            if (cached) setLeaders(JSON.parse(cached));
        } finally {
            setLoading(false);
        }
    }, []);

    // On mount, check if we have a fresh cache (< 1 hour old)
    useEffect(() => {
        const cachedTs = localStorage.getItem('kc_leaderboard_ts');
        const cachedData = localStorage.getItem('kc_leaderboard_data');
        const now = Date.now();

        if (cachedTs && cachedData && (now - parseInt(cachedTs)) < REFRESH_INTERVAL) {
            setLeaders(JSON.parse(cachedData));
            setLastRefreshed(parseInt(cachedTs));
            setLoading(false);
        } else {
            fetchLeaderboard();
        }
    }, [fetchLeaderboard]);

    // Auto-refresh every hour
    useEffect(() => {
        const interval = setInterval(() => {
            fetchLeaderboard();
        }, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchLeaderboard]);

    // Countdown timer to next refresh
    useEffect(() => {
        if (!lastRefreshed) return;
        const tick = () => {
            const nextTime = lastRefreshed + REFRESH_INTERVAL;
            const diff = Math.max(0, nextTime - Date.now());
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setNextRefreshIn(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [lastRefreshed]);

    const getRankStyle = (index) => RANK_STYLES[index] || { glyph: `#${index + 1}`, color: '#8A7A5A', shadow: 'none', label: `${index + 1}th`, bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.07)' };

    return (
        <div style={{ minHeight: '100vh', width: '100vw', background: '#0D0B09', position: 'relative', overflowX: 'hidden' }}>
            <SacredGeometryCanvas />

            {/* Atmospheric background layer */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
                {/* Gold glow — top center (crowning light) */}
                <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,60,0.12) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'lbOrb1 8s ease-in-out infinite alternate' }} />
                {/* Silver glow — bottom left */}
                <div style={{ position: 'absolute', bottom: '10%', left: '0%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,192,192,0.06) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'lbOrb2 11s ease-in-out infinite alternate' }} />
                {/* Bronze glow — bottom right */}
                <div style={{ position: 'absolute', bottom: '5%', right: '-5%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(205,127,50,0.07) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'lbOrb3 9s ease-in-out infinite alternate' }} />

                {/* Subtle dot grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(184,144,42,0.08) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />

                {/* Edge vignette */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />

                {/* Floating rune symbols */}
                {['♛','♜','♞','✦','⚔','⚜','✧','♟'].map((rune, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        fontSize: `${12 + (i % 3) * 6}px`,
                        color: i % 3 === 0 ? 'rgba(212,168,60,0.12)' : i % 3 === 1 ? 'rgba(192,192,192,0.10)' : 'rgba(205,127,50,0.10)',
                        left: `${(i * 13.7 + 5) % 95}%`,
                        top: `${(i * 17.3 + 10) % 85}%`,
                        animation: `lbFloat${(i % 3) + 1} ${8 + i * 1.5}s ease-in-out infinite`,
                        userSelect: 'none',
                        textShadow: `0 0 20px currentColor`
                    }}>
                        {rune}
                    </div>
                ))}

                {/* Horizontal light beam at top */}
                <div style={{
                    position: 'absolute', top: '80px', left: 0, right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(212,168,60,0.15) 20%, rgba(212,168,60,0.3) 50%, rgba(212,168,60,0.15) 80%, transparent 100%)'
                }} />
            </div>

            <style>{`
                @keyframes lbOrb1 { from { opacity: 0.8; transform: translateX(-50%) scale(1); } to { opacity: 1; transform: translateX(-50%) scale(1.1); } }
                @keyframes lbOrb2 { from { transform: translate(0,0); } to { transform: translate(20px,-30px); } }
                @keyframes lbOrb3 { from { transform: translate(0,0); } to { transform: translate(-20px,-20px); } }
                @keyframes lbFloat1 { 0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.6; } 50% { transform: translateY(-25px) rotate(10deg); opacity: 1; } }
                @keyframes lbFloat2 { 0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.5; } 50% { transform: translateY(-40px) rotate(-8deg); opacity: 0.9; } }
                @keyframes lbFloat3 { 0%,100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-15px); opacity: 0.8; } }
            `}</style>

            <div style={{ position: 'relative', zIndex: 10 }}>
                <Navbar />

                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 20px 60px' }}>
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{ textAlign: 'center', marginBottom: '40px' }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚔️</div>
                        <h1 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            color: '#D4A83C',
                            margin: '0 0 8px',
                            letterSpacing: '2px',
                            textShadow: '0 0 30px rgba(212, 168, 60, 0.4)'
                        }}>
                            Hall of Knights
                        </h1>
                        <p style={{ color: '#8A7A5A', fontFamily: "'Fira Code', monospace", fontSize: '0.9rem', margin: 0 }}>
                            Top warriors ranked by problems conquered
                        </p>

                        {/* Refresh info */}
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#5A4A3A', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                Next refresh in: <span style={{ color: '#D4A83C' }}>{nextRefreshIn}</span>
                            </span>
                            <button
                                onClick={fetchLeaderboard}
                                disabled={loading}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(212, 168, 60, 0.4)',
                                    color: '#D4A83C',
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace',
                                    opacity: loading ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {loading ? '↻ Refreshing...' : '↻ Refresh Now'}
                            </button>
                        </div>
                    </motion.div>

                    {/* Top 3 Podium */}
                    {!loading && leaders.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', marginBottom: '40px' }}
                        >
                            {/* Silver - 2nd place */}
                            {leaders[1] && (
                                <PodiumCard user={leaders[1]} rank={1} delay={0.1} />
                            )}
                            {/* Gold - 1st place */}
                            {leaders[0] && (
                                <PodiumCard user={leaders[0]} rank={0} delay={0} isTop />
                            )}
                            {/* Bronze - 3rd place */}
                            {leaders[2] && (
                                <PodiumCard user={leaders[2]} rank={2} delay={0.2} />
                            )}
                        </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{ textAlign: 'center', color: '#C05A4A', marginBottom: '20px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            ⚠ {error} {leaders.length > 0 && '(Showing cached data)'}
                        </div>
                    )}

                    {/* Full List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonRow key={i} delay={i * 0.05} />
                            ))
                        ) : leaders.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ textAlign: 'center', color: '#5A4A3A', padding: '60px 20px', fontFamily: 'monospace' }}
                            >
                                No knights have entered the arena yet. Be the first!
                            </motion.div>
                        ) : (
                            <AnimatePresence>
                                {leaders.map((user, i) => {
                                    const rs = getRankStyle(i);
                                    return (
                                        <motion.div
                                            key={user._id || user.username}
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: i * 0.05 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '16px 20px',
                                                background: rs.bg,
                                                border: `1px solid ${rs.border}`,
                                                borderRadius: '12px',
                                                boxShadow: i < 3 ? rs.shadow : 'none',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                cursor: 'default'
                                            }}
                                            whileHover={{ transform: 'translateX(6px)' }}
                                        >
                                            {/* Rank Badge */}
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                background: i < 3 ? `radial-gradient(circle, ${rs.color}22, ${rs.color}05)` : 'rgba(255,255,255,0.04)',
                                                border: `2px solid ${rs.color}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: i < 3 ? '1.4rem' : '0.85rem',
                                                color: rs.color,
                                                fontWeight: 'bold',
                                                flexShrink: 0,
                                                fontFamily: 'monospace',
                                                textShadow: i < 3 ? `0 0 10px ${rs.color}` : 'none'
                                            }}>
                                                {i < 3 ? rs.glyph : `#${i + 1}`}
                                            </div>

                                            {/* Username */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontFamily: "'Playfair Display', serif",
                                                    fontSize: i < 3 ? '1.15rem' : '1rem',
                                                    color: i < 3 ? rs.color : '#D4C8A0',
                                                    fontWeight: i < 3 ? 'bold' : 'normal',
                                                    textShadow: i < 3 ? `0 0 10px ${rs.color}55` : 'none'
                                                }}>
                                                    {user.username}
                                                </div>
                                                {i < 3 && (
                                                    <div style={{ fontSize: '0.75rem', color: rs.color, opacity: 0.7, fontFamily: 'monospace', marginTop: '2px' }}>
                                                        {rs.label} Place
                                                    </div>
                                                )}
                                            </div>

                                            {/* Score */}
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{
                                                    fontSize: i < 3 ? '1.6rem' : '1.2rem',
                                                    fontWeight: 'bold',
                                                    color: rs.color,
                                                    fontFamily: "'Fira Code', monospace",
                                                    textShadow: i < 3 ? `0 0 15px ${rs.color}` : 'none'
                                                }}>
                                                    {user.questionsSolved || 0}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#5A4A3A', fontFamily: 'monospace' }}>
                                                    solved
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Footer note */}
                    {!loading && leaders.length > 0 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            style={{ textAlign: 'center', color: '#3A2E1A', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '30px' }}
                        >
                            Showing top {leaders.length} knight{leaders.length !== 1 ? 's' : ''} · Refreshes every hour
                        </motion.p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Podium card for top 3
const PodiumCard = ({ user, rank, delay, isTop }) => {
    const rs = RANK_STYLES[rank];
    const heights = { 0: '130px', 1: '90px', 2: '70px' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                flex: isTop ? '0 0 160px' : '0 0 130px'
            }}
        >
            <div style={{ fontSize: isTop ? '2.5rem' : '1.8rem' }}>{rs.glyph}</div>
            <div style={{
                fontFamily: "'Playfair Display', serif",
                color: rs.color,
                fontWeight: 'bold',
                fontSize: isTop ? '1rem' : '0.9rem',
                textAlign: 'center',
                textShadow: `0 0 15px ${rs.color}66`,
                wordBreak: 'break-word'
            }}>
                {user.username}
            </div>
            <div style={{
                fontSize: isTop ? '1.8rem' : '1.4rem',
                color: rs.color,
                fontFamily: "'Fira Code', monospace",
                fontWeight: 'bold',
                textShadow: `0 0 20px ${rs.color}`
            }}>
                {user.questionsSolved || 0}
            </div>
            {/* Podium stand */}
            <div style={{
                width: '100%',
                height: heights[rank],
                background: `linear-gradient(to bottom, ${rs.color}22, ${rs.color}08)`,
                border: `1px solid ${rs.border}`,
                borderRadius: '8px 8px 0 0',
                boxShadow: rs.shadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                color: rs.color,
                fontFamily: 'monospace',
                fontWeight: 'bold'
            }}>
                {rs.label}
            </div>
        </motion.div>
    );
};

// Skeleton loading row
const SkeletonRow = ({ delay }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay }}
        style={{
            height: '72px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px'
        }}
    />
);

export default Leaderboard;