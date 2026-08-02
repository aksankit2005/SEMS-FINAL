import React, { useState, useEffect } from 'react';
import { Trophy, Star, Search, Download } from 'lucide-react';
import { RESULTS_DATA } from '../data/resultsData';
import { generateMatchResultPDF } from '../utils/pdfExporter';


export const ResultsPage = () => {
  const [query, setQuery] = useState('');
  const [dynamicResults, setDynamicResults] = useState([]);

  useEffect(() => {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sems_completed_results_')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(parsed)) {
            const sportId = key.replace('sems_completed_results_', '');
            const sportName = sportId.charAt(0).toUpperCase() + sportId.slice(1).replace('-', ' ');
            const mockIds = ['M540746', 'M635812', 'M741299', 'M882104', 'M645537'];
            const mockNames = [
              '1', '2', 'a', 'b', 'player 1', 'player 2', 'player 3', 'player 4', 'team 1', 'team 2', 'team a', 'team b', 'albert', 'romi',
              'aarav sharma (mpec)', 'rohan gupta (mips)', 'ankur dixit (mpcps)', 'aditya singh (mpec)',
              'aagaz khan (mpcps kn142)', 'shiv prakash (mpcps kn142)', 'kapil verma (mpcps kn142)', 'anubhav sachan (mpcps kn142)',
              'kapil verma', 'anubhav sachan', 'team a', 'team b', 'team 1', 'team 2', 'player / team a', 'player / team b'
            ];
            parsed.forEach((item) => {
              if (!item) return;
              if (mockIds.includes(item.id)) return;
              const t1 = (item.team1 || '').trim().toLowerCase();
              const t2 = (item.team2 || '').trim().toLowerCase();
              const w = (item.winner || '').trim().toLowerCase();
              if (mockNames.includes(t1) || mockNames.includes(t2) || mockNames.includes(w)) return;

              if (!list.some((r) => r.id === item.id)) {
                list.push({
                  id: item.id || `RES-${Math.random()}`,
                  sport: item.sportName || sportName,
                  event: item.eventTitle || item.title || `${sportName} Final`,
                  winner: item.winner || item.team1 || 'Declared Winner',
                  scoreSummary: item.scoreSummary || (item.score1 !== undefined ? `${item.team1}: ${item.score1} | ${item.team2}: ${item.score2}` : 'Match Completed'),
                  date: item.completedAt ? item.completedAt.split('T')[0] : 'Recent',
                  mvp: item.mvp || item.winner || item.team1 || 'Top Performer',
                  medals: item.medals || {
                    gold: item.winner || item.team1 || 'Gold Winner',
                    silver: item.winner === item.team1 ? item.team2 : item.team1 || 'Runner Up',
                    bronze: 'Semi-Finalist'
                  }
                });
              }
            });
          }
        } catch (e) {}
      }
    }
    setDynamicResults(list);
  }, []);

  const combinedResults = [...dynamicResults, ...RESULTS_DATA];

  const filteredResults = combinedResults.filter((r) =>
    (r.sport || '').toLowerCase().includes(query.toLowerCase()) ||
    (r.winner || '').toLowerCase().includes(query.toLowerCase()) ||
    (r.event || '').toLowerCase().includes(query.toLowerCase())
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      {res.sport}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">{res.event}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        generateMatchResultPDF({
                          id: res.id,
                          matchTitle: res.event,
                          winner: res.winner || res.medals?.gold || 'Gold Medalist',
                          team1: res.medals?.gold || 'Gold Medalist',
                          team2: res.medals?.silver || 'Silver Medalist',
                          scoreSummary: res.scoreSummary,
                          sportName: res.sport,
                          completedAt: res.date
                        }, res.sport);
                      }}
                      className="px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                    >

                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Result</span>
                    </button>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black self-start sm:self-auto">
                      ✓ {res.date}
                    </span>
                  </div>
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
