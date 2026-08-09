import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Play, CheckCircle2, RefreshCw, Zap, Shield } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const KhoKhoRoleSetupModal = ({ match, targetVenue, onClose, onSetupComplete }) => {
  const { addToast } = useToast();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const team1 = match?.team1 || 'Team A';
  const team2 = match?.team2 || 'Team B';

  const [tossWinner, setTossWinner] = useState('team1');
  const [tossDecision, setTossDecision] = useState('chasing'); // 'chasing' or 'running'

  // Calculated roles for Inning 1
  const chasingTeamKey = (tossWinner === 'team1' && tossDecision === 'chasing') || (tossWinner === 'team2' && tossDecision === 'running')
    ? 'team1'
    : 'team2';

  const chasingTeamName = chasingTeamKey === 'team1' ? team1 : team2;
  const runningTeamName = chasingTeamKey === 'team1' ? team2 : team1;

  const handleStartGame = () => {
    const roleData = {
      tossWinner: tossWinner === 'team1' ? team1 : team2,
      tossDecision,
      chasingTeamKey,
      chasingTeamName,
      runningTeamName,
      activeTurn: 1,
      currentSet: 1,
      setsHistory: match?.setsHistory || [
        { set: 1, label: 'Set 1 (Inning 1)', score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 2, label: 'Set 2 (Inning 2)', score1: 0, score2: 0, isLocked: false, winner: null },
      ]
    };

    addToast(`🏃‍♂️ Roles set! ${chasingTeamName} starts as CHASER, ${runningTeamName} as RUNNER.`, 'success');
    onSetupComplete(roleData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-xl font-bold">
              🏃‍♂️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Kho-Kho Pre-Match Role & Toss Setup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {targetVenue || match?.venue || 'Kho-Kho Field 1'} • Select Chaser & Runner Teams
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Teams Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500">OFFICIAL MATCH FIXTURE</span>
          <div className="text-lg font-black tracking-tight flex items-center justify-center gap-3">
            <span className="text-amber-600 dark:text-amber-400">{team1}</span>
            <span className="text-slate-400 text-sm font-normal">VS</span>
            <span className="text-amber-600 dark:text-amber-400">{team2}</span>
          </div>
        </div>

        {/* Step 1: Toss Winner */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            1. Select Toss Winning Team
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTossWinner('team1')}
              className={`p-3.5 rounded-2xl border text-xs font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
                tossWinner === 'team1'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-102'
                  : 'bg-slate-50 dark:bg-[#090D16] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🥇 {team1}</span>
              <span className="text-[10px] opacity-80 font-mono font-normal">Toss Winner</span>
            </button>

            <button
              type="button"
              onClick={() => setTossWinner('team2')}
              className={`p-3.5 rounded-2xl border text-xs font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
                tossWinner === 'team2'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-102'
                  : 'bg-slate-50 dark:bg-[#090D16] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🥇 {team2}</span>
              <span className="text-[10px] opacity-80 font-mono font-normal">Toss Winner</span>
            </button>
          </div>
        </div>

        {/* Step 2: Toss Winner Decision */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            2. {tossWinner === 'team1' ? team1 : team2}'s Choice (Decision)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTossDecision('chasing')}
              className={`p-3.5 rounded-2xl border text-xs font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
                tossDecision === 'chasing'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/20 scale-102'
                  : 'bg-slate-50 dark:bg-[#090D16] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🏃‍♂️ Choose Chasing (Attacking)</span>
              <span className="text-[10px] opacity-80 font-mono font-normal">Chasers in Inning 1</span>
            </button>

            <button
              type="button"
              onClick={() => setTossDecision('running')}
              className={`p-3.5 rounded-2xl border text-xs font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
                tossDecision === 'running'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20 scale-102'
                  : 'bg-slate-50 dark:bg-[#090D16] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🛡️ Choose Running (Defending)</span>
              <span className="text-[10px] opacity-80 font-mono font-normal">Runners in Inning 1</span>
            </button>
          </div>
        </div>

        {/* Roles Summary Display for Inning 1 */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            INNING 1 (SET 1) ROLES BREAKDOWN
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              <span className="text-[9px] block uppercase text-slate-400">CHASERS (ATTACKING):</span>
              <span className="text-sm font-black">{chasingTeamName}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <span className="text-[9px] block uppercase text-slate-400">RUNNERS (DEFENDING):</span>
              <span className="text-sm font-black">{runningTeamName}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStartGame}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Confirm Roles & Start Live Score Control</span>
        </button>

      </div>
    </div>,
    document.body
  );
};
