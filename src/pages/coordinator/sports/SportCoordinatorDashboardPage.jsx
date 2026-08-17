import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Radio, Award, Users, Layers, User,
  RefreshCw, Clock, Construction
} from 'lucide-react';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { ThemeToggle } from '../../../components/common/ThemeToggle';
import { ProfileTab } from '../../../components/coordinator/tabs/ProfileTab';
import { EventsTab } from '../../../components/coordinator/tabs/EventsTab';
import { MatchScheduleTab } from '../../../components/coordinator/tabs/MatchScheduleTab';
import { LiveMatchControlTab } from '../../../components/coordinator/tabs/LiveMatchControlTab';
import { ResultManagementTab } from '../../../components/coordinator/tabs/ResultManagementTab';
import { TotalParticipationTab } from '../../../components/coordinator/tabs/TotalParticipationTab';
import { AthleticsEventsTab } from '../../../components/coordinator/tabs/AthleticsEventsTab';
import { AthleticsResultManagementTab } from '../../../components/coordinator/tabs/AthleticsResultManagementTab';
import { AthleticsLiveMatchControlTab } from '../../../components/coordinator/tabs/AthleticsLiveMatchControlTab';
import { AthleticsMatchScheduleTab } from '../../../components/coordinator/tabs/AthleticsMatchScheduleTab';
import { useToast } from '../../../context/ToastContext';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'events', label: 'Registration Events', icon: Layers },
  { id: 'schedule', label: 'Match Schedule', icon: Calendar },
  { id: 'live-control', label: 'Live Match Control', icon: Radio, badge: 'LIVE' },
  { id: 'results', label: 'Results Management', icon: Award },
  { id: 'participants', label: 'Participants List', icon: Users },
];

// ─── Placeholder tab content ──────────────────────────────────────────────────
const PlaceholderTab = ({ sportName, tabLabel }) => (
  <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center animate-fade-in">
    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center">
      <Construction className="w-8 h-8 text-amber-500 dark:text-amber-400" />
    </div>
    <div className="space-y-1.5">
      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
        {sportName} — {tabLabel}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
        This module is under development. Full functionality will be added in a future sprint.
      </p>
    </div>
    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black uppercase tracking-wider">
      <Clock className="w-3.5 h-3.5" /> Coming Soon
    </span>
  </div>
);

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ sportName, activeTab, setActiveTab }) => (
  <header className="w-full bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30 shadow-sm transition-colors">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            COORDINATOR PORTAL
          </span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• {sportName}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Tournament Management Console
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Generate schedules, verify scores, and control live matches in real time
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Sync Data</span>
        </button>
      </div>
    </div>

    {/* Tabs bar */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav className="flex space-x-2 overflow-x-auto py-2 border-b border-slate-200 dark:border-slate-800/80">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 relative cursor-pointer
                ${isActive
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 font-black border-l-2 border-amber-500'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  </header>
);

// ─── Main exported page ───────────────────────────────────────────────────────
export const SportCoordinatorDashboardPage = ({ sportName, sportSlug }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('events');

  const isAthletics = sportSlug?.toLowerCase() === 'athletics';

  // Fetch preset account details or logged in user details for this sport
  const presetUser = coordinatorApi.getPresetAccount(sportSlug);
  const currentUser = coordinatorApi.getCurrentUser();
  const user = (currentUser?.assignedSport?.toLowerCase() === sportSlug?.toLowerCase())
    ? currentUser
    : (presetUser || {
      coordinatorName: `${sportName} Coordinator`,
      username: `coord_${sportSlug?.replace(/-/g, '_')}`,
      assignedSport: sportSlug,
      sportName: sportName,
      email: `${sportSlug?.replace(/-/g, '')}.coord@apex.edu`
    });

  const handleLogout = () => {
    coordinatorApi.logout();
    addToast('Coordinator session ended', 'info');
    navigate('/coordinator/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-150">
      <Header
        sportName={sportName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main className="flex-1 p-3 sm:p-4 max-w-[1600px] w-full mx-auto">
        {activeTab === 'events' && (
          isAthletics ? <AthleticsEventsTab user={user} sportSlug={sportSlug} /> : <EventsTab user={user} assignedSport={sportSlug} />
        )}
        {activeTab === 'schedule' && (
          isAthletics ? <AthleticsMatchScheduleTab user={user} /> : <MatchScheduleTab user={user} assignedSport={sportSlug} />
        )}
        {activeTab === 'live-control' && (
          isAthletics ? <AthleticsLiveMatchControlTab user={user} /> : <PlaceholderTab sportName={sportName} tabLabel="Live Match Control" />
        )}
        {activeTab === 'results' && (
          isAthletics ? <AthleticsResultManagementTab sportName={sportName} sportSlug={sportSlug} user={user} /> : <ResultManagementTab user={user} assignedSport={sportSlug} />
        )}
        {activeTab === 'participants' && (
          <TotalParticipationTab user={user} assignedSport={sportSlug} />
        )}
        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            matches={[]}
            registrations={[]}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
};
