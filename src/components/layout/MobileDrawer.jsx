import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, Trophy, Calendar, Award, Newspaper, Image, Info, 
  UserCheck, Flame, Radio, BarChart3, LayoutDashboard, Camera,
  Building2, Shield, LogOut, Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { galleryApi } from '../../services/galleryApi';
import { collegeHeadApi } from '../../services/collegeHeadApi';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';

export const MobileDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [, setAuthTick] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => setAuthTick((t) => t + 1);
    window.addEventListener('sems-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('sems-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Keyboard accessibility: close drawer on Escape press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
          onClose();
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
          onClose();
          navigate('/');
        }
      };
    }
    if (user) {
      return {
        name: user.name || 'User Profile',
        roleLabel: user.role === 'admin' ? 'Admin' : 'Athlete',
        dashboardPath: '/dashboard',
        logoutHandler: () => {
          logout();
          onClose();
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
          onClose();
          navigate('/');
        }
      };
    }
    if (coordinatorApi.isAuthenticated()) {
      const coordUser = coordinatorApi.getCurrentUser();
      return {
        name: coordUser?.coordinatorName || coordUser?.sportName || 'Coordinator',
        roleLabel: 'Sport Coordinator',
        dashboardPath: getSportRoute(coordUser?.assignedSport),
        logoutHandler: () => {
          coordinatorApi.logout();
          onClose();
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
          onClose();
          navigate('/');
        }
      };
    }
    return null;
  };

  const activeSession = getActiveSession();

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 xl:hidden flex font-spatial-sans">
      {/* Backdrop Overlay */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-[#070A13]/70 backdrop-blur-xs transition-opacity duration-200" 
        aria-hidden="true"
      />

      {/* Drawer Container Panel */}
      <div className="relative w-[280px] max-w-[85vw] bg-[#FAF9F6] dark:bg-[#070A13] border-r border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] h-full flex flex-col z-10 shadow-2xl p-4 overflow-y-auto custom-scrollbar transition-transform duration-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
          <Link to="/" onClick={onClose} className="flex items-center">
            <img 
              src="/apex-nav-logo-dark.png" 
              alt="APEX Logo" 
              className="hidden dark:block h-8 sm:h-9 w-auto object-contain"
            />
            <img 
              src="/apex-nav-logo.png" 
              alt="APEX Logo" 
              className="block dark:hidden h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          <button 
            onClick={onClose} 
            className="p-2 text-[#686370] hover:text-[#211D2B] dark:text-[#AAA4B8] dark:hover:text-white rounded-lg bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close mobile navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Session Banner */}
        {activeSession ? (
          <div className="my-4 p-3 rounded-lg bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
            <div className="text-[10px] font-black uppercase text-[#686370] dark:text-[#AAA4B8]">Logged in as</div>
            <div className="font-bold text-[#7156A5] dark:text-[#B8A5E5] text-xs mt-0.5 truncate">
              {activeSession.name} <span className="text-[10px] text-[#686370] dark:text-[#AAA4B8] font-normal">({activeSession.roleLabel})</span>
            </div>
            
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
              <Link
                to={activeSession.dashboardPath}
                onClick={onClose}
                className="flex-1 min-h-[40px] px-3 rounded-lg bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={activeSession.logoutHandler}
                className="min-h-[40px] px-2.5 rounded-lg bg-[#FBEDEF] hover:bg-[#B71C1C] dark:bg-[rgba(225,29,72,0.15)] text-[#B71C1C] dark:text-[#FDA4AF] hover:text-white border border-[#FFCDD2] dark:border-[rgba(225,29,72,0.3)] text-xs font-bold transition cursor-pointer flex items-center justify-center"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Navigation Items List */}
        <div className="space-y-1 flex-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 min-h-[44px] rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#F4F2F7] dark:bg-[rgba(184,165,229,0.1)] text-[#7156A5] dark:text-[#B8A5E5] border-l-3 border-[#7156A5] dark:border-[#8B5CF6] font-bold'
                      : 'text-[#211D2B] dark:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-[#686370] dark:text-[#AAA4B8]" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FBEDEF] text-[#B71C1C] dark:bg-[rgba(225,29,72,0.18)] dark:text-[#FDA4AF] border border-[#FFCDD2] dark:border-[rgba(225,29,72,0.3)]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};
