import React, { useState, useEffect } from 'react';
import { Trophy, Trash2, Download, Filter, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF, exportToCSV, exportSportResultPDF } from '../../../utils/pdfExporter';
import { exportResultsToExcel } from '../../../utils/excelExporter';

const DEFAULT_KHOKHO_RESULTS = [
  {
    id: 'M-KHO-101',
    eventTitle: 'Kho-Kho Mens Championship 2026',
    format: '2 Innings / 2 Sets (Standard 9v9)',
    category: 'Mens Team',
    team1: 'MPEC Chasers',
    team2: 'MIPS Runners',
    score1: 18,
    score2: 14,
    setsWon1: 1,
    setsWon2: 0,
    setsHistory: [
      { set: 1, label: 'Set 1 (Inning 1)', score1: 10, score2: 6, winner: 'MPEC Chasers', isLocked: true },
      { set: 2, label: 'Set 2 (Inning 2)', score1: 8, score2: 8, winner: 'Draw', isLocked: true }
    ],
    scoreSummary: 'MPEC Chasers def. MIPS Runners 18-14 Pts (Set 1: 10-6 | Set 2: 8-8)',
    winner: 'MPEC Chasers',
    tableNumber: 'Ground 2 Kho-Kho Field 1',
    venue: 'Ground 2 Kho-Kho Field 1',
    time: '04:00 PM',
    completedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'M-KHO-102',
    eventTitle: 'Womens Kho-Kho League 2026',
    format: '2 Innings / 2 Sets (Standard 9v9)',
    category: 'Womens Team',
    team1: 'MPCP Defenders',
    team2: 'MPCPS Strikers',
    score1: 15,
    score2: 11,
    setsWon1: 2,
    setsWon2: 0,
    setsHistory: [
      { set: 1, label: 'Set 1 (Inning 1)', score1: 8, score2: 5, winner: 'MPCP Defenders', isLocked: true },
      { set: 2, label: 'Set 2 (Inning 2)', score1: 7, score2: 6, winner: 'MPCP Defenders', isLocked: true }
    ],
    scoreSummary: 'MPCP Defenders def. MPCPS Strikers 15-11 Pts (Set 1: 8-5 | Set 2: 7-6)',
    winner: 'MPCP Defenders',
    tableNumber: 'Ground 2 Kho-Kho Field 2',
    venue: 'Ground 2 Kho-Kho Field 2',
    time: '05:30 PM',
    completedAt: new Date(Date.now() - 7200000).toISOString()
  }
];

const mockIds = ['M540746', 'M635812', 'M741299', 'M882104', 'M645537'];
const mockNames = ['mock team', 'demo team', 'sample team', 'test team'];

