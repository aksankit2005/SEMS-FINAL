import React, { useState, useEffect } from 'react';
import { Trophy, Star, Search, Download, Calendar, CheckCircle2, Award } from 'lucide-react';
import { RESULTS_DATA } from '../data/resultsData';
import { generateMatchResultPDF } from '../utils/pdfExporter';
import { resolveSportConfig } from '../data/sportsConfig';

export const ResultsPage = () => {
  const [query, setQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
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
              'kapil verma', 'anubhav sachan', 'team a', 'team b', 'team 1', 'team 2', 'player / team a', 'player / team b',
              'athletes track a', 'athletes track b'
            ];
            parsed.forEach((item) => {
              if (!item) return;
              if (mockIds.includes(item.id)) return;
              const t1 = (item.team1 || '').trim().toLowerCase();
              const t2 = (item.team2 || '').trim().toLowerCase();
              const w = (item.winner || '').trim().toLowerCase();
              if (mockNames.includes(t1) || mockNames.includes(t2) || mockNames.includes(w)) return;

              if (!list.some((r) => r.id === item.id)) {
                const isAth = (item.sportName || sportName || '').toLowerCase().includes('athletics');
                const cleanScoreSummary = (item.scoreSummary || '')
                  .replace(/Athletes Track [AB]:? ?\d*/gi, '')
                  .replace(/\|\s*\|/g, '|').trim();

                list.push({
                  id: item.id || `RES-${Math.random()}`,
                  sport: item.sportName || sportName,
                  event: item.eventTitle || item.title || `${sportName} Final`,
                  winner: item.winner || (item.medals?.gold) || 'Declared Winner',
                  scoreSummary: isAth 
                    ? (cleanScoreSummary || `🥇 Winner: ${item.winner || 'Gold Medalist'}`)
                    : (item.scoreSummary || (item.score1 !== undefined ? `${item.team1}: ${item.score1} | ${item.team2}: ${item.score2}` : 'Match Completed')),
                  date: item.completedAt ? item.completedAt.split('T')[0] : '2026-08-04',
                  mvp: item.mvp || item.winner || 'Top Performer'
                });
              }
            });
          }
        } catch (e) {}
      }
    }
    setDynamicResults(list);
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

  const combinedResults = [...dynamicResults, ...RESULTS_DATA];

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-wider mb-3 border border-orange-500/20 shadow-xs">
            <Trophy className="w-4 h-4 text-orange-500" /> Tournament Match Results
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Official <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">Match Results</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            Explore finalized match results, winner declarations, and score points across all 12 tournament sports.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="space-y-4 mb-8 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-orange-500" /> Filter By Sport ({sportsList.length - 1} Disciplines)
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {filteredResults.length} {filteredResults.length === 1 ? 'Result' : 'Results'}
            </span>
          </div>

          {/* 12 Games Horizontal Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {sportsList.map((s) => {
              const cfg = s === 'All' ? null : resolveSportConfig(s);
              const icon = s === 'All' ? '⚡' : cfg?.icon || '🏆';
              const isSelected = selectedSport === s;

              return (
                <button
                  key={s}
                  onClick={() => setSelectedSport(s)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md shadow-orange-500/20 font-black scale-105'
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

        {/* Results Card Grid Layout (Shows ONLY Player/Team, Points, Match Details) */}
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
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">#{res.id}</span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] border border-slate-200 dark:border-slate-700/60 uppercase flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-400" />
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

                    {/* Points / Score Summary Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">
                        Points & Match Summary
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {res.scoreSummary}
                      </p>
                    </div>

                    {/* Optional MVP Detail */}
                    {res.mvp && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 pt-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">MVP: <strong className="text-slate-900 dark:text-white">{res.mvp}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: PDF Result Download Action */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => {
                        let matchObj = res.rawMatch;
                        if (!matchObj) {
                          const t1 = res.medals?.gold || res.winner || 'Team A';
                          const t2 = res.medals?.silver || 'Team B';
                          matchObj = {
                            id: res.id,
                            matchTitle: res.event || `${res.sport} Championship Final`,
                            winner: res.winner,
                            team1: t1,
                            team2: t2,
                            scoreSummary: res.scoreSummary,
                            sportName: res.sport,
                            completedAt: res.date,
                            format: 'Official Championship Match',
                            venue: 'Main Arena',
                            roster1: res.roster1,
                            roster2: res.roster2,
                            setsHistory: res.setsHistory
                          };
                        }
                        generateMatchResultPDF(matchObj, res.sport || matchObj.sportName);
                      }}
                      className="w-full py-2.5 px-3 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-orange-500" />
                      <span>Download PDF Result Certificate</span>
                    </button>
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
