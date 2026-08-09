import React from 'react';
import { Radio, RefreshCw, Trophy } from 'lucide-react';

export const SuperAdminLiveMatchesPage = () => {
  const liveMatches = [
    { id: 'MATCH-101', sport: 'Badminton', format: 'Doubles', team1: 'MPEC Kanpur (21)', team2: 'KIET Ghaziabad (19)', table: 'Court 2', time: 'Ongoing' },
    { id: 'MATCH-102', sport: 'Cricket', format: 'T20 Knockout', team1: 'PSIT Kanpur 142/4', team2: 'BBDIT Lucknow 88/6', table: 'Main Oval Ground', time: '14.2 Overs' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
            <span>Live Match Monitor</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin real-time scoreboard & live game control</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveMatches.map((m) => (
          <div key={m.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> {m.sport} ({m.format})
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase animate-pulse">
                Live
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-sm">
              <span className="font-bold text-white">{m.team1}</span>
              <span className="text-xs text-amber-400 font-black">VS</span>
              <span className="font-bold text-white">{m.team2}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Location: {m.table}</span>
              <span>Status: {m.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
