// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ onlyUnauthenticated = false }) => {
  const { user } = useAuth();

  if (onlyUnauthenticated && user) {
    return <Navigate to="/" replace />;
  }

  if (!onlyUnauthenticated && !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;