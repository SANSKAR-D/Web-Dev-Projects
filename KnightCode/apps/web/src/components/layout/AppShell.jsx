import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

const AppShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <nav style={{
        width: '250px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--gold-dim)',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--gold-bright)' }}>
            ⚔ KnightCode
          </h2>
        </div>
        
        <Link to="/" style={{ padding: '0.5rem', fontFamily: 'var(--font-ui)', fontSize: '1.2rem' }}>Sanctum</Link>
        {!user ? (
          <>
            <Link to="/login" style={{ padding: '0.5rem', fontFamily: 'var(--font-ui)', fontSize: '1.2rem' }}>Login</Link>
            <Link to="/register" style={{ padding: '0.5rem', fontFamily: 'var(--font-ui)', fontSize: '1.2rem' }}>Register</Link>
          </>
        ) : (
          <button onClick={handleLogout} className="ghost-button" style={{ marginTop: 'auto', border: 'none', textAlign: 'left', padding: '0.5rem' }}>Logout</button>
        )}
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative' }}>
        <header style={{
          height: '60px',
          borderBottom: '1px solid var(--gold-dim)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 2rem',
          background: 'rgba(13, 11, 9, 0.8)',
          backdropFilter: 'blur(8px)'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>The Archives</span>
          {user && <span style={{ marginLeft: 'auto', color: 'var(--gold-mid)' }}>Signed in as {user.username || user.email}</span>}
        </header>

        <section style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AppShell;
