import React, { useState } from 'react';
import { Users, User, Search, Filter, ShieldCheck, Mail, Phone } from 'lucide-react';

export const TeamsPlayersTab = ({ registrations = [], user }) => {
  const [activeSubTab, setActiveSubTab] = useState('teams');
  const [search, setSearch] = useState('');

  const filteredTeams = (registrations || []).filter((r) =>
    r.teamName?.toLowerCase().includes(search.toLowerCase()) ||
    r.college?.toLowerCase().includes(search.toLowerCase()) ||
    r.studentName?.toLowerCase().includes(search.toLowerCase())
  );

  // Derive flattened list of all players across all registered teams/entries
  const allPlayers = [];
  (registrations || []).forEach((t) => {
    if (Array.isArray(t.members) && t.members.length > 0) {
      t.members.forEach((m, idx) => {
        allPlayers.push({
          id: m.id || `${t.id}_m_${idx}`,
          name: m.fullName || m.name || (idx === 0 ? t.studentName : `Player ${idx + 1}`),
          roll: m.rollNo || m.roll || 'N/A',
          course: m.course || t.department || 'N/A',
          year: m.yearSemester || 'N/A',
          phone: m.mobile || m.phone || t.phone || 'N/A',
          email: m.email || t.email || 'N/A',
          college: t.college || 'N/A',
          teamName: t.teamName || t.name || 'Team',
          isCaptain: m.isCaptain !== undefined ? m.isCaptain : (idx === 0)
        });
      });
    } else {
      allPlayers.push({
        id: t.id,
        name: t.studentName || t.name,
        roll: t.enrollmentNo || t.roll || 'N/A',
        course: t.department || 'N/A',
        year: 'N/A',
        phone: t.phone || 'N/A',
        email: t.email || 'N/A',
        college: t.college || 'N/A',
        teamName: t.teamName || t.name || 'Individual',
        isCaptain: true
      });
    }
  });

  const filteredPlayers = allPlayers.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.college.toLowerCase().includes(search.toLowerCase()) ||
    p.teamName.toLowerCase().includes(search.toLowerCase()) ||
    p.roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Tab Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('teams')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'teams'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Manage Teams ({registrations.length})
          </button>
          <button
            onClick={() => setActiveSubTab('players')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'players'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Manage Registered Players ({allPlayers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${user?.sportName || ''} roster...`}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
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

              <h4 className="text-base font-black text-slate-900 dark:text-white">{t.teamName || t.studentName}</h4>
              
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p><strong>Captain:</strong> {t.studentName}</p>
                <p><strong>Course:</strong> {t.department || 'N/A'}</p>
                <p><strong>Roster Count:</strong> {Array.isArray(t.members) && t.members.length > 0 ? t.members.length : (t.playersCount || 1)} Registered Athletes</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {user?.sportName} Verified Player Roster Directory ({filteredPlayers.length} Athletes)
            </h4>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredPlayers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-bold">No players found matching your search.</div>
            ) : (
              filteredPlayers.map((p, idx) => (
                <div key={idx} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-3 rounded-xl transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-black shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                        {p.isCaptain && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Captain
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {p.college} • {p.course} {p.roll !== 'N/A' ? `• Roll: ${p.roll}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {p.teamName}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
