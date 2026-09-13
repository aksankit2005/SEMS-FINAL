import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, LogOut, Key, User, Crown, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ThemeToggle } from '../common/ThemeToggle';

export const SuperCoordinatorNavbar = ({ onRefresh, activeTab, setActiveTab, onOpenPasswordModal }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addToast } = useToast();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('sems_super_coord_token');
    localStorage.removeItem('sems_super_coord_user');
    window.dispatchEvent(new Event('sems-auth-change'));
    addToast('Logged out of Super Coordinator Portal', 'info');
    navigate('/');
  };

  const superCoordUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('sems_super_coord_user') || '{}');
    } catch {
      return {};
    }
  })();
  const superCoordName = superCoordUser?.name || 'Super Coordinator Console';

  return (
    <nav className="sticky top-0 z-40 bg-[#FFFFFF]/80 dark:bg-[#070A13]/80 backdrop-blur-md border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] font-spatial-sans shadow-xs transition-colors duration-200 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between min-h-[3.75rem] py-2 sm:py-0 sm:h-20 gap-2 sm:gap-4">

          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#7156A5] to-[#8B5CF6] p-0.5 shadow-md flex items-center justify-center text-white shrink-0">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-base font-bold font-spatial-display uppercase tracking-wider text-[#211D2B] dark:text-[#F5F2FA] block truncate" title={superCoordName}>
                {superCoordName}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#7156A5] dark:text-[#B8A5E5] uppercase tracking-wide block truncate">
                President & Host Control Console
              </span>
            </div>
          </div>

          {/* User Controls & Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-nowrap font-spatial-sans">

            {/* Go to Home Page Button */}
            <button
              onClick={() => navigate('/')}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#181D30] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0"
              title="Go to Home Page"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7156A5] dark:text-[#B8A5E5]" />
              <span className="hidden sm:inline">Go to Home</span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#181D30] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7156A5] dark:text-[#B8A5E5]" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Profile Tab Button */}
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shrink-0 ${activeTab === 'profile'
                    ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white border-transparent shadow-md shadow-purple-500/20'
                    : 'bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#181D30] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA]'
                  }`}
                title="Super Coordinator Profile"
              >
                <User className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'profile' ? 'text-white' : 'text-[#7156A5] dark:text-[#B8A5E5]'}`} />
                <span className="hidden sm:inline">Profile</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#FBEDEF] dark:bg-[#2B0E14] hover:bg-[#FCE4EC] dark:hover:bg-[#3D141D] border border-[#FFCDD2] dark:border-[#541B26] text-[#B71C1C] dark:text-[#FDA4AF] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B71C1C] dark:text-[#FDA4AF]" />
              <span className="text-[11px] sm:text-xs">Logout</span>
            </button>

          </div>

        </div>
      </div>
    </nav>
  );
};
