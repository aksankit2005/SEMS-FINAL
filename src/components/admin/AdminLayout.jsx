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
  GraduationCap,
  Home
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
    <div className="admin-portal-root min-h-screen bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] flex font-spatial-sans antialiased relative selection:bg-[#7156A5]/20 selection:text-[#211D2B] dark:selection:text-white transition-colors duration-200">
      {/* Dark Mode Celestial Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-50 dark:block hidden" />
      <div className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 dark:block hidden" />

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 sm:w-64 max-w-[85vw] bg-[#FFFFFF]/95 dark:bg-[#0D101A]/95 backdrop-blur-xl border-r border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-spatial-display font-bold text-base text-[#211D2B] dark:text-[#F5F2FA] leading-tight tracking-wider uppercase">
                APEX <span className="text-[#7156A5] dark:text-[#B8A5E5]">ADMIN</span>
              </h1>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#7156A5] dark:text-[#B8A5E5] bg-[#F4F2F7] dark:bg-[#121625] px-2 py-0.5 rounded border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] inline-block mt-0.5 font-mono">
                Central Admin Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] p-1 rounded-lg hover:bg-[#F4F2F7] dark:hover:bg-[#121625]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8B8599] font-mono">
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
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#7156A5]/10 dark:bg-[rgba(184,165,229,0.12)] text-[#7156A5] dark:text-[#B8A5E5] border-l-3 border-[#7156A5] dark:border-[#8B5CF6] font-bold shadow-2xs'
                    : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-[#7156A5] dark:text-[#B8A5E5]' : 'text-[#8B8599] group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5]'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5]" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout Button */}
        <div className="p-4 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] bg-[#FAF9F6]/50 dark:bg-[#0D101A]/60 shrink-0">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] mb-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#7156A5]/10 dark:bg-[rgba(184,165,229,0.12)] border border-[#7156A5]/20 text-[#7156A5] dark:text-[#B8A5E5] font-bold flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[#7156A5] dark:text-[#B8A5E5]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#211D2B] dark:text-[#F5F2FA] truncate">{user?.name || 'System Administrator'}</p>
              <p className="text-[10px] text-[#686370] dark:text-[#AAA4B8] truncate font-mono">{user?.email || 'sports@mpgi.edu.in'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-[#B71C1C] dark:text-[#FDA4AF] hover:text-white dark:hover:text-white bg-[#FBEDEF] hover:bg-[#B71C1C] dark:bg-[rgba(225,29,72,0.14)] dark:hover:bg-[#B71C1C] border border-[#FFCDD2] dark:border-[rgba(225,29,72,0.3)] transition-all duration-200 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden relative z-10">
        {/* Header Bar */}
        <header className="h-16 bg-[#FFFFFF]/80 dark:bg-[#070A13]/80 backdrop-blur-md border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 font-spatial-sans w-full">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] rounded-lg hover:bg-[#F4F2F7] dark:hover:bg-[#121625] transition-colors cursor-pointer shrink-0"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA] leading-tight uppercase tracking-wide truncate">
                {currentNavItem.label}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#686370] dark:text-[#AAA4B8] hidden md:block truncate">
                Central Championship Fest Operations & Intelligence Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Go to Home Page Button */}
            <Link
              to="/"
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#181D30] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0"
              title="Go to Home Page"
            >
              <Home className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5]" />
              <span className="hidden sm:inline">Portal Home</span>
            </Link>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* System Activity Logs Link */}
            <Link
              to="/admin/activity"
              title="System Activity & Audit Logs"
              className="p-1.5 sm:p-2 text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] rounded-lg hover:bg-[#F4F2F7] dark:hover:bg-[#121625] transition-colors shrink-0"
              aria-label="View Activity Logs"
            >
              <Bell className="w-4 h-4 text-[#7156A5] dark:text-[#B8A5E5]" />
            </Link>

            <div className="h-5 w-px bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.16)] hidden sm:block" />

            {/* User Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-xs text-[#211D2B] dark:text-[#F5F2FA] select-none shrink-0">
              <div className="w-5 h-5 rounded-full bg-[#7156A5] dark:bg-[#8B5CF6] text-white font-bold flex items-center justify-center text-[9px]">
                AD
              </div>
              <span className="font-semibold text-xs hidden sm:inline">{user?.name?.split(' ')[0] || 'Admin'}</span>
            </div>
          </div>
        </header>
        {/* Main Content Body */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto font-spatial-sans relative z-10 flex flex-col w-full min-w-0">
          <div className="flex-1 w-full min-w-0">
            <Outlet />
          </div>

          {/* Admin Footer */}
          <footer className="mt-8 sm:mt-12 pt-4 sm:pt-6 pb-2 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="font-spatial-display italic text-xs sm:text-sm tracking-wide text-[#686370] dark:text-[#AAA4B8]">
              “It’s what you learn after you think you know it all that really counts”
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#8B8599] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7156A5] dark:bg-[#8B5CF6]" />
              <span>APEX 2026 Admin Console</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
