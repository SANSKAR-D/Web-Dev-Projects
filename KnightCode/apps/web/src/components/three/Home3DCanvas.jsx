import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll, Html, Environment } from '@react-three/drei';
import AncientModel from './AncientModel.jsx';

export default function Home3DCanvas({ children }) {
  return (
    <Canvas 
      camera={{ position: [0, 0, 5], fov: 50 }} 
      dpr={[1, 1.5]}
      gl={{ 
        antialias: true, 
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: true
      }}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
    >
      <ambientLight intensity={2} color="#F0E0B0" />
      <directionalLight position={[5, 10, 5]} intensity={3} color="#E8C060" />
      <directionalLight position={[-5, 5, -5]} intensity={1} color="#8B4513" />
      <Environment preset="sunset" />

      <Suspense fallback={<Html center><div style={{ color: 'var(--gold-bright)', fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', width: '300px', textAlign: 'center' }}>Unearthing Artifacts...</div></Html>}>
        <ScrollControls pages={3} damping={0.25} distance={1.2}>
          <AncientModel />
          <Scroll html style={{ width: '100vw' }}>
            {children}
          </Scroll>
        </ScrollControls>
      </Suspense>
    </Canvas>
  );
}
