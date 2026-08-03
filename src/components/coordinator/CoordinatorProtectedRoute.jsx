import React from 'react';
import { Navigate } from 'react-router-dom';
import { coordinatorApi } from '../../services/coordinatorApi';

export const CoordinatorProtectedRoute = ({ children }) => {
  const user = coordinatorApi.getCurrentUser();
  const token = localStorage.getItem('sems_coordinator_token');

  // Guard: must have both a valid token AND a user with the correct role
  if (!user || !token || user.role !== 'sport_coordinator') {
    // Clear any stale/partial data before redirecting
    localStorage.removeItem('sems_coordinator_token');
    localStorage.removeItem('sems_coordinator_user');
    return <Navigate to="/coordinator/login" replace />;
  }

  return children;
};
