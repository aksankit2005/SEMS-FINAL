import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  LayoutDashboard,
  User,
  ClipboardList,
  FolderGit2,
  Users,
  Megaphone,
  Database,
  Trophy,
  History,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Bell,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = adminApi.getCurrentUser();

  const handleLogout = () => {
    adminApi.logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', alias: '/admin', icon: LayoutDashboard },
    { label: 'Registrations', path: '/admin/registrations', icon: ClipboardList },
    { label: 'PR Management', path: '/admin/pr-management', icon: FolderGit2 },
    { label: 'Coordinators', path: '/admin/coordinators', icon: Users },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'Master Data', path: '/admin/master-data', icon: Database },
    { label: 'Committee & Advisors', path: '/admin/committee', icon: GraduationCap },
    { label: 'Results & Leaderboard', path: '/admin/results', icon: Trophy },
    { label: 'Activity Logs', path: '/admin/activity', icon: History },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const currentNavItem = navItems.find(
    (item) => location.pathname === item.path || (item.alias && location.pathname === item.alias)
  ) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight tracking-tight">APEX ADMIN</h1>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Central Admin Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path || (item.alias && location.pathname === item.alias);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-l-4 border-amber-500 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 text-amber-500" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 mb-3 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 p-0.5 shrink-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name || 'Admin'}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'admin@mpec.ac.in'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-200 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {currentNavItem.label}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Manage and monitor central sports fest operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* System Activity Logs Link */}
            <Link
              to="/admin/activity"
              title="System Activity & Audit Logs"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="View Activity Logs"
            >
              <Bell className="w-5 h-5" />
            </Link>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* User Badge */}
            <div className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 select-none">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[10px]">
                AD
              </div>
              <span className="font-semibold hidden sm:inline">{user?.name?.split(' ')[0] || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
