import React, { useState, useEffect } from 'react';
import { Trophy, Trash2, Download, Filter, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF, exportToCSV } from '../../../utils/pdfExporter';

export const ResultManagementTab = ({ user }) => {
  const { addToast } = useToast();
  const [resultsList, setResultsList] = useState([]);
  
  // Filter States
  const [selectedEvent, setSelectedEvent] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [availableEvents, setAvailableEvents] = useState([]);

  const sportId = user?.assignedSport || 'badminton';
  const sportName = user?.sportName || 'Badminton';
  const resultsKey = `sems_completed_results_${sportId}`;

  // Load results & events on mount
  useEffect(() => {
    const loadData = async () => {
      // Load events list for dropdown (only real created events)
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


      // Load results list & purge legacy mock entries
      const mockIds = ['M540746', 'M635812', 'M741299', 'M882104', 'M645537'];
      const mockNames = [
        '1', '2', 'a', 'b', 'player 1', 'player 2', 'player 3', 'player 4', 'team 1', 'team 2', 'team a', 'team b', 'albert', 'romi',
        'aarav sharma (mpec)', 'rohan gupta (mips)', 'ankur dixit (mpcps)', 'aditya singh (mpec)',
        'aagaz khan (mpcps kn142)', 'shiv prakash (mpcps kn142)', 'kapil verma (mpcps kn142)', 'anubhav sachan (mpcps kn142)',
        'kapil verma', 'anubhav sachan', 'team a', 'team b', 'team 1', 'team 2', 'player / team a', 'player / team b'
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
  }, [resultsKey, sportName]);


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

  const handleDeleteResult = (id) => {
    const updated = resultsList.filter((r) => r.id !== id);
    setResultsList(updated);
    localStorage.setItem(resultsKey, JSON.stringify(updated));
    addToast('Result entry deleted', 'info');
  };

  const handleClearResults = () => {
    if (window.confirm('Clear all declared results data from storage?')) {
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

  // Filtered Results Logic
  const filteredResults = resultsList.filter((r) => {
    // Event filter (matches against created event titles)
    if (selectedEvent !== 'ALL') {
      const matchEvent = (r.eventTitle || r.title || r.eventName || '').toLowerCase();
      if (!matchEvent.includes(selectedEvent.toLowerCase())) {
        return false;
      }
    }

    // Gender filter (All, Male, Female)
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

  // Export Results to Excel/CSV
  const handleExportExcel = () => {
    if (filteredResults.length === 0) {
      addToast('No match results available to export', 'error');
      return;
    }

    const excelData = filteredResults.map((r) => {
      const setsBreakdown = r.setsHistory && Array.isArray(r.setsHistory) && r.setsHistory.some((s) => s.score1 > 0 || s.score2 > 0)
        ? r.setsHistory.filter((s) => s.score1 > 0 || s.score2 > 0).map((s) => `S${s.set}: ${s.score1}-${s.score2}`).join(' | ')
        : (r.scoreSummary || 'N/A');

      return {
        'Match ID': r.id || 'N/A',
        'Event Title': r.eventTitle || `${sportName} Tournament`,
        'Format': r.format || 'SINGLES',
        'Category / Gender': r.category || r.gender || 'Open',
        'Player / Team 1': r.team1 || 'TBD',
        'Player / Team 2': r.team2 || 'TBD',
        'Sets Won': r.setsWon1 !== undefined && r.setsWon2 !== undefined ? `${r.setsWon1} - ${r.setsWon2} Sets` : 'N/A',
        'Set-by-Set Points': setsBreakdown,
        'Declared Winner': r.winner || r.team1 || 'TBD',
        'Venue / Court': r.tableNumber || r.venue || 'Court 1',
        'Time / Slot': r.time || 'Completed',
        'Completed Date': r.completedAt ? new Date(r.completedAt).toLocaleString() : 'N/A'
      };
    });

    exportToCSV(excelData, `${sportName}_Match_Results_${new Date().toISOString().split('T')[0]}`);
    addToast(`Exported ${filteredResults.length} match results to Excel/CSV!`, 'success');
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in">
      
      {/* Table Container */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-2xl space-y-5">
        
        {/* Top Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>Declare Results & Winner Management</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Showing {filteredResults.length} of {resultsList.length} completed matches
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {filteredResults.length > 0 && (
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel / CSV</span>
              </button>
            )}

            {resultsList.length > 0 && (
              <button
                onClick={handleClearResults}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-600/20 hover:bg-rose-100 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white border border-rose-200 dark:border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Results</span>
              </button>
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
            {/* Event Filter */}
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

            {/* Gender Filter */}
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

            {/* Reset Filters Button */}
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
                <th className="p-4">FINAL SCORE & WINNER</th>
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
                    
                    {/* MATCH DETAILS */}
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">#{r.id}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-indigo-300 border border-blue-500/20 uppercase">
                          {r.format || 'SINGLES'}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                          {r.eventTitle || `${sportName} Championship`}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{r.team1} vs {r.team2}</p>
                    </td>

                    {/* CATEGORY / GENDER */}
                    <td className="p-4 font-bold">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                        {r.category || r.gender || 'Open'}
                      </span>
                    </td>

                    {/* VENUE / TIME */}
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                      📍 {r.tableNumber || r.venue || 'Court 1'} • {r.time || 'Completed'}
                    </td>

                    {/* SCORE & WINNER */}
                    <td className="p-4 font-bold">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                            {r.setsWon1 !== undefined && r.setsWon2 !== undefined
                              ? `${r.setsWon1} - ${r.setsWon2} Sets`
                              : `${r.score1 || 0} - ${r.score2 || 0} Pts`}
                          </span>
                        </div>

                        {/* Set by Set Breakdown Points */}
                        {r.setsHistory && Array.isArray(r.setsHistory) && r.setsHistory.some((s) => s.score1 > 0 || s.score2 > 0) && (
                          <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                            {r.setsHistory
                              .filter((s) => s.score1 > 0 || s.score2 > 0)
                              .map((s) => `S${s.set}: ${s.score1}-${s.score2}`)
                              .join(' | ')}
                          </div>
                        )}

                        {r.scoreSummary && (!r.setsHistory || !r.setsHistory.some((s) => s.score1 > 0 || s.score2 > 0)) && (
                          <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                            {r.scoreSummary}
                          </div>
                        )}

                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-black pt-0.5">
                          <Trophy className="w-3.5 h-3.5" /> Winner: {r.winner || r.team1}
                        </span>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => generateMatchResultPDF(r, user?.sportName || user?.assignedSport || 'badminton')}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 text-blue-600 dark:text-orange-300 border border-blue-200 dark:border-orange-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => handleSetWinner(r.id, r.winner || r.team1)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                        >
                          Set Winner
                        </button>
                        <button
                          onClick={() => handleDeleteResult(r.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white border border-rose-200 dark:border-rose-500/30 transition cursor-pointer"
                          title="Delete Result"
                        >
                          <Trash2 className="w-4 h-4" />
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


