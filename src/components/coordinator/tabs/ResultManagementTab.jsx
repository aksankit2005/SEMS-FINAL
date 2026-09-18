import React, { useState, useEffect } from 'react';
import { Trophy, Trash2, Download, Filter, RefreshCw, FileSpreadsheet, Eye, X, Award, Edit2, Save } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF, exportToCSV, exportSportResultPDF } from '../../../utils/pdfExporter';
import { exportResultsToExcel } from '../../../utils/excelExporter';
import { getSportResultDisplay } from '../../../utils/sportResultFormatters';

export const ResultManagementTab = ({ user }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();
  const [resultsList, setResultsList] = useState([]);
  const [selectedDetailResult, setSelectedDetailResult] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [editForm, setEditForm] = useState({
    winner: '',
    scoreSummary: '',
    sets: []
  });

  // Filter States
  const [selectedEvent, setSelectedEvent] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [availableEvents, setAvailableEvents] = useState([]);

  const assignedSport = (user?.assignedSport || 'badminton').toLowerCase();
  const isChess = assignedSport === 'chess';
  const isBadminton = assignedSport === 'badminton';
  const sportId = user?.assignedSport || 'badminton';
  const sportName = user?.sportName || (isChess ? 'Chess' : 'Badminton');
  const resultsKey = `sems_completed_results_${sportId}`;

  // Helper to generate default mock results
  const getMockResultsData = () => {
    if (isBadminton) {
      return []; // No mock data for Badminton
    }
    if (isChess) {
      return [
        {
          id: 'M-CHESS-101',
          eventTitle: 'Inter-College Chess Championship 2026',
          format: 'INDIVIDUAL',
          category: 'Open',
          team1: 'Grandmaster Anand Verma (MPEC)',
          team2: 'Vikramaditya Roy (IIT Kanpur)',
          score1: 1,
          score2: 0,
          scoreText: 'Result: 1 - 0 (White Wins)',
          scoreSummary: 'Result: 1 - 0 (Checkmate)',
          resultNote: 'Checkmate (Move 38)',
          winner: 'Grandmaster Anand Verma (MPEC)',
          tableNumber: 'Table 1',
          venue: 'Chess Hall A - Main Board Room',
          completedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
    return [];
  };

  // Load results & events on mount
  useEffect(() => {
    const loadData = async () => {
      // Load events list for dropdown
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

      // Load saved results & sync with backend completed matches
      let list = [];
      const saved = localStorage.getItem(resultsKey);
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch (e) {
          list = [];
        }
      }

      try {
        const apiMatches = await coordinatorApi.getMatches();
        const isStdCricket = assignedSport === 'cricket' || (assignedSport.includes('cricket') && !assignedSport.includes('gully'));
        const isGully = assignedSport.includes('gully');

        const completedApiMatches = apiMatches.filter((m) => {
          if (m.status !== 'COMPLETED' && m.status !== 'FINISHED' && m.status !== 'WALKOVER') return false;
          const mSport = (m.sport || m.sportId || '').toLowerCase();
          if (isStdCricket) {
            return mSport.includes('cricket') && !mSport.includes('gully');
          }
          if (isGully) {
            return mSport.includes('gully');
          }
          return mSport.includes(assignedSport);
        });

        completedApiMatches.forEach((apiMatch) => {
          if (!list.some((existing) => existing.id === apiMatch.id)) {
            list.push(apiMatch);
          }
        });
      } catch (e) { }

      // Purge legacy mock test entries
      const mockIds = ['M540746', 'M635812', 'M741299', 'M882104', 'M645537', 'M-CHESS-101', 'M-CHESS-102', 'M-BADM-101', 'M-BADM-102'];
      const mockNames = [
        '1', '2', 'a', 'b', 'player 1', 'player 2', 'team 1', 'team 2', 'team a', 'team b',
        'aarav sharma (mpec)', 'rohan gupta (mips)', 'priya verma (psit)', 'sneha patel (hbti)'
      ];

      const isStdCricket = assignedSport === 'cricket' || (assignedSport.includes('cricket') && !assignedSport.includes('gully'));
      const isGully = assignedSport.includes('gully');

      let cleaned = Array.isArray(list)
        ? list.filter((r) => {
          if (!r) return false;
          if (mockIds.includes(r.id)) return false;
          const t1 = (r.team1 || '').trim().toLowerCase();
          const t2 = (r.team2 || '').trim().toLowerCase();
          const w = (r.winner || '').trim().toLowerCase();
          if (mockNames.includes(t1) || mockNames.includes(t2) || mockNames.includes(w)) return false;

          if (isStdCricket) {
            const rSport = (r.sport || r.sportId || '').toLowerCase();
            const rTitle = (r.eventTitle || r.subEvent || '').toLowerCase();
            if (rSport.includes('gully') || rTitle.includes('gully')) return false;
          } else if (isGully) {
            const rSport = (r.sport || r.sportId || '').toLowerCase();
            const rTitle = (r.eventTitle || r.subEvent || '').toLowerCase();
            if (!rSport.includes('gully') && !rTitle.includes('gully')) return false;
          }

          return true;
        })
        : [];

      if (cleaned.length === 0 && !isBadminton) {
        cleaned = getMockResultsData();
      }

      setResultsList(cleaned);
      localStorage.setItem(resultsKey, JSON.stringify(cleaned));
    };

    loadData();

    // Real-time synchronization event listener for ended live matches
    const handleSync = () => loadData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('sems_results_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('sems_results_updated', handleSync);
    };
  }, [resultsKey, sportName, assignedSport, isBadminton]);

  const handleSetWinner = async (id, currentWinner) => {
    const matchObj = resultsList.find((item) => item.id === id);
    if (!matchObj) return;

    const p1 = matchObj.team1 || (isChess ? 'Player 1 (White)' : 'Team 1');
    const p2 = matchObj.team2 || (isChess ? 'Player 2 (Black)' : 'Team 2');

    let newWinner = currentWinner;
    let newScoreText = matchObj.scoreText || matchObj.scoreSummary || '';
    let s1 = matchObj.score1 || 0;
    let s2 = matchObj.score2 || 0;

    if (isChess) {
      const choice = window.prompt(
        `Select Official Declared Winner for Chess Match #${id}:\n1: ${p1} (White Wins 1-0)\n2: ${p2} (Black Wins 0-1)\n3: Draw (½ - ½)`,
        '1'
      );
      if (!choice) return;

      if (choice === '1') {
        newWinner = p1;
        newScoreText = 'Result: 1 - 0 (White Wins)';
        s1 = 1;
        s2 = 0;
      } else if (choice === '2') {
        newWinner = p2;
        newScoreText = 'Result: 0 - 1 (Black Wins)';
        s1 = 0;
        s2 = 1;
      } else if (choice === '3') {
        newWinner = 'Draw (½ - ½)';
        newScoreText = 'Result: ½ - ½ (Draw)';
        s1 = 0.5;
        s2 = 0.5;
      } else {
        newWinner = choice;
      }
    } else {
      const input = window.prompt(
        `Select Official Declared Winner:\n1: ${p1}\n2: ${p2}`,
        currentWinner || p1
      );
      if (!input) return;
      if (input === '1') newWinner = p1;
      else if (input === '2') newWinner = p2;
      else newWinner = input;
    }

    try {
      const updated = resultsList.map((r) =>
        r.id === id
          ? {
            ...r,
            winner: newWinner,
            score1: s1,
            score2: s2,
            scoreText: newScoreText,
            scoreSummary: newScoreText,
          }
          : r
      );
      setResultsList(updated);
      localStorage.setItem(resultsKey, JSON.stringify(updated));
      await coordinatorApi.completeMatch(id, {
        winner: newWinner,
        score1: s1,
        score2: s2,
        scoreText: newScoreText,
        scoreSummary: newScoreText,
      });
      addToast(`Declared official winner: ${newWinner}`, 'success');
    } catch (err) {
      addToast('Error setting match winner', 'error');
    }
  };

  const handleOpenEdit = (r) => {
    let sets = [];
    if (Array.isArray(r.setsHistory) && r.setsHistory.length > 0) {
      sets = JSON.parse(JSON.stringify(r.setsHistory));
    } else {
      sets = [
        { set: 1, score1: r.score1 || 0, score2: r.score2 || 0 },
        { set: 2, score1: 0, score2: 0 },
        { set: 3, score1: 0, score2: 0 },
      ];
    }
    setEditingResult(r);
    setEditForm({
      winner: r.winner || r.team1,
      scoreSummary: r.scoreSummary || r.scoreText || '',
      sets,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingResult) return;

    const currentSets = editForm.sets || [];
    const setsWon1 = currentSets.filter((s) => Number(s.score1 || 0) > Number(s.score2 || 0)).length;
    const setsWon2 = currentSets.filter((s) => Number(s.score2 || 0) > Number(s.score1 || 0)).length;

    const setsBreakdownStr = currentSets
      .filter((s) => Number(s.score1 || 0) > 0 || Number(s.score2 || 0) > 0)
      .map((s) => `S${s.set}: ${s.score1}-${s.score2}`)
      .join(', ');

    const computedSummary = editForm.scoreSummary.trim() ||
      (setsBreakdownStr ? `${setsWon1} - ${setsWon2} Sets (${setsBreakdownStr})` : `Winner: ${editForm.winner}`);

    const updatedObj = {
      ...editingResult,
      winner: editForm.winner,
      scoreSummary: computedSummary,
      scoreText: computedSummary,
      setsWon1,
      setsWon2,
      setsHistory: currentSets,
      updatedAt: new Date().toISOString()
    };

    try {
      await coordinatorApi.completeMatch(editingResult.id, updatedObj);
    } catch (e) {
      console.warn('Backend sync edit result fallback:', e);
    }

    const updatedList = resultsList.map((item) => (item.id === editingResult.id ? updatedObj : item));
    setResultsList(updatedList);
    localStorage.setItem(resultsKey, JSON.stringify(updatedList));

    window.dispatchEvent(new Event('sems_results_updated'));
    window.dispatchEvent(new Event('storage'));

    addToast(`Updated match result #${editingResult.id}`, 'success');
    setEditingResult(null);
  };

  const handleDeleteResult = async (id) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Result Entry',
      message: 'Are you sure you want to delete this result entry?'
    });
    if (!isConfirmed) return;

    try {
      await coordinatorApi.deleteMatch(id);
    } catch (e) {
      console.warn('Backend delete match fallback:', e);
    }

    const updated = resultsList.filter((r) => r.id !== id);
    setResultsList(updated);
    localStorage.setItem(resultsKey, JSON.stringify(updated));

    // Register in sems_deleted_result_ids so public Results page filters it out permanently
    try {
      const deletedStr = localStorage.getItem('sems_deleted_result_ids');
      let delList = [];
      if (deletedStr) {
        try { delList = JSON.parse(deletedStr); } catch (e) {}
      }
      if (!delList.includes(id)) {
        delList.push(id);
        localStorage.setItem('sems_deleted_result_ids', JSON.stringify(delList));
      }
    } catch (e) {}

    window.dispatchEvent(new Event('sems_results_updated'));
    window.dispatchEvent(new Event('sems_matches_updated'));
    window.dispatchEvent(new Event('storage'));

    addToast('Result entry deleted', 'info');
  };

  const handleClearResults = async () => {
    const isConfirmed = await confirmDelete({
      title: 'Clear All Results',
      message: 'Are you sure you want to clear all declared results data from storage?'
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

  // Filtered Results Logic
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

  // Export Results to Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredResults.length === 0) {
      addToast('No match results available to export', 'error');
      return;
    }

    try {
      exportResultsToExcel(filteredResults, {
        sport: assignedSport,
        gender: selectedGender
      });
      addToast(`Exported ${filteredResults.length} ${sportName} match results to Excel (.xlsx)!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to export match results', 'error');
    }
  };

  // Export Results to PDF
  const handleExportPDF = () => {
    if (filteredResults.length === 0) {
      addToast('No match results available to export', 'error');
      return;
    }

    try {
      exportSportResultPDF(assignedSport, filteredResults, `APEX 2026 ${sportName} Match Results Report`);
      addToast(`Downloaded official ${sportName} Results PDF Report!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to export PDF report', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">

      {/* Table Container */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-2xl space-y-5">

        {/* Top Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Trophy className={`w-5 h-5 ${isChess ? 'text-purple-500 dark:text-purple-400' : 'text-amber-500 dark:text-amber-400'}`} />
              <span>{isBadminton ? 'Completed Match Results & Summary' : 'Declare Results & Winner Management'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Showing {filteredResults.length} of {resultsList.length} completed {isChess ? 'chess board' : 'match'} results
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
            <Filter className={`w-4 h-4 ${isChess ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-indigo-400'}`} />
            <span>Filter Results:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-3 flex-1 max-w-2xl">
            {/* Event Filter */}
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Filter by Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${isChess ? 'focus:ring-purple-500' : 'focus:ring-blue-600'}`}
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
                className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${isChess ? 'focus:ring-purple-500' : 'focus:ring-blue-600'}`}
              >
                <option value="ALL">All</option>
                <option value="Open">Open</option>
                <option value="Male">Male / Boys</option>
                <option value="Female">Female / Girls</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {(selectedEvent !== 'ALL' || selectedGender !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="mt-4 md:mt-0 self-end px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChess ? 'text-purple-500' : 'text-blue-600'}`} />
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
                    No completed match results found for {sportName}.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => {
                  const display = getSportResultDisplay({ ...r, sportId: assignedSport, sportName: sportName });

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">

                      {/* MATCH DETAILS */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">#{r.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${isChess
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-indigo-300 border-blue-500/20'
                            }`}>
                            {display.format || (isChess ? 'INDIVIDUAL' : 'SINGLES')}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                            {display.eventTitle || `${sportName} Championship`}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {display.team1} <span className="text-slate-400 text-xs font-normal">vs</span> {display.team2}
                        </p>
                      </td>

                      {/* CATEGORY / GENDER */}
                      <td className="p-4 font-bold">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                          {display.category || 'Open'}
                        </span>
                      </td>

                      {/* VENUE / TIME */}
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                        📍 {r.tableNumber || r.venue || (isChess ? 'Table 1' : 'Court 1')} • {r.time || 'Completed'}
                      </td>

                      {/* SCORE & WINNER */}
                      <td className="p-4 font-bold">
                        <div className="flex flex-col gap-1">
                          {display.sportType === 'cricket' ? (
                            <div className="space-y-1">
                              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                {display.cricket.innings1Text} <span className="text-slate-400 font-normal">vs</span> {display.cricket.innings2Text}
                              </span>
                              {display.cricket.resultString && (
                                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">
                                  {display.cricket.resultString}
                                </span>
                              )}
                            </div>
                          ) : display.sportType === 'racket' ? (
                            <div className="space-y-1">
                              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                {display.racket.setsScoreText}
                              </span>
                              {display.racket.setsBreakdown && display.racket.setsBreakdown.length > 0 && (
                                <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                                  {display.racket.setsBreakdown.map(s => s.label).join(' | ')}
                                </div>
                              )}
                            </div>
                          ) : display.sportType === 'volleyball' ? (
                            <div className="space-y-1">
                              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                {display.volleyball.setsScoreText}
                              </span>
                              {display.volleyball.setsBreakdown && display.volleyball.setsBreakdown.length > 0 && (
                                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {display.volleyball.setsBreakdown.map(s => s.label).join(' | ')}
                                </div>
                              )}
                            </div>
                          ) : display.sportType === 'chess' ? (
                            <div className="space-y-1">
                              <span className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">
                                {display.chess.scoreText}
                              </span>
                              <span className="text-[11px] font-medium text-slate-500 block">
                                {display.chess.verdict}
                              </span>
                            </div>
                          ) : display.sportType === 'basketball' ? (
                            <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
                              {display.basketball.scoreText}
                            </span>
                          ) : display.sportType === 'football' ? (
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                              {display.football.scoreText}
                            </span>
                          ) : display.sportType === 'kabaddi' ? (
                            <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                              {display.kabaddi.scoreText}
                            </span>
                          ) : display.sportType === 'khokho' ? (
                            <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                              {display.khokho.scoreText}
                            </span>
                          ) : display.sportType === 'tug' ? (
                            <span className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">
                              {display.tug.pullsScoreText}
                            </span>
                          ) : (
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                              {display.summaryText}
                            </span>
                          )}

                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-black pt-0.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Winner: {display.winner || 'TBD'}
                          </span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => generateMatchResultPDF(r, user?.sportName || user?.assignedSport || (isChess ? 'Chess' : 'Badminton'))}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>

                          {isBadminton && (
                            <button
                              onClick={() => setSelectedDetailResult(r)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 cursor-pointer"
                            title="Edit Result"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {!isBadminton && (
                            <button
                              onClick={() => handleSetWinner(r.id, display.winner || r.team1)}
                              className={`px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-md transition cursor-pointer ${isChess
                                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                                }`}
                            >
                              Set Winner
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteResult(r.id)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white border border-rose-200 dark:border-rose-500/20 transition cursor-pointer"
                            title="Delete Result"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* View Details Modal for Badminton Match Result */}
      {selectedDetailResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Match Result Breakdown</h3>
              </div>
              <button
                onClick={() => setSelectedDetailResult(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>Match ID: #{selectedDetailResult.id}</span>
                  <span>Category: {selectedDetailResult.category || selectedDetailResult.gender || 'Open'}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {selectedDetailResult.eventTitle || 'Badminton Championship'}
                </h4>
                <p className="text-xs text-slate-500">📍 Venue: {selectedDetailResult.tableNumber || selectedDetailResult.venue || 'Court 1'}</p>
              </div>

              {/* Players / Teams Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${selectedDetailResult.winner === selectedDetailResult.team1 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Player 1</p>
                  <p className="font-black text-slate-900 dark:text-white text-sm mt-1">{selectedDetailResult.team1 || 'Player A'}</p>
                  {selectedDetailResult.winner === selectedDetailResult.team1 && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Winner
                    </span>
                  )}
                </div>

                <div className={`p-4 rounded-2xl border ${selectedDetailResult.winner === selectedDetailResult.team2 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Player 2</p>
                  <p className="font-black text-slate-900 dark:text-white text-sm mt-1">{selectedDetailResult.team2 || 'Player B'}</p>
                  {selectedDetailResult.winner === selectedDetailResult.team2 && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Winner
                    </span>
                  )}
                </div>
              </div>

              {/* Set Scores Breakdown */}
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                <p className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Set-by-Set Score Breakdown</p>
                {selectedDetailResult.setsHistory && Array.isArray(selectedDetailResult.setsHistory) && selectedDetailResult.setsHistory.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {selectedDetailResult.setsHistory.map((s, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center font-mono">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Set {idx + 1}</p>
                        <p className="font-black text-slate-900 dark:text-white text-sm mt-0.5">{s.score1 || 0} - {s.score2 || 0}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white pt-1">
                    {selectedDetailResult.scoreSummary || `${selectedDetailResult.score1 || 0} - ${selectedDetailResult.score2 || 0} Sets`}
                  </p>
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => generateMatchResultPDF(selectedDetailResult, 'Badminton')}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official Result Sheet (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Match Result Modal */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Match Result #{editingResult.id}</h3>
              </div>
              <button
                onClick={() => setEditingResult(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Event & Contestants */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">{editingResult.eventTitle || 'Tournament Event'}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {editingResult.team1} <span className="text-slate-400 font-normal">vs</span> {editingResult.team2}
                </p>
              </div>

              {/* Declared Winner Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Declared Winner</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, winner: editingResult.team1 }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                      editForm.winner === editingResult.team1
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 block uppercase">Player 1</span>
                    <span className="truncate block">{editingResult.team1}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, winner: editingResult.team2 }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                      editForm.winner === editingResult.team2
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 block uppercase">Player 2</span>
                    <span className="truncate block">{editingResult.team2}</span>
                  </button>
                </div>
              </div>

              {/* Set Scores Editing */}
              {editForm.sets && editForm.sets.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Set Scores (Player 1 - Player 2)</label>
                  <div className="space-y-2">
                    {editForm.sets.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-500 w-14 shrink-0">Set {idx + 1}:</span>
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="number"
                            min="0"
                            value={s.score1}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              const updatedSets = editForm.sets.map((setObj, i) => i === idx ? { ...setObj, score1: val } : setObj);
                              setEditForm((prev) => ({ ...prev, sets: updatedSets }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white"
                          />
                          <span className="text-slate-400 font-bold">-</span>
                          <input
                            type="number"
                            min="0"
                            value={s.score2}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              const updatedSets = editForm.sets.map((setObj, i) => i === idx ? { ...setObj, score2: val } : setObj);
                              setEditForm((prev) => ({ ...prev, sets: updatedSets }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Score Summary / Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Score Summary</label>
                <input
                  type="text"
                  value={editForm.scoreSummary}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, scoreSummary: e.target.value }))}
                  placeholder="e.g. 2 - 1 Sets (S1: 21-18, S2: 19-21, S3: 21-15)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
