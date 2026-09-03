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

  const sportName = user?.sportName || 'Table Tennis';
  const assigned = (user?.assignedSport || sportName || '').toLowerCase();

  // Dynamic Theme Colors based on Sport
  const isTT = assigned.includes('table-tennis') || assigned.includes('tabletennis') || assigned.includes('tt');
  const isBasketball = assigned.includes('basketball');
  const isChess = assigned.includes('chess');
  const isCricket = assigned.includes('cricket');

  const themeText = isTT
    ? 'text-cyan-600 dark:text-cyan-400'
    : isBasketball
    ? 'text-orange-600 dark:text-orange-400'
    : isChess
    ? 'text-purple-600 dark:text-purple-400'
    : isCricket
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-indigo-600 dark:text-indigo-400';

  const themeBadgeBg = isTT
    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400'
    : isBasketball
    ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'
    : isChess
    ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
    : isCricket
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400';

  const themeActiveTab = isTT
    ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-600 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 font-black'
    : isBasketball
    ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400 bg-orange-50 dark:bg-orange-950/40 font-black'
    : isChess
    ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/40 font-black'
    : isCricket
    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-black'
    : 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-black';

  return (
    <header className="w-full bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30 shadow-sm dark:shadow-md transition-colors font-sans">
      
      {/* Top Banner Header */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Title & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${themeBadgeBg}`}>
              COORDINATOR PORTAL
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• {sportName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {sportName} Management Console
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Generate schedules, verify scores, and control live matches in real time
          </p>
        </div>

        {/* Right Top Actions (Sync Data) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${themeText}`} />
            <span>Sync Data</span>
          </button>
        </div>

      </div>

      {/* Horizontal Tabs Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 overflow-x-auto py-2 custom-scrollbar border-b border-slate-200 dark:border-slate-800/80">
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
                    ? themeActiveTab 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? themeText : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

    </header>
  );
};

