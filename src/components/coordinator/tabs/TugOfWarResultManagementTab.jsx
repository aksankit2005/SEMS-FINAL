import React, { useState, useEffect } from 'react';
import { Trophy, Trash2, Download, Filter, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF, exportToCSV, exportSportResultPDF } from '../../../utils/pdfExporter';
import { exportResultsToExcel } from '../../../utils/excelExporter';

export const TugOfWarResultManagementTab = ({ user }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();
  const [resultsList, setResultsList] = useState([]);
  
  // Filter States
  const [selectedEvent, setSelectedEvent] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [availableEvents, setAvailableEvents] = useState([]);

  const sportId = 'tug-of-war';
  const sportName = 'Tug of War';
  const resultsKey = `sems_completed_results_${sportId}`;

  // Load results & events on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsList = await coordinatorApi.getEvents();
        if (eventsList && eventsList.length > 0) {
          setAvailableEvents(eventsList.map((e) => e.title));
        } else {
          setAvailableEvents([]);
        }
      } catch (e) {
        setAvailableEvents([]);
      }

      const mockIds = ['M540746', 'M635812', 'M741299', 'M882104', 'M645537'];
      const mockNames = [
        '1', '2', 'a', 'b', 'player 1', 'player 2', 'player 3', 'player 4', 'team 1', 'team 2', 'team a', 'team b', 'albert', 'romi'
      ];
      const saved = localStorage.getItem(resultsKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const cleaned = Array.isArray(parsed)
            ? parsed.filter((r) => {
                if (!r) return false;
                if (mockIds.includes(r.id)) return false;
                const t1 = (r.team1 || '').trim().toLowerCase();
                const t2 = (r.team2 || '').trim().toLowerCase();
                const w = (r.winner || '').trim().toLowerCase();
                return !mockNames.includes(t1) && !mockNames.includes(t2) && !mockNames.includes(w);
              })
            : [];
          setResultsList(cleaned);
          localStorage.setItem(resultsKey, JSON.stringify(cleaned));
        } catch (e) {
          setResultsList([]);
        }
      } else {
        setResultsList([]);
      }
    };

    loadData();
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

  const handleDeleteResult = async (id) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Result Entry',
      message: 'Are you sure you want to delete this Tug of War match result entry?'
    });
    if (!isConfirmed) return;
    const updated = resultsList.filter((r) => r.id !== id);
    setResultsList(updated);
    localStorage.setItem(resultsKey, JSON.stringify(updated));
    addToast('Result entry deleted', 'info');
  };

  const handleClearResults = async () => {
    const isConfirmed = await confirmDelete({
      title: 'Clear All Results',
      message: 'Are you sure you want to clear all declared Tug of War results data from storage?'
    });
    if (isConfirmed) {
      setResultsList([]);
      localStorage.removeItem(resultsKey);
      addToast('All declared results cleared', 'info');
    }
  };

  const handleResetFilters = () => {
    setSelectedEvent('ALL');
    setSelectedGender('ALL');
    addToast('Result filters reset', 'info');
  };

  const filteredResults = resultsList.filter((r) => {
    if (selectedEvent !== 'ALL') {
      const matchEvent = (r.eventTitle || r.title || r.eventName || '').toLowerCase();
      if (!matchEvent.includes(selectedEvent.toLowerCase())) {
        return false;
      }
    }

    if (selectedGender !== 'ALL') {
      const cat = (r.category || r.gender || 'Open').toLowerCase();
      const filterG = selectedGender.toLowerCase();

      if (filterG === 'male') {
        if (!cat.includes('male') && !cat.includes('boy') && !cat.includes('men')) return false;
      } else if (filterG === 'female') {
        if (!cat.includes('female') && !cat.includes('girl') && !cat.includes('women')) return false;
      }
    }

    return true;
  });

  const handleExportExcel = () => {
    if (filteredResults.length === 0) {
      addToast('No match results available to export', 'error');
      return;
    }

    try {
      exportResultsToExcel(filteredResults, {
        sport: 'tug-of-war',
        gender: selectedGender
      });
      addToast(`Exported ${filteredResults.length} Tug of War match results to Excel (.xlsx)!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to export match results', 'error');
    }
  };

  const handleExportPDF = () => {
    if (filteredResults.length === 0) {
      addToast('No match results available to export', 'error');
      return;
    }

    try {
      exportSportResultPDF('tug-of-war', filteredResults, 'APEX 2026 Tug of War Match Results Report');
      addToast('Downloaded official Tug of War Results PDF Report!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to export PDF report', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">
      
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-2xl space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>Tug of War Results & Winner Management</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Showing {filteredResults.length} of {resultsList.length} completed tug of war matches
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {filteredResults.length > 0 && (
              <>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <span>Filter Results:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-3 flex-1 max-w-2xl">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Filter by Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Events</option>
                {availableEvents.map((evtTitle, idx) => (
                  <option key={idx} value={evtTitle}>{evtTitle}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Filter by Gender / Category</label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {(selectedEvent !== 'ALL' || selectedGender !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="mt-4 md:mt-0 self-end px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="p-4">MATCH DETAILS & EVENT</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">VENUE / TIME</th>
                <th className="p-4">ROUNDS WON & WINNER</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                    No results match the selected filters ({selectedEvent !== 'ALL' ? `Event: ${selectedEvent}` : ''} {selectedGender !== 'ALL' ? `Gender: ${selectedGender}` : ''}).
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">#{r.id}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 uppercase">
                          {r.format || 'TEAM MATCH (8v8)'}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                          {r.eventTitle || 'Tug of War Championship'}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {r.team1 || r.team1Name || 'Team 1'} <span className="text-slate-400 text-xs font-normal">vs</span> {r.team2 || r.team2Name || 'Team 2'}
                      </p>
                    </td>

                    <td className="p-4 font-bold">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                        {r.category || r.gender || 'Open'}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                      📍 {r.tableNumber || r.venue || 'Tug of War Ground 1'} • {r.time || 'Completed'}
                    </td>

                    <td className="p-4 font-bold">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                            {r.roundsWon1 !== undefined && r.roundsWon2 !== undefined
                              ? `${r.roundsWon1} - ${r.roundsWon2} Rounds`
                              : '0 - 0 Rounds'}
                          </span>
                        </div>

                        {r.roundsHistory && Array.isArray(r.roundsHistory) && r.roundsHistory.some((s) => s.winner) && (
                          <div className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-semibold">
                            {r.roundsHistory
                              .filter((s) => s.winner)
                              .map((s) => `R${s.round}: ${s.winner}`)
                              .join(' | ')}
                          </div>
                        )}

                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-black pt-0.5">
                          <Trophy className="w-3.5 h-3.5" /> Winner: {r.winner || r.team1}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => generateMatchResultPDF(r, 'Tug of War')}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 text-blue-600 dark:text-orange-300 border border-blue-200 dark:border-orange-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => handleSetWinner(r.id, r.winner || r.team1)}
                          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                        >
                          Set Winner
                        </button>
                      </div>
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
