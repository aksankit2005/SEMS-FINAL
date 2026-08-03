import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Pause, Play, Trophy, ShieldAlert, CheckCircle2, Lock, Unlock, AlertCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';



export const LiveMatchScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {

  const { addToast } = useToast();

  const [format, setFormat] = useState(match?.format || 'Best of 5 Sets');
  const maxSets = format === 'Best of 3 Sets' ? 3 : 5;
  const targetSetsToWin = format === 'Best of 3 Sets' ? 2 : 3;

  const [score1, setScore1] = useState(match?.score1 || 0);
  const [score2, setScore2] = useState(match?.score2 || 0);
  const [activeTurn, setActiveTurn] = useState(match?.activeTurn || 1); // 1 for Player 1, 2 for Player 2
  const [currentSetIndex, setCurrentSetIndex] = useState(match?.currentSet || 1);
  const [isPaused, setIsPaused] = useState(match?.isPaused || false);

  const [setsHistory, setSetsHistory] = useState(
    match?.setsHistory || [
      { set: 1, score1: 0, score2: 0, isLocked: false, winner: null },
      { set: 2, score1: 0, score2: 0, isLocked: false, winner: null },
      { set: 3, score1: 0, score2: 0, isLocked: false, winner: null },
      { set: 4, score1: 0, score2: 0, isLocked: false, winner: null },
      { set: 5, score1: 0, score2: 0, isLocked: false, winner: null },
    ]
  );

  const [historyStack, setHistoryStack] = useState([]);
  const [showLockDialog, setShowLockDialog] = useState(null); // { winner: string, setNum: number }
  const [matchWinner, setMatchWinner] = useState(null);

  // Calculate sets won
  const setsWon1 = setsHistory.filter((s) => s.isLocked && s.winner === match?.team1).length;
  const setsWon2 = setsHistory.filter((s) => s.isLocked && s.winner === match?.team2).length;

  // Sync state changes to server
  const syncToServer = async (overrideData = {}) => {
    const payload = {
      score1,
      score2,
      activeTurn,
      currentSet: currentSetIndex,
      isPaused,
      setsHistory,
      setsWon1,
      setsWon2,
      format,
      ...overrideData,
    };
    try {
      await coordinatorApi.updateMatchScoring(match.id, payload);
      if (onMatchUpdated) onMatchUpdated(match.id, payload);
    } catch (err) {
      console.warn('Error syncing score state to server', err);
    }
  };

  // Push to undo stack
  const saveStateToUndo = () => {
    setHistoryStack((prev) => [
      ...prev,
      {
        score1,
        score2,
        activeTurn,
        currentSetIndex,
        setsHistory: JSON.parse(JSON.stringify(setsHistory)),
      },
    ]);
  };

  // Handle + Point / - Point
  const handlePointChange = (player, delta) => {
    if (matchWinner) return;

    saveStateToUndo();

    if (player === 1) {
      const newScore = Math.max(0, score1 + delta);
      setScore1(newScore);
    } else {
      const newScore = Math.max(0, score2 + delta);
      setScore2(newScore);
    }

    syncToServer();
  };


  // Lock Set Action
  const handleLockSetConfirm = () => {
    if (!showLockDialog && !window.confirm(`Lock Set ${currentSetIndex} score (${score1}-${score2})?`)) return;

    const winner = showLockDialog ? showLockDialog.winner : (score1 > score2 ? match.team1 : match.team2);

    const updatedSets = setsHistory.map((s) => {
      if (s.set === currentSetIndex) {
        return { ...s, score1, score2, isLocked: true, winner };
      }
      return s;
    });

    setSetsHistory(updatedSets);

    const newSetsWon1 = updatedSets.filter((s) => s.isLocked && s.winner === match?.team1).length;
    const newSetsWon2 = updatedSets.filter((s) => s.isLocked && s.winner === match?.team2).length;

    setShowLockDialog(null);

    // Check match completion
    if (newSetsWon1 >= targetSetsToWin) {
      setMatchWinner(match.team1);
      addToast(`🏆 ${match.team1} WON THE MATCH (${newSetsWon1} - ${newSetsWon2})!`, 'success');
    } else if (newSetsWon2 >= targetSetsToWin) {
      setMatchWinner(match.team2);
      addToast(`🏆 ${match.team2} WON THE MATCH (${newSetsWon2} - ${newSetsWon1})!`, 'success');
    } else {
      // Advance to next set
      if (currentSetIndex < maxSets) {
        setCurrentSetIndex(currentSetIndex + 1);
        setScore1(0);
        setScore2(0);
        addToast(`Set ${currentSetIndex} locked (${winner} won). Starting Set ${currentSetIndex + 1}!`, 'success');
      }
    }

    syncToServer({ setsHistory: updatedSets, setsWon1: newSetsWon1, setsWon2: newSetsWon2 });
  };

  // Unlock Set Action
  const handleUnlockSet = (setNum) => {
    const reason = window.prompt(`Enter authorization reason to unlock Set ${setNum}:`, 'Referee score correction');
    if (!reason) return;

    const updatedSets = setsHistory.map((s) => {
      if (s.set === setNum) {
        return { ...s, isLocked: false };
      }
      return s;
    });

    setSetsHistory(updatedSets);
    setCurrentSetIndex(setNum);
    addToast(`Set ${setNum} unlocked for referee correction`, 'warning');
    syncToServer({ setsHistory: updatedSets });
  };

  // Undo Last Action
  const handleUndo = () => {
    if (historyStack.length === 0) {
      addToast('No point actions to undo', 'info');
      return;
    }

    const previous = historyStack[historyStack.length - 1];
    setScore1(previous.score1);
    setScore2(previous.score2);
    setActiveTurn(previous.activeTurn);
    setCurrentSetIndex(previous.currentSetIndex);
    setSetsHistory(previous.setsHistory);
    setHistoryStack((prev) => prev.slice(0, -1));
    addToast('Reverted last point action', 'info');
    syncToServer();
  };

  // Finish Match & Save Result
  const handleFinishMatch = async () => {
    const finalWinner = matchWinner || (setsWon1 >= setsWon2 ? match.team1 : match.team2);

    const completedData = {
      ...match,
      winner: finalWinner,
      score1: setsWon1,
      score2: setsWon2,
      setsHistory,
      format,
      completedAt: new Date().toISOString()
    };

    await coordinatorApi.completeMatch(match.id, completedData);

    addToast(`Match finished! Result saved to database. Winner: ${finalWinner}`, 'success');
    onClose();
  };



  // Declare Walkover
  const handleWalkover = async (winnerPlayer) => {
    if (window.confirm(`Declare walkover victory for ${winnerPlayer}?`)) {
      setMatchWinner(winnerPlayer);
      await coordinatorApi.completeMatch(match.id, {
        winner: winnerPlayer,
        isWalkover: true,
      });
      addToast(`Walkover declared! Winner: ${winnerPlayer}`, 'warning');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 dark:bg-[#070B14]/90 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto space-y-0 text-slate-900 dark:text-slate-200">
        
        {/* Top Header Bar Matching User Screenshot */}
        <div className="p-6 bg-slate-50 dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          
          {/* Left Player Sets Won */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">SETS WON</span>
            <span className="text-2xl font-black text-blue-600 dark:text-indigo-400 font-mono">{setsWon1}</span>
          </div>

          {/* Center Badge: Set X in Progress / Best of 5 Sets */}
          <div className="text-center space-y-1">
            <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white tracking-wide">
              Set {currentSetIndex} in Progress
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{format}</p>
          </div>

          {/* Right Player Sets Won */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">SETS WON</span>
            <span className="text-2xl font-black text-blue-600 dark:text-indigo-400 font-mono">{setsWon2}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition ml-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Cards Grid (Matching User Screenshot 1:1) */}
        <div className="p-6 bg-white dark:bg-[#0B1120] grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-slate-200 dark:border-slate-800">
          
          {/* Player 1 Card (Left) */}
          <div className="md:col-span-5 p-6 rounded-3xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-2xl flex flex-col items-center text-center space-y-4 relative">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{match.team1}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Roll: N/A</p>
            </div>

            {/* Large Point Counter */}
            <div className="text-7xl font-black text-slate-900 dark:text-white font-mono my-2 tracking-tighter">
              {score1}
            </div>


            {/* Point Action Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <button
                onClick={() => handlePointChange(1, -1)}
                className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-black text-sm transition shadow-inner cursor-pointer"
              >
                - Point
              </button>
              <button
                onClick={() => handlePointChange(1, 1)}
                className="py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 dark:shadow-indigo-600/30 transition cursor-pointer"
              >
                + Point
              </button>
            </div>
          </div>

          {/* Center Column: VS */}
          <div className="md:col-span-2 flex flex-col items-center justify-center space-y-3 py-2">
            <span className="text-sm font-black text-slate-400 dark:text-slate-500 tracking-widest">VS</span>
          </div>

          {/* Player 2 Card (Right) */}
          <div className="md:col-span-5 p-6 rounded-3xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-2xl flex flex-col items-center text-center space-y-4 relative">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{match.team2}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Roll: N/A</p>
            </div>

            {/* Large Point Counter */}
            <div className="text-7xl font-black text-slate-900 dark:text-white font-mono my-2 tracking-tighter">
              {score2}
            </div>

            {/* Point Action Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <button
                onClick={() => handlePointChange(2, -1)}
                className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-black text-sm transition shadow-inner cursor-pointer"
              >
                - Point
              </button>
              <button
                onClick={() => handlePointChange(2, 1)}
                className="py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 dark:shadow-indigo-600/30 transition cursor-pointer"
              >
                + Point
              </button>
            </div>
          </div>

        </div>

        {/* SET SCORES LOG Section */}
        <div className="p-6 bg-white dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">SET SCORES LOG</h4>

            <div className="space-y-2.5">
              {setsHistory.slice(0, maxSets).map((s) => (
                <div
                  key={s.set}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 text-xs"
                >

                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">Set {s.set} score:</span>
                    {s.isLocked ? (
                      <p className="text-blue-600 dark:text-indigo-400 font-mono font-bold text-sm">
                        {s.score1} - {s.score2} <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">({s.winner} won)</span>
                      </p>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 font-mono">
                        {s.set === currentSetIndex ? `${score1} - ${score2} (In Progress)` : '0-0'}
                      </p>
                    )}
                  </div>

                  <div>
                    {s.isLocked ? (
                      <button
                        onClick={() => handleUnlockSet(s.set)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Unlock Set
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setCurrentSetIndex(s.set);
                          handleLockSetConfirm();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-[#1E293B] hover:bg-indigo-600 dark:hover:bg-indigo-600 text-blue-700 dark:text-indigo-300 hover:text-white font-bold text-xs transition border border-blue-200 dark:border-slate-700 cursor-pointer"
                      >
                        Lock Set {s.set} Score ({score1}-{score2})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Toolbar */}
        <div className="p-6 bg-[#111827] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleUndo}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo Last Action
            </button>

            <button
              onClick={() => {
                setIsPaused(!isPaused);
                addToast(isPaused ? 'Match Resumed' : 'Match Paused', 'info');
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isPaused ? 'Resume Match' : 'Pause Match'}</span>
            </button>

            <button
              onClick={() => handleWalkover(match.team1)}
              className="px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 font-bold text-xs transition"
            >
              🏳 Declare Walkover
            </button>
          </div>

          <button
            onClick={handleFinishMatch}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4" /> Finish Match & Save Result
          </button>
        </div>

        {/* Set Win Dialog Confirmation */}
        {showLockDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl">
                🏆
              </div>
              <h4 className="text-base font-black text-white">{showLockDialog.winner} Won Set {showLockDialog.setNum}</h4>
              <p className="text-xs font-mono text-slate-400">Final Set Score: {showLockDialog.s1} - {showLockDialog.s2}</p>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowLockDialog(null)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLockSetConfirm}
                  className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Lock Set
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
