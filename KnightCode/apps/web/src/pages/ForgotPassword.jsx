import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import usePageTitle from '../hooks/usePageTitle.js';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';
import client from '../api/client.js';
import './AuthPage.css';

const ForgotPassword = () => {
  usePageTitle('Forgot Password');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email.');
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
        <div className="auth-page__icon">🔑</div>
        <h2 className="auth-page__title">Recover Thy Password</h2>
        <p className="auth-page__subtitle">
          Enter your email and we shall send you a sacred link to reset your password.
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

        <AnimatePresence mode="wait">
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(109, 191, 138, 0.1)',
                color: '#6DBF8A',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(109, 191, 138, 0.25)',
                marginBottom: '1.5rem',
                textAlign: 'center',
                fontWeight: 500,
                fontSize: '0.88rem',
                fontFamily: 'var(--font-body)',
              }}
            >
              ✓ {success}
            </motion.div>
          )}
        </AnimatePresence>

        {!success && (
          <form onSubmit={handleSubmit} className="auth-page__form">
            <div className="auth-page__field">
              <label className="auth-page__label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="knight@arena.com"
                className="auth-page__input"
              />
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
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        <div className="auth-page__divider">
          <span>Remember your password?</span>
        </div>

        <div className="auth-page__toggle-wrap">
          <button
            type="button"
            className="ghost-button auth-page__toggle"
            onClick={() => navigate('/login')}
          >
            ← Back to Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
