import React from 'react';
import { Navigate } from 'react-router-dom';

export const SuperCoordinatorProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('sems_super_coord_token');
  const user = localStorage.getItem('sems_super_coord_user');

  if (!token || !user) {
    // Clear any stale/partial data before redirecting
    localStorage.removeItem('sems_super_coord_token');
    localStorage.removeItem('sems_super_coord_user');
    return <Navigate to="/super-coordinator/login" replace />;
  }

  return children;
};
