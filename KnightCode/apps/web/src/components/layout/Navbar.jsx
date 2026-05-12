import React, { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const navLinkClassName = ({ isActive }) => `NavLinks${isActive ? ' active' : ''}`;

const NAV_ITEMS = [
    { to: '/home', label: 'Home', icon: '🏠' },
    { to: '/sanctum', label: 'Sanctum', icon: '📜' },
    { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { to: '/arena', label: 'Arena', icon: '⚔️' },
    { to: '/astraverse', label: 'Astraverse', icon: '✨' },
];

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
        <header style={{ 
            position: 'fixed', top: 0, width: '100%', padding: '0 2rem', zIndex: 100, 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            height: '64px',
            background: 'linear-gradient(to bottom, rgba(13,11,9,0.95) 0%, rgba(13,11,9,0.85) 70%, rgba(13,11,9,0) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(184,144,42,0.08)'
          }}>
            {/* Logo */}
            <motion.div 
                whileHover={{ scale: 1.03 }}
                onClick={() => navigate('/home')}
                style={{ 
                    fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontStyle: 'italic', 
                    fontWeight: 600, color: 'var(--gold-bright)', cursor: 'pointer',
                    textShadow: '0 2px 15px rgba(232,192,96,0.3)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}
            >
                <span style={{ fontSize: '1.2rem' }}>♞</span>
                KnightCode
            </motion.div>

            {/* Desktop nav links */}
            <nav style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {NAV_ITEMS.map(item => (
                    <NavLink 
                        key={item.to}
                        className={navLinkClassName} 
                        to={item.to} 
                        style={({ isActive }) => ({ 
                            padding: '8px 16px', 
                            fontSize: '0.8rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1.5px',
                            borderRadius: '6px',
                            transition: 'all 0.25s ease',
                            position: 'relative',
                            color: isActive ? 'var(--gold-bright)' : 'var(--gold-mid)',
                            textDecoration: 'none',
                            fontFamily: 'var(--font-ui)',
                            fontWeight: isActive ? 600 : 400,
                        })}
                    >
                        {item.label}
                        {location.pathname === item.to && (
                            <motion.div
                                layoutId="nav-indicator"
                                style={{
                                    position: 'absolute', bottom: '-2px', left: '20%', right: '20%',
                                    height: '2px',
                                    background: 'linear-gradient(90deg, transparent, var(--gold-bright), transparent)',
                                    borderRadius: '1px'
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Right side — user/auth */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div 
                      onClick={() => navigate('/profile')}
                      style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '4px 14px 4px 4px', borderRadius: '20px',
                      background: 'rgba(184,144,42,0.08)',
                      border: '1px solid rgba(184,144,42,0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,144,42,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(184,144,42,0.08)'}
                  >
                      <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--gold-dim), var(--gold-bright))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', color: '#0D0B09', fontWeight: 'bold',
                          fontFamily: 'var(--font-ui)'
                      }}>
                          {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ 
                          fontFamily: 'var(--font-ui)', color: 'var(--gold-mid)', 
                          fontSize: '0.85rem', letterSpacing: '0.5px' 
                      }}>
                        {user.username}
                      </span>
                  </div>
                  <button 
                      className="ghost-button" 
                      onClick={logout} 
                      style={{ 
                          padding: '6px 14px', fontSize: '0.75rem', textTransform: 'uppercase', 
                          letterSpacing: '1px', borderRadius: '6px'
                      }}
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                      className="ghost-button" 
                      onClick={() => navigate('/login')} 
                      style={{ padding: '6px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '6px' }}
                  >
                    Sign In
                  </button>
                  <button 
                      className="gold-button" 
                      onClick={() => navigate('/register')} 
                      style={{ padding: '6px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '6px' }}
                  >
                    Join Ranks
                  </button>
                </div>
              )}
            </div>
          </header>
        </>
    );
};

export default Navbar;
