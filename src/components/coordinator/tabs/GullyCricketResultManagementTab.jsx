import React, { useState } from 'react';
import { Award, Download, Trophy, CheckCircle, Search } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { exportToCSV } from '../../../utils/pdfExporter';

export const GullyCricketResultManagementTab = ({ user, globalSearch = '' }) => {
  const { addToast } = useToast();
  const [resultsList, setResultsList] = useState([
    {
      id: 'RES-GULLY-001',
      eventTitle: '6-Overs Fast Box Championship 2026',
      team1: 'Gully Smashers',
      team2: 'Street Kings',
      winner: 'Gully Smashers',
      scoreSummary: 'Gully Smashers won by 14 runs',
      venue: 'Central Ground B - Pitch 1',
      date: '2026-09-05',
      status: 'COMPLETED'
    }
  ]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600">Gully Cricket Results</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">Completed Matches & Winners</h2>
          <p className="text-xs text-slate-500">View tournament podiums, match outcomes, and export result records.</p>
        </div>
        <button
          onClick={() => {
            exportToCSV(resultsList, 'Gully_Cricket_Results');
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
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">● COMPLETED</span>
                <span className="text-xs text-slate-400">{r.date} • {r.venue}</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{r.team1} vs {r.team2}</h3>
              <p className="text-xs font-bold text-emerald-600 mt-0.5">🏆 Winner: {r.winner} ({r.scoreSummary})</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 font-black text-xs border border-amber-500/20">Official Medalist</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
