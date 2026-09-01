import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, LogOut, Key, User, Crown, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ThemeToggle } from '../common/ThemeToggle';

export const SuperCoordinatorNavbar = ({ onRefresh, activeTab, setActiveTab, onOpenPasswordModal }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addToast } = useToast();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('sems_super_coord_token');
    localStorage.removeItem('sems_super_coord_user');
    window.dispatchEvent(new Event('sems-auth-change'));
    addToast('Logged out of Super Coordinator Portal', 'info');
    navigate('/');
  };

  const superCoordUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('sems_super_coord_user') || '{}');
    } catch {
      return {};
    }
  })();
  const superCoordName = superCoordUser?.name || 'Super Coordinator Console';

  return (
    <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-md transition-colors duration-200 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between min-h-[3.75rem] py-2 sm:py-0 sm:h-20 gap-2 sm:gap-4">

          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            {/* <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md flex items-center justify-center text-white font-black text-sm sm:text-lg shrink-0">
              👑
            </div> */}
            <div className="min-w-0">
              <span className="text-xs sm:text-lg font-black text-slate-900 dark:text-white tracking-tight block truncate" title={superCoordName}>
                {superCoordName}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide block truncate">
                President & Host Control
              </span>
            </div>
          </div>

          {/* User Controls & Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-nowrap">

            {/* Go to Home Page Button */}
            <button
              onClick={() => navigate('/')}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs shrink-0"
              title="Go to Home Page"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Go to Home</span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs shrink-0"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Profile Tab Button */}
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shrink-0 ${activeTab === 'profile'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                title="Super Coordinator Profile"
              >
                <User className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'profile' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                <span className="hidden sm:inline">Profile</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
              <span className="text-[11px] sm:text-xs">Logout</span>
            </button>

          </div>

        </div>
      </div>
    </nav>
  );
};
