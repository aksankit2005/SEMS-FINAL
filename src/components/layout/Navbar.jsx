import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Trophy, User, ShieldCheck, Sparkles, LayoutDashboard, LogOut, ChevronDown, Building2, Shield, Camera, Compass } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { MobileDrawer } from './MobileDrawer';
import { useAuth } from '../../context/AuthContext';
import { collegeHeadApi } from '../../services/collegeHeadApi';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';

import { galleryApi } from '../../services/galleryApi';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const signInRef = useRef(null);
  const profileRef = useRef(null);
  const { user, logout } = useAuth();
  const [, setAuthTick] = useState(0);

  // Close dropdown on route change
  useEffect(() => {
    setIsSignInOpen(false);
    setIsMobileOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Click / Touch outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
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
        roleLabel: user.role === 'admin' ? 'Admin' : 'Profile / Dashboard',
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
        roleLabel: 'PR Coordinator',
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

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Live Matches', path: '/live', badge: 'LIVE' },
    { name: 'Registration', path: '/registration' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'Results', path: '/results' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Announcements', path: '/announcements' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'About Us', path: '/about' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-transparent backdrop-blur-md border-b border-transparent transition-all duration-300">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img
                src="/logo-dark.png"
                alt="APEX Logo"
                className="hidden dark:block h-9 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <img
                src="/logo-light.png"
                alt="APEX Logo"
                className="block dark:hidden h-9 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `relative px-3 py-2 text-xs font-semibold tracking-wide transition-colors duration-200 flex items-center gap-1.5 ${isActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`
                  }
                >
                  {link.name}
                  {link.badge && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                  )}
                </NavLink>
              ))}

              {/* APEX Journey Timeline Link with Glowing Purple Badge */}
              <Link
                to="/journey"
                className="px-2.5 py-1.5 rounded-xl text-xs font-black tracking-wide text-purple-500 dark:text-purple-400 bg-purple-500/10 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/20 flex items-center gap-1.5 transition-all ml-1"
                title="APEX Legacy & Journey Timeline"
              >
                <Compass className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                <span>JOURNEY</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase bg-purple-600 text-white shadow-[0_0_8px_#9333ea]">
                  TIMELINE
                </span>
              </Link>
            </nav>

            {/* Actions: Theme Toggle, Auth / Dashboard */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <ThemeToggle />

              {/* User Profile / Log Out OR Login Button */}
              {activeSession ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsSignInOpen(false);
                    }}
                    className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 dark:from-blue-500/15 dark:via-indigo-500/15 dark:to-purple-500/15 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/30 hover:border-blue-500/60 transition cursor-pointer active:scale-95"
                    aria-label="User Profile Menu"
                    title={activeSession.name}
                  >
                    <div className="relative flex items-center justify-center w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs shadow-sm ring-2 ring-blue-500/20">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs" />
                    </div>

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

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden p-2 space-y-1 animate-fade-in">
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
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

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
                <div className="relative group" ref={signInRef}>
                  <button 
                    onClick={() => setIsSignInOpen(!isSignInOpen)}
                    className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Portal Sign In</span>
                    <span className="inline xs:hidden">Login</span>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-200 group-hover:rotate-180 transition-transform duration-200" />
                  </button>
                  <div className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-60 max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl transition-all duration-200 z-50 flex flex-col overflow-hidden p-1.5 space-y-1 ${
                    isSignInOpen
                      ? 'opacity-100 visible'
                      : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                  }`}>
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Official Access Portals
                    </div>
                    <Link
                      to="/college-head/login"
                      className="px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 group/item"
                    >
                      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover/item:bg-blue-600 group-hover/item:text-white transition">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">College Head Login</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Faculty college stats & medals</p>
                      </div>
                    </Link>
                    <Link
                      to="/coordinator/login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 group/item border-t border-slate-100 dark:border-slate-800/60"
                    >
                      <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover/item:bg-orange-600 group-hover/item:text-white transition">
                        <Shield className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">Coordinator Login</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sport matches & control panel</p>
                      </div>
                    </Link>
                    <Link
                      to="/pr-login"
                      onClick={() => setIsSignInOpen(false)}
                      className="px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 group/item border-t border-slate-100 dark:border-slate-800/60"
                    >
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover/item:bg-indigo-600 group-hover/item:text-white transition">
                        <Camera className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">PR Portal Login</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Media, gallery & album coverage</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileOpen(true)}
                className="xl:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-500 transition"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </>
  );
};
