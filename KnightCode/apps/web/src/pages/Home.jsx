// src/pages/Home.jsx
import React, { Suspense, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { motion } from 'framer-motion';
import './Home.css';

// Lazy load the 3D canvas so Three.js bundles are excluded from the main chunk
const Home3DCanvas = React.lazy(() => import('../components/three/Home3DCanvas.jsx'));

const PageContent = ({ user, navigate, logout }) => {
  return (
    <>
      {/* Page 1 - Title */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="home-section"
      >
        <h1 className="home-title">
          Sharpen thy blade.<br/>
          <span>The arena awaits.</span>
        </h1>
        
        <motion.div 
          animate={{ y: [0, 15, 0] }} 
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="home-descend"
        >
          ↓ DESCEND ↓
        </motion.div>
      </motion.div>

      {/* Page 2 - Journey/Transition */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="home-section-quote"
      >
         <p className="home-quote">
           "Only those who master the ancient <span style={{ color: 'var(--gold-mid)', fontStyle: 'italic' }}>Algorithms</span> and <span style={{ color: 'var(--gold-mid)', fontStyle: 'italic' }}>Data Structures</span> shall engrave their names in the Hall of Scribes."
         </p>
      </motion.div>

      {/* Page 3 - Action */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="home-section"
      >
        <div className="home-vignette" />

        {user ? (
          <>
            <h2 className="home-footer-title">
              The Arena Awaits
            </h2>
            <div className="home-button-group">
              <button 
                className="gold-button" 
                onClick={() => navigate('/sanctum')} 
                style={{ 
                  fontSize: '1.2rem', 
                  padding: '1.2rem 4.5rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '4px', 
                  fontWeight: 600, 
                  boxShadow: '0 0 40px rgba(212,168,60,0.5)', 
                  borderRadius: '4px', 
                  border: 'none' 
                }}
              >
                Enter Battleground
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="home-footer-title">
              Are you ready?
            </h2>
            <div className="home-button-group">
              <button 
                className="gold-button" 
                onClick={() => navigate('/login')} 
                style={{ 
                  fontSize: '1.2rem', 
                  padding: '1.2rem 3.5rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '3px', 
                  fontWeight: 600, 
                  boxShadow: '0 0 40px rgba(212,168,60,0.5)', 
                  borderRadius: '4px', 
                  border: 'none' 
                }}
              >
                Enter Sanctum
              </button>
              <button 
                className="ghost-button" 
                onClick={() => navigate('/register')} 
                style={{ 
                  fontSize: '1.2rem', 
                  padding: '1.2rem 3.5rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '3px', 
                  fontWeight: 600, 
                  border: '1px solid rgba(232,192,96,1)', 
                  borderRadius: '4px', 
                  background: 'rgba(13,11,9,0.9)', 
                  backdropFilter: 'blur(16px)', 
                  WebkitBackdropFilter: 'blur(16px)', 
                  color: 'var(--gold-bright)', 
                  boxShadow: '0 0 30px rgba(13,11,9,0.9), inset 0 0 20px rgba(232,192,96,0.15)' 
                }}
              >
                Join Ranks
              </button>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
};

const SanctumMain = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="sanctum-home" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Premium KnightCode Topbar - Fixed above canvas */}
      <header className="home-header">
        <div className="home-logo">
          KnightCode
        </div>
        <div className="home-nav-actions">
          {user ? (
            <>
              <span style={{ fontFamily: 'var(--font-ui)', color: 'var(--gold-mid)', fontSize: '1.1rem', letterSpacing: '1px' }}>
                {user.username}
              </span>
              <button className="ghost-button" onClick={logout} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <button className="ghost-button" onClick={() => navigate('/login')} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Enter Sanctum
              </button>
              <button className="gold-button" onClick={() => navigate('/register')} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Join Ranks
              </button>
            </>
          )}
        </div>
      </header>

      {isMobile ? (
        <div className="mobile-scroll-container">
          <div className="mobile-glow-bg" />
          <PageContent user={user} navigate={navigate} logout={logout} />
        </div>
      ) : (
        <Suspense fallback={<div className="canvas-fallback-loader">Unearthing Artifacts...</div>}>
          <Home3DCanvas>
            <PageContent user={user} navigate={navigate} logout={logout} />
          </Home3DCanvas>
        </Suspense>
      )}
    </div>
  );
};

export default SanctumMain;