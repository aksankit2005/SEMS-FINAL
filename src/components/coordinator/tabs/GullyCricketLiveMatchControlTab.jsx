import React, { useState, useEffect } from 'react';
import { CheckCircle2, Tv, Video, Eye, Trash2, Save, Square, UserCheck, Activity, Play, Pause, Trophy, Plus } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '../../../utils/youtube';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';
import { CricketGoLiveSetupModal } from '../modal/CricketGoLiveSetupModal';
import { CricketLiveScoreControllerModal } from '../modal/CricketLiveScoreControllerModal';

export const GullyCricketLiveMatchControlTab = ({ matches, user, onUpdateMatchScore }) => {
  const { addToast } = useToast();
  const assignedSport = 'gully-cricket';

  // Strictly Street Pitch Grounds
  const venueCards = ['Street Pitch Ground 1', 'Street Pitch Ground 2'];

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
  const [activeGoLiveSetupMatch, setActiveGoLiveSetupMatch] = useState(null);
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
            venue: matchItem.tableNumber || 'Street Pitch Ground 1',
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
    const targetVenue = activeGoLiveSetupMatch?.targetVenue || 'Street Pitch Ground 1';
    const sourceMatch = activeGoLiveSetupMatch?.match || {};

    const liveObj = {
      ...sourceMatch,
      id: sourceMatch.id || `M-GUL-${Math.floor(100000 + Math.random() * 900000)}`,
      sportId: 'gully-cricket',
      sportName: 'Gully Cricket',
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
    addToast(`🏏 Gully Cricket Match "${liveObj.team1} vs ${liveObj.team2}" is now LIVE on ${targetVenue}!`, 'success');
  };

  // Score controller updated callback
  const handleMatchUpdatedFromController = (updatedMatch) => {
    const venueKey = updatedMatch.tableNumber || 'Street Pitch Ground 1';
    if (updatedMatch.status === 'COMPLETED' || updatedMatch.status === 'FINISHED') {
      setLiveAssignments((prev) => {
        const next = { ...prev };
        delete next[venueKey];
        return next;
      });
      setActiveControllerVenue(null);
      if (onUpdateMatchScore) {
        onUpdateMatchScore(updatedMatch.id, updatedMatch);
      }
    } else {
      setLiveAssignments((prev) => ({
        ...prev,
        [venueKey]: updatedMatch,
      }));
      if (onUpdateMatchScore) {
        onUpdateMatchScore(updatedMatch.id, updatedMatch);
      }
    }
  };

  const handleSaveStream = async (venueKey) => {
    const current = liveAssignments[venueKey];
    if (!current) return;
    const streamUrl = (streamInputMap[venueKey] || '').trim();
    const videoId = extractYouTubeVideoId(streamUrl);

    const updated = {
      ...current,
      streamUrl: streamUrl || null,
      youtubeVideoId: videoId || null,
      isLiveStreaming: Boolean(videoId || streamUrl),
    };

    try {
      await coordinatorApi.updateMatchScoring(current.id, updated);
      setLiveAssignments((prev) => ({ ...prev, [venueKey]: updated }));
      addToast('Live stream URL updated successfully', 'success');
    } catch (e) {
      addToast('Failed to save stream URL', 'error');
    }
  };

  const handleRemoveStream = async (venueKey) => {
    const current = liveAssignments[venueKey];
    if (!current) return;
    const updated = {
      ...current,
      streamUrl: null,
      youtubeVideoId: null,
      isLiveStreaming: false,
    };
    try {
      await coordinatorApi.updateMatchScoring(current.id, updated);
      setLiveAssignments((prev) => ({ ...prev, [venueKey]: updated }));
      setStreamInputMap((prev) => ({ ...prev, [venueKey]: '' }));
      addToast('Live stream removed', 'info');
    } catch (e) {}
  };

  const handleFinishMatchDirect = async (venueKey) => {
    const matchItem = liveAssignments[venueKey];
    if (!matchItem) return;

    const winnerName = window.prompt(`Enter winning team for "${matchItem.team1} vs ${matchItem.team2}":`, matchItem.team1);
    if (!winnerName) return;

    const completedObj = {
      ...matchItem,
      status: 'COMPLETED',
      winner: winnerName.trim(),
      completedAt: new Date().toISOString(),
    };

    try {
      await coordinatorApi.completeMatch(matchItem.id, completedObj);
      setLiveAssignments((prev) => {
        const next = { ...prev };
        delete next[venueKey];
        return next;
      });
      if (onUpdateMatchScore) {
        onUpdateMatchScore(matchItem.id, completedObj);
      }
      addToast(`🏆 Gully Cricket Match Finished! Winner: ${winnerName.trim()}`, 'success');
    } catch (e) {
      addToast('Failed to complete match', 'error');
    }
  };

  const activeMatchesList = (matches || []).filter(
    (m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED'
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse uppercase">
              🔴 LIVE MATCH CONTROL
            </span>
            <span className="text-xs font-mono text-slate-400">Sport: Gully Cricket</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Gully & Box Cricket Live Match Controller
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time runs, wickets, overs, extras, and stream controllers for official Street Pitches
          </p>
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {venueCards.map((venueName) => {
          const liveMatch = liveAssignments[venueName];
          const hasLive = Boolean(liveMatch);

          return (
            <div
              key={venueName}
              className={`rounded-3xl border transition shadow-sm overflow-hidden flex flex-col justify-between ${
                hasLive
                  ? 'bg-white dark:bg-[#0F172A] border-emerald-500/40 shadow-emerald-500/5'
                  : 'bg-slate-50 dark:bg-[#090D16] border-slate-200 dark:border-slate-800/80'
              }`}
            >
              {/* Pitch Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${hasLive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {venueName}
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  hasLive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {hasLive ? '🔴 LIVE INNINGS' : 'AVAILABLE'}
                </span>
              </div>

              {/* Pitch Body */}
              <div className="p-5 space-y-4 flex-1">
                {hasLive ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                        🏏 {liveMatch.currentInnings === 2 ? '2ND INNINGS' : '1ST INNINGS'}
                      </span>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">
                        <span className="text-emerald-600 dark:text-emerald-400">{liveMatch.team1}</span>
                        <span className="text-slate-400 mx-2 text-xs font-normal">vs</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{liveMatch.team2}</span>
                      </h4>

                      <div className="flex items-baseline justify-center gap-2 font-mono">
                        <span className="text-4xl font-black text-emerald-500">
                          {liveMatch.currentInnings === 2 ? (liveMatch.score2 || 0) : (liveMatch.score1 || 0)}
                        </span>
                        <span className="text-2xl text-slate-400 font-bold">/</span>
                        <span className="text-2xl font-black text-rose-500">
                          {liveMatch.currentInnings === 2 ? (liveMatch.wickets2 || 0) : (liveMatch.wickets1 || 0)}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        Overs: <strong className="text-slate-900 dark:text-white">{liveMatch.currentInnings === 2 ? (liveMatch.overs2 || '0.0') : (liveMatch.overs1 || '0.0')}</strong> / 6
                      </div>
                    </div>

                    {/* YouTube Stream Config */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-rose-500" />
                        <span>Live Stream URL (YouTube)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://youtube.com/watch?v=..."
                          value={streamInputMap[venueName] !== undefined ? streamInputMap[venueName] : (liveMatch.streamUrl || '')}
                          onChange={(e) => setStreamInputMap({ ...streamInputMap, [venueName]: e.target.value })}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono outline-none"
                        />
                        <button
                          onClick={() => handleSaveStream(venueName)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Controller Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => setActiveControllerVenue(venueName)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                      >
                        <Activity className="w-4 h-4" />
                        <span>Open Live Controller</span>
                      </button>

                      <button
                        onClick={() => handleFinishMatchDirect(venueName)}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Square className="w-4 h-4 text-rose-500" />
                        <span>Finish Match</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
                      🏏
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Pitch is Available</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Select a scheduled Gully Cricket match below to start live match scoring.
                      </p>
                    </div>

                    {activeMatchesList.length > 0 ? (
                      <div className="space-y-2 max-w-sm mx-auto pt-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Start Scheduled Match:
                        </label>
                        <div className="flex flex-col gap-2">
                          {activeMatchesList.slice(0, 3).map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleInitiateGoLive(m, venueName)}
                              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                            >
                              <span className="truncate">{m.team1} vs {m.team2}</span>
                              <span className="shrink-0 text-[10px] font-mono bg-emerald-600 text-white px-1.5 py-0.5 rounded">Go Live</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block text-xs font-mono text-slate-400">
                        No scheduled matches available. Create one in Match Schedule tab.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Go Live Multi-Step Setup Wizard Modal */}
      {activeGoLiveSetupMatch && (
        <CricketGoLiveSetupModal
          match={activeGoLiveSetupMatch.match}
          targetVenue={activeGoLiveSetupMatch.targetVenue}
          onClose={() => setActiveGoLiveSetupMatch(null)}
          onStartMatch={handleCompleteGoLiveSetup}
        />
      )}

      {/* Live Scoring Controller Modal */}
      {activeControllerVenue && liveAssignments[activeControllerVenue] && (
        <CricketLiveScoreControllerModal
          match={liveAssignments[activeControllerVenue]}
          venueName={activeControllerVenue}
          onClose={() => setActiveControllerVenue(null)}
          onMatchUpdated={handleMatchUpdatedFromController}
        />
      )}
    </div>
  );
};
