import React, { useState, useEffect } from 'react';
import { Radio, Video, Save, CheckCircle2, Award, ExternalLink } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '../../../utils/youtube';
import { OFFICIAL_ATHLETICS_EVENTS } from '../../registration/AthleticsRegistration';

export const AthleticsLiveMatchControlTab = ({ user }) => {
  const { addToast } = useToast();
  const [streamUrl, setStreamUrl] = useState('');
  const [activeMeetStatus, setActiveMeetStatus] = useState('Scheduled');
  const [activeSubEvent, setActiveSubEvent] = useState('100m Race');

  useEffect(() => {
    const cached = localStorage.getItem('sems_athletics_live_stream');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) {
          setStreamUrl(parsed.streamUrl || '');
          setActiveMeetStatus(parsed.status || 'Scheduled');
          setActiveSubEvent(parsed.activeSubEvent || '100m Race');
        }
      } catch (e) {}
    }
  }, []);

  const handleSaveLiveStream = () => {
    const videoId = extractYouTubeVideoId(streamUrl);
    if (streamUrl && !videoId) {
      addToast('Invalid YouTube URL', 'error');
      return;
    }

    const payload = {
      streamUrl,
      youtubeVideoId: videoId,
      status: activeMeetStatus,
      activeSubEvent,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('sems_athletics_live_stream', JSON.stringify(payload));
    addToast('🏆 Athletics Live Stream & Meet Control Saved!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-[#0B1120] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
            LIVE TRACK & FIELD CONTROL CONSOLE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Athletics Live Stream & Status
          </h2>
        </div>

        <button
          type="button"
          onClick={handleSaveLiveStream}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Live Settings
        </button>
      </div>

      {/* STREAM CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#0B1120] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-500" /> YouTube Live Broadcast URL
          </h3>

          <input
            type="text"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="e.g. https://www.youtube.com/watch?v=live_stream_id"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
          />

          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Currently Live Sub-Event:
            </label>
            <select
              value={activeSubEvent}
              onChange={(e) => setActiveSubEvent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:border-blue-500 focus:outline-none"
            >
              {OFFICIAL_ATHLETICS_EVENTS.map((se) => (
                <option key={se} value={se}>{se}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500" /> Meet Execution Status
          </h3>

          <div className="grid grid-cols-3 gap-2">
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
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
