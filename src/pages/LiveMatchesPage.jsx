import React, { useState } from 'react';
import { Radio, Activity, Info, X } from 'lucide-react';
import { useSportsData } from '../context/SportsDataContext';

export const LiveMatchesPage = () => {
  const { liveMatches } = useSportsData();
  const [selectedSport, setSelectedSport] = useState('All');
  const [activeMatchModal, setActiveMatchModal] = useState(null);

  const filteredMatches = liveMatches.filter((m) =>
    selectedSport === 'All' ? true : m.sport.toLowerCase() === selectedSport.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-black uppercase tracking-wider mb-3">
            <Radio className="w-4 h-4 animate-ping" /> Real-Time Match Center
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Live Tournament <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-emerald-500 bg-clip-text text-transparent">Scoreboard</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Real-time score updates, play-by-play commentary, and match statistics across all championship arenas.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'Cricket', 'Football', 'Badminton', 'Chess'].map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                selectedSport === sport
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Live Matches Grid */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
            <Radio className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Live Matches Right Now</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check back later or view the Schedule for upcoming fixtures.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition flex flex-col justify-between"
              >
                {/* Top Banner */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {match.sport}
                    </span>
                    <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                      {match.tournament}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs animate-pulse">
                    <Radio className="w-3.5 h-3.5" /> LIVE
                  </span>
                </div>

                {/* Scoreboard Visual */}
                <div className="grid grid-cols-3 gap-1 sm:gap-4 items-center my-4 text-center">
                  {/* Team 1 */}
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <div className="text-3xl sm:text-4xl">{match.team1.logo}</div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
                      {match.team1.name}
                    </h3>
                    <div className="text-xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                      {match.team1.score}
                    </div>
                    {match.team1.overs && (
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">{match.team1.overs}</div>
                    )}
                  </div>

                  {/* VS Divider */}
                  <div className="space-y-1 shrink-0">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] sm:text-xs font-black text-slate-400">
                      VS
                    </span>
                    <div className="text-[10px] sm:text-[11px] text-emerald-500 font-bold mt-1 sm:mt-2">
                      In Progress
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <div className="text-3xl sm:text-4xl">{match.team2.logo}</div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
                      {match.team2.name}
                    </h3>
                    <div className="text-xl sm:text-3xl font-black text-rose-500">
                      {match.team2.score}
                    </div>
                    {match.team2.overs && (
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">{match.team2.overs}</div>
                    )}
                  </div>
                </div>

                {/* Status Ticker Banner */}
                <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold truncate">{match.currentInfo}</span>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 truncate">Venue: {match.venue}</span>
                  <button
                    onClick={() => setActiveMatchModal(match)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5" /> Commentary & Stats
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Live Stats Modal */}
      {activeMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in text-slate-900 dark:text-white">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-rose-500 uppercase">Live Match Hub</span>
                <h3 className="text-2xl font-black">{activeMatchModal.sport} Match Stats</h3>
              </div>
              <button
                onClick={() => setActiveMatchModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Play-By-Play Live Feed</h4>
              <div className="space-y-2">
                {activeMatchModal.commentary.map((c, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold shrink-0">
                      {c.time}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{c.text}</span>
                  </div>
                ))}
              </div>

              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-550 dark:text-slate-400 pt-4">Match Metrics</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(activeMatchModal.stats).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold text-[10px]">{k}</span>
                    <span className="font-black text-slate-900 dark:text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
