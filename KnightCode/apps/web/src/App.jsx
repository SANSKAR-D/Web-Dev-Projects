// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import AuthPage from './pages/AuthPage.jsx';
import Profile from './pages/Profile.jsx';
import Home from './pages/Home.jsx';
import GrainOverlay from './components/layout/GrainOverlay.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';

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
          </Route>

          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
