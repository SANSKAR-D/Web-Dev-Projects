import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import usePageTitle from '../hooks/usePageTitle.js';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';
import client from '../api/client.js';
import './AuthPage.css';

const ResetPassword = () => {
  usePageTitle('Reset Password');
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await client.post('/auth/reset-password', { token, password });
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
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
        <div className="auth-page__icon">🛡️</div>
        <h2 className="auth-page__title">Forge New Password</h2>
        <p className="auth-page__subtitle">
          Enter your new password to regain access to your account.
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

        {!success ? (
          <form onSubmit={handleSubmit} className="auth-page__form">
            <div className="auth-page__field">
              <label className="auth-page__label">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="auth-page__input"
              />
            </div>

            <div className="auth-page__field">
              <label className="auth-page__label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
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
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        ) : (
          <div className="auth-page__toggle-wrap" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="auth-page__submit"
              onClick={() => navigate('/login')}
            >
              ← Proceed to Sign In
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
