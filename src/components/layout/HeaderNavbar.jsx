import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Search, Bell, Clock, User, ShieldCheck, 
  Menu, X, Sparkles, CheckCircle2, ChevronRight, LogOut, Camera 
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { QuickSearchModal } from '../common/QuickSearchModal';
import { useAuth } from '../../context/AuthContext';
import { useSportsData } from '../../context/SportsDataContext';
import { galleryApi } from '../../services/galleryApi';

export const HeaderNavbar = ({ onOpenMobileDrawer }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { user, setIsAuthModalOpen, logout } = useAuth();
  const { announcements } = useSportsData();

  // Clock tick interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-navbar transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">

            {/* Left Brand Area */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={onOpenMobileDrawer}
                className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition"
                aria-label="Open mobile drawer"
              >
                <Menu className="w-5 h-5" />
              </button>

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
            </div>

            {/* Middle Search Bar Shortcut (Desktop) */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-xs font-medium transition shadow-sm group"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
                  <span>Search sports, fixtures, leaderboards...</span>
                </div>
                <kbd className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                  Ctrl K
                </kbd>
              </button>
            </div>

            {/* Right Quick Actions Bar */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Date & Time Widget (Desktop) */}
              <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>{formattedDate}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-bold text-slate-900 dark:text-white">{formattedTime}</span>
              </div>

              {/* Search Trigger for Mobile */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Notifications Dropdown Toggle */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {announcements.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                  )}
                </button>

                {/* Notifications Popover */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-500" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Tournament Broadcasts</h4>
                      </div>
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2.5 my-3 max-h-64 overflow-y-auto pr-1">
                      {announcements.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No active broadcasts</p>
                      ) : (
                        announcements.slice(0, 3).map((ann) => (
                          <Link
                            key={ann.id}
                            to="/announcements"
                            onClick={() => setIsNotificationsOpen(false)}
                            className="block p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-slate-800/80 transition"
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1">
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

              {/* PR Portal Link - Only visible when PR user is logged in */}
              {galleryApi.isPRAuthenticated() && (
                <Link
                  to="/pr-dashboard"
                  className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition flex items-center gap-1.5"
                  title="PR Coordinator Portal"
                >
                  <Camera className="w-4 h-4 text-orange-500" />
                  <span className="hidden xl:inline text-xs font-bold">PR Dashboard</span>
                </Link>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Profile / Log Out / Portal Sign In */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
                  >
                    {user.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-orange-300" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs transition"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Portal Sign In</span>
                </button>
              )}

            </div>

          </div>
        </div>
      </header>

      {/* Global Quick Search Dialog */}
      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
