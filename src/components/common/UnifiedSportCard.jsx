import React from 'react';
import { Link } from 'react-router-dom';
import { Info, ArrowRight } from 'lucide-react';

export const UnifiedSportCard = ({
  sport,
  activeEvent,
  isOpen,
  onRulesClick,
  registerLink,
  onRegisterClick,
  showEventDuration = true,
  showButtons = true
}) => {
  return (
    <div
      className={`group bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between ${
        isOpen ? 'opacity-100' : 'opacity-65 dark:opacity-60'
      }`}
    >
      {/* Hero Image & Badges */}
      <div className="relative h-56 sm:h-60 overflow-hidden">
        <img
          src={sport.image}
          alt={sport.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900/90 backdrop-blur-md text-blue-400 border border-slate-700">
            {sport.category}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-black backdrop-blur-md border ${
            isOpen
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : 'bg-slate-500/40 dark:bg-slate-700/45 text-slate-300 border-slate-500/30'
          }`}>
            {isOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-black text-white tracking-tight">{sport.name}</h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
        
        {/* Single Information Box (Hidden if closed/no active event) */}
        {isOpen ? (
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            
            {/* Row 1: Registration Fee, Format, Team Size / Roster */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
              <div className="pt-2 sm:pt-0 sm:px-2 first:pl-0 flex flex-col items-center sm:items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                  <span>💰</span> Fee
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">₹{activeEvent.entryFee}</span>
              </div>
              <div className="pt-2 sm:pt-0 sm:px-2 flex flex-col items-center sm:items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                  <span>🏅</span> Format
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-full">{sport.type || 'Standard'}</span>
              </div>
              <div className="pt-2 sm:pt-0 sm:px-2 last:pr-0 flex flex-col items-center sm:items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                  <span>👥</span> Roster
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-full">{sport.teamSize}</span>
              </div>
            </div>

            {/* Row 2: Registration Period */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1.5">
                <span>📅</span> Registration Period
              </div>
              <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Start Date</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">{activeEvent.regStartDate || '-'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">End Date</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">{activeEvent.regEndDate || '-'}</span>
                </div>
              </div>
            </div>

            {/* Row 3: Event Duration */}
            {showEventDuration && (
              <div className="pt-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1.5">
                  <span>🏆</span> Event Duration
                </div>
                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-mono">Start Date</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">{activeEvent.tournStartDate || activeEvent.eventDate || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-mono">End Date</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">{activeEvent.tournEndDate || activeEvent.tournStartDate || activeEvent.eventDate || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Row 4: Venue */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="text-base">📍</span>
              <span className="font-semibold truncate">{activeEvent.venue || sport.venue}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 py-6">
            Registration Closed / No Active Event
          </div>
        )}

        {/* Bottom Buttons */}
        {showButtons && (
          <div className="grid grid-cols-2 gap-2 pt-2 mt-auto">
            <button
              onClick={onRulesClick}
              className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1"
            >
              <Info className="w-3.5 h-3.5" /> Rules & Specs
            </button>
            
            {isOpen && (registerLink || onRegisterClick) ? (
              onRegisterClick ? (
                <button
                  onClick={onRegisterClick}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 text-center transition flex items-center justify-center gap-1"
                >
                  Register <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  to={registerLink}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 text-center transition flex items-center justify-center gap-1"
                >
                  Register <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )
            ) : (
              <button
                disabled
                className="py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs text-center cursor-not-allowed flex items-center justify-center gap-1 opacity-75"
              >
                Registration Closed
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
