import React, { useState } from 'react';
import { Radio, Play, Pause, RefreshCw, Trophy, Shield, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const GullyCricketLiveMatchControlTab = ({ matches = [], user, onUpdateMatchScore }) => {
  const { addToast } = useToast();
  const [liveMatches, setLiveMatches] = useState([
    {
      id: 'MATCH-GULLY-001',
      team1: 'Gully Smashers',
      team2: 'Street Kings',
      score1: '48/2',
      score2: '42/4',
      overs1: '5.2 / 6',
      overs2: '6.0 / 6',
      status: 'LIVE',
      batting: 'Gully Smashers'
    }
  ]);

  const handleUpdateScore = (matchId, teamKey, deltaRuns, deltaWickets) => {
    setLiveMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, [teamKey]: `${Math.max(0, parseInt(m[teamKey]) + deltaRuns)}/${Math.max(0, parseInt(m[teamKey].split('/')[1] || 0) + deltaWickets)}` };
      }
      return m;
    }));
    addToast('Live score updated successfully!', 'success');
  };

  const handleFinishMatch = (matchId) => {
    setLiveMatches(prev => prev.filter(m => m.id !== matchId));
    addToast('Gully Cricket match concluded and moved to Results!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft flex items-center justify-between">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-mono font-bold uppercase animate-pulse">● LIVE SCORE CONTROLLER</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">Gully Cricket Live Match Ops</h2>
          <p className="text-xs text-slate-500">Update runs, wickets, and overs in real time for tennis ball matches.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {liveMatches.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <Radio className="w-12 h-12 text-slate-400 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">No Live Gully Cricket Matches Active</h3>
          </div>
        ) : (
          liveMatches.map(m => (
            <div key={m.id} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6 shadow-soft">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500 text-white animate-pulse">● LIVE MATCH</span>
                <button
                  onClick={() => handleFinishMatch(m.id)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Finish Match & Declare Winner
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-sm">{m.team1}</h4>
                    <span className="text-2xl font-black text-emerald-600 font-mono">{m.score1}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Overs: {m.overs1}</span>
                    <div className="space-x-1">
                      <button onClick={() => handleUpdateScore(m.id, 'score1', 1, 0)} className="px-2 py-1 bg-blue-600 text-white rounded font-bold">+1</button>
                      <button onClick={() => handleUpdateScore(m.id, 'score1', 4, 0)} className="px-2 py-1 bg-emerald-600 text-white rounded font-bold">+4</button>
                      <button onClick={() => handleUpdateScore(m.id, 'score1', 6, 0)} className="px-2 py-1 bg-indigo-600 text-white rounded font-bold">+6</button>
                      <button onClick={() => handleUpdateScore(m.id, 'score1', 0, 1)} className="px-2 py-1 bg-rose-600 text-white rounded font-bold">W</button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-sm">{m.team2}</h4>
                    <span className="text-2xl font-black text-indigo-600 font-mono">{m.score2}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Overs: {m.overs2}</span>
                    <div className="space-x-1">
                      <button onClick={() => handleUpdateScore(m.id, 'score2', 1, 0)} className="px-2 py-1 bg-blue-600 text-white rounded font-bold">+1</button>
                      <button onClick={() => handleUpdateScore(m.id, 'score2', 4, 0)} className="px-2 py-1 bg-emerald-600 text-white rounded font-bold">+4</button>
                      <button onClick={() => handleUpdateScore(m.id, 'score2', 6, 0)} className="px-2 py-1 bg-indigo-600 text-white rounded font-bold">+6</button>
                      <button onClick={() => handleUpdateScore(m.id, 'score2', 0, 1)} className="px-2 py-1 bg-rose-600 text-white rounded font-bold">W</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
