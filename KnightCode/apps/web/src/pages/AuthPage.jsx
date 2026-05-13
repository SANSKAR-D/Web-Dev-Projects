import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import usePageTitle from '../hooks/usePageTitle.js';
import './AuthPage.css';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';

const AuthPage = ({ mode = "login" }) => {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  usePageTitle(isLogin ? 'Sign In' : 'Register');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password);
      }
      navigate('/sanctum');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. The ancient ones are displeased.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SacredGeometryCanvas />
      <motion.div 
        className="auth-page__card"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="auth-page__icon">
          {isLogin ? '⚔️' : '🛡️'}
        </div>
        <h2 className="auth-page__title">
          {isLogin ? 'Enter the Battlefield' : 'Join the Ranks'}
        </h2>
        <p className="auth-page__subtitle">
          {isLogin ? 'Welcome back, warrior. Prove your identity.' : 'Forge your legend in the ancient arena.'}
        </p>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              className="auth-page__error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="auth-page__form">
          <AnimatePresence>
            {!isLogin && (
              <motion.div 
                className="auth-page__field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="auth-page__label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="Your warrior name"
                  className="auth-page__input"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="auth-page__field">
            <label className="auth-page__label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="knight@arena.com"
              className="auth-page__input"
            />
          </div>

          <div className="auth-page__field">
            <label className="auth-page__label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="auth-page__input"
            />
            {isLogin && (
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--gold-mid, #B8902A)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'right',
                  padding: '4px 0 0',
                  fontFamily: 'var(--font-body)',
                  opacity: 0.8,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.8'}
              >
                Forgot Password?
              </button>
            )}
          </div>

          <button type="submit" className="auth-page__submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >
                  ⚙
                </motion.span>
                {isLogin ? 'Authenticating...' : 'Forging Account...'}
              </span>
            ) : (
              isLogin ? 'Authenticate' : 'Forge Account'
            )}
          </button>
        </form>

        <div className="auth-page__divider">
          <span>{isLogin ? 'New here?' : 'Already a knight?'}</span>
        </div>

        <div className="auth-page__toggle-wrap">
          <button 
            type="button" 
            className="ghost-button auth-page__toggle"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Create an Account →' : '← Sign In Instead'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
