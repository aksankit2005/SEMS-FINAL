import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, Trophy, Calendar, Award, Users, Newspaper, Image, Mail, 
  UserCheck, Flame, Radio, BarChart3, LayoutDashboard, Camera 
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
    { name: 'Contact', path: '/contact', icon: Mail },
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
      </div>
    </div>
  );
};
