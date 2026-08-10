import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import {
  LayoutDashboard,
  User,
  ClipboardList,
  FolderGit2,
  Users,
  Megaphone,
  Database,
  Trophy,
  Swords,
  History,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Bell,
  Search,
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
    { label: 'Profile', path: '/admin/profile', icon: User },
    { label: 'Registrations', path: '/admin/registrations', icon: ClipboardList },
    { label: 'PR Management', path: '/admin/pr-management', icon: FolderGit2 },
    { label: 'Coordinators', path: '/admin/coordinators', icon: Users },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'Master Data', path: '/admin/master-data', icon: Database },
    { label: 'Committee & Advisors', path: '/admin/committee', icon: GraduationCap },
    { label: 'Results & Leaderboard', path: '/admin/results', icon: Trophy },
    { label: 'Coordinator Results', path: '/admin/coordinator-results', icon: Swords },
    { label: 'Activity Logs', path: '/admin/activity', icon: History },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const currentNavItem = navItems.find(
    (item) => location.pathname === item.path || (item.alias && location.pathname === item.alias)
  ) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white leading-tight tracking-tight">SEMS ADMIN</h1>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Central Admin Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-purple-600 text-white shadow-lg shadow-amber-500/20 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout Button */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 p-0.5 shrink-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name || 'Admin'}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@mpec.ac.in'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-200 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                {currentNavItem.label}
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Manage and monitor central sports fest operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 w-56 focus-within:w-64 focus-within:border-amber-500/50 transition-all">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search portal..."
                className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-xs w-full"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* User Profile Pill */}
            <Link
              to="/admin/profile"
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                AD
              </div>
              <span className="font-semibold hidden sm:inline">{user?.name?.split(' ')[0] || 'Admin'}</span>
            </Link>
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
