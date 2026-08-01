import React from 'react';
import { RefreshCw, LogOut, Calendar, Radio, Award, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const OPERATIONAL_TABS = [
  { id: 'schedule', label: 'Match Schedule', icon: Calendar },
  { id: 'live-control', label: 'Live Match Control', icon: Radio, badge: 'LIVE' },
  { id: 'results', label: 'Results Management', icon: Award },
  { id: 'participants', label: 'Participants List', icon: Users },
];

export const CoordinatorHeader = ({ user, activeTab, setActiveTab, onLogout }) => {
  const { addToast } = useToast();

  const handleSyncData = () => {
    addToast('Coordinator tournament data synced!', 'success');
  };

  const sportName = user?.sportName || 'Table Tennis';

  return (
    <header className="w-full bg-[#0B1120] text-slate-200 border-b border-slate-800/80 sticky top-0 z-30 shadow-md">
      
      {/* Top Banner Header (Screenshot 1 & 4) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Title & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              COORDINATOR PORTAL
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">• {sportName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tournament Management Console
          </h1>
          <p className="text-xs text-slate-400">
            Generate schedules, verify scores, and control live matches in real time
          </p>
        </div>

        {/* Right Top Actions (Sync Data & Logout) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncData}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sync Data</span>
          </button>

          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs border border-rose-500/30 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

      </div>

      {/* Horizontal Tabs Bar (Screenshot 1, 2, 3, 4) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 overflow-x-auto py-2 custom-scrollbar border-b border-slate-800/80">
          {OPERATIONAL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 relative
                  ${isActive 
                    ? 'text-white border-b-2 border-indigo-500 bg-slate-800/60' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

    </header>
  );
};
