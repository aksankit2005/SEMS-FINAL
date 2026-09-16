import React, { useState } from 'react';
import { Award, User, GraduationCap, Hash, Trophy, Sparkles, Maximize2, X, Medal } from 'lucide-react';

export const StudentMedalCard = ({ medalist, onCollegeClick }) => {
  const [imgError, setImgError] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  if (!medalist) return null;

  const isGold = medalist.medal === 'GOLD';

  return (
    <>
      <div 
        className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden border ${
          isGold 
            ? 'bg-gradient-to-b from-[#FFFDF7] to-[#FFFFFF] dark:from-[#17140B] dark:to-[#0D101A] border-[#D2AB45]/40 hover:border-[#D2AB45] hover:shadow-[0_8px_30px_rgba(210,171,69,0.2)]'
            : 'bg-gradient-to-b from-[#FAFAFC] to-[#FFFFFF] dark:from-[#111420] dark:to-[#0D101A] border-[#AAA4B8]/30 hover:border-[#AAA4B8]/80 hover:shadow-[0_8px_30px_rgba(170,164,184,0.15)]'
        }`}
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
          <div className="flex items-start gap-3.5 sm:gap-4 mb-4">
            {/* Athlete Photo with Lightbox trigger */}
            <div 
              onClick={() => medalist.photoUrl && setIsPhotoOpen(true)}
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 cursor-pointer group/photo shadow-md ${
                isGold ? 'border-[#D2AB45]' : 'border-slate-300 dark:border-slate-600'
              } bg-[#FAF9F6] dark:bg-[#121625]`}
              title="Click to view student photograph"
            >
              {medalist.photoUrl && !imgError ? (
                <img 
                  src={medalist.photoUrl} 
                  alt={medalist.studentName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover/photo:scale-110"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-xs">
                  <User className="w-8 h-8 text-[#686370] dark:text-[#AAA4B8] mb-1" />
                  <span className="text-[9px] font-mono text-[#686370] dark:text-[#AAA4B8]">ATHLETE</span>
                </div>
              )}

              {/* Hover Zoom Icon overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="w-5 h-5 text-white drop-shadow" />
              </div>

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

              {medalist.teamName && medalist.teamName !== medalist.studentName && (
                <p className="text-xs font-medium text-[#7156A5] dark:text-[#B8A5E5] truncate mb-1">
                  {medalist.teamName}
                </p>
              )}

              {/* College Tag */}
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onCollegeClick && onCollegeClick(medalist.collegeCode)}
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

          {/* Academic Info Grid: Course & Roll No */}
          <div className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] space-y-1.5 text-xs font-mono mb-3">
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
        </div>

        {/* Footer: Score Summary / Highlights */}
        {(medalist.scoreSummary || medalist.highlights) && (
          <div className="pt-2 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
            {medalist.scoreSummary && (
              <div className="text-[11px] font-mono font-bold text-[#A98B57] dark:text-[#F3D78A] truncate flex items-center gap-1">
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{medalist.scoreSummary}</span>
              </div>
            )}
            {medalist.highlights && (
              <p className="text-[11px] text-[#686370] dark:text-[#AAA4B8] italic mt-1 line-clamp-2 leading-relaxed">
                &ldquo;{medalist.highlights}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Photo Preview Modal */}
      {isPhotoOpen && medalist.photoUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsPhotoOpen(false)}
        >
          <div 
            className="relative max-w-md w-full rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] overflow-hidden shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsPhotoOpen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="rounded-xl overflow-hidden aspect-square w-full mb-3 bg-[#121625]">
              <img 
                src={medalist.photoUrl} 
                alt={medalist.studentName} 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center">
              <span className={`inline-block text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-1 border ${
                isGold 
                  ? 'bg-[#A98B57]/15 text-[#A98B57] dark:text-[#F3D78A] border-[#A98B57]/30' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}>
                {isGold ? '🥇 Gold Champion' : '🥈 Silver Runner-Up'}
              </span>
              <h3 className="font-spatial-display font-bold text-lg text-[#211D2B] dark:text-[#F5F2FA]">
                {medalist.studentName}
              </h3>
              <p className="text-xs font-mono text-[#686370] dark:text-[#AAA4B8]">
                {medalist.collegeName || medalist.collegeCode} • {medalist.sportName} ({medalist.subEvent})
              </p>
              {medalist.rollNo && (
                <p className="text-[11px] font-mono text-[#7156A5] dark:text-[#B8A5E5] mt-1">
                  Roll No: {medalist.rollNo} • {medalist.course}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
