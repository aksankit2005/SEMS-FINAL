import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowRight } from 'lucide-react';
import { useSportsData } from '../../context/SportsDataContext';

export const LiveTicker = () => {
  const { liveMatches } = useSportsData();

  return (
    <div className="bg-slate-100 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white py-3 overflow-hidden shadow-inner transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        {/* Live Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-550 dark:text-rose-400 border border-rose-500/40 text-xs font-black shrink-0">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>LIVE TICKER</span>
        </div>

        {/* Ticker marquee */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 text-xs sm:text-sm">
          {liveMatches.map((match) => (
            <Link
              key={match.id}
              to="/live"
              className="flex items-center gap-3 bg-white dark:bg-slate-950/90 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition shrink-0 group shadow-sm"
            >
              <span className="font-bold text-blue-600 dark:text-blue-400">{match.sport}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="font-semibold text-slate-950 dark:text-white">{match.team1.name} ({match.team1.score})</span>
              <span className="text-slate-400">vs</span>
              <span className="font-semibold text-slate-950 dark:text-white">{match.team2.name} ({match.team2.score})</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                {match.currentInfo}
              </span>
            </Link>
          ))}
        </div>

        {/* View All Matches */}
        <Link
          to="/live"
          className="hidden md:flex items-center gap-1 text-xs font-bold text-blue-650 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition shrink-0"
        >
          <span>All Matches</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
