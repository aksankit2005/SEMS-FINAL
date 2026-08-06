import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, RotateCcw, Trophy, RefreshCw, Maximize2, Minimize2 
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';

export const VolleyballLiveScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {
  const { addToast } = useToast();

  const team1Name = match?.team1 || 'Team 1';
  const team2Name = match?.team2 || 'Team 2';

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const initialRoster1 = match?.roster1 && match.roster1.length >= 6
    ? match.roster1
    : [
        { id: 'T1-1', name: `${team1Name} Player 1`, jersey: '1', onCourt: true, points: 0 },
        { id: 'T1-2', name: `${team1Name} Player 2`, jersey: '2', onCourt: true, points: 0 },
        { id: 'T1-3', name: `${team1Name} Player 3`, jersey: '3', onCourt: true, points: 0 },
        { id: 'T1-4', name: `${team1Name} Player 4`, jersey: '4', onCourt: true, points: 0 },
        { id: 'T1-5', name: `${team1Name} Player 5`, jersey: '5', onCourt: true, points: 0 },
        { id: 'T1-6', name: `${team1Name} Player 6`, jersey: '6', onCourt: true, points: 0 },
        { id: 'T1-7', name: `${team1Name} Sub 1`, jersey: '7', onCourt: false, points: 0 },
        { id: 'T1-8', name: `${team1Name} Sub 2`, jersey: '8', onCourt: false, points: 0 },
      ];

  const initialRoster2 = match?.roster2 && match.roster2.length >= 6
    ? match.roster2
    : [
        { id: 'T2-1', name: `${team2Name} Player 1`, jersey: '1', onCourt: true, points: 0 },
        { id: 'T2-2', name: `${team2Name} Player 2`, jersey: '2', onCourt: true, points: 0 },
        { id: 'T2-3', name: `${team2Name} Player 3`, jersey: '3', onCourt: true, points: 0 },
        { id: 'T2-4', name: `${team2Name} Player 4`, jersey: '4', onCourt: true, points: 0 },
        { id: 'T2-5', name: `${team2Name} Player 5`, jersey: '5', onCourt: true, points: 0 },
        { id: 'T2-6', name: `${team2Name} Player 6`, jersey: '6', onCourt: true, points: 0 },
        { id: 'T2-7', name: `${team2Name} Sub 1`, jersey: '7', onCourt: false, points: 0 },
        { id: 'T2-8', name: `${team2Name} Sub 2`, jersey: '8', onCourt: false, points: 0 },
      ];

  const [roster1, setRoster1] = useState(initialRoster1);
  const [roster2, setRoster2] = useState(initialRoster2);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const calculatedScore1 = roster1.reduce((acc, p) => acc + (p.points || 0), 0);
  const calculatedScore2 = roster2.reduce((acc, p) => acc + (p.points || 0), 0);

  const [quarter, setQuarter] = useState(match?.quarter || 'Quarter 1');
  const [isPaused, setIsPaused] = useState(match?.isPaused || false);

  const [subModal, setSubModal] = useState(null); // { teamNum: 1|2, outPlayer: obj }
  const [historyStack, setHistoryStack] = useState([]);

  const syncToServer = async (r1 = roster1, r2 = roster2, q = quarter, paused = isPaused) => {
    const s1 = r1.reduce((acc, p) => acc + (p.points || 0), 0);
    const s2 = r2.reduce((acc, p) => acc + (p.points || 0), 0);

    const payload = {
      score1: s1,
      score2: s2,
      quarter: q,
      isPaused: paused,
      roster1: r1,
      roster2: r2,
      status: 'running',
    };

    try {
      await coordinatorApi.updateMatchScoring(match.id, payload);
      if (onMatchUpdated) onMatchUpdated(match.id, payload);
    } catch (err) {
      console.warn('Error syncing volleyball score state to server', err);
    }
  };

  const pushUndoState = () => {
    setHistoryStack((prev) => [
      ...prev,
      {
        roster1: JSON.parse(JSON.stringify(roster1)),
        roster2: JSON.parse(JSON.stringify(roster2)),
        quarter,
      },
    ]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) {
      addToast('Nothing to undo', 'info');
      return;
    }

    const previous = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setRoster1(previous.roster1);
    setRoster2(previous.roster2);
    setQuarter(previous.quarter);

    syncToServer(previous.roster1, previous.roster2, previous.quarter);
    addToast('Reverted last action', 'info');
  };

  const handleAwardPoint = (teamNum, playerId, pts) => {
    pushUndoState();

    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;

    const updated = list.map((p) => {
      if (p.id === playerId) {
        return { ...p, points: Math.max(0, (p.points || 0) + pts) };
      }
      return p;
    });

    setList(updated);
    if (teamNum === 1) syncToServer(updated, roster2);
    else syncToServer(roster1, updated);

    const player = list.find((p) => p.id === playerId);
    if (player && pts !== 0) {
      addToast(`🏐 ${pts > 0 ? '+' + pts : pts} PTS for #${player.jersey} ${player.name}`, 'success');
    }
  };

  const handleExecuteSub = (teamNum, outPlayerId, inPlayerId) => {
    pushUndoState();

    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;
    const teamName = teamNum === 1 ? team1Name : team2Name;

    const inPlayer = list.find((p) => p.id === inPlayerId);

    const updated = list.map((p) => {
      if (p.id === outPlayerId) return { ...p, onCourt: false };
      if (p.id === inPlayerId) return { ...p, onCourt: true };
      return p;
    });

    setList(updated);
    if (teamNum === 1) syncToServer(updated, roster2);
    else syncToServer(roster1, updated);

    const outPlayer = list.find((p) => p.id === outPlayerId);
    setSubModal(null);

    addToast(
      `🔄 Substituted for ${teamName}: #${inPlayer?.jersey} ${inPlayer?.name} IN ➔ #${outPlayer?.jersey} ${outPlayer?.name} OUT`,
      'success'
    );
  };

  const handleNextQuarter = () => {
    const quarterOrder = ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4', 'Deciding Set'];
    const currentIdx = quarterOrder.indexOf(quarter);
    if (currentIdx < quarterOrder.length - 1) {
      const nextQ = quarterOrder[currentIdx + 1];
      setQuarter(nextQ);
      syncToServer(roster1, roster2, nextQ);
      addToast(`🏐 Advanced to ${nextQ}. Points continue!`, 'success');
    } else {
      addToast('Match is in Deciding Set', 'info');
    }
  };

  const handleFinishMatch = async () => {
    const s1 = calculatedScore1;
    const s2 = calculatedScore2;
    const winnerName = s1 > s2 ? team1Name : s2 > s1 ? team2Name : 'Draw';

    if (!window.confirm(`Finish Volleyball match with score ${team1Name} ${s1} - ${s2} ${team2Name}?`)) return;

    const completedObj = {
      ...match,
      score1: s1,
      score2: s2,
      status: 'COMPLETED',
      winner: winnerName,
      roster1,
      roster2,
      quarter,
      completedAt: new Date().toISOString(),
    };

    try {
      await coordinatorApi.completeMatch(match.id, completedObj);
      generateMatchResultPDF(completedObj, 'Volleyball');
      if (onMatchUpdated) onMatchUpdated(match.id, { status: 'COMPLETED', score1: s1, score2: s2 });
      addToast(`🏆 Volleyball Match Completed! Winner: ${winnerName}. PDF downloaded.`, 'success');
      onClose();
    } catch (err) {
      addToast('Failed to complete match', 'error');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-[#060911] text-white flex flex-col font-sans overflow-hidden w-screen h-screen select-none p-2 sm:p-3 space-y-2">
      
      {/* Top Header Bar */}
      <header className="px-4 py-2.5 bg-[#0D1424] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-orange-400 uppercase tracking-wider">{venueName}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <span className="text-xs font-black text-white uppercase truncate max-w-[120px] sm:max-w-[180px]">{team1Name}</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-orange-500">{calculatedScore1}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-400 font-mono">VS</span>

          <div className="px-3 py-1 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-black uppercase tracking-wider">
            🏐 {quarter} · Points Continue
          </div>

          <button
            type="button"
            onClick={handleNextQuarter}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
          >
            Next Set ➔
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-orange-400" /> Undo
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-500">{calculatedScore2}</span>
            <span className="text-xs font-black text-white uppercase truncate max-w-[120px] sm:max-w-[180px]">{team2Name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFinishMatch}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" /> Finish & PDF
            </button>

            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-orange-400" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition cursor-pointer"
              title="Close Console"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Playing Grid */}
      <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 overflow-hidden">
        
        {/* TEAM 1 PANEL */}
        <div className="flex flex-col h-full overflow-hidden p-3 rounded-2xl bg-[#0D1424] border border-orange-500/30 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <h3 className="text-xs font-black text-white uppercase tracking-wide truncate max-w-[200px]">{team1Name}</h3>
              <span className="text-[10px] font-mono text-orange-400 font-bold">PLAYING 6</span>
            </div>
            <span className="text-xs font-mono font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
              {calculatedScore1} PTS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 custom-scrollbar">
            {roster1.filter((p) => p.onCourt).map((player) => (
              <div
                key={player.id}
                className="p-2 rounded-xl border bg-[#121A2D] border-slate-800 hover:border-orange-500/30 transition"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-6 h-6 rounded bg-orange-500/20 text-orange-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-orange-500/30">
                      #{player.jersey}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{player.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      PTS: <strong className="text-orange-400 font-bold">{player.points || 0}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSubModal({ teamNum: 1, outPlayer: player })}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] border border-slate-700 transition cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5 text-orange-400" /> Sub Out
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAwardPoint(1, player.id, 1)}
                    className="py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-black text-xs transition cursor-pointer active:scale-95 shadow-xs"
                  >
                    +1 Point
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAwardPoint(1, player.id, -1)}
                    className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer border border-slate-700 active:scale-95"
                  >
                    -1 Point
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-slate-400 font-bold uppercase shrink-0">BENCH ({roster1.filter((p) => !p.onCourt).length}):</span>
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
              {roster1.filter((p) => !p.onCourt).map((bp) => (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => {
                    const firstOnCourt = roster1.find((p) => p.onCourt);
                    if (firstOnCourt) setSubModal({ teamNum: 1, outPlayer: firstOnCourt });
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 transition flex items-center gap-1 cursor-pointer bg-[#121A2D] hover:bg-orange-500/20 text-slate-300 border-slate-700"
                >
                  <span className="text-orange-400">#{bp.jersey}</span> {bp.name.split(' ')[0]} ({bp.points}p)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TEAM 2 PANEL */}
        <div className="flex flex-col h-full overflow-hidden p-3 rounded-2xl bg-[#0D1424] border border-blue-500/30 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-xs font-black text-white uppercase tracking-wide truncate max-w-[200px]">{team2Name}</h3>
              <span className="text-[10px] font-mono text-blue-400 font-bold">PLAYING 6</span>
            </div>
            <span className="text-xs font-mono font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {calculatedScore2} PTS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 custom-scrollbar">
            {roster2.filter((p) => p.onCourt).map((player) => (
              <div
                key={player.id}
                className="p-2 rounded-xl border bg-[#121A2D] border-slate-800 hover:border-blue-500/30 transition"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-blue-500/30">
                      #{player.jersey}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{player.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      PTS: <strong className="text-blue-400 font-bold">{player.points || 0}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSubModal({ teamNum: 2, outPlayer: player })}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] border border-slate-700 transition cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5 text-blue-400" /> Sub Out
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAwardPoint(2, player.id, 1)}
                    className="py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition cursor-pointer active:scale-95 shadow-xs"
                  >
                    +1 Point
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAwardPoint(2, player.id, -1)}
                    className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer border border-slate-700 active:scale-95"
                  >
                    -1 Point
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-slate-400 font-bold uppercase shrink-0">BENCH ({roster2.filter((p) => !p.onCourt).length}):</span>
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
              {roster2.filter((p) => !p.onCourt).map((bp) => (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => {
                    const firstOnCourt = roster2.find((p) => p.onCourt);
                    if (firstOnCourt) setSubModal({ teamNum: 2, outPlayer: firstOnCourt });
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 transition flex items-center gap-1 cursor-pointer bg-[#121A2D] hover:bg-blue-500/20 text-slate-300 border-slate-700"
                >
                  <span className="text-blue-400">#{bp.jersey}</span> {bp.name.split(' ')[0]} ({bp.points}p)
                </button>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* Substitution Swap Modal */}
      {subModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-[#0D1424] text-white rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-orange-400">
                  PLAYER SUBSTITUTION
                </span>
                <h4 className="text-base font-black">
                  Sub OUT: #{subModal.outPlayer.jersey} {subModal.outPlayer.name}
                </h4>
              </div>
              <button
                onClick={() => setSubModal(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select an available bench player to Sub IN on court for {subModal.teamNum === 1 ? team1Name : team2Name}:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {(subModal.teamNum === 1 ? roster1 : roster2)
                .filter((p) => !p.onCourt)
                .map((benchPlayer) => (
                  <button
                    key={benchPlayer.id}
                    type="button"
                    onClick={() => handleExecuteSub(subModal.teamNum, subModal.outPlayer.id, benchPlayer.id)}
                    className="w-full p-3 rounded-2xl border text-left flex items-center justify-between transition bg-[#121A2D] border-slate-800 hover:border-orange-500 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 font-mono font-black text-xs flex items-center justify-center border border-orange-500/30">
                        #{benchPlayer.jersey}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {benchPlayer.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {benchPlayer.points || 0} pts
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-orange-400">SUB IN ➔</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
};
