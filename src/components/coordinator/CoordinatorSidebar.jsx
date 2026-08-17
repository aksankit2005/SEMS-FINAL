import React from 'react';
import { Calendar, Radio, Award, Users, Trophy, LogOut, X } from 'lucide-react';

export const OPERATIONAL_TABS = [
  { id: 'schedule', label: 'Match Schedule', icon: Calendar },
  { id: 'live-control', label: 'Live Match Control', icon: Radio, badge: 'LIVE' },
  { id: 'results', label: 'Result Management', icon: Award },
  { id: 'participation', label: 'Total Participation', icon: Users },
];

export const CoordinatorSidebar = ({ activeTab, setActiveTab, user, onLogout, isOpen, onClose }) => {
  const sportName = user?.sportName || 'Table Tennis';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs transition-opacity" 
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 
        flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 text-slate-900 dark:text-white
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Console Branding */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
                🏓
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                  {sportName}
                </h1>
                <p className="text-[10px] font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest mt-1">
                  Operations Console
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Four Main Operational Tabs ONLY */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest px-3 block mb-3">
            Core Tournament Modules (4 Tabs)
          </span>

          {OPERATIONAL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (onClose) onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black transition-all duration-150 text-left
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600 dark:text-indigo-400'}`} />
                  <span>{tab.label}</span>
                </div>

                {tab.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user?.coordinatorName || 'Table Tennis Official'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'coord@apex.edu'}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
