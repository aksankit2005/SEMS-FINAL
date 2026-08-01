import React from 'react';
import { Navigate } from 'react-router-dom';
import { collegeHeadApi } from '../../services/collegeHeadApi';

export const CollegeHeadProtectedRoute = ({ children }) => {
  const isAuth = collegeHeadApi.isAuthenticated();

  if (!isAuth) {
    // Clear any stale/partial data before redirecting
    localStorage.removeItem('sems_college_head_token');
    localStorage.removeItem('sems_college_head_user');
    return <Navigate to="/college-head/login" replace />;
  }

  return children;
};