export const KhoKhoResultManagementTab = ({ user }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();
  const [resultsList, setResultsList] = useState([]);
  const [winnerModalMatch, setWinnerModalMatch] = useState(null);
  
  // Filter States
  const [selectedEvent, setSelectedEvent] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [availableEvents, setAvailableEvents] = useState([]);

  const sportId = 'kho-kho';
  const sportName = 'Kho-Kho';
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

      const saved = localStorage.getItem(resultsKey) || localStorage.getItem('sems_completed_results_kho_kho');
      let list = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          list = Array.isArray(parsed) ? parsed.filter((r) => r && r.id && (r.team1 || r.team1Name)) : [];
        } catch (e) {
          list = [];
        }
      }

      try {
        const apiMatches = await coordinatorApi.getMatches();
        const completedApiMatches = (Array.isArray(apiMatches) ? apiMatches : []).filter((m) =>
          m && (m.status === 'COMPLETED' || m.status === 'FINISHED' || m.status === 'WALKOVER') &&
          (!m.sport || m.sport.toLowerCase().includes('kho') || m.sportId?.toLowerCase().includes('kho') || m.eventTitle?.toLowerCase().includes('kho'))
        );

        completedApiMatches.forEach((apiMatch) => {
          if (!list.some((existing) => existing.id === apiMatch.id)) {
            list.push(apiMatch);
          }
        });
      } catch (e) {}

      let cleaned = list.filter((r) => {
        if (!r) return false;
        if (mockIds.includes(r.id)) return false;
        const t1 = (r.team1 || r.team1Name || '').trim().toLowerCase();
        const t2 = (r.team2 || r.team2Name || '').trim().toLowerCase();
        const w = (r.winner || '').trim().toLowerCase();
        return !mockNames.includes(t1) && !mockNames.includes(t2) && !mockNames.includes(w);
      });

      if (!saved && cleaned.length === 0) {
        cleaned = DEFAULT_KHOKHO_RESULTS;
      }

      setResultsList(cleaned);
      localStorage.setItem(resultsKey, JSON.stringify(cleaned));
    };

    loadData();

    const handleSync = () => loadData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('sems_results_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('sems_results_updated', handleSync);
    };
  }, [resultsKey]);

  const handleSetWinner = async (id, winnerName) => {
    if (!winnerName) return;
    try {
      const updated = resultsList.map((r) => (r.id === id ? { ...r, winner: winnerName } : r));
      setResultsList(updated);
      localStorage.setItem(resultsKey, JSON.stringify(updated));
      await coordinatorApi.completeMatch(id, { winner: winnerName });
      setWinnerModalMatch(null);
      window.dispatchEvent(new Event('sems_results_updated'));
      addToast(`🏆 Declared official winner: ${winnerName}`, 'success');
    } catch (err) {
      addToast('Error setting match winner', 'error');
    }
  };

  const handleDeleteResult = async (id) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Result Entry',
      message: 'Are you sure you want to delete this Kho-Kho match result entry?'
    });
    if (!isConfirmed) return;
    try {
      await coordinatorApi.deleteMatch(id).catch(() => {});
    } catch (e) {}
    const updated = resultsList.filter((r) => r.id !== id);
    setResultsList(updated);
    localStorage.setItem(resultsKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('sems_results_updated'));
    addToast('Result entry deleted successfully', 'info');
  };

  const handleClearResults = async () => {
    const isConfirmed = await confirmDelete({
      title: 'Clear All Results',
      message: 'Are you sure you want to clear all declared Kho-Kho results data?'
    });
    if (isConfirmed) {
      setResultsList([]);
      localStorage.setItem(resultsKey, JSON.stringify([]));
      localStorage.removeItem('sems_completed_results_kho_kho');
      window.dispatchEvent(new Event('sems_results_updated'));
      addToast('All declared Kho-Kho results cleared', 'info');
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
      const cat = (r.category || r.gender || 'Open').toLowerCase().trim();
      const filterG = selectedGender.toLowerCase().trim();
      const isFemale = cat.includes('female') || cat.includes('girl') || cat.includes('women') || cat.includes('woman') || cat === 'f';
      const isMale = !isFemale && (cat.includes('male') || cat.includes('boy') || cat.includes('men') || cat.includes('man') || cat === 'm');

      if (filterG === 'male' && !isMale) return false;
      if (filterG === 'female' && !isFemale) return false;
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
        sport: 'kho-kho',
        gender: selectedGender
      });
      addToast(`Exported ${filteredResults.length} Kho-Kho match results to Excel (.xlsx)!`, 'success');
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
      exportSportResultPDF('kho-kho', filteredResults, 'APEX 2026 Kho-Kho Match Results Report');
      addToast('Downloaded official Kho-Kho Results PDF Report!', 'success');
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
              <span>Kho-Kho Results & Winner Management (2 Innings / 2 Sets)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Showing {filteredResults.length} of {resultsList.length} completed Kho-Kho 2-Inning matches
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
                <button
                  onClick={handleClearResults}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-500/20 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Filter Results:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-3 flex-1 max-w-2xl">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Filter by Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
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
                <th className="p-4">FINAL SCORE & 2 SETS BREAKDOWN</th>
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
                filteredResults.map((r) => {
                  const t1Name = r.team1 || r.team1Name || 'Team 1';
                  const t2Name = r.team2 || r.team2Name || 'Team 2';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">#{r.id}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                            {r.format || '2 INNINGS / 2 SETS'}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                            {r.eventTitle || 'Kho-Kho Championship'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {t1Name} <span className="text-slate-400 text-xs font-normal">vs</span> {t2Name}
                        </p>
                      </td>

                      <td className="p-4 font-bold">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                          {r.category || r.gender || 'Open'}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                        📍 {r.tableNumber || r.venue || 'Ground 2 Kho-Kho Field 1'} • {r.time || 'Completed'}
                      </td>

                      <td className="p-4 font-bold">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                              Total: {r.score1 !== undefined && r.score2 !== undefined
                                ? `${r.score1} - ${r.score2} Pts`
                                : (r.scoreSummary || 'Match Completed')}
                            </span>
                          </div>

                          {/* 2 Sets / Innings Breakdown Pill */}
                          {r.setsHistory && Array.isArray(r.setsHistory) && r.setsHistory.length > 0 ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold flex-wrap">
                              {r.setsHistory.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                  Set {s.set} (Inning {s.set}): {s.score1}-{s.score2}
                                </span>
                              ))}
                            </div>
                          ) : r.scoreSummary ? (
                            <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                              {r.scoreSummary}
                            </div>
                          ) : null}

                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-black pt-0.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Winner: {r.winner || t1Name}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => generateMatchResultPDF(r, 'Kho-Kho')}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            title="Download Result PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => setWinnerModalMatch(r)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1 cursor-pointer"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Set Winner</span>
                          </button>
                          <button
                            onClick={() => handleDeleteResult(r.id)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 transition cursor-pointer"
                            title="Delete Result"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Winner Selection Modal */}
      {winnerModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black">Declare Official Winner</h3>
              </div>
              <button
                onClick={() => setWinnerModalMatch(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select the winning team for match <strong className="text-slate-900 dark:text-white">#{winnerModalMatch.id}</strong>:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSetWinner(winnerModalMatch.id, winnerModalMatch.team1 || winnerModalMatch.team1Name || 'Team 1')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Team 1</span>
                  <span className="text-sm font-black group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    {winnerModalMatch.team1 || winnerModalMatch.team1Name || 'Team 1'}
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition">Select 🥇</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetWinner(winnerModalMatch.id, winnerModalMatch.team2 || winnerModalMatch.team2Name || 'Team 2')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Team 2</span>
                  <span className="text-sm font-black group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    {winnerModalMatch.team2 || winnerModalMatch.team2Name || 'Team 2'}
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition">Select 🥇</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetWinner(winnerModalMatch.id, 'Match Draw / Tie')}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs text-center transition cursor-pointer"
              >
                Declare Match Draw / Tie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
