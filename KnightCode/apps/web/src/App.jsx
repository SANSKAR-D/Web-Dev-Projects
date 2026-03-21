import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';

// Placeholder Home Page
const Sanctum = () => (
  <div style={{ padding: '2rem' }}>
    <h1 style={{ fontStyle: 'italic', fontSize: '3rem', marginBottom: '1rem', color: 'var(--gold-bright)' }}>Sharpen thy blade. The arena awaits.</h1>
    <p>Welcome to the KnightCode CodeArena. Prepare for battle.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* SVG grain filter injected into DOM to match architecture */}
        <svg className="grain-overlay" xmlns="http://www.w3.org/2000/svg">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feBlend in="SourceGraphic" mode="overlay" result="blend"/>
            <feComposite in="blend" in2="SourceGraphic" operator="atop"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" opacity="1"/>
        </svg>
        
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Sanctum />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
