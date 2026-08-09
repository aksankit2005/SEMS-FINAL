import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, RotateCcw, Trophy, AlertCircle, RefreshCw, UserCheck, Activity, 
  Maximize2, Minimize2, Play, Pause, ChevronRight, FileText, CheckCircle2, 
  Award, Shield, HelpCircle, Edit3, ArrowLeftRight, Printer, Save
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';
import { CricketScorecardModal } from './CricketScorecardModal';

export const GullyCricketLiveScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {
  const { addToast } = useToast();

  const teamA = match?.team1 || 'Team A';
  const teamB = match?.team2 || 'Team B';

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

  const totalOversMax = match?.overs || 20;

  // States
  const [currentInnings, setCurrentInnings] = useState(match?.currentInnings || 1);
  const [battingTeam, setBattingTeam] = useState(match?.battingTeam || teamA);
  const [bowlingTeam, setBowlingTeam] = useState(match?.bowlingTeam || teamB);

  const [runs, setRuns] = useState(match?.runs1 || 0);
  const [wickets, setWickets] = useState(match?.wickets1 || 0);
  const [legalBalls, setLegalBalls] = useState(match?.legalBalls || 0);
  const [oversFormatted, setOversFormatted] = useState(match?.overs1 || '0.0');

  const [targetRuns, setTargetRuns] = useState(match?.targetRuns || null);
  const [firstInningsScore, setFirstInningsScore] = useState(match?.firstInningsScore || null);

  const [extras, setExtras] = useState(match?.extras || { wide: 0, noBall: 0, bye: 0, legBye: 0, total: 0 });
  const [fallOfWickets, setFallOfWickets] = useState(match?.fallOfWickets || []);

  const [striker, setStriker] = useState(match?.striker || { name: 'Batsman 1', runs: 0, balls: 0, fours: 0, sixes: 0 });
  const [nonStriker, setNonStriker] = useState(match?.nonStriker || { name: 'Batsman 2', runs: 0, balls: 0, fours: 0, sixes: 0 });
  const [partnership, setPartnership] = useState(match?.partnership || { runs: 0, balls: 0 });

  const [bowler, setBowler] = useState(match?.bowler || { name: 'Bowler 1', overs: '0.0', maidens: 0, runsConceded: 0, wickets: 0, economy: '0.00', legalBalls: 0 });
  const [recentBalls, setRecentBalls] = useState(match?.recentBalls || []);
  const [isPaused, setIsPaused] = useState(false);
  const [matchStatus, setMatchStatus] = useState('Live');

  const [battingCard1, setBattingCard1] = useState(match?.battingCard1 || []);
  const [bowlingCard1, setBowlingCard1] = useState(match?.bowlingCard1 || []);
  const [battingCard2, setBattingCard2] = useState(match?.battingCard2 || []);
  const [bowlingCard2, setBowlingCard2] = useState(match?.bowlingCard2 || []);

  const [showFullScorecard, setShowFullScorecard] = useState(false);
  const [historyStack, setHistoryStack] = useState([]);

  const formatOvers = (balls) => {
    const num = Number(balls);
    if (isNaN(num) || num <= 0) return '0.0';
    const o = Math.floor(num / 6);
    const b = num % 6;
    return `${o}.${b}`;
  };

  const currentRunRate = legalBalls > 0 ? ((runs / (legalBalls / 6))).toFixed(2) : '0.00';
  const remainingRuns = targetRuns ? Math.max(0, targetRuns - runs) : 0;
  const remainingBalls = Math.max(0, (totalOversMax * 6) - legalBalls);
  const requiredRunRate = remainingBalls > 0 && targetRuns ? ((remainingRuns / (remainingBalls / 6))).toFixed(2) : '0.00';

  const projectedScore = legalBalls > 0 ? Math.round((runs / legalBalls) * (totalOversMax * 6)) : 0;
  const winningProbability = currentInnings === 2 && targetRuns 
    ? Math.min(99, Math.max(1, Math.round((runs / targetRuns) * 100))) 
    : 50;

  const pushStateToUndo = () => {
    setHistoryStack((prev) => [
      ...prev,
      {
        runs, wickets, legalBalls, oversFormatted,
        extras: { ...extras },
        striker: { ...striker },
        nonStriker: { ...nonStriker },
        partnership: { ...partnership },
        bowler: { ...bowler },
        recentBalls: [...recentBalls],
        fallOfWickets: [...fallOfWickets],
        currentInnings, matchStatus
      }
    ]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) {
      addToast('Nothing to undo', 'info');
      return;
    }
    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((s) => s.slice(0, s.length - 1));
    setRuns(prev.runs);
    setWickets(prev.wickets);
    setLegalBalls(prev.legalBalls);
    setOversFormatted(prev.oversFormatted);
    setExtras(prev.extras);
    setStriker(prev.striker);
    setNonStriker(prev.nonStriker);
    setPartnership(prev.partnership);
    setBowler(prev.bowler);
    setRecentBalls(prev.recentBalls);
    setFallOfWickets(prev.fallOfWickets);
    setCurrentInnings(prev.currentInnings);
    setMatchStatus(prev.matchStatus);
    addToast('↩️ Reverted last action', 'info');
  };

  const syncToServer = async (payload = {}) => {
    try {
      await coordinatorApi.updateMatchScoring(match.id, {
        score1: currentInnings === 1 ? runs : (firstInningsScore || 0),
        wickets1: currentInnings === 1 ? wickets : (match?.wickets1 || 0),
        overs1: currentInnings === 1 ? oversFormatted : (match?.overs1 || '0.0'),
        score2: currentInnings === 2 ? runs : 0,
        wickets2: currentInnings === 2 ? wickets : 0,
        overs2: currentInnings === 2 ? oversFormatted : '0.0',
        currentInnings,
        runs, wickets, legalBalls, oversFormatted, extras, striker, nonStriker, bowler, recentBalls, fallOfWickets,
        status: 'running',
        ...payload
      });
      if (onMatchUpdated) onMatchUpdated(match.id, { runs, wickets, oversFormatted, status: 'running' });
    } catch (e) {}
  };

  const handleScoreRun = (runVal) => {
    if (isPaused) {
      addToast('Match is paused', 'warning');
      return;
    }
    pushStateToUndo();

    const newRuns = runs + runVal;
    const newLegalBalls = legalBalls + 1;
    const newOvers = formatOvers(newLegalBalls);

    const updatedStriker = {
      ...striker,
      runs: striker.runs + runVal,
      balls: striker.balls + 1,
      fours: runVal === 4 ? striker.fours + 1 : striker.fours,
      sixes: runVal === 6 ? striker.sixes + 1 : striker.sixes,
    };

    const updatedPartnership = {
      runs: partnership.runs + runVal,
      balls: partnership.balls + 1,
    };

    const newBowlerBalls = (bowler.legalBalls || 0) + 1;
    const updatedBowler = {
      ...bowler,
      legalBalls: newBowlerBalls,
      overs: formatOvers(newBowlerBalls),
      runsConceded: (bowler.runsConceded || 0) + runVal,
      economy: newBowlerBalls > 0 ? (((bowler.runsConceded || 0) + runVal) / (newBowlerBalls / 6)).toFixed(2) : '0.00'
    };

    const ballTag = runVal === 0 ? '0' : `${runVal}`;
    const updatedRecent = [...recentBalls, ballTag].slice(-6);

    setRuns(newRuns);
    setLegalBalls(newLegalBalls);
    setOversFormatted(newOvers);
    setStriker(updatedStriker);
    setPartnership(updatedPartnership);
    setBowler(updatedBowler);
    setRecentBalls(updatedRecent);

    let finalStriker = updatedStriker;
    let finalNonStriker = nonStriker;
    if (runVal % 2 !== 0) {
      finalStriker = nonStriker;
      finalNonStriker = updatedStriker;
      setStriker(finalStriker);
      setNonStriker(finalNonStriker);
    }

    if (newLegalBalls % 6 === 0) {
      // Over complete swap
      setStriker(finalNonStriker);
      setNonStriker(finalStriker);
      addToast('Over completed! Strike rotated.', 'info');
    }

    syncToServer({ runs: newRuns, legalBalls: newLegalBalls, oversFormatted: newOvers, striker: finalStriker, nonStriker: finalNonStriker });
    addToast(runVal === 0 ? 'Dot ball' : `+${runVal} runs`, 'success');
  };

  const handleScoreExtra = (extraType) => {
    if (isPaused) return;
    pushStateToUndo();

    let extraRuns = 1;
    let isLegal = false;
    const newExtras = { ...extras };

    if (extraType === 'Wide (+1)') {
      newExtras.wide += 1;
      newExtras.total += 1;
    } else if (extraType === 'No Ball (+1)') {
      newExtras.noBall += 1;
      newExtras.total += 1;
    } else if (extraType === 'Bye') {
      newExtras.bye += 1;
      newExtras.total += 1;
      isLegal = true;
    } else if (extraType === 'Leg Bye') {
      newExtras.legBye += 1;
      newExtras.total += 1;
      isLegal = true;
    }

    const newRuns = runs + extraRuns;
    const newLegalBalls = isLegal ? legalBalls + 1 : legalBalls;
    const newOvers = formatOvers(newLegalBalls);

    const tag = extraType.includes('Wide') ? 'WD' : extraType.includes('No') ? 'NB' : extraType.includes('Bye') ? 'B' : 'LB';
    const updatedRecent = [...recentBalls, tag].slice(-6);

    setRuns(newRuns);
    setExtras(newExtras);
    setLegalBalls(newLegalBalls);
    setOversFormatted(newOvers);
    setRecentBalls(updatedRecent);

    if (isLegal && newLegalBalls % 6 === 0) {
      setStriker(nonStriker);
      setNonStriker(striker);
    }

    syncToServer({ runs: newRuns, extras: newExtras, legalBalls: newLegalBalls, oversFormatted: newOvers });
    addToast(`+1 Extra (${extraType})`, 'info');
  };

  const handleDismissal = (type) => {
    if (isPaused) return;
    pushStateToUndo();

    const newWickets = wickets + 1;
    const newLegalBalls = legalBalls + 1;
    const newOvers = formatOvers(newLegalBalls);

    const fowEntry = `${newWickets}-${runs} (${striker.name}, ${newOvers} ov)`;
    const updatedFow = [...fallOfWickets, fowEntry];

    const updatedRecent = [...recentBalls, 'W'].slice(-6);

    setWickets(newWickets);
    setLegalBalls(newLegalBalls);
    setOversFormatted(newOvers);
    setFallOfWickets(updatedFow);
    setRecentBalls(updatedRecent);
    setPartnership({ runs: 0, balls: 0 });

    const newBatterName = prompt(`Wicket fallen (${type})! Enter new batsman name:`, `Batsman ${newWickets + 2}`);
    if (newBatterName) {
      setStriker({ name: newBatterName, runs: 0, balls: 0, fours: 0, sixes: 0 });
    }

    syncToServer({ wickets: newWickets, legalBalls: newLegalBalls, oversFormatted: newOvers, fallOfWickets: updatedFow });
    addToast(`⚠️ Wicket! (${type})`, 'error');
  };

  const handleStartMatch = () => {
    setMatchStatus('Live');
    addToast('🏏 Match Started!', 'success');
  };

  const handleStartInnings = () => {
    if (currentInnings === 1) {
      setCurrentInnings(2);
      setFirstInningsScore(runs);
      setTargetRuns(runs + 1);
      setBattingTeam(teamB);
      setBowlingTeam(teamA);
      setRuns(0);
      setWickets(0);
      setLegalBalls(0);
      setOversFormatted('0.0');
      setStriker({ name: `${teamB} Opener 1`, runs: 0, balls: 0, fours: 0, sixes: 0 });
      setNonStriker({ name: `${teamB} Opener 2`, runs: 0, balls: 0, fours: 0, sixes: 0 });
      setPartnership({ runs: 0, balls: 0 });
      setRecentBalls([]);
      addToast('Innings 2 Started! Target: ' + (runs + 1), 'success');
    }
  };

  const handleChangeStrike = () => {
    const temp = striker;
    setStriker(nonStriker);
    setNonStriker(temp);
    addToast('Changed strike', 'info');
  };

  const handleChangeBowler = () => {
    const newBowler = prompt('Enter new bowler name:', bowler.name);
    if (newBowler) {
      setBowler({ name: newBowler, overs: '0.0', maidens: 0, runsConceded: 0, wickets: 0, economy: '0.00', legalBalls: 0 });
      addToast(`New bowler: ${newBowler}`, 'success');
    }
  };

  const handleNextOver = () => {
    const temp = striker;
    setStriker(nonStriker);
    setNonStriker(temp);
    handleChangeBowler();
  };

  const handleEndInnings = () => {
    if (currentInnings === 1) {
      handleStartInnings();
    } else {
      addToast('Both innings completed. End Match to declare result.', 'info');
    }
  };

  const handleEndMatch = async () => {
    const winner = runs >= (targetRuns || 0) ? battingTeam : bowlingTeam;
    const resultStr = `${winner} won the match!`;
    if (!window.confirm(`End match? Winner: ${winner}`)) return;

    const completedObj = {
      ...match,
      score1: currentInnings === 1 ? runs : firstInningsScore,
      score2: currentInnings === 2 ? runs : 0,
      runs, wickets, overs: oversFormatted,
      status: 'COMPLETED',
      winner,
      completedAt: new Date().toISOString()
    };

    try {
      await coordinatorApi.completeMatch(match.id, completedObj);
      generateMatchResultPDF(completedObj, 'Gully Cricket');
      if (onMatchUpdated) onMatchUpdated(match.id, { status: 'COMPLETED' });
      addToast(`🏆 Match Completed! Winner: ${winner}. PDF downloaded.`, 'success');
      onClose();
    } catch (e) {
      addToast('Error finishing match', 'error');
    }
  };

  const handleSaveMatch = () => {
    syncToServer();
    addToast('Match state saved successfully', 'success');
  };

  const handleGenerateScorecard = () => {
    setShowFullScorecard(true);
    addToast('Scorecard generated', 'success');
  };

  const handleDownloadPDF = () => {
    generateMatchResultPDF({
      ...match,
      score1: runs,
      runs, wickets, overs: oversFormatted,
      winner: battingTeam
    }, 'Gully Cricket');
    addToast('Result PDF downloaded', 'success');
  };

  const handlePrintScorecard = () => {
    window.print();
    addToast('Printing scorecard...', 'info');
  };

  const handleDeclareWinner = () => {
    const w = prompt('Declare Winner Team Name:', battingTeam);
    if (w) {
      addToast(`🏆 Winner Declared: ${w}`, 'success');
      handleEndMatch();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-[#060911] text-white flex flex-col font-sans overflow-hidden w-screen h-screen select-none p-2 sm:p-3 space-y-2">
      
      {/* TOP LIVE BAR */}
      <header className="px-4 py-2.5 bg-[#0D1424] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-orange-400 uppercase tracking-wider">{venueName}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <span className="text-xs font-black text-white uppercase truncate max-w-[120px]">{battingTeam}</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-orange-500">{runs}/{wickets}</span>
            <span className="text-[10px] text-slate-400">({oversFormatted} Ov)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-black uppercase tracking-wider">
            🏏 Innings {currentInnings} {matchStatus === 'Live' ? 'LIVE' : ''} {targetRuns ? `| Target: ${targetRuns}` : ''}
          </div>
          <div className="text-xs font-mono text-slate-300 hidden md:flex items-center gap-2">
            <span>CRR: <strong className="text-emerald-400">{currentRunRate}</strong></span>
            {currentInnings === 2 && <span>RRR: <strong className="text-amber-400">{requiredRunRate}</strong></span>}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-orange-400" /> Undo
          </button>

          <button
            onClick={handleEndInnings}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
          >
            End Innings
          </button>

          <button
            onClick={handleEndMatch}
            className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
          >
            End Match
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Generate Result PDF
          </button>

          <button
            onClick={toggleBrowserFullscreen}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-orange-400" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT GRID (3 COLUMNS) */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar">
        
        {/* LEFT PANEL — BATTING & SCORE & BALL CONTROL */}
        <div className="space-y-3 flex flex-col">
          
          {/* Batting Card */}
          <div className="p-4 rounded-2xl bg-[#0D1424] border border-orange-500/30 space-y-3 shadow-xl">
            <h3 className="text-xs font-black text-orange-400 uppercase tracking-wide border-b border-slate-800 pb-2">
              LEFT PANEL — BATTING ({battingTeam})
            </h3>

            {/* Striker */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>⭐ Current Batsman (Striker): {striker.name}</span>
                <span className="text-orange-400 font-mono">{striker.runs} ({striker.balls})</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>4s: {striker.fours} | 6s: {striker.sixes}</span>
                <span>SR: {striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(1) : '0.0'}</span>
              </div>
            </div>

            {/* Non-Striker */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Current Batsman (Non-Striker): {nonStriker.name}</span>
                <span className="text-white font-mono">{nonStriker.runs} ({nonStriker.balls})</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>4s: {nonStriker.fours} | 6s: {nonStriker.sixes}</span>
                <span>SR: {nonStriker.balls > 0 ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1) : '0.0'}</span>
              </div>
            </div>

            {/* Partnership */}
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-300">Partnership:</span>
              <span className="font-black text-orange-400">{partnership.runs} runs ({partnership.balls} balls)</span>
            </div>
          </div>

          {/* Score & Ball Control */}
          <div className="p-4 rounded-2xl bg-[#0D1424] border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-2">
              SCORE & BALL CONTROL
            </h3>

            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => handleScoreRun(0)} className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer">Dot Ball (0)</button>
              <button onClick={() => handleScoreRun(1)} className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer">+1 Run</button>
              <button onClick={() => handleScoreRun(2)} className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer">+2 Runs</button>
              <button onClick={() => handleScoreRun(3)} className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer">+3 Runs</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleScoreRun(4)} className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer">+4 Four</button>
              <button onClick={() => handleScoreRun(5)} className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer">+5 Runs</button>
              <button onClick={() => handleScoreRun(6)} className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer">+6 Six</button>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Extras</span>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleScoreExtra('Wide (+1)')} className="py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white font-bold text-xs transition cursor-pointer">Wide (+1)</button>
                <button onClick={() => handleScoreExtra('No Ball (+1)')} className="py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white font-bold text-xs transition cursor-pointer">No Ball (+1)</button>
                <button onClick={() => handleScoreExtra('Bye')} className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer">Bye</button>
                <button onClick={() => handleScoreExtra('Leg Bye')} className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer">Leg Bye</button>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">Dismissals</span>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleDismissal('Wicket')} className="py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition cursor-pointer">Wicket</button>
                <button onClick={() => handleDismissal('Run Out')} className="py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition cursor-pointer">Run Out</button>
                <button onClick={() => handleDismissal('Retired Hurt')} className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer">Retired Hurt</button>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER PANEL — BOWLING & MATCH CONTROLS */}
        <div className="space-y-3 flex flex-col">
          
          {/* Bowling Card */}
          <div className="p-4 rounded-2xl bg-[#0D1424] border border-blue-500/30 space-y-3 shadow-xl">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-wide border-b border-slate-800 pb-2">
              CENTER PANEL — BOWLING ({bowlingTeam})
            </h3>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-blue-300">
                <span>Current Bowler: {bowler.name}</span>
                <span className="font-mono text-amber-400">{bowler.wickets} - {bowler.runsConceded}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-slate-300 pt-1 border-t border-slate-800 text-center">
                <div>Overs: <strong className="text-white">{bowler.overs}</strong></div>
                <div>Maidens: <strong className="text-white">{bowler.maidens || 0}</strong></div>
                <div>Runs: <strong className="text-white">{bowler.runsConceded}</strong></div>
                <div>Econ: <strong className="text-blue-400">{bowler.economy}</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Current Over Timeline</span>
              <div className="text-xs font-mono font-black text-amber-400">
                Example: 1 0 4 1 W 6
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Current Over:</span>
                {recentBalls.length === 0 ? (
                  <span className="text-xs font-mono text-slate-500">○ 0 0 0 0 0</span>
                ) : (
                  <div className="flex items-center gap-1">
                    {recentBalls.map((b, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-xs font-bold border border-slate-700">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match Controls */}
          <div className="p-4 rounded-2xl bg-[#0D1424] border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-2">
              MATCH CONTROLS
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleStartMatch} className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer">Start Match</button>
              <button onClick={handleStartInnings} className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer">Start Innings</button>
              <button onClick={handleChangeStrike} className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer">Change Strike</button>
              <button onClick={handleChangeBowler} className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer">Change Bowler</button>
              <button onClick={handleNextOver} className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer">Next Over</button>
              <button onClick={handleUndo} className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer">Undo Ball</button>
              <button onClick={handleEndInnings} className="py-2.5 rounded-xl bg-amber-600/20 text-amber-300 border border-amber-500/30 font-bold text-xs transition cursor-pointer">End Innings</button>
              <button onClick={handleEndMatch} className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer">End Match</button>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL — MATCH SUMMARY & BOTTOM ACTION BAR */}
        <div className="space-y-3 flex flex-col justify-between">
          
          <div className="p-4 rounded-2xl bg-[#0D1424] border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-2">
              RIGHT PANEL — MATCH SUMMARY
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Current Score</span>
                <strong className="text-emerald-400 text-base">{runs}/{wickets}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Overs</span>
                <strong className="text-white text-base">{oversFormatted} / {totalOversMax}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Target</span>
                <strong className="text-amber-400 text-base">{targetRuns || 'N/A'}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Extras</span>
                <strong className="text-blue-400 text-base">{extras.total}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Need Runs</span>
                <strong className="text-rose-400 text-base">{remainingRuns}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Balls Left</span>
                <strong className="text-white text-base">{remainingBalls}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Required RR</span>
                <span className="font-bold text-amber-400">{requiredRunRate}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Current RR</span>
                <span className="font-bold text-emerald-400">{currentRunRate}</span>
              </div>
            </div>

            {/* Fall of Wickets */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Fall of Wickets</span>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1 max-h-24 overflow-y-auto">
                {fallOfWickets.length === 0 ? (
                  <span className="text-slate-500">No wickets fallen yet</span>
                ) : (
                  fallOfWickets.map((f, i) => <div key={i} className="text-rose-300">{f}</div>)
                )}
              </div>
            </div>

            {/* Extras Breakdown */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Extras Breakdown</span>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">Wide: <strong className="text-white">{extras.wide}</strong></div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">No Ball: <strong className="text-white">{extras.noBall}</strong></div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">Bye: <strong className="text-white">{extras.bye}</strong></div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">Leg Bye: <strong className="text-white">{extras.legBye}</strong></div>
              </div>
            </div>

            {/* Match Status */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block">Match Status</span>
              <div>Live: <strong className="text-white">{matchStatus}</strong></div>
              <div>Current Innings: <strong className="text-white">Innings {currentInnings} ({battingTeam})</strong></div>
              <div>Overs Left: <strong className="text-white">{(remainingBalls / 6).toFixed(1)} Ov</strong></div>
              <div>Projected Score: <strong className="text-emerald-400">{projectedScore}</strong></div>
              <div>Winning Probability: <strong className="text-amber-400">{battingTeam} {winningProbability}%</strong></div>
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="p-3 rounded-2xl bg-[#0D1424] border border-slate-800 grid grid-cols-3 gap-2 shadow-xl shrink-0">
            <button onClick={handleSaveMatch} className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer">Save Match</button>
            <button onClick={handleGenerateScorecard} className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer">Generate Scorecard</button>
            <button onClick={handleDownloadPDF} className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer">Download PDF</button>
            <button onClick={handlePrintScorecard} className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer">Print Scorecard</button>
            <button onClick={handleDeclareWinner} className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer">Declare Winner</button>
            <button onClick={onClose} className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer">Back to Dashboard</button>
          </div>

        </div>

      </main>

      {showFullScorecard && (
        <CricketScorecardModal
          match={{
            ...match,
            score1: runs,
            score2: 0,
            innings1: { battingStats: [], bowlingStats: [], runs },
          }}
          onClose={() => setShowFullScorecard(false)}
        />
      )}

    </div>,
    document.body
  );
};
