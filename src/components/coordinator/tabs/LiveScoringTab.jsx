import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Award, CheckCircle2, Radio, Clock, 
  RotateCw, Plus, Minus, UserX, ShieldAlert, Save, Trophy, AlertTriangle, X 
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const LiveScoringTab = ({ matches, user, onUpdateMatchScore }) => {
  const { addToast } = useToast();

  const runningMatch = matches.find((m) => m.status === 'running') || matches[0];
  const [selectedMatchId, setSelectedMatchId] = useState(runningMatch?.id || '');

  const activeMatch = matches.find((m) => m.id === selectedMatchId) || runningMatch;

  // Local state for live scoring studio
  const [score1, setScore1] = useState(activeMatch?.score1 || 0);
  const [score2, setScore2] = useState(activeMatch?.score2 || 0);
  const [fouls1, setFouls1] = useState(activeMatch?.foulsTeam1 || 0);
  const [fouls2, setFouls2] = useState(activeMatch?.foulsTeam2 || 0);
  const [yellow1, setYellow1] = useState(activeMatch?.yellowCards1 || 0);
  const [yellow2, setYellow2] = useState(activeMatch?.yellowCards2 || 0);
  const [red1, setRed1] = useState(activeMatch?.redCards1 || 0);
  const [red2, setRed2] = useState(activeMatch?.redCards2 || 0);
  const [timeouts1, setTimeouts1] = useState(activeMatch?.timeouts1 || 2);
  const [timeouts2, setTimeouts2] = useState(activeMatch?.timeouts2 || 2);

  const [matchStatus, setMatchStatus] = useState(activeMatch?.status || 'running');
  const [timerSeconds, setTimerSeconds] = useState(1125); // 18m 45s
  const [isTimerRunning, setIsTimerRunning] = useState(activeMatch?.status === 'running');

  // History stack for Undo / Redo
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [scoreLogs, setScoreLogs] = useState([
    { id: 1, text: `${activeMatch?.team1} scored +1 point`, time: '14:20' },
    { id: 2, text: `${activeMatch?.team2} scored +2 points`, time: '16:05' },
  ]);

  // Sync state when activeMatch changes
  useEffect(() => {
    if (activeMatch) {
      setScore1(activeMatch.score1 || 0);
      setScore2(activeMatch.score2 || 0);
      setFouls1(activeMatch.foulsTeam1 || 0);
      setFouls2(activeMatch.foulsTeam2 || 0);
      setYellow1(activeMatch.yellowCards1 || 0);
      setYellow2(activeMatch.yellowCards2 || 0);
      setRed1(activeMatch.redCards1 || 0);
      setRed2(activeMatch.redCards2 || 0);
      setTimeouts1(activeMatch.timeouts1 || 2);
      setTimeouts2(activeMatch.timeouts2 || 2);
      setMatchStatus(activeMatch.status || 'running');
      setIsTimerRunning(activeMatch.status === 'running');
    }
  }, [selectedMatchId]);

  // Timer Tick Interval
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && matchStatus === 'running') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, matchStatus]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const pushStateToHistory = () => {
    setHistoryStack((prev) => [
      ...prev,
      { score1, score2, fouls1, fouls2, yellow1, yellow2, red1, red2, timeouts1, timeouts2 }
    ]);
    setRedoStack([]);
  };

  const handleScoreChange = (team, delta) => {
    pushStateToHistory();
    const formattedTime = formatTimer(timerSeconds);

    if (team === 1) {
      const newScore = Math.max(0, score1 + delta);
      setScore1(newScore);
      setScoreLogs((prev) => [
        { id: Date.now(), text: `${activeMatch?.team1} scored ${delta > 0 ? '+' : ''}${delta}`, time: formattedTime },
        ...prev
      ]);
    } else {
      const newScore = Math.max(0, score2 + delta);
      setScore2(newScore);
      setScoreLogs((prev) => [
        { id: Date.now(), text: `${activeMatch?.team2} scored ${delta > 0 ? '+' : ''}${delta}`, time: formattedTime },
        ...prev
      ]);
    }
  };

  const handleUndo = () => {
    if (historyStack.length === 0) {
      addToast('No score changes to undo', 'info');
      return;
    }
    const previousState = historyStack[historyStack.length - 1];
    setRedoStack((prev) => [
      ...prev,
      { score1, score2, fouls1, fouls2, yellow1, yellow2, red1, red2, timeouts1, timeouts2 }
    ]);

    setScore1(previousState.score1);
    setScore2(previousState.score2);
    setFouls1(previousState.fouls1);
    setFouls2(previousState.fouls2);
    setYellow1(previousState.yellow1);
    setYellow2(previousState.yellow2);
    setRed1(previousState.red1);
    setRed2(previousState.red2);
    setTimeouts1(previousState.timeouts1);
    setTimeouts2(previousState.timeouts2);

    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    addToast('Scoring action undone', 'info');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      addToast('No score changes to redo', 'info');
      return;
    }
    const nextState = redoStack[redoStack.length - 1];
    setHistoryStack((prev) => [
      ...prev,
      { score1, score2, fouls1, fouls2, yellow1, yellow2, red1, red2, timeouts1, timeouts2 }
    ]);

    setScore1(nextState.score1);
    setScore2(nextState.score2);
    setFouls1(nextState.fouls1);
    setFouls2(nextState.fouls2);
    setYellow1(nextState.yellow1);
    setYellow2(nextState.yellow2);
    setRed1(nextState.red1);
    setRed2(nextState.red2);
    setTimeouts1(nextState.timeouts1);
    setTimeouts2(nextState.timeouts2);

    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    addToast('Scoring action redone', 'info');
  };

  const handleStartMatch = () => {
    setMatchStatus('running');
    setIsTimerRunning(true);
    addToast(`${user?.sportName} Match Started! Timer active.`, 'success');
  };

  const handlePauseMatch = () => {
    setIsTimerRunning(false);
    addToast('Match timer PAUSED', 'warning');
  };

  const handleResumeMatch = () => {
    setIsTimerRunning(true);
    addToast('Match timer RESUMED', 'success');
  };

  const handleEndMatch = () => {
    setIsTimerRunning(false);
    setMatchStatus('completed');
    const winnerName = score1 > score2 ? activeMatch?.team1 : score2 > score1 ? activeMatch?.team2 : 'Draw / Tied';
    addToast(`Match Concluded! Winner: ${winnerName}`, 'success');
  };

  const handleManualSave = () => {
    onUpdateMatchScore(activeMatch.id, {
      score1,
      score2,
      foulsTeam1: fouls1,
      foulsTeam2: fouls2,
      yellowCards1: yellow1,
      yellowCards2: yellow2,
      redCards1: red1,
      redCards2: red2,
      timeouts1,
      timeouts2,
      status: matchStatus,
      liveTimer: formatTimer(timerSeconds),
    });
    addToast('Scores & statistics saved successfully to database!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Match Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" /> {user?.sportName} Live Scoring Studio
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time score control, undo/redo stack, timer, cards, timeouts, fouls, and instant save.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                [{m.status.toUpperCase()}] {m.matchTitle} ({m.team1} vs {m.team2})
              </option>
            ))}
          </select>

          <button
            onClick={handleManualSave}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center gap-1.5 shrink-0"
          >
            <Save className="w-4 h-4" /> Save Score State
          </button>
        </div>
      </div>

      {/* Live Timer & Match Controls Bar */}
      <div className="rounded-3xl bg-slate-950 text-white p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
              {activeMatch?.round} • {user?.sportName}
            </span>
            <h2 className="text-xl font-black text-white mt-1">{activeMatch?.matchTitle}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Venue: {activeMatch?.venue} | Referee: {activeMatch?.referee}</p>
          </div>

          {/* Clock Display */}
          <div className="flex items-center gap-3 bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 text-center">
            <Clock className="w-6 h-6 text-rose-500 animate-pulse" />
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Match Timer</span>
              <span className="text-2xl font-black font-mono text-white">{formatTimer(timerSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Start / Pause / Resume / End Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {matchStatus !== 'running' ? (
              <button
                onClick={handleStartMatch}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg transition flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Start Match
              </button>
            ) : isTimerRunning ? (
              <button
                onClick={handlePauseMatch}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-lg transition flex items-center gap-2"
              >
                <Pause className="w-4 h-4" /> Pause Match
              </button>
            ) : (
              <button
                onClick={handleResumeMatch}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg transition flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Resume Match
              </button>
            )}

            <button
              onClick={handleEndMatch}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> End Match & Declare Winner
            </button>
          </div>

          {/* Undo / Redo Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                historyStack.length > 0 
                  ? 'bg-slate-800 text-white hover:bg-slate-700' 
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo Score ({historyStack.length})
            </button>

            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                redoStack.length > 0 
                  ? 'bg-slate-800 text-white hover:bg-slate-700' 
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" /> Redo Score ({redoStack.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Scoring Arena Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Team 1 Score Board */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-orange-500/40 p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{activeMatch?.college1}</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{activeMatch?.team1}</h3>
            </div>
            <div className="text-center bg-orange-500/10 px-4 py-2 rounded-2xl border border-orange-500/30">
              <span className="text-[9px] font-bold text-orange-500 uppercase block">Points</span>
              <span className="text-3xl font-black text-orange-500">{score1}</span>
            </div>
          </div>

          {/* Increments / Decrements */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Adjust Score</span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleScoreChange(1, 1)}
                className="py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-md transition"
              >
                +1
              </button>
              <button
                onClick={() => handleScoreChange(1, 2)}
                className="py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-md transition"
              >
                +2
              </button>
              <button
                onClick={() => handleScoreChange(1, 4)}
                className="py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-md transition"
              >
                +4
              </button>
              <button
                onClick={() => handleScoreChange(1, -1)}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-black text-base transition"
              >
                -1
              </button>
            </div>
          </div>

          {/* Fouls, Cards, Timeouts */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 block">Fouls</span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <button onClick={() => setFouls1(Math.max(0, fouls1 - 1))} className="text-slate-400 hover:text-slate-200">-</button>
                <span className="font-black text-sm text-slate-900 dark:text-white">{fouls1}</span>
                <button onClick={() => setFouls1(fouls1 + 1)} className="text-slate-400 hover:text-slate-200">+</button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 block">Yellow / Red</span>
              <div className="flex items-center justify-center gap-1.5 mt-1 font-bold text-xs">
                <span className="text-amber-500">{yellow1}Y</span>
                <span className="text-slate-300">/</span>
                <span className="text-rose-500">{red1}R</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 block">Timeouts Left</span>
              <span className="font-black text-sm text-indigo-500 block mt-1">{timeouts1}</span>
            </div>
          </div>
        </div>

        {/* Team 2 Score Board */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-500/40 p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{activeMatch?.college2}</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{activeMatch?.team2}</h3>
            </div>
            <div className="text-center bg-blue-500/10 px-4 py-2 rounded-2xl border border-blue-500/30">
              <span className="text-[9px] font-bold text-blue-500 uppercase block">Points</span>
              <span className="text-3xl font-black text-blue-500">{score2}</span>
            </div>
          </div>

          {/* Increments / Decrements */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Adjust Score</span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleScoreChange(2, 1)}
                className="py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-md transition"
              >
                +1
              </button>
              <button
                onClick={() => handleScoreChange(2, 2)}
                className="py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-md transition"
              >
                +2
              </button>
              <button
                onClick={() => handleScoreChange(2, 4)}
                className="py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-md transition"
              >
                +4
              </button>
              <button
                onClick={() => handleScoreChange(2, -1)}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-black text-base transition"
              >
                -1
              </button>
            </div>
          </div>

          {/* Fouls, Cards, Timeouts */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 block">Fouls</span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <button onClick={() => setFouls2(Math.max(0, fouls2 - 1))} className="text-slate-400 hover:text-slate-200">-</button>
                <span className="font-black text-sm text-slate-900 dark:text-white">{fouls2}</span>
                <button onClick={() => setFouls2(fouls2 + 1)} className="text-slate-400 hover:text-slate-200">+</button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 block">Yellow / Red</span>
              <div className="flex items-center justify-center gap-1.5 mt-1 font-bold text-xs">
                <span className="text-amber-500">{yellow2}Y</span>
                <span className="text-slate-300">/</span>
                <span className="text-rose-500">{red2}R</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 block">Timeouts Left</span>
              <span className="font-black text-sm text-blue-500 block mt-1">{timeouts2}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Score Event History Log */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft space-y-3">
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Live Match Event History & Scoring Timeline
        </h4>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {scoreLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>{log.text}</span>
              <span className="font-mono text-[10px] text-slate-400 font-bold">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
