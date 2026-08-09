import React from 'react';
import { Navigate } from 'react-router-dom';
import { superAdminApi } from '../../services/superAdminApi';

export const SuperAdminProtectedRoute = ({ children }) => {
  const isAuth = superAdminApi.isAuthenticated();

  if (!isAuth) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return children;
};
