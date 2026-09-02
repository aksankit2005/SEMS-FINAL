import React, { useState, useEffect } from 'react';
import { Trophy, Trash2, Download, Filter, RefreshCw, FileSpreadsheet, Edit, X, CheckCircle2, Calendar } from 'lucide-react';
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

  // Edit Result Modal State
  const [editingResult, setEditingResult] = useState(null);
  const [editForm, setEditForm] = useState({
    team1: '',
    team2: '',
    eventTitle: '',
    category: 'Open',
    venue: 'Tug of War Ground 1',
    date: '',
    time: '04:00 PM',
    roundsWon1: 0,
    roundsWon2: 0,
    winner: '',
    round1Winner: '',
    round2Winner: '',
    round3Winner: '',
  });

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
    window.addEventListener('sems_results_updated', loadData);
    window.addEventListener('focus', loadData);
    return () => {
      window.removeEventListener('sems_results_updated', loadData);
      window.removeEventListener('focus', loadData);
    };
  }, [resultsKey]);

  const handleOpenEdit = (res) => {
    setEditingResult(res);

    const rHistory = Array.isArray(res.roundsHistory) ? res.roundsHistory : [];
    const r1 = rHistory.find((r) => r.round === 1)?.winner || '';
    const r2 = rHistory.find((r) => r.round === 2)?.winner || '';
    const r3 = rHistory.find((r) => r.round === 3)?.winner || '';

    const t1 = res.team1 || res.team1Name || 'Team 1';
    const t2 = res.team2 || res.team2Name || 'Team 2';
    const rw1 = Number(res.roundsWon1 ?? 0);
    const rw2 = Number(res.roundsWon2 ?? 0);

    setEditForm({
      team1: t1,
      team2: t2,
      eventTitle: res.eventTitle || res.title || 'TUG OF WAR 2026',
      category: res.category || res.gender || 'Open',
      venue: res.tableNumber || res.venue || 'Tug of War Ground 1',
      date: res.date || (res.completedAt ? res.completedAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      time: res.time || '04:00 PM',
      roundsWon1: rw1,
      roundsWon2: rw2,
      winner: res.winner || (rw1 >= rw2 ? t1 : t2),
      round1Winner: r1 || (rw1 > 0 ? t1 : ''),
      round2Winner: r2 || (rw2 > 0 ? t2 : (rw1 > 1 ? t1 : '')),
      round3Winner: r3,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingResult) return;

    if (!editForm.team1.trim() || !editForm.team2.trim()) {
      addToast('Both Team 1 and Team 2 names are required', 'error');
      return;
    }

    const constructedRoundsHistory = [
      { round: 1, winner: editForm.round1Winner || null, isLocked: Boolean(editForm.round1Winner) },
      { round: 2, winner: editForm.round2Winner || null, isLocked: Boolean(editForm.round2Winner) },
      { round: 3, winner: editForm.round3Winner || null, isLocked: Boolean(editForm.round3Winner) },
    ];

    const updatedObj = {
      ...editingResult,
      team1: editForm.team1.trim(),
      team2: editForm.team2.trim(),
      team1Name: editForm.team1.trim(),
      team2Name: editForm.team2.trim(),
      eventTitle: editForm.eventTitle.trim(),
      category: editForm.category,
      gender: editForm.category,
      venue: editForm.venue,
      tableNumber: editForm.venue,
      date: editForm.date,
      time: editForm.time,
      roundsWon1: Number(editForm.roundsWon1),
      roundsWon2: Number(editForm.roundsWon2),
      score1: Number(editForm.roundsWon1),
      score2: Number(editForm.roundsWon2),
      winner: editForm.winner.trim() || editForm.team1.trim(),
      winnerName: editForm.winner.trim() || editForm.team1.trim(),
      roundsHistory: constructedRoundsHistory,
      details: {
        ...(editingResult.details || {}),
        team1: editForm.team1.trim(),
        team2: editForm.team2.trim(),
        team1Name: editForm.team1.trim(),
        team2Name: editForm.team2.trim(),
        roundsWon1: Number(editForm.roundsWon1),
        roundsWon2: Number(editForm.roundsWon2),
        score1: Number(editForm.roundsWon1),
        score2: Number(editForm.roundsWon2),
        winner: editForm.winner.trim() || editForm.team1.trim(),
        roundsHistory: constructedRoundsHistory,
        category: editForm.category,
        venue: editForm.venue,
        date: editForm.date,
        time: editForm.time,
      },
      status: 'COMPLETED',
      completedAt: editingResult.completedAt || new Date().toISOString(),
    };

    const updatedList = resultsList.map((r) => (r.id === editingResult.id ? updatedObj : r));
    setResultsList(updatedList);
    localStorage.setItem(resultsKey, JSON.stringify(updatedList));

    // Remove from deleted IDs set if it was there
    try {
      const deletedStr = localStorage.getItem('sems_deleted_result_ids');
      if (deletedStr) {
        const deletedArr = JSON.parse(deletedStr);
        if (Array.isArray(deletedArr)) {
          const filteredDeleted = deletedArr.filter((did) => did !== editingResult.id);
          localStorage.setItem('sems_deleted_result_ids', JSON.stringify(filteredDeleted));
        }
      }
    } catch (e) {}

    try {
      await coordinatorApi.completeMatch(editingResult.id, updatedObj);
    } catch (err) {
      console.warn('API sync completed with local save');
    }

    window.dispatchEvent(new Event('sems_results_updated'));
    window.dispatchEvent(new Event('storage'));

    addToast(`Match result updated! Declared Winner: ${updatedObj.winner}`, 'success');
    setEditingResult(null);
  };

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

    // Add to deleted IDs set so it never reappears on public pages
    try {
      const deletedStr = localStorage.getItem('sems_deleted_result_ids');
      let deletedArr = [];
      if (deletedStr) {
        try { deletedArr = JSON.parse(deletedStr); } catch (e) {}
      }
      if (!Array.isArray(deletedArr)) deletedArr = [];
      if (!deletedArr.includes(id)) {
        deletedArr.push(id);
        localStorage.setItem('sems_deleted_result_ids', JSON.stringify(deletedArr));
      }
    } catch (e) {}

    try {
      await coordinatorApi.deleteMatch(id);
    } catch (e) {}

    window.dispatchEvent(new Event('sems_results_updated'));
    window.dispatchEvent(new Event('storage'));
    addToast('Result entry deleted successfully', 'info');
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
                          onClick={() => handleOpenEdit(r)}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteResult(r.id)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition cursor-pointer"
                          title="Delete Result"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Edit Result Modal */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111827] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-orange-600 dark:text-orange-400">
                  EDIT TUG OF WAR MATCH RESULT
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Match #{editingResult.id}
                </h3>
              </div>
              <button
                onClick={() => setEditingResult(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              {/* Contestant Teams */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-orange-600 dark:text-orange-400 mb-1">
                    Team 1 Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.team1}
                    onChange={(e) => setEditForm({ ...editForm, team1: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">
                    Team 2 Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.team2}
                    onChange={(e) => setEditForm({ ...editForm, team2: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Event Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={editForm.eventTitle}
                    onChange={(e) => setEditForm({ ...editForm, eventTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                    Category / Gender
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Venue, Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                    Venue / Ground
                  </label>
                  <select
                    value={editForm.venue}
                    onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="Tug of War Ground 1">Tug of War Ground 1</option>
                    <option value="Tug of War Ground 2">Tug of War Ground 2</option>
                    <option value="Tug of War Ground 3">Tug of War Ground 3</option>
                    <option value="Tug of War Ground 4">Tug of War Ground 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                    Match Date
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                    Match Time
                  </label>
                  <input
                    type="text"
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Sets Won & Winner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-orange-600 dark:text-orange-400 mb-1">
                    {editForm.team1 || 'Team 1'} Sets Won
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={editForm.roundsWon1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditForm((prev) => ({
                        ...prev,
                        roundsWon1: val,
                        winner: val > prev.roundsWon2 ? prev.team1 : (prev.roundsWon2 > val ? prev.team2 : prev.winner)
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">
                    {editForm.team2 || 'Team 2'} Sets Won
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={editForm.roundsWon2}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditForm((prev) => ({
                        ...prev,
                        roundsWon2: val,
                        winner: prev.roundsWon1 > val ? prev.team1 : (val > prev.roundsWon1 ? prev.team2 : prev.winner)
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                    Declared Winner *
                  </label>
                  <select
                    value={editForm.winner}
                    onChange={(e) => setEditForm({ ...editForm, winner: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={editForm.team1}>{editForm.team1 || 'Team 1'}</option>
                    <option value={editForm.team2}>{editForm.team2 || 'Team 2'}</option>
                  </select>
                </div>
              </div>

              {/* Round-by-Round Winners */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                  Round-by-Round Winner Selection
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Round 1</label>
                    <select
                      value={editForm.round1Winner}
                      onChange={(e) => setEditForm({ ...editForm, round1Winner: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold"
                    >
                      <option value="">None / Pending</option>
                      <option value={editForm.team1}>{editForm.team1}</option>
                      <option value={editForm.team2}>{editForm.team2}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Round 2</label>
                    <select
                      value={editForm.round2Winner}
                      onChange={(e) => setEditForm({ ...editForm, round2Winner: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold"
                    >
                      <option value="">None / Pending</option>
                      <option value={editForm.team1}>{editForm.team1}</option>
                      <option value={editForm.team2}>{editForm.team2}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Round 3</label>
                    <select
                      value={editForm.round3Winner}
                      onChange={(e) => setEditForm({ ...editForm, round3Winner: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold"
                    >
                      <option value="">None / Pending</option>
                      <option value={editForm.team1}>{editForm.team1}</option>
                      <option value={editForm.team2}>{editForm.team2}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Update Result</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};
