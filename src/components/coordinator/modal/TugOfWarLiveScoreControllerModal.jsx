import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, Pause, Play, Trophy, ShieldAlert, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';

export const TugOfWarLiveScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {
  const { addToast } = useToast();

  const [format, setFormat] = useState(match?.format || 'Best of 3 Rounds');
  const maxRounds = format === 'Best of 5 Rounds' ? 5 : 3;
  const targetRoundsToWin = format === 'Best of 5 Rounds' ? 3 : 2;

  const [roundsWon1, setRoundsWon1] = useState(match?.roundsWon1 || 0);
  const [roundsWon2, setRoundsWon2] = useState(match?.roundsWon2 || 0);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(match?.currentRound || 1);
  const [isPaused, setIsPaused] = useState(match?.isPaused || false);

  const [roundsHistory, setRoundsHistory] = useState(
    match?.roundsHistory || [
      { round: 1, winner: null, isLocked: false },
      { round: 2, winner: null, isLocked: false },
      { round: 3, winner: null, isLocked: false },
      { round: 4, winner: null, isLocked: false },
      { round: 5, winner: null, isLocked: false },
    ]
  );

  const [historyStack, setHistoryStack] = useState([]);
  const [matchWinner, setMatchWinner] = useState(match?.winner || null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Sync state changes to server
  const syncToServer = async (overrideData = {}) => {
    const calculatedRoundsWon1 = roundsHistory.filter((s) => s.isLocked && s.winner === match?.team1).length;
    const calculatedRoundsWon2 = roundsHistory.filter((s) => s.isLocked && s.winner === match?.team2).length;

    const payload = {
      roundsWon1: calculatedRoundsWon1,
      roundsWon2: calculatedRoundsWon2,
      currentRound: currentRoundIndex,
      isPaused,
      roundsHistory,
      format,
      status: matchWinner ? 'COMPLETED' : 'running',
      ...overrideData,
    };
    try {
      await coordinatorApi.updateMatchScoring(match.id, payload);
      if (onMatchUpdated) onMatchUpdated(match.id, payload);
    } catch (err) {
      console.warn('Error syncing tug of war score state to server', err);
    }
  };

  // Push to undo stack
  const saveStateToUndo = () => {
    setHistoryStack((prev) => [
      ...prev,
      {
        roundsWon1,
        roundsWon2,
        currentRoundIndex,
        roundsHistory: JSON.parse(JSON.stringify(roundsHistory)),
      },
    ]);
  };

  // Award Round to Team
  const handleAwardRound = (teamNum) => {
    if (matchWinner) return;

    saveStateToUndo();

    const winningTeam = teamNum === 1 ? match.team1 : match.team2;

    const updatedRounds = roundsHistory.map((s) => {
      if (s.round === currentRoundIndex) {
        return { ...s, winner: winningTeam, isLocked: true };
      }
      return s;
    });

    setRoundsHistory(updatedRounds);

    const newRoundsWon1 = updatedRounds.filter((s) => s.isLocked && s.winner === match?.team1).length;
    const newRoundsWon2 = updatedRounds.filter((s) => s.isLocked && s.winner === match?.team2).length;

    setRoundsWon1(newRoundsWon1);
    setRoundsWon2(newRoundsWon2);

    // Check match completion
    if (newRoundsWon1 >= targetRoundsToWin) {
      setMatchWinner(match.team1);
      addToast(`🏆 ${match.team1} WON THE MATCH (${newRoundsWon1} - ${newRoundsWon2} Rounds)!`, 'success');
    } else if (newRoundsWon2 >= targetRoundsToWin) {
      setMatchWinner(match.team2);
      addToast(`🏆 ${match.team2} WON THE MATCH (${newRoundsWon2} - ${newRoundsWon1} Rounds)!`, 'success');
    } else {
      // Advance to next round
      if (currentRoundIndex < maxRounds) {
        setCurrentRoundIndex(currentRoundIndex + 1);
        addToast(`Round ${currentRoundIndex} won by ${winningTeam}. Starting Round ${currentRoundIndex + 1}!`, 'success');
      }
    }

    syncToServer({ roundsHistory: updatedRounds, roundsWon1: newRoundsWon1, roundsWon2: newRoundsWon2 });
  };

  // Unlock Round Action
  const handleUnlockRound = (roundNum) => {
    const reason = window.prompt(`Enter authorization reason to unlock Round ${roundNum}:`, 'Referee score correction');
    if (!reason) return;

    const updatedRounds = roundsHistory.map((s) => {
      if (s.round === roundNum) {
        return { ...s, isLocked: false, winner: null };
      }
      return s;
    });

    setRoundsHistory(updatedRounds);
    setCurrentRoundIndex(roundNum);
    const newRoundsWon1 = updatedRounds.filter((s) => s.isLocked && s.winner === match?.team1).length;
    const newRoundsWon2 = updatedRounds.filter((s) => s.isLocked && s.winner === match?.team2).length;
    setRoundsWon1(newRoundsWon1);
    setRoundsWon2(newRoundsWon2);
    setMatchWinner(null);
    addToast(`Round ${roundNum} unlocked for referee correction`, 'warning');
    syncToServer({ roundsHistory: updatedRounds, roundsWon1: newRoundsWon1, roundsWon2: newRoundsWon2 });
  };

  // Reset Match Action
  const handleResetMatch = () => {
    if (window.confirm('Reset current match rounds history?')) {
      saveStateToUndo();
      setRoundsWon1(0);
      setRoundsWon2(0);
      setMatchWinner(null);
      setCurrentRoundIndex(1);
      const resetRounds = [
        { round: 1, winner: null, isLocked: false },
        { round: 2, winner: null, isLocked: false },
        { round: 3, winner: null, isLocked: false },
        { round: 4, winner: null, isLocked: false },
        { round: 5, winner: null, isLocked: false },
      ];
      setRoundsHistory(resetRounds);
      addToast('Match scorecard reset to 0-0', 'info');
      syncToServer({ roundsWon1: 0, roundsWon2: 0, currentRound: 1, roundsHistory: resetRounds });
    }
  };

  // Toggle Pause Match
  const handleTogglePause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    addToast(nextState ? 'Match timer paused' : 'Match resumed', 'info');
    syncToServer({ isPaused: nextState });
  };

  // Undo Last Action
  const handleUndo = () => {
    if (historyStack.length === 0) {
      addToast('Nothing to undo', 'info');
      return;
    }

    const previousState = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    setRoundsWon1(previousState.roundsWon1);
    setRoundsWon2(previousState.roundsWon2);
    setCurrentRoundIndex(previousState.currentRoundIndex);
    setRoundsHistory(previousState.roundsHistory);
    setMatchWinner(null);

    addToast('Reverted last round scoring action', 'info');
    syncToServer({
      roundsWon1: previousState.roundsWon1,
      roundsWon2: previousState.roundsWon2,
      currentRound: previousState.currentRoundIndex,
      roundsHistory: previousState.roundsHistory,
    });
  };

  const handleCompleteMatchFinal = async () => {
    const completedObj = {
      ...match,
      winner: matchWinner || (roundsWon1 >= roundsWon2 ? match.team1 : match.team2),
      roundsWon1,
      roundsWon2,
      roundsHistory,
      status: 'COMPLETED',
      tableNumber: null,
      isLiveStreaming: false,
      completedAt: new Date().toISOString(),
    };

    await coordinatorApi.completeMatch(match.id, completedObj);
    if (onMatchUpdated) onMatchUpdated(match.id, { status: 'COMPLETED', roundsWon1, roundsWon2 });
    generateMatchResultPDF(completedObj, 'Tug of War');
    addToast('Tug of War match completed and PDF exported!', 'success');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-orange-600 dark:text-orange-400">
              TUG OF WAR LIVE SCORE & ROUND CONTROLLER ({venueName})
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {match?.team1} vs {match?.team2}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Event: {match?.eventTitle || 'Tug of War Championship'} • Format: {format}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePause}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer ${isPaused
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo
            </button>

            <button
              onClick={handleResetMatch}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-600/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-500/30 transition cursor-pointer"
            >
              Reset
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector & Status Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Match Format:</span>
            <select
              value={format}
              onChange={(e) => {
                setFormat(e.target.value);
                syncToServer({ format: e.target.value });
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-xs font-bold text-orange-600 dark:text-orange-400 focus:outline-none"
            >
              <option value="Best of 3 Rounds">Best of 3 Rounds</option>
              <option value="Best of 5 Rounds">Best of 5 Rounds</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              📍 {venueName}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
              ● Round {currentRoundIndex} Active
            </span>
          </div>
        </div>

        {matchWinner ? (
          <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-center space-y-4">
            <Trophy className="w-14 h-14 text-amber-500 mx-auto animate-bounce" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              🏆 {matchWinner} Won the Match!
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              Final Rounds Won: {roundsWon1} - {roundsWon2}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleCompleteMatchFinal}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Complete Match & Download PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* TEAM 1 CONTROLLER */}
            <div className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/20 space-y-6 text-center">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-orange-600 dark:text-orange-400">Team 1</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">{match?.team1}</h3>
                <div className="mt-3">
                  <span className="text-5xl font-mono font-black text-orange-600 dark:text-orange-400">{roundsWon1}</span>
                  <p className="text-[10px] font-mono uppercase text-slate-500 mt-1">Rounds Won (Target: {targetRoundsToWin})</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleAwardRound(1)}
                  disabled={isPaused}
                  className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm shadow-xl shadow-orange-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  🏆 Award Round {currentRoundIndex} Win to {match?.team1}
                </button>
              </div>
            </div>

            {/* TEAM 2 CONTROLLER */}
            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 space-y-6 text-center">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400">Team 2</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">{match?.team2}</h3>
                <div className="mt-3">
                  <span className="text-5xl font-mono font-black text-blue-600 dark:text-blue-400">{roundsWon2}</span>
                  <p className="text-[10px] font-mono uppercase text-slate-500 mt-1">Rounds Won (Target: {targetRoundsToWin})</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleAwardRound(2)}
                  disabled={isPaused}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  🏆 Award Round {currentRoundIndex} Win to {match?.team2}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Rounds History Table */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
            Match Rounds History (Best of {maxRounds})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {roundsHistory.slice(0, maxRounds).map((s) => (
              <div
                key={s.round}
                className={`p-3 rounded-2xl border text-center space-y-2 transition ${s.round === currentRoundIndex && !matchWinner
                  ? 'bg-orange-500/10 border-orange-500/50 shadow-md'
                  : s.isLocked
                    ? 'bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
              >
                <div className="text-[10px] font-mono font-bold uppercase text-slate-500">
                  Round {s.round}
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {s.winner ? s.winner : s.round === currentRoundIndex ? 'Active' : 'Pending'}
                </div>

                {s.isLocked && (
                  <button
                    onClick={() => handleUnlockRound(s.round)}
                    className="w-full py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-600 dark:text-amber-300 hover:text-white font-bold text-[10px] transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Unlock className="w-3 h-3" /> Unlock
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Close Controller
          </button>

          <button
            onClick={handleCompleteMatchFinal}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Finish Match & Export PDF
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
