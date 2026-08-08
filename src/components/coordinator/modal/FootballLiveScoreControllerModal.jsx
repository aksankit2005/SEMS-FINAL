import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, RotateCcw, Trophy, AlertCircle, RefreshCw, UserCheck, Activity, Maximize2, Minimize2, CheckCircle2 
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';

export const FootballLiveScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {
  const { addToast } = useToast();

  const team1Name = match?.team1 || 'Team 1';
  const team2Name = match?.team2 || 'Team 2';

  // Fullscreen state
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

  // Initial rosters with defaults if missing
  const initialRoster1 = match?.roster1 && match.roster1.length >= 5
    ? match.roster1
    : [
        { id: 'T1-1', name: `${team1Name} Player 1`, jersey: '1', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T1-2', name: `${team1Name} Player 2`, jersey: '4', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T1-3', name: `${team1Name} Player 3`, jersey: '7', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T1-4', name: `${team1Name} Player 4`, jersey: '9', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T1-5', name: `${team1Name} Player 5`, jersey: '10', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T1-6', name: `${team1Name} Sub 1`, jersey: '12', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T1-7', name: `${team1Name} Sub 2`, jersey: '14', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T1-8', name: `${team1Name} Sub 3`, jersey: '17', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
      ];

  const initialRoster2 = match?.roster2 && match.roster2.length >= 5
    ? match.roster2
    : [
        { id: 'T2-1', name: `${team2Name} Player 1`, jersey: '1', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T2-2', name: `${team2Name} Player 2`, jersey: '4', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T2-3', name: `${team2Name} Player 3`, jersey: '7', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T2-4', name: `${team2Name} Player 4`, jersey: '9', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T2-5', name: `${team2Name} Player 5`, jersey: '10', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T2-6', name: `${team2Name} Sub 1`, jersey: '12', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T2-7', name: `${team2Name} Sub 2`, jersey: '14', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
        { id: 'T2-8', name: `${team2Name} Sub 3`, jersey: '17', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
      ];

  const [roster1, setRoster1] = useState(initialRoster1);
  const [roster2, setRoster2] = useState(initialRoster2);

  // Lock background scrolling
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Total team goals calculated cumulatively from individual player goals (+1 point per goal)
  const calculatedScore1 = roster1.reduce((acc, p) => acc + (p.goals || p.points || 0), 0);
  const calculatedScore2 = roster2.reduce((acc, p) => acc + (p.goals || p.points || 0), 0);

  const [quarter, setQuarter] = useState(match?.quarter || '1st Half');
  const [isPaused, setIsPaused] = useState(match?.isPaused || false);

  // Substitution Modal state
  const [subModal, setSubModal] = useState(null); // { teamNum: 1|2, outPlayer: obj }

  // Undo History Stack
  const [historyStack, setHistoryStack] = useState([]);

  const syncToServer = async (r1 = roster1, r2 = roster2, q = quarter, paused = isPaused) => {
    const s1 = r1.reduce((acc, p) => acc + (p.goals || p.points || 0), 0);
    const s2 = r2.reduce((acc, p) => acc + (p.goals || p.points || 0), 0);

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
      console.warn('Error syncing score state to server', err);
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

  // Award +1 Goal (Point) to Player & Update Team Total Goals
  const handleAwardGoal = (teamNum, playerId) => {
    pushUndoState();

    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;

    const updated = list.map((p) => {
      if (p.id === playerId) {
        if (p.redCard) {
          addToast(`Player #${p.jersey} ${p.name} has a Red Card 🟥 (Sent Off) and cannot score!`, 'error');
          return p;
        }
        const currentG = p.goals !== undefined ? p.goals : (p.points || 0);
        return { ...p, goals: currentG + 1, points: currentG + 1 };
      }
      return p;
    });

    setList(updated);
    if (teamNum === 1) syncToServer(updated, roster2);
    else syncToServer(roster1, updated);

    const player = list.find((p) => p.id === playerId);
    if (player && !player.redCard) {
      addToast(`⚽ GOAL! +1 Goal awarded to #${player.jersey} ${player.name}`, 'success');
    }
  };

  // Award Yellow Card (🟨) to Player (2 Yellows = Red Card 🟥)
  const handleAwardYellowCard = (teamNum, playerId) => {
    pushUndoState();

    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;

    let autoRedCarded = false;

    const updated = list.map((p) => {
      if (p.id === playerId) {
        if (p.redCard) {
          addToast(`Player #${p.jersey} ${p.name} is already Red Carded 🟥 (Sent Off)`, 'error');
          return p;
        }
        const nextYellows = (p.yellowCards || 0) + 1;
        if (nextYellows >= 2) {
          autoRedCarded = true;
          return { ...p, yellowCards: nextYellows, redCard: true, onCourt: false };
        }
        return { ...p, yellowCards: nextYellows };
      }
      return p;
    });

    setList(updated);
    if (teamNum === 1) syncToServer(updated, roster2);
    else syncToServer(roster1, updated);

    const player = list.find((p) => p.id === playerId);
    if (autoRedCarded) {
      addToast(`🟥 RED CARD! #${player.jersey} ${player.name} received 2nd Yellow Card 🟨 (Sent Off & Removed from Pitch)`, 'error');
    } else if (player) {
      addToast(`🟨 Yellow Card given to #${player.jersey} ${player.name}`, 'warning');
    }
  };

  // Award Red Card (🟥) directly to Player (Sent Off)
  const handleAwardRedCard = (teamNum, playerId) => {
    pushUndoState();

    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;

    const updated = list.map((p) => {
      if (p.id === playerId) {
        return { ...p, redCard: true, onCourt: false };
      }
      return p;
    });

    setList(updated);
    if (teamNum === 1) syncToServer(updated, roster2);
    else syncToServer(roster1, updated);

    const player = list.find((p) => p.id === playerId);
    if (player) {
      addToast(`🟥 DIRECT RED CARD! #${player.jersey} ${player.name} is Sent Off (Removed from Pitch)`, 'error');
    }
  };

  // Perform Player Substitution (Sub Out active player, Sub In bench player)
  const handleExecuteSub = (teamNum, outPlayerId, inPlayerId) => {
    pushUndoState();

    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;
    const teamName = teamNum === 1 ? team1Name : team2Name;

    const inPlayer = list.find((p) => p.id === inPlayerId);
    if (inPlayer && inPlayer.redCard) {
      addToast(`Cannot sub in #${inPlayer.jersey} ${inPlayer.name} (Red Carded 🟥 / Sent Off)`, 'error');
      return;
    }

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
      `🔄 Football Sub for ${teamName}: #${inPlayer?.jersey} ${inPlayer?.name} IN ➔ #${outPlayer?.jersey} ${outPlayer?.name} OUT`,
      'success'
    );
  };

  // Next Half transition (Strictly 2 Halves for Football)
  const handleNextHalf = () => {
    const halfOrder = ['1st Half', '2nd Half'];
    const currentIdx = halfOrder.indexOf(quarter);
    if (currentIdx < halfOrder.length - 1) {
      const nextQ = halfOrder[currentIdx + 1];
      setQuarter(nextQ);
      syncToServer(roster1, roster2, nextQ);
      addToast(`⚽ Advanced to ${nextQ}. Team total goals continue!`, 'success');
    } else {
      addToast('Match is in 2nd Half (Full Time / 2 Halves Completed)', 'info');
    }
  };

  // Complete Match & Generate PDF
  const handleFinishMatch = async () => {
    const s1 = calculatedScore1;
    const s2 = calculatedScore2;
    const winnerName = s1 > s2 ? team1Name : s2 > s1 ? team2Name : 'Draw';

    if (!window.confirm(`Finish Football match with score ${team1Name} ${s1} - ${s2} ${team2Name}?`)) return;

    const completedObj = {
      ...match,
      score1: s1,
      score2: s2,
      status: 'COMPLETED',
      winner: winnerName,
      roster1,
      roster2,
      tableNumber: venueName,
      completedAt: new Date().toISOString(),
    };

    try {
      await coordinatorApi.completeMatch(match.id, completedObj);
      if (onMatchUpdated) onMatchUpdated(match.id, { status: 'COMPLETED', score1: s1, score2: s2 });
      generateMatchResultPDF(completedObj, 'Football');
      addToast(`🏆 Football Match Finished! Winner: ${winnerName}. Result PDF exported.`, 'success');
      onClose();
    } catch (err) {
      addToast('Failed to complete match', 'error');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] bg-slate-950/95 flex flex-col font-sans text-slate-100 select-none overflow-hidden animate-fade-in">
      
      {/* Top Header Bar */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-black flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> 🔴 LIVE FOOTBALL CONTROLLER
          </span>
          <span className="text-xs font-mono text-slate-400">Venue: <b className="text-white">{venueName}</b></span>
        </div>

        <div className="flex items-center gap-3">
          {historyStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-amber-500/30 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo ({historyStack.length})
            </button>
          )}

          <button
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scoreboard Display Banner */}
      <div className="p-6 bg-gradient-to-b from-slate-900 to-[#0B1120] border-b border-slate-800 text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleNextHalf}
            className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-xs hover:bg-emerald-500/20 transition cursor-pointer"
          >
            {quarter} ➔ Next Half
          </button>
        </div>

        <div className="flex items-center justify-center gap-8">
          {/* Team 1 Score */}
          <div className="text-right space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight">{team1Name}</h3>
            <div className="text-6xl font-black text-emerald-400 font-mono tracking-tighter">
              {calculatedScore1}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              TOTAL GOALS
            </span>
          </div>

          <div className="text-3xl font-black text-slate-600 font-mono uppercase">VS</div>

          {/* Team 2 Score */}
          <div className="text-left space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight">{team2Name}</h3>
            <div className="text-6xl font-black text-teal-400 font-mono tracking-tighter">
              {calculatedScore2}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              TOTAL GOALS
            </span>
          </div>
        </div>
      </div>

      {/* Main Body: 2 Team Player Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TEAM 1 PLAYERS LIST */}
        <div className="p-5 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span>{team1Name} Squad Players</span>
              </h4>
              <span className="text-xs font-mono font-bold text-slate-400">
                {roster1.filter((p) => p.onCourt).length} On Pitch
              </span>
            </div>

            {/* Active Players On Pitch */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider font-mono">
                ON PITCH PLAYERS
              </span>

              {roster1.filter((p) => p.onCourt).map((p) => {
                const pGoals = p.goals !== undefined ? p.goals : (p.points || 0);

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      p.redCard
                        ? 'bg-rose-950/40 border-rose-600/40 opacity-60'
                        : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-black text-xs">
                        #{p.jersey}
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.yellowCards > 0 && (
                            <span className="text-[10px]" title={`${p.yellowCards} Yellow Card(s)`}>🟨</span>
                          )}
                          {p.redCard && (
                            <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-mono font-black" title="Red Card / Sent Off">
                              🟥 SENT OFF
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 font-bold">
                          Goals: {pGoals}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls for Player */}
                    <div className="flex items-center gap-1.5">
                      {/* +1 GOAL POINT BUTTON */}
                      <button
                        onClick={() => handleAwardGoal(1, p.id)}
                        disabled={p.redCard}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1 cursor-pointer"
                        title="Add 1 Goal for this player"
                      >
                        <span>⚽ +1 GOAL</span>
                      </button>

                      {/* YELLOW CARD BUTTON */}
                      <button
                        onClick={() => handleAwardYellowCard(1, p.id)}
                        disabled={p.redCard}
                        className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                        title="Give Yellow Card (🟨)"
                      >
                        🟨
                      </button>

                      {/* RED CARD BUTTON */}
                      <button
                        onClick={() => handleAwardRedCard(1, p.id)}
                        disabled={p.redCard}
                        className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                        title="Give Red Card (🟥)"
                      >
                        🟥
                      </button>

                      {/* SUBSTITUTE BUTTON */}
                      <button
                        onClick={() => setSubModal({ teamNum: 1, outPlayer: p })}
                        disabled={p.redCard}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
                        title="Substitute Player"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bench Players */}
            {roster1.filter((p) => !p.onCourt).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider font-mono">
                  BENCH SUBS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roster1.filter((p) => !p.onCourt).map((p) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="font-semibold text-slate-400 truncate">#{p.jersey} {p.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">{p.goals || 0} G</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TEAM 2 PLAYERS LIST */}
        <div className="p-5 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-black text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <span>{team2Name} Squad Players</span>
              </h4>
              <span className="text-xs font-mono font-bold text-slate-400">
                {roster2.filter((p) => p.onCourt).length} On Pitch
              </span>
            </div>

            {/* Active Players On Pitch */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase text-teal-500 tracking-wider font-mono">
                ON PITCH PLAYERS
              </span>

              {roster2.filter((p) => p.onCourt).map((p) => {
                const pGoals = p.goals !== undefined ? p.goals : (p.points || 0);

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      p.redCard
                        ? 'bg-rose-950/40 border-rose-600/40 opacity-60'
                        : 'bg-slate-900/90 border-slate-800 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-mono font-black text-xs">
                        #{p.jersey}
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.yellowCards > 0 && (
                            <span className="text-[10px]" title={`${p.yellowCards} Yellow Card(s)`}>🟨</span>
                          )}
                          {p.redCard && (
                            <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-mono font-black" title="Red Card / Sent Off">
                              🟥 SENT OFF
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-teal-400 font-bold">
                          Goals: {pGoals}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls for Player */}
                    <div className="flex items-center gap-1.5">
                      {/* +1 GOAL POINT BUTTON */}
                      <button
                        onClick={() => handleAwardGoal(2, p.id)}
                        disabled={p.redCard}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-30 text-white font-black text-xs shadow-md shadow-teal-600/30 transition flex items-center gap-1 cursor-pointer"
                        title="Add 1 Goal for this player"
                      >
                        <span>⚽ +1 GOAL</span>
                      </button>

                      {/* YELLOW CARD BUTTON */}
                      <button
                        onClick={() => handleAwardYellowCard(2, p.id)}
                        disabled={p.redCard}
                        className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                        title="Give Yellow Card (🟨)"
                      >
                        🟨
                      </button>

                      {/* RED CARD BUTTON */}
                      <button
                        onClick={() => handleAwardRedCard(2, p.id)}
                        disabled={p.redCard}
                        className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                        title="Give Red Card (🟥)"
                      >
                        🟥
                      </button>

                      {/* SUBSTITUTE BUTTON */}
                      <button
                        onClick={() => setSubModal({ teamNum: 2, outPlayer: p })}
                        disabled={p.redCard}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
                        title="Substitute Player"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bench Players */}
            {roster2.filter((p) => !p.onCourt).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider font-mono">
                  BENCH SUBS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roster2.filter((p) => !p.onCourt).map((p) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="font-semibold text-slate-400 truncate">#{p.jersey} {p.name}</span>
                      <span className="text-[10px] font-mono text-teal-400 font-bold">{p.goals || 0} G</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Footer Actions */}
      <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
        >
          Close Controller
        </button>

        <button
          onClick={handleFinishMatch}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>FINISH FOOTBALL MATCH & EXPORT RESULT PDF</span>
        </button>
      </div>

      {/* Substitution Drawer / Modal */}
      {subModal && (
        <div className="fixed inset-0 z-[9999999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-white text-sm">
                Substitute #{subModal.outPlayer.jersey} {subModal.outPlayer.name} OUT
              </h4>
              <button onClick={() => setSubModal(null)} className="p-1 rounded-lg bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">Select a bench player to Sub IN onto the pitch:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(subModal.teamNum === 1 ? roster1 : roster2)
                .filter((p) => !p.onCourt && !p.redCard)
                .map((benchP) => (
                  <button
                    key={benchP.id}
                    onClick={() => handleExecuteSub(subModal.teamNum, subModal.outPlayer.id, benchP.id)}
                    className="w-full p-3 rounded-xl bg-slate-800 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-500 text-left text-xs font-bold text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>#{benchP.jersey} {benchP.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">Sub IN ➔</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );

  return createPortal(modalContent, document.body);
};
