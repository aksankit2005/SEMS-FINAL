import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  X, Trophy, Calendar, Award, Users, Newspaper, Image, Info, 
  UserCheck, Flame, Radio, BarChart3, LayoutDashboard, Camera,
  Building2, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { galleryApi } from '../../services/galleryApi';

export const MobileDrawer = ({ isOpen, onClose }) => {
  const { user, setIsAuthModalOpen, logout } = useAuth();
  const isPRAuth = galleryApi.isPRAuthenticated() || (user && (user.role === 'PR' || user.role === 'pr_coordinator'));

  if (!isOpen) return null;

  const navItems = [
    { name: 'Home', path: '/', icon: Flame },
    { name: 'Sports Hub', path: '/sports', icon: Trophy },
    { name: 'Registration', path: '/registration', icon: UserCheck },
    { name: 'Live Matches', path: '/live', icon: Radio, badge: 'LIVE' },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
    { name: 'Results', path: '/results', icon: BarChart3 },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
    { name: 'Coordinators', path: '/coordinators', icon: Users },
    { name: 'Announcements', path: '/announcements', icon: Newspaper },
    { name: 'Gallery', path: '/gallery', icon: Image },
    ...(isPRAuth ? [{ name: 'PR Portal', path: '/pr-dashboard', icon: Camera }] : []),
    { name: 'About Us', path: '/about', icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-fade-in transition-opacity" 
      />

      {/* Drawer Panel */}
      <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-full flex flex-col z-10 shadow-2xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center">
            <img 
              src="/logo-dark.png" 
              alt="APEX Logo" 
              className="hidden dark:block h-10 w-auto object-contain"
            />
            <img 
              src="/logo-light.png" 
              alt="APEX Logo" 
              className="block dark:hidden h-10 w-auto object-contain"
            />
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Card */}
        <div className="my-6 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          {user ? (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Logged in as</div>
              <div className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">{user.name} ({user.role.toUpperCase()})</div>
              <button
                onClick={() => { logout(); onClose(); }}
                className="mt-3 text-xs font-bold text-rose-500 hover:underline"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setIsAuthModalOpen(true); onClose(); }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold text-xs shadow-md"
            >
              Sign In / Student Portal
            </button>
          )}
        </div>

        {/* Links */}
        <div className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-600 text-white font-black shadow-md'
                      : 'text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Staff Portals Quick Navigation */}
        {!user && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-2">Staff Portals</p>
            <Link
              to="/college-head/login"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
            >
              <Building2 className="w-5 h-5 text-emerald-500" />
              <span>College Head Login</span>
            </Link>
            <Link
              to="/coordinator/login"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-white hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-700 dark:hover:text-orange-400 transition"
            >
              <Shield className="w-5 h-5 text-orange-500" />
              <span>Coordinator Login</span>
            </Link>
            <Link
              to="/pr-login"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-400 transition"
            >
              <Camera className="w-5 h-5 text-indigo-500" />
              <span>PR Portal Login</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
