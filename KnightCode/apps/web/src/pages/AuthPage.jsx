import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';

const AuthPage = ({ mode = "login" }) => {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. The ancient ones are displeased.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh'
    }}>
      <div className="codex-card" style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '2rem', 
          fontStyle: 'italic',
          fontSize: '2.5rem'
        }}>
          {isLogin ? 'Enter the Sanctum' : 'Join the Ranks'}
        </h2>

        {error && (
          <div style={{
            background: 'var(--error)',
            color: 'var(--bg)',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)' }}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--gold-dim)',
                  color: 'var(--text)',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-code)'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>Email Parchment</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--gold-dim)',
                color: 'var(--text)',
                padding: '0.75rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-code)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>Secret Rune (Password)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--gold-dim)',
                color: 'var(--text)',
                padding: '0.75rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-code)'
              }}
            />
          </div>

          <button type="submit" className="gold-button" style={{ marginTop: '1rem' }}>
            {isLogin ? 'Authenticate' : 'Forge Account'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            type="button" 
            className="ghost-button" 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ border: 'none', padding: '0.5rem' }}
          >
            {isLogin ? 'New to the Arena? Register here' : 'Already have an account? Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
