import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Search, Sparkles } from 'lucide-react';
import { ALL_COLLEGES } from '../services/superCoordinatorApi';
import { apiUrl } from '../services/apiConfig';
import { useSportsData } from '../context/SportsDataContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/spatialGallery.css';

// Build college standings from Super Coordinator awarded points in localStorage
const computeStandings = () => {
  let entries = [];
  try {
    const stored = localStorage.getItem('sems_super_coord_leaderboard');
    if (stored) entries = JSON.parse(stored);
  } catch (e) { }

  // Tally gold and silver per college
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

  // Include ALL colleges — those without points get 0s
  const standings = ALL_COLLEGES
    .filter((c) => String(c.id || '').toUpperCase() !== 'EXTERNAL') // exclude external/guest colleges from table
    .map((college) => {
      const counts = tally[college.id] || { gold: 0, silver: 0 };
      return {
        id: String(college.id || ''),
        college: String(college.name || college.id || ''),
        code: String(college.id || ''),
        gold: Number(counts.gold || 0),
        silver: Number(counts.silver || 0),
        totalPoints: Number((counts.gold || 0) * 5 + (counts.silver || 0) * 3),
      };
    });

  // Sort: points desc → gold desc → silver desc → name asc
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    return String(a.college || '').localeCompare(String(b.college || ''));
  });

  return standings;
};

