import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, LogOut, Key, User, Crown } from 'lucide-react';
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
    <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[3.75rem] py-2 sm:py-0 sm:h-20 gap-2 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-md flex items-center justify-center text-slate-950 font-black text-sm sm:text-lg shrink-0">
              👑
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-lg font-black text-slate-900 dark:text-white tracking-tight block truncate" title={superCoordName}>
                {superCoordName}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide block truncate">
                President & Host Control
              </span>
            </div>
          </div>

          {/* User Controls & Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {/* Profile Tab Button */}
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  activeTab === 'profile'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title="Super Coordinator Profile"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
                <span className="hidden md:inline">Profile</span>
              </button>
            )}

            {/* Change Password Button */}
            {onOpenPasswordModal && (
              <button
                onClick={onOpenPasswordModal}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Change Password"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden lg:inline">Password</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
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
