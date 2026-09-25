import React, { useState } from 'react';
import { Award, User, Trophy, X, Medal, ChevronRight, Sparkles, Shirt, Shield, Star } from 'lucide-react';

export const StudentMedalCard = ({ medalist, onCollegeClick }) => {
  const [imgError, setImgError] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!medalist) return null;

  const isGold = medalist.medal === 'GOLD';
  const points = medalist.points || (isGold ? 5 : 3);
  const studentName = medalist.studentName || (isGold ? 'Gold Champion' : 'Silver Runner-Up');
  const teamName = medalist.teamName || '';
  const hasDistinctTeam = teamName && teamName.trim().toLowerCase() !== studentName.trim().toLowerCase();
  const collegeCode = medalist.collegeCode || 'COLLEGE';
  const collegeName = medalist.collegeName || collegeCode;
  const sportName = medalist.sportName || 'Championship Sport';
  const sportIcon = medalist.sportIcon || '🏆';
  const subEvent = medalist.subEvent || (isGold ? 'Champion' : 'Runner-Up');
  const gender = medalist.gender || 'Boys';
  const highlights = (medalist.highlights || medalist.details?.winnerHighlights || medalist.details?.runnerUpHighlights || '').trim();

  return (
    <>
      {/* ─── Premium Leaderboard Medalist Card (Clickable) ─── */}
      <div 
        onClick={() => setIsDetailsOpen(true)}
        className={`group relative rounded-3xl p-5 sm:p-6 transition-all duration-500 flex flex-col justify-between overflow-hidden border cursor-pointer hover:-translate-y-2 active:scale-[0.99] select-none ${
          isGold 
            ? 'bg-gradient-to-br from-[#FFFDF7] via-[#FAF6EA] to-[#FFFFFF] dark:from-[#1A160D] dark:via-[#12141D] dark:to-[#090C15] border-amber-400/60 dark:border-amber-400/40 hover:border-amber-400 dark:hover:border-amber-300 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.26)]'
            : 'bg-gradient-to-br from-[#FAFAFC] via-[#F4F5F9] to-[#FFFFFF] dark:from-[#131625] dark:via-[#0F121C] dark:to-[#090C15] border-slate-300/80 dark:border-slate-500/40 hover:border-slate-400 dark:hover:border-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_50px_rgba(148,163,184,0.22)]'
        }`}
        title="Click to view full athlete profile"
      >
        {/* Holographic Sweep Sheen on Hover */}
        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/12 dark:via-white/8 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[320%] transition-transform duration-1000 ease-out pointer-events-none" />

        {/* Shimmering Top Accent Line */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-500 ${
            isGold 
              ? 'bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600 group-hover:h-2 shadow-[0_0_12px_rgba(245,158,11,0.6)]' 
              : 'bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 group-hover:h-2 shadow-[0_0_12px_rgba(148,163,184,0.5)]'
          }`} 
        />

        {/* Ambient Radial Spotlight on Hover */}
        <div 
          className={`absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none ${
            isGold ? 'bg-amber-400' : 'bg-slate-300'
          }`}
        />

        <div>
          {/* Header Row: Olympic Medal Seal & Points Crest */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <span 
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-black tracking-wider uppercase border shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                isGold 
                  ? 'bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 shadow-amber-500/10' 
                  : 'bg-gradient-to-r from-slate-200/60 via-slate-100/60 to-slate-200/60 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-slate-500/10'
              }`}
            >
              <Medal className={`w-3.5 h-3.5 ${isGold ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-slate-400 fill-slate-400'}`} />
              <span>{isGold ? '🥇 GOLD CHAMPION' : '🥈 SILVER RUNNER-UP'}</span>
            </span>

            <span 
              className={`inline-flex items-center gap-1 text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                isGold 
                  ? 'bg-amber-500/10 dark:bg-amber-400/10 border-amber-400/40 text-amber-600 dark:text-amber-300' 
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>+{points} PTS</span>
            </span>
          </div>

          {/* Student Profile Photo & Identity */}
          <div className="flex items-start gap-4 mb-3">
            {/* Athlete Photo with Luxury Metallic Frame */}
            <div 
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 shadow-md transition-all duration-500 group-hover:shadow-xl ${
                isGold 
                  ? 'border-amber-400/90 shadow-amber-500/25 group-hover:border-amber-400 ring-2 ring-amber-400/20' 
                  : 'border-slate-300 dark:border-slate-400 shadow-slate-500/15 group-hover:border-slate-300 ring-2 ring-slate-400/20'
              } bg-[#FAF9F6] dark:bg-[#121625]`}
            >
              {medalist.photoUrl && !imgError ? (
                <img 
                  src={medalist.photoUrl} 
                  alt={studentName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110 group-hover:brightness-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-xs bg-slate-100 dark:bg-slate-900">
                  <User className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-1" />
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">ATHLETE</span>
                </div>
              )}

              {/* Sport Icon corner badge */}
              <span className="absolute bottom-1 right-1 text-sm bg-black/85 backdrop-blur-xs rounded-md px-1.5 py-0.5 shadow-sm border border-white/10">
                {sportIcon}
              </span>
            </div>

            {/* Student Name & Core Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="font-spatial-display font-black text-lg sm:text-xl text-[#211D2B] dark:text-[#F5F2FA] truncate leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                {studentName}
              </h4>

              {hasDistinctTeam && (
                <p className="text-xs font-semibold text-[#7156A5] dark:text-[#B8A5E5] truncate flex items-center gap-1">
                  <Shirt className="w-3 h-3 flex-shrink-0" />
                  <span>{teamName}</span>
                </p>
              )}

              {/* College Tag & Gender Pill */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCollegeClick) onCollegeClick(collegeCode);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#1A1F30] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA] hover:border-[#7156A5] hover:bg-[#7156A5]/10 transition-colors cursor-pointer"
                  title={`Filter by ${collegeName}`}
                >
                  <span>🏛️</span>
                  <span>{collegeCode}</span>
                </button>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                  <span>⚡</span>
                  <span>{gender}</span>
                </span>
              </div>

              {/* Sport & Sub-Event pill */}
              <div className="pt-1 text-xs font-mono font-semibold text-[#211D2B] dark:text-[#F5F2FA] flex items-center gap-1.5 truncate">
                <span className="text-slate-800 dark:text-slate-200">{sportName}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-normal truncate">
                  {subEvent}
                </span>
              </div>
            </div>
          </div>

          {/* Highlights preview snippet on the card (If present) */}
          {highlights && (
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 animate-pulse" />
              <span className="truncate italic font-medium">&ldquo;{highlights}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Interactive Click Prompt Bar */}
        <div className="mt-4 pt-3 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center justify-between text-xs font-mono text-[#7156A5] dark:text-[#B8A5E5] font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          <span className="tracking-wide flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span>View Athlete Profile</span>
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
        </div>
      </div>

      {/* ─── VIP Championship Trophy Card Modal (Opens on Click) ─── */}
      {isDetailsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div 
            className={`relative max-w-md w-full rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl border-2 ${
              isGold 
                ? 'bg-gradient-to-b from-[#1C170E] via-[#0E101A] to-[#070912] border-amber-400 shadow-[0_0_75px_rgba(245,158,11,0.35)]' 
                : 'bg-gradient-to-b from-[#141725] via-[#0E101A] to-[#070912] border-slate-300 shadow-[0_0_75px_rgba(148,163,184,0.28)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Spotlight Glow behind Top Center Photo */}
            <div 
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-35 pointer-events-none ${
                isGold ? 'bg-amber-500' : 'bg-slate-300'
              }`} 
            />

            {/* Top Close Button & Medal Badge Header */}
            <div className="relative z-10 flex items-center justify-between w-full">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-black uppercase tracking-wider border shadow-lg ${
                isGold 
                  ? 'bg-gradient-to-r from-amber-500/25 via-yellow-400/25 to-amber-500/25 border-amber-400/70 text-amber-300 shadow-amber-500/20' 
                  : 'bg-gradient-to-r from-slate-200/30 via-slate-100/30 to-slate-200/30 border-slate-300/70 text-slate-200 shadow-slate-500/20'
              }`}>
                <Medal className={`w-4 h-4 ${isGold ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-300 fill-slate-300'}`} />
                <span>{isGold ? '🥇 GOLD CHAMPION' : '🥈 SILVER RUNNER-UP'}</span>
              </span>

              <button 
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:rotate-90 duration-200 cursor-pointer shadow-xs border border-white/15"
                title="Close Profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ─── Centered Athlete Profile Showcase ─── */}
            <div className="relative z-10 flex flex-col items-center text-center pt-1">
              
              {/* 1. PHOTO KO BAADA RAKHO TOP CENTER MAI */}
              <div className="relative group">
                {/* Continuous Pulsing Champion Glow Halo */}
                <div className={`absolute -inset-3 rounded-full blur-xl opacity-80 ${
                  isGold ? 'gold-aura-glow bg-amber-500/40' : 'silver-aura-glow bg-slate-300/30'
                }`} />

                {/* Double 24K Gold / Platinum Silver Metallic Ring */}
                <div className={`relative p-1.5 rounded-full bg-gradient-to-tr ${
                  isGold 
                    ? 'from-amber-600 via-yellow-300 to-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.55)]' 
                    : 'from-slate-400 via-slate-100 to-slate-500 shadow-[0_0_35px_rgba(148,163,184,0.4)]'
                }`}>
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-2 border-black/60 bg-slate-900 shadow-2xl flex items-center justify-center">
                    {medalist.photoUrl && !imgError ? (
                      <img 
                        src={medalist.photoUrl} 
                        alt={studentName} 
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-900">
                        <User className="w-16 h-16 text-slate-500 mb-1" />
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">ATHLETE</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating 3D Sport Icon Crown Badge */}
                <div className={`absolute bottom-1 right-2 w-12 h-12 rounded-full bg-black/90 backdrop-blur-md border-2 ${
                  isGold ? 'border-amber-400 text-amber-300' : 'border-slate-300 text-slate-200'
                } shadow-2xl flex items-center justify-center text-2xl transform group-hover:scale-110 transition-transform duration-300`}>
                  {sportIcon}
                </div>
              </div>

              {/* 2. USKE NICHE NAM */}
              <div className="mt-5 space-y-1 w-full px-2">
                <h3 className={`font-spatial-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight uppercase leading-tight ${
                  isGold 
                    ? 'bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-md' 
                    : 'bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent drop-shadow-md'
                }`}>
                  {studentName}
                </h3>

                {hasDistinctTeam && (
                  <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#7156A5]/25 border border-[#7156A5]/40 text-[#B8A5E5] mt-1 shadow-sm">
                    <Shirt className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Team: {teamName}</span>
                  </div>
                )}
              </div>

              {/* 3. THAN SPORTS */}
              <div className="mt-4">
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold border shadow-md ${
                  isGold 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                    : 'bg-slate-800/80 border-slate-600 text-slate-200'
                }`}>
                  <span>{sportIcon}</span>
                  <span>{sportName}</span>
                  <span className="opacity-40">•</span>
                  <span className="font-semibold text-white">{subEvent}</span>
                </span>
              </div>

              {/* 4. THAN COLLEGE ALSO GENDER */}
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap max-w-sm">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/10 border border-white/15 text-white shadow-sm">
                  <span>🏛️</span>
                  <span>{collegeName}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 shadow-sm">
                  <span>⚡</span>
                  <span>{gender} Event</span>
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border shadow-sm ${
                  isGold 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                    : 'bg-slate-800/80 border-slate-600 text-slate-300'
                }`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>+{points} Points</span>
                </span>
              </div>

              {/* 5. THAN SPECIAL HIGHLIGHTS */}
              {highlights && (
                <div className="mt-5 w-full p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 via-amber-500/10 to-transparent border border-amber-400/30 text-center space-y-2 shadow-inner">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-black uppercase tracking-widest text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Special Highlights</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <p className="font-spatial-display italic text-sm text-amber-100 leading-relaxed font-semibold px-2">
                    &ldquo;{highlights}&rdquo;
                  </p>
                </div>
              )}

              {/* Bottom Close Button */}
              <div className="mt-6 w-full">
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="w-full py-3.5 rounded-2xl text-xs font-mono font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_4px_25px_rgba(245,158,11,0.35)] active:scale-[0.98] transition-all cursor-pointer font-bold"
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
