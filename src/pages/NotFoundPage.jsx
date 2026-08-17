import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldAlert, Trophy } from 'lucide-react';

export const NotFoundPage = () => {
  // Set document title for SEO
  useEffect(() => {
    document.title = "404 - Page Not Found | Sports Management System";
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200 relative overflow-hidden">
      {/* Ambient Background Glow Effects */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-blue-500/15 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Full Page Content Container */}
      <div className="max-w-lg w-full mx-auto text-center relative z-10 space-y-6">

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            APEX <span className="text-blue-600 dark:text-blue-400">MPGI</span>
          </span>
        </div>

        {/* 404 Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-soft dark:shadow-2xl space-y-6 relative overflow-hidden">

          {/* 404 Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-500" /> Error 404
          </div>

          {/* Large 404 Display */}
          <div>
            <h1 className="text-8xl sm:text-9xl font-black tracking-tight leading-none bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent select-none">
              404
            </h1>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
              Page Not Found
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              The page you are looking for doesn't exist, may have been moved, or the URL may be incorrect.
            </p>
          </div>

          {/* Single Action Button: Go to Home */}
          <div className="pt-4">
            <Link
              to="/"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 transition-all duration-200 active:scale-[0.98]"
            >
              <Home className="w-5 h-5" />
              <span>Go to Home</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-500 text-center font-medium">
            SEMS 2026 Sports Event Management System
          </div>
        </div>

      </div>
    </div>
  );
};
