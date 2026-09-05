import React, { useState, useEffect, useRef } from 'react';
import { Play, Tv, RefreshCw, Video, Filter, ChevronDown, Check, Radio, Calendar, Clock, MapPin } from 'lucide-react';
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
      const publicLive = await coordinatorApi.getPublicLiveMatches();

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

        const sortedLive = sortLiveMatches(formattedLive);
        setLiveMatches(sortedLive);

        setSelectedMatch((prev) => {
          if (!prev || !prev.id) return null;
          const fresh = sortedLive.find((m) => m.id === prev.id);
          if (fresh) {
            return mergeMatchState(prev, fresh);
          }
          return null;
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
              sportName: m.sportName || m.sport || (inferredSportId.charAt(0).toUpperCase() + inferredSportId.slice(1).replace('-', ' ')),
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

    const liveInterval = setInterval(() => fetchLiveScores(), 6000);
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
    const sName = m.sportName || getSportConfig(m.sportId)?.name || m.sportId;
    return matchSportFilter(sName, selectedSportFilter);
  });

  return (
    <div className={`relative min-h-screen font-spatial-sans selection:bg-[#7156A5]/20 selection:text-[#211D2B] dark:selection:text-white overflow-x-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070A13] text-[#F5F2FA]' : 'bg-[#FAF9F6] text-[#211D2B]'
    }`}>
      {/* Dark mode atmospheric overlays */}
      {isDark && (
        <>
          <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60" />
          <div className="fixed inset-0 spatial-grain-overlay z-[1] pointer-events-none opacity-20" />
        </>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-6">

        {/* Editorial Hero Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[#FBEDEF] dark:bg-[#FBEDEF]/10 text-[#C62828] dark:text-[#FDA4AF] border border-[#FFCDD2] dark:border-[#FBEDEF]/20">
            <span className="w-2 h-2 rounded-full bg-[#C62828] dark:bg-[#FDA4AF] animate-ping" />
            <span>Championship Live Arena</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
            Live <span className="text-[#7156A5] dark:text-[#B8A5E5]">Matches</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] leading-relaxed">
            Real-time court updates, instantaneous scoring, and live video feeds across all active championship fixtures.
          </p>
        </div>

        {/* Controls & Filter Bar */}
        <div className="bg-[#FFFFFF] dark:bg-[#0D101A] p-3 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          {/* Left: Discipline & Count */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA]">
              {selectedSportFilter === 'All' ? 'All Disciplines' : selectedSportFilter}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] flex items-center gap-1.5">
              {filteredLiveMatches.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#C62828] dark:bg-[#FDA4AF] animate-ping" />}
              {filteredLiveMatches.length} {filteredLiveMatches.length === 1 ? 'Live Match' : 'Live Matches'}
            </span>
          </div>

          {/* Right: Sync indicator & Roll-down sport dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-medium flex items-center gap-1.5 text-[#686370] dark:text-[#AAA4B8]">
              <RefreshCw className="w-3 h-3 text-[#1B5E20] dark:text-[#81C784] animate-spin" />
              <span>Live Sync Active</span>
            </span>

            {/* Roll-Down Sport Filter Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] hover:border-[#7156A5] dark:hover:border-[#B8A5E5]"
                title="Filter by Sport"
                aria-label="Filter sport roll-down dropdown"
              >
                <Filter className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />
                <span className="truncate max-w-[120px]">
                  {selectedSportFilter === 'All' ? 'Filter Sport' : selectedSportFilter}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#686370] dark:text-[#AAA4B8] shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Roll-Down Menu Popover */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-lg p-1.5 z-50 shadow-md border bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] max-h-80 overflow-y-auto">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.1)] mb-1 flex items-center justify-between">
                    <span>Discipline</span>
                    <span className="text-[9px]">{availableSports.length} Options</span>
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
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] font-semibold'
                            : 'hover:bg-[#FAF9F6] dark:hover:bg-[#161B2E] text-[#211D2B] dark:text-[#F5F2FA]'
                        }`}
                      >
                        <span className="truncate">{sport}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Matches Section */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#7156A5] dark:border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8]">
                Connecting to Live Arena Feed...
              </p>
            </div>
          ) : filteredLiveMatches.length === 0 ? (
            /* Empty State */
            <div className="py-14 px-6 text-center space-y-3 bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto text-xl bg-[#F4F2F7] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                🏟️
              </div>
              <h3 className="text-base font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
                No Live Matches Right Now
              </h3>
              <p className="text-xs max-w-md mx-auto text-[#686370] dark:text-[#AAA4B8]">
                There are no active matches being contested for {selectedSportFilter === 'All' ? 'any discipline' : selectedSportFilter}. Review upcoming scheduled matches below.
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
                    className="bg-[#FFFFFF] dark:bg-[#0D101A] p-5 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/40 dark:hover:border-[#8B5CF6]/40 transition-all space-y-4 group cursor-pointer shadow-2xs"
                  >
                    {/* Status & Venue Top Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isFinished ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#F4F2F7] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                            Finished
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1.5 uppercase bg-[#FBEDEF] dark:bg-[#FBEDEF]/15 text-[#C62828] dark:text-[#FDA4AF] border border-[#FFCDD2] dark:border-[#FBEDEF]/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C62828] dark:bg-[#FDA4AF] animate-ping" />
                            LIVE
                          </span>
                        )}
                        {hasLiveStream && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#C62828] text-white flex items-center gap-1">
                            <Video className="w-2.5 h-2.5" /> STREAM
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[#A98B57] dark:text-[#D2AB45] truncate max-w-[150px]">
                        {m.tableNumber || m.venue || sportConfig.venueOptions[0]}
                      </span>
                    </div>

                    {/* Prominent Sport Icon & Header */}
                    <div className="flex items-center gap-3 py-1 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0 bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                        {sportConfig.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider truncate text-[#7156A5] dark:text-[#B8A5E5]">
                            {sportConfig.name}
                          </span>
                          <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8] shrink-0">
                            #{m.id}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold truncate text-[#211D2B] dark:text-[#F5F2FA]">
                          {m.matchTitle || (isAthleticsMatch ? `Athletics Meet — ${m.activeSubEvent || '100m Race'}` : `${t1Name} vs ${t2Name}`)}
                        </h3>
                      </div>
                    </div>

                    {/* Sport-Specific Score Display Box */}
                    {isCricketMatch ? (
                      <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#1B5E20] dark:bg-[#81C784] animate-ping" />
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#EDF7F0] dark:bg-[#1B5E20]/20 text-[#1B5E20] dark:text-[#81C784] border border-[#C8E6C9] dark:border-[#1B5E20]/30">
                              🏏 {currentInnings === 2 ? '2ND INNINGS' : '1ST INNINGS'}
                            </span>
                          </div>
                          {m.targetRuns ? (
                            <span className="text-[10px] font-semibold text-[#A98B57] dark:text-[#D2AB45]">
                              Target: {m.targetRuns} Runs
                            </span>
                          ) : m.totalOversMax ? (
                            <span className="text-[10px] text-[#686370] dark:text-[#AAA4B8]">
                              Max: {m.totalOversMax} Ov
                            </span>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 items-stretch">
                          <div className={`p-2.5 rounded-lg border transition-all ${
                            !isT2Batting
                              ? 'bg-[#FFFFFF] dark:bg-[#0D101A] border-[#7156A5]/40 dark:border-[#8B5CF6]/40'
                              : 'bg-[#F4F2F7] dark:bg-[#070A13] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.1)]'
                          }`}>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-xs font-bold text-[#211D2B] dark:text-[#F5F2FA] truncate" title={t1Name}>
                                {t1Name}
                              </span>
                              {!isT2Batting && (
                                <span className="text-[9px] font-mono font-bold text-[#1B5E20] dark:text-[#81C784] bg-[#EDF7F0] dark:bg-[#1B5E20]/20 px-1 rounded uppercase">
                                  BAT
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1 font-mono tabular-nums">
                              <span className="text-xl sm:text-2xl font-bold text-[#211D2B] dark:text-[#F5F2FA]">
                                {t1Cricket.runs}
                              </span>
                              <span className="text-sm font-semibold text-[#686370] dark:text-[#AAA4B8]">/</span>
                              <span className="text-base sm:text-lg font-bold text-[#C62828] dark:text-[#FDA4AF]">
                                {t1Cricket.wickets}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8] pt-0.5">
                              Overs: <strong className="text-[#211D2B] dark:text-[#F5F2FA]">{t1Cricket.overs}</strong>
                            </div>
                          </div>

                          <div className={`p-2.5 rounded-lg border transition-all ${
                            isT2Batting
                              ? 'bg-[#FFFFFF] dark:bg-[#0D101A] border-[#7156A5]/40 dark:border-[#8B5CF6]/40'
                              : 'bg-[#F4F2F7] dark:bg-[#070A13] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.1)]'
                          }`}>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-xs font-bold text-[#211D2B] dark:text-[#F5F2FA] truncate" title={t2Name}>
                                {t2Name}
                              </span>
                              {isT2Batting && (
                                <span className="text-[9px] font-mono font-bold text-[#1B5E20] dark:text-[#81C784] bg-[#EDF7F0] dark:bg-[#1B5E20]/20 px-1 rounded uppercase">
                                  BAT
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1 font-mono tabular-nums">
                              <span className="text-xl sm:text-2xl font-bold text-[#211D2B] dark:text-[#F5F2FA]">
                                {t2Cricket.runs}
                              </span>
                              <span className="text-sm font-semibold text-[#686370] dark:text-[#AAA4B8]">/</span>
                              <span className="text-base sm:text-lg font-bold text-[#C62828] dark:text-[#FDA4AF]">
                                {t2Cricket.wickets}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8] pt-0.5">
                              Overs: <strong className="text-[#211D2B] dark:text-[#F5F2FA]">{t2Cricket.overs}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* General Ball / Racket / Court Score Display */
                      <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs sm:text-sm font-bold truncate text-[#211D2B] dark:text-[#F5F2FA]" title={t1Name}>
                            {t1Name}
                          </p>
                        </div>

                        <div className="px-3.5 py-1 rounded-lg border text-center font-mono font-bold text-xl sm:text-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#7156A5] dark:text-[#B8A5E5] shrink-0">
                          {score1Display} : {score2Display}
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-xs sm:text-sm font-bold truncate text-[#211D2B] dark:text-[#F5F2FA]" title={t2Name}>
                            {t2Name}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer Action Row */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-medium text-[#686370] dark:text-[#AAA4B8] truncate max-w-[180px]">
                        {m.currentInfo || (isFinished ? 'Match Ended' : 'Match In Progress')}
                      </span>

                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#7156A5] hover:bg-[#5E4491] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                      >
                        {hasLiveStream ? <Tv className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
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
                        <div className="pt-2 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center justify-between gap-2 text-[10px] font-mono">
                          <span className="font-semibold text-[#686370] dark:text-[#AAA4B8] uppercase shrink-0">Set Scores:</span>
                          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                            {activeSets.map((s) => (
                              <span key={s.set} className="px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] font-semibold shrink-0">
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

        {/* Upcoming Programme Section */}
        {filteredUpcomingMatches.length > 0 && (
          <div className="pt-8 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <div>
                <h2 className="text-lg font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
                  Upcoming Today & Next
                </h2>
                <p className="text-xs text-[#686370] dark:text-[#AAA4B8]">
                  Fixtures queued up next across arena courts
                </p>
              </div>
              <span className="text-xs font-semibold text-[#7156A5] dark:text-[#B8A5E5]">
                {filteredUpcomingMatches.length} Fixtures
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredUpcomingMatches.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FFFFFF] dark:bg-[#0D101A] p-3.5 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                      {item.sportName}
                    </span>
                    <span className="text-[11px] text-[#686370] dark:text-[#AAA4B8] flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[#596B98] dark:text-[#B8A5E5]" />
                      {item.time}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#211D2B] dark:text-[#F5F2FA] truncate">
                    {item.matchTitle}
                  </h4>
                  <div className="text-[11px] text-[#686370] dark:text-[#AAA4B8] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#A98B57] dark:text-[#D2AB45]" />
                    <span className="truncate">{item.venue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedication Footer */}
        <div className="pt-12 pb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 opacity-40">
            <div className="h-[1px] w-16 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
            <Radio className="w-3 h-3 text-[#7156A5] dark:text-[#B8A5E5]" />
            <div className="h-[1px] w-16 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
          </div>

          <p className="font-spatial-display text-xs sm:text-sm tracking-wider uppercase font-semibold text-[#686370] dark:text-[#AAA4B8] select-none">
            &ldquo;Courage Under Fire, Glory in Every Second.&rdquo;
          </p>

          <p className="text-[11px] font-spatial-sans text-[#686370] dark:text-[#AAA4B8]">
            APEX Live Stream & Scoring Engine
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
