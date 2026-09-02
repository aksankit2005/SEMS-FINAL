import React, { useState, useEffect } from 'react';
import { Trophy, Star, Search, Calendar, CheckCircle2, Award } from 'lucide-react';
import { coordinatorApi } from '../services/coordinatorApi';
import { resolveSportConfig } from '../data/sportsConfig';
import { getSportResultDisplay } from '../utils/sportResultFormatters';

const SportResultSummary = ({ resultData }) => {
  const display = getSportResultDisplay(resultData.rawMatch || resultData);

  switch (display.sportType) {
    case 'cricket':
      return (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
            <span>FORMAT: <strong className="text-orange-500">{display.format}</strong></span>
            {display.cricket.targetRuns && (
              <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20">
                Target: {display.cricket.targetRuns}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate block">
                {display.team1}
              </span>
              <p className="text-sm font-black font-mono text-slate-900 dark:text-white">
                {display.cricket.runs1}/{display.cricket.wickets1}
              </p>
              <span className="text-[10px] font-mono text-slate-400">({display.cricket.overs1} ov)</span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate block">
                {display.team2}
              </span>
              <p className="text-sm font-black font-mono text-slate-900 dark:text-white">
                {display.cricket.runs2}/{display.cricket.wickets2}
              </p>
              <span className="text-[10px] font-mono text-slate-400">({display.cricket.overs2} ov)</span>
            </div>
          </div>
          {display.resultString && (
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 pt-0.5 flex items-center gap-1.5">
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
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              {display.format}
            </span>
          </div>
          {display.racket.setsBreakdown && display.racket.setsBreakdown.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {display.racket.setsBreakdown.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold border border-indigo-500/20"
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
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20"
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
            <span className="text-base font-mono font-black text-orange-600 dark:text-orange-400">
              {display.team1} {display.basketball.score1} — {display.basketball.score2} {display.team2}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
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
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
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
          <div className="p-3 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20">
            <span className="text-[9px] font-mono uppercase font-black tracking-wider text-orange-600 dark:text-orange-400 block mb-1">
              MATCH CONTESTANTS
            </span>
            <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              <span className="text-orange-600 dark:text-orange-400 truncate max-w-[45%]">
                {display.team1}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold shrink-0">
                VS
              </span>
              <span className="text-blue-600 dark:text-blue-400 truncate max-w-[45%] text-right">
                {display.team2}
              </span>
            </div>
          </div>

          {/* Sets Won Summary */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Sets Won
              </span>
              <div className="text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{display.team1}: <strong className="text-orange-600 dark:text-orange-400">{display.tug?.roundsWon1 ?? 0}</strong></span>
                <span className="text-slate-400">—</span>
                <span>{display.team2}: <strong className="text-blue-600 dark:text-blue-400">{display.tug?.roundsWon2 ?? 0}</strong></span>
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
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs"
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
        <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-relaxed">
          {display.summaryText}
        </p>
      );
  }
};

export const ResultsPage = () => {
  const [query, setQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [dynamicResults, setDynamicResults] = useState([]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-8 sm:py-10 transition-colors">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3 border border-blue-500/20 shadow-xs">
            <Trophy className="w-4 h-4 text-orange-500" /> Tournament Match Results
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Official <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">Match Results</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            Explore finalized match results, winner declarations, and score points across all 12 tournament sports.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="space-y-4 mb-8 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-500" /> Filter By Sport ({sportsList.length - 1} Disciplines)
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {filteredResults.length} {filteredResults.length === 1 ? 'Result' : 'Results'}
            </span>
          </div>

          {/* 12 Games Horizontal Filter Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth -mx-1 px-1">
            {sportsList.map((s) => {
              const cfg = s === 'All' ? null : resolveSportConfig(s);
              const icon = s === 'All' ? '⚡' : cfg?.icon || '🏆';
              const isSelected = selectedSport === s;

              return (
                <button
                  key={s}
                  onClick={() => setSelectedSport(s)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/20 font-black scale-105'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{s}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full pt-1">
            <Search className="w-4 h-4 absolute left-3.5 top-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search winner team, player name, or match title..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Results Card Grid Layout */}
        {filteredResults.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8 space-y-3">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Match Results Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
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
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-orange-500/50 transition-all duration-300 flex flex-col justify-between space-y-5 group"
                >
                  {/* Card Top: Sport Icon, Sport Name, Date Badge */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/20 dark:from-orange-600/30 dark:to-amber-600/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-2xl font-black shadow-xs shrink-0">
                        {sportIcon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black uppercase tracking-wide text-orange-600 dark:text-orange-400 truncate">
                          {res.sport}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 block">#{res.id}</span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] border border-slate-200 dark:border-slate-700/60 uppercase flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      <span>{res.date}</span>
                    </span>
                  </div>

                  {/* Match Details: Event Title */}
                  <div className="space-y-3 flex-1">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                      {res.event}
                    </h3>

                    {/* Player / Team Winner Box */}
                    <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] font-mono uppercase font-black tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Declared Winner / Champion
                      </span>
                      <p className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        {res.winner}
                      </p>
                    </div>

                    {/* Sport-Specific Score Summary Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 block">
                        Official Score & Match Summary
                      </span>
                      <SportResultSummary resultData={res} />
                    </div>

                    {/* Optional MVP Detail (Only when separately recorded as distinct player award) */}
                    {res.mvp && res.mvp !== res.winner && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 pt-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Player of the Match / MVP: <strong className="text-slate-900 dark:text-white">{res.mvp}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

