import React, { useState, useEffect } from 'react';
import { X, Award, Tv, VideoOff } from 'lucide-react';
import { resolveSportConfig } from '../../data/sportsConfig';
import { getYouTubeEmbedUrl } from '../../utils/youtube';

const getShortCollege = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return null;
  const s = name.trim();
  if (s.toLowerCase().includes('maharana pratap engineering') || s.toLowerCase().includes('mpec')) return 'MPEC';
  if (s.toLowerCase().includes('madhav institute') || s.toLowerCase().includes('mips')) return 'MIPS';
  if (s.toLowerCase().includes('pharmacy') || s.toLowerCase().includes('mpcps')) return 'MPCPS';
  if (s.toLowerCase().includes('degree') || s.toLowerCase().includes('mpdc')) return 'MPDC';
  if (s.length <= 6) return s.toUpperCase();
  return s.split(' ').map((w) => w[0]).join('').toUpperCase();
};

const YouTubePlayer = React.memo(({ youtubeVideoId }) => {
  const embedUrl = youtubeVideoId ? getYouTubeEmbedUrl(youtubeVideoId) : null;
  if (!embedUrl) return null;

  return (
    <div className="relative aspect-video w-full bg-black">
      <iframe
        src={embedUrl}
        title="Match Live Stream"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white flex items-center gap-2 border border-white/10">
        <span className="flex items-center gap-1 text-rose-400 font-bold">
          <Tv className="w-3.5 h-3.5 text-rose-500" /> YouTube Live Broadcast Active
        </span>
        <span className="text-slate-400 font-sans">1080p HD Official Stream</span>
      </div>
    </div>
  );
});

