import React, { useState, useEffect } from 'react';
import { Clock, Play, Tv, RefreshCw, Video } from 'lucide-react';
import { LiveMatchViewerModal } from '../../components/live/LiveMatchViewerModal';
import { coordinatorApi } from '../../services/coordinatorApi';
import { getSportConfig, SPORTS_CONFIG } from '../../data/sportsConfig';
import { SPORTS_DATA } from '../../data/sportsData';

import { LIVE_MATCHES_DATA } from '../../data/liveMatchesData';

export const LiveMatchPortalPage = () => {
  const [selectedSportFilter, setSelectedSportFilter] = useState('All');
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    try {
      const publicLive = await coordinatorApi.getPublicLiveMatches();
      const localActiveStr = localStorage.getItem('sems_active_live_matches');
      let localActiveList = [];

      if (localActiveStr) {
        try {
          const parsed = JSON.parse(localActiveStr);
          localActiveList = Object.values(parsed).filter((m) => {
            const s = (m?.status || '').toLowerCase();
            return m && m.id !== 'M595473' && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active' || s === 'scheduled');
          });
        } catch (e) { }
      }

      // Merge backend matches, local active matches & fallback 12 live matches (removing duplicate IDs)
      const combined = [...(publicLive || []), ...localActiveList, ...LIVE_MATCHES_DATA];
      const uniqueMap = {};
      combined.forEach((m) => {
        const s = (m?.status || '').toLowerCase();
        if (m && m.id && m.id !== 'M595473' && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active' || s === 'scheduled' || s === '')) {
          const inferredSportId = (m.sportId || m.sport || (m.sportName ? m.sportName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'badminton')).toLowerCase();
          const inferredSportName = m.sportName || m.sport || (inferredSportId.charAt(0).toUpperCase() + inferredSportId.slice(1).replace('-', ' '));

          uniqueMap[m.id] = {
            ...m,
            sportId: inferredSportId,
            sportName: inferredSportName,
            tableNumber: m.tableNumber || m.venue || 'Court 1',
            matchTitle: m.matchTitle || `${typeof m.team1 === 'object' ? (m.team1?.name || 'Team 1') : (m.team1 || 'Team 1')} vs ${typeof m.team2 === 'object' ? (m.team2?.name || 'Team 2') : (m.team2 || 'Team 2')}`,
            liveTimer: m.liveTimer || '14:32',
          };
        }
      });

      setLiveMatches(Object.values(uniqueMap));

      // Dynamic upcoming scheduled matches fetching (purging mock names)
      const upcomingList = [];
      const mockNames = [
        '1', '2', 'a', 'b', 'player 1', 'player 2', 'player 3', 'player 4', 'team 1', 'team 2', 'team a', 'team b', 'albert', 'romi',
        'aarav sharma (mpec)', 'rohan gupta (mips)', 'ankur dixit (mpcps)', 'aditya singh (mpec)',
        'aagaz khan (mpcps kn142)', 'shiv prakash (mpcps kn142)', 'kapil verma (mpcps kn142)', 'anubhav sachan (mpcps kn142)',
        'kapil verma', 'anubhav sachan', 'team a', 'team b', 'team 1', 'team 2', 'player / team a', 'player / team b'
      ];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sems_coord_matches_')) {
          try {
            const list = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(list)) {
              const sportId = key.replace('sems_coord_matches_', '');
              list.forEach((m) => {
                if (m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && m.status !== 'running' && m.status !== 'live') {
                  const t1 = (m.team1 || '').trim().toLowerCase();
                  const t2 = (m.team2 || '').trim().toLowerCase();
                  if (mockNames.includes(t1) || mockNames.includes(t2)) return;
                  if (!upcomingList.some((u) => u.id === m.id)) {
                    upcomingList.push({
                      id: m.id || `M-${Math.random()}`,
                      sportId,
                      matchTitle: m.matchTitle || `${m.team1} vs ${m.team2}`,
                      team1: m.team1,
                      team2: m.team2,
                      venue: m.tableNumber || m.venue || 'Court 1',
                      time: m.time || '05:30 PM',
                      date: m.date || 'Today'
                    });
                  }
                }
              });
            }
          } catch (e) { }
        }
      }
      setUpcomingMatches(upcomingList);
    } catch (err) {
      console.error('Error fetching live matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(() => fetchScores(), 1500);
    const handleRefresh = () => fetchScores();
    window.addEventListener('sems_matches_updated', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('sems_matches_updated', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  // Filter options list with all 12 games from system config & data
  const availableSports = [
    'All',
    ...Array.from(
      new Set([
        ...Object.values(SPORTS_CONFIG).map((cfg) => cfg.name),
        ...SPORTS_DATA.map((s) => s.name),
        ...liveMatches.map((m) => m.sportName || getSportConfig(m.sportId)?.name || m.sportId),
        ...upcomingMatches.map((m) => getSportConfig(m.sportId)?.name || m.sportId)
      ].filter(Boolean))
    )
  ];

  const matchSportFilter = (targetSportName, filterValue) => {
    if (filterValue === 'All') return true;
    const filterClean = filterValue.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetClean = (targetSportName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return targetClean.includes(filterClean) || filterClean.includes(targetClean);
  };

  const filteredLiveMatches = liveMatches.filter((m) => {
    const sName = m.sportName || getSportConfig(m.sportId)?.name || m.sportId;
    return matchSportFilter(sName, selectedSportFilter);
  });

  const filteredUpcomingMatches = upcomingMatches.filter((m) => {
    const sName = getSportConfig(m.sportId)?.name || m.sportId;
    return matchSportFilter(sName, selectedSportFilter);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">

      {/* Live Spectator Secondary Header */}
      <div className="bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-[#1E293B] sticky top-16 z-20 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white text-sm font-bold shadow-xs">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  SEMS 2026 Spectator Live Match Portal
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30 animate-pulse">
                  🔴 LIVE AUTO-SYNC
                </span>
              </div>
            </div>
          </div>

          {/* "All Games" Category Filter Dropdown (Displays All 12 Games) */}
          <div className="flex items-center gap-3">
            <select
              value={selectedSportFilter}
              onChange={(e) => setSelectedSportFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors shadow-xs"
            >
              <option value="All" className="bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white">
                All Games ({availableSports.length - 1})
              </option>
              {availableSports.filter((s) => s !== 'All').map((sport) => (
                <option key={sport} value={sport} className="bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white">
                  {sport}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Live Matches Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              Currently Live Matches ({filteredLiveMatches.length})
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-emerald-500 dark:text-emerald-400 animate-spin" /> Real-Time Coordinator Sync
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-2">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Loading live scores from server...</p>
            </div>
          ) : filteredLiveMatches.length === 0 ? (

            /* Empty State */
            <div className="py-16 px-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] text-center space-y-3 shadow-xs dark:shadow-xl transition-colors">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mx-auto text-2xl">
                🏟️
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Live Matches Currently</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                There are no matches actively being played right now for {selectedSportFilter === 'All' ? 'any sport' : selectedSportFilter}. Check back shortly or view upcoming scheduled matches below.
              </p>
            </div>

          ) : (

            /* Live Match Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredLiveMatches.map((m) => {
                const sportConfig = getSportConfig(m.sportId || 'table-tennis');
                const t1Name = typeof m.team1 === 'object' ? (m.team1?.name || 'Team 1') : String(m.team1 || 'Team 1');
                const t2Name = typeof m.team2 === 'object' ? (m.team2?.name || 'Team 2') : String(m.team2 || 'Team 2');
                const score1Display = typeof m.team1 === 'object' ? (m.team1?.score ?? '0') : (m.score1 ?? '0');
                const score2Display = typeof m.team2 === 'object' ? (m.team2?.score ?? '0') : (m.score2 ?? '0');

                const statusLower = (m.status || '').toLowerCase();
                const isFinished = statusLower === 'completed' || statusLower === 'finished' || statusLower === 'ended';

                return (
                  <div
                    key={m.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-indigo-500/50 shadow-md dark:shadow-xl transition-all duration-300 space-y-4 group"
                  >
                    {/* Status & Venue Top Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isFinished ? (
                          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-extrabold uppercase">
                            🏁 Finished
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-mono font-extrabold flex items-center gap-1.5 animate-pulse uppercase">
                            🔴 LIVE
                          </span>
                        )}
                        {m.youtubeVideoId && (
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-black bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                            <Video className="w-2.5 h-2.5" /> STREAM
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono truncate max-w-[150px]">
                        {m.tableNumber || m.venue || sportConfig.venueOptions[0]}
                      </span>
                    </div>

                    {/* Prominent Sport Icon & Sport Name Header */}
                    <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 dark:from-indigo-600/30 dark:to-blue-600/20 text-blue-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-black shadow-xs shrink-0">
                        {sportConfig.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black uppercase text-blue-600 dark:text-indigo-400 tracking-wide truncate">
                            {sportConfig.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">#{m.id}</span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {m.matchTitle || `${t1Name} vs ${t2Name}`}
                        </h3>
                      </div>
                    </div>

                    {/* Clean Spectator Score Box (No College Name, No Time Display) */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate" title={t1Name}>
                          {t1Name}
                        </p>
                      </div>

                      <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center font-mono font-black text-2xl sm:text-3xl text-blue-600 dark:text-indigo-400 shadow-xs shrink-0">
                        {score1Display} : {score2Display}
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate" title={t2Name}>
                          {t2Name}
                        </p>
                      </div>
                    </div>

                    {/* Footer Action Row */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono truncate max-w-[180px]">
                        {m.currentInfo || (isFinished ? 'Match Ended' : 'Match In Progress')}
                      </span>

                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                      >
                        {m.youtubeVideoId ? <Tv className="w-3.5 h-3.5 text-rose-300" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{m.youtubeVideoId ? 'Watch Stream' : 'View Scoreboard'}</span>
                      </button>
                    </div>

                    {/* Set / Half-by-Half Points Display */}
                    {m.setsHistory && m.setsHistory.some((s) => s.score1 > 0 || s.score2 > 0 || s.isLocked) && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-[10px] font-mono">
                        <span className="text-slate-400 font-bold uppercase shrink-0">Set Scores:</span>
                        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
                          {m.setsHistory.filter((s) => s.score1 > 0 || s.score2 > 0 || s.isLocked).map((s) => (
                            <span key={s.set} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 shrink-0">
                              S{s.set}: {s.score1}-{s.score2}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          )}
        </div>

        {/* Upcoming Matches Section */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#1E293B]">
          <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-indigo-400" /> Upcoming Tournament Schedule
          </h2>

          {filteredUpcomingMatches.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B]">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">No upcoming matches scheduled currently for {selectedSportFilter === 'All' ? 'any sport' : selectedSportFilter}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredUpcomingMatches.map((up) => (
                <div key={up.id} className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] space-y-2 transition-colors">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-blue-600 dark:text-indigo-400">{up.time}</span>
                    <span className="font-mono">{up.venue}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{up.matchTitle}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{up.team1} vs {up.team2}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Spectator Detailed Viewer Modal */}
      {selectedMatch && (
        <LiveMatchViewerModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

    </div>
  );
};
