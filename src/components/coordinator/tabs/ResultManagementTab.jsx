import React, { useState, useEffect } from 'react';
import { Trophy, Trash2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const ResultManagementTab = ({ user }) => {
  const { addToast } = useToast();
  const [resultsList, setResultsList] = useState([]);

  const sportId = user?.assignedSport || 'table-tennis';
  const resultsKey = `sems_completed_results_${sportId}`;

  // Load results from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(resultsKey);
    if (saved) {
      try {
        setResultsList(JSON.parse(saved));
      } catch (e) {}
    } else {
      setResultsList([]);
    }
  }, [resultsKey]);

  const handleSetWinner = async (id, winnerName) => {
    try {
      const updated = resultsList.map((r) => (r.id === id ? { ...r, winner: winnerName } : r));
      setResultsList(updated);
      localStorage.setItem(resultsKey, JSON.stringify(updated));
      await coordinatorApi.completeMatch(id, { winner: winnerName });
      addToast(`Declared official winner: ${winnerName}`, 'success');
    } catch (err) {
      addToast('Error setting match winner', 'error');
    }
  };

  const handleClearResults = () => {
    if (window.confirm('Clear all declared results data from storage?')) {
      setResultsList([]);
      localStorage.removeItem(resultsKey);
      addToast('All declared results cleared', 'info');
    }
  };

  return (
    <div className="space-y-6 text-slate-200 animate-fade-in">
      
      {/* Table Container */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white tracking-tight">
            Declare Results & Set Winner
          </h3>

          {resultsList.length > 0 && (
            <button
              onClick={handleClearResults}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Results</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="p-4">MATCH DETAILS</th>
                <th className="p-4">TABLE / TIME</th>
                <th className="p-4">SCORESWINNER STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {resultsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No results declared yet. Completed live matches will appear here automatically.
                  </td>
                </tr>
              ) : (
                resultsList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">#{r.id}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 uppercase">
                          {r.format || 'SINGLES'}
                        </span>
                      </div>
                      <p className="font-bold text-white text-sm">{r.team1} vs {r.team2}</p>
                    </td>

                    <td className="p-4 font-mono text-slate-400">
                      {r.tableNumber || r.table || 'Table 1'} | {r.time || 'Completed'}
                    </td>

                    <td className="p-4 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white text-sm">{r.score1 || 0} - {r.score2 || 0}</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" /> Winner: {r.winner || r.team1}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSetWinner(r.id, r.winner || r.team1)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
                      >
                        Set Winner
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
