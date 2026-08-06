import React from 'react';
import { Navigate } from 'react-router-dom';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';

export const CoordinatorDashboardPage = () => {
  const user = coordinatorApi.getCurrentUser();
  const targetRoute = getSportRoute(user?.assignedSport);

  return <Navigate to={targetRoute} replace />;
};

