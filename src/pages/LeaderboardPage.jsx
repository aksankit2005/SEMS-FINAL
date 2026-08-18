import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Search } from 'lucide-react';
import { ALL_COLLEGES } from '../services/superCoordinatorApi';
import { apiUrl } from '../services/apiConfig';
import { useSportsData } from '../context/SportsDataContext';

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

  const top2 = standings.slice(0, 2);
  const hasData = standings.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-black uppercase tracking-wider mb-3">
            <Crown className="w-4 h-4 text-orange-500" /> Inter-College Championship Standings
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Overall <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">Leaderboard</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Live medal tallies and cumulative points across all sports events. 🥇 Winner = 5 pts &nbsp;•&nbsp; 🥈 Runner-Up = 3 pts
          </p>
        </div>

        {/* Top 2 Podium or Empty State */}
        {!hasData ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8 mb-10">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Leaderboard Standings Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Inter-college standings will appear here as the Super Coordinator awards match points.
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 mb-16 items-end ${top2.length >= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>

            {/* Gold – Champion */}
            {top2[0] && (
              <div className="bg-gradient-to-b from-orange-500/10 via-white to-slate-50 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-8 border-2 border-orange-500 shadow-xl text-center flex flex-col items-center relative overflow-hidden scale-105">
                <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded bg-orange-500 text-white font-black">CHAMPION</div>
                <Crown className="w-10 h-10 text-orange-500 mb-2 animate-bounce" />
                <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-3">🥇 RANK 1 — GOLD</span>
                <h3 className="font-black text-2xl text-orange-600 dark:text-orange-400">{top2[0].college}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">{top2[0].code}</p>
                <div className="w-full p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-orange-500/30 flex justify-around text-xs font-bold">
                  <span>🥇 {top2[0].gold} Gold</span>
                  <span>🥈 {top2[0].silver} Silver</span>
                </div>
                <div className="mt-4 text-4xl font-black text-orange-500">{top2[0].totalPoints} Pts</div>
              </div>
            )}

            {/* Silver – Runner-Up */}
            {top2[1] && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-soft text-center flex flex-col items-center relative overflow-hidden">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mb-3">🥈 RANK 2 — SILVER</span>
                <div className="text-5xl mb-3">🏛️</div>
                <h3 className="font-black text-xl text-slate-900 dark:text-white">{top2[1].college}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">{top2[1].code}</p>
                <div className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 flex justify-around text-xs font-bold">
                  <span>🥇 {top2[1].gold} Gold</span>
                  <span>🥈 {top2[1].silver} Silver</span>
                </div>
                <div className="mt-4 text-2xl font-black text-slate-900 dark:text-white">{top2[1].totalPoints} Pts</div>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <Trophy className="w-5 h-5 text-orange-500" /> Complete Rankings Table
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search college name..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-950 uppercase text-[11px] font-black text-slate-500 tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 text-center">Rank</th>
                  <th className="p-4">Institute</th>
                  <th className="p-4 text-center">Gold 🥇 (+5 pts)</th>
                  <th className="p-4 text-center">Silver 🥈 (+3 pts)</th>
                  <th className="p-4 text-center font-black text-blue-600 dark:text-blue-400">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {hasData ? 'No college matches your search.' : 'No rankings yet — Super Coordinator will award points as matches complete.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 text-center font-black">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${index === 0 ? 'bg-orange-500 text-white font-black' :
                            index === 1 ? 'bg-slate-300 text-slate-950 font-bold' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-4 font-bold">
                        <div className="text-slate-900 dark:text-white font-black">{item.college}</div>
                        <div className="text-[10px] text-slate-400">{item.code}</div>
                      </td>
                      <td className="p-4 text-center font-black text-orange-500">{item.gold}</td>
                      <td className="p-4 text-center font-bold text-slate-400">{item.silver}</td>
                      <td className="p-4 text-center font-black text-base text-blue-600 dark:text-blue-400">
                        {item.totalPoints}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
