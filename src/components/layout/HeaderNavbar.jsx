import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Trophy, Bell, Clock, User, ShieldCheck, 
  Menu, X, Sparkles, CheckCircle2, ChevronRight, LogOut, Camera,
  ChevronDown, Building2, Shield, LayoutDashboard, Crown
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [, setAuthTick] = useState(0);

  const { user, logout } = useAuth();
  const { announcements } = useSportsData();

  useEffect(() => {
    const handleAuthChange = () => setAuthTick((t) => t + 1);
    window.addEventListener('sems-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('sems-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

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

  // Check active session across all user roles (Admin, Student, College Head, Sport Coordinator, PR Coordinator, Super Coordinator)
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

            {/* Right Quick Actions Bar */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Date & Time Widget (Desktop) */}
              <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>{formattedDate}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-bold text-slate-900 dark:text-white">{formattedTime}</span>
              </div>

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

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Profile / Dashboard OR Portal Sign In */}
              {activeSession ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={activeSession.dashboardPath}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 text-orange-300" />
                    <span className="max-w-[110px] truncate">{activeSession.name}</span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-white/20 text-white">
                      {activeSession.roleLabel}
                    </span>
                  </Link>

                  <button
                    onClick={activeSession.logoutHandler}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs transition cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer">
                    <User className="w-3.5 h-3.5" />
                    <span>Portal Sign In</span>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-200 group-hover:rotate-180 transition-transform duration-200" />
                  </button>
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col overflow-hidden p-1.5 space-y-1">
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Official Access Portals
                    </div>
                    <Link
                      to="/admin/login"
                      className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-3 group/item"
                    >
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover/item:bg-indigo-600 group-hover/item:text-white transition">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">Admin Login</p>
                        <p className="text-[10px] text-slate-400 font-medium">Central admin management portal</p>
                      </div>
                    </Link>
                    <Link
                      to="/super-coordinator/login"
                      className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-3 group/item"
                    >
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover/item:bg-amber-500 group-hover/item:text-slate-950 transition">
                        <Crown className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">Super Coordinator</p>
                        <p className="text-[10px] text-slate-400 font-medium">President & overall host console</p>
                      </div>
                    </Link>
                    <Link
                      to="/college-head/login"
                      className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-3 group/item border-t border-slate-100 dark:border-slate-800/60"
                    >
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover/item:bg-emerald-600 group-hover/item:text-white transition">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">College Head Login</p>
                        <p className="text-[10px] text-slate-400 font-medium">Faculty college stats & medals</p>
                      </div>
                    </Link>
                    <Link
                      to="/coordinator/login"
                      className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-3 group/item border-t border-slate-100 dark:border-slate-800/60"
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
                      className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-3 group/item border-t border-slate-100 dark:border-slate-800/60"
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

            </div>

          </div>
        </div>
      </header>
    </>
  );
};
