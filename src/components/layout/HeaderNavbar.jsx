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
  const [isScrolled, setIsScrolled] = useState(false);
  const [, setAuthTick] = useState(0);

  const notificationRef = useRef(null);
  const signInRef = useRef(null);
  const profileRef = useRef(null);

  const { user, logout } = useAuth();
  const { announcements } = useSportsData();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const isTransparentOverHero = isHomePage && !isScrolled;

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
    <header
      className={`${
        isHomePage
          ? isScrolled
            ? 'fixed top-0 left-0 right-0 z-40 w-full bg-[#FAF9F6]/30 dark:bg-[#070A13]/30 backdrop-blur-md border-b border-[#E5E1E8]/40 dark:border-[rgba(184,165,229,0.12)] shadow-sm'
            : 'fixed top-0 left-0 right-0 z-40 w-full bg-transparent border-b border-transparent backdrop-blur-none'
          : 'sticky top-0 z-40 w-full bg-transparent backdrop-blur-md border-b border-transparent'
      } transition-all duration-300 font-spatial-sans`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 lg:gap-4">

          {/* Left Brand & Mobile Toggle Area */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mobile / Tablet Drawer Trigger (Hidden on Desktop XL+) */}
            <button
              onClick={onOpenMobileDrawer}
              className={`xl:hidden p-2 rounded-lg transition cursor-pointer active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isTransparentOverHero
                  ? 'bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/50 hover:text-white'
                  : 'bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] hover:text-[#7156A5] dark:hover:text-[#B8A5E5]'
              }`}
              aria-label="Open mobile navigation menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* APEX Logo */}
            <Link to="/" className="flex items-center group shrink-0 pr-1">
              {isTransparentOverHero ? (
                <img 
                  src="/apex-nav-logo-dark.png" 
                  alt="APEX Logo" 
                  className="h-8 sm:h-9 lg:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <>
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
                </>
              )}
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-1.5 overflow-x-auto no-scrollbar py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => {
                    if (isTransparentOverHero) {
                      return `relative px-2.5 2xl:px-3 py-1.5 text-xs 2xl:text-[13px] font-semibold tracking-tight transition-all duration-150 flex items-center gap-1.5 shrink-0 rounded-md ${
                        isActive
                          ? 'text-white font-bold bg-white/20 backdrop-blur-md border border-white/30 shadow-xs'
                          : 'text-white/85 hover:text-white hover:bg-white/10'
                      }`;
                    }
                    return `relative px-2.5 2xl:px-3 py-1.5 text-xs 2xl:text-[13px] font-semibold tracking-tight transition-colors duration-150 flex items-center gap-1.5 shrink-0 rounded-md ${
                      isActive
                        ? 'text-[#7156A5] dark:text-[#B8A5E5] font-bold bg-[#F4F2F7] dark:bg-[rgba(184,165,229,0.08)]'
                        : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#F4F2F7]/60 dark:hover:bg-[rgba(184,165,229,0.04)]'
                    }`;
                  }}
                >
                  <Icon className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 shrink-0 opacity-80 group-hover:opacity-100" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className={
                      isTransparentOverHero
                        ? 'px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/40 backdrop-blur-sm'
                        : 'px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FBEDEF] text-[#B71C1C] dark:bg-[rgba(225,29,72,0.18)] dark:text-[#FDA4AF] border border-[#FFCDD2] dark:border-[rgba(225,29,72,0.3)]'
                    }>
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
                className={`relative p-2 rounded-lg transition cursor-pointer active:scale-95 ${
                  isTransparentOverHero
                    ? 'bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/50 hover:text-white'
                    : 'bg-white dark:bg-[#0D101A] text-[#211D2B] dark:text-[#F5F2FA] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]'
                }`}
                title="Notifications"
                aria-label="View Broadcast Announcements"
              >
                <Bell className="w-4 h-4" />
                {announcements.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#B71C1C] dark:bg-[#FDA4AF] ring-2 ring-white dark:ring-[#070A13]" />
                )}
              </button>

              {/* Notifications Popover: Mobile Fixed Centered & Desktop Absolute Right */}
              {isNotificationsOpen && (
                <div className="fixed top-14 left-3 right-3 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-88 max-w-sm mx-auto bg-white dark:bg-[#0D101A] rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-xl p-3.5 z-50 animate-fade-in font-spatial-sans">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#7156A5] dark:text-[#B8A5E5]" />
                      <h4 className="font-bold text-xs text-[#211D2B] dark:text-[#F5F2FA] uppercase tracking-wider">Tournament Broadcasts</h4>
                    </div>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-1 text-[#686370] hover:text-[#211D2B] dark:text-[#AAA4B8] dark:hover:text-white rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 my-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {announcements.length === 0 ? (
                      <p className="text-xs text-[#686370] dark:text-[#AAA4B8] text-center py-4">No active broadcasts</p>
                    ) : (
                      announcements.slice(0, 4).map((ann) => (
                        <Link
                          key={ann.id}
                          to="/announcements"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="block p-2.5 rounded-md bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#181D30] border border-transparent hover:border-[#E5E1E8] dark:hover:border-[rgba(184,165,229,0.16)] transition"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#7156A5] dark:text-[#B8A5E5] mb-0.5">
                            <span>{ann.category}</span>
                            <span className="text-[#686370] dark:text-[#AAA4B8] font-normal">{ann.date}</span>
                          </div>
                          <h5 className="text-xs font-bold text-[#211D2B] dark:text-[#F5F2FA] line-clamp-1">{ann.title}</h5>
                          <p className="text-[11px] text-[#686370] dark:text-[#AAA4B8] line-clamp-1 mt-0.5">{ann.summary}</p>
                        </Link>
                      ))
                    )}
                  </div>

                  <Link
                    to="/announcements"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="block text-center text-xs font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline pt-2 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]"
                  >
                    View All Announcements →
                  </Link>
                </div>
              )}
            </div>

            {/* Theme Mode Toggle Button */}
            <ThemeToggle 
              className={isTransparentOverHero ? "p-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/50" : undefined}
            />

            {/* User Session Profile Avatar Menu OR Portal Sign In */}
            {activeSession ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotificationsOpen(false);
                    setIsSignInOpen(false);
                  }}
                  className={`flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg transition cursor-pointer active:scale-95 ${
                    isTransparentOverHero
                      ? 'bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/50'
                      : 'bg-white dark:bg-[#0D101A] hover:bg-[#F4F2F7] dark:hover:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA]'
                  }`}
                  aria-label="User Profile Menu"
                  title={activeSession.name}
                >
                  {/* Profile Avatar with online indicator */}
                  <div className="relative flex items-center justify-center w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-[#7156A5] dark:bg-[#8B5CF6] text-white font-black text-xs shadow-xs">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#070A13]" />
                  </div>

                  {/* Name and role visible on sm+ screens */}
                  <div className="hidden sm:flex flex-col text-left max-w-[90px] md:max-w-[120px]">
                    <span className={`text-xs font-bold truncate leading-tight ${isTransparentOverHero ? 'text-white' : 'text-[#211D2B] dark:text-[#F5F2FA]'}`}>
                      {activeSession.name}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-wider ${isTransparentOverHero ? 'text-[#F3D78A]' : 'text-[#7156A5] dark:text-[#B8A5E5]'}`}>
                      {activeSession.roleLabel}
                    </span>
                  </div>

                  <ChevronDown className={`hidden sm:block w-3 h-3 transition-transform duration-200 ${
                    isTransparentOverHero ? 'text-white/80' : 'text-[#686370] dark:text-[#AAA4B8]'
                  } ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Popover */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] rounded-lg shadow-xl z-50 overflow-hidden p-2 space-y-1 animate-fade-in font-spatial-sans">
                    {/* User Info Header Card */}
                    <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#7156A5] dark:bg-[#8B5CF6] text-white font-bold shrink-0">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#211D2B] dark:text-[#F5F2FA] truncate">
                          {activeSession.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#F4F2F7] dark:bg-[rgba(184,165,229,0.1)] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]">
                            {activeSession.roleLabel}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Portal Link */}
                    <Link
                      to={activeSession.dashboardPath}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-md bg-[#F4F2F7] dark:bg-[rgba(184,165,229,0.1)] text-[#7156A5] dark:text-[#B8A5E5] group-hover:bg-[#7156A5] group-hover:text-white transition">
                          <LayoutDashboard className="w-3.5 h-3.5" />
                        </span>
                        <span>Dashboard Portal</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#686370] dark:text-[#AAA4B8] group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <div className="my-1 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]" />

                    {/* Logout Action */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        activeSession.logoutHandler();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold text-[#B71C1C] dark:text-[#FDA4AF] hover:bg-[#FBEDEF] dark:hover:bg-[rgba(225,29,72,0.1)] transition cursor-pointer"
                    >
                      <span className="p-1.5 rounded-md bg-[#FBEDEF] dark:bg-[rgba(225,29,72,0.15)] text-[#B71C1C] dark:text-[#FDA4AF]">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-semibold text-xs transition cursor-pointer active:scale-95 ${
                    isTransparentOverHero
                      ? 'bg-[#7156A5] hover:bg-[#5E458B] text-white shadow-md border border-white/20 backdrop-blur-md'
                      : 'bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white'
                  }`}
                  aria-label="Toggle Portal Sign In Menu"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Portal Sign In</span>
                  <span className="inline sm:hidden">Sign In</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${isSignInOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Portals List (Active on Click/Tap & Hover) */}
                {isSignInOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] rounded-lg shadow-xl z-50 flex flex-col overflow-hidden p-1.5 space-y-1 animate-fade-in font-spatial-sans">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8]">
                      Official Access Portals
                    </div>
                    <Link
                      to="/admin/login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625] rounded-md transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-md bg-[#F4F2F7] dark:bg-[rgba(184,165,229,0.1)] text-[#7156A5] dark:text-[#B8A5E5] group-hover/item:bg-[#7156A5] group-hover/item:text-white transition">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-[#211D2B] dark:text-[#F5F2FA]">Admin Login</p>
                        <p className="text-[10px] text-[#686370] dark:text-[#AAA4B8] font-normal">Central admin portal</p>
                      </div>
                    </Link>
                    <Link
                      to="/super-coordinator/login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625] rounded-md transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-md bg-[#F4F2F7] dark:bg-[rgba(210,171,69,0.15)] text-[#A98B57] dark:text-[#D2AB45] group-hover/item:bg-[#A98B57] group-hover/item:text-white transition">
                        <Crown className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-[#211D2B] dark:text-[#F5F2FA]">Super Coordinator</p>
                        <p className="text-[10px] text-[#686370] dark:text-[#AAA4B8] font-normal">President & host console</p>
                      </div>
                    </Link>
                    <Link
                      to="/college-head/login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625] rounded-md transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-md bg-[#EDF7F0] dark:bg-emerald-500/10 text-[#1B5E20] dark:text-emerald-400 group-hover/item:bg-emerald-600 group-hover/item:text-white transition">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-[#211D2B] dark:text-[#F5F2FA]">College Head Login</p>
                        <p className="text-[10px] text-[#686370] dark:text-[#AAA4B8] font-normal">College contingents desk</p>
                      </div>
                    </Link>
                    <Link
                      to="/coordinator/login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625] rounded-md transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-md bg-[#FBEDEF] dark:bg-orange-500/10 text-[#B71C1C] dark:text-orange-400 group-hover/item:bg-orange-500 group-hover/item:text-white transition">
                        <Shield className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-[#211D2B] dark:text-[#F5F2FA]">Sport Coordinator</p>
                        <p className="text-[10px] text-[#686370] dark:text-[#AAA4B8] font-normal">Score controllers desk</p>
                      </div>
                    </Link>
                    <Link
                      to="/pr-login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625] rounded-md transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-md bg-[#F4F2F7] dark:bg-cyan-500/10 text-[#596B98] dark:text-cyan-400 group-hover/item:bg-cyan-600 group-hover/item:text-white transition">
                        <Camera className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-[#211D2B] dark:text-[#F5F2FA]">PR & Media Desk</p>
                        <p className="text-[10px] text-[#686370] dark:text-[#AAA4B8] font-normal">Gallery upload desk</p>
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
