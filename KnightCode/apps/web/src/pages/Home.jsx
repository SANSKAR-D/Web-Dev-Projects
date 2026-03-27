// src/pages/Home.jsx
import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll, Html, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import AncientModel from '../components/three/AncientModel.jsx';
import './Home.css';

const SanctumMain = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="sanctum-home" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Premium KnightCode Topbar - Fixed above canvas */}
      <header style={{ 
        position: 'fixed', top: 0, width: '100%', padding: '1.5rem 3rem', zIndex: 100, 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(13,11,9,0.9) 0%, rgba(13,11,9,0) 100%)'
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 600, color: 'var(--gold-bright)', pointerEvents: 'auto', textShadow: '0 2px 15px rgba(232,192,96,0.3)' }}>
          KnightCode
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

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
        {/* Ancient Codex lighting for PBR Materials */}
        <ambientLight intensity={2} color="#F0E0B0" />
        <directionalLight position={[5, 10, 5]} intensity={3} color="#E8C060" />
        <directionalLight position={[-5, 5, -5]} intensity={1} color="#8B4513" />
        <Environment preset="sunset" />

        <Suspense fallback={<Html center><div style={{ color: 'var(--gold-bright)', fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', width: '300px', textAlign: 'center' }}>Unearthing Artifacts...</div></Html>}>
          <ScrollControls pages={3} damping={0.25} distance={1.2}>
            {/* The 3D model that animates on scroll */}
            <AncientModel />

            {/* The HTML overlay that scrolls with the page */}
            <Scroll html style={{ width: '100vw' }}>
              
              {/* Page 1 - Title */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <h1 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontStyle: 'italic', 
                  fontSize: '6rem', 
                  color: 'var(--gold-bright)',
                  textShadow: '0 4px 25px rgba(0,0,0,0.9)',
                  textAlign: 'center',
                  lineHeight: '1.05',
                  margin: 0
                }}>
                  Sharpen thy blade.<br/>
                  <span style={{ color: 'var(--text)' }}>The arena awaits.</span>
                </h1>
                
                <motion.div 
                  animate={{ y: [0, 15, 0] }} 
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  style={{ position: 'absolute', bottom: '8%', color: 'var(--gold-dim)', opacity: 0.6, fontSize: '1rem', fontFamily: 'var(--font-ui)', letterSpacing: '3px' }}
                >
                  ↓ DESCEND ↓
                </motion.div>
              </motion.div>

              {/* Page 2 - Journey/Transition */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'left', justifyContent: 'left' }}
              >
                 <p style={{
                   fontFamily: 'var(--font-body)',
                   fontSize: '2.5rem',
                   color: 'var(--text)',
                   textShadow: '0 4px 20px rgba(0,0,0,0.9)',
                   maxWidth: '800px',
                   textAlign: 'left',
                   lineHeight: '1.4',
                   paddingLeft: '2rem',
                   opacity: 0.95
                 }}>
                   "Only those who master the ancient <span style={{ color: 'var(--gold-mid)', fontStyle: 'italic' }}>Algorithms</span> and <span style={{ color: 'var(--gold-mid)', fontStyle: 'italic' }}>Data Structures</span> shall engrave their names in the Hall of Scribes."
                 </p>
              </motion.div>

              {/* Page 3 - Action */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ width: '100vw', height: '100vh', position: 'relative' }}
              >
                {/* Beautiful deep gradient vignette at the bottom to prevent the 3D model from overshadowing the UI */}
                <div style={{ position: 'absolute', bottom: 0, width: '100vw', height: '50vh', background: 'linear-gradient(to top, rgba(13,11,9, 1) 0%, rgba(13,11,9, 0.8) 40%, transparent 100%)', pointerEvents: 'none', zIndex: -1 }} />

                {user ? (
                  <>
                    <div style={{ position: 'absolute', bottom: '28%', width: '100%', textAlign: 'center' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-bright)', fontStyle: 'italic', fontWeight: 500, fontSize: '5rem', letterSpacing: '1px', textShadow: '0 4px 40px rgba(13,11,9,1), 0 0 20px rgba(13,11,9,0.9)', margin: 0 }}>
                        The Arena Awaits
                      </h2>
                    </div>
                    
                    <div style={{ position: 'absolute', bottom: '10%', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <button className="gold-button" onClick={() => navigate('/sanctum')} style={{ fontSize: '1.2rem', padding: '1.2rem 4.5rem', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 600, boxShadow: '0 0 40px rgba(212,168,60,0.5)', borderRadius: '4px', background: 'linear-gradient(90deg, var(--gold-mid) 0%, var(--gold-bright) 100%)', color: '#0d0b09', border: 'none' }}>
                        Enter Battleground
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ position: 'absolute', bottom: '28%', width: '100%', textAlign: 'center' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-bright)', fontStyle: 'italic', fontWeight: 500, fontSize: '5.5rem', letterSpacing: '1px', textShadow: '0 4px 40px rgba(13,11,9,1), 0 0 20px rgba(13,11,9,0.9)', margin: 0 }}>
                        Are you ready?
                      </h2>
                    </div>

                    <div style={{ position: 'absolute', bottom: '10%', width: '100%', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                      <button className="gold-button" onClick={() => navigate('/login')} style={{ fontSize: '1.2rem', padding: '1.2rem 3.5rem', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 600, boxShadow: '0 0 40px rgba(212,168,60,0.5)', borderRadius: '4px', background: 'linear-gradient(90deg, var(--gold-mid) 0%, var(--gold-bright) 100%)', color: '#0d0b09', border: 'none' }}>
                        Enter Sanctum
                      </button>
                      <button className="ghost-button" onClick={() => navigate('/register')} style={{ fontSize: '1.2rem', padding: '1.2rem 3.5rem', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 600, border: '1px solid rgba(232,192,96,1)', borderRadius: '4px', background: 'rgba(13,11,9,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: 'var(--gold-bright)', boxShadow: '0 0 30px rgba(13,11,9,0.9), inset 0 0 20px rgba(232,192,96,0.15)' }}>
                        Join Ranks
                      </button>
                    </div>
                  </>
                )}
              </motion.div>

            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SanctumMain;