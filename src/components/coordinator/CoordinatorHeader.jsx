import React from 'react';
import { RefreshCw, LogOut, Calendar, Radio, Award, Users, Layers, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const OPERATIONAL_TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'events', label: 'Registration Events', icon: Layers },
  { id: 'schedule', label: 'Match Schedule', icon: Calendar },
  { id: 'live-control', label: 'Live Match Control', icon: Radio, badge: 'LIVE' },
  { id: 'results', label: 'Results Management', icon: Award },
  { id: 'participants', label: 'Participants List', icon: Users },
];

export const CoordinatorHeader = ({ user, activeTab, setActiveTab, onLogout }) => {
  const { addToast } = useToast();
  const [isLayoutHidden, setIsLayoutHidden] = React.useState(false);

  React.useEffect(() => {
    const handleLayoutToggle = (e) => {
      setIsLayoutHidden(Boolean(e.detail?.hide));
    };
    window.addEventListener('sems_layout_toggle', handleLayoutToggle);
    return () => window.removeEventListener('sems_layout_toggle', handleLayoutToggle);
  }, []);

  if (isLayoutHidden) return null;

  const handleSyncData = () => {
    window.dispatchEvent(new Event('sems-coordinator-sync'));
    window.dispatchEvent(new Event('storage'));
    addToast('Coordinator tournament data synced with database!', 'success');
  };

  const sportName = user?.sportName || 'Sport';

  return (
    <header className="w-full bg-[#FFFFFF]/80 dark:bg-[#070A13]/80 backdrop-blur-md border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] sticky top-0 z-30 shadow-xs transition-colors font-spatial-sans">
      
      {/* Top Banner Header */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Title & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full border border-[#E5DDF3] dark:border-[#382654] bg-[#F4F2F7] dark:bg-[#201830] text-[#7156A5] dark:text-[#B8A5E5] text-[10px] font-mono font-bold uppercase tracking-wider">
              COORDINATOR PORTAL
            </span>
            <span className="text-xs font-bold text-[#686370] dark:text-[#AAA4B8] font-mono">• {sportName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-spatial-display uppercase tracking-wide text-[#211D2B] dark:text-[#F5F2FA]">
            {sportName} <span className="text-[#7156A5] dark:text-[#B8A5E5]">Management Console</span>
          </h1>
          <p className="text-xs text-[#686370] dark:text-[#AAA4B8]">
            Generate schedules, verify scores, and control live matches in real time
          </p>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncData}
            className="px-3.5 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#181D30] text-[#211D2B] dark:text-[#F5F2FA] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5]" />
            <span>Sync Data</span>
          </button>
        </div>

      </div>

      {/* Horizontal Tabs Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 overflow-x-auto py-2 custom-scrollbar border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
          {OPERATIONAL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 relative cursor-pointer
                  ${isActive 
                    ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20' 
                    : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

    </header>
  );
};

