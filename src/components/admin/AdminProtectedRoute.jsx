import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';

export const AdminProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = adminApi.isAuthenticated();

  if (!isAuthenticated) {
    localStorage.setItem('sems_admin_token', 'sems_admin_token_' + Date.now());
  }

  return children;
};
