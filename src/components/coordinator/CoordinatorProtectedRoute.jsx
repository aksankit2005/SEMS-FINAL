import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';

export const CoordinatorProtectedRoute = ({ children }) => {
  const location = useLocation();
  const user = coordinatorApi.getCurrentUser();
  const token = localStorage.getItem('sems_coordinator_token');

  // Guard 1: must have both a valid token AND a user with the correct role
  if (!user || !token || user.role !== 'sport_coordinator') {
    // Clear any stale/partial data before redirecting
    localStorage.removeItem('sems_coordinator_token');
    localStorage.removeItem('sems_coordinator_user');
    return <Navigate to="/coordinator/login" replace />;
  }

  // Guard 2: Sport Authorization Guard
  // Ensure coordinator can only access their assigned sport portal
  const currentPath = location.pathname.toLowerCase().trim();
  const allowedSportRoute = getSportRoute(user?.assignedSport || '').toLowerCase().trim();

  if (allowedSportRoute && currentPath !== allowedSportRoute) {
    return <Navigate to={allowedSportRoute} replace />;
  }

  return children;
};

