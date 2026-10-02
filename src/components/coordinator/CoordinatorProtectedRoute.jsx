import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';
import { Shield, ArrowLeft } from 'lucide-react';

export const CoordinatorProtectedRoute = ({ children }) => {
  const location = useLocation();
  const user = coordinatorApi.getCurrentUser();
  const token = localStorage.getItem('sems_coordinator_token');
  const adminToken = localStorage.getItem('sems_admin_token');
  const isAdminSession = Boolean(
    adminToken ||
    localStorage.getItem('sems_coordinator_entered_by_admin') === 'true' ||
    user?.enteredByAdmin
  );

  // Guard 1: must have both a valid token AND a user with the correct role (or admin direct entry)
  if (!user || !token || (user.role !== 'sport_coordinator' && !isAdminSession)) {
    // Clear any stale/partial data before redirecting
    localStorage.removeItem('sems_coordinator_token');
    localStorage.removeItem('sems_coordinator_user');
    return <Navigate to="/coordinator/login" replace />;
  }

  // Guard 2: Sport Authorization Guard
  // Ensure coordinator can only access their assigned sport portal (unless Admin who has global access)
  const currentPath = location.pathname.toLowerCase().trim();
  const allowedSportRoute = getSportRoute(user?.assignedSport || '').toLowerCase().trim();

  if (!isAdminSession && allowedSportRoute && currentPath !== allowedSportRoute) {
    return <Navigate to={allowedSportRoute} replace />;
  }

  return (
    <div className="coordinator-portal-root min-h-screen bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] font-spatial-sans transition-colors relative flex flex-col">
      {/* Top Banner when entered by Admin */}
      {isAdminSession && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 shadow-lg border-b border-amber-500/30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Shield className="w-4 h-4 text-amber-200 shrink-0" />
            <span>
              <strong>Direct Admin Access:</strong> Managing <strong>{user?.sportName || user?.assignedSport || 'Sport'} Operations</strong> without coordinator credentials
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/coordinators"
              className="px-3 py-1 bg-black/30 hover:bg-black/50 text-white rounded-lg font-bold transition-all text-xs inline-flex items-center gap-1.5 shrink-0 border border-white/20 active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Admin Console
            </Link>
          </div>
        </div>
      )}

      {/* Dark mode atmospheric overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-40 dark:block hidden" />
      <div className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 dark:block hidden" />
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
        {/* Universal Coordinator Footer */}
        <footer className="mt-auto pt-8 pb-4 px-4 sm:px-6 lg:px-8 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left max-w-[1600px] w-full mx-auto">
          <p className="font-spatial-display italic text-xs sm:text-sm tracking-wide text-[#686370] dark:text-[#AAA4B8]">
            “It’s what you learn after you think you know it all that really counts”
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8B8599] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7156A5] dark:bg-[#8B5CF6]" />
            <span>APEX 2026 {user?.sportName || 'Sport'} Operations Console</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

