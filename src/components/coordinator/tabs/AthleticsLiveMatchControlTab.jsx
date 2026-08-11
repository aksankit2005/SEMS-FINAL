import React, { useState, useEffect } from 'react';
import { Radio, Video, Save, CheckCircle2, Award, ExternalLink, Sparkles, Trophy } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '../../../utils/youtube';
import { OFFICIAL_ATHLETICS_EVENTS } from '../../registration/AthleticsRegistration';

export const AthleticsLiveMatchControlTab = ({ user }) => {
  const { addToast } = useToast();
  const [streamUrl, setStreamUrl] = useState('');
  const [activeMeetStatus, setActiveMeetStatus] = useState('In Progress');
  const [activeSubEvent, setActiveSubEvent] = useState('100m Race');
  const [liveNotes, setLiveNotes] = useState('Leader: Heat 1 Final Sprint in Progress');

  useEffect(() => {
    const cached = localStorage.getItem('sems_athletics_live_stream');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) {
          setStreamUrl(parsed.streamUrl || '');
          setActiveMeetStatus(parsed.status || 'In Progress');
          setActiveSubEvent(parsed.activeSubEvent || '100m Race');
          setLiveNotes(parsed.scoreSummary || parsed.liveNotes || 'Heat 1 Final Sprint in Progress');
        }
      } catch (e) {}
    }
  }, []);

  const handleSaveLiveStream = async () => {
    const videoId = extractYouTubeVideoId(streamUrl);
    if (streamUrl && !videoId) {
      addToast('Invalid YouTube URL format', 'error');
      return;
    }

    const payload = {
      id: 'M-ATHLETICS-LIVE',
      sportId: 'athletics',
      sportName: 'Athletics',
      matchTitle: `Athletics Meet — ${activeSubEvent} Live`,
      team1: 'Athletes Track A',
      team2: 'Athletes Track B',
      tableNumber: 'Main Stadium Track',
      venue: 'Main Track & Field Ground',
      status: activeMeetStatus === 'In Progress' ? 'running' : activeMeetStatus.toLowerCase(),
      activeSubEvent,
      scoreSummary: liveNotes || `Live Sub-Event: ${activeSubEvent}`,
      youtubeVideoId: videoId,
      streamUrl,
      isLiveStreaming: true,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('sems_athletics_live_stream', JSON.stringify(payload));

    // Update global active live matches map for spectator live board
    const globalSaved = localStorage.getItem('sems_active_live_matches');
    let activeMap = {};
    if (globalSaved) {
      try { activeMap = JSON.parse(globalSaved); } catch (e) {}
    }

    if (activeMeetStatus === 'In Progress') {
      activeMap['M-ATHLETICS-LIVE'] = payload;
    } else {
      delete activeMap['M-ATHLETICS-LIVE'];
    }

    localStorage.setItem('sems_active_live_matches', JSON.stringify(activeMap));

    try {
      await coordinatorApi.updateMatchScoring(payload.id, payload);
    } catch (err) {}

    window.dispatchEvent(new Event('sems_matches_updated'));
    window.dispatchEvent(new Event('storage'));

    addToast(`🏆 Athletics Live Stream & ${activeSubEvent} Settings Saved!`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-mono font-bold uppercase tracking-wider animate-pulse">
              LIVE TRACK & FIELD BROADCAST CONSOLE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Athletics Live Match Control & Stream
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Broadcast live Athletics sub-events on the public spectator scoreboard, update active sub-event notes, and manage live stream settings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveLiveStream}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition duration-200 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" /> Save & Go Live
        </button>
      </div>

      {/* STREAM CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Sub-event & Video Stream */}
        <div className="bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-500" /> YouTube Live Broadcast Stream
          </h3>

          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              YouTube Broadcast URL / Link:
            </label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=live_stream_id"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Select Currently Live Athletics Sub-Event:
            </label>
            <select
              value={activeSubEvent}
              onChange={(e) => setActiveSubEvent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              {OFFICIAL_ATHLETICS_EVENTS.map((se) => (
                <option key={se} value={se}>{se}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Live Scoreboard Ticker Notes / Lead Summary:
            </label>
            <input
              type="text"
              value={liveNotes}
              onChange={(e) => setLiveNotes(e.target.value)}
              placeholder="e.g. Heat 1 Final Sprint in Progress | Lane 4 Lead"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Execution Status & Preview */}
        <div className="bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500" /> Broadcast Status
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {['Scheduled', 'In Progress', 'Results Published'].map((st) => {
                const isSel = activeMeetStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setActiveMeetStatus(st)}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      isSel
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block font-mono">
                Spectator Live Board Card Preview:
              </span>
              <div className="p-3 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-black text-slate-900 dark:text-white text-xs">
                    Athletics Meet — {activeSubEvent}
                  </span>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    {liveNotes || 'Live Broadcast Active'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500 text-white animate-pulse">
                  🔴 LIVE
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveLiveStream}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" /> Save Live Settings & Push to Public Board
          </button>
        </div>

      </div>

    </div>
  );
};
