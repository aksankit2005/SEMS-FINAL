import React, { useState, useEffect, useRef } from 'react';
import { Play, Tv, RefreshCw, Video, Filter, ChevronDown, Check, Radio } from 'lucide-react';
import { LiveMatchViewerModal } from '../../components/live/LiveMatchViewerModal';
import { coordinatorApi, mergeMatchState, sortLiveMatches } from '../../services/coordinatorApi';
import { getSportConfig, SPORTS_CONFIG } from '../../data/sportsConfig';
import { SPORTS_DATA } from '../../data/sportsData';
import { extractYouTubeVideoId } from '../../utils/youtube';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/spatialGallery.css';

export const LiveMatchPortalPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedSportFilter, setSelectedSportFilter] = useState('All');
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Roll-down sport filter state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLiveScores = async () => {
    try {
      // 1. Fetch public live matches from PostgreSQL
      const publicLive = await coordinatorApi.getPublicLiveMatches();

      // If publicLive is null, network request failed -> preserve previous state temporarily
      if (Array.isArray(publicLive)) {
        const formattedLive = publicLive
          .filter((m) => {
            const s = (m?.status || '').toLowerCase();
            return m && m.id && m.id !== 'M595473' && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active');
          })
          .map((m) => {
            const inferredSportId = (m.sportId || m.sport || (m.sportName ? m.sportName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'badminton')).toLowerCase();
            const inferredSportName = m.sportName || m.sport || (inferredSportId.charAt(0).toUpperCase() + inferredSportId.slice(1).replace('-', ' '));
            const videoId = m.youtubeVideoId || extractYouTubeVideoId(m.streamUrl);

            return {
              ...m,
              sportId: inferredSportId,
              sportName: inferredSportName,
              tableNumber: m.tableNumber || m.venue || 'Court 1',
              matchTitle: m.matchTitle || `${typeof m.team1 === 'object' ? (m.team1?.name || 'Team 1') : (m.team1 || 'Team 1')} vs ${typeof m.team2 === 'object' ? (m.team2?.name || 'Team 2') : (m.team2 || 'Team 2')}`,
              liveTimer: m.liveTimer || '14:32',
              youtubeVideoId: videoId || m.youtubeVideoId,
              isLiveStreaming: Boolean(videoId || m.isLiveStreaming || m.streamUrl),
            };
          });

        // Deterministically sort matches: sportId -> numeric court/table -> match ID
        const sortedLive = sortLiveMatches(formattedLive);
        setLiveMatches(sortedLive);

        // Update selected match modal if currently open
        setSelectedMatch((prev) => {
          if (!prev || !prev.id) return null;
          const fresh = sortedLive.find((m) => m.id === prev.id);
          if (fresh) {
            return mergeMatchState(prev, fresh);
          }
          return null; // Match ended or no longer active
        });
      }
    } catch (err) {
      console.error('Error fetching live matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingSchedules = async () => {
    try {
      // 2. Fetch public schedules from PostgreSQL
      const publicSchedules = await coordinatorApi.getPublicSchedules();
      if (Array.isArray(publicSchedules)) {
        const formattedUpcoming = publicSchedules
          .filter((m) => {
            const s = (m?.status || '').toLowerCase();
            return m && m.id && s !== 'completed' && s !== 'finished' && s !== 'running' && s !== 'live';
          })
          .map((m) => {
            const t1 = typeof m.team1 === 'object' ? (m.team1?.name || '') : String(m.team1 || '').trim();
            const t2 = typeof m.team2 === 'object' ? (m.team2?.name || '') : String(m.team2 || '').trim();
            const inferredSportId = (m.sportId || 'badminton').toLowerCase();
            return {
              id: m.id,
              sportId: inferredSportId,
              matchTitle: m.matchTitle || m.event || `${t1 || 'Team 1'} vs ${t2 || 'Team 2'}`,
              team1: t1 || 'Team 1',
              team2: t2 || 'Team 2',
              venue: m.tableNumber || m.venue || 'Court 1',
              tableNumber: m.tableNumber || m.venue || 'Court 1',
              time: m.time || '10:00 AM',
              date: m.date || 'Today',
            };
          });

        const sortedUpcoming = sortLiveMatches(formattedUpcoming);
        setUpcomingMatches(sortedUpcoming);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  useEffect(() => {
    fetchLiveScores();
    fetchUpcomingSchedules();

    // Live matches spectator refresh interval (every 6 seconds)
    const liveInterval = setInterval(() => fetchLiveScores(), 6000);

    // Schedules background refresh (every 60 seconds)
    const scheduleInterval = setInterval(() => fetchUpcomingSchedules(), 60000);

    const handleRefreshAll = () => {
      fetchLiveScores();
      fetchUpcomingSchedules();
    };

    window.addEventListener('sems_matches_updated', handleRefreshAll);
    window.addEventListener('sems_results_updated', handleRefreshAll);
    window.addEventListener('storage', handleRefreshAll);
    window.addEventListener('focus', handleRefreshAll);

    return () => {
      clearInterval(liveInterval);
      clearInterval(scheduleInterval);
      window.removeEventListener('sems_matches_updated', handleRefreshAll);
      window.removeEventListener('sems_results_updated', handleRefreshAll);
      window.removeEventListener('storage', handleRefreshAll);
      window.removeEventListener('focus', handleRefreshAll);
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
    <div className={`relative min-h-screen font-spatial-sans selection:bg-blue-500/30 selection:text-white overflow-x-hidden transition-colors duration-500 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* ─── ATMOSPHERIC NEBULA BACKDROP (Dark vs Light) ─── */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-all duration-700 ${
        isDark ? 'spatial-nebula-dark' : 'spatial-nebula-light'
      }`} />

      {/* ─── TACTILE FILM GRAIN OVERLAY ─── */}
      <div className="fixed inset-0 spatial-grain-overlay z-[1] pointer-events-none opacity-25" />

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-12 sm:pb-16 space-y-6 sm:space-y-8">

        {/* ─── LUXURY HERO BANNER (Schedule / Gallery Style) ─── */}
        <div className="text-center max-w-3xl mx-auto space-y-2 pt-1">
          <h1 className={`text-4xl sm:text-6xl md:text-7xl font-normal tracking-[0.08em] font-spatial-display uppercase ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Live{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent font-semibold ${
              isDark 
                ? 'from-blue-400 via-indigo-300 to-orange-300' 
                : 'from-blue-700 via-indigo-700 to-orange-600'
            }`}>
              Matches
            </span>
          </h1>

          <p className={`text-xs sm:text-sm max-w-xl mx-auto italic font-spatial-sans font-light leading-relaxed ${
            isDark ? 'text-slate-300/85' : 'text-slate-600'
          }`}>
            Real-time live scores, active courts, and match updates across all tournament events.
          </p>
        </div>

        {/* ─── CONTROLS & FILTER BAR (Schedule Style) ─── */}
        <div className="flex items-center justify-between gap-2.5 pt-1 pb-1">
          {/* Left: Discipline & Count */}
          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline-block text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-blue-300/80' : 'text-blue-700'
            }`}>
              {selectedSportFilter === 'All' ? 'All Disciplines' : selectedSportFilter}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
              filteredLiveMatches.length > 0
                ? isDark
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
                : isDark
                  ? 'bg-white/5 border-white/10 text-slate-400'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              {filteredLiveMatches.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />}
              {filteredLiveMatches.length} {filteredLiveMatches.length === 1 ? 'Live Match' : 'Live Matches'}
            </span>
          </div>

          {/* Right: Sync indicator & Roll-down sport dropdown */}
          <div className="flex items-center gap-3">
            <span className={`hidden sm:flex text-xs font-mono items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
              <span>Real-Time Sync</span>
            </span>

            {/* Roll-Down Sport Filter Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  isDark
                    ? 'bg-[#10121a]/90 hover:bg-[#181a24] text-blue-200 border-blue-500/30 shadow-xs hover:border-blue-400/50'
                    : 'bg-white hover:bg-slate-50 text-blue-900 border-slate-300 shadow-xs'
                }`}
                title="Filter by Sport"
                aria-label="Filter sport roll-down dropdown"
              >
                <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                  {selectedSportFilter === 'All' ? 'Filter Sport' : selectedSportFilter}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-blue-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Roll-Down Menu Popover */}
              {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-52 sm:w-60 rounded-2xl p-1.5 z-50 shadow-2xl border backdrop-blur-2xl max-h-80 overflow-y-auto no-scrollbar transition-all ${
                  isDark
                    ? 'bg-[#0d0f18]/95 border-blue-500/30 text-slate-200 shadow-[0_12px_35px_rgba(0,0,0,0.85)]'
                    : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl'
                }`}>
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold text-blue-400 border-b border-blue-500/10 mb-1 flex items-center justify-between">
                    <span>Select Sport</span>
                    <span className="text-slate-400 text-[9px]">{availableSports.length} Options</span>
                  </div>
                  {availableSports.map((sport) => {
                    const isSelected = selectedSportFilter === sport;
                    return (
                      <button
                        key={sport}
                        onClick={() => {
                          setSelectedSportFilter(sport);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? isDark ? 'bg-blue-500/20 text-blue-300 font-bold' : 'bg-blue-50 text-blue-700 font-bold'
                            : isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate">{sport}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── LIVE MATCHES SECTION ─── */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className={`text-xs font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Connecting to Live Coordinator Feed...
              </p>
            </div>
          ) : filteredLiveMatches.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-6 text-center space-y-3 bg-transparent border-0 shadow-none">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl ${
                isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100/60 text-slate-600'
              }`}>
                🏟️
              </div>
              <h3 className={`text-base font-bold font-spatial-display uppercase tracking-wide ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                No Live Matches Currently
              </h3>
              <p className={`text-xs max-w-md mx-auto ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
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

                const sportKey = String(m.sportId || m.sport || m.sportName || '').toLowerCase().replace(/_/g, '-');
                const titleKey = String(m.matchTitle || m.title || '').toLowerCase();

                const isCricketMatch = sportKey.includes('cricket') || titleKey.includes('cricket') || Boolean(m.striker || m.bowler);
                const isFootballMatch = sportKey.includes('football') || titleKey.includes('football');
                const isBasketballMatch = !isCricketMatch && !isFootballMatch && (sportKey.includes('basketball') || titleKey.includes('basketball') || (Boolean(m.roster1 || m.roster2) && !sportKey.includes('chess') && !sportKey.includes('kabaddi')));
                const isKabaddiMatch = !isCricketMatch && !isFootballMatch && !isBasketballMatch && (sportKey.includes('kabaddi') || titleKey.includes('kabaddi'));
                const isVolleyballMatch = !isCricketMatch && !isFootballMatch && !isBasketballMatch && (sportKey.includes('volleyball') || titleKey.includes('volleyball'));
                const isBadmintonMatch = sportKey.includes('badminton') || titleKey.includes('badminton');
                const isTableTennisMatch = sportKey.includes('table-tennis') || sportKey.includes('tabletennis') || titleKey.includes('table tennis') || titleKey.includes('tt');
                const isKhoKhoMatch = sportKey.includes('kho-kho') || sportKey.includes('khokho') || titleKey.includes('kho kho');
                const isTugOfWarMatch = sportKey.includes('tug-of-war') || sportKey.includes('tug') || titleKey.includes('tug of war');
                const isChessMatch = !isCricketMatch && !isFootballMatch && (sportKey.includes('chess') || titleKey.includes('chess'));
                const isAthleticsMatch = sportKey.includes('athletics') || titleKey.includes('athletics');

                const isRacketOrVolleyball = isBadmintonMatch || isTableTennisMatch || isVolleyballMatch;

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

                const rawStream = m.streamUrl || m.liveStreamUrl || (m.details && (m.details.streamUrl || m.details.liveStreamUrl));
                const videoId = m.youtubeVideoId || extractYouTubeVideoId(rawStream) || (m.details && (m.details.youtubeVideoId || extractYouTubeVideoId(m.details.streamUrl)));
                const hasLiveStream = Boolean(m.isLiveStreaming || videoId || rawStream);

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className={`p-5 rounded-3xl border transition-all duration-300 space-y-4 group cursor-pointer ${
                      isDark
                        ? 'spatial-glass-card-dark border-white/10 hover:border-blue-500/40 shadow-xl'
                        : 'spatial-glass-card-light border-slate-200/90 hover:border-blue-500/50 shadow-lg'
                    }`}
                  >
                    {/* Status & Venue Top Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isFinished ? (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase border ${
                            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            🏁 Finished
                          </span>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold flex items-center gap-1.5 animate-pulse uppercase border ${
                            isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}>
                            🔴 LIVE
                          </span>
                        )}
                        {hasLiveStream && (
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-black bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                            <Video className="w-2.5 h-2.5" /> STREAM
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-bold font-mono truncate max-w-[150px] ${
                        isDark ? 'text-amber-400' : 'text-amber-700'
                      }`}>
                        {m.tableNumber || m.venue || sportConfig.venueOptions[0]}
                      </span>
                    </div>

                    {/* Prominent Sport Icon & Sport Name Header */}
                    <div className={`flex items-center gap-3 py-2 border-b ${
                      isDark ? 'border-white/[0.08]' : 'border-slate-100'
                    }`}>
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xs shrink-0 border ${
                        isDark 
                          ? 'bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-300 border-white/10' 
                          : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border-slate-200'
                      }`}>
                        {sportConfig.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm font-spatial-display font-bold uppercase tracking-wider truncate ${
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {sportConfig.name}
                          </span>
                          <span className={`text-[10px] font-mono font-bold shrink-0 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            #{m.id}
                          </span>
                        </div>
                        <h3 className={`text-xs sm:text-sm font-extrabold truncate ${
                          isDark ? 'text-slate-100' : 'text-slate-800'
                        }`}>
                          {m.matchTitle || (isAthleticsMatch ? `Athletics Meet — ${m.activeSubEvent || '100m Race'}` : `${t1Name} vs ${t2Name}`)}
                        </h3>
                      </div>
                    </div>

                    {/* Sport-Specific Score Display Box */}
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
                              <div className="flex items-baseline gap-1 font-mono tabular-nums whitespace-nowrap">
                                <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400">
                                  {t1Cricket.runs}
                                </span>
                                <span className="text-base sm:text-lg font-bold text-slate-400">/</span>
                                <span className="text-lg sm:text-xl md:text-2xl font-black text-rose-400">
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
                                  <div className="flex items-baseline gap-1 font-mono tabular-nums whitespace-nowrap">
                                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400">
                                      {t2Cricket.runs}
                                    </span>
                                    <span className="text-base sm:text-lg font-bold text-slate-400">/</span>
                                    <span className="text-lg sm:text-xl md:text-2xl font-black text-rose-400">
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
                      <div className={`p-4 rounded-2xl border space-y-3 shadow-sm ${
                        isDark ? 'bg-blue-950/30 border-blue-500/30' : 'bg-blue-50/70 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] font-mono font-black uppercase tracking-wider ${
                            isDark ? 'text-blue-400' : 'text-blue-700'
                          }`}>
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
                          <div className={`p-3 rounded-xl border space-y-1 ${
                            isDark ? 'bg-black/60 border-blue-500/20' : 'bg-white border-blue-200'
                          }`}>
                            <span className="text-[9px] font-mono text-blue-400 uppercase font-bold block">OFFICIAL TRACK LIVE STATUS</span>
                            <p className={`text-xs sm:text-sm font-black font-mono truncate ${
                              isDark ? 'text-white' : 'text-slate-800'
                            }`}>
                              {m.scoreSummary || m.liveNotes || `Live Sub-Event: ${m.activeSubEvent || '4*100m relay Race'}`}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : isBasketballMatch ? (
                      <div className={`p-4 rounded-2xl border space-y-2 shadow-xs ${
                        isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
                      }`}>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                          }`}>
                            🏀 {m.quarter || 'Quarter 1'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">PTS SCORE</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-sm sm:text-base font-black truncate ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`} title={t1Name}>
                              {t1Name}
                            </p>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl border text-center font-mono font-black text-2xl sm:text-3xl shadow-xs shrink-0 ${
                            isDark ? 'bg-slate-900/90 border-amber-500/40 text-amber-400' : 'bg-white border-amber-300 text-amber-600'
                          }`}>
                            {score1Display} : {score2Display}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className={`text-sm sm:text-base font-black truncate ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`} title={t2Name}>
                              {t2Name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : isFootballMatch ? (
                      <div className={`p-4 rounded-2xl border space-y-2 shadow-xs ${
                        isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'
                      }`}>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            ⚽ {m.quarter || (m.half === 2 ? '2nd Half' : '1st Half')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">GOALS</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-sm sm:text-base font-black truncate ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`} title={t1Name}>
                              {t1Name}
                            </p>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl border text-center font-mono font-black text-2xl sm:text-3xl shadow-xs shrink-0 ${
                            isDark ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-400' : 'bg-white border-emerald-300 text-emerald-600'
                          }`}>
                            {score1Display} : {score2Display}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className={`text-sm sm:text-base font-black truncate ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`} title={t2Name}>
                              {t2Name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : isKabaddiMatch ? (
                      <div className={`p-4 rounded-2xl border space-y-2 shadow-xs ${
                        isDark ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50/70 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                          }`}>
                            🤼 {m.half === 2 ? '2nd Half' : '1st Half'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">PTS SCORE</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-sm sm:text-base font-black truncate ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`} title={t1Name}>
                              {t1Name}
                            </p>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl border text-center font-mono font-black text-2xl sm:text-3xl shadow-xs shrink-0 ${
                            isDark ? 'bg-slate-900/90 border-blue-500/40 text-indigo-400' : 'bg-white border-blue-300 text-blue-600'
                          }`}>
                            {score1Display} : {score2Display}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className={`text-sm sm:text-base font-black truncate ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`} title={t2Name}>
                              {t2Name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : isTugOfWarMatch ? (
                      <div className={`p-4 rounded-2xl border space-y-2 shadow-xs ${
                        isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
                      }`}>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                          }`}>
                            🪢 Round #{m.currentRound || 1}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">ROUNDS WON</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-sm sm:text-base font-black truncate ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`} title={t1Name}>
                              {t1Name}
                            </p>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl border text-center font-mono font-black text-2xl sm:text-3xl shadow-xs shrink-0 ${
                            isDark ? 'bg-slate-900/90 border-amber-500/40 text-amber-400' : 'bg-white border-amber-300 text-amber-600'
                          }`}>
                            {m.roundsWon1 ?? score1Display} : {m.roundsWon2 ?? score2Display}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className={`text-sm sm:text-base font-black truncate ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`} title={t2Name}>
                              {t2Name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
                        isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-sm sm:text-base font-black truncate ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`} title={t1Name}>
                            {t1Name}
                          </p>
                        </div>

                        <div className={`px-4 py-2 rounded-xl border text-center font-mono font-black text-2xl sm:text-3xl shadow-xs shrink-0 ${
                          isDark ? 'bg-slate-900 border-white/10 text-blue-400' : 'bg-white border-slate-200 text-blue-600'
                        }`}>
                          {score1Display} : {score2Display}
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                          <p className={`text-sm sm:text-base font-black truncate ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`} title={t2Name}>
                            {t2Name}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer Action Row */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className={`text-[11px] font-bold font-mono truncate max-w-[180px] ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {m.currentInfo || (isFinished ? 'Match Ended' : 'Match In Progress')}
                      </span>

                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 font-mono uppercase tracking-wider"
                      >
                        {hasLiveStream ? <Tv className="w-3.5 h-3.5 text-blue-200" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{hasLiveStream ? 'Watch Stream' : isAthleticsMatch ? 'Event Details' : 'Scoreboard'}</span>
                      </button>
                    </div>

                    {/* Set Scores Pill Row - ONLY for Racket Sports & Volleyball */}
                    {isRacketOrVolleyball && (() => {
                      const sets = Array.isArray(m.setsHistory)
                        ? m.setsHistory
                        : (typeof m.setsHistory === 'string' ? (() => { try { const p = JSON.parse(m.setsHistory); return Array.isArray(p) ? p : []; } catch { return []; } })() : []);
                      const activeSets = sets.filter((s) => s && (s.score1 > 0 || s.score2 > 0 || s.isLocked));
                      if (activeSets.length === 0) return null;
                      return (
                        <div className={`pt-2 border-t flex items-center justify-between gap-2 text-[10px] font-mono ${
                          isDark ? 'border-white/[0.08]' : 'border-slate-100'
                        }`}>
                          <span className={`font-bold uppercase shrink-0 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>Set Scores:</span>
                          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
                            {activeSets.map((s) => (
                              <span key={s.set} className={`px-2 py-0.5 rounded-md font-bold border shrink-0 ${
                                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                S{s.set}: {s.score1}-{s.score2}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── DEDICATION QUOTE FOOTER ─── */}
        <div className="pt-14 sm:pt-20 pb-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-3 opacity-60">
            <div className={`h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent ${
              isDark ? 'to-blue-400' : 'to-blue-600'
            }`} />
            <Radio className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'} animate-pulse`} />
            <div className={`h-[1px] w-12 sm:w-24 bg-gradient-to-l from-transparent ${
              isDark ? 'to-blue-400' : 'to-blue-600'
            }`} />
          </div>

          <p className={`font-spatial-display text-sm sm:text-base md:text-lg tracking-[0.14em] uppercase font-medium select-none ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            &ldquo;Victory belongs to those who{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent font-bold ${
              isDark
                ? 'from-blue-400 via-indigo-300 to-orange-300'
                : 'from-blue-700 via-indigo-700 to-orange-600'
            }`}>
              believe
            </span>
            {' '}in it the most.&rdquo;
          </p>

          <p className={`text-[11px] sm:text-xs font-spatial-sans tracking-widest uppercase italic font-medium ${
            isDark ? 'text-blue-400/80' : 'text-blue-700'
          }`}>
            Live Arena
          </p>
        </div>

      </div>

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
