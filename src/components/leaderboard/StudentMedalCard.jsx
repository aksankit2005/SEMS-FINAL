import React, { useState } from 'react';
import { Award, User, GraduationCap, Hash, Trophy, X, Medal, ChevronRight, Calendar, Building, Sparkles, Shirt } from 'lucide-react';

export const StudentMedalCard = ({ medalist, onCollegeClick }) => {
  const [imgError, setImgError] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!medalist) return null;

  const isGold = medalist.medal === 'GOLD';

  // Format declaration date if present
  const formatDeclarationDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return null;
    }
  };

  const declaredDateFormatted = formatDeclarationDate(medalist.declaredAt);

  return (
    <>
      {/* ─── Leaderboard Medalist Card (Clickable) ─── */}
      <div 
        onClick={() => setIsDetailsOpen(true)}
        className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden border cursor-pointer ${
          isGold 
            ? 'bg-gradient-to-b from-[#FFFDF7] to-[#FFFFFF] dark:from-[#17140B] dark:to-[#0D101A] border-[#D2AB45]/40 hover:border-[#D2AB45] hover:shadow-[0_12px_32px_rgba(210,171,69,0.22)] hover:-translate-y-0.5'
            : 'bg-gradient-to-b from-[#FAFAFC] to-[#FFFFFF] dark:from-[#111420] dark:to-[#0D101A] border-[#AAA4B8]/30 hover:border-[#AAA4B8]/80 hover:shadow-[0_12px_32px_rgba(170,164,184,0.18)] hover:-translate-y-0.5'
        }`}
        title="Click to view full athlete profile"
      >
        {/* Shiny Top Gradient Accent Line */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1 ${
            isGold 
              ? 'bg-gradient-to-r from-[#A98B57] via-[#F3D78A] to-[#A98B57]' 
              : 'bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400'
          }`} 
        />

        <div>
          {/* Header Row: Medal Tag & Points */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span 
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border shadow-2xs ${
                isGold 
                  ? 'bg-[#A98B57]/15 dark:bg-[#D2AB45]/20 border-[#A98B57]/40 dark:border-[#D2AB45]/40 text-[#8B6E32] dark:text-[#F3D78A]' 
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Medal className={`w-3.5 h-3.5 ${isGold ? 'text-[#D2AB45]' : 'text-slate-400'}`} />
              <span>{isGold ? '🥇 GOLD CHAMPION' : '🥈 SILVER RUNNER-UP'}</span>
            </span>

            <span 
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                isGold 
                  ? 'bg-[#D2AB45]/10 border-[#D2AB45]/30 text-[#A98B57] dark:text-[#D2AB45]' 
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-[#686370] dark:text-[#AAA4B8]'
              }`}
            >
              {isGold ? '+5 PTS' : '+3 PTS'}
            </span>
          </div>

          {/* Student Profile Photo & College Badge */}
          <div className="flex items-start gap-3.5 sm:gap-4 mb-3">
            {/* Athlete Photo */}
            <div 
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 shadow-md ${
                isGold ? 'border-[#D2AB45]' : 'border-slate-300 dark:border-slate-600'
              } bg-[#FAF9F6] dark:bg-[#121625]`}
            >
              {medalist.photoUrl && !imgError ? (
                <img 
                  src={medalist.photoUrl} 
                  alt={medalist.studentName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-xs">
                  <User className="w-8 h-8 text-[#686370] dark:text-[#AAA4B8] mb-1" />
                  <span className="text-[9px] font-mono text-[#686370] dark:text-[#AAA4B8]">ATHLETE</span>
                </div>
              )}

              {/* Sport Icon corner pip */}
              <span className="absolute bottom-1 right-1 text-sm bg-black/70 backdrop-blur-xs rounded-md px-1 py-0.5 shadow-xs">
                {medalist.sportIcon || '🏆'}
              </span>
            </div>

            {/* Student Name & Academic Meta */}
            <div className="flex-1 min-w-0">
              <h4 className="font-spatial-display font-bold text-base sm:text-lg text-[#211D2B] dark:text-[#F5F2FA] truncate leading-tight group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors">
                {medalist.studentName}
              </h4>

              {medalist.teamName && medalist.teamName.trim().toLowerCase() !== medalist.studentName.trim().toLowerCase() && (
                <p className="text-xs font-semibold text-[#7156A5] dark:text-[#B8A5E5] truncate mt-0.5">
                  {medalist.teamName}
                </p>
              )}

              {/* College Tag */}
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCollegeClick) onCollegeClick(medalist.collegeCode);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#1A1F30] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA] hover:border-[#7156A5] transition-colors"
                >
                  <span>🏛️</span>
                  <span>{medalist.collegeCode}</span>
                </button>
                <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8]">
                  {medalist.gender || 'Boys'}
                </span>
              </div>

              {/* Sport & Sub-Event pill */}
              <div className="mt-2 text-xs font-mono font-semibold text-[#211D2B] dark:text-[#F5F2FA] flex items-center gap-1.5 truncate">
                <span>{medalist.sportName}</span>
                <span className="text-[#AAA4B8]">•</span>
                <span className="text-[#686370] dark:text-[#AAA4B8] text-[11px] font-normal truncate">
                  {medalist.subEvent}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Info Grid: Course & Roll No (Only if present) */}
          {(medalist.course || medalist.rollNo) && (
            <div className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] space-y-1.5 text-xs font-mono mb-2">
              {medalist.course && (
                <div className="flex items-center gap-1.5 text-[#211D2B] dark:text-[#F5F2FA] truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] flex-shrink-0" />
                  <span className="truncate font-semibold">{medalist.course}</span>
                  {medalist.yearSemester && (
                    <span className="text-[10px] text-[#686370] dark:text-[#AAA4B8] flex-shrink-0">
                      ({medalist.yearSemester})
                    </span>
                  )}
                </div>
              )}

              {medalist.rollNo && (
                <div className="flex items-center gap-1.5 text-[#686370] dark:text-[#AAA4B8] text-[11px]">
                  <Hash className="w-3.5 h-3.5 text-[#686370] dark:text-[#AAA4B8] flex-shrink-0" />
                  <span>Roll No:</span>
                  <span className="font-bold text-[#211D2B] dark:text-[#F5F2FA] tracking-wide">
                    {medalist.rollNo}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Click Prompt Bar */}
        <div className="mt-3 pt-2.5 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center justify-between text-[11px] font-mono text-[#7156A5] dark:text-[#B8A5E5] font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
          <span>View Player Profile</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* ─── Detailed Player Card Modal (Opens on Click) ─── */}
      {isDetailsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div 
            className={`relative max-w-lg w-full rounded-3xl bg-[#FFFFFF] dark:bg-[#0D101A] border-2 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6 ${
              isGold ? 'border-[#D2AB45]/60' : 'border-slate-400/60'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button 
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header: Medal & Tournament Info */}
            <div className="flex items-center gap-2 flex-wrap pr-8">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-sm ${
                isGold 
                  ? 'bg-[#A98B57]/15 text-[#8B6E32] dark:text-[#F3D78A] border-[#A98B57]/40' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}>
                <Medal className={`w-4 h-4 ${isGold ? 'text-[#D2AB45]' : 'text-slate-400'}`} />
                <span>{isGold ? '🥇 GOLD CHAMPION' : '🥈 SILVER RUNNER-UP'}</span>
              </span>

              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#7156A5]/10 text-[#7156A5] dark:text-[#B8A5E5] border border-[#7156A5]/20">
                {isGold ? '+5 Points' : '+3 Points'}
              </span>
            </div>

            {/* Profile Avatar & Primary Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
              <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 border-2 shadow-lg bg-[#FAF9F6] dark:bg-[#121625] ${
                isGold ? 'border-[#D2AB45]' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {medalist.photoUrl && !imgError ? (
                  <img 
                    src={medalist.photoUrl} 
                    alt={medalist.studentName} 
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                    <User className="w-12 h-12 text-[#686370] dark:text-[#AAA4B8] mb-1" />
                    <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8]">ATHLETE</span>
                  </div>
                )}
                <span className="absolute bottom-1.5 right-1.5 text-base bg-black/75 backdrop-blur-xs rounded-md px-1.5 py-0.5 shadow-sm">
                  {medalist.sportIcon || '🏆'}
                </span>
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                <h3 className="font-spatial-display font-black text-2xl text-[#211D2B] dark:text-[#F5F2FA] leading-tight">
                  {medalist.studentName}
                </h3>

                {medalist.teamName && medalist.teamName.trim().toLowerCase() !== medalist.studentName.trim().toLowerCase() && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm font-semibold text-[#7156A5] dark:text-[#B8A5E5]">
                    <Shirt className="w-4 h-4 flex-shrink-0" />
                    <span>{medalist.teamName}</span>
                  </div>
                )}

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#F4F2F7] dark:bg-[#1A1F30] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA]">
                    🏛️ {medalist.collegeCode}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {medalist.gender || 'Boys'}
                  </span>
                </div>
              </div>
            </div>

            {/* Input Data Breakdown Grid (Only showing actual inputted fields) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.14)] text-xs font-mono">
              {/* College / Institution */}
              <div className="space-y-0.5 col-span-1 sm:col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] font-bold">College / Institution</span>
                <p className="font-semibold text-sm text-[#211D2B] dark:text-[#F5F2FA]">
                  {medalist.collegeName || medalist.collegeCode}
                </p>
              </div>

              {/* Sport & Match Event */}
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] font-bold">Sport</span>
                <p className="font-semibold text-[#211D2B] dark:text-[#F5F2FA]">
                  {medalist.sportName}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] font-bold">Event / Category</span>
                <p className="font-semibold text-[#211D2B] dark:text-[#F5F2FA]">
                  {medalist.subEvent || 'Championship Match'}
                </p>
              </div>

              {/* Course (Only if input) */}
              {medalist.course && (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] font-bold">Course / Department</span>
                  <p className="font-semibold text-[#211D2B] dark:text-[#F5F2FA]">
                    {medalist.course}
                  </p>
                </div>
              )}

              {/* Year / Semester (Only if input) */}
              {medalist.yearSemester && (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] font-bold">Year / Semester</span>
                  <p className="font-semibold text-[#211D2B] dark:text-[#F5F2FA]">
                    {medalist.yearSemester}
                  </p>
                </div>
              )}

              {/* Roll Number (Only if input) */}
              {medalist.rollNo && (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] font-bold">Roll / Student ID</span>
                  <p className="font-bold text-[#7156A5] dark:text-[#B8A5E5]">
                    {medalist.rollNo}
                  </p>
                </div>
              )}

              {/* Result Declared Date (Only if present) */}
              {declaredDateFormatted && (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] font-bold">Declared On</span>
                  <p className="font-semibold text-[#211D2B] dark:text-[#F5F2FA] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#686370] dark:text-[#AAA4B8]" />
                    <span>{declaredDateFormatted}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Highlights (Only if input by coordinator) */}
            {medalist.highlights && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 text-xs font-mono space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Special Highlights
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {medalist.highlights}
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#1A1F30] transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
