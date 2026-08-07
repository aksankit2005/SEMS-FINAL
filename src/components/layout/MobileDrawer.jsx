import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, Trophy, Calendar, Award, Newspaper, Image, Info, 
  UserCheck, Flame, Radio, BarChart3, LayoutDashboard, Camera,
  Building2, Shield, LogOut
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

  const getActiveSession = () => {
    if (user) {
      return {
        name: user.name || 'User Profile',
        roleLabel: user.role === 'admin' ? 'Admin' : 'Student',
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

  const isPRAuth = galleryApi.isPRAuthenticated() || (user && (user.role === 'PR' || user.role === 'pr_coordinator'));

  const navItems = [
    { name: 'Home', path: '/', icon: Flame },
    { name: 'Sports Hub', path: '/sports', icon: Trophy },
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
          {activeSession ? (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Logged in as</div>
              <div className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">{activeSession.name} ({activeSession.roleLabel})</div>
              
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <Link
                  to={activeSession.dashboardPath}
                  onClick={onClose}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={activeSession.logoutHandler}
                  className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Portal Access</p>
              <p className="text-[11px] text-slate-400">Select an official portal below to sign in.</p>
            </div>
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
        {!activeSession && (
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