export const LiveMatchViewerModal = ({ match: initialMatch, onClose }) => {
  const [match, setMatch] = useState(initialMatch);

  useEffect(() => {
    setMatch(initialMatch);
  }, [initialMatch]);

  useEffect(() => {
    const handleUpdate = () => {
      if (!match || !match.id) return;
      const localActiveStr = localStorage.getItem('sems_active_live_matches');
      if (localActiveStr) {
        try {
          const parsed = JSON.parse(localActiveStr);
          if (parsed && parsed[match.id]) {
            const updated = parsed[match.id];
            setMatch((prev) => {
              if (
                prev.score1 === updated.score1 &&
                prev.score2 === updated.score2 &&
                prev.setsWon1 === updated.setsWon1 &&
                prev.setsWon2 === updated.setsWon2 &&
                JSON.stringify(prev.setsHistory) === JSON.stringify(updated.setsHistory)
              ) {
                return prev;
              }
              return { ...prev, ...updated };
            });
          }
        } catch (e) {}
      }
    };

    window.addEventListener('sems_matches_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(handleUpdate, 1000);

    return () => {
      window.removeEventListener('sems_matches_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [match?.id]);

  if (!match) return null;

  const sportConfig = resolveSportConfig(match);

  const setsHistory = match.setsHistory || [];

  const calcSetsWon1 = () => {
    if (typeof match.setsWon1 === 'number') return match.setsWon1;
    if (typeof match.setsWonA === 'number') return match.setsWonA;
    return setsHistory.filter(
      (s) => s.isLocked && (s.winner === 1 || s.winner === '1' || s.winner === match.team1 || s.score1 > s.score2)
    ).length;
  };

  const calcSetsWon2 = () => {
    if (typeof match.setsWon2 === 'number') return match.setsWon2;
    if (typeof match.setsWonB === 'number') return match.setsWonB;
    return setsHistory.filter(
      (s) => s.isLocked && (s.winner === 2 || s.winner === '2' || s.winner === match.team2 || s.score2 > s.score1)
    ).length;
  };

  const setsWonA = calcSetsWon1();
  const setsWonB = calcSetsWon2();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fade-in font-sans">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-3xl shadow-2xl overflow-hidden my-auto space-y-0 text-slate-900 dark:text-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-indigo-600/20 text-blue-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
              {sportConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                  🔴 LIVE SPECTATOR SCOREBOARD
                </span>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{match.id}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{match.matchTitle || `${match.team1} vs ${match.team2}`}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Stream (Memoized to prevent iframe refresh on score updates) */}
        {match.youtubeVideoId ? (
          <YouTubePlayer youtubeVideoId={match.youtubeVideoId} />
        ) : (
          <div className="p-6 bg-slate-50 dark:bg-[#090D16] text-center border-b border-slate-200 dark:border-[#1E293B] space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto text-xl">
              <VideoOff className="w-6 h-6 text-slate-500" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live video is not available</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Showing real-time live score updates from official tournament umpires.</p>
          </div>
        )}


        {/* Large Spectator Scoreboard Section */}
        <div className="p-6 bg-slate-50 dark:bg-gradient-to-b dark:from-[#0B1120] dark:to-[#0F172A] border-b border-slate-200 dark:border-[#1E293B] space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Player / Team A */}
            <div className="text-center md:text-left space-y-2">
              {getShortCollege(match.college1) && (
                <span className="text-xs font-bold uppercase text-blue-600 dark:text-indigo-400 tracking-wider block">
                  {getShortCollege(match.college1)}
                </span>
              )}
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{match.team1}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Sets Won:</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-indigo-600/20 text-blue-700 dark:text-indigo-300 font-mono font-bold">
                  {setsWonA}
                </span>
              </div>
            </div>

            {/* Middle Live Score */}
            <div className="text-center bg-white dark:bg-[#090D16] p-5 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm dark:shadow-inner space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest block">
                {sportConfig.name} Live Points
              </span>
              
              <div className="flex items-center justify-center gap-4 text-5xl font-black font-mono text-slate-900 dark:text-white">
                <span className="text-blue-600 dark:text-indigo-400">{match.score1}</span>
                <span className="text-slate-400 dark:text-slate-600 text-3xl">:</span>
                <span className="text-blue-600 dark:text-indigo-400">{match.score2}</span>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold">REAL-TIME LIVE SCORE</span>
              </div>
            </div>

            {/* Player / Team B */}
            <div className="text-center md:text-right space-y-2">
              {getShortCollege(match.college2) && (
                <span className="text-xs font-bold uppercase text-blue-600 dark:text-indigo-400 tracking-wider block">
                  {getShortCollege(match.college2)}
                </span>
              )}
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{match.team2}</h2>
              <div className="flex items-center justify-center md:justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Sets Won:</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-indigo-600/20 text-blue-700 dark:text-indigo-300 font-mono font-bold">
                  {setsWonB}
                </span>
              </div>
            </div>

          </div>

          {/* Match Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-white dark:bg-[#090D16]/60 p-3 rounded-xl border border-slate-200 dark:border-[#1E293B] text-xs shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Sport</span>
              <span className="font-bold text-slate-900 dark:text-white">{sportConfig.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Venue</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{match.venue || match.tableNumber || sportConfig.venueOptions[0]}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Umpire / Referee</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{match.referee || 'Official Ref A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Category Format</span>
              <span className="font-bold text-blue-600 dark:text-indigo-400">{match.format || 'Singles'}</span>
            </div>
          </div>

        </div>

        {/* Set History Breakdown */}
        <div className="p-6 bg-white dark:bg-[#0F172A]">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600 dark:text-indigo-400" /> Set Score Breakdown
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {setsHistory.map((s) => (
                <div
                  key={s.set}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">Set #{s.set}</span>
                  <div className="flex items-center gap-3 font-mono font-bold">
                    <span className={s.winner === 1 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400'}>
                      {match.team1}: {s.score1}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">-</span>
                    <span className={s.winner === 2 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400'}>
                      {match.team2}: {s.score2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#090D16] border-t border-slate-200 dark:border-[#1E293B] text-center text-xs text-slate-500">
          Spectator Scoreboard • Auto-refreshing real-time updates from SEMS Official Umpires
        </div>

      </div>
    </div>
  );
};

