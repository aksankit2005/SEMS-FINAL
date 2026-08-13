import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, Pause, Play, Trophy, ShieldAlert, CheckCircle2, Lock, Unlock, AlertCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';

export const LiveMatchScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {
  const { addToast } = useToast();

  const isChess = (
    (match?.sportId || '').toLowerCase() === 'chess' ||
    (match?.sportName || '').toLowerCase() === 'chess' ||
    (match?.eventTitle || '').toLowerCase().includes('chess') ||
    (match?.title || '').toLowerCase().includes('chess')
  );

  const isKabaddi = (
    (match?.sportId || '').toLowerCase() === 'kabaddi' ||
    (match?.sportName || '').toLowerCase() === 'kabaddi' ||
    (match?.assignedSport || '').toLowerCase() === 'kabaddi' ||
    (match?.eventTitle || '').toLowerCase().includes('kabaddi') ||
    (match?.title || '').toLowerCase().includes('kabaddi')
  );

  const isKhoKho = (
    (match?.sportId || '').toLowerCase() === 'kho-kho' ||
    (match?.sportId || '').toLowerCase() === 'kho_kho' ||
    (match?.sportName || '').toLowerCase().includes('kho') ||
    (match?.assignedSport || '').toLowerCase().includes('kho') ||
    (match?.eventTitle || '').toLowerCase().includes('kho') ||
    (match?.title || '').toLowerCase().includes('kho')
  );

  // Lock background scrolling & hide navbar/sidebar behind modal via portal & body overflow
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // State specifically for Chess
  const [selectedChessResult, setSelectedChessResult] = useState('team1');
  const [chessReason, setChessReason] = useState('Checkmate');

  // Kabaddi Default Rosters & Per-Player Stats (Initially All 0)
  const defaultKabaddiTeam1 = [
    { id: 1, name: 'Player A', jersey: '07', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 2, name: 'Player B', jersey: '12', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 3, name: 'Player C', jersey: '03', position: 'All Rounder', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 4, name: 'Player D', jersey: '05', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 5, name: 'Player E', jersey: '09', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 6, name: 'Player F', jersey: '11', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 7, name: 'Player G', jersey: '04', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
  ];

  const defaultKabaddiTeam2 = [
    { id: 1, name: 'Player 1', jersey: '01', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 2, name: 'Player 2', jersey: '02', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 3, name: 'Player 3', jersey: '10', position: 'All Rounder', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 4, name: 'Player 4', jersey: '08', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 5, name: 'Player 5', jersey: '06', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 6, name: 'Player 6', jersey: '14', position: 'Defender', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
    { id: 7, name: 'Player 7', jersey: '15', position: 'Raider', raidPts: 0, tacklePts: 0, bonusPts: 0, superRaid: 0, superTackle: 0, total: 0 },
  ];

  const [playerStats1, setPlayerStats1] = useState(() => match?.playerStats1 || defaultKabaddiTeam1);
  const [playerStats2, setPlayerStats2] = useState(() => match?.playerStats2 || defaultKabaddiTeam2);

  // States for general set-based sports
  const [format, setFormat] = useState(match?.format || (isKhoKho ? '2 Innings / 2 Sets' : 'Best of 5 Sets'));
  const [maxSets, setMaxSets] = useState(() => match?.maxSets || (isKhoKho ? 2 : format === 'Best of 3 Sets' ? 3 : 5));
  const targetSetsToWin = isKhoKho ? 2 : format === 'Best of 3 Sets' ? 2 : 3;

  const [score1, setScore1] = useState(() => {
    if (isKabaddi && playerStats1 && playerStats1.length > 0) {
      return playerStats1.reduce((sum, p) => sum + (p.total || 0), 0);
    }
    return match?.score1 || 0;
  });

  const [score2, setScore2] = useState(() => {
    if (isKabaddi && playerStats2 && playerStats2.length > 0) {
      return playerStats2.reduce((sum, p) => sum + (p.total || 0), 0);
    }
    return match?.score2 || 0;
  });

  const [activeTurn, setActiveTurn] = useState(match?.activeTurn || 1);
  const [currentSetIndex, setCurrentSetIndex] = useState(match?.currentSet || 1);
  const [isPaused, setIsPaused] = useState(match?.isPaused || false);

  const [setsHistory, setSetsHistory] = useState(
    match?.setsHistory || (isKhoKho ? [
      { set: 1, label: 'Set 1 (Inning 1)', score1: 0, score2: 0, isLocked: false, winner: null },
      { set: 2, label: 'Set 2 (Inning 2)', score1: 0, score2: 0, isLocked: false, winner: null },
    ] : [
      { set: 1, score1: 0, score2: 0, isLocked: false, winner: null },
      { set: 2, score1: 0, score2: 0, isLocked: false, winner: null },
      { set: 3, score1: 0, score2: 0, isLocked: false, winner: null },
      { set: 4, score1: 0, score2: 0, isLocked: false, winner: null },
      { set: 5, score1: 0, score2: 0, isLocked: false, winner: null },
    ])
  );

  const [historyStack, setHistoryStack] = useState([]);
  const [showLockDialog, setShowLockDialog] = useState(null);
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
      playerStats1,
      playerStats2,
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

  // Kabaddi Per-Player Stat Action Change
  const handleKabaddiStatChange = (teamNum, playerId, statType, delta) => {
    if (matchWinner) return;
    saveStateToUndo();

    const updateRoster = (roster) =>
      roster.map((p) => {
        if (p.id === playerId) {
          let raidPts = p.raidPts || 0;
          let tacklePts = p.tacklePts || 0;
          let bonusPts = p.bonusPts || 0;
          let superRaid = p.superRaid || 0;
          let superTackle = p.superTackle || 0;

          if (statType === 'raidPts') raidPts = Math.max(0, raidPts + delta);
          if (statType === 'tacklePts') tacklePts = Math.max(0, tacklePts + delta);
          if (statType === 'bonusPts') bonusPts = Math.max(0, bonusPts + delta);
          if (statType === 'superRaid') {
            superRaid = Math.max(0, superRaid + delta);
            if (delta > 0) raidPts += 3;
            else raidPts = Math.max(0, raidPts - 3);
          }
          if (statType === 'superTackle') {
            superTackle = Math.max(0, superTackle + delta);
            if (delta > 0) tacklePts += 2;
            else tacklePts = Math.max(0, tacklePts - 2);
          }

          const total = raidPts + tacklePts + bonusPts;

          return { ...p, raidPts, tacklePts, bonusPts, superRaid, superTackle, total };
        }
        return p;
      });

    let newStats1 = playerStats1;
    let newStats2 = playerStats2;

    if (teamNum === 1) {
      newStats1 = updateRoster(playerStats1);
      setPlayerStats1(newStats1);
    } else {
      newStats2 = updateRoster(playerStats2);
      setPlayerStats2(newStats2);
    }

    const newScore1 = newStats1.reduce((sum, p) => sum + (p.total || 0), 0);
    const newScore2 = newStats2.reduce((sum, p) => sum + (p.total || 0), 0);

    setScore1(newScore1);
    setScore2(newScore2);

    syncToServer({
      score1: newScore1,
      score2: newScore2,
      playerStats1: newStats1,
      playerStats2: newStats2,
    });
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

  // Add Extra Set / Tie-Breaker
  const handleAddExtraSet = () => {
    const nextSetNum = setsHistory.length + 1;
    const newSetLabel = isKhoKho 
      ? `Set ${nextSetNum} (Extra Turn Tie-Breaker)`
      : `Set ${nextSetNum} (Extra Set Tie-Breaker)`;

    const newSet = { set: nextSetNum, label: newSetLabel, score1: 0, score2: 0, isLocked: false, winner: null };
    const updatedSets = [...setsHistory, newSet];

    setSetsHistory(updatedSets);
    setMaxSets(nextSetNum);
    setCurrentSetIndex(nextSetNum);
    setScore1(0);
    setScore2(0);
    setMatchWinner(null);
    addToast(`➕ Added Extra Set ${nextSetNum} for Tie-Breaker! Set ${nextSetNum} active from 0-0.`, 'success');
    syncToServer({ maxSets: nextSetNum, setsHistory: updatedSets, currentSet: nextSetNum, score1: 0, score2: 0 });
  };

  // Handle + Point / - Point
  const handlePointChange = (player, delta) => {
    if (matchWinner) return;

    saveStateToUndo();

    let newS1 = score1;
    let newS2 = score2;

    if (player === 1) {
      newS1 = Math.max(0, score1 + delta);
      setScore1(newS1);
    } else {
      newS2 = Math.max(0, score2 + delta);
      setScore2(newS2);
    }

    const updatedSets = setsHistory.map((s) => {
      if (s.set === currentSetIndex) {
        return { ...s, score1: newS1, score2: newS2 };
      }
      return s;
    });
    setSetsHistory(updatedSets);

    syncToServer({ score1: newS1, score2: newS2, setsHistory: updatedSets });
  };

  // Lock Set Action
  const handleLockSetConfirm = (targetSetIndex = currentSetIndex) => {
    const s1 = targetSetIndex === currentSetIndex ? score1 : (setsHistory.find((s) => s.set === targetSetIndex)?.score1 || 0);
    const s2 = targetSetIndex === currentSetIndex ? score2 : (setsHistory.find((s) => s.set === targetSetIndex)?.score2 || 0);

    if (!showLockDialog && !window.confirm(`Lock Set ${targetSetIndex} score (${s1}-${s2})?`)) return;

    const winner = showLockDialog ? showLockDialog.winner : (s1 > s2 ? match.team1 : s2 > s1 ? match.team2 : 'TIE');

    const updatedSets = setsHistory.map((s) => {
      if (s.set === targetSetIndex) {
        return { ...s, score1: s1, score2: s2, isLocked: true, winner };
      }
      return s;
    });

    setSetsHistory(updatedSets);

    const newSetsWon1 = updatedSets.filter((s) => s.isLocked && s.winner === match?.team1).length;
    const newSetsWon2 = updatedSets.filter((s) => s.isLocked && s.winner === match?.team2).length;

    setShowLockDialog(null);

    if (isKhoKho) {
      const totP1 = updatedSets.reduce((sum, s) => sum + (s.score1 || 0), 0);
      const totP2 = updatedSets.reduce((sum, s) => sum + (s.score2 || 0), 0);

      if (targetSetIndex >= maxSets) {
        if (totP1 === totP2) {
          addToast(`⚖️ KHO-KHO MATCH TIED (${totP1} - ${totP2})! Click "➕ Add Extra Set / Tie-Breaker" below to play Set ${maxSets + 1}.`, 'warning');
        } else {
          const winnerTeam = totP1 > totP2 ? match.team1 : match.team2;
          setMatchWinner(winnerTeam);
          addToast(`🏆 ${winnerTeam} WON THE KHO-KHO MATCH (${totP1} - ${totP2})!`, 'success');
        }
      } else {
        const nextIndex = targetSetIndex + 1;
        setCurrentSetIndex(nextIndex);
        setScore1(0);
        setScore2(0);
        addToast(`Set ${targetSetIndex} locked (${s1}-${s2}). Starting Set ${nextIndex} from 0-0!`, 'success');
      }
    } else {
      if (newSetsWon1 >= targetSetsToWin) {
        setMatchWinner(match.team1);
        addToast(`🏆 ${match.team1} WON THE MATCH (${newSetsWon1} - ${newSetsWon2})!`, 'success');
      } else if (newSetsWon2 >= targetSetsToWin) {
        setMatchWinner(match.team2);
        addToast(`🏆 ${match.team2} WON THE MATCH (${newSetsWon2} - ${newSetsWon1})!`, 'success');
      } else {
        if (targetSetIndex < maxSets) {
          const nextIndex = targetSetIndex + 1;
          setCurrentSetIndex(nextIndex);
          setScore1(0);
          setScore2(0);
          addToast(`Set ${targetSetIndex} locked (${winner} won). Starting Set ${nextIndex} from 0-0!`, 'success');
        }
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

  // Reset Match Action
  const handleResetMatch = () => {
    if (window.confirm('Reset current match scores and sets history?')) {
      saveStateToUndo();
      setScore1(0);
      setScore2(0);
      setMatchWinner(null);
      setCurrentSetIndex(1);
      const resetSets = [
        { set: 1, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 2, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 3, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 4, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 5, score1: 0, score2: 0, isLocked: false, winner: null },
      ];
      setSetsHistory(resetSets);
      addToast('Match scorecard reset to 0-0', 'info');
      syncToServer({ score1: 0, score2: 0, currentSet: 1, setsHistory: resetSets, setsWon1: 0, setsWon2: 0 });
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

    setScore1(previousState.score1);
    setScore2(previousState.score2);
    setActiveTurn(previousState.activeTurn);
    setCurrentSetIndex(previousState.currentSetIndex);
    setSetsHistory(previousState.setsHistory);
    setMatchWinner(null);

    addToast('Undo last scoring action', 'info');
    syncToServer(previousState);
  };

  // Declare Walkover / Disqualification Action
  const handleDeclareWalkover = () => {
    const winnerPlayer = window.prompt(
      `Declare Walkover / Disqualification winner:\n1: ${match.team1}\n2: ${match.team2}`,
      match.team1
    );
    if (winnerPlayer) {
      setMatchWinner(winnerPlayer);
      syncToServer({ winner: winnerPlayer, status: 'WALKOVER' });
      addToast(`Walkover declared! Winner: ${winnerPlayer}`, 'warning');
      onClose();
    }
  };

  // Finish Match Action directly for Chess
  const handleFinishChessMatch = async () => {
    let winnerName = match?.team1 || 'Player 1 (White)';
    let scoreText = '1 - 0';
    let s1 = 1;
    let s2 = 0;

    if (selectedChessResult === 'team2') {
      winnerName = match?.team2 || 'Player 2 (Black)';
      scoreText = '0 - 1';
      s1 = 0;
      s2 = 1;
    } else if (selectedChessResult === 'draw') {
      winnerName = 'Draw (½ - ½)';
      scoreText = '½ - ½';
      s1 = 0.5;
      s2 = 0.5;
    }

    const matchId = match?.id || `M${Math.floor(100000 + Math.random() * 900000)}`;

    const completedObj = {
      ...match,
      id: matchId,
      winner: winnerName,
      score1: s1,
      score2: s2,
      scoreSummary: `Result: ${scoreText} (${chessReason})`,
      resultNote: chessReason,
      status: 'COMPLETED',
      tableNumber: null,
      isLiveStreaming: false,
      completedAt: new Date().toISOString(),
    };

    try {
      await coordinatorApi.completeMatch(matchId, completedObj);

      // Save directly to sems_completed_results_chess key in localStorage so it appears in Declare Results tab immediately
      const resultsKey = 'sems_completed_results_chess';
      const existingStr = localStorage.getItem(resultsKey);
      let existingList = [];
      if (existingStr) {
        try { existingList = JSON.parse(existingStr); } catch (e) { }
      }
      existingList = [completedObj, ...existingList.filter((item) => item.id !== matchId)];
      localStorage.setItem(resultsKey, JSON.stringify(existingList));
      window.dispatchEvent(new Event('sems_results_updated'));

      try {
        generateMatchResultPDF(completedObj, 'Chess');
      } catch (pdfErr) {
        console.warn('PDF export fallback:', pdfErr);
      }
      if (onMatchUpdated) {
        onMatchUpdated(matchId, {
          status: 'COMPLETED',
          scoreSummary: completedObj.scoreSummary,
          winner: winnerName,
          score1: s1,
          score2: s2,
        });
      }
      addToast(`🏆 Chess Match Finished! Winner: ${winnerName} (${scoreText})`, 'success');
      onClose();
    } catch (err) {
      console.error('Error finishing chess match:', err);
      addToast('Error finishing chess match. Please try again.', 'error');
    }
  };

  // Finish Match Action directly from Controller for Sets Sports
  const handleFinishMatch = async () => {
    const defaultTeam1 = match?.team1 || 'Player 1';
    const defaultTeam2 = match?.team2 || 'Player 2';

    const calculatedSetsWon1 = setsHistory.filter((s) => s.winner === match?.team1 || (s.score1 > 0 && s.score1 > s.score2)).length;
    const calculatedSetsWon2 = setsHistory.filter((s) => s.winner === match?.team2 || (s.score2 > 0 && s.score2 > s.score1)).length;

    const winnerName = matchWinner || (calculatedSetsWon1 >= calculatedSetsWon2 ? (score1 >= score2 ? defaultTeam1 : defaultTeam2) : defaultTeam2);
    if (!window.confirm(`Finish match and declare winner as "${winnerName}"?`)) return;

    const matchId = match?.id || `M${Math.floor(100000 + Math.random() * 900000)}`;

    const setsBreakdownStr = setsHistory
      .filter((s) => s.score1 > 0 || s.score2 > 0)
      .map((s) => `S${s.set}: ${s.score1}-${s.score2}`)
      .join(', ');

    const scoreSummary = `${calculatedSetsWon1} - ${calculatedSetsWon2} Sets${setsBreakdownStr ? ` (${setsBreakdownStr})` : ` (${score1}-${score2} Pts)`}`;

    const completedObj = {
      ...match,
      id: matchId,
      winner: winnerName,
      score1,
      score2,
      setsWon1: calculatedSetsWon1,
      setsWon2: calculatedSetsWon2,
      setsHistory,
      playerStats1,
      playerStats2,
      scoreSummary,
      status: 'COMPLETED',
      tableNumber: null,
      isLiveStreaming: false,
      completedAt: new Date().toISOString(),
    };

    try {
      await coordinatorApi.completeMatch(matchId, completedObj);
      try {
        generateMatchResultPDF(completedObj, match?.sportName || 'Badminton');
      } catch (pdfErr) {
        console.warn('PDF export fallback:', pdfErr);
      }
      if (onMatchUpdated) onMatchUpdated(matchId, { status: 'COMPLETED', scoreSummary, setsWon1: calculatedSetsWon1, setsWon2: calculatedSetsWon2, winner: winnerName });
      addToast(`🏆 Match Finished! Winner: ${winnerName}. Saved to Results section.`, 'success');
      onClose();
    } catch (err) {
      console.error('Error finishing match:', err);
      addToast('Error finishing match. Please try again.', 'error');
    }
  };

  // ─── DEDICATED CHESS WINNER SELECTION MODAL ─────────────────────────
  if (isChess) {
    const player1 = match?.team1 || 'Player 1 (White)';
    const player2 = match?.team2 || 'Player 2 (Black)';

    return createPortal(
      <div className="fixed inset-0 z-[99999] bg-slate-900/60 dark:bg-[#070B14]/95 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-4 overflow-y-auto animate-fade-in font-sans transition-colors">
        <div className="w-full max-w-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar text-slate-900 dark:text-slate-200 relative mt-0 mb-10 flex flex-col justify-between">

          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-20 p-5 sm:p-6 bg-slate-50/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                ♟️ CHESS LIVE MATCH CONTROLLER
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Match Venue: {venueName || match?.tableNumber || 'Table 1'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Players Card Overview */}
          <div className="p-6 bg-white dark:bg-[#0B1120] space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">

              {/* White Player */}
              <div className="sm:col-span-5 space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  ⚪ WHITE PIECES
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                  {player1}
                </h4>
              </div>

              {/* VS */}
              <div className="sm:col-span-1 text-xs font-black text-slate-400">
                VS
              </div>

              {/* Black Player */}
              <div className="sm:col-span-5 space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  ⚫ BLACK PIECES
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                  {player2}
                </h4>
              </div>
            </div>

            {/* Winner Outcome Selector (No point scores & no sets) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Select Match Winner / Result <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                {/* White Wins (1 - 0) */}
                <button
                  type="button"
                  onClick={() => setSelectedChessResult('team1')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${selectedChessResult === 'team1'
                      ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/30'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-500/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">⚪ White Wins</span>
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">1 - 0</span>
                  </div>
                  <p className="text-[11px] font-bold truncate">{player1}</p>
                </button>

                {/* Draw (½ - ½) */}
                <button
                  type="button"
                  onClick={() => setSelectedChessResult('draw')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${selectedChessResult === 'draw'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-300 ring-2 ring-amber-500/30'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">🤝 Match Draw</span>
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">½ - ½</span>
                  </div>
                  <p className="text-[11px] font-bold truncate">Split Points (½ Point Each)</p>
                </button>

                {/* Black Wins (0 - 1) */}
                <button
                  type="button"
                  onClick={() => setSelectedChessResult('team2')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${selectedChessResult === 'team2'
                      ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/30'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-500/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">⚫ Black Wins</span>
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">0 - 1</span>
                  </div>
                  <p className="text-[11px] font-bold truncate">{player2}</p>
                </button>

              </div>
            </div>

            {/* Termination Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Termination Reason / Result Type
              </label>
              <select
                value={chessReason}
                onChange={(e) => setChessReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Checkmate">👑 Checkmate</option>
                <option value="Clock Flag Fall (Time Out)">⏱️ Clock Flag Fall (Time Out)</option>
                <option value="Resignation">🏳️ Resignation</option>
                <option value="Stalemate / Agreement">🤝 Stalemate / Mutual Agreement</option>
                <option value="Illegal Move Penalty">⚠️ Illegal Move Penalty</option>
              </select>
            </div>

          </div>

          {/* Bottom Actions Bar */}
          <div className="p-6 bg-slate-50 dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleFinishChessMatch}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Finish Match & Save Result</span>
            </button>
          </div>

        </div>
      </div>,
      document.body
    );
  }

  // ─── GENERAL SET-BASED SPORTS SCORES CONTROLLER ─────────────────────
  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 dark:bg-[#070B14]/95 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-4 overflow-y-auto animate-fade-in font-sans transition-colors">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar text-slate-900 dark:text-slate-200 relative mt-0 mb-10 flex flex-col justify-between">

        {/* Sticky Top Header Bar */}
        <div className="sticky top-0 z-20 p-5 sm:p-6 bg-slate-50/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">

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

        {/* Player Cards Grid */}
        <div className="p-6 bg-white dark:bg-[#0B1120] grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-slate-200 dark:border-slate-800">

          {/* Player 1 Card (Left) */}
          <div className="md:col-span-5 p-6 rounded-3xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-2xl flex flex-col items-center text-center space-y-4 relative">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {(match.team1 || '').replace(/\s*\(.*?\)/, '')}
              </h2>
              {match.college1 && <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{match.college1}</p>}
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {(match.team2 || '').replace(/\s*\(.*?\)/, '')}
              </h2>
              {match.college2 && <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{match.college2}</p>}
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

        {/* KABADDI DETAILED PER-PLAYER SCORING CONTROLLER & SCORE SHEET */}
        {isKabaddi && (
          <div className="p-6 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  🤼 KABADDI PER-PLAYER SCORING & SCORE SHEET
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  Team & Player Details Score Sheet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click point buttons to award Raid Pts, Tackle Pts, Bonus, Super Raid, or Super Tackle to individual players in real-time.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Team 1 Score Table */}
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-amber-500/10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-black text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {match.team1 || 'Team A'} Player Details
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Total Team Points: <strong className="text-amber-600 dark:text-amber-400 text-sm">{score1} PTS</strong>
                  </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase font-bold">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">Player</th>
                        <th className="px-3 py-2.5">Jersey No.</th>
                        <th className="px-3 py-2.5">Position</th>
                        <th className="px-3 py-2.5 text-center">Raid Pts</th>
                        <th className="px-3 py-2.5 text-center">Tackle Pts</th>
                        <th className="px-3 py-2.5 text-center">Bonus</th>
                        <th className="px-3 py-2.5 text-center">Super Raid</th>
                        <th className="px-3 py-2.5 text-center">Super Tackle</th>
                        <th className="px-3 py-2.5 text-center">Total</th>
                        <th className="px-3 py-2.5 text-center">Point Actions (+ / -)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {playerStats1.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                          <td className="px-3 py-2 font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-white whitespace-nowrap">{p.name}</td>
                          <td className="px-3 py-2 font-mono font-bold text-amber-600 dark:text-amber-400">#{p.jersey}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">{p.position}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{p.raidPts || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.tacklePts || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-purple-600 dark:text-purple-400">{p.bonusPts || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-amber-500">{p.superRaid || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-rose-500">{p.superTackle || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-black text-sm text-slate-900 dark:text-white">{p.total || 0}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {/* Raid */}
                              <div className="flex items-center rounded-lg bg-blue-500/10 border border-blue-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'raidPts', -1)} className="px-1.5 py-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Raid Pt">-</button>
                                <span className="px-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">Raid</span>
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'raidPts', 1)} className="px-1.5 py-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Raid Pt">+</button>
                              </div>
                              {/* Tackle */}
                              <div className="flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'tacklePts', -1)} className="px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Tackle Pt">-</button>
                                <span className="px-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Tackle</span>
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'tacklePts', 1)} className="px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Tackle Pt">+</button>
                              </div>
                              {/* Bonus */}
                              <div className="flex items-center rounded-lg bg-purple-500/10 border border-purple-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'bonusPts', -1)} className="px-1.5 py-0.5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Bonus Pt">-</button>
                                <span className="px-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">Bonus</span>
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'bonusPts', 1)} className="px-1.5 py-0.5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Bonus Pt">+</button>
                              </div>
                              {/* S.Raid */}
                              <div className="flex items-center rounded-lg bg-amber-500/10 border border-amber-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'superRaid', -1)} className="px-1.5 py-0.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Super Raid">-</button>
                                <span className="px-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">S.Raid</span>
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'superRaid', 1)} className="px-1.5 py-0.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Super Raid (+3 Pts)">+</button>
                              </div>
                              {/* S.Tackle */}
                              <div className="flex items-center rounded-lg bg-rose-500/10 border border-rose-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'superTackle', -1)} className="px-1.5 py-0.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Super Tackle">-</button>
                                <span className="px-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">S.Tackle</span>
                                <button onClick={() => handleKabaddiStatChange(1, p.id, 'superTackle', 1)} className="px-1.5 py-0.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Super Tackle (+2 Pts)">+</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Team 2 Score Table */}
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-amber-500/10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-black text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {match.team2 || 'Team B'} Player Details
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Total Team Points: <strong className="text-amber-600 dark:text-amber-400 text-sm">{score2} PTS</strong>
                  </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase font-bold">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">Player</th>
                        <th className="px-3 py-2.5">Jersey No.</th>
                        <th className="px-3 py-2.5">Position</th>
                        <th className="px-3 py-2.5 text-center">Raid Pts</th>
                        <th className="px-3 py-2.5 text-center">Tackle Pts</th>
                        <th className="px-3 py-2.5 text-center">Bonus</th>
                        <th className="px-3 py-2.5 text-center">Super Raid</th>
                        <th className="px-3 py-2.5 text-center">Super Tackle</th>
                        <th className="px-3 py-2.5 text-center">Total</th>
                        <th className="px-3 py-2.5 text-center">Point Actions (+ / -)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {playerStats2.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                          <td className="px-3 py-2 font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-white whitespace-nowrap">{p.name}</td>
                          <td className="px-3 py-2 font-mono font-bold text-amber-600 dark:text-amber-400">#{p.jersey}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">{p.position}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{p.raidPts || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.tacklePts || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-purple-600 dark:text-purple-400">{p.bonusPts || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-amber-500">{p.superRaid || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-rose-500">{p.superTackle || 0}</td>
                          <td className="px-3 py-2 text-center font-mono font-black text-sm text-slate-900 dark:text-white">{p.total || 0}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {/* Raid */}
                              <div className="flex items-center rounded-lg bg-blue-500/10 border border-blue-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'raidPts', -1)} className="px-1.5 py-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Raid Pt">-</button>
                                <span className="px-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">Raid</span>
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'raidPts', 1)} className="px-1.5 py-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Raid Pt">+</button>
                              </div>
                              {/* Tackle */}
                              <div className="flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'tacklePts', -1)} className="px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Tackle Pt">-</button>
                                <span className="px-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Tackle</span>
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'tacklePts', 1)} className="px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Tackle Pt">+</button>
                              </div>
                              {/* Bonus */}
                              <div className="flex items-center rounded-lg bg-purple-500/10 border border-purple-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'bonusPts', -1)} className="px-1.5 py-0.5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Bonus Pt">-</button>
                                <span className="px-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">Bonus</span>
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'bonusPts', 1)} className="px-1.5 py-0.5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Bonus Pt">+</button>
                              </div>
                              {/* S.Raid */}
                              <div className="flex items-center rounded-lg bg-amber-500/10 border border-amber-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'superRaid', -1)} className="px-1.5 py-0.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Super Raid">-</button>
                                <span className="px-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">S.Raid</span>
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'superRaid', 1)} className="px-1.5 py-0.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Super Raid (+3 Pts)">+</button>
                              </div>
                              {/* S.Tackle */}
                              <div className="flex items-center rounded-lg bg-rose-500/10 border border-rose-500/20 p-0.5">
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'superTackle', -1)} className="px-1.5 py-0.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs rounded transition cursor-pointer" title="Reduce Super Tackle">-</button>
                                <span className="px-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">S.Tackle</span>
                                <button onClick={() => handleKabaddiStatChange(2, p.id, 'superTackle', 1)} className="px-1.5 py-0.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs rounded transition cursor-pointer" title="Add Super Tackle (+2 Pts)">+</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SET SCORES LOG Section */}
        <div className="p-6 bg-white dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">SET SCORES LOG</h4>
              <button
                type="button"
                onClick={handleAddExtraSet}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <span>➕ Add Extra Set / Tie-Breaker (Set {setsHistory.length + 1})</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {setsHistory.slice(0, maxSets).map((s) => (
                <div
                  key={s.set}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs transition ${
                    s.set === currentSetIndex
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-white dark:bg-[#090D16] border-slate-200 dark:border-slate-800'
                  }`}
                >

                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {s.label || `Set ${s.set}`} score:
                    </span>
                    {s.isLocked ? (
                      <p className="text-blue-600 dark:text-indigo-400 font-mono font-bold text-sm">
                        {s.score1} - {s.score2} <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">({s.winner || 'Completed'})</span>
                      </p>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 font-mono">
                        {s.set === currentSetIndex ? `${score1} - ${score2} (Active In Progress)` : '0 - 0 (Waiting)'}
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
                          handleLockSetConfirm(s.set);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-[#1E293B] hover:bg-indigo-600 dark:hover:bg-indigo-600 text-blue-700 dark:text-indigo-300 hover:text-white font-bold text-xs transition border border-blue-200 dark:border-slate-700 cursor-pointer"
                      >
                        Lock Set {s.set} Score ({s.set === currentSetIndex ? score1 : (s.score1 || 0)}-{s.set === currentSetIndex ? score2 : (s.score2 || 0)})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Control Actions (Undo, Reset, Pause, Finish Match) */}
        <div className="p-6 bg-slate-50 dark:bg-[#111827] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" /> Undo Point
            </button>

            <button
              onClick={handleTogglePause}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume Match' : 'Pause Match'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFinishMatch}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>🏁 Finish Match</span>
            </button>

            <button
              onClick={handleDeclareWalkover}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> W.O.
            </button>

            <button
              onClick={handleResetMatch}
              className="px-3.5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Reset 0-0
            </button>
          </div>
        </div>

        {/* Lock Set Confirmation Dialog Popup */}
        {showLockDialog && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-xl">
                🔒
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">Confirm Set Winner</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lock Set {showLockDialog.setNum} with winner <span className="font-bold text-slate-900 dark:text-white">{showLockDialog.winner}</span>?
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowLockDialog(null)}
                  className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLockSetConfirm}
                  className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                >
                  Lock Set
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
