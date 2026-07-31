import React, { useState } from 'react';
import { Trophy, Star, Search } from 'lucide-react';
import { RESULTS_DATA } from '../data/resultsData';

export const ResultsPage = () => {
  const [query, setQuery] = useState('');

  const filteredResults = RESULTS_DATA.filter((r) =>
    r.sport.toLowerCase().includes(query.toLowerCase()) ||
    r.winner.toLowerCase().includes(query.toLowerCase()) ||
    r.event.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-black uppercase tracking-wider mb-3">
            <Trophy className="w-4 h-4" /> Official Hall of Champions
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Tournament <span className="bg-gradient-to-r from-orange-500 via-emerald-500 to-blue-600 bg-clip-text text-transparent">Results</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Final scores, medal winners, player of the tournament callouts, and match score summaries.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10 relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search completed sports, winners, or events..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-soft focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Results Cards */}
        <div className="space-y-6">
          {filteredResults.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
              <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Match Results Available</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completed match results and medal tallies will be listed here.</p>
            </div>
          ) : (
            filteredResults.map((res) => (
              <div
                key={res.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition relative space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      {res.sport}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">{res.event}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black self-start sm:self-auto">
                    ✓ {res.date}
                  </span>
                </div>

                {/* Scoreboard summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block uppercase">Winner & Score Summary</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{res.scoreSummary}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Star className="w-4 h-4 text-orange-400" />
                    <span>MVP: {res.mvp}</span>
                  </div>
                </div>

                {/* Medal Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-3">
                    <span className="text-2xl">🥇</span>
                    <div>
                      <span className="font-black block text-orange-500 uppercase text-[10px]">Gold Medal</span>
                      <span className="font-bold text-slate-900 dark:text-white">{res.medals.gold}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <span className="text-2xl">🥈</span>
                    <div>
                      <span className="font-black block text-slate-400 uppercase text-[10px]">Silver Medal</span>
                      <span className="font-bold text-slate-900 dark:text-white">{res.medals.silver}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-900/10 border border-amber-800/30 flex items-center gap-3">
                    <span className="text-2xl">🥉</span>
                    <div>
                      <span className="font-black block text-amber-700 dark:text-amber-400 uppercase text-[10px]">Bronze Medal</span>
                      <span className="font-bold text-slate-900 dark:text-white">{res.medals.bronze}</span>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
