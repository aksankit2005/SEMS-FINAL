import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, Trophy, Calendar, Award, Newspaper, Image, Info, 
  UserCheck, Flame, Radio, BarChart3, LayoutDashboard, Camera,
  Building2, Shield, LogOut, Crown, Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { galleryApi } from '../../services/galleryApi';
import { collegeHeadApi } from '../../services/collegeHeadApi';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';

export const MobileDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
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

  // Keyboard accessibility: close drawer on Escape press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getActiveSession = () => {
    if (localStorage.getItem('sems_admin_token')) {
      const adUser = JSON.parse(localStorage.getItem('sems_admin_user') || '{}');
      return {
        name: adUser?.name || 'System Administrator',
        roleLabel: 'Admin',
        dashboardPath: '/admin/dashboard',
        logoutHandler: () => {
          localStorage.removeItem('sems_admin_token');
          localStorage.removeItem('sems_admin_user');
          window.dispatchEvent(new Event('sems-auth-change'));
          onClose();
          navigate('/');
        }
      };
    }
    if (localStorage.getItem('sems_super_coord_token')) {
      const scUser = JSON.parse(localStorage.getItem('sems_super_coord_user') || '{}');
      return {
        name: scUser?.name || 'Super Coordinator',
        roleLabel: 'Super Coord',
        dashboardPath: '/super-coordinator/dashboard',
        logoutHandler: () => {
          localStorage.removeItem('sems_super_coord_token');
          localStorage.removeItem('sems_super_coord_user');
          window.dispatchEvent(new Event('sems-auth-change'));
          onClose();
          navigate('/');
        }
      };
    }
    if (user) {
      return {
        name: user.name || 'User Profile',
        roleLabel: user.role === 'admin' ? 'Admin' : 'Athlete',
        dashboardPath: '/dashboard',
        logoutHandler: () => {
          logout();
          onClose();
          navigate('/');
        }
      };
    }
    if (collegeHeadApi.isAuthenticated()) {
      const chUser = collegeHeadApi.getUser();
      return {
        name: chUser?.faculty_name || chUser?.college || 'College Head',
        roleLabel: 'College Head',
        dashboardPath: '/college-head/dashboard',
        logoutHandler: () => {
          collegeHeadApi.logout();
          onClose();
          navigate('/');
        }
      };
    }
    if (coordinatorApi.isAuthenticated()) {
      const coordUser = coordinatorApi.getCurrentUser();
      return {
        name: coordUser?.coordinatorName || coordUser?.sportName || 'Coordinator',
        roleLabel: 'Sport Coordinator',
        dashboardPath: getSportRoute(coordUser?.assignedSport),
        logoutHandler: () => {
          coordinatorApi.logout();
          onClose();
          navigate('/');
        }
      };
    }
    if (galleryApi.isPRAuthenticated()) {
      const prUser = JSON.parse(localStorage.getItem('pr_user') || '{}');
      return {
        name: prUser?.username || 'PR Media',
        roleLabel: 'PR Coordinator',
        dashboardPath: '/pr-dashboard',
        logoutHandler: () => {
          galleryApi.logoutPR();
          onClose();
          navigate('/');
        }
      };
    }
    return null;
  };

  const activeSession = getActiveSession();

  if (!isOpen) return null;

  const navItems = [
    { name: 'Home', path: '/', icon: Flame },
    { name: 'Registration', path: '/registration', icon: UserCheck },
    { name: 'Live Matches', path: '/live', icon: Radio, badge: 'LIVE' },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
    { name: 'Results', path: '/results', icon: BarChart3 },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
    { name: 'Gallery', path: '/gallery', icon: Image },
    { name: 'Journey Timeline', path: '/journey', icon: Compass, badge: 'TIMELINE', isPurple: true },
    { name: 'About Us', path: '/about', icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-50 xl:hidden flex font-sans">
      {/* Backdrop Overlay */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200" 
        aria-hidden="true"
      />

      {/* Drawer Container Panel */}
      <div className="relative w-[280px] max-w-[85vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-full flex flex-col z-10 shadow-2xl p-4 overflow-y-auto custom-scrollbar transition-transform duration-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <Link to="/" onClick={onClose} className="flex items-center">
            <img 
              src="/apex-nav-logo-dark.png" 
              alt="APEX Logo" 
              className="hidden dark:block h-8 sm:h-9 w-auto object-contain"
            />
            <img 
              src="/apex-nav-logo.png" 
              alt="APEX Logo" 
              className="block dark:hidden h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
            aria-label="Close mobile navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Session Banner */}
        {activeSession ? (
          <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-black uppercase text-slate-400">Logged in as</div>
            <div className="font-bold text-blue-600 dark:text-blue-400 text-xs mt-0.5 truncate">
              {activeSession.name} <span className="text-[10px] text-slate-500 font-normal">({activeSession.roleLabel})</span>
            </div>
            
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800">
              <Link
                to={activeSession.dashboardPath}
                onClick={onClose}
                className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={activeSession.logoutHandler}
                className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/20 text-xs font-bold transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Navigation Items List */}
        <div className="space-y-1 flex-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400 font-black shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    item.isPurple
                      ? 'bg-purple-600 text-white shadow-[0_0_8px_#9333ea]'
                      : 'bg-rose-500 text-white animate-pulse'
                  }`}>
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
