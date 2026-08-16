import React, { useState, useEffect } from 'react';
import { Trophy, Trash2, Download, Filter, RefreshCw, FileSpreadsheet, Eye, X, Award } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF, exportToCSV } from '../../../utils/pdfExporter';

export const ResultManagementTab = ({ user }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();
  const [resultsList, setResultsList] = useState([]);
  const [selectedDetailResult, setSelectedDetailResult] = useState(null);
  
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
        const completedApiMatches = apiMatches.filter((m) =>
          (m.status === 'COMPLETED' || m.status === 'FINISHED' || m.status === 'WALKOVER') &&
          ((m.sport || m.sportId || '').toLowerCase().includes(assignedSport))
        );

        completedApiMatches.forEach((apiMatch) => {
          if (!list.some((existing) => existing.id === apiMatch.id)) {
            list.push(apiMatch);
          }
        });
      } catch (e) {}

      // Purge legacy mock test entries
      const mockIds = ['M540746', 'M635812', 'M741299', 'M882104', 'M645537', 'M-CHESS-101', 'M-CHESS-102', 'M-BADM-101', 'M-BADM-102'];
      const mockNames = [
        '1', '2', 'a', 'b', 'player 1', 'player 2', 'team 1', 'team 2', 'team a', 'team b',
        'aarav sharma (mpec)', 'rohan gupta (mips)', 'priya verma (psit)', 'sneha patel (hbti)'
      ];

      let cleaned = Array.isArray(list)
        ? list.filter((r) => {
            if (!r) return false;
            if (mockIds.includes(r.id)) return false;
            const t1 = (r.team1 || '').trim().toLowerCase();
            const t2 = (r.team2 || '').trim().toLowerCase();
            const w = (r.winner || '').trim().toLowerCase();
            return !mockNames.includes(t1) && !mockNames.includes(t2) && !mockNames.includes(w);
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

  const handleDeleteResult = async (id) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Result Entry',
      message: 'Are you sure you want to delete this result entry?'
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

    const isCricket = assignedSport === 'cricket';

    const excelData = filteredResults.map((r) => {
      if (isCricket) {
        return {
          'Match ID': r.id || 'N/A',
          'Tournament / Event': r.eventTitle || 'Cricket Championship',
          'Format': r.format || 'T20',
          'Category': r.category || 'Men',
          'Team 1': r.team1 || 'Team A',
          '1st Innings Score': `${r.score1 || 0}/${r.wickets1 || 0} (${r.overs1 || '0.0'} Ov)`,
          'Team 2': r.team2 || 'Team B',
          '2nd Innings Score': `${r.score2 || 0}/${r.wickets2 || 0} (${r.overs2 || '0.0'} Ov)`,
          'Result & Victory Summary': r.resultString || r.scoreSummary || r.winner || 'Completed',
          'Declared Winner': r.winner || 'TBD',
          'Venue': r.venue || 'Cricket Ground 1',
          'Completed Date': r.completedAt ? new Date(r.completedAt).toLocaleString() : 'N/A'
        };
      }

      const setsBreakdown = r.setsHistory && Array.isArray(r.setsHistory) && r.setsHistory.some((s) => s.score1 > 0 || s.score2 > 0)
        ? r.setsHistory.filter((s) => s.score1 > 0 || s.score2 > 0).map((s) => `S${s.set}: ${s.score1}-${s.score2}`).join(' | ')
        : (r.scoreText || r.scoreSummary || 'Completed');

      return {
        'Match ID': r.id || 'N/A',
        'Event Title': r.eventTitle || `${sportName} Tournament`,
        'Format': isChess ? 'INDIVIDUAL' : (r.format || 'SINGLES'),
        'Category / Gender': r.category || r.gender || 'Open',
        'Player 1 / White': r.team1 || 'TBD',
        'Player 2 / Black': r.team2 || 'TBD',
        'Match Score / Result': isChess ? (r.scoreText || r.scoreSummary || (r.score1 === 1 ? '1 - 0' : r.score2 === 1 ? '0 - 1' : '½ - ½')) : setsBreakdown,
        'Result Method / Notes': r.resultNote || 'Official Verdict',
        'Declared Winner': r.winner || r.team1 || 'TBD',
        'Venue / Table': r.tableNumber || r.venue || (isChess ? 'Table 1' : 'Court 1'),
        'Completed Date': r.completedAt ? new Date(r.completedAt).toLocaleString() : 'N/A'
      };
    });

    exportToCSV(excelData, `${sportName}_Match_Results_${new Date().toISOString().split('T')[0]}`);
    addToast(`Exported ${filteredResults.length} match results to Excel/CSV!`, 'success');
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
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel / CSV</span>
              </button>
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
                filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    
                    {/* MATCH DETAILS */}
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">#{r.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                          isChess
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-indigo-300 border-blue-500/20'
                        }`}>
                          {isChess ? 'INDIVIDUAL' : (r.format || 'SINGLES')}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                          {r.eventTitle || `${sportName} Championship`}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {r.team1 || (isChess ? 'White Player' : 'Team 1')} <span className="text-slate-400 text-xs font-normal">vs</span> {r.team2 || (isChess ? 'Black Player' : 'Team 2')}
                      </p>
                    </td>

                    {/* CATEGORY / GENDER */}
                    <td className="p-4 font-bold">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                        {r.category || r.gender || 'Open'}
                      </span>
                    </td>

                    {/* VENUE / TIME */}
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                      📍 {r.tableNumber || r.venue || (isChess ? 'Table 1' : 'Court 1')} • {r.time || 'Completed'}
                    </td>

                    {/* SCORE & WINNER */}
                    <td className="p-4 font-bold">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black text-sm ${isChess ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
                            {isChess
                              ? (r.scoreText || r.scoreSummary || (r.score1 === 1 ? 'Result: 1 - 0 (White Wins)' : r.score2 === 1 ? 'Result: 0 - 1 (Black Wins)' : 'Result: ½ - ½ (Draw)'))
                              : (r.setsWon1 !== undefined && r.setsWon2 !== undefined
                                  ? `${r.setsWon1} - ${r.setsWon2} Sets`
                                  : `${r.score1 || 0} - ${r.score2 || 0} Pts`)}
                          </span>
                        </div>

                        {/* Set Breakdown for general sports */}
                        {!isChess && r.setsHistory && Array.isArray(r.setsHistory) && r.setsHistory.some((s) => s.score1 > 0 || s.score2 > 0) && (
                          <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                            {r.setsHistory
                              .filter((s) => s.score1 > 0 || s.score2 > 0)
                              .map((s) => `S${s.set}: ${s.score1}-${s.score2}`)
                              .join(' | ')}
                          </div>
                        )}

                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-black pt-0.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" /> Winner: {r.winner || r.team1 || 'TBD'}
                        </span>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => generateMatchResultPDF(r, user?.sportName || user?.assignedSport || (isChess ? 'Chess' : 'Badminton'))}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        {isBadminton ? (
                          <button
                            onClick={() => setSelectedDetailResult(r)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSetWinner(r.id, r.winner || r.team1)}
                            className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition cursor-pointer ${
                              isChess
                                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                            }`}
                          >
                            Set Winner
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
    </div>
  );
};
