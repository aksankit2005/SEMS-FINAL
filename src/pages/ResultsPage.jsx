import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Search, Calendar, CheckCircle2, Award, Sparkles, Filter, ChevronDown, Check } from 'lucide-react';
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
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
            <span>FORMAT: <strong className="text-purple-500 dark:text-purple-300">{display.format}</strong></span>
            {display.cricket.targetRuns && (
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 text-[10px] font-mono">
                Target: {display.cricket.targetRuns}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 bg-slate-100/80 dark:bg-white/[0.04] p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate block font-spatial-sans">
                {display.team1}
              </span>
              <p className="text-sm font-black font-mono text-slate-900 dark:text-white">
                {display.cricket.runs1}/{display.cricket.wickets1}
              </p>
              <span className="text-[10px] font-mono text-slate-400">({display.cricket.overs1} ov)</span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate block font-spatial-sans">
                {display.team2}
              </span>
              <p className="text-sm font-black font-mono text-slate-900 dark:text-white">
                {display.cricket.runs2}/{display.cricket.wickets2}
              </p>
              <span className="text-[10px] font-mono text-slate-400">({display.cricket.overs2} ov)</span>
            </div>
          </div>
          {display.resultString && (
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 pt-0.5 flex items-center gap-1.5 font-spatial-sans">
              <span>⚡</span> {display.resultString}
            </p>
          )}
        </div>
      );

    case 'racket':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
              {display.racket.setsScoreText}
            </span>
            <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
              {display.format}
            </span>
          </div>
          {display.racket.setsBreakdown && display.racket.setsBreakdown.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {display.racket.setsBreakdown.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold border border-purple-500/20"
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
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
              {display.volleyball.setsScoreText}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              {display.format}
            </span>
          </div>
          {display.volleyball.setsBreakdown && display.volleyball.setsBreakdown.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {display.volleyball.setsBreakdown.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-500/20"
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
            <span className="text-base font-mono font-black text-purple-600 dark:text-purple-400">
              {display.team1} {display.basketball.score1} — {display.basketball.score2} {display.team2}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              {display.basketball.quarter}
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            Final Match Score (PTS)
          </p>
        </div>
      );

    case 'football':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-base font-mono font-black text-slate-900 dark:text-white">
              {display.team1} {display.football.score1} — {display.football.score2} {display.team2}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              {display.football.halfInfo}
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            {display.football.isDraw ? '🤝 Match Drawn' : `Goals: ${display.football.scoreText}`}
          </p>
        </div>
      );

    case 'kabaddi':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-base font-mono font-black text-amber-600 dark:text-amber-400">
              {display.team1} {display.kabaddi.score1} — {display.kabaddi.score2} {display.team2}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">PTS</span>
          </div>
          {(display.kabaddi.half1Text || display.kabaddi.half2Text) && (
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
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
            <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">
              {display.team1} {display.khokho.score1} — {display.khokho.score2} {display.team2}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">POINTS</span>
          </div>
          {display.khokho.inningsBreakdown && display.khokho.inningsBreakdown.length > 0 && (
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {display.khokho.inningsBreakdown.join(' • ')}
            </p>
          )}
        </div>
      );

    case 'tug':
      return (
        <div className="space-y-3">
          {/* Match Contestants */}
          <div className="p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20">
            <span className="text-[9px] font-mono uppercase font-black tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
              MATCH CONTESTANTS
            </span>
            <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              <span className="text-amber-600 dark:text-amber-400 truncate max-w-[45%]">
                {display.team1}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                VS
              </span>
              <span className="text-purple-600 dark:text-purple-400 truncate max-w-[45%] text-right">
                {display.team2}
              </span>
            </div>
          </div>

          {/* Sets Won Summary */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Sets Won
              </span>
              <div className="text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{display.team1}: <strong className="text-amber-600 dark:text-amber-400">{display.tug?.roundsWon1 ?? 0}</strong></span>
                <span className="text-slate-400">—</span>
                <span>{display.team2}: <strong className="text-purple-600 dark:text-purple-400">{display.tug?.roundsWon2 ?? 0}</strong></span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              {display.tug?.pullsScoreText || 'Sets Won'}
            </span>
          </div>

          {/* Round Breakdown */}
          {display.tug?.roundsBreakdown && display.tug.roundsBreakdown.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase font-black text-slate-500 dark:text-slate-400 block">
                Rounds Won Breakdown
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {display.tug.roundsBreakdown.map((rObj, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono font-black text-purple-600 dark:text-purple-400">
              {display.chess.scoreText}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              {display.format}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Verdict: <strong className="text-slate-900 dark:text-white">{display.chess.verdict}</strong>
          </p>
        </div>
      );

    case 'athletics':
      return (
        <div className="space-y-1.5 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-500">🥇 Gold:</span>
            <span className="font-bold text-slate-900 dark:text-white">{display.athletics.gold}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">🥈 Silver:</span>
            <span className="text-slate-700 dark:text-slate-300">{display.athletics.silver}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-700">🥉 Bronze:</span>
            <span className="text-slate-700 dark:text-slate-300">{display.athletics.bronze}</span>
          </div>
        </div>
      );

    default:
      return (
        <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-relaxed font-spatial-sans">
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
    <div className={`relative min-h-screen font-spatial-sans selection:bg-purple-500/30 selection:text-white overflow-x-hidden transition-colors duration-500 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      
      {/* ─── ATMOSPHERIC NEBULA BACKDROP (Dark vs Light - Gallery & Journey Cosmic Purple Theme) ─── */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-all duration-700 ${
        isDark ? 'spatial-nebula-dark' : 'spatial-nebula-light'
      }`} />

      {/* ─── TACTILE FILM GRAIN OVERLAY ─── */}
      <div className="fixed inset-0 spatial-grain-overlay z-[1] pointer-events-none opacity-25" />

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-8 sm:pb-12 space-y-4 sm:space-y-5">
        
        {/* ─── CENTERED LUXURY HERO BANNER (Matches Gallery / Journey Aesthetic) ─── */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          {/* Luxury Title: MATCH RESULTS */}
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-normal tracking-[0.06em] font-spatial-display uppercase ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            MATCH{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent font-semibold ${
              isDark 
                ? 'from-purple-400 via-indigo-300 to-amber-300' 
                : 'from-purple-700 via-indigo-700 to-amber-600'
            }`}>
              RESULTS
            </span>
          </h1>

          {/* Centered Italic Subtitle */}
          <p className={`text-xs sm:text-sm max-w-xl mx-auto italic font-spatial-sans font-light leading-relaxed ${
            isDark ? 'text-slate-300/85' : 'text-slate-600'
          }`}>
            Explore finalized match results, winner declarations, and score points across all 12 tournament sports.
          </p>
        </div>

        {/* ─── SPORTS FILTER SECTION (Side Roll-Down Dropdown Only) ─── */}
        <div className="flex items-center justify-between gap-2.5 pt-1 pb-1">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-purple-300/80' : 'text-purple-700'
            }`}>
              {selectedSport === 'All' ? 'All Disciplines' : selectedSport}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              {filteredResults.length} {filteredResults.length === 1 ? 'Result' : 'Results'}
            </span>
          </div>

          {/* Right Side: Small Luxury "Roll-Down" Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                isDark
                  ? 'bg-[#10121a]/90 hover:bg-[#181a24] text-purple-200 border-purple-500/30 shadow-xs hover:border-purple-400/50'
                  : 'bg-white hover:bg-slate-50 text-purple-900 border-slate-300 shadow-xs'
              }`}
              title="Filter by Sport"
              aria-label="Filter games roll-down dropdown"
            >
              <Filter className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate max-w-[100px] sm:max-w-[140px]">
                {selectedSport === 'All' ? 'Filter Sport' : selectedSport}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-purple-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Roll-Down Menu Popover */}
            {isDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-52 sm:w-60 rounded-2xl p-1.5 z-50 shadow-2xl border backdrop-blur-2xl max-h-80 overflow-y-auto no-scrollbar transition-all ${
                isDark
                  ? 'bg-[#0d0f18]/95 border-purple-500/30 text-slate-200 shadow-[0_12px_35px_rgba(0,0,0,0.85)]'
                  : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl'
              }`}>
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold text-purple-400 border-b border-purple-500/10 mb-1 flex items-center justify-between">
                  <span>Select Discipline</span>
                  <span className="text-slate-400 text-[9px]">{sportsList.length} Options</span>
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
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-purple-500/20 text-purple-200 font-bold border border-purple-500/30'
                            : 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                          : isDark
                            ? 'hover:bg-white/5 text-slate-300'
                            : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-sm">{icon}</span>
                        <span className="truncate">{s}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── RESULTS CARD GRID LAYOUT ─── */}
        {filteredResults.length === 0 ? (
          <div className={`text-center py-16 rounded-3xl border-0 p-8 space-y-3 backdrop-blur-md ${
            isDark
              ? 'bg-white/[0.02] text-slate-300'
              : 'bg-black/[0.02] text-slate-700'
          }`}>
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100/70 text-purple-700'
            }`}>
              <Trophy className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className={`text-lg font-bold font-spatial-display uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              No Match Results Found
            </h3>
            <p className={`text-xs max-w-md mx-auto font-spatial-sans ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              There are no completed match results matching "{selectedSport}" discipline or query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((res) => {
              const sportCfg = resolveSportConfig(res.sport || res);
              const sportIcon = sportCfg.icon || '🏆';

              return (
                <div
                  key={res.id}
                  className={`rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between space-y-5 group relative overflow-hidden backdrop-blur-xl ${
                    isDark
                      ? 'spatial-glass-card-dark border-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_20px_45px_rgba(0,0,0,0.8),0_0_25px_rgba(168,85,247,0.18)]'
                      : 'spatial-glass-card-light border-slate-200 hover:border-purple-300 hover:shadow-xl'
                  }`}
                >
                  {/* Card Top: Sport Icon, Sport Name, Date Badge */}
                  <div className={`flex items-center justify-between gap-3 pb-3 border-b ${
                    isDark ? 'border-white/10' : 'border-slate-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xs shrink-0 border transition-transform group-hover:scale-105 ${
                        isDark
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {sportIcon}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-black uppercase tracking-wider truncate font-spatial-display ${
                          isDark ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                          {res.sport}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block">#{res.id}</span>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full font-extrabold text-[10px] border uppercase flex items-center gap-1.5 shrink-0 font-mono ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-slate-300' 
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <Calendar className="w-3 h-3 text-purple-400" />
                      <span>{res.date}</span>
                    </span>
                  </div>

                  {/* Match Details: Event Title */}
                  <div className="space-y-3.5 flex-1">
                    <h3 className={`font-bold text-base leading-snug font-spatial-display tracking-wide uppercase ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {res.event}
                    </h3>

                    {/* Player / Team Winner Box */}
                    <div className={`p-4 rounded-2xl border space-y-1 transition-all ${
                      isDark
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    }`}>
                      <span className="text-[10px] font-mono uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Declared Winner / Champion
                      </span>
                      <p className={`text-base font-black leading-tight font-spatial-sans ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {res.winner}
                      </p>
                    </div>

                    {/* Sport-Specific Score Summary Box */}
                    <div className={`p-4 rounded-2xl border space-y-2 ${
                      isDark
                        ? 'bg-[#090b12]/80 border-white/10'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}>
                      <span className="text-[10px] font-mono uppercase font-black tracking-wider text-purple-400/80 dark:text-purple-300/70 block">
                        Official Score & Match Summary
                      </span>
                      <SportResultSummary resultData={res} />
                    </div>

                    {/* Optional MVP Detail */}
                    {res.mvp && res.mvp !== res.winner && (
                      <div className={`flex items-center gap-2 text-xs font-bold pt-1 ${
                        isDark ? 'text-amber-300/90' : 'text-amber-800'
                      }`}>
                        <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                        <span className="truncate">Player of the Match / MVP: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{res.mvp}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── CLASSIC INSPIRATIONAL SIGNATURE (Replacing standard footer) ─── */}
        <div className="pt-14 sm:pt-20 pb-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-3 opacity-60">
            <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent to-purple-400" />
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-l from-transparent to-purple-400" />
          </div>

          <p className={`font-spatial-display text-sm sm:text-base md:text-lg tracking-[0.14em] uppercase font-medium select-none ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            &ldquo;Your team plays hard to{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent font-bold ${
              isDark 
                ? 'from-purple-400 via-indigo-300 to-amber-300' 
                : 'from-purple-700 via-indigo-700 to-amber-600'
            }`}>
              win
            </span>
            &rdquo;
          </p>

          <p className={`text-[11px] sm:text-xs font-spatial-sans tracking-widest uppercase italic ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Champions are forged through grit, teamwork & relentless spirit
          </p>
        </div>

      </div>
    </div>
  );
};

