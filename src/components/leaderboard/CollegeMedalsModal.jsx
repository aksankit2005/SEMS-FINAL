import React, { useState, useMemo, useEffect } from 'react';
import { X, Trophy, Medal, Sparkles, Filter, ChevronRight, School } from 'lucide-react';
import { StudentMedalCard } from './StudentMedalCard';
import { getCollegeMedalBreakdown } from '../../data/mockLeaderboardMedals';

export const CollegeMedalsModal = ({ isOpen, onClose, college, standingsRank, medalistsList = [] }) => {
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [medalFilter, setMedalFilter] = useState('ALL'); // 'ALL' | 'GOLD' | 'SILVER'

  // Reset filters when opening a new college
  useEffect(() => {
    setSelectedSport('ALL');
    setMedalFilter('ALL');
  }, [college?.code, college?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const breakdown = useMemo(() => {
    if (!college) return null;
    const code = college.code || college.id;
    return getCollegeMedalBreakdown(code, medalistsList);
  }, [college, medalistsList]);

  if (!isOpen || !college || !breakdown) return null;

  const sportsList = Object.keys(breakdown.bySport);

  const filteredMedalists = breakdown.medalists.filter((m) => {
    if (selectedSport !== 'ALL' && (m.sportName || m.sportId) !== selectedSport) {
      return false;
    }
    if (medalFilter === 'GOLD' && m.medal !== 'GOLD') return false;
    if (medalFilter === 'SILVER' && m.medal !== 'SILVER') return false;
    return true;
  });

  const collegeName = college.college || college.name || breakdown.collegeCode;
  const collegeCode = college.code || college.id || breakdown.collegeCode;
  const totalPoints = college.totalPoints !== undefined ? college.totalPoints : breakdown.totalPoints;
  const goldCount = college.gold !== undefined ? college.gold : breakdown.goldCount;
  const silverCount = college.silver !== undefined ? college.silver : breakdown.silverCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-5 sm:p-7 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] bg-[#FAF9F6] dark:bg-[#121625] flex-shrink-0">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-[#FFFFFF] dark:bg-[#1A1F30] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] flex items-center justify-center text-[#686370] hover:text-[#211D2B] dark:text-[#AAA4B8] dark:hover:text-white transition-colors shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10 sm:pr-12">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#7156A5]/20 to-[#D2AB45]/20 border-2 border-[#7156A5]/30 flex items-center justify-center text-2xl sm:text-3xl shadow-sm flex-shrink-0">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#7156A5]/15 text-[#7156A5] dark:text-[#B8A5E5] border border-[#7156A5]/30">
                    {collegeCode}
                  </span>
                  {standingsRank ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FAF9F6] dark:bg-[#1A1F30] text-[#211D2B] dark:text-[#F5F2FA] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]">
                      Rank #{standingsRank}
                    </span>
                  ) : null}
                </div>
                <h2 className="font-spatial-display font-bold text-xl sm:text-2xl md:text-3xl text-[#211D2B] dark:text-[#F5F2FA] mt-1 leading-tight">
                  {collegeName}
                </h2>
                <p className="text-xs font-mono text-[#686370] dark:text-[#AAA4B8] mt-0.5">
                  Sport-Wise Medal Breakdown & Student Athletes
                </p>
              </div>
            </div>

            {/* Total Points & Medals Badge */}
            <div className="flex items-center gap-3 sm:gap-4 bg-[#FFFFFF] dark:bg-[#0D101A] p-3 rounded-2xl border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] flex-shrink-0 shadow-2xs">
              <div className="text-center px-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#A98B57] dark:text-[#D2AB45]">
                  {goldCount}
                </span>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8]">
                  🥇 Gold
                </div>
              </div>
              <div className="w-[1px] h-8 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
              <div className="text-center px-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-700 dark:text-slate-300">
                  {silverCount}
                </span>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8]">
                  🥈 Silver
                </div>
              </div>
              <div className="w-[1px] h-8 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
              <div className="text-center px-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#7156A5] dark:text-[#B8A5E5]">
                  {totalPoints}
                </span>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8]">
                  Points
                </div>
              </div>
            </div>
          </div>

          {/* Sport Summary Chips */}
          {sportsList.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-mono font-bold text-[#686370] dark:text-[#AAA4B8] flex items-center gap-1 flex-shrink-0">
                <Trophy className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
                Sports Won:
              </span>
              {sportsList.map((sport) => {
                const sp = breakdown.bySport[sport];
                return (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(selectedSport === sport ? 'ALL' : sport)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex-shrink-0 border ${
                      selectedSport === sport 
                        ? 'bg-[#7156A5] text-white border-[#7156A5] shadow-xs' 
                        : 'bg-[#FFFFFF] dark:bg-[#1A1F30] text-[#211D2B] dark:text-[#F5F2FA] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] hover:border-[#7156A5]'
                    }`}
                  >
                    <span>{sp.sportIcon}</span>
                    <span>{sport}</span>
                    <span className="text-[10px] opacity-80">
                      ({sp.gold.length > 0 ? `🥇${sp.gold.length}` : ''}{sp.silver.length > 0 ? ` 🥈${sp.silver.length}` : ''})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filters Toolbar */}
        <div className="px-5 py-3 bg-[#FFFFFF] dark:bg-[#0D101A] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-[#686370] dark:text-[#AAA4B8]">Showing:</span>
            <span className="font-bold text-[#211D2B] dark:text-[#F5F2FA]">
              {filteredMedalists.length} {filteredMedalists.length === 1 ? 'Medal Card' : 'Medal Cards'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg p-0.5 bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] text-xs font-mono">
              <button
                onClick={() => setMedalFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  medalFilter === 'ALL'
                    ? 'bg-[#FFFFFF] dark:bg-[#1A1F30] text-[#211D2B] dark:text-[#F5F2FA] shadow-2xs'
                    : 'text-[#686370] dark:text-[#AAA4B8]'
                }`}
              >
                All Medals
              </button>
              <button
                onClick={() => setMedalFilter('GOLD')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                  medalFilter === 'GOLD'
                    ? 'bg-[#A98B57]/20 dark:bg-[#D2AB45]/20 text-[#A98B57] dark:text-[#F3D78A] shadow-2xs'
                    : 'text-[#686370] dark:text-[#AAA4B8]'
                }`}
              >
                🥇 Gold
              </button>
              <button
                onClick={() => setMedalFilter('SILVER')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                  medalFilter === 'SILVER'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs'
                    : 'text-[#686370] dark:text-[#AAA4B8]'
                }`}
              >
                🥈 Silver
              </button>
            </div>

            {selectedSport !== 'ALL' && (
              <button
                onClick={() => setSelectedSport('ALL')}
                className="text-xs font-mono text-[#7156A5] dark:text-[#B8A5E5] hover:underline"
              >
                Clear Sport
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Student Cards Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-4">
          {filteredMedalists.length === 0 ? (
            <div className="py-16 text-center border rounded-2xl p-6 bg-[#FAF9F6] dark:bg-[#121625] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
              <Trophy className="w-10 h-10 mx-auto text-[#686370] dark:text-[#AAA4B8] mb-2 opacity-50" />
              <h4 className="font-spatial-display font-semibold text-base text-[#211D2B] dark:text-[#F5F2FA]">
                No Medals Found
              </h4>
              <p className="text-xs font-mono text-[#686370] dark:text-[#AAA4B8] mt-1 max-w-sm mx-auto">
                No medals matching current filters for {collegeCode}. Medals will appear as Super Coordinator declares event results.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMedalists.map((medalist) => (
                <StudentMedalCard key={medalist.id} medalist={medalist} />
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#FAF9F6] dark:bg-[#121625] border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex items-center justify-between text-xs font-mono text-[#686370] dark:text-[#AAA4B8] flex-shrink-0">
          <span>🥇 Gold = 5 pts • 🥈 Silver = 3 pts</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#FFFFFF] dark:bg-[#1A1F30] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA] font-bold hover:border-[#7156A5] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
