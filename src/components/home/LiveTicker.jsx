import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowRight, Trophy, Crown, ChevronRight, Activity } from 'lucide-react';
import { useSportsData } from '../../context/SportsDataContext';
import { ALL_COLLEGES } from '../../services/superCoordinatorApi';

const computeStandings = () => {
  let entries = [];
  try {
    const stored = localStorage.getItem('sems_super_coord_leaderboard');
    if (stored) entries = JSON.parse(stored);
  } catch (e) {}

  const tally = {};
  entries.forEach((entry) => {
    const winner = entry.winnerCollege;
    const runnerUp = entry.runnerUpCollege;
    if (winner) {
      if (!tally[winner]) tally[winner] = { gold: 0, silver: 0 };
      tally[winner].gold += 1;
    }
    if (runnerUp) {
      if (!tally[runnerUp]) tally[runnerUp] = { gold: 0, silver: 0 };
      tally[runnerUp].silver += 1;
    }
  });

  const standings = (ALL_COLLEGES || [])
    .filter((c) => c.id !== 'EXTERNAL')
    .map((college) => {
      const counts = tally[college.id] || { gold: 0, silver: 0 };
      return {
        id: college.id,
        college: college.name,
        code: college.id,
        gold: counts.gold,
        silver: counts.silver,
        totalPoints: counts.gold * 2 + counts.silver * 1,
      };
    });

  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    return a.college.localeCompare(b.college);
  });

  return standings;
};

export const LiveTicker = () => {
  const { liveMatches } = useSportsData();
  const [standings, setStandings] = useState(() => computeStandings());

  useEffect(() => {
    const refresh = () => setStandings(computeStandings());
    refresh();
    window.addEventListener('sems_leaderboard_updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('sems_leaderboard_updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const topStandings = standings.slice(0, 4);

  return (
    <div className="pt-1 pb-6 sm:py-8 bg-slate-100/60 dark:bg-slate-950/60 transition-colors duration-200">
      <div className="w-full max-w-[1440px] px-3 sm:px-5 lg:px-6 xl:px-8 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Div 1: Live Games */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-rose-500/40 transition duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      Live Matches
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time match scores & live updates</p>
                  </div>
                </div>

                <Link
                  to="/live"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white transition"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Match Cards List */}
              <div className="space-y-3">
                {(!liveMatches || liveMatches.length === 0) ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Live Matches Right Now</p>
                    <p className="text-xs text-slate-400 mt-1">Check back soon or explore scheduled tournament matches.</p>
                    <Link
                      to="/live"
                      className="inline-block mt-3 px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition"
                    >
                      Open Live Portal
                    </Link>
                  </div>
                ) : (
                  liveMatches.slice(0, 3).map((match) => (
                    <Link
                      key={match.id}
                      to="/live"
                      className="block p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500/50 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          {match.sportName || match.sport || 'Live Event'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {match.currentInfo || match.status || 'IN PROGRESS'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[130px] sm:max-w-[180px]">
                            {typeof match.team1 === 'object' ? match.team1?.name : match.team1}
                          </span>
                          {match.team1?.score !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                              {match.team1.score}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-black text-slate-400 px-2">VS</span>
                        <div className="flex items-center gap-2">
                          {match.team2?.score !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                              {match.team2.score}
                            </span>
                          )}
                          <span className="truncate max-w-[130px] sm:max-w-[180px]">
                            {typeof match.team2 === 'object' ? match.team2?.name : match.team2}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Footer summary */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Status: <strong className="text-emerald-500 font-bold">{(liveMatches || []).length} Match(es) Live</strong></span>
              <Link to="/live" className="font-bold text-rose-500 hover:underline flex items-center gap-1">
                Go to Live Arena <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Div 2: Leaderboard */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                      Tournament Leaderboard
                      <Crown className="w-4 h-4 text-amber-500" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Inter-college points & medal standings</p>
                  </div>
                </div>

                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-slate-950 transition"
                >
                  <span>Full Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Leaderboard Table / Rankings */}
              <div className="space-y-2.5">
                {topStandings.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Trophy className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Medal Standings Yet</p>
                    <p className="text-xs text-slate-400 mt-1">Points will be updated as tournament results are declared.</p>
                  </div>
                ) : (
                  topStandings.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 transition hover:bg-amber-500/5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            idx === 0
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-900 font-bold'
                              : idx === 2
                              ? 'bg-amber-700/30 text-amber-600 dark:text-amber-400 font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.college}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Code: {item.code} • 🥇 {item.gold} Gold • 🥈 {item.silver} Silver
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-amber-500 dark:text-amber-400">
                          {item.totalPoints} Pts
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer summary */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Points System: 🥇 Gold = 2pts | 🥈 Silver = 1pt</span>
              <Link to="/leaderboard" className="font-bold text-amber-500 hover:underline flex items-center gap-1">
                View All Rankings <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
