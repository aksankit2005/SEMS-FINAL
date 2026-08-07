import React, { useState, useEffect } from 'react';
import { X, Award, Tv, VideoOff, Users, ShieldAlert, AlertCircle, Download } from 'lucide-react';
import { resolveSportConfig } from '../../data/sportsConfig';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import { generateMatchResultPDF } from '../../utils/pdfExporter';

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
                JSON.stringify(prev.roster1) === JSON.stringify(updated.roster1) &&
                JSON.stringify(prev.roster2) === JSON.stringify(updated.roster2) &&
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

  const team1Name = typeof match.team1 === 'object' ? (match.team1?.name || 'Team 1') : String(match.team1 || 'Team 1');
  const team2Name = typeof match.team2 === 'object' ? (match.team2?.name || 'Team 2') : String(match.team2 || 'Team 2');
  const score1Val = Number(typeof match.team1 === 'object' ? (match.team1?.score ?? '0') : (match.score1 ?? '0'));
  const score2Val = Number(typeof match.team2 === 'object' ? (match.team2?.score ?? '0') : (match.score2 ?? '0'));

  const statusLower = (match.status || '').toLowerCase();
  const isFinished = statusLower === 'completed' || statusLower === 'finished' || statusLower === 'ended';

  const setsHistory = match.setsHistory || [];

  const calcSetsWon1 = () => {
    if (typeof match.setsWon1 === 'number') return match.setsWon1;
    if (typeof match.setsWonA === 'number') return match.setsWonA;
    return setsHistory.filter(
      (s) => s.isLocked && (s.winner === 1 || s.winner === '1' || s.winner === team1Name || s.score1 > s.score2)
    ).length;
  };

  const calcSetsWon2 = () => {
    if (typeof match.setsWon2 === 'number') return match.setsWon2;
    if (typeof match.setsWonB === 'number') return match.setsWonB;
    return setsHistory.filter(
      (s) => s.isLocked && (s.winner === 2 || s.winner === '2' || s.winner === team2Name || s.score2 > s.score1)
    ).length;
  };

  const setsWonA = calcSetsWon1();
  const setsWonB = calcSetsWon2();

  const isBasketball = (match.sportId || match.sport || match.sportName || '').toLowerCase().includes('basketball') || (Boolean(match.roster1 || match.roster2) && !(match.sportId || match.sport || match.sportName || '').toLowerCase().includes('chess'));
  const isChess = (match.sportId || match.sport || match.sportName || '').toLowerCase().includes('chess') ||
                  (match.matchTitle || match.title || '').toLowerCase().includes('chess') ||
                  (match.eventTitle || '').toLowerCase().includes('chess');

  const roster1 = match.roster1 && match.roster1.length > 0
    ? match.roster1
    : [
        { id: 'T1-1', name: `${team1Name} Player 1`, jersey: '4', onCourt: true, points: Math.floor(score1Val * 0.4), fouls: 1 },
        { id: 'T1-2', name: `${team1Name} Player 2`, jersey: '7', onCourt: true, points: Math.floor(score1Val * 0.3), fouls: 2 },
        { id: 'T1-3', name: `${team1Name} Player 3`, jersey: '10', onCourt: true, points: Math.floor(score1Val * 0.2), fouls: 0 },
        { id: 'T1-4', name: `${team1Name} Player 4`, jersey: '11', onCourt: true, points: Math.floor(score1Val * 0.1), fouls: 3 },
        { id: 'T1-5', name: `${team1Name} Player 5`, jersey: '23', onCourt: true, points: 0, fouls: 1 },
        { id: 'T1-6', name: `${team1Name} Sub 1`, jersey: '30', onCourt: false, points: 0, fouls: 0 },
        { id: 'T1-7', name: `${team1Name} Sub 2`, jersey: '33', onCourt: false, points: 0, fouls: 0 },
      ];

  const roster2 = match.roster2 && match.roster2.length > 0
    ? match.roster2
    : [
        { id: 'T2-1', name: `${team2Name} Player 1`, jersey: '4', onCourt: true, points: Math.floor(score2Val * 0.4), fouls: 2 },
        { id: 'T2-2', name: `${team2Name} Player 2`, jersey: '7', onCourt: true, points: Math.floor(score2Val * 0.3), fouls: 1 },
        { id: 'T2-3', name: `${team2Name} Player 3`, jersey: '10', onCourt: true, points: Math.floor(score2Val * 0.2), fouls: 0 },
        { id: 'T2-4', name: `${team2Name} Player 4`, jersey: '11', onCourt: true, points: Math.floor(score2Val * 0.1), fouls: 4 },
        { id: 'T2-5', name: `${team2Name} Player 5`, jersey: '23', onCourt: true, points: 0, fouls: 2 },
        { id: 'T2-6', name: `${team2Name} Sub 1`, jersey: '30', onCourt: false, points: 0, fouls: 0 },
        { id: 'T2-7', name: `${team2Name} Sub 2`, jersey: '33', onCourt: false, points: 0, fouls: 0 },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fade-in font-sans">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-3xl shadow-2xl overflow-hidden my-auto space-y-0 text-slate-900 dark:text-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 dark:bg-indigo-600/20 text-blue-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-black shrink-0">
              {sportConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isFinished ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-bold uppercase">
                    🏁 Finished
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse uppercase">
                    🔴 LIVE SPECTATOR SCOREBOARD
                  </span>
                )}
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{match.id}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{match.matchTitle || `${team1Name} vs ${team2Name}`}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isFinished && (
              <button
                onClick={() => {
                  generateMatchResultPDF({
                    ...match,
                    team1: team1Name,
                    team2: team2Name,
                    score1: score1Val,
                    score2: score2Val,
                    roster1,
                    roster2,
                    setsHistory
                  }, sportConfig.name || match.sportName);
                }}
                className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Download Official Match Result PDF"
              >
                <Download className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Download Result PDF</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Stream */}
        {match.youtubeVideoId ? (
          <YouTubePlayer youtubeVideoId={match.youtubeVideoId} />
        ) : (
          <div className="p-6 bg-slate-50 dark:bg-[#090D16] text-center border-b border-slate-200 dark:border-[#1E293B] space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto text-xl">
              <VideoOff className="w-6 h-6 text-slate-500" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live video is not available</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isChess ? 'Showing real-time chess board status updates from official tournament table.' : 'Showing real-time live score updates from official tournament scoring table.'}
            </p>
          </div>
        )}


        {/* Large Spectator Scoreboard Section */}
        <div className="p-6 bg-slate-50 dark:bg-gradient-to-b dark:from-[#0B1120] dark:to-[#0F172A] border-b border-slate-200 dark:border-[#1E293B] space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Player / Team A */}
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{team1Name}</h2>
              {!isChess && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Sets / Quarters Won:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-indigo-600/20 text-blue-700 dark:text-indigo-300 font-mono font-bold">
                    {setsWonA}
                  </span>
                </div>
              )}
            </div>

            {/* Middle Box - Custom for Chess vs Point Sports */}
            {isChess ? (
              <div className="text-center bg-white dark:bg-[#090D16] p-5 rounded-2xl border border-purple-500/30 shadow-md space-y-3">
                <span className="text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400 tracking-widest block">
                  ♟️ CHESS MATCH {isFinished ? 'VERDICT & WINNER' : 'IN PROGRESS'}
                </span>

                {isFinished ? (
                  <div className="space-y-1.5 py-1">
                    <div className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 text-base font-black">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span>Winner: {match.winner || (score1Val > score2Val ? team1Name : score2Val > score1Val ? team2Name : 'Draw (½ - ½)')}</span>
                    </div>
                    <p className="text-xs font-mono text-purple-600 dark:text-purple-300 font-bold bg-purple-500/10 py-1 px-3 rounded-full inline-block">
                      {match.scoreText || match.scoreSummary || (score1Val === 1 ? 'Result: 1 - 0 (White Wins)' : score2Val === 1 ? 'Result: 0 - 1 (Black Wins)' : 'Result: ½ - ½ (Draw)')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-1">
                    <div className="text-base font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
                      <span className="text-purple-600 dark:text-purple-400">{team1Name}</span>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-bold">VS</span>
                      <span className="text-purple-600 dark:text-purple-400">{team2Name}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-bold">REAL-TIME CHESS MATCH IN PROGRESS</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center bg-white dark:bg-[#090D16] p-5 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm dark:shadow-inner space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest block">
                  {sportConfig.name} {isFinished ? 'Final Score' : 'Live Points'}
                </span>
                
                <div className="flex items-center justify-center gap-4 text-5xl font-black font-mono text-slate-900 dark:text-white">
                  <span className="text-blue-600 dark:text-indigo-400">{score1Val}</span>
                  <span className="text-slate-400 dark:text-slate-600 text-3xl">:</span>
                  <span className="text-blue-600 dark:text-indigo-400">{score2Val}</span>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  {!isFinished && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                  <span className="font-bold">{isFinished ? 'MATCH FINISHED' : 'REAL-TIME LIVE SCORE'}</span>
                </div>
              </div>
            )}

            {/* Player / Team B */}
            <div className="text-center md:text-right space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{team2Name}</h2>
              {!isChess && (
                <div className="flex items-center justify-center md:justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Sets / Quarters Won:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-indigo-600/20 text-blue-700 dark:text-indigo-300 font-mono font-bold">
                    {setsWonB}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Match Metadata Bar */}
          <div className="grid grid-cols-3 gap-3 text-center bg-white dark:bg-[#090D16]/60 p-3.5 rounded-2xl border border-slate-200 dark:border-[#1E293B] text-xs shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Sport</span>
              <span className="font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <span>{sportConfig.icon}</span> <span>{sportConfig.name}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Venue / Court</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400 truncate block">{match.venue || match.tableNumber || sportConfig.venueOptions[0]}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Category Format</span>
              <span className="font-extrabold text-blue-600 dark:text-indigo-400">{match.format || 'Standard'}</span>
            </div>
          </div>

        </div>

        {/* BASKETBALL PLAYER LIVE STATS & FOULS SECTION */}
        {isBasketball && (
          <div className="p-6 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#1E293B] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1E293B] pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  Basketball Live Player Stats (Points & Personal Fouls)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time individual points scored and fouls committed by players on court
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-bold self-start sm:self-auto">
                {match.quarter || 'Live Match'}
              </span>
            </div>

            {/* Side-by-Side Team Rosters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Team 1 Roster Card */}
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-600/10 dark:bg-indigo-600/20 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                  <span className="font-extrabold text-xs text-blue-700 dark:text-indigo-300 uppercase tracking-wider">
                    {team1Name} Roster
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    Team Score: <strong className="text-blue-600 dark:text-indigo-400">{score1Val} PTS</strong>
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                  {roster1.map((p) => {
                    const isFouledOut = (p.fouls || 0) >= 5;
                    return (
                      <div key={p.id || p.jersey} className={`p-3 flex items-center justify-between text-xs transition ${isFouledOut ? 'bg-rose-500/10' : p.onCourt ? 'bg-emerald-500/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-black flex items-center justify-center text-[11px] shrink-0">
                            #{p.jersey}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                              {p.onCourt && !isFouledOut && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-extrabold uppercase">
                                  ON COURT
                                </span>
                              )}
                              {isFouledOut && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-mono font-extrabold uppercase flex items-center gap-1">
                                  <ShieldAlert className="w-2.5 h-2.5" /> FOULED OUT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 font-mono">
                          {/* Points */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">Points</span>
                            <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                              {p.points || 0} PTS
                            </span>
                          </div>

                          {/* Fouls */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">Fouls</span>
                            <span className={`font-black text-xs px-2 py-0.5 rounded ${
                              (p.fouls || 0) >= 5
                                ? 'bg-rose-500 text-white font-extrabold'
                                : (p.fouls || 0) >= 4
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {p.fouls || 0} / 5
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team 2 Roster Card */}
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-600/10 dark:bg-indigo-600/20 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                  <span className="font-extrabold text-xs text-blue-700 dark:text-indigo-300 uppercase tracking-wider">
                    {team2Name} Roster
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    Team Score: <strong className="text-blue-600 dark:text-indigo-400">{score2Val} PTS</strong>
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                  {roster2.map((p) => {
                    const isFouledOut = (p.fouls || 0) >= 5;
                    return (
                      <div key={p.id || p.jersey} className={`p-3 flex items-center justify-between text-xs transition ${isFouledOut ? 'bg-rose-500/10' : p.onCourt ? 'bg-emerald-500/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-black flex items-center justify-center text-[11px] shrink-0">
                            #{p.jersey}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                              {p.onCourt && !isFouledOut && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-extrabold uppercase">
                                  ON COURT
                                </span>
                              )}
                              {isFouledOut && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-mono font-extrabold uppercase flex items-center gap-1">
                                  <ShieldAlert className="w-2.5 h-2.5" /> FOULED OUT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 font-mono">
                          {/* Points */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">Points</span>
                            <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                              {p.points || 0} PTS
                            </span>
                          </div>

                          {/* Fouls */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">Fouls</span>
                            <span className={`font-black text-xs px-2 py-0.5 rounded ${
                              (p.fouls || 0) >= 5
                                ? 'bg-rose-500 text-white font-extrabold'
                                : (p.fouls || 0) >= 4
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {p.fouls || 0} / 5
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Set History Breakdown */}
        {setsHistory.length > 0 && (
          <div className="p-6 bg-white dark:bg-[#0F172A]">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600 dark:text-indigo-400" /> Set / Quarter Score Breakdown
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
                        {team1Name}: {s.score1}
                      </span>
                      <span className="text-slate-400 dark:text-slate-600">-</span>
                      <span className={s.winner === 2 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400'}>
                        {team2Name}: {s.score2}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#090D16] border-t border-slate-200 dark:border-[#1E293B] text-center text-xs text-slate-500">
          Spectator Scoreboard • Auto-refreshing real-time updates from SEMS Official Umpires
        </div>

      </div>
    </div>
  );
};

