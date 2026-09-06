import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, ArrowLeft } from 'lucide-react';

export const PRProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Check if PR token exists and role is PR or pr_coordinator
  const prToken = localStorage.getItem('pr_auth_token');
  const prUserRaw = localStorage.getItem('pr_user');
  let prUser = null;
  try {
    prUser = prUserRaw ? JSON.parse(prUserRaw) : null;
  } catch (e) {
    prUser = null;
  }

  const isPR = !!prToken || (user && (user.role === 'PR' || user.role === 'pr_coordinator'));

  if (!isPR) {
    return (
      <div className="pr-portal-root min-h-screen py-20 px-4 bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] flex items-center justify-center font-spatial-sans transition-colors relative">
        <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-40 dark:block hidden" />
        <div className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 dark:block hidden" />

        <div className="max-w-md w-full bg-[#FFFFFF] dark:bg-[#0D101A] rounded-3xl p-8 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xl text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-spatial-display uppercase tracking-wide text-[#211D2B] dark:text-[#F5F2FA]">
              Access Denied
            </h2>
            <p className="text-xs text-[#686370] dark:text-[#AAA4B8]">
              The PR Portal is restricted to authorized PR Coordinators only. Public users and non-PR accounts are not permitted.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              to="/pr/login"
              state={{ from: location }}
              className="block w-full py-3 rounded-xl bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-bold text-xs shadow-lg transition cursor-pointer"
            >
              Log In as PR Coordinator
            </Link>
            
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] transition"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Public Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-portal-root min-h-screen bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] font-spatial-sans transition-colors relative flex flex-col">
      {/* Dark mode atmospheric overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-40 dark:block hidden" />
      <div className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 dark:block hidden" />
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
        {/* Universal PR Portal Footer */}
        <footer className="mt-auto pt-8 pb-4 px-4 sm:px-6 lg:px-8 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left max-w-7xl w-full mx-auto">
          <p className="font-spatial-display italic text-xs sm:text-sm tracking-wide text-[#686370] dark:text-[#AAA4B8]">
            “Publicity is absolutely critical. A good PR story is infinitely more effective than a front page ad.”
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8B8599] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7156A5] dark:bg-[#8B5CF6]" />
            <span>APEX 2026 PR & Media Command Center</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
