import React from 'react';
import { Award, Trophy, Crown } from 'lucide-react';

export const SuperAdminResultsPage = () => {
  const standings = [
    { rank: 1, college: 'MPEC Kanpur', gold: 12, silver: 8, bronze: 5, points: 145 },
    { rank: 2, college: 'PSIT Kanpur', gold: 8, silver: 10, bronze: 6, points: 112 },
    { rank: 3, college: 'KIET Ghaziabad', gold: 5, silver: 6, bronze: 9, points: 78 }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <span>Official Tournament Results & Medal Tally</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin verified rankings, points table & medal scorecards</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Rank</th>
              <th className="p-4">College Name</th>
              <th className="p-4 text-center">🥇 Gold</th>
              <th className="p-4 text-center">🥈 Silver</th>
              <th className="p-4 text-center">🥉 Bronze</th>
              <th className="p-4 text-right">Total Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {standings.map((s) => (
              <tr key={s.rank} className="hover:bg-slate-800/30">
                <td className="p-4 font-bold text-amber-400">
                  {s.rank === 1 ? <Crown className="w-4 h-4 text-amber-400 inline mr-1" /> : `#${s.rank}`}
                </td>
                <td className="p-4 font-bold text-white text-sm">{s.college}</td>
                <td className="p-4 text-center font-bold text-amber-400">{s.gold}</td>
                <td className="p-4 text-center font-bold text-slate-300">{s.silver}</td>
                <td className="p-4 text-center font-bold text-amber-600">{s.bronze}</td>
                <td className="p-4 text-right font-black text-purple-400 text-base">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
