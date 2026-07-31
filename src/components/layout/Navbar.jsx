import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Search, Menu, Trophy, User, ShieldCheck, Sparkles, LayoutDashboard, LogOut } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { QuickSearchModal } from '../common/QuickSearchModal';
import { MobileDrawer } from './MobileDrawer';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, setIsAuthModalOpen, logout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Sports', path: '/sports' },
    { name: 'Live Matches', path: '/live', badge: 'LIVE' },
    { name: 'Registration', path: '/registration' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'Results', path: '/results' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Coordinators', path: '/coordinators' },
    { name: 'Announcements', path: '/announcements' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
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
                    `relative px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 font-bold'
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

            {/* Actions: Search, Theme Toggle, Auth / Dashboard */}
            <div className="flex items-center gap-2.5">
              {/* Quick Search Command Trigger */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs border border-slate-200 dark:border-slate-700/60 transition shadow-sm"
                title="Search (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="font-medium">Search...</span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Ctrl K
                </kbd>
              </button>

              <ThemeToggle />

              {/* User Dashboard / Log Out / Login Button */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all"
                  >
                    {user.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                    ) : (
                      <LayoutDashboard className="w-4 h-4" />
                    )}
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs transition"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Portal Sign In</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileOpen(true)}
                className="xl:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-500 transition"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Modals & Drawers */}
      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileDrawer isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </>
  );
};
