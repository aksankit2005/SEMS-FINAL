import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Flame, Trophy, Radio, UserCheck, Calendar, BarChart3, 
  Award, Users, Newspaper, Image, Info, ChevronLeft, ChevronRight, LayoutDashboard, Camera,
  Building2, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { galleryApi } from '../../services/galleryApi';

export const CollapsibleSidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const isPRAuth = galleryApi.isPRAuthenticated() || (user && (user.role === 'PR' || user.role === 'pr_coordinator'));

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
    <aside
      className={`hidden lg:flex flex-col sticky top-20 h-[calc(100vh-5rem)] glass-sidebar transition-all duration-300 z-30 shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200/80 dark:border-slate-800/80">
        {!isCollapsed && (
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation Menu
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition hover:scale-105 ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-black'
                    : 'text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Staff Portals Links when not logged in */}
      {!user && (
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1">
          {!isCollapsed && (
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1">
              Staff Portals
            </p>
          )}
          <NavLink
            to="/college-head/login"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
            title={isCollapsed ? 'College Head Login' : undefined}
          >
            <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {!isCollapsed && <span className="truncate">College Head Login</span>}
          </NavLink>
          <NavLink
            to="/coordinator/login"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
            title={isCollapsed ? 'Coordinator Login' : undefined}
          >
            <Shield className="w-4 h-4 text-orange-500 shrink-0" />
            {!isCollapsed && <span className="truncate">Coordinator Login</span>}
          </NavLink>
          <NavLink
            to="/pr-login"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
            title={isCollapsed ? 'PR Portal Login' : undefined}
          >
            <Camera className="w-4 h-4 text-indigo-500 shrink-0" />
            {!isCollapsed && <span className="truncate">PR Portal Login</span>}
          </NavLink>
        </div>
      )}

      {/* Dashboard Shortcut Footer */}
      {user && (
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
            title={isCollapsed ? 'My Dashboard' : undefined}
          >
            <LayoutDashboard className="w-4 h-4 text-orange-400" />
            {!isCollapsed && (
              <span className="truncate">
                {user.role === 'admin' ? 'Admin Portal' : user.role === 'coordinator' ? 'Coord Portal' : 'Athlete Portal'}
              </span>
            )}
          </NavLink>
        </div>
      )}
    </aside>
  );
};
