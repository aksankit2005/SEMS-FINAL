import React, { useState } from 'react';
import { Users, User, Search, Filter, ShieldCheck, Mail, Phone } from 'lucide-react';

export const TeamsPlayersTab = ({ registrations, user }) => {
  const [activeSubTab, setActiveSubTab] = useState('teams');
  const [search, setSearch] = useState('');

  const filteredTeams = registrations.filter((r) =>
    r.teamName?.toLowerCase().includes(search.toLowerCase()) ||
    r.college?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Tab Selector */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('teams')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
              activeSubTab === 'teams'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Manage Teams ({registrations.length})
          </button>
          <button
            onClick={() => setActiveSubTab('players')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
              activeSubTab === 'players'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Manage Registered Players
          </button>
        </div>

        <div className="relative max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${user?.sportName} roster...`}
            className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {activeSubTab === 'teams' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/10 text-orange-500">
                  {t.college}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{t.gender} Category</span>
              </div>

              <h4 className="text-base font-black text-slate-900 dark:text-white">{t.teamName}</h4>
              
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p><strong>Captain:</strong> {t.studentName}</p>
                <p><strong>Department:</strong> {t.department}</p>
                <p><strong>Roster Count:</strong> {t.playersCount || 11} Registered Players</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
            {user?.sportName} Verified Player Roster Directory
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredTeams.map((p, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                    {p.studentName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{p.studentName}</p>
                    <p className="text-[10px] text-slate-400">{p.college} • {p.department}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                  {p.teamName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
