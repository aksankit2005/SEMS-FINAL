import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Search, Calendar, CheckCircle2, Award, Sparkles, Filter, ChevronDown, Check, X } from 'lucide-react';
import { coordinatorApi } from '../services/coordinatorApi';
import { resolveSportConfig } from '../data/sportsConfig';
import { getSportResultDisplay } from '../utils/sportResultFormatters';
import { useTheme } from '../context/ThemeContext';
import '../styles/spatialGallery.css';

const SportResultSummary = ({ resultData }) => {
  const display = getSportResultDisplay(resultData.rawMatch || resultData);

  switch (display.sportType) {
    case 'cricket':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-[#686370] dark:text-[#AAA4B8]">
            <span>FORMAT: <strong className="text-[#7156A5] dark:text-[#B8A5E5]">{display.format}</strong></span>
            {display.cricket.targetRuns && (
              <span className="bg-[#FAF9F6] dark:bg-[#121625] text-[#A98B57] dark:text-[#D2AB45] px-2 py-0.5 rounded border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[10px] font-mono">
                Target: {display.cricket.targetRuns}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 bg-[#F4F2F7] dark:bg-[#121625] p-2.5 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-[#686370] dark:text-[#AAA4B8] uppercase truncate block font-spatial-sans">
                {display.team1}
              </span>
              <p className="text-sm font-bold font-mono text-[#211D2B] dark:text-[#F5F2FA]">
                {display.cricket.runs1}/{display.cricket.wickets1}
              </p>
              <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8]">({display.cricket.overs1} ov)</span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-semibold text-[#686370] dark:text-[#AAA4B8] uppercase truncate block font-spatial-sans">
                {display.team2}
              </span>
              <p className="text-sm font-bold font-mono text-[#211D2B] dark:text-[#F5F2FA]">
                {display.cricket.runs2}/{display.cricket.wickets2}
              </p>
              <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8]">({display.cricket.overs2} ov)</span>
            </div>
          </div>
          {display.resultString && (
            <p className="text-xs font-semibold text-[#A98B57] dark:text-[#D2AB45] pt-0.5 flex items-center gap-1.5 font-spatial-sans">
              <span>⚡</span> {display.resultString}
            </p>
          )}
        </div>
      );

    case 'racket':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#211D2B] dark:text-[#F5F2FA]">
              {display.racket.setsScoreText}
            </span>
            <span className="text-[10px] font-mono font-semibold text-[#7156A5] dark:text-[#B8A5E5] uppercase">
              {display.format}
            </span>
          </div>
          {display.racket.setsBreakdown && display.racket.setsBreakdown.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {display.racket.setsBreakdown.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]"
                >
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      );

    case 'volleyball':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#211D2B] dark:text-[#F5F2FA]">
              {display.volleyball.setsScoreText}
            </span>
            <span className="text-[10px] font-mono font-semibold text-[#686370] dark:text-[#AAA4B8] uppercase">
              {display.format}
            </span>
          </div>
          {display.volleyball.setsBreakdown && display.volleyball.setsBreakdown.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {display.volleyball.setsBreakdown.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#EDF7F0] dark:bg-[#1B5E20]/20 text-[#1B5E20] dark:text-[#81C784] border border-[#C8E6C9] dark:border-[#1B5E20]/40"
                >
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      );

    case 'basketball':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono font-bold text-[#7156A5] dark:text-[#B8A5E5]">
              {display.team1} {display.basketball.score1} — {display.basketball.score2} {display.team2}
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
              {display.basketball.quarter}
            </span>
          </div>
          <p className="text-xs font-mono text-[#686370] dark:text-[#AAA4B8]">
            Final Match Score (PTS)
          </p>
        </div>
      );

    case 'football':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono font-bold text-[#211D2B] dark:text-[#F5F2FA]">
              {display.team1} {display.football.score1} — {display.football.score2} {display.team2}
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
              {display.football.halfInfo}
            </span>
          </div>
          <p className="text-xs font-mono text-[#686370] dark:text-[#AAA4B8]">
            {display.football.isDraw ? '🤝 Match Drawn' : `Goals: ${display.football.scoreText}`}
          </p>
        </div>
      );

    case 'kabaddi':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono font-bold text-[#A98B57] dark:text-[#D2AB45]">
              {display.team1} {display.kabaddi.score1} — {display.kabaddi.score2} {display.team2}
            </span>
            <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8]">PTS</span>
          </div>
          {(display.kabaddi.half1Text || display.kabaddi.half2Text) && (
            <div className="flex items-center gap-2 text-xs font-mono text-[#686370] dark:text-[#AAA4B8]">
              {display.kabaddi.half1Text && <span>{display.kabaddi.half1Text}</span>}
              {display.kabaddi.half2Text && <span>• {display.kabaddi.half2Text}</span>}
            </div>
          )}
        </div>
      );

    case 'khokho':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono font-bold text-[#1B5E20] dark:text-[#81C784]">
              {display.team1} {display.khokho.score1} — {display.khokho.score2} {display.team2}
            </span>
            <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8]">POINTS</span>
          </div>
          {display.khokho.inningsBreakdown && display.khokho.inningsBreakdown.length > 0 && (
            <p className="text-xs font-mono text-[#686370] dark:text-[#AAA4B8]">
              {display.khokho.inningsBreakdown.join(' • ')}
            </p>
          )}
        </div>
      );

    case 'tug':
      return (
        <div className="space-y-2.5">
          <div className="p-2.5 rounded-lg bg-[#F4F2F7] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
            <span className="text-[9px] font-mono uppercase font-semibold text-[#7156A5] dark:text-[#B8A5E5] block mb-1">
              Match Contestants
            </span>
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#211D2B] dark:text-[#F5F2FA]">
              <span className="text-[#A98B57] dark:text-[#D2AB45] truncate max-w-[45%]">
                {display.team1}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#070A13] text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                VS
              </span>
              <span className="text-[#7156A5] dark:text-[#B8A5E5] truncate max-w-[45%] text-right">
                {display.team2}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-[#686370] dark:text-[#AAA4B8]">
                Sets Won
              </span>
              <div className="text-xs font-mono font-bold text-[#211D2B] dark:text-[#F5F2FA] flex items-center gap-2">
                <span>{display.team1}: <strong className="text-[#A98B57] dark:text-[#D2AB45]">{display.tug?.roundsWon1 ?? 0}</strong></span>
                <span className="text-[#686370] dark:text-[#AAA4B8]">—</span>
                <span>{display.team2}: <strong className="text-[#7156A5] dark:text-[#B8A5E5]">{display.tug?.roundsWon2 ?? 0}</strong></span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] shrink-0">
              {display.tug?.pullsScoreText || 'Sets Won'}
            </span>
          </div>

          {display.tug?.roundsBreakdown && display.tug.roundsBreakdown.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <span className="text-[10px] font-mono uppercase font-semibold text-[#686370] dark:text-[#AAA4B8] block">
                Rounds Won Breakdown
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {display.tug.roundsBreakdown.map((rObj, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#121625] text-[11px] font-mono text-[#211D2B] dark:text-[#F5F2FA] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20] dark:bg-[#81C784]" />
                    <span>{typeof rObj === 'string' ? rObj : rObj.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case 'chess':
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#7156A5] dark:text-[#B8A5E5]">
              {display.chess.scoreText}
            </span>
            <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8] uppercase">
              {display.format}
            </span>
          </div>
          <p className="text-xs text-[#686370] dark:text-[#AAA4B8]">
            Verdict: <strong className="text-[#211D2B] dark:text-[#F5F2FA]">{display.chess.verdict}</strong>
          </p>
        </div>
      );

    case 'athletics':
      return (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#A98B57] dark:text-[#D2AB45]">🥇 Gold:</span>
            <span className="font-bold text-[#211D2B] dark:text-[#F5F2FA]">{display.athletics.gold}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#686370] dark:text-[#AAA4B8]">🥈 Silver:</span>
            <span className="text-[#211D2B] dark:text-[#F5F2FA]">{display.athletics.silver}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#A98B57] dark:text-[#D2AB45]">🥉 Bronze:</span>
            <span className="text-[#211D2B] dark:text-[#F5F2FA]">{display.athletics.bronze}</span>
          </div>
        </div>
      );

    default:
      return (
        <p className="text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA] leading-relaxed font-spatial-sans">
          {display.summaryText}
        </p>
      );
  }
};

export const ResultsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [query, setQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [dynamicResults, setDynamicResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close sport dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      const list = [];
      const seenIds = new Set();

      // 0. Deleted result IDs to filter out permanently
      let deletedIds = new Set();
      try {
        const deletedStr = localStorage.getItem('sems_deleted_result_ids');
        if (deletedStr) {
          const parsed = JSON.parse(deletedStr);
          if (Array.isArray(parsed)) {
            deletedIds = new Set(parsed);
          }
        }
      } catch (e) {}

      // 1. Gather all local storage edited results
      const localResultsMap = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sems_completed_results_')) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(parsed)) {
              parsed.forEach((item) => {
                if (item && item.id) {
                  localResultsMap[item.id] = item;
                }
              });
            }
          } catch (e) {}
        }
      }

      // 2. Fetch real completed results from Supabase PostgreSQL database
      try {
        const dbResults = await coordinatorApi.getPublicResults();
        if (dbResults && Array.isArray(dbResults)) {
          dbResults.forEach((item) => {
            if (!item || !item.id || seenIds.has(item.id) || deletedIds.has(item.id)) return;
            seenIds.add(item.id);

            // Merge with local edited version if available so coordinator edits take immediate precedence
            const mergedItem = localResultsMap[item.id]
              ? { ...item, ...localResultsMap[item.id], rawMatch: { ...(item.rawMatch || item), ...localResultsMap[item.id] } }
              : item;

            const display = getSportResultDisplay(mergedItem.rawMatch || mergedItem);
            list.push({
              id: mergedItem.id,
              sport: display.sportName || mergedItem.sport || 'Sports Event',
              event: display.eventTitle || mergedItem.event || 'Championship Match',
              winner: display.winner || mergedItem.winner || 'Declared Winner',
              scoreSummary: display.summaryText || mergedItem.scoreSummary || 'Completed',
              date: display.date || mergedItem.date,
              mvp: display.mvp,
              rawMatch: mergedItem.rawMatch || mergedItem
            });
          });
        }
      } catch (e) {
        console.warn('Could not fetch DB results:', e);
      }

      // 3. Add any remaining local results that were not returned by DB
      Object.values(localResultsMap).forEach((item) => {
        if (!item || !item.id || seenIds.has(item.id) || deletedIds.has(item.id)) return;
        seenIds.add(item.id);
        const display = getSportResultDisplay(item);
        list.push({
          id: item.id,
          sport: display.sportName || item.sportName || 'Sports Event',
          event: display.eventTitle || item.eventTitle || 'Championship Final',
          winner: display.winner || item.winner || 'Declared Winner',
          scoreSummary: display.summaryText || item.scoreSummary || 'Match Completed',
          date: display.date || (item.completedAt ? item.completedAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          mvp: display.mvp,
          rawMatch: item
        });
      });

      setDynamicResults(list);
    };

    fetchResults();

    window.addEventListener('storage', fetchResults);
    window.addEventListener('sems_results_updated', fetchResults);

    return () => {
      window.removeEventListener('storage', fetchResults);
      window.removeEventListener('sems_results_updated', fetchResults);
    };
  }, []);

  const sportsList = [
    'All',
    'Table Tennis',
    'Badminton',
    'Football',
    'Cricket',
    'Basketball',
    'Kabaddi',
    'Chess',
    'Athletics',
    'Volleyball',
    'Kho-Kho',
    'Tug of War',
    'Gully Cricket'
  ];

  const combinedResults = dynamicResults;

  const filteredResults = combinedResults.filter((r) => {
    const matchesQuery =
      (r.sport || '').toLowerCase().includes(query.toLowerCase()) ||
      (r.winner || '').toLowerCase().includes(query.toLowerCase()) ||
      (r.event || '').toLowerCase().includes(query.toLowerCase()) ||
      (r.scoreSummary || '').toLowerCase().includes(query.toLowerCase());

    const matchesSport =
      selectedSport === 'All' ||
      (r.sport || '').toLowerCase().replace(/[^a-z0-9]/g, '') === selectedSport.toLowerCase().replace(/[^a-z0-9]/g, '');

    return matchesQuery && matchesSport;
  });

  return (
    <div className={`relative min-h-screen font-spatial-sans selection:bg-[#7156A5]/20 selection:text-[#211D2B] dark:selection:text-white overflow-x-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070A13] text-[#F5F2FA]' : 'bg-[#FAF9F6] text-[#211D2B]'
    }`}>
      
      {/* Dark mode atmospheric overlays preserved */}
      {isDark && (
        <>
          <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60" />
          <div className="fixed inset-0 spatial-grain-overlay z-[1] pointer-events-none opacity-20" />
        </>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-6">
        
        {/* Editorial Header Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
            <Trophy className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
            <span>Official Tournament Archive</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
            Match <span className="text-[#7156A5] dark:text-[#B8A5E5]">Results</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] leading-relaxed">
            Verified match conclusions, winner declarations, and official scores across all championship disciplines.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-[#FFFFFF] dark:bg-[#0D101A] p-3 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#686370] dark:text-[#AAA4B8]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team, sport, or score..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] placeholder-[#686370] dark:placeholder-[#AAA4B8] focus:outline-none focus:border-[#7156A5] dark:focus:border-[#8B5CF6] transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#686370] hover:text-[#211D2B] dark:text-[#AAA4B8] dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            {/* Result Counter */}
            <span className="text-[11px] font-semibold text-[#686370] dark:text-[#AAA4B8]">
              {filteredResults.length} {filteredResults.length === 1 ? 'Result' : 'Results'}
            </span>

            {/* Sport Filter Roll-Down Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] hover:border-[#7156A5] dark:hover:border-[#B8A5E5]"
                title="Filter by Sport"
                aria-label="Filter games roll-down dropdown"
              >
                <Filter className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />
                <span className="truncate max-w-[120px]">
                  {selectedSport === 'All' ? 'All Sports' : selectedSport}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#686370] dark:text-[#AAA4B8] shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Roll-Down Menu Popover */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-lg p-1.5 z-50 shadow-md border bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] max-h-80 overflow-y-auto font-spatial-sans">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.1)] mb-1 flex items-center justify-between">
                    <span>Discipline</span>
                    <span className="text-[9px]">{sportsList.length} Options</span>
                  </div>
                  {sportsList.map((s) => {
                    const cfg = s === 'All' ? null : resolveSportConfig(s);
                    const icon = s === 'All' ? '⚡' : cfg?.icon || '🏆';
                    const isSelected = selectedSport === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setSelectedSport(s);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] font-semibold'
                            : 'hover:bg-[#FAF9F6] dark:hover:bg-[#161B2E] text-[#211D2B] dark:text-[#F5F2FA]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs">{icon}</span>
                          <span className="truncate">{s}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Card Grid Layout */}
        {filteredResults.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] p-8 space-y-3">
            <div className="w-12 h-12 rounded-lg mx-auto flex items-center justify-center bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
              <Trophy className="w-6 h-6 text-[#A98B57] dark:text-[#D2AB45]" />
            </div>
            <h3 className="text-base font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
              No Match Results Found
            </h3>
            <p className="text-xs max-w-md mx-auto text-[#686370] dark:text-[#AAA4B8]">
              There are no completed match results matching "{selectedSport}" discipline or query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResults.map((res) => {
              const sportCfg = resolveSportConfig(res.sport || res);
              const sportIcon = sportCfg.icon || '🏆';

              return (
                <div
                  key={res.id}
                  className="bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg p-5 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/40 dark:hover:border-[#8B5CF6]/40 transition-all flex flex-col justify-between space-y-4 group shadow-2xs"
                >
                  {/* Card Top: Sport Icon, Sport Name, Date Badge */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold shrink-0 bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                        {sportIcon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold uppercase tracking-wider truncate text-[#7156A5] dark:text-[#B8A5E5] font-spatial-sans">
                          {res.sport}
                        </h4>
                        <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8] block">#{res.id}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center gap-1 shrink-0 font-mono">
                      <Calendar className="w-3 h-3 text-[#596B98] dark:text-[#B8A5E5]" />
                      <span>{res.date}</span>
                    </span>
                  </div>

                  {/* Match Details: Event Title */}
                  <div className="space-y-3 flex-1">
                    <h3 className="font-bold text-sm sm:text-base leading-snug font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
                      {res.event}
                    </h3>

                    {/* Winner Box: Soft Winner Mint Accent */}
                    <div className="p-3 rounded-lg bg-[#EDF7F0] dark:bg-[#1B5E20]/15 border border-[#C8E6C9] dark:border-[#1B5E20]/30 space-y-0.5">
                      <span className="text-[10px] font-mono uppercase font-semibold text-[#1B5E20] dark:text-[#81C784] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E20] dark:text-[#81C784]" /> Declared Winner
                      </span>
                      <p className="text-sm sm:text-base font-bold text-[#1B5E20] dark:text-[#F5F2FA] font-spatial-sans">
                        {res.winner}
                      </p>
                    </div>

                    {/* Sport-Specific Score Summary Box */}
                    <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] space-y-2">
                      <span className="text-[10px] font-mono uppercase font-semibold text-[#686370] dark:text-[#AAA4B8] block">
                        Official Score & Summary
                      </span>
                      <SportResultSummary resultData={res} />
                    </div>

                    {/* Optional MVP Detail */}
                    {res.mvp && res.mvp !== res.winner && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#A98B57] dark:text-[#D2AB45] pt-0.5">
                        <Star className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45] shrink-0 fill-current" />
                        <span className="truncate">Player of Match / MVP: <strong className="text-[#211D2B] dark:text-[#F5F2FA]">{res.mvp}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dignified Signature Footer */}
        <div className="pt-10 pb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 opacity-40">
            <div className="h-[1px] w-16 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
            <Sparkles className="w-3 h-3 text-[#A98B57] dark:text-[#D2AB45]" />
            <div className="h-[1px] w-16 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
          </div>

          <p className="font-spatial-display text-xs sm:text-sm tracking-wider uppercase font-semibold text-[#686370] dark:text-[#AAA4B8] select-none">
            &ldquo;Honor in Victory, Dignity in Defeat.&rdquo;
          </p>

          <p className="text-[11px] font-spatial-sans text-[#686370] dark:text-[#AAA4B8]">
            APEX Championship Directorate • Maharana Pratap Engineering College
          </p>
        </div>

      </div>
    </div>
  );
};
