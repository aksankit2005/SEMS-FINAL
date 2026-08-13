import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, Trophy, Maximize2, Minimize2, Plus, Flag, Award } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';

export const KabaddiLiveScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {
  const { addToast } = useToast();

  const team1Name = match?.team1 || 'MPEC';
  const team2Name = match?.team2 || 'MIPS';

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

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const defaultZeroStats = { raid: 0, tackle: 0, bonus: 0, superTackle: 0, superRaid: 0 };

  const [half, setHalf] = useState(match?.half || 1);
  const [completedHalf1, setCompletedHalf1] = useState(Boolean(match?.completedHalf1));

  // 1st Half Scores & Stats
  const [half1Score1, setHalf1Score1] = useState(match?.half1Score1 !== undefined ? match.half1Score1 : 0);
  const [half1Score2, setHalf1Score2] = useState(match?.half1Score2 !== undefined ? match.half1Score2 : 0);
  const [half1Stats1, setHalf1Stats1] = useState(match?.half1Stats1 || defaultZeroStats);
  const [half1Stats2, setHalf1Stats2] = useState(match?.half1Stats2 || defaultZeroStats);

  // 2nd Half Scores & Stats (Start from 0 when Half 2 starts)
  const [half2Score1, setHalf2Score1] = useState(match?.half2Score1 !== undefined ? match.half2Score1 : 0);
  const [half2Score2, setHalf2Score2] = useState(match?.half2Score2 !== undefined ? match.half2Score2 : 0);
  const [half2Stats1, setHalf2Stats1] = useState(match?.half2Stats1 || defaultZeroStats);
  const [half2Stats2, setHalf2Stats2] = useState(match?.half2Stats2 || defaultZeroStats);

  const [historyStack, setHistoryStack] = useState([]);

  // Active current half values
  const activeScore1 = half === 1 ? half1Score1 : half2Score1;
  const activeScore2 = half === 1 ? half1Score2 : half2Score2;
  const activeStats1 = half === 1 ? half1Stats1 : half2Stats1;
  const activeStats2 = half === 1 ? half1Stats2 : half2Stats2;

  // Overall Total Match Scores (Carry over continuously from Half 1 to Half 2)
  const totalScore1 = half === 1 ? half1Score1 : half2Score1;
  const totalScore2 = half === 1 ? half1Score2 : half2Score2;

  const totalStats1 = half === 1 ? half1Stats1 : half2Stats1;
  const totalStats2 = half === 1 ? half1Stats2 : half2Stats2;

  const syncToServer = async (
    h = half,
    c1 = completedHalf1,
    h1s1 = half1Score1,
    h1s2 = half1Score2,
    h1st1 = half1Stats1,
    h1st2 = half1Stats2,
    h2s1 = half2Score1,
    h2s2 = half2Score2,
    h2st1 = half2Stats1,
    h2st2 = half2Stats2
  ) => {
    const totS1 = h === 1 ? h1s1 : h2s1;
    const totS2 = h === 1 ? h1s2 : h2s2;

    const totSt1 = h === 1 ? h1st1 : h2st1;
    const totSt2 = h === 1 ? h1st2 : h2st2;

    const payload = {
      score1: totS1,
      score2: totS2,
      half: h,
      completedHalf1: c1,
      half1Score1: h1s1,
      half1Score2: h1s2,
      half1Stats1: h1st1,
      half1Stats2: h1st2,
      half2Score1: h2s1,
      half2Score2: h2s2,
      half2Stats1: h2st1,
      half2Stats2: h2st2,
      kabaddiStats1: totSt1,
      kabaddiStats2: totSt2,
      status: 'running',
    };

    try {
      await coordinatorApi.updateMatchScoring(match.id, payload);
      if (onMatchUpdated) onMatchUpdated(match.id, payload);
    } catch (err) {
      console.warn('Error syncing Kabaddi score state to server', err);
    }
  };

  const pushUndoState = () => {
    setHistoryStack((prev) => [
      ...prev,
      {
        half,
        completedHalf1,
        half1Score1,
        half1Score2,
        half1Stats1: { ...half1Stats1 },
        half1Stats2: { ...half1Stats2 },
        half2Score1,
        half2Score2,
        half2Stats1: { ...half2Stats1 },
        half2Stats2: { ...half2Stats2 },
      },
    ]);
  };

  const handleUndo = (teamNum) => {
    if (historyStack.length === 0) {
      addToast('Nothing to undo', 'info');
      return;
    }

    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((stack) => stack.slice(0, stack.length - 1));

    setHalf(prev.half);
    setCompletedHalf1(prev.completedHalf1);
    setHalf1Score1(prev.half1Score1);
    setHalf1Score2(prev.half1Score2);
    setHalf1Stats1(prev.half1Stats1);
    setHalf1Stats2(prev.half1Stats2);
    setHalf2Score1(prev.half2Score1);
    setHalf2Score2(prev.half2Score2);
    setHalf2Stats1(prev.half2Stats1);
    setHalf2Stats2(prev.half2Stats2);

    syncToServer(
      prev.half,
      prev.completedHalf1,
      prev.half1Score1,
      prev.half1Score2,
      prev.half1Stats1,
      prev.half1Stats2,
      prev.half2Score1,
      prev.half2Score2,
      prev.half2Stats1,
      prev.half2Stats2
    );
    addToast(`Reverted last action for ${teamNum === 1 ? team1Name : team2Name}`, 'info');
  };

  const handlePointAction = (teamNum, actionType, pts) => {
    pushUndoState();

    if (half === 1) {
      if (teamNum === 1) {
        const nS1 = Math.max(0, half1Score1 + pts);
        const nSt1 = { ...half1Stats1 };
        if (actionType === 'raid') nSt1.raid = Math.max(0, nSt1.raid + 1);
        if (actionType === 'tackle') nSt1.tackle = Math.max(0, nSt1.tackle + 1);
        if (actionType === 'bonus') nSt1.bonus = Math.max(0, nSt1.bonus + 1);
        if (actionType === 'superTackle') nSt1.superTackle = Math.max(0, nSt1.superTackle + 1);
        if (actionType === 'superRaid') nSt1.superRaid = Math.max(0, nSt1.superRaid + 1);

        setHalf1Score1(nS1);
        setHalf1Stats1(nSt1);
        syncToServer(1, completedHalf1, nS1, half1Score2, nSt1, half1Stats2, half2Score1, half2Score2, half2Stats1, half2Stats2);
      } else {
        const nS2 = Math.max(0, half1Score2 + pts);
        const nSt2 = { ...half1Stats2 };
        if (actionType === 'raid') nSt2.raid = Math.max(0, nSt2.raid + 1);
        if (actionType === 'tackle') nSt2.tackle = Math.max(0, nSt2.tackle + 1);
        if (actionType === 'bonus') nSt2.bonus = Math.max(0, nSt2.bonus + 1);
        if (actionType === 'superTackle') nSt2.superTackle = Math.max(0, nSt2.superTackle + 1);
        if (actionType === 'superRaid') nSt2.superRaid = Math.max(0, nSt2.superRaid + 1);

        setHalf1Score2(nS2);
        setHalf1Stats2(nSt2);
        syncToServer(1, completedHalf1, half1Score1, nS2, half1Stats1, nSt2, half2Score1, half2Score2, half2Stats1, half2Stats2);
      }
    } else {
      // Half 2
      if (teamNum === 1) {
        const nS1 = Math.max(0, half2Score1 + pts);
        const nSt1 = { ...half2Stats1 };
        if (actionType === 'raid') nSt1.raid = Math.max(0, nSt1.raid + 1);
        if (actionType === 'tackle') nSt1.tackle = Math.max(0, nSt1.tackle + 1);
        if (actionType === 'bonus') nSt1.bonus = Math.max(0, nSt1.bonus + 1);
        if (actionType === 'superTackle') nSt1.superTackle = Math.max(0, nSt1.superTackle + 1);
        if (actionType === 'superRaid') nSt1.superRaid = Math.max(0, nSt1.superRaid + 1);

        setHalf2Score1(nS1);
        setHalf2Stats1(nSt1);
        syncToServer(2, true, half1Score1, half1Score2, half1Stats1, half1Stats2, nS1, half2Score2, nSt1, half2Stats2);
      } else {
        const nS2 = Math.max(0, half2Score2 + pts);
        const nSt2 = { ...half2Stats2 };
        if (actionType === 'raid') nSt2.raid = Math.max(0, nSt2.raid + 1);
        if (actionType === 'tackle') nSt2.tackle = Math.max(0, nSt2.tackle + 1);
        if (actionType === 'bonus') nSt2.bonus = Math.max(0, nSt2.bonus + 1);
        if (actionType === 'superTackle') nSt2.superTackle = Math.max(0, nSt2.superTackle + 1);
        if (actionType === 'superRaid') nSt2.superRaid = Math.max(0, nSt2.superRaid + 1);

        setHalf2Score2(nS2);
        setHalf2Stats2(nSt2);
        syncToServer(2, true, half1Score1, half1Score2, half1Stats1, half1Stats2, half2Score1, nS2, half2Stats1, nSt2);
      }
    }
  };

  const handleFinishHalf1AndStartHalf2 = () => {
    if (window.confirm(`Finish 1st Half (${team1Name} ${half1Score1} - ${half1Score2} ${team2Name}) and start 2nd Half carrying over points (${half1Score1}-${half1Score2})?`)) {
      pushUndoState();
      setCompletedHalf1(true);
      setHalf(2);
      setHalf2Score1(half1Score1);
      setHalf2Score2(half1Score2);
      setHalf2Stats1({ ...half1Stats1 });
      setHalf2Stats2({ ...half1Stats2 });
      syncToServer(2, true, half1Score1, half1Score2, half1Stats1, half1Stats2, half1Score1, half1Score2, { ...half1Stats1 }, { ...half1Stats2 });
      addToast(`🏆 1st Half Finished! (${half1Score1}-${half1Score2}). 2nd Half started carrying over points (${half1Score1}-${half1Score2}).`, 'success');
    }
  };

  const handleResetAllToZero = () => {
    if (window.confirm('Reset all scores and stats for both teams back to 0?')) {
      pushUndoState();
      setHalf(1);
      setCompletedHalf1(false);
      setHalf1Score1(0);
      setHalf1Score2(0);
      setHalf1Stats1(defaultZeroStats);
      setHalf1Stats2(defaultZeroStats);
      setHalf2Score1(0);
      setHalf2Score2(0);
      setHalf2Stats1(defaultZeroStats);
      setHalf2Stats2(defaultZeroStats);
      syncToServer(1, false, 0, 0, defaultZeroStats, defaultZeroStats, 0, 0, defaultZeroStats, defaultZeroStats);
      addToast('Reset all match scores and category stats to 0', 'info');
    }
  };

  const handleFinishMatch = async () => {
    const winnerName = totalScore1 > totalScore2 ? team1Name : totalScore2 > totalScore1 ? team2Name : 'Draw Match';

    if (!window.confirm(`Finish match and declare winner as "${winnerName}" (Total: ${totalScore1}-${totalScore2})?`)) return;

    const completedObj = {
      ...match,
      winner: winnerName,
      score1: totalScore1,
      score2: totalScore2,
      half1Score1,
      half1Score2,
      half1Stats1,
      half1Stats2,
      half2Score1,
      half2Score2,
      half2Stats1,
      half2Stats2,
      completedHalf1: true,
      kabaddiStats1: totalStats1,
      kabaddiStats2: totalStats2,
      scoreSummary: `Total: ${totalScore1} - ${totalScore2} Pts (H1: ${half1Score1}-${half1Score2}, Full Match: ${totalScore1}-${totalScore2})`,
      status: 'COMPLETED',
      tableNumber: null,
      isLiveStreaming: false,
      completedAt: new Date().toISOString(),
    };

    try {
      await coordinatorApi.completeMatch(match.id, completedObj);
      generateMatchResultPDF(completedObj, 'Kabaddi');
      if (onMatchUpdated) onMatchUpdated(match.id, { status: 'COMPLETED', score1: totalScore1, score2: totalScore2 });
      addToast(`🏆 Kabaddi Match Completed! Winner: ${winnerName}. Score Sheet PDF downloaded.`, 'success');
      onClose();
    } catch (err) {
      addToast('Failed to complete match', 'error');
    }
  };

  // Active Half Total Calculations
  const activeTeam1TotalRaids = (activeStats1.raid || 0) + (activeStats1.superRaid || 0);
  const activeTeam1TotalTackles = (activeStats1.tackle || 0) + (activeStats1.superTackle || 0);
  const activeTeam1TotalBonus = activeStats1.bonus || 0;

  const activeTeam2TotalRaids = (activeStats2.raid || 0) + (activeStats2.superRaid || 0);
  const activeTeam2TotalTackles = (activeStats2.tackle || 0) + (activeStats2.superTackle || 0);
  const activeTeam2TotalBonus = activeStats2.bonus || 0;

  return createPortal(
    /* POPUP OVERLAY OVER ENTIRE PAGE (MAX-W-4XL) */
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans transition-colors">
      
      {/* CONTAINER CARD */}
      <div className="w-full max-w-4xl bg-white dark:bg-[#060A14] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-white my-auto p-4 sm:p-5 space-y-3.5 transition-colors">
        
        {/* TOP NAV CONTROL BAR */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-[#0B1120] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{venueName || 'Kabaddi Mat Arena 1'}</span>
            <span className="hidden sm:inline-block text-slate-500 dark:text-slate-400 font-mono text-xs">| Official Match Console</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAllToZero}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Reset all scores to 0"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to 0
            </button>

            <button
              type="button"
              onClick={handleFinishMatch}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" /> Finish & PDF
            </button>

            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-600 dark:text-rose-300 hover:text-white border border-rose-500/30 transition cursor-pointer"
              title="Close Console"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COMPLETED 1ST HALF RESULT DISPLAY BANNER */}
        {completedHalf1 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/20 to-blue-500/10 border border-purple-500/30 rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10px] font-mono font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" /> 1ST HALF COMPLETED RESULT SUMMARY
            </span>
            <div className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white flex items-center justify-center gap-3">
              <span className="text-blue-600 dark:text-blue-400">{team1Name}: {half1Score1} Pts</span>
              <span className="text-slate-400">|</span>
              <span className="text-blue-600 dark:text-blue-400">{team2Name}: {half1Score2} Pts</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              2nd Half is active. Points carry over continuously from 1st Half ({half1Score1} - {half1Score2}).
            </p>
          </div>
        )}

        {/* 1. SCOREBOARD TOP CARD */}
        <div className="bg-white dark:bg-[#0A101D] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 transition-colors">
          
          {/* Main Score Line */}
          <div className="grid grid-cols-12 items-center gap-2">
            
            {/* Team A Info */}
            <div className="col-span-4">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block leading-none">TEAM A</span>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm truncate mt-1">{team1Name}</h2>
              {completedHalf1 && (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">1st Half: <strong className="text-slate-900 dark:text-white">{half1Score1}</strong> pts</span>
              )}
            </div>

            {/* Center Scores & Half Status */}
            <div className="col-span-4 text-center space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                {half === 1 ? '1ST HALF LIVE POINTS' : '2ND HALF LIVE POINTS (CONTINUING)'}
              </span>
              
              <div className="flex items-center justify-center gap-3 sm:gap-5 text-4xl sm:text-5xl font-black font-mono leading-none">
                <span className="text-blue-600 dark:text-blue-400 drop-shadow-md">{activeScore1}</span>
                <span className="text-slate-400 dark:text-slate-600 font-normal text-3xl sm:text-4xl">|</span>
                <span className="text-blue-600 dark:text-blue-400 drop-shadow-md">{activeScore2}</span>
              </div>

              <div>
                {half === 1 ? (
                  <button
                    type="button"
                    onClick={handleFinishHalf1AndStartHalf2}
                    className="px-4 py-1.5 rounded-full bg-[#5B39CE] hover:bg-[#6D46E6] text-white font-mono text-xs font-black tracking-wider uppercase shadow-lg shadow-purple-900/40 transition active:scale-95 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    title="Click to End 1st Half & Reset Counter for 2nd Half"
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-300" /> Finish 1st Half & Start 2nd Half
                  </button>
                ) : (
                  <span className="px-4 py-1 rounded-full bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-xs font-black tracking-wider uppercase inline-block">
                    2ND HALF IN PROGRESS
                  </span>
                )}
              </div>
            </div>

            {/* Team B Info */}
            <div className="col-span-4 text-right">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block leading-none">TEAM B</span>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm truncate mt-1">{team2Name}</h2>
              {completedHalf1 && (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">1st Half: <strong className="text-slate-900 dark:text-white">{half1Score2}</strong> pts</span>
              )}
            </div>

          </div>

          {/* Breakdown Stats Line */}
          <div className="grid grid-cols-5 items-center justify-between bg-slate-50 dark:bg-[#080D18] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center font-mono pt-2 transition-colors">
            <div>
              <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white">{activeStats1.raid || 0}</div>
              <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">RAID POINTS</div>
            </div>

            <div>
              <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white">{activeStats1.tackle || 0}</div>
              <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TACKLE POINTS</div>
            </div>

            {/* Center BONUS Indicator Dots */}
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">BONUS</div>
              <div className="flex items-center justify-center gap-1">
                <span className={`w-3 h-3 rounded-full border ${activeStats1.bonus > 0 || activeStats2.bonus > 0 ? 'bg-blue-500 border-blue-400' : 'bg-slate-200 dark:bg-slate-800 border-blue-500/40'}`} />
                <span className={`w-3 h-3 rounded-full border ${activeStats1.bonus > 1 || activeStats2.bonus > 1 ? 'bg-blue-500 border-blue-400' : 'bg-slate-200 dark:bg-slate-800 border-blue-500/40'}`} />
                <span className={`w-3 h-3 rounded-full border ${activeStats1.bonus > 2 || activeStats2.bonus > 2 ? 'bg-blue-500 border-blue-400' : 'bg-slate-200 dark:bg-slate-800 border-blue-500/40'}`} />
                <span className={`w-3 h-3 rounded-full border ${activeStats1.bonus > 3 || activeStats2.bonus > 3 ? 'bg-blue-500 border-blue-400' : 'bg-slate-200 dark:bg-slate-800 border-blue-500/40'}`} />
              </div>
            </div>

            <div>
              <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white">{activeStats2.tackle || 0}</div>
              <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TACKLE POINTS</div>
            </div>

            <div>
              <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white">{activeStats2.raid || 0}</div>
              <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">RAID POINTS</div>
            </div>
          </div>

        </div>

        {/* 2. TEAM A ACTIONS & TEAM B ACTIONS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          
          {/* TEAM A ACTIONS CARD */}
          <div className="bg-white dark:bg-[#0A101D] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 transition-colors">
            
            {/* Header & Integrated Live Stats Row */}
            <div className="space-y-2 border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
              <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                TEAM A ACTIONS ({team1Name}) - {half === 1 ? 'HALF 1' : 'HALF 2'}
              </span>

              {/* Live Category Stats Row Directly Inside Card */}
              <div className="grid grid-cols-5 gap-1 text-center text-[9px] font-mono font-bold bg-slate-50 dark:bg-[#111929] p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">RAID</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats1.raid || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">TACKLE</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats1.tackle || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">BONUS</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats1.bonus || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">S.TACKLE</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats1.superTackle || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">S.RAID</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats1.superRaid || 0}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handlePointAction(1, 'raid', 1)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs sm:text-sm shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
              >
                + 1 RAID
              </button>

              <button
                type="button"
                onClick={() => handlePointAction(1, 'tackle', 1)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#121A2B] hover:bg-slate-200 dark:hover:bg-[#1C273D] text-slate-900 dark:text-white font-mono font-black text-xs sm:text-sm border border-slate-300 dark:border-blue-500/40 shadow-xs transition active:scale-95 cursor-pointer"
              >
                + 1 TACKLE
              </button>

              <button
                type="button"
                onClick={() => handlePointAction(1, 'bonus', 1)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs sm:text-sm shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
              >
                + 1 BONUS
              </button>

              <button
                type="button"
                onClick={() => handlePointAction(1, 'superTackle', 2)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#121A2B] hover:bg-slate-200 dark:hover:bg-[#1C273D] text-slate-900 dark:text-white font-mono font-black text-xs sm:text-sm border border-slate-300 dark:border-blue-500/40 shadow-xs transition active:scale-95 cursor-pointer"
              >
                + 2 TACKLE
              </button>

              <button
                type="button"
                onClick={() => handlePointAction(1, 'superRaid', 3)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs sm:text-sm shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
              >
                + 3 RAID
              </button>

              <button
                type="button"
                onClick={() => handleUndo(1)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#121A2B] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 font-mono font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> UNDO
              </button>
            </div>

            {/* Team A Separate Total Summary Bar */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-2 font-mono text-center">
              <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                <span className="text-[8px] text-slate-500 dark:text-slate-400 block uppercase font-bold">{half === 1 ? 'H1 RAIDS' : 'H2 RAIDS'}</span>
                <span className="font-black text-xs text-slate-900 dark:text-white">{activeTeam1TotalRaids}</span>
              </div>
              <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                <span className="text-[8px] text-slate-500 dark:text-slate-400 block uppercase font-bold">{half === 1 ? 'H1 TACKLES' : 'H2 TACKLES'}</span>
                <span className="font-black text-xs text-slate-900 dark:text-white">{activeTeam1TotalTackles}</span>
              </div>
              <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                <span className="text-[8px] text-slate-500 dark:text-slate-400 block uppercase font-bold">{half === 1 ? 'H1 BONUS' : 'H2 BONUS'}</span>
                <span className="font-black text-xs text-slate-900 dark:text-white">{activeTeam1TotalBonus}</span>
              </div>
            </div>

          </div>

          {/* TEAM B ACTIONS CARD */}
          <div className="bg-white dark:bg-[#0A101D] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 transition-colors">
            
            {/* Header & Integrated Live Stats Row */}
            <div className="space-y-2 border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
              <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                TEAM B ACTIONS ({team2Name}) - {half === 1 ? 'HALF 1' : 'HALF 2'}
              </span>

              {/* Live Category Stats Row Directly Inside Card */}
              <div className="grid grid-cols-5 gap-1 text-center text-[9px] font-mono font-bold bg-slate-50 dark:bg-[#111929] p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">RAID</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats2.raid || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">TACKLE</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats2.tackle || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">BONUS</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats2.bonus || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">S.TACKLE</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats2.superTackle || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[8px]">S.RAID</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{activeStats2.superRaid || 0}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handlePointAction(2, 'raid', 1)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs sm:text-sm shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
              >
                + 1 RAID
              </button>

              <button
                type="button"
                onClick={() => handlePointAction(2, 'tackle', 1)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#121A2B] hover:bg-slate-200 dark:hover:bg-[#1C273D] text-slate-900 dark:text-white font-mono font-black text-xs sm:text-sm border border-slate-300 dark:border-blue-500/40 shadow-xs transition active:scale-95 cursor-pointer"
              >
                + 1 TACKLE
              </button>

              <button
                type="button"
                onClick={() => handlePointAction(2, 'bonus', 1)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs sm:text-sm shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
              >
                + 1 BONUS
              </button>

              <button
                type="button"
                onClick={() => handlePointAction(2, 'superTackle', 2)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#121A2B] hover:bg-slate-200 dark:hover:bg-[#1C273D] text-slate-900 dark:text-white font-mono font-black text-xs sm:text-sm border border-slate-300 dark:border-blue-500/40 shadow-xs transition active:scale-95 cursor-pointer"
              >
                + 2 TACKLE
              </button>

              <button
                type="button"
                onClick={() => handlePointAction(2, 'superRaid', 3)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs sm:text-sm shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
              >
                + 3 RAID
              </button>

              <button
                type="button"
                onClick={() => handleUndo(2)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#121A2B] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 font-mono font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> UNDO
              </button>
            </div>

            {/* Team B Separate Total Summary Bar */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-2 font-mono text-center">
              <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                <span className="text-[8px] text-slate-500 dark:text-slate-400 block uppercase font-bold">{half === 1 ? 'H1 RAIDS' : 'H2 RAIDS'}</span>
                <span className="font-black text-xs text-slate-900 dark:text-white">{activeTeam2TotalRaids}</span>
              </div>
              <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                <span className="text-[8px] text-slate-500 dark:text-slate-400 block uppercase font-bold">{half === 1 ? 'H1 TACKLES' : 'H2 TACKLES'}</span>
                <span className="font-black text-xs text-slate-900 dark:text-white">{activeTeam2TotalTackles}</span>
              </div>
              <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                <span className="text-[8px] text-slate-500 dark:text-slate-400 block uppercase font-bold">{half === 1 ? 'H1 BONUS' : 'H2 BONUS'}</span>
                <span className="font-black text-xs text-slate-900 dark:text-white">{activeTeam2TotalBonus}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>,
    document.body
  );
};
