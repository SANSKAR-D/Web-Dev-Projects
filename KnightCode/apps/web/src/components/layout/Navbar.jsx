import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { motion } from 'framer-motion';

const navLinkClassName = ({ isActive }) => `NavLinks${isActive ? ' active' : ''}`;

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <header style={{ 
            position: 'fixed', top: 0, width: '100%', padding: '1.5rem 3rem', zIndex: 100, 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(13,11,9,0.9) 0%, rgba(13,11,9,0) 100%)'
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 600, color: 'var(--gold-bright)', pointerEvents: 'auto', textShadow: '0 2px 15px rgba(232,192,96,0.3)' }}>
              KnightCode
            </div>
            <div style={{ pointerEvents: 'auto' }}>
              <NavLink className={navLinkClassName} to="/home" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Home    
              </NavLink>
              <NavLink className={navLinkClassName} to="/chakras" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Chakras    
              </NavLink>
              <NavLink className={navLinkClassName} to="/sanctum" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Sanctum   
              </NavLink>
              <NavLink className={navLinkClassName} to="/leaderboard" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Leaderboard    
              </NavLink>
              <NavLink className={navLinkClassName} to="/arena" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Arena   
              </NavLink>
              <NavLink className={navLinkClassName} to="/astraverse" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Astraverse 
              </NavLink>
            </div>
            <div style={{ pointerEvents: 'auto' }}>
              {user ? (
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-ui)', color: 'var(--gold-mid)', fontSize: '1.1rem', letterSpacing: '1px' }}>
                    {user.username}
                  </span>
                  <button className="ghost-button" onClick={logout} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Log Out
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <button className="ghost-button" onClick={() => navigate('/login')} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Enter Sanctum
                  </button>
                  <button className="gold-button" onClick={() => navigate('/register')} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Join Ranks
                  </button>
                </div>
              )}
            </div>
          </header>
          </div>
    );
};

export default Navbar;

