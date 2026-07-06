// src/App.jsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import GrainOverlay from './components/layout/GrainOverlay.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';

// Lazy load all pages for optimal bundle splitting and performance
const Home = React.lazy(() => import('./pages/Home.jsx'));
const AuthPage = React.lazy(() => import('./pages/AuthPage.jsx'));
const Profile = React.lazy(() => import('./pages/Profile.jsx'));
const Sanctum = React.lazy(() => import('./pages/Sanctum.jsx'));
const TopicArena = React.lazy(() => import('./pages/TopicArena.jsx'));
const ProblemsPage = React.lazy(() => import('./pages/ProblemsPage.jsx'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard.jsx'));
const Astraverse = React.lazy(() => import('./pages/Astraverse.jsx'));
const Arena = React.lazy(() => import('./pages/Arena.jsx'));
const SolvePage = React.lazy(() => import('./pages/SolvePage.jsx'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword.jsx'));

// Premium, brand-aligned loading fallback matching the Codex aesthetic
const CodexLoader = () => (
  <div style={{
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0D0B09',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F0E0B0',
    fontFamily: "'Playfair Display', serif"
  }}>
    <div 
      className="pulsing-text"
      style={{
        fontSize: '2rem',
        color: '#D4A83C',
        fontStyle: 'italic',
        marginBottom: '0.75rem',
        letterSpacing: '4px',
        textShadow: '0 2px 10px rgba(212,168,60,0.3)',
      }}
    >
      KnightCode
    </div>
    <div style={{
      fontFamily: 'monospace',
      color: '#9A8060',
      fontSize: '0.85rem',
      letterSpacing: '2px'
    }}>
      Unrolling the Codex...
    </div>
  </div>
);

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#D4A83C',
          colorBgBase: '#0D0B09',
          colorTextBase: '#F0E0B0',
          fontFamily: "'Playfair Display', serif",
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
        <ErrorBoundary>
        {/* SVG grain filter injected into DOM to match architecture */}
        <GrainOverlay />
        
        <Suspense fallback={<CodexLoader />}>
          <Routes>
            <Route element={<ProtectedRoute onlyUnauthenticated />}>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/sanctum/:username" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/sanctum" element={<Sanctum />} />
              <Route path="/difficulty" element={<TopicArena />} />
              <Route path="/forge" element={<ProblemsPage />} />

              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/astraverse" element={<Astraverse />} />
              <Route path="/arena" element={<Arena />} />
              <Route path="/solve" element={<SolvePage />} />
            </Route>

            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/*" element={
              <div style={{ minHeight: '100vh', background: '#0D0B09', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#F0E0B0', fontFamily: "'Playfair Display', serif" }}>
                <div style={{ fontSize: '5rem', color: '#D4A83C', marginBottom: '10px' }}>404</div>
                <p style={{ color: '#8A7A5A', fontFamily: 'monospace' }}>This page does not exist in the kingdom.</p>
              </div>
            } />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;