export const LeaderboardPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [query, setQuery] = useState('');
  const { leaderboard } = useSportsData();

  const normalizeStandings = (data) => {
    if (!Array.isArray(data)) return [];
    return data
      .filter((c) => String(c.code || c.id || '').toUpperCase() !== 'EXTERNAL')
      .map((item) => ({
        id: String(item.id || item.code || item.college || ''),
        code: String(item.code || item.id || ''),
        college: String(item.college || item.name || item.code || 'College'),
        gold: Number(item.gold ?? item.wins ?? item.goldCount ?? item.firsts ?? 0),
        silver: Number(item.silver ?? item.runnerUps ?? item.silverCount ?? item.seconds ?? 0),
        totalPoints: Number(item.totalPoints ?? item.points ?? 0),
        rank: Number(item.rank || 0),
      }));
  };

  const [standings, setStandings] = useState(() => (Array.isArray(leaderboard) && leaderboard.length > 0 ? normalizeStandings(leaderboard) : []));

  useEffect(() => {
    if (Array.isArray(leaderboard) && leaderboard.length > 0) {
      setStandings(normalizeStandings(leaderboard));
    }
  }, [leaderboard]);

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch(apiUrl('/leaderboard'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setStandings(normalizeStandings(data));
            return;
          }
        }
      } catch (e) { }

      if (leaderboard && leaderboard.length > 0) {
        setStandings(normalizeStandings(leaderboard));
        return;
      }

      setStandings(normalizeStandings(computeStandings()));
    };

    if (!leaderboard || leaderboard.length === 0) {
      refresh();
    }

    const handler = () => refresh();
    window.addEventListener('sems_leaderboard_updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('sems_leaderboard_updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, [leaderboard]);

  const filtered = standings.filter((item) => {
    const colName = String(item.college || item.name || '').toLowerCase();
    const colCode = String(item.code || item.id || '').toLowerCase();
    const q = String(query || '').toLowerCase();
    return colName.includes(q) || colCode.includes(q);
  });

  const top3 = standings.slice(0, 3);
  const hasData = standings.length > 0;

  return (
    <div className={`relative min-h-screen font-spatial-sans selection:bg-purple-500/30 selection:text-white overflow-x-hidden transition-colors duration-500 ${
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

        {/* ─── LUXURY HERO BANNER (Gallery Style) ─── */}
        <div className="text-center max-w-3xl mx-auto space-y-2 pt-1">
          <h1 className={`text-4xl sm:text-6xl md:text-7xl font-normal tracking-[0.08em] font-spatial-display uppercase ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Overall{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent font-semibold ${
              isDark 
                ? 'from-purple-400 via-indigo-300 to-amber-300' 
                : 'from-purple-700 via-indigo-700 to-amber-600'
            }`}>
              Leaderboard
            </span>
          </h1>

          <p className={`text-xs sm:text-sm max-w-xl mx-auto italic font-spatial-sans font-light leading-relaxed ${
            isDark ? 'text-slate-300/85' : 'text-slate-600'
          }`}>
            Live medal tallies and cumulative points across all sports events. 🥇 Winner = 5 pts • 🥈 Runner-Up = 3 pts
          </p>
        </div>

        {/* ─── TOP 3 PODIUM OR EMPTY STATE ─── */}
        {!hasData ? (
          <div className={`text-center py-16 rounded-3xl border p-8 max-w-lg mx-auto transition-all ${
            isDark ? 'spatial-glass-card-dark border-white/10' : 'spatial-glass-card-light border-slate-200 shadow-md'
          }`}>
            <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className={`text-lg font-bold font-spatial-display uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No Leaderboard Standings Yet
            </h3>
            <p className={`text-xs font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Inter-college standings will appear here as the Super Coordinator awards match points.
            </p>
          </div>
        ) : (
          <div className={`grid gap-1.5 xs:gap-2.5 sm:gap-4 md:gap-6 items-end pt-2 pb-2 ${
            top3.length === 1 
              ? 'grid-cols-1 max-w-md mx-auto' 
              : top3.length === 2 
                ? 'grid-cols-2 max-w-4xl mx-auto' 
                : 'grid-cols-3 max-w-7xl mx-auto'
          }`}>

            {/* Silver – Rank 2 Card (Left on all screens, Column 1) */}
            {top3[1] && (
              <div className={`rounded-2xl sm:rounded-3xl p-2 xs:p-3 sm:p-7 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 order-1 ${
                isDark 
                  ? 'spatial-glass-card-dark border-slate-700/60 shadow-xl' 
                  : 'spatial-glass-card-light border-slate-200/90 shadow-lg'
              }`}>
                <span className={`px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] xs:text-[9px] sm:text-xs font-mono font-bold tracking-wider uppercase mb-1 sm:mb-3 border ${
                  isDark 
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200' 
                    : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}>
                  <span className="hidden sm:inline">🥈 RANK 2 — SILVER</span>
                  <span className="inline sm:hidden">🥈 #2 SILVER</span>
                </span>

                <div className="text-2xl xs:text-3xl sm:text-5xl mb-1 sm:mb-3 filter drop-shadow">🏛️</div>

                <h3 className={`font-spatial-display font-semibold text-xs xs:text-sm sm:text-2xl tracking-wide max-w-sm truncate w-full ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {top3[1].college}
                </h3>

                <p className={`text-[9px] xs:text-[10px] sm:text-xs font-mono tracking-wider mt-0.5 mb-1 sm:mb-4 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {top3[1].code}
                </p>

                {/* Gold / Silver Medals Count */}
                <div className={`w-full max-w-xs p-1 sm:p-3 rounded-xl sm:rounded-2xl border flex items-center justify-around text-[9px] xs:text-[10px] sm:text-xs font-mono font-bold transition-all ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-slate-200' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <span className="flex items-center gap-0.5 sm:gap-1.5">
                    <span className="text-amber-400">🥇</span> {top3[1].gold}<span className="hidden sm:inline"> Gold</span>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-0.5 sm:gap-1.5">
                    <span className="text-slate-400">🥈</span> {top3[1].silver}<span className="hidden sm:inline"> Silver</span>
                  </span>
                </div>

                {/* Total Points */}
                <div className="mt-2 sm:mt-4 flex flex-col items-center">
                  <span className={`text-xl xs:text-2xl sm:text-4xl font-black font-mono tracking-tight ${
                    isDark ? 'text-slate-100' : 'text-slate-800'
                  }`}>
                    {top3[1].totalPoints}
                  </span>
                  <span className={`text-[8px] xs:text-[9px] sm:text-[11px] font-mono uppercase tracking-widest font-bold mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span className="hidden sm:inline">Championship Points</span>
                    <span className="inline sm:hidden">PTS</span>
                  </span>
                </div>
              </div>
            )}

            {/* Gold – Rank 1 Champion Card (CENTER on all screens, Column 2, Highlighted & Elevated) */}
            {top3[0] && (
              <div className={`rounded-2xl sm:rounded-3xl p-2.5 xs:p-3.5 sm:p-9 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 order-2 -translate-y-2 sm:-translate-y-4 scale-[1.02] sm:scale-105 z-20 ${
                isDark 
                  ? 'spatial-glass-card-dark border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/50 bg-gradient-to-b from-amber-500/20 via-[#131522] to-[#0c0e18]' 
                  : 'spatial-glass-card-light border-2 border-amber-500 shadow-[0_16px_50px_rgba(245,158,11,0.28)] ring-2 ring-amber-400/60 bg-gradient-to-b from-amber-100/95 via-white to-amber-50/60'
              }`}>
                {/* Champion Tag */}
                <div className="absolute top-1.5 right-1.5 sm:top-3.5 sm:right-3.5 text-[8px] xs:text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black tracking-wider uppercase shadow-lg flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">CHAMPION</span>
                  <span className="inline sm:hidden">#1</span>
                </div>

                <div className="relative mb-1 sm:mb-2">
                  <Crown className="w-7 h-7 xs:w-8 xs:h-8 sm:w-14 sm:h-14 text-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.8)] animate-bounce" />
                </div>

                <span className={`px-2 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-mono font-black tracking-wider uppercase mb-1 sm:mb-3 border-2 shadow-sm ${
                  isDark 
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300' 
                    : 'bg-amber-100 border-amber-400 text-amber-950'
                }`}>
                  <span className="hidden sm:inline">🥇 RANK 1 — GOLD</span>
                  <span className="inline sm:hidden">🥇 #1 GOLD</span>
                </span>

                <h3 className={`font-spatial-display font-extrabold text-sm xs:text-base sm:text-3xl md:text-4xl tracking-wide max-w-sm truncate w-full ${
                  isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500' : 'text-amber-800'
                }`}>
                  {top3[0].college}
                </h3>

                <p className={`text-[10px] xs:text-[11px] sm:text-sm font-mono tracking-widest uppercase mt-0.5 mb-1 sm:mb-4 font-bold ${
                  isDark ? 'text-amber-300/80' : 'text-amber-900/70'
                }`}>
                  {top3[0].code}
                </p>

                {/* Gold / Silver Medals Count */}
                <div className={`w-full max-w-xs p-1 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 flex items-center justify-around text-[9px] xs:text-[10px] sm:text-sm font-mono font-bold transition-all shadow-inner ${
                  isDark 
                    ? 'bg-amber-500/10 border-amber-400/40 text-amber-200' 
                    : 'bg-amber-100/90 border-amber-300 text-amber-950'
                }`}>
                  <span className="flex items-center gap-0.5 sm:gap-1.5">
                    <span className="text-amber-400">🥇</span> {top3[0].gold}<span className="hidden sm:inline"> Gold</span>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-0.5 sm:gap-1.5">
                    <span className="text-slate-400">🥈</span> {top3[0].silver}<span className="hidden sm:inline"> Silver</span>
                  </span>
                </div>

                {/* Total Points */}
                <div className="mt-2 sm:mt-4 flex flex-col items-center">
                  <span className={`text-2xl xs:text-3xl sm:text-6xl font-black font-mono tracking-tight ${
                    isDark 
                      ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]' 
                      : 'text-amber-600 drop-shadow-sm'
                  }`}>
                    {top3[0].totalPoints}
                  </span>
                  <span className={`text-[8px] xs:text-[9px] sm:text-xs font-mono uppercase tracking-widest font-black mt-0.5 sm:mt-1 ${
                    isDark ? 'text-amber-300' : 'text-amber-900'
                  }`}>
                    <span className="hidden sm:inline">Championship Points</span>
                    <span className="inline sm:hidden">PTS</span>
                  </span>
                </div>
              </div>
            )}

            {/* Bronze – Rank 3 Card (Right on all screens, Column 3) */}
            {top3[2] && (
              <div className={`rounded-2xl sm:rounded-3xl p-2 xs:p-3 sm:p-7 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 order-3 ${
                isDark 
                  ? 'spatial-glass-card-dark border-amber-900/40 shadow-xl' 
                  : 'spatial-glass-card-light border-amber-200/70 shadow-lg'
              }`}>
                <span className={`px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] xs:text-[9px] sm:text-xs font-mono font-bold tracking-wider uppercase mb-1 sm:mb-3 border ${
                  isDark 
                    ? 'bg-amber-950/40 border-amber-800/40 text-amber-300' 
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <span className="hidden sm:inline">🥉 RANK 3 — BRONZE</span>
                  <span className="inline sm:hidden">🥉 #3 BRONZE</span>
                </span>

                <div className="text-2xl xs:text-3xl sm:text-5xl mb-1 sm:mb-3 filter drop-shadow">🏛️</div>

                <h3 className={`font-spatial-display font-semibold text-xs xs:text-sm sm:text-2xl tracking-wide max-w-sm truncate w-full ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {top3[2].college}
                </h3>

                <p className={`text-[9px] xs:text-[10px] sm:text-xs font-mono tracking-wider mt-0.5 mb-1 sm:mb-4 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {top3[2].code}
                </p>

                {/* Gold / Silver Medals Count */}
                <div className={`w-full max-w-xs p-1 sm:p-3 rounded-xl sm:rounded-2xl border flex items-center justify-around text-[9px] xs:text-[10px] sm:text-xs font-mono font-bold transition-all ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-slate-200' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <span className="flex items-center gap-0.5 sm:gap-1.5">
                    <span className="text-amber-400">🥇</span> {top3[2].gold}<span className="hidden sm:inline"> Gold</span>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-0.5 sm:gap-1.5">
                    <span className="text-slate-400">🥈</span> {top3[2].silver}<span className="hidden sm:inline"> Silver</span>
                  </span>
                </div>

                {/* Total Points */}
                <div className="mt-2 sm:mt-4 flex flex-col items-center">
                  <span className={`text-xl xs:text-2xl sm:text-4xl font-black font-mono tracking-tight ${
                    isDark ? 'text-amber-400/90' : 'text-amber-800'
                  }`}>
                    {top3[2].totalPoints}
                  </span>
                  <span className={`text-[8px] xs:text-[9px] sm:text-[11px] font-mono uppercase tracking-widest font-bold mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span className="hidden sm:inline">Championship Points</span>
                    <span className="inline sm:hidden">PTS</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TABLE HEADER & SEARCH BAR ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <h2 className={`text-base sm:text-lg font-spatial-display uppercase tracking-wider font-semibold ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Complete Standings
            </h2>
            <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              {filtered.length} {filtered.length === 1 ? 'College' : 'Colleges'}
            </span>
          </div>

          {/* Luxury Gallery-Style Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search college name or code..."
              className={`w-full pl-9 pr-4 py-2 rounded-full text-xs font-mono transition-all border outline-none ${
                isDark
                  ? 'bg-[#10121a]/90 border-white/10 text-slate-200 placeholder-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20'
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-xs'
              }`}
            />
          </div>
        </div>

        {/* ─── STANDINGS TABLE ─── */}
        <div className={`rounded-3xl border overflow-hidden transition-all ${
          isDark
            ? 'spatial-glass-card-dark border-white/10 shadow-2xl'
            : 'spatial-glass-card-light border-slate-200 shadow-xl'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className={`uppercase text-[10px] sm:text-[11px] font-mono font-bold tracking-wider border-b ${
                isDark
                  ? 'bg-white/[0.04] text-slate-400 border-white/10'
                  : 'bg-slate-100/90 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="p-3.5 sm:p-4 text-center w-16">Rank</th>
                  <th className="p-3.5 sm:p-4">Institute</th>
                  <th className="p-3.5 sm:p-4 text-center">Gold 🥇 (+5 pts)</th>
                  <th className="p-3.5 sm:p-4 text-center">Silver 🥈 (+3 pts)</th>
                  <th className="p-3.5 sm:p-4 text-center font-bold">Total Points</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`p-8 text-center text-xs font-mono ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {hasData ? 'No college matches your search.' : 'No rankings yet — points will be awarded as matches complete.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr 
                      key={item.id || item.code || index} 
                      className={`transition-colors duration-150 ${
                        isDark 
                          ? 'hover:bg-white/[0.04]' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-mono font-bold ${
                          index === 0
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-xs'
                            : index === 1
                              ? isDark ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-800'
                              : index === 2
                                ? isDark ? 'bg-amber-900/40 text-amber-300 border border-amber-700/40' : 'bg-amber-100 text-amber-800'
                                : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 font-medium">
                        <div className={`font-semibold text-xs sm:text-sm ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {item.college}
                        </div>
                        <div className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {item.code}
                        </div>
                      </td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-amber-500">
                        {item.gold}
                      </td>
                      <td className={`p-3.5 sm:p-4 text-center font-mono font-medium ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {item.silver}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-black text-sm sm:text-base">
                        <span className={
                          index === 0
                            ? isDark ? 'text-amber-400' : 'text-amber-600'
                            : isDark ? 'text-purple-300' : 'text-purple-700'
                        }>
                          {item.totalPoints}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── DEDICATION QUOTE (The Climb Footer) ─── */}
        <div className="pt-14 sm:pt-20 pb-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-3 opacity-60">
            <div className={`h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent ${
              isDark ? 'to-amber-400' : 'to-amber-600'
            }`} />
            <Trophy className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'} animate-pulse`} />
            <div className={`h-[1px] w-12 sm:w-24 bg-gradient-to-l from-transparent ${
              isDark ? 'to-amber-400' : 'to-amber-600'
            }`} />
          </div>

          <p className={`font-spatial-display text-sm sm:text-base md:text-lg tracking-[0.14em] uppercase font-medium select-none ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            &ldquo;It’s a slow climb to the{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent font-bold ${
              isDark
                ? 'from-purple-400 via-amber-300 to-orange-400'
                : 'from-purple-700 via-amber-600 to-orange-600'
            }`}>
              top
            </span>
            , but the view is worth it.&rdquo;
          </p>

          <p className={`text-[11px] sm:text-xs font-spatial-sans tracking-widest uppercase italic font-medium ${
            isDark ? 'text-amber-400/80' : 'text-amber-700'
          }`}>
            The Climb
          </p>
        </div>

      </div>
    </div>
  );
};
