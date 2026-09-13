import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Flame, Trophy, Radio, UserCheck, Calendar, BarChart3, 
  Award, Newspaper, Image, Info, ChevronLeft, ChevronRight, LayoutDashboard, Camera,
  Building2, Shield, Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { galleryApi } from '../../services/galleryApi';
import { collegeHeadApi } from '../../services/collegeHeadApi';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';

export const CollapsibleSidebar = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [, setAuthTick] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => setAuthTick((t) => t + 1);
    window.addEventListener('sems-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('sems-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const getActiveSession = () => {
    if (localStorage.getItem('sems_admin_token')) {
      const adUser = JSON.parse(localStorage.getItem('sems_admin_user') || '{}');
      return {
        name: adUser?.name || 'System Administrator',
        roleLabel: 'Admin Portal',
        dashboardPath: '/admin/dashboard'
      };
    }
    if (localStorage.getItem('sems_super_coord_token')) {
      const scUser = JSON.parse(localStorage.getItem('sems_super_coord_user') || '{}');
      return {
        name: scUser?.name || 'Super Coordinator',
        roleLabel: 'Super Coord Portal',
        dashboardPath: '/super-coordinator/dashboard'
      };
    }
    if (user) {
      return {
        name: user.name || 'User Profile',
        roleLabel: user.role === 'admin' ? 'Admin Portal' : 'Athlete Portal',
        dashboardPath: '/dashboard'
      };
    }
    if (collegeHeadApi.isAuthenticated()) {
      const chUser = collegeHeadApi.getUser();
      return {
        name: chUser?.faculty_name || chUser?.college || 'College Head',
        roleLabel: 'College Head Portal',
        dashboardPath: '/college-head/dashboard'
      };
    }
    if (coordinatorApi.isAuthenticated()) {
      const coordUser = coordinatorApi.getCurrentUser();
      return {
        name: coordUser?.coordinatorName || coordUser?.sportName || 'Coordinator',
        roleLabel: 'Coordinator Portal',
        dashboardPath: getSportRoute(coordUser?.assignedSport)
      };
    }
    if (galleryApi.isPRAuthenticated()) {
      const prUser = JSON.parse(localStorage.getItem('pr_user') || '{}');
      return {
        name: prUser?.username || 'PR Media',
        roleLabel: 'PR Media Portal',
        dashboardPath: '/pr-dashboard'
      };
    }
    return null;
  };

  const activeSession = getActiveSession();

  const navItems = [
    { name: 'Home', path: '/', icon: Flame },
    { name: 'Registration', path: '/registration', icon: UserCheck },
    { name: 'Live Matches', path: '/live', icon: Radio, badge: 'LIVE' },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
    { name: 'Results', path: '/results', icon: BarChart3 },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
    { name: 'Announcements', path: '/announcements', icon: Newspaper },
    { name: 'Gallery', path: '/gallery', icon: Image },
    { name: 'About Us', path: '/about', icon: Info },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-white/95 dark:bg-slate-950/95 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-200 z-30 shrink-0 select-none ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Sidebar Top Title & Collapse Toggle */}
      <div className="flex items-center justify-between p-3 sm:p-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
        {!isCollapsed && (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            NAVIGATION
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition hover:scale-105 cursor-pointer active:scale-95 ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400 font-extrabold shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate group-hover:translate-x-0.5 transition-transform">{item.name}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Active Session Dashboard Shortcut */}
      {activeSession && (
        <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
          <NavLink
            to={activeSession.dashboardPath}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
            title={isCollapsed ? activeSession.roleLabel : undefined}
          >
            <LayoutDashboard className="w-4 h-4 text-orange-400 shrink-0" />
            {!isCollapsed && (
              <span className="truncate">
                {activeSession.roleLabel}
              </span>
            )}
          </NavLink>
        </div>
      )}
    </aside>
  );
};
