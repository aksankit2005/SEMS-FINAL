import React from 'react';
import { Navigate } from 'react-router-dom';
import { collegeHeadApi } from '../../services/collegeHeadApi';

export const CollegeHeadProtectedRoute = ({ children }) => {
  const isAuth = collegeHeadApi.isAuthenticated();
  const user = collegeHeadApi.getUser();

  if (!isAuth) {
    // Clear any stale/partial data before redirecting
    localStorage.removeItem('sems_college_head_token');
    localStorage.removeItem('sems_college_head_user');
    return <Navigate to="/college-head/login" replace />;
  }

  return (
    <div className="college-head-portal-root min-h-screen bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] font-spatial-sans transition-colors relative flex flex-col">
      {/* Dark mode atmospheric overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-40 dark:block hidden" />
      <div className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 dark:block hidden" />
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
        {/* Universal College Head Footer */}
        <footer className="mt-auto pt-8 pb-4 px-4 sm:px-6 lg:px-8 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left max-w-7xl w-full mx-auto">
          <p className="font-spatial-display italic text-xs sm:text-sm tracking-wide text-[#686370] dark:text-[#AAA4B8]">
            “It’s what you learn after you think you know it all that really counts”
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8B8599] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7156A5] dark:bg-[#8B5CF6]" />
            <span>APEX 2026 {user?.college || 'College'} Sports Administration Console</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
