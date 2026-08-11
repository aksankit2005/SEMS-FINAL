import React, { useState, useEffect, useRef } from 'react';
import { X, Award, Tv, VideoOff, Users, ShieldAlert, AlertCircle, Download, Maximize, Minimize } from 'lucide-react';
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

const YouTubePlayer = React.memo(({ youtubeVideoId, match, isCricket }) => {
  const embedUrl = youtubeVideoId ? getYouTubeEmbedUrl(youtubeVideoId) : null;
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreenOverlay = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!embedUrl) return null;

  const currentInnings = match?.currentInnings || 1;
  const currentRuns = currentInnings === 1 ? (match?.score1 ?? 0) : (match?.score2 ?? 0);
  const currentWickets = currentInnings === 1 ? (match?.wickets1 ?? 0) : (match?.wickets2 ?? 0);
  const currentOvers = currentInnings === 1 ? (match?.overs1 || '0.0') : (match?.overs2 || '0.0');
  const team1Name = typeof match?.team1 === 'object' ? (match?.team1?.name || 'Team 1') : String(match?.team1 || 'Team 1');
  const team2Name = typeof match?.team2 === 'object' ? (match?.team2?.name || 'Team 2') : String(match?.team2 || 'Team 2');
  const battingTeam = currentInnings === 1 ? team1Name : team2Name;

  return (
    <div ref={containerRef} className="relative aspect-video w-full bg-black group overflow-hidden">
      <iframe
        src={embedUrl}
        title="Match Live Stream"
        className="w-full h-full border-0 pointer-events-auto"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      {/* Top Banner Tag */}
      <div className="absolute top-3 left-3 z-20 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-mono text-white flex items-center gap-2 border border-slate-700/50 shadow-lg pointer-events-none">
        <span className="flex items-center gap-1 text-rose-400 font-bold">
          <Tv className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Live Stream
        </span>
        <span className="text-slate-400 font-sans hidden sm:inline">1080p HD Broadcast</span>
      </div>

      {/* Fullscreen Overlay Toggle Button */}
      <button
        onClick={toggleFullscreenOverlay}
        className="absolute top-3 right-3 z-30 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 border border-emerald-400/50 shadow-xl transition cursor-pointer hover:scale-105 active:scale-95"
        title="Click here to open Fullscreen Video with Floating Live Scorecard Overlay"
      >
        {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-amber-300" /> : <Maximize className="w-3.5 h-3.5 text-white" />}
        <span>{isFullscreen ? 'Exit Fullscreen' : '📺 Fullscreen (with Live Score)'}</span>
      </button>

      {/* FLOATING BROADCAST SCOREBAR OVERLAY (FOR CRICKET) */}
      {isCricket && match && (
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-20 pointer-events-none">
          <div className="bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-700/60 p-2.5 sm:p-3 shadow-2xl text-white pointer-events-auto transition-all">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              
              {/* Left: Batting Team & Big Score */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-black text-sm uppercase text-emerald-400 tracking-wide">{battingTeam}</span>
                </div>
                <div className="px-2.5 py-0.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-sm sm:text-base">
                  {currentRuns}/{currentWickets} <span className="text-xs font-normal text-slate-300">({currentOvers} ov)</span>
                </div>
              </div>

              {/* Center: On-Field Striker & Bowler Quick Summary */}
              <div className="hidden md:flex items-center gap-4 text-[11px]">
                {/* Striker */}
                <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
                  <span className="text-amber-400 font-bold">🏏 {match.striker?.name || 'Striker'}</span>
                  <span className="font-black text-white">{match.striker?.runs || 0}</span>
                  <span className="text-slate-400">({match.striker?.balls || 0}b)</span>
                </div>

                {/* Bowler */}
                <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
                  <span className="text-cyan-400 font-bold">🎯 {match.bowler?.name || 'Bowler'}</span>
                  <span className="font-black text-rose-400">{match.bowler?.wickets || 0}/{match.bowler?.runs || 0}</span>
                  <span className="text-slate-400">({match.bowler?.overs || '0.0'})</span>
                </div>
              </div>

              {/* Right: Recent Deliveries Ticker */}
              {(match.recentBalls || []).length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto">
                  {match.recentBalls.slice(-6).map((b, idx) => (
                    <span
                      key={idx}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-mono font-black text-[10px] sm:text-xs border ${
                        b === 'W' ? 'bg-rose-600 text-white border-rose-500 animate-pulse' :
                        b === '4' || b === '6' ? 'bg-emerald-600 text-white border-emerald-500' :
                        b === 'WD' || b === 'NB' ? 'bg-amber-500/30 text-amber-300 border-amber-500/50' :
                        'bg-slate-900 text-slate-200 border-slate-700'
                      }`}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const LiveMatchViewerModal = ({ match: initialMatch, onClose }) => {
  const [match, setMatch] = useState(initialMatch);

  useEffect(() => {
    if (initialMatch) {
      setMatch(initialMatch);
    }
  }, [initialMatch]);

  useEffect(() => {
    let isSubscribed = true;

    const handleUpdate = async () => {
      const targetId = initialMatch?.id || initialMatch?.matchId || match?.id || match?.matchId;
      if (!targetId) return;

      let updated = null;

      // 1. Check local active live matches map first
      const localActiveStr = localStorage.getItem('sems_active_live_matches');
      if (localActiveStr) {
        try {
          const parsed = JSON.parse(localActiveStr);
          if (parsed) {
            if (parsed[targetId]) {
              updated = parsed[targetId];
            } else {
              const list = Array.isArray(parsed) ? parsed : Object.values(parsed);
              updated = list.find((m) => m && (m.id === targetId || m.matchId === targetId));
            }
          }
        } catch (e) { }
      }

      // 2. Fallback to coordinator public live matches (scans server API + local storage)
      if (!updated) {
        try {
          const publicLive = await coordinatorApi.getPublicLiveMatches();
          if (Array.isArray(publicLive)) {
            updated = publicLive.find((m) => m && (m.id === targetId || m.matchId === targetId));
          }
        } catch (e) {}
      }

      // 3. Fallback to scanning all sems_coord_matches_* keys in localStorage
      if (!updated) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sems_coord_matches_') || key.endsWith('MatchSchedules'))) {
            try {
              const list = JSON.parse(localStorage.getItem(key));
              if (Array.isArray(list)) {
                const item = list.find((m) => m && (m.id === targetId || m.matchId === targetId));
                if (item) {
                  updated = item;
                  break;
                }
              }
            } catch (e) {}
          }
        }
      }

      if (updated && isSubscribed) {
        setMatch((prev) => {
          if (!prev) return updated;
          return { ...prev, ...updated };
        });
      }
    };

    handleUpdate();

    window.addEventListener('sems_matches_updated', handleUpdate);
    window.addEventListener('sems_results_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(handleUpdate, 1000);

    return () => {
      isSubscribed = false;
      window.removeEventListener('sems_matches_updated', handleUpdate);
      window.removeEventListener('sems_results_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [initialMatch?.id, initialMatch?.matchId, match?.id]);

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

  const isCricket = (match.sportId || match.sport || match.sportName || '').toLowerCase().includes('cricket') ||
                    (match.matchTitle || match.title || '').toLowerCase().includes('cricket') ||
                    (match.eventTitle || '').toLowerCase().includes('cricket') ||
                    Boolean(match.striker || match.bowler);

  const isFootball = (match.sportId || match.sport || match.sportName || '').toLowerCase().includes('football') ||
                     (match.eventTitle || match.title || match.matchTitle || '').toLowerCase().includes('football');

  const isBasketball = !isCricket && !isFootball && ((match.sportId || match.sport || match.sportName || '').toLowerCase().includes('basketball') || (Boolean(match.roster1 || match.roster2) && !(match.sportId || match.sport || match.sportName || '').toLowerCase().includes('chess')));
  const isChess = !isCricket && !isFootball && ((match.sportId || match.sport || match.sportName || '').toLowerCase().includes('chess') ||
                  (match.matchTitle || match.title || '').toLowerCase().includes('chess') ||
                  (match.eventTitle || '').toLowerCase().includes('chess'));

  const isAthletics = (match.sportId || match.sport || match.sportName || '').toLowerCase().includes('athletics') ||
                      (match.matchTitle || match.title || '').toLowerCase().includes('athletics');

  const defaultKabaddiTeam1 = [
    { id: 1, name: 'Player A', jersey: '07', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 2, name: 'Player B', jersey: '12', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 3, name: 'Player C', jersey: '03', position: 'All Rounder', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 4, name: 'Player D', jersey: '05', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 5, name: 'Player E', jersey: '09', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 6, name: 'Player F', jersey: '11', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 7, name: 'Player G', jersey: '04', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
  ];

  const defaultKabaddiTeam2 = [
    { id: 1, name: 'Player 1', jersey: '01', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 2, name: 'Player 2', jersey: '02', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 3, name: 'Player 3', jersey: '10', position: 'All Rounder', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 4, name: 'Player 4', jersey: '08', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 5, name: 'Player 5', jersey: '06', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 6, name: 'Player 6', jersey: '14', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 7, name: 'Player 7', jersey: '15', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
  ];

  const playerStats1 = match.playerStats1 && match.playerStats1.length > 0 ? match.playerStats1 : defaultKabaddiTeam1;
  const playerStats2 = match.playerStats2 && match.playerStats2.length > 0 ? match.playerStats2 : defaultKabaddiTeam2;

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
                  playerStats1,
                  playerStats2,
                  setsHistory
                }, sportConfig.name || match.sportName);
              }}
              className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Download Official Score Sheet PDF"
            >
              <Download className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">Download Score Sheet PDF</span>
            </button>

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
          <YouTubePlayer youtubeVideoId={match.youtubeVideoId} match={match} isCricket={isCricket} />
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

            {/* Middle Box - Custom for Cricket vs Chess vs Point Sports */}
            {isCricket ? (
              <div className="text-center bg-white dark:bg-[#090D16] p-4 sm:p-5 rounded-2xl border border-emerald-500/30 shadow-md space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-500 tracking-widest block">
                  🏏 {match.currentInnings === 2 ? '2ND INNINGS' : '1ST INNINGS'}
                </span>
                
                <div className="flex items-baseline justify-center gap-1.5 font-mono">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-500">{match.currentInnings === 2 ? (match.score2 ?? score2Val) : (match.score1 ?? score1Val)}</span>
                  <span className="text-2xl text-slate-400 font-bold">/</span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-500">{match.currentInnings === 2 ? (match.wickets2 ?? 0) : (match.wickets1 ?? 0)}</span>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Overs: <strong className="text-white">{match.currentInnings === 2 ? (match.overs2 || '0.0') : (match.overs1 || '0.0')}</strong> / {match.totalOversMax || 20}
                </div>
              </div>
            ) : isChess ? (
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
            ) : isAthletics ? (
              <div className="text-center bg-white dark:bg-[#090D16] p-5 rounded-2xl border border-blue-500/30 shadow-md space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-blue-400 tracking-widest block">
                  🏃 ATHLETICS MEET — {match.activeSubEvent || '100m Race'} LIVE
                </span>
                <div className="text-sm font-black text-slate-900 dark:text-white py-1">
                  {match.scoreSummary || `Live Sub-Event: ${match.activeSubEvent || '100m Race'}`}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold">LIVE BROADCAST ACTIVE</span>
                </div>
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
              {!isChess && !isCricket && (
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

        {/* CRICKET LIVE SPECTATOR VIEW */}
        {isCricket && (
          <div className="p-6 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#1E293B] space-y-6">
            
            {/* Recent Deliveries Ticker */}
            {(match.recentBalls || []).length > 0 && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] shadow-sm">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase shrink-0">Recent Deliveries:</span>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {match.recentBalls.map((b, idx) => (
                    <span key={idx} className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs border ${
                      b === 'W' ? 'bg-rose-600 text-white border-rose-500 animate-bounce' :
                      b === '4' || b === '6' ? 'bg-emerald-600 text-white border-emerald-500' :
                      b === 'WD' || b === 'NB' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* On-field Active Players: Batsmen & Bowler Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Active Batsmen Card */}
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] p-4 space-y-3 shadow-sm">
                <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                  🏏 On-Field Batsmen
                </h4>
                <div className="space-y-2">
                  {/* Striker */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div>
                      <span className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-1">
                        {match.striker?.name || 'Striker'} <span className="text-amber-500 text-xs">★</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Striker (On Strike)</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{match.striker?.runs || 0}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs"> ({match.striker?.balls || 0}b)</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        4s: {match.striker?.fours || 0} | 6s: {match.striker?.sixes || 0} | SR: {match.striker?.balls > 0 ? (((match.striker?.runs || 0) / match.striker.balls) * 100).toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>

                  {/* Non-Striker */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{match.nonStriker?.name || 'Non-Striker'}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">Non-Striker</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-base font-black text-slate-900 dark:text-white">{match.nonStriker?.runs || 0}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs"> ({match.nonStriker?.balls || 0}b)</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        4s: {match.nonStriker?.fours || 0} | 6s: {match.nonStriker?.sixes || 0} | SR: {match.nonStriker?.balls > 0 ? (((match.nonStriker?.runs || 0) / match.nonStriker.balls) * 100).toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Bowler Card */}
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] p-4 space-y-3 shadow-sm">
                <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                  🎯 Current Active Bowler
                </h4>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white text-sm">{match.bowler?.name || 'Bowler'}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px]">
                      Overs: {match.bowler?.overs || '0.0'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px] pt-1">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Runs</span>
                      <span className="font-bold text-slate-900 dark:text-white">{match.bowler?.runs || 0}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Wkts</span>
                      <span className="font-black text-rose-600 dark:text-rose-400">{match.bowler?.wickets || 0}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Maidens</span>
                      <span className="font-bold text-slate-900 dark:text-white">{match.bowler?.maidens || 0}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Econ</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {(() => {
                          const ov = match.bowler?.overs || '0.0';
                          const parts = String(ov).split('.');
                          const balls = (parseInt(parts[0], 10) || 0) * 6 + (parseInt(parts[1], 10) || 0);
                          return balls > 0 ? (((match.bowler?.runs || 0) / (balls / 6))).toFixed(2) : '0.00';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Play-by-Play Live Commentary */}
            {(match.commentaryLog || []).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  🎙️ Play-by-Play Live Commentary Feed
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {match.commentaryLog.map((c, idx) => (
                    <div key={c.id || idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-3 shadow-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-bold shrink-0">
                        Over {c.over || '0.0'}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed">{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* PLAYER LIVE STATS SECTION (BASKETBALL & FOOTBALL) */}
        {/* KABADDI TEAM POINTS BREAKDOWN (TEAM A & TEAM B WITH HALF 1 & HALF 2 SUMMARY) */}
        {(match.kabaddiStats1 || match.kabaddiStats2 || (match.sportId || match.sportName || '').toLowerCase().includes('kabaddi')) && (
          <div className="p-6 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#1E293B] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1E293B] pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Kabaddi Live Team Points Summary Breakdown
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time Team Raid, Tackle, Bonus, Super Tackle & Super Raid points by Half
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-bold self-start sm:self-auto">
                Half {match.half || 1} Live Score
              </span>
            </div>

            {/* 1st Half Completed Banner */}
            {(match.completedHalf1 || match.half1Score1 !== undefined) && (
              <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-4 text-center space-y-1">
                <span className="text-xs font-mono font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> 1ST HALF FINAL RESULT
                </span>
                <div className="text-base sm:text-lg font-mono font-black text-slate-900 dark:text-white flex items-center justify-center gap-4">
                  <span className="text-blue-600 dark:text-blue-400">{team1Name}: {match.half1Score1 || 0} Pts</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-blue-600 dark:text-blue-400">{team2Name}: {match.half1Score2 || 0} Pts</span>
                </div>
                {match.half === 2 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    Currently in 2nd Half. Scores carrying over continuously from 1st Half ({match.half1Score1 || 0} - {match.half1Score2 || 0}).
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team 1 Card */}
              <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-[#1E293B] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1E293B]">
                  <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {team1Name} (Team A)
                  </span>
                  <span className="text-sm font-mono font-black text-amber-600 dark:text-amber-400">
                    Total: {score1Val} PTS
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono font-bold">
                  <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                    <span className="text-slate-400 block text-[9px]">RAID</span>
                    <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{(match.kabaddiStats1?.raid) || 0}</span>
                  </div>
                  <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    <span className="text-slate-400 block text-[9px]">TACKLE</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">{(match.kabaddiStats1?.tackle) || 0}</span>
                  </div>
                  <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                    <span className="text-slate-400 block text-[9px]">BONUS</span>
                    <span className="text-purple-600 dark:text-purple-400 font-black text-xs">{(match.kabaddiStats1?.bonus) || 0}</span>
                  </div>
                  <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    <span className="text-slate-400 block text-[9px]">S.TACKLE</span>
                    <span className="text-rose-600 dark:text-rose-400 font-black text-xs">{(match.kabaddiStats1?.superTackle) || 0}</span>
                  </div>
                  <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    <span className="text-slate-400 block text-[9px]">S.RAID</span>
                    <span className="text-amber-600 dark:text-amber-400 font-black text-xs">{(match.kabaddiStats1?.superRaid) || 0}</span>
                  </div>
                </div>
              </div>

              {/* Team 2 Card */}
              <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-[#1E293B] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1E293B]">
                  <span className="font-extrabold text-xs text-blue-600 dark:text-indigo-400 uppercase tracking-wider">
                    {team2Name} (Team B)
                  </span>
                  <span className="text-sm font-mono font-black text-blue-600 dark:text-indigo-400">
                    Total: {score2Val} PTS
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono font-bold">
                  <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                    <span className="text-slate-400 block text-[9px]">RAID</span>
                    <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{(match.kabaddiStats2?.raid) || 0}</span>
                  </div>
                  <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    <span className="text-slate-400 block text-[9px]">TACKLE</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">{(match.kabaddiStats2?.tackle) || 0}</span>
                  </div>
                  <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                    <span className="text-slate-400 block text-[9px]">BONUS</span>
                    <span className="text-purple-600 dark:text-purple-400 font-black text-xs">{(match.kabaddiStats2?.bonus) || 0}</span>
                  </div>
                  <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    <span className="text-slate-400 block text-[9px]">S.TACKLE</span>
                    <span className="text-rose-600 dark:text-rose-400 font-black text-xs">{(match.kabaddiStats2?.superTackle) || 0}</span>
                  </div>
                  <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    <span className="text-slate-400 block text-[9px]">S.RAID</span>
                    <span className="text-amber-400 font-black text-xs">{(match.kabaddiStats2?.superRaid) || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PLAYER LIVE STATS SECTION (BASKETBALL & FOOTBALL) */}
        {(isBasketball || isFootball) && (
          <div className="p-6 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#1E293B] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1E293B] pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className={`w-4 h-4 ${isFootball ? 'text-emerald-500' : 'text-amber-500'}`} />
                  {isFootball ? 'Football Live Player Stats (Goals & Cards)' : 'Basketball Live Player Stats (Points & Personal Fouls)'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isFootball ? 'Real-time goals scored and cards received by players' : 'Real-time individual points scored and fouls committed by players on court'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold self-start sm:self-auto border ${
                isFootball
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}>
                {match.quarter || 'Live Match'}
              </span>
            </div>

            {/* Side-by-Side Team Rosters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Team 1 Roster Card */}
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden shadow-sm">
                <div className={`px-4 py-3 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between ${
                  isFootball ? 'bg-emerald-600/10 dark:bg-emerald-600/20' : 'bg-blue-600/10 dark:bg-indigo-600/20'
                }`}>
                  <span className={`font-extrabold text-xs uppercase tracking-wider ${
                    isFootball ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-indigo-300'
                  }`}>
                    {team1Name} Roster
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    Team Score: <strong className={isFootball ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-indigo-400'}>{score1Val} {isFootball ? 'Goals' : 'PTS'}</strong>
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                  {roster1.map((p) => {
                    const isFouledOut = isFootball ? p.redCard : (p.fouls || 0) >= 5;
                    const pGoals = p.goals !== undefined ? p.goals : (p.points || 0);

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
                                  ON PITCH
                                </span>
                              )}
                              {p.yellowCards > 0 && !p.redCard && (
                                <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-mono font-bold">
                                  🟨 {p.yellowCards}
                                </span>
                              )}
                              {isFouledOut && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-mono font-extrabold uppercase flex items-center gap-1">
                                  <ShieldAlert className="w-2.5 h-2.5" /> {isFootball ? 'RED CARD (SENT OFF)' : 'FOULED OUT'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 font-mono">
                          {/* Goals / Points */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">{isFootball ? 'Goals' : 'Points'}</span>
                            <span className={`font-black text-sm ${isFootball ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {isFootball ? `${pGoals} G` : `${p.points || 0} PTS`}
                            </span>
                          </div>

                          {/* Fouls (Only for Basketball) */}
                          {!isFootball && (
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
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team 2 Roster Card */}
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden shadow-sm">
                <div className={`px-4 py-3 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between ${
                  isFootball ? 'bg-teal-600/10 dark:bg-teal-600/20' : 'bg-blue-600/10 dark:bg-indigo-600/20'
                }`}>
                  <span className={`font-extrabold text-xs uppercase tracking-wider ${
                    isFootball ? 'text-teal-700 dark:text-teal-300' : 'text-blue-700 dark:text-indigo-300'
                  }`}>
                    {team2Name} Roster
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    Team Score: <strong className={isFootball ? 'text-teal-600 dark:text-teal-400' : 'text-blue-600 dark:text-indigo-400'}>{score2Val} {isFootball ? 'Goals' : 'PTS'}</strong>
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                  {roster2.map((p) => {
                    const isFouledOut = isFootball ? p.redCard : (p.fouls || 0) >= 5;
                    const pGoals = p.goals !== undefined ? p.goals : (p.points || 0);

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
                                  ON PITCH
                                </span>
                              )}
                              {p.yellowCards > 0 && !p.redCard && (
                                <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-mono font-bold">
                                  🟨 {p.yellowCards}
                                </span>
                              )}
                              {isFouledOut && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-mono font-extrabold uppercase flex items-center gap-1">
                                  <ShieldAlert className="w-2.5 h-2.5" /> {isFootball ? 'RED CARD (SENT OFF)' : 'FOULED OUT'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 font-mono">
                          {/* Goals / Points */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">{isFootball ? 'Goals' : 'Points'}</span>
                            <span className={`font-black text-sm ${isFootball ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {isFootball ? `${pGoals} G` : `${p.points || 0} PTS`}
                            </span>
                          </div>

                          {/* Fouls (Only for Basketball) */}
                          {!isFootball && (
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
                          )}
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

