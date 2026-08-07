import React, { useState, useEffect } from 'react';
import { CheckCircle2, Tv, Video, Eye, Trash2, Save, Square, UserCheck, Activity, Play, Pause, Trophy, Plus } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { getSportConfig } from '../../../data/sportsConfig';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '../../../utils/youtube';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';
import { CricketGoLiveSetupModal } from '../modal/CricketGoLiveSetupModal';
import { CricketLiveScoreControllerModal } from '../modal/CricketLiveScoreControllerModal';

export const CricketLiveMatchControlTab = ({ matches, user, onUpdateMatchScore }) => {
  const { addToast } = useToast();
  const assignedSport = 'cricket';

  // Strictly 1 Cricket Ground
  const venueCards = ['Cricket Ground 1'];

  // Active live assignments cached in localstorage & synced to backend API
  const [liveAssignments, setLiveAssignments] = useState(() => {
    const cacheKey = `sems_active_live_matches_${assignedSport}`;
    const saved = localStorage.getItem(cacheKey) || localStorage.getItem('sems_active_live_matches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {}
    }
    return {};
  });

  const [activeControllerVenue, setActiveControllerVenue] = useState(null);
  const [activeGoLiveSetupMatch, setActiveGoLiveSetupMatch] = useState(null); // { match, targetVenue }
  const [streamInputMap, setStreamInputMap] = useState({});

  useEffect(() => {
    const cacheKey = `sems_active_live_matches_${assignedSport}`;
    localStorage.setItem(cacheKey, JSON.stringify(liveAssignments));

    const globalSaved = localStorage.getItem('sems_active_live_matches');
    let globalActiveMap = {};
    if (globalSaved) {
      try { globalActiveMap = JSON.parse(globalSaved); } catch (e) {}
    }

    const mergedMap = { ...globalActiveMap, ...liveAssignments };
    localStorage.setItem('sems_active_live_matches', JSON.stringify(mergedMap));

    Object.values(liveAssignments).forEach(async (matchItem) => {
      if (matchItem && matchItem.id && matchItem.status === 'running') {
        try {
          await coordinatorApi.updateMatchScoring(matchItem.id, {
            ...matchItem,
            status: 'running',
            venue: matchItem.tableNumber || 'Cricket Ground 1',
          });
        } catch (err) {}
      }
    });
  }, [liveAssignments, assignedSport]);

  // Clicked "Go Live" on a scheduled match -> Open Go Live Multi-Step Setup Modal
  const handleInitiateGoLive = (matchItem, targetVenue) => {
    setActiveGoLiveSetupMatch({ match: matchItem, targetVenue });
  };

  // Callback from Go Live Setup Wizard -> Start Live Match & open controller
  const handleCompleteGoLiveSetup = async (setupPayload) => {
    const targetVenue = activeGoLiveSetupMatch?.targetVenue || 'Cricket Ground 1';
    const sourceMatch = activeGoLiveSetupMatch?.match || {};

    const liveObj = {
      ...sourceMatch,
      id: sourceMatch.id || `M-CRK-${Math.floor(100000 + Math.random() * 900000)}`,
      sportId: 'cricket',
      sportName: 'Cricket',
      team1: setupPayload.teamA.name,
      team2: setupPayload.teamB.name,
      setupData: setupPayload,
      score1: 0,
      score2: 0,
      wickets1: 0,
      wickets2: 0,
      overs1: '0.0',
      overs2: '0.0',
      status: 'running',
      tableNumber: targetVenue,
      isLiveStreaming: true,
      streamStartedAt: new Date().toISOString(),
    };

    await coordinatorApi.updateMatchScoring(liveObj.id, {
      ...liveObj,
      status: 'running',
      venue: targetVenue,
      isLiveStreaming: true,
      streamStartedAt: new Date().toISOString(),
    });

    setLiveAssignments((prev) => ({ ...prev, [targetVenue]: liveObj }));
    setActiveGoLiveSetupMatch(null);
    setActiveControllerVenue(targetVenue);
    addToast(`🏏 Cricket Match "${liveObj.team1} vs ${liveObj.team2}" is LIVE on ${targetVenue}!`, 'success');
  };

  const handleSaveStreamUrl = async (venue) => {
    const active = liveAssignments[venue];
    if (!active) return;

    const rawUrl = streamInputMap[venue] !== undefined ? streamInputMap[venue] : (active.liveStreamUrl || '');
    const videoId = extractYouTubeVideoId(rawUrl);

    if (rawUrl && !videoId) {
      addToast('Invalid YouTube Live URL. Please enter a valid watch or shortlink URL', 'error');
      return;
    }

    const updated = {
      ...active,
      liveStreamUrl: rawUrl,
      youtubeVideoId: videoId,
      liveStreamPlatform: 'YouTube',
    };

    setLiveAssignments((prev) => ({ ...prev, [venue]: updated }));

    await coordinatorApi.updateMatchScoring(active.id, {
      liveStreamUrl: rawUrl,
      youtubeVideoId: videoId,
      liveStreamPlatform: 'YouTube',
    });

    addToast(`YouTube Live stream attached to ${venue} (Video ID: ${videoId || 'None'})`, 'success');
  };

  const handleToggleStreamLive = async (venue, start) => {
    const active = liveAssignments[venue];
    if (!active) return;

    const timestamp = new Date().toISOString();
    const updated = {
      ...active,
      isLiveStreaming: start,
      streamStartedAt: start ? timestamp : active.streamStartedAt,
      streamEndedAt: !start ? timestamp : null,
    };

    setLiveAssignments((prev) => ({ ...prev, [venue]: updated }));

    await coordinatorApi.updateMatchScoring(active.id, {
      isLiveStreaming: start,
      streamStartedAt: start ? timestamp : active.streamStartedAt,
      streamEndedAt: !start ? timestamp : null,
    });

    addToast(start ? `Live stream broadcasting started on ${venue}` : `Live stream paused on ${venue}`, 'info');
  };

  const handleStopLiveAssignment = async (venue) => {
    const active = liveAssignments[venue];
    if (!active) return;

    if (window.confirm(`Stop live session for "${active.team1} vs ${active.team2}" on ${venue}?`)) {
      try {
        await coordinatorApi.updateMatchScoring(active.id, {
          ...active,
          status: 'SCHEDULED',
          isLiveStreaming: false,
        });

        setLiveAssignments((prev) => {
          const updated = { ...prev };
          delete updated[venue];
          return updated;
        });

        addToast(`Live session stopped for ${venue}. Match returned to schedule.`, 'info');
      } catch (err) {
        addToast('Failed to stop live match', 'error');
      }
    }
  };

  // Scheduled matches eligible for Go Live
  const scheduledMatches = (matches || []).filter(
    (m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED'
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* SECTION HEADER BAR */}
      <div className="bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-rose-500 animate-pulse" /> CRICKET LIVE CONTROL
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• Single Ground Console</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Cricket Live Match Scoring & Broadcast System
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Real-time ball-by-ball scoring, CricHeroes-style live scorebars, Cric-Commentary, and single live ground management.
          </p>
        </div>
      </div>

      {/* SINGLE LIVE GROUND CARD DISPLAY */}
      <div className="grid grid-cols-1 gap-6">
        {venueCards.map((venueName) => {
          const activeMatch = liveAssignments[venueName];

          return (
            <div
              key={venueName}
              className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-soft dark:shadow-xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black">
                    🏏
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">Dedicated Live Ground</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{venueName}</h3>
                  </div>
                </div>

                {activeMatch ? (
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-500" /> MATCH IN PROGRESS
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold font-mono">
                    Ground Ready (Idle)
                  </span>
                )}
              </div>

              {activeMatch ? (
                /* ACTIVE LIVE MATCH CONTAINER */
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase">
                          {activeMatch.eventTitle || 'T20 Championship'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">#{activeMatch.id}</span>
                      </div>

                      <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="text-emerald-600 dark:text-emerald-400">{activeMatch.team1}</span>
                        <span className="text-slate-400 text-xs font-normal">VS</span>
                        <span className="text-green-600 dark:text-green-400">{activeMatch.team2}</span>
                      </h4>

                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                        Score: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{activeMatch.score1 || 0}/{activeMatch.wickets1 || 0}</strong> ({activeMatch.overs1 || '0.0'} Overs)
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setActiveControllerVenue(venueName)}
                        className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
                      >
                        <Tv className="w-4 h-4" />
                        <span>Open Live Scorer Console</span>
                      </button>

                      <button
                        onClick={() => handleStopLiveAssignment(venueName)}
                        className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 transition cursor-pointer"
                        title="Stop Match"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* YouTube Live Broadcast Attach */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-rose-500" /> YouTube Live Broadcast Stream URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={streamInputMap[venueName] !== undefined ? streamInputMap[venueName] : (activeMatch.liveStreamUrl || '')}
                        onChange={(e) => setStreamInputMap({ ...streamInputMap, [venueName]: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                        className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveStreamUrl(venueName)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Save Stream
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* IDLE GROUND - SELECT SCHEDULED MATCH TO GO LIVE */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Ground is currently available. Select a scheduled Cricket fixture below to initiate the 4-Step "Go Live" wizard.
                  </div>

                  {scheduledMatches.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                      No scheduled cricket matches available to go live. Add a match fixture in the Match Schedule tab first.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Available Scheduled Matches:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {scheduledMatches.map((m) => (
                          <div
                            key={m.id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition"
                          >
                            <div>
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">#{m.id}</span>
                              <h5 className="text-xs font-black text-slate-900 dark:text-white">{m.team1} vs {m.team2}</h5>
                              <p className="text-[10px] text-slate-500 font-mono">{m.eventTitle || 'T20 Match'} | {m.time || '09:00 AM'}</p>
                            </div>

                            <button
                              onClick={() => handleInitiateGoLive(m, venueName)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Play className="w-3.5 h-3.5" /> Go Live
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* GO LIVE MULTI-STEP SETUP WIZARD MODAL */}
      {activeGoLiveSetupMatch && (
        <CricketGoLiveSetupModal
          match={activeGoLiveSetupMatch.match}
          targetVenue={activeGoLiveSetupMatch.targetVenue}
          onClose={() => setActiveGoLiveSetupMatch(null)}
          onStartMatch={handleCompleteGoLiveSetup}
        />
      )}

      {/* LIVE SCORE CONTROLLER MODAL */}
      {activeControllerVenue && liveAssignments[activeControllerVenue] && (
        <CricketLiveScoreControllerModal
          match={liveAssignments[activeControllerVenue]}
          venueName={activeControllerVenue}
          onClose={() => setActiveControllerVenue(null)}
          onMatchUpdated={(matchId, updatedData) => {
            if (updatedData.status === 'COMPLETED' || updatedData.status === 'FINISHED') {
              setLiveAssignments((prev) => {
                const next = { ...prev };
                delete next[activeControllerVenue];
                return next;
              });
            } else {
              setLiveAssignments((prev) => ({
                ...prev,
                [activeControllerVenue]: { ...prev[activeControllerVenue], ...updatedData },
              }));
            }
          }}
        />
      )}

    </div>
  );
};
