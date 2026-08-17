import React from 'react';
import { Navigate } from 'react-router-dom';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';
import { SportCoordinatorDashboardPage } from './sports/SportCoordinatorDashboardPage';

export const CoordinatorDashboardPage = () => {
  const user = coordinatorApi.getCurrentUser();

  if (user && user.assignedSport) {
    const route = getSportRoute(user.assignedSport);
    if (route && route !== '/coordinator/dashboard') {
      return <Navigate to={route} replace />;
    }
  }

  // Fallback to default sport coordinator dashboard
  return (
    <SportCoordinatorDashboardPage
      sportName={user?.sportName || 'Badminton'}
      sportSlug={user?.assignedSport || 'badminton'}
    />
  );
};

export default CoordinatorDashboardPage;
