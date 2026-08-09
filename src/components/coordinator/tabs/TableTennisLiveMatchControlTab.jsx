import React, { useState, useEffect } from 'react';
import { CheckCircle2, Tv, Video, Eye, Trash2, Save, Square, Radio, Activity, Play, Sliders } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '../../../utils/youtube';
import { LiveMatchScoreControllerModal } from '../modal/LiveMatchScoreControllerModal';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';

export const TableTennisLiveMatchControlTab = ({ matches, user, onUpdateMatchScore, globalSearch }) => {
  const { addToast } = useToast();

  const assignedSport = 'table-tennis';
  const sportName = 'Table Tennis';
  const venueCards = ['Table 1', 'Table 2', 'Table 3', 'Table 4'];

  // Filter TT matches from props
  const ttMatches = (matches || []).filter(
    (m) => (m.sportId || m.sportName || '').toLowerCase().includes('table-tennis') || (m.matchTitle || m.title || '').toLowerCase().includes('table tennis')
  );

  // Active live match assignments stored in localStorage & server
  const [liveAssignments, setLiveAssignments] = useState(() => {
    const cacheKey = `sems_active_live_matches_${assignedSport}`;
    const saved = localStorage.getItem(cacheKey) || localStorage.getItem('sems_active_live_matches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleaned = {};
          Object.keys(parsed).forEach((k) => {
            if (parsed[k] && parsed[k].id !== 'M595473') {
              cleaned[k] = parsed[k];
            }
          });
          return cleaned;
        }
      } catch (e) {}
    }
    return {};
  });

  const [activeControllerVenue, setActiveControllerVenue] = useState(null);
  const [streamInputMap, setStreamInputMap] = useState({});
  const [previewVideoId, setPreviewVideoId] = useState(null);

  // Sync live assignments to localStorage & server
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

    Object.values(liveAssignments).forEach(async (match) => {
      if (match && match.id && match.status === 'running') {
        try {
          await coordinatorApi.updateMatchScoring(match.id, {
            ...match,
            status: 'running',
            venue: match.tableNumber || 'Table 1',
          });
        } catch (err) {
          console.warn('Syncing live assignment error:', err);
        }
      }
    });
  }, [liveAssignments]);

  const handlePromoteGoLive = async (match, targetVenue) => {
    const liveObj = {
      ...match,
      id: match.id || `M-TT-${Math.floor(100000 + Math.random() * 900000)}`,
      sportId: 'table-tennis',
      sportName: 'Table Tennis',
      format: match.format || 'Best of 5 Sets',
      score1: match.score1 || 0,
      score2: match.score2 || 0,
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
    addToast(`🏓 Table Tennis Match "${match.matchTitle || match.team1 + ' vs ' + match.team2}" is LIVE on ${targetVenue}!`, 'success');
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

    addToast(
      `YouTube Live Stream ${start ? 'STARTED 📡' : 'STOPPED ⏹'} on ${venue}`,
      start ? 'success' : 'warning'
    );
  };

  const handleRemoveStream = async (venue) => {
    const active = liveAssignments[venue];
    if (!active) return;

    const updated = {
      ...active,
      liveStreamUrl: '',
      youtubeVideoId: '',
      isLiveStreaming: false,
    };

    setLiveAssignments((prev) => ({ ...prev, [venue]: updated }));
    setStreamInputMap((prev) => ({ ...prev, [venue]: '' }));

    await coordinatorApi.updateMatchScoring(active.id, {
      liveStreamUrl: '',
      youtubeVideoId: '',
      isLiveStreaming: false,
    });

    addToast(`YouTube Live stream removed from ${venue}`, 'info');
  };

  const handleCompleteMatch = async (venue) => {
    const active = liveAssignments[venue];
    if (!active) return;

    const winnerName = active.winner || (active.score1 >= active.score2 ? active.team1 : active.team2);
    const completedObj = {
      ...active,
      winner: winnerName,
      score1: active.score1,
      score2: active.score2,
      status: 'COMPLETED',
      tableNumber: null,
      isLiveStreaming: false,
      completedAt: new Date().toISOString(),
    };

    await coordinatorApi.completeMatch(active.id, completedObj);

    const resultsKey = `sems_completed_results_${assignedSport}`;
    const existingStr = localStorage.getItem(resultsKey);
    let existingList = [];
    if (existingStr) {
      try { existingList = JSON.parse(existingStr); } catch (e) {}
    }
    existingList = [completedObj, ...existingList.filter((item) => item.id !== completedObj.id)];
    localStorage.setItem(resultsKey, JSON.stringify(existingList));
    window.dispatchEvent(new Event('sems_results_updated'));

    if (onUpdateMatchScore) onUpdateMatchScore(active.id, { status: 'COMPLETED', score1: active.score1, score2: active.score2 });
    setLiveAssignments((prev) => {
      const copy = { ...prev };
      delete copy[venue];
      return copy;
    });

    generateMatchResultPDF(completedObj, 'Table Tennis');

    addToast(`Table Tennis Match on ${venue} completed! Saved to Results section.`, 'success');
  };

  const handleDemoteMatch = async (venue) => {
    const active = liveAssignments[venue];
    if (active) {
      await coordinatorApi.updateMatchScoring(active.id, {
        status: 'DEMOTED',
        venue: null,
        isLiveStreaming: false,
      });
    }
    setLiveAssignments((prev) => {
      const copy = { ...prev };
      delete copy[venue];
      return copy;
    });
    addToast(`Match on ${venue} demoted from live stream`, 'info');
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white animate-fade-in font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-cyan-500/30 shadow-soft dark:shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold uppercase">
              🏓 LIVE MULTI-TABLE CONTROL CONSOLE
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• Table Tennis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Table Tennis Live Match Score Controllers
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Control live scores point-by-point, manage sets, attach YouTube Live streams, and broadcast TT matches in real time across Table 1 to 4.
          </p>
        </div>
      </div>

      {/* MULTI TABLE GRID (Table 1 to 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {venueCards.map((venueName) => {
          const activeLive = liveAssignments[venueName];

          return (
            <div
              key={venueName}
              className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/30 shadow-soft dark:shadow-2xl flex flex-col justify-between min-h-[340px] transition-colors"
            >
              {!activeLive ? (
                /* Empty State Card */
                <div className="my-auto text-center space-y-3 py-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
                    🏓
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {venueName}: No Live Match
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Select a match from the schedule below and click "Go Live" to stream score updates on {venueName}.
                  </p>
                </div>
              ) : (
                /* Active Live Match & Stream Control Card */
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                      LIVE MATCH CENTER
                    </span>

                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-mono font-black tracking-wider animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> 🔴 LIVE ({venueName.toUpperCase()})
                    </span>
                  </div>

                  {/* Teams */}
                  <div className="text-center space-y-0.5">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {activeLive.team1 ? activeLive.team1.replace(/\s*\(.*?\)/, '') : ''} <span className="text-slate-400 text-sm font-normal">vs</span> {activeLive.team2 ? activeLive.team2.replace(/\s*\(.*?\)/, '') : ''}
                    </h2>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      #{activeLive.id} · {activeLive.format || 'singles'} · {venueName}
                    </p>
                  </div>

                  {/* YouTube Live Stream Control Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5 text-rose-500" /> YouTube Live Stream
                      </span>
                      {activeLive.youtubeVideoId && (
                        <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          ID: {activeLive.youtubeVideoId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={streamInputMap[venueName] !== undefined ? streamInputMap[venueName] : (activeLive.liveStreamUrl || '')}
                        onChange={(e) => setStreamInputMap({ ...streamInputMap, [venueName]: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                      />

                      <button
                        onClick={() => handleSaveStreamUrl(venueName)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>

                    {/* Stream Status Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        {activeLive.youtubeVideoId && (
                          <button
                            onClick={() => setPreviewVideoId(activeLive.youtubeVideoId)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-cyan-400" /> Preview
                          </button>
                        )}

                        {activeLive.liveStreamUrl && (
                          <button
                            onClick={() => handleRemoveStream(venueName)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Remove Stream"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {activeLive.isLiveStreaming ? (
                          <button
                            onClick={() => handleToggleStreamLive(venueName, false)}
                            className="px-3 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white font-bold text-[11px] border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Square className="w-3 h-3" /> Stop Live Stream
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStreamLive(venueName, true)}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1 cursor-pointer"
                          >
                            <Video className="w-3 h-3" /> Start Live Stream
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Open Match Score Controller Button */}
                  <button
                    onClick={() => setActiveControllerVenue(venueName)}
                    className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-xl shadow-cyan-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🎮 Open Match Score Controller</span>
                  </button>

                  {/* Action Buttons Below (Complete & Demote) */}
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      onClick={() => handleCompleteMatch(venueName)}
                      className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>

                    <button
                      onClick={() => handleDemoteMatch(venueName)}
                      className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
                    >
                      Demote
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Promote Match to Live Section */}
      {(() => {
        const upcomingMatchesToPromote = ttMatches.filter(
          (m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && m.status !== 'running'
        );

        return (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Promote Table Tennis Match to Live
            </h3>

            {upcomingMatchesToPromote.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-cyan-500/20 text-slate-500 dark:text-slate-400 text-xs font-medium shadow-soft dark:shadow-md">
                No upcoming scheduled Table Tennis matches available to promote. All completed matches have been moved to Results.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMatchesToPromote.map((m) => {
                  const displayVenue = m.tableNumber || m.venue || 'Table 1';

                  return (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/20 shadow-soft dark:shadow-xl flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 uppercase">
                          {m.format || 'SINGLES'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {(m.team1 || '').replace(/\s*\(.*?\)/, '')} vs {(m.team2 || '').replace(/\s*\(.*?\)/, '')}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          📍 {displayVenue} | Slot: {m.time || '10:00 AM'}
                        </p>
                      </div>

                      <button
                        onClick={() => handlePromoteGoLive(m, displayVenue)}
                        className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <span>📡 GO LIVE</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Stream Preview Modal */}
      {previewVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-rose-500" /> YouTube Live Stream Preview
              </h4>
              <button onClick={() => setPreviewVideoId(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <Eye className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-inner">
              <iframe
                src={getYouTubeEmbedUrl(previewVideoId)}
                title="YouTube Live Stream Preview"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Match Score Controller Modal */}
      {activeControllerVenue && (
        <LiveMatchScoreControllerModal
          match={liveAssignments[activeControllerVenue]}
          venueName={activeControllerVenue}
          onClose={() => setActiveControllerVenue(null)}
          onMatchUpdated={(id, payload) => {
            if (payload?.status === 'COMPLETED' || payload?.status === 'FINISHED') {
              setLiveAssignments((prev) => {
                const copy = { ...prev };
                delete copy[activeControllerVenue];
                return copy;
              });
              const savedActiveStr = localStorage.getItem('sems_active_live_matches');
              if (savedActiveStr) {
                try {
                  const activeMap = JSON.parse(savedActiveStr);
                  delete activeMap[activeControllerVenue];
                  localStorage.setItem('sems_active_live_matches', JSON.stringify(activeMap));
                } catch (e) {}
              }
              if (onUpdateMatchScore) onUpdateMatchScore(id, payload);
            } else {
              setLiveAssignments((prev) => ({
                ...prev,
                [activeControllerVenue]: { ...prev[activeControllerVenue], ...payload }
              }));
            }
          }}
        />
      )}

    </div>
  );
};
