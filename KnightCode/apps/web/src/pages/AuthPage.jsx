import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = ({ mode = "login" }) => {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");
    setError('');
    setLoading(true);
    try {
      console.log("Attempting authentication...", isLogin ? "Login" : "Register");
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password);
      }
      console.log("Authentication successful");
      navigate('/');
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.response?.data?.message || err.message || 'Authentication failed. The ancient ones are displeased.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="codex-card auth-page__card">
        <h2 className="auth-page__title">
          {isLogin ? 'Enter the Sanctum' : 'Join the Ranks'}
        </h2>

        {error && (
          <div className="auth-page__error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-page__form">
          {!isLogin && (
            <div className="auth-page__field">
              <label className="auth-page__label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="auth-page__input"
              />
            </div>
          )}

          <div className="auth-page__field">
            <label className="auth-page__label">Email Parchment</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-page__input"
            />
          </div>

          <div className="auth-page__field">
            <label className="auth-page__label">Secret Rune (Password)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-page__input"
            />
          </div>

          <button type="submit" className="gold-button auth-page__submit" disabled={loading}>
            {loading ? 'Consulting the Archives...' : (isLogin ? 'Authenticate' : 'Forge Account')}
          </button>
        </form>

        <div className="auth-page__toggle-wrap">
          <button 
            type="button" 
            className="ghost-button auth-page__toggle"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'New to the Arena? Register here' : 'Already have an account? Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
