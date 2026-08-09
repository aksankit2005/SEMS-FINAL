import React, { useState } from 'react';
import { Award, Download, Trophy, CheckCircle, Search } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { exportToCSV } from '../../../utils/pdfExporter';

export const GullyCricketResultManagementTab = ({ user, globalSearch = '' }) => {
  const { addToast } = useToast();
  const [resultsList, setResultsList] = useState([
    {
      id: 'RES-GCK-001',
      eventTitle: 'Inter-College Gully Cricket Championship 2026',
      team1: 'Gully Smashers',
      team2: 'Street Kings',
      winner: 'Gully Smashers',
      manOfTheMatch: 'Dr. Nikhil Arora',
      finalScore: 'Gully Smashers: 58/3 (6 ov) defeated Street Kings: 44/6 (6 ov)',
      matchStatus: 'COMPLETED',
      venue: 'Ground 1',
      date: '2026-09-05',
    }
  ]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600">Gully Cricket Match Results</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">Gully Cricket Match Result & Statistics</h2>
          <p className="text-xs text-slate-500">View match outcomes, Winner, Man of the Match, Final Score, Match Status, and export result records.</p>
        </div>
        <button
          onClick={() => {
            exportToCSV(resultsList, 'Gully_Cricket_Match_Results');
            addToast('Exported Gully Cricket results to CSV!', 'success');
          }}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Results
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {resultsList.map(r => (
          <div key={r.id} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase">● {r.matchStatus}</span>
                <span className="text-xs text-slate-400 font-mono">{r.date} • 📍 {r.venue}</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{r.team1} vs {r.team2}</h3>
              <p className="text-xs font-bold text-emerald-600">🏆 Winner: {r.winner} | Man of the Match: {r.manOfTheMatch}</p>
              <p className="text-xs font-mono text-slate-500">Final Score: {r.finalScore}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 font-black text-xs border border-amber-500/20">Official Result</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
