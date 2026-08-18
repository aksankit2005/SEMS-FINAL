import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Trophy, User, ShieldCheck, Sparkles, LayoutDashboard, LogOut, ChevronDown, Building2, Shield, Camera } from 'lucide-react';
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
  const signInRef = useRef(null);
  const { user, logout } = useAuth();
  const [, setAuthTick] = useState(0);

  // Close dropdown on route change
  useEffect(() => {
    setIsSignInOpen(false);
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Click / Touch outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (signInRef.current && !signInRef.current.contains(e.target)) {
        setIsSignInOpen(false);
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
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img
                src="/logo-dark.png"
                alt="APEX Logo"
                className="hidden dark:block h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <img
                src="/logo-light.png"
                alt="APEX Logo"
                className="block dark:hidden h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `relative px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 ${isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
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
            </nav>

            {/* Actions: Theme Toggle, Auth / Dashboard */}
            <div className="flex items-center gap-2.5">
              <ThemeToggle />

              {/* User Profile / Log Out OR Login Button */}
              {activeSession ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={activeSession.dashboardPath}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4 text-amber-300" />
                    <span className="max-w-[110px] truncate">{activeSession.name}</span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-white/20 text-white">
                      {activeSession.roleLabel}
                    </span>
                  </Link>
                  <button
                    onClick={activeSession.logoutHandler}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs transition cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
                    <User className="w-3.5 h-3.5" />
                    <span>Portal Sign In</span>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-200 group-hover:rotate-180 transition-transform duration-200" />
                  </button>
                  <div className={`absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl transition-all duration-200 z-50 flex flex-col overflow-hidden p-1.5 space-y-1 ${
                    isSignInOpen
                      ? 'opacity-100 visible'
                      : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                  }`}>
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                        <p className="text-[10px] text-slate-400 font-medium">Faculty college stats & medals</p>
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
                        <p className="text-[10px] text-slate-400 font-medium">Sport matches & control panel</p>
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
                        <p className="text-[10px] text-slate-400 font-medium">Media, gallery & album coverage</p>
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
