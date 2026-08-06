import React, { useState, useEffect } from 'react';
import { CheckCircle2, Tv, Video, Eye, Trash2, Save, Square, UserCheck, Activity } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { getSportConfig } from '../../../data/sportsConfig';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '../../../utils/youtube';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';
import { BasketballRosterSetupModal } from '../modal/BasketballRosterSetupModal';
import { BasketballLiveScoreControllerModal } from '../modal/BasketballLiveScoreControllerModal';

export const BasketballLiveMatchControlTab = ({ matches, user, onUpdateMatchScore }) => {
  const { addToast } = useToast();
  const sportConfig = getSportConfig('basketball');
  const assignedSport = 'basketball';

  // Strictly 2 Basketball Courts
  const venueCards = ['Basketball Court 1', 'Basketball Court 2'];

  // Initial state loads active live assignments
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
  const [activeRosterSetupMatch, setActiveRosterSetupMatch] = useState(null); // { match, targetVenue }
  const [streamInputMap, setStreamInputMap] = useState({});
  const [previewVideoId, setPreviewVideoId] = useState(null);

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
            venue: matchItem.tableNumber || 'Basketball Court 1',
          });
        } catch (err) {}
      }
    });
  }, [liveAssignments, assignedSport]);

  // Clicked "GO LIVE" on a scheduled match -> prompt Roster setup if roster not set
  const handleInitiateGoLive = (matchItem, targetVenue) => {
    if (!matchItem.roster1 || matchItem.roster1.length < 5) {
      setActiveRosterSetupMatch({ match: matchItem, targetVenue });
    } else {
      executePromoteGoLive(matchItem, targetVenue, matchItem.roster1, matchItem.roster2);
    }
  };

  const executePromoteGoLive = async (matchItem, targetVenue, r1, r2) => {
    const liveObj = {
      ...matchItem,
      id: matchItem.id || `M-BSK-${Math.floor(100000 + Math.random() * 900000)}`,
      sportId: 'basketball',
      sportName: 'Basketball',
      format: 'Team Match (5v5)',
      quarter: matchItem.quarter || 'Quarter 1',
      score1: matchItem.score1 || 0,
      score2: matchItem.score2 || 0,
      roster1: r1,
      roster2: r2,
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
    setActiveRosterSetupMatch(null);
    addToast(`🏀 Basketball Match "${matchItem.team1} vs ${matchItem.team2}" is LIVE on ${targetVenue}!`, 'success');
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

    const s1 = active.score1 || 0;
    const s2 = active.score2 || 0;
    const winnerName = active.winner || (s1 >= s2 ? active.team1 : active.team2);

    const completedObj = {
      ...active,
      winner: winnerName,
      score1: s1,
      score2: s2,
      status: 'COMPLETED',
      tableNumber: null,
      isLiveStreaming: false,
      completedAt: new Date().toISOString(),
    };

    await coordinatorApi.completeMatch(active.id, completedObj);

    onUpdateMatchScore(active.id, { status: 'COMPLETED', score1: s1, score2: s2 });
    setLiveAssignments((prev) => {
      const copy = { ...prev };
      delete copy[venue];
      return copy;
    });

    generateMatchResultPDF(completedObj, 'Basketball');
    addToast(`Match on ${venue} completed! Result PDF downloaded.`, 'success');
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
    <div className="space-y-8 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">

      {/* 2 BASKETBALL COURTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {venueCards.map((venueName) => {
          const activeLive = liveAssignments[venueName];

          return (
            <div
              key={venueName}
              className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-2xl flex flex-col justify-between min-h-[360px] transition-colors"
            >
              {!activeLive ? (

                /* Empty State Card */
                <div className="my-auto text-center space-y-3 py-6">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center mx-auto text-2xl shadow-inner">
                    🏀
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {venueName}: No Live Match
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Select a match from the schedule below and click "GO LIVE" to configure squad roster and control live match scores.
                  </p>
                </div>

              ) : (

                /* Active Live Match Card */
                <div className="space-y-4">

                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 font-mono">
                      BASKETBALL LIVE CENTER
                    </span>

                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-mono font-black tracking-wider animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> 🔴 LIVE ({venueName.toUpperCase()})
                    </span>
                  </div>

                  {/* Teams & Score Display */}
                  <div className="text-center space-y-1">
                    <div className="text-xs font-mono font-bold text-orange-500 uppercase">
                      {activeLive.quarter || 'Quarter 1'} · Points Continue
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {activeLive.team1} <span className="text-orange-500 font-mono font-black">{activeLive.score1 || 0}</span>
                      <span className="text-slate-400 font-normal text-sm px-2">VS</span>
                      <span className="text-blue-500 font-mono font-black">{activeLive.score2 || 0}</span> {activeLive.team2}
                    </h2>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      #{activeLive.id} · {activeLive.eventTitle || 'Basketball Tournament'}
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
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 font-mono"
                      />

                      <button
                        onClick={() => handleSaveStreamUrl(venueName)}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        {activeLive.youtubeVideoId && (
                          <button
                            onClick={() => setPreviewVideoId(activeLive.youtubeVideoId)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-orange-400" /> Preview
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
                    className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-xl shadow-orange-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🎮 Open Basketball Score & Sub Controller</span>
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
        const upcomingMatchesToPromote = matches.filter(
          (m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && m.status !== 'running'
        );

        return (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Promote Scheduled Match to Live
              </h3>
              <span className="text-xs font-mono text-slate-400">Target Courts: Court 1 or Court 2</span>
            </div>

            {upcomingMatchesToPromote.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium shadow-soft dark:shadow-md">
                No upcoming scheduled basketball matches available to promote. All completed matches have been moved to Results.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMatchesToPromote.map((m) => {
                  const targetCourt = m.tableNumber && m.tableNumber.includes('Court')
                    ? m.tableNumber
                    : 'Basketball Court 1';

                  return (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-xl flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 uppercase">
                          TEAM MATCH (5v5)
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {m.team1} vs {m.team2}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          📍 {targetCourt} | Time: {m.time || '04:00 PM'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleInitiateGoLive(m, targetCourt)}
                        className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <span>📡 SETUP & GO LIVE</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Roster Setup Modal before Go Live */}
      {activeRosterSetupMatch && (
        <BasketballRosterSetupModal
          match={activeRosterSetupMatch.match}
          targetVenue={activeRosterSetupMatch.targetVenue}
          onClose={() => setActiveRosterSetupMatch(null)}
          onRosterSaved={({ roster1, roster2 }) => {
            executePromoteGoLive(
              activeRosterSetupMatch.match,
              activeRosterSetupMatch.targetVenue,
              roster1,
              roster2
            );
          }}
        />
      )}

      {/* Score & Sub Controller Modal */}
      {activeControllerVenue && (
        <BasketballLiveScoreControllerModal
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
              onUpdateMatchScore(id, payload);
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
