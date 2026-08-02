import React from 'react';
import { X, Clock, Award, Activity, Tv, VideoOff } from 'lucide-react';
import { getSportConfig } from '../../data/sportsConfig';
import { getYouTubeEmbedUrl } from '../../utils/youtube';

export const LiveMatchViewerModal = ({ match, onClose }) => {
  if (!match) return null;

  const sportConfig = getSportConfig(match.sportId || 'table-tennis');

  const setsHistory = match.setsHistory || [
    { set: 1, score1: 11, score2: 8, winner: 1 },
    { set: 2, score1: 9, score2: 11, winner: 2 },
    { set: 3, score1: 11, score2: 6, winner: 1 },
  ];

  const timelineLogs = match.timelineLogs || [
    { time: '14:02', text: `${match.team1} scored point` },
    { time: '14:10', text: '1-Minute Tactical Timeout called' },
    { time: '14:35', text: 'Serve switched to ' + match.team2 },
    { time: '15:20', text: 'Set 2 finished' },
  ];

  const setsWonA = setsHistory.filter((s) => s.winner === 1).length;
  const setsWonB = setsHistory.filter((s) => s.winner === 2).length;

  const embedUrl = match.youtubeVideoId ? getYouTubeEmbedUrl(match.youtubeVideoId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0F172A] border border-[#1E293B] rounded-3xl shadow-2xl overflow-hidden my-auto space-y-0 text-slate-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#090D16] border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> 🔴 LIVE SPECTATOR HUB
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {match.round || 'Tournament'} • {match.venue || match.tableNumber || sportConfig.venueOptions[0]}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Embedded YouTube Live Video Player (If Stream Attached) */}
        {embedUrl ? (
          <div className="w-full bg-black border-b border-[#1E293B] relative shadow-inner">
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl}
                title={`${match.team1} vs ${match.team2} YouTube Live Stream`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="px-4 py-2 bg-[#090D16]/90 text-xs font-mono text-emerald-400 flex items-center justify-between border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-rose-500" /> YouTube Live Broadcast Active
              </span>
              <span className="text-slate-400 font-sans">1080p HD Official Stream</span>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-[#090D16] text-center border-b border-[#1E293B] space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
              <VideoOff className="w-6 h-6 text-slate-500" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live video is not available</h4>
            <p className="text-[11px] text-slate-400">Showing real-time live score updates from official tournament umpires.</p>
          </div>
        )}

        {/* Large Spectator Scoreboard Section */}
        <div className="p-6 bg-gradient-to-b from-[#0B1120] to-[#0F172A] border-b border-[#1E293B] space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Player / Team A */}
            <div className="text-center md:text-left space-y-2">
              <span className="text-xs font-bold uppercase text-indigo-400 tracking-wider">
                {match.college1 || 'MPEC'}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">{match.team1}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-400">
                <span>Sets Won:</span>
                <span className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-mono font-bold">
                  {setsWonA}
                </span>
              </div>
            </div>

            {/* Middle Live Score & Clock */}
            <div className="text-center bg-[#090D16] p-5 rounded-2xl border border-[#1E293B] shadow-inner space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-widest block">
                {sportConfig.name} Live Points
              </span>
              
              <div className="flex items-center justify-center gap-4 text-5xl font-black font-mono text-white">
                <span className="text-indigo-400">{match.score1}</span>
                <span className="text-slate-600 text-3xl">:</span>
                <span className="text-indigo-400">{match.score2}</span>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3 text-xs font-mono text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{match.liveTimer || '14:32'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Set 3 of 5</span>
              </div>
            </div>

            {/* Player / Team B */}
            <div className="text-center md:text-right space-y-2">
              <span className="text-xs font-bold uppercase text-indigo-400 tracking-wider">
                {match.college2 || 'MIPS'}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">{match.team2}</h2>
              <div className="flex items-center justify-center md:justify-end gap-2 text-xs text-slate-400">
                <span>Sets Won:</span>
                <span className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-mono font-bold">
                  {setsWonB}
                </span>
              </div>
            </div>

          </div>

          {/* Match Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-[#090D16]/60 p-3 rounded-xl border border-[#1E293B] text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Sport</span>
              <span className="font-bold text-white">{sportConfig.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Venue</span>
              <span className="font-bold text-amber-400">{match.venue || match.tableNumber || sportConfig.venueOptions[0]}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Umpire / Referee</span>
              <span className="font-bold text-slate-300">{match.referee || 'Official Ref A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Category Format</span>
              <span className="font-bold text-indigo-400">{match.format || 'Singles'}</span>
            </div>
          </div>

        </div>

        {/* Set History Breakdown & Live Timeline Feed */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0F172A]">
          
          {/* Set History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" /> Set Score Breakdown
            </h4>

            <div className="space-y-2">
              {setsHistory.map((s) => (
                <div
                  key={s.set}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#090D16] border border-[#1E293B] text-xs"
                >
                  <span className="font-bold text-slate-300 font-mono">Set #{s.set}</span>
                  <div className="flex items-center gap-3 font-mono font-bold">
                    <span className={s.winner === 1 ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                      {match.team1}: {s.score1}
                    </span>
                    <span className="text-slate-600">-</span>
                    <span className={s.winner === 2 ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                      {match.team2}: {s.score2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Timeline Commentary Feed */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Real-Time Live Timeline
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {timelineLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#090D16] border border-[#1E293B] text-xs"
                >
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono text-[10px] font-bold">
                    {log.time}
                  </span>
                  <span className="text-slate-300 font-medium">{log.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#090D16] border-t border-[#1E293B] text-center text-xs text-slate-500">
          Spectator Scoreboard • Auto-refreshing real-time updates from SEMS Official Umpires
        </div>

      </div>
    </div>
  );
};
