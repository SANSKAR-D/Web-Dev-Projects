// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import AuthPage from './pages/AuthPage.jsx';
import Profile from './pages/Profile.jsx';
import Home from './pages/Home.jsx';
import Sanctum from './pages/Sanctum.jsx';
import TopicArena from './pages/TopicArena.jsx';
import ProblemsPage from './pages/ProblemsPage.jsx';
import GrainOverlay from './components/layout/GrainOverlay.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import Chakras from './pages/Chakras.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Astraverse from './pages/Astraverse.jsx';
import Arena from './pages/Arena.jsx';
import SolvePage from './pages/SolvePage.jsx';

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
        {/* SVG grain filter injected into DOM to match architecture */}
        <GrainOverlay />
        
        <Routes>
          <Route element={<ProtectedRoute onlyUnauthenticated />}>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/sanctum/:username" element={<Profile />} />
            <Route path="/sanctum" element={<Sanctum />} />
            <Route path="/difficulty" element={<TopicArena />} />
            <Route path="/forge" element={<ProblemsPage />} />
            <Route path="/chakras" element={<Chakras />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/astraverse" element={<Astraverse />} />
            <Route path="/arena" element={<Arena />} />
            <Route path="/solve" element={<SolvePage />} />
          </Route>

          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/*" element={<p>Error 404 Page Not Found</p>} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
