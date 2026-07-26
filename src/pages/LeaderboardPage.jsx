import React, { useState } from 'react';
import { Trophy, Crown, Search } from 'lucide-react';
import { LEADERBOARD_DATA } from '../data/leaderboardData';

export const LeaderboardPage = () => {
  const [query, setQuery] = useState('');

  const filteredLeaderboard = LEADERBOARD_DATA.filter((item) =>
    item.college.toLowerCase().includes(query.toLowerCase()) ||
    item.code.toLowerCase().includes(query.toLowerCase())
  );

  const top3 = LEADERBOARD_DATA.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-black uppercase tracking-wider mb-3">
            <Crown className="w-4 h-4 text-orange-500" /> Inter-College Championship Standings
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Overall <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-blue-600 bg-clip-text text-transparent">Leaderboard</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Current medal tallies and cumulative points across all 11 sports events.
          </p>
        </div>

        {/* Top 3 Podium Visual Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-end">
          
          {/* Silver - 2nd */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-soft text-center flex flex-col items-center relative overflow-hidden order-2 md:order-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mb-3">
              🥈 RANK 2 - SILVER
            </span>
            <div className="text-5xl mb-3">{top3[1].logo}</div>
            <h3 className="font-black text-xl text-slate-900 dark:text-white">{top3[1].college}</h3>
            <p className="text-xs text-slate-500 mb-4">Top Sports: {top3[1].topSport}</p>
            <div className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 flex justify-around text-xs font-bold">
              <span>🥇 {top3[1].gold}</span>
              <span>🥈 {top3[1].silver}</span>
              <span>🥉 {top3[1].bronze}</span>
            </div>
            <div className="mt-4 text-2xl font-black text-slate-900 dark:text-white">{top3[1].totalPoints} Pts</div>
          </div>

          {/* Gold - 1st (Center Podium - Champion) */}
          <div className="bg-gradient-to-b from-orange-500/10 via-white to-slate-50 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-8 border-2 border-orange-500 shadow-xl text-center flex flex-col items-center relative overflow-hidden order-1 md:order-2 scale-105">
            <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded bg-orange-500 text-white font-black">
              CHAMPION
            </div>
            <Crown className="w-10 h-10 text-orange-500 mb-2 animate-bounce" />
            <div className="text-6xl mb-3">{top3[0].logo}</div>
            <h3 className="font-black text-2xl text-orange-600 dark:text-orange-400">{top3[0].college}</h3>
            <p className="text-xs text-slate-500 mb-4">Top Sports: {top3[0].topSport}</p>
            <div className="w-full p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-orange-500/30 flex justify-around text-xs font-bold">
              <span>🥇 {top3[0].gold}</span>
              <span>🥈 {top3[0].silver}</span>
              <span>🥉 {top3[0].bronze}</span>
            </div>
            <div className="mt-4 text-4xl font-black text-orange-500">{top3[0].totalPoints} Pts</div>
          </div>

          {/* Bronze - 3rd */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-soft text-center flex flex-col items-center relative overflow-hidden order-3">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-900/10 text-amber-600 dark:text-amber-400 mb-3">
              🥉 RANK 3 - BRONZE
            </span>
            <div className="text-5xl mb-3">{top3[2].logo}</div>
            <h3 className="font-black text-xl text-slate-900 dark:text-white">{top3[2].college}</h3>
            <p className="text-xs text-slate-500 mb-4">Top Sports: {top3[2].topSport}</p>
            <div className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 flex justify-around text-xs font-bold">
              <span>🥇 {top3[2].gold}</span>
              <span>🥈 {top3[2].silver}</span>
              <span>🥉 {top3[2].bronze}</span>
            </div>
            <div className="mt-4 text-2xl font-black text-amber-600 dark:text-amber-400">{top3[2].totalPoints} Pts</div>
          </div>

        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-black flex items-center gap-2">
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
                  <th className="p-4">College / University</th>
                  <th className="p-4 text-center">Gold 🥇</th>
                  <th className="p-4 text-center">Silver 🥈</th>
                  <th className="p-4 text-center">Bronze 🥉</th>
                  <th className="p-4 text-center font-black text-blue-600 dark:text-blue-400">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLeaderboard.map((item) => (
                  <tr key={item.rank} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 text-center font-black">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                        item.rank === 1 ? 'bg-orange-500 text-white font-black' :
                        item.rank === 2 ? 'bg-slate-300 text-slate-950 font-bold' :
                        item.rank === 3 ? 'bg-amber-700 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="p-4 font-bold flex items-center gap-3">
                      <span className="text-xl">{item.logo}</span>
                      <div>
                        <div className="text-slate-900 dark:text-white font-black">{item.college}</div>
                        <div className="text-[10px] text-slate-400">{item.code} • Key: {item.topSport}</div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-black text-orange-500">{item.gold}</td>
                    <td className="p-4 text-center font-bold text-slate-400">{item.silver}</td>
                    <td className="p-4 text-center font-bold text-amber-700">{item.bronze}</td>
                    <td className="p-4 text-center font-black text-base text-blue-600 dark:text-blue-400">
                      {item.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
