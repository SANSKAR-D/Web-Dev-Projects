import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  
  // Display the profile of the parameterized user or fallback to logged-in user
  const displayUsername = username || (user ? user.username : 'Unknown Scribe');

  return (
    <div className="profile-page">
      <header className="profile-header codex-card">
        <h1 className="profile-title">Sanctum of {displayUsername}</h1>
        <div className="profile-ratings">
          <span>⚔ DSA 1420</span>
          <span>⚔ CP 1680</span>
          <span>⚔ Interview 1310</span>
        </div>
      </header>
      
      <main className="profile-grid">
        <section className="profile-heatmap codex-card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-mid)', marginBottom: '1rem' }}>Chronicle of Submissions</h2>
          <div className="mock-heatmap">
            {/* Mock heatmap grid */}
            {Array.from({ length: 150 }).map((_, i) => (
              <div 
                key={i} 
                className="heatmap-cell" 
                style={{ opacity: Math.random() * 0.8 + 0.1 }}
              />
            ))}
          </div>
        </section>

        <section className="profile-badges codex-card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-mid)', marginBottom: '1rem' }}>Relics of Honor</h2>
          <div className="badge-list">
            <span className="badge">🔥 First Flame</span>
            <span className="badge">⏳ The Weekly Vigil</span>
            <span className="badge">📖 The Century</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;
