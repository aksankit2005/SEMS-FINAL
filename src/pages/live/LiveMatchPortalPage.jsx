import React, { useState, useEffect } from 'react';
import { Clock, Play, Tv, RefreshCw, Video } from 'lucide-react';
import { LiveMatchViewerModal } from '../../components/live/LiveMatchViewerModal';
import { coordinatorApi, mergeMatchState } from '../../services/coordinatorApi';
import { getSportConfig, SPORTS_CONFIG } from '../../data/sportsConfig';
import { SPORTS_DATA } from '../../data/sportsData';
import { extractYouTubeVideoId } from '../../utils/youtube';

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

      // Collect ended/completed match IDs across all storage keys
      const completedMatchIds = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sems_completed_results_') || key.startsWith('sems_coord_matches_'))) {
          try {
            const list = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(list)) {
              list.forEach((m) => {
                if (m && (m.status === 'COMPLETED' || m.status === 'FINISHED')) {
                  if (m.id) completedMatchIds.add(m.id);
                }
              });
            }
          } catch (e) { }
        }
      }

      if (localActiveStr) {
        try {
          const parsed = JSON.parse(localActiveStr);
          localActiveList = Object.values(parsed).filter((m) => {
            const s = (m?.status || '').toLowerCase();
            return m && m.id && m.id !== 'M595473' && !completedMatchIds.has(m.id) && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active');
          });
        } catch (e) { }
      }

      // Check Athletics live stream state
      const cachedAthleticsStream = localStorage.getItem('sems_athletics_live_stream');
      if (cachedAthleticsStream) {
        try {
          const parsedAth = JSON.parse(cachedAthleticsStream);
          if (parsedAth && (parsedAth.status === 'In Progress' || parsedAth.status === 'running' || parsedAth.status === 'live')) {
            const athId = 'M-ATHLETICS-LIVE';
            if (!completedMatchIds.has(athId) && !localActiveList.some((m) => m.id === athId)) {
              localActiveList.push({
                id: athId,
                sportId: 'athletics',
                sportName: 'Athletics',
                matchTitle: `Athletics Meet — ${parsedAth.activeSubEvent || '100m Race'} Live`,
                team1: '',
                team2: '',
                tableNumber: 'Main Stadium Track',
                venue: 'Main Track & Field Ground',
                status: 'running',
                score1: 0,
                score2: 0,
                activeSubEvent: parsedAth.activeSubEvent || '100m Race',
                scoreSummary: parsedAth.scoreSummary || `Live Sub-Event: ${parsedAth.activeSubEvent || '100m Race'}`,
                youtubeVideoId: parsedAth.youtubeVideoId,
                streamUrl: parsedAth.streamUrl,
                isLiveStreaming: true,
              });
            }
          }
        } catch (e) { }
      }

      // Check if coordinator explicitly launched any live match for Table Tennis
      const hasCoordinatorLiveTT = (localActiveList || []).some((m) => {
        const s = (m?.status || '').toLowerCase();
        const isTT = (m?.sportId || m?.sportName || '').toLowerCase().includes('table-tennis') || (m?.sportId || m?.sportName || '').toLowerCase().includes('tt');
        return isTT && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active');
      }) || (publicLive || []).some((m) => {
        const s = (m?.status || '').toLowerCase();
        const isTT = (m?.sportId || m?.sportName || '').toLowerCase().includes('table-tennis') || (m?.sportId || m?.sportName || '').toLowerCase().includes('tt');
        return isTT && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active');
      });

      // Filter out fallback static mock match for Table Tennis unless coordinator explicitly went live
      const filteredFallbackData = LIVE_MATCHES_DATA.filter((m) => {
        const isTT = (m?.sportId || m?.sportName || '').toLowerCase().includes('table-tennis') || (m?.sportId || m?.sportName || '').toLowerCase().includes('tt');
        if (isTT && !hasCoordinatorLiveTT) {
          return false;
        }
        return !completedMatchIds.has(m.id);
      });

      // Safely merge backend matches, local active matches & fallback live matches using functional update & mergeMatchState
      const incomingMap = {};
      const combined = [...(publicLive || []), ...localActiveList, ...filteredFallbackData];
      combined.forEach((m) => {
        const s = (m?.status || '').toLowerCase();
        if (m && m.id && m.id !== 'M595473' && !completedMatchIds.has(m.id) && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active')) {
          const inferredSportId = (m.sportId || m.sport || (m.sportName ? m.sportName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'badminton')).toLowerCase();
          const inferredSportName = m.sportName || m.sport || (inferredSportId.charAt(0).toUpperCase() + inferredSportId.slice(1).replace('-', ' '));

          const videoId = m.youtubeVideoId || extractYouTubeVideoId(m.streamUrl);
          const formatted = {
            ...m,
            sportId: inferredSportId,
            sportName: inferredSportName,
            tableNumber: m.tableNumber || m.venue || 'Court 1',
            matchTitle: m.matchTitle || `${typeof m.team1 === 'object' ? (m.team1?.name || 'Team 1') : (m.team1 || 'Team 1')} vs ${typeof m.team2 === 'object' ? (m.team2?.name || 'Team 2') : (m.team2 || 'Team 2')}`,
            liveTimer: m.liveTimer || '14:32',
            youtubeVideoId: videoId || m.youtubeVideoId,
            isLiveStreaming: Boolean(videoId || m.isLiveStreaming || m.streamUrl),
          };
          incomingMap[m.id] = incomingMap[m.id] ? mergeMatchState(incomingMap[m.id], formatted) : formatted;
        }
      });

      setLiveMatches(() => {
        const activeMatchesList = Object.values(incomingMap).filter((m) => {
          const s = (m?.status || '').toLowerCase();
          return m && m.id && m.id !== 'M595473' && !completedMatchIds.has(m.id) && s !== 'completed' && s !== 'finished' && s !== 'scheduled' && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active');
        });

        return activeMatchesList;
      });

      setSelectedMatch((prev) => {
        if (!prev || !prev.id) return prev;
        const fresh = incomingMap[prev.id];
        if (fresh) {
          const s = (fresh.status || '').toLowerCase();
          if (s === 'completed' || s === 'finished' || s === 'walkover') {
            return null;
          }
          return mergeMatchState(prev, fresh);
        }
        return null;
      });

      // Dynamic upcoming scheduled matches fetching
      const upcomingList = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sems_coord_matches_') || key.endsWith('MatchSchedules'))) {
          try {
            const list = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(list)) {
              const sportId = key.replace('sems_coord_matches_', '').replace('MatchSchedules', '').toLowerCase();
              list.forEach((m) => {
                if (m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && m.status !== 'running' && m.status !== 'live' && !completedMatchIds.has(m.id)) {
                  const t1 = typeof m.team1 === 'object' ? (m.team1?.name || '') : String(m.team1 || '').trim();
                  const t2 = typeof m.team2 === 'object' ? (m.team2?.name || '') : String(m.team2 || '').trim();
                  if (!t1 || !t2) return;
                  if (!upcomingList.some((u) => u.id === m.id)) {
                    upcomingList.push({
                      id: m.id || `M-${Math.random()}`,
                      sportId,
                      matchTitle: m.matchTitle || `${t1} vs ${t2}`,
                      team1: t1,
                      team2: t2,
                      venue: m.tableNumber || m.venue || 'Table 1',
                      time: m.time || '10:00 AM',
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
    window.addEventListener('sems_results_updated', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('sems_matches_updated', handleRefresh);
      window.removeEventListener('sems_results_updated', handleRefresh);
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

                const isCricketMatch =
                  (m.sportId || m.sport || m.sportName || '').toLowerCase().includes('cricket') ||
                  (m.matchTitle || m.title || '').toLowerCase().includes('cricket');

                const isAthleticsMatch =
                  (m.sportId || m.sport || m.sportName || '').toLowerCase().includes('athletics') ||
                  (m.matchTitle || m.title || '').toLowerCase().includes('athletics');

                const parseCricketTeamScore = (teamObj, scoreVal, wicketsVal, oversVal) => {
                  const rawStr = typeof teamObj === 'object' ? (teamObj?.score || '') : (typeof scoreVal === 'string' ? scoreVal : '');
                  if (rawStr && (rawStr.includes('/') || rawStr.toLowerCase().includes('over') || rawStr.toLowerCase().includes('ov'))) {
                    const match = rawStr.match(/(\d+)\/(\d+)(?:\s*\(([\d.]+)\s*(?:Overs|ov)?\))?/i);
                    if (match) {
                      return {
                        runs: parseInt(match[1], 10),
                        wickets: parseInt(match[2], 10),
                        overs: match[3] || '0.0',
                        hasScore: true,
                        formatted: rawStr
                      };
                    }
                  }
                  const runs = Number(typeof teamObj === 'object' ? (teamObj?.score ?? 0) : (scoreVal ?? 0)) || 0;
                  const wickets = Number(wicketsVal ?? 0) || 0;
                  const overs = String(oversVal || '0.0');
                  return {
                    runs,
                    wickets,
                    overs,
                    hasScore: Boolean(runs || wickets || (overs && overs !== '0.0')),
                    formatted: `${runs}/${wickets} (${overs} ov)`
                  };
                };

                const currentInnings = m.currentInnings || 1;
                const t1Cricket = parseCricketTeamScore(m.team1, m.score1, m.wickets1, m.overs1);
                const t2Cricket = parseCricketTeamScore(m.team2, m.score2, m.wickets2, m.overs2);
                const battingTeamStr = String(m.battingTeam || '').trim().toLowerCase();
                const isT2Batting = battingTeamStr
                  ? battingTeamStr.includes(t2Name.trim().toLowerCase())
                  : currentInnings === 2;

                const hasLiveStream = Boolean(m.youtubeVideoId || m.streamUrl || m.isLiveStreaming || extractYouTubeVideoId(m.streamUrl));

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-indigo-500/50 shadow-md dark:shadow-xl transition-all duration-300 space-y-4 group cursor-pointer"
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
                        {hasLiveStream && (
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
                          {m.matchTitle || (isAthleticsMatch ? `Athletics Meet — ${m.activeSubEvent || '100m Race'}` : `${t1Name} vs ${t2Name}`)}
                        </h3>
                      </div>
                    </div>

                    {/* Cricket Spectator Score Box vs Athletics Box vs Standard Score Box */}
                    {isCricketMatch ? (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#061814] via-[#091E1A] to-[#0F172A] border border-emerald-500/40 space-y-3 shadow-md">
                        {/* Innings Header & Target/Max Overs info */}
                        <div className="flex items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black tracking-wide text-[11px] uppercase">
                              🏏 {currentInnings === 2 ? '2ND INNINGS' : '1ST INNINGS'}
                            </span>
                          </div>
                          {m.targetRuns ? (
                            <span className="text-[11px] font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-mono">
                              Target: {m.targetRuns} Runs
                            </span>
                          ) : m.totalOversMax ? (
                            <span className="text-[11px] font-bold text-slate-400 font-mono">
                              Max: {m.totalOversMax} Ov
                            </span>
                          ) : null}
                        </div>

                        {/* Side-by-Side Scores for Team 1 & Team 2 */}
                        <div className="grid grid-cols-2 gap-3 items-stretch pt-0.5">
                          {/* Team 1 Score Card */}
                          <div className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${!isT2Batting
                            ? 'bg-emerald-950/60 border-emerald-500/50 shadow-sm'
                            : 'bg-slate-900/80 border-slate-800/80 opacity-90'
                            }`}>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-xs sm:text-sm font-black text-white truncate" title={t1Name}>
                                {t1Name}
                              </span>
                              {!isT2Batting && (
                                <span className="text-[9px] font-mono font-black text-emerald-300 bg-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                  BAT
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                                  {t1Cricket.runs}
                                </span>
                                <span className="text-lg font-bold text-slate-400">/</span>
                                <span className="text-xl sm:text-2xl font-black text-rose-400">
                                  {t1Cricket.wickets}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-300 font-semibold flex items-center justify-between pt-0.5">
                                <span>Overs: <strong className="text-white">{t1Cricket.overs}</strong></span>
                                <span className="text-[9px] text-slate-400 uppercase font-bold">Runs/Wkt</span>
                              </div>
                            </div>
                          </div>

                          {/* Team 2 Score Card */}
                          <div className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${isT2Batting
                            ? 'bg-emerald-950/60 border-emerald-500/50 shadow-sm'
                            : 'bg-slate-900/80 border-slate-800/80 opacity-90'
                            }`}>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-xs sm:text-sm font-black text-white truncate" title={t2Name}>
                                {t2Name}
                              </span>
                              {isT2Batting && (
                                <span className="text-[9px] font-mono font-black text-emerald-300 bg-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                  BAT
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              {currentInnings === 1 && !isT2Batting && !t2Cricket.hasScore ? (
                                <div className="py-2 text-center">
                                  <span className="text-xs font-mono text-slate-400 italic">Yet to bat</span>
                                  <span className="block text-[10px] text-slate-500 font-mono">Innings 2</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-baseline gap-1 font-mono">
                                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                                      {t2Cricket.runs}
                                    </span>
                                    <span className="text-lg font-bold text-slate-400">/</span>
                                    <span className="text-xl sm:text-2xl font-black text-rose-400">
                                      {t2Cricket.wickets}
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-300 font-semibold flex items-center justify-between pt-0.5">
                                    <span>Overs: <strong className="text-white">{t2Cricket.overs}</strong></span>
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Runs/Wkt</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Active Striker & Bowler Ticker if present */}
                        {(m.striker || m.bowler) && (
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300 pt-2 border-t border-slate-800/80">
                            {m.striker && (
                              <span className="truncate">
                                🏏 <strong className="text-emerald-300">{m.striker.name || 'Striker'}</strong>: {m.striker.runs || 0} ({m.striker.balls || 0}b)
                              </span>
                            )}
                            {m.bowler && (
                              <span className="truncate">
                                🎯 <strong className="text-amber-300">{m.bowler.name || 'Bowler'}</strong>: {m.bowler.wickets || 0}/{m.bowler.runs || 0} ({m.bowler.overs || '0.0'})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : isAthleticsMatch ? (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 dark:bg-blue-950/40 border border-blue-500/30 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                            🏃 ATHLETICS MEET — {m.activeSubEvent || m.subEvent || '4*100m relay Race'}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                            LIVE TRACK EVENT
                          </span>
                        </div>
                        {m.winner || m.medals?.gold ? (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                            <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">🏆 WINNER & MEDALS</span>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              {m.winner || m.medals?.gold}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900 dark:bg-black/70 border border-blue-500/20 space-y-1">
                            <span className="text-[9px] font-mono text-blue-400 uppercase font-bold block">OFFICIAL TRACK LIVE STATUS</span>
                            <p className="text-xs sm:text-sm font-black text-white font-mono truncate">
                              {m.scoreSummary || m.liveNotes || `Live Sub-Event: ${m.activeSubEvent || '4*100m relay Race'}`}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
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
                    )}

                    {/* Footer Action Row */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono truncate max-w-[180px]">
                        {m.currentInfo || (isFinished ? 'Match Ended' : 'Match In Progress')}
                      </span>

                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                      >
                        {hasLiveStream ? <Tv className="w-3.5 h-3.5 text-rose-300" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{hasLiveStream ? 'Watch Stream' : isAthleticsMatch ? 'View Event Details' : 'View Scoreboard'}</span>
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
