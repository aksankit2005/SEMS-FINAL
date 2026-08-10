import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';

export const AdminProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = adminApi.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};
