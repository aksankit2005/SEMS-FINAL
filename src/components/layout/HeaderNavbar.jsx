import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Trophy, Bell, User, ShieldCheck, 
  Menu, X, Sparkles, CheckCircle2, ChevronRight, LogOut, Camera,
  ChevronDown, Building2, Shield, LayoutDashboard, Crown,
  Flame, UserCheck, Radio, Calendar, BarChart3, Award, Newspaper, Image, Info
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useSportsData } from '../../context/SportsDataContext';
import { galleryApi } from '../../services/galleryApi';
import { collegeHeadApi } from '../../services/collegeHeadApi';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';

export const HeaderNavbar = ({ onOpenMobileDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [, setAuthTick] = useState(0);

  const notificationRef = useRef(null);
  const signInRef = useRef(null);
  const profileRef = useRef(null);

  const { user, logout } = useAuth();
  const { announcements } = useSportsData();

  // Close dropdowns on route change
  useEffect(() => {
    setIsNotificationsOpen(false);
    setIsSignInOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Click & Touch outside handler for popovers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
      if (signInRef.current && !signInRef.current.contains(e.target)) {
        setIsSignInOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleAuthChange = () => setAuthTick((t) => t + 1);
    window.addEventListener('sems-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('sems-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Check active session across all user roles
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
          navigate('/');
        }
      };
    }
    if (user) {
      return {
        name: user.name || 'User Profile',
        roleLabel: user.role === 'admin' ? 'Admin' : 'Profile',
        dashboardPath: '/dashboard',
        logoutHandler: () => {
          logout();
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
          navigate('/');
        }
      };
    }
    if (coordinatorApi.isAuthenticated()) {
      const coordUser = coordinatorApi.getCurrentUser();
      return {
        name: coordUser?.coordinatorName || coordUser?.sportName || 'Coordinator',
        roleLabel: 'Sport Coord',
        dashboardPath: getSportRoute(coordUser?.assignedSport),
        logoutHandler: () => {
          coordinatorApi.logout();
          navigate('/');
        }
      };
    }
    if (galleryApi.isPRAuthenticated()) {
      const prUser = JSON.parse(localStorage.getItem('pr_user') || '{}');
      return {
        name: prUser?.username || 'PR Media',
        roleLabel: 'PR Media',
        dashboardPath: '/pr-dashboard',
        logoutHandler: () => {
          galleryApi.logoutPR();
          navigate('/');
        }
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
    { name: 'Gallery', path: '/gallery', icon: Image },
    { name: 'About Us', path: '/about', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-transparent backdrop-blur-md border-b border-transparent transition-colors duration-200 font-sans">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 lg:gap-4">

          {/* Left Brand & Mobile Toggle Area */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mobile / Tablet Drawer Trigger (Hidden on Desktop XL+) */}
            <button
              onClick={onOpenMobileDrawer}
              className="xl:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer active:scale-95"
              aria-label="Open mobile navigation menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* APEX Logo */}
            <Link to="/" className="flex items-center group shrink-0 pr-1">
              <img 
                src="/apex-nav-logo-dark.png" 
                alt="APEX Logo" 
                className="hidden dark:block h-8 sm:h-9 lg:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <img 
                src="/apex-nav-logo.png" 
                alt="APEX Logo" 
                className="block dark:hidden h-8 sm:h-9 lg:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Center: Desktop Navigation Links (Moved from Sidebar) */}
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-1.5 overflow-x-auto no-scrollbar py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative px-2.5 2xl:px-3 py-1.5 text-xs 2xl:text-[13px] font-bold tracking-tight transition-colors duration-150 flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 shrink-0 opacity-80 group-hover:opacity-100" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Quick Actions Area */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsSignInOpen(false);
                }}
                className="relative p-2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-800 transition cursor-pointer active:scale-95"
                title="Notifications"
                aria-label="View Broadcast Announcements"
              >
                <Bell className="w-4 h-4" />
                {announcements.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                )}
              </button>

              {/* Notifications Popover: Mobile Fixed Centered & Desktop Absolute Right */}
              {isNotificationsOpen && (
                <div className="fixed top-14 left-3 right-3 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-88 max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Tournament Broadcasts</h4>
                    </div>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 my-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {announcements.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No active broadcasts</p>
                    ) : (
                      announcements.slice(0, 4).map((ann) => (
                        <Link
                          key={ann.id}
                          to="/announcements"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="block p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-slate-800/80 transition"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                            <span>{ann.category}</span>
                            <span className="text-slate-400 font-normal">{ann.date}</span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{ann.title}</h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{ann.summary}</p>
                        </Link>
                      ))
                    )}
                  </div>

                  <Link
                    to="/announcements"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="block text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-2 border-t border-slate-100 dark:border-slate-800"
                  >
                    View All Announcements →
                  </Link>
                </div>
              )}
            </div>

            {/* Theme Mode Toggle Button */}
            <ThemeToggle />

            {/* User Session Profile Avatar Menu OR Portal Sign In */}
            {activeSession ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotificationsOpen(false);
                    setIsSignInOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 dark:from-blue-500/15 dark:via-indigo-500/15 dark:to-purple-500/15 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/30 hover:border-blue-500/60 transition cursor-pointer active:scale-95"
                  aria-label="User Profile Menu"
                  title={activeSession.name}
                >
                  {/* Profile Avatar with online indicator */}
                  <div className="relative flex items-center justify-center w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs shadow-sm ring-2 ring-blue-500/20">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs" />
                  </div>

                  {/* Name and role visible on sm+ screens */}
                  <div className="hidden sm:flex flex-col text-left max-w-[90px] md:max-w-[120px]">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                      {activeSession.name}
                    </span>
                    <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                      {activeSession.roleLabel}
                    </span>
                  </div>

                  <ChevronDown className={`hidden sm:block w-3 h-3 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Popover */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden p-2 space-y-1 animate-fade-in">
                    {/* User Info Header Card */}
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold shrink-0 shadow-sm">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {activeSession.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {activeSession.roleLabel}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Portal Link */}
                    <Link
                      to={activeSession.dashboardPath}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                          <LayoutDashboard className="w-3.5 h-3.5" />
                        </span>
                        <span>Dashboard Portal</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                    {/* Logout Action */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        activeSession.logoutHandler();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer"
                    >
                      <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <LogOut className="w-3.5 h-3.5" />
                      </span>
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" ref={signInRef}>
                <button
                  onClick={() => {
                    setIsSignInOpen(!isSignInOpen);
                    setIsNotificationsOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
                  aria-label="Toggle Portal Sign In Menu"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Portal Sign In</span>
                  <span className="inline sm:hidden">Sign In</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-blue-200 transition-transform duration-200 ${isSignInOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Portals List (Active on Click/Tap & Hover) */}
                {isSignInOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden p-1.5 space-y-1 animate-fade-in">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Official Access Portals
                    </div>
                    <Link
                      to="/admin/login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover/item:bg-indigo-600 group-hover/item:text-white transition">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">Admin Login</p>
                        <p className="text-[10px] text-slate-400 font-medium">Central admin portal</p>
                      </div>
                    </Link>
                    <Link
                      to="/super-coordinator/login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover/item:bg-amber-500 group-hover/item:text-slate-950 transition">
                        <Crown className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">Super Coordinator</p>
                        <p className="text-[10px] text-slate-400 font-medium">President & host console</p>
                      </div>
                    </Link>
                    <Link
                      to="/college-head/login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover/item:bg-emerald-600 group-hover/item:text-white transition">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">College Head Login</p>
                        <p className="text-[10px] text-slate-400 font-medium">College contingents desk</p>
                      </div>
                    </Link>
                    <Link
                      to="/coordinator/login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover/item:bg-orange-500 group-hover/item:text-white transition">
                        <Shield className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">Sport Coordinator</p>
                        <p className="text-[10px] text-slate-400 font-medium">Score controllers desk</p>
                      </div>
                    </Link>
                    <Link
                      to="/pr-login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover/item:bg-cyan-600 group-hover/item:text-white transition">
                        <Camera className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">PR & Media Desk</p>
                        <p className="text-[10px] text-slate-400 font-medium">Gallery upload desk</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
