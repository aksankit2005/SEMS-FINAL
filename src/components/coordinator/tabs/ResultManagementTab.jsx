import React, { useState, useEffect } from 'react';
import { Trophy, Trash2, Download, Filter, RefreshCw, FileSpreadsheet, PlusCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF, exportToCSV } from '../../../utils/pdfExporter';

export const ResultManagementTab = ({ user }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();
  const [resultsList, setResultsList] = useState([]);
  
  // Filter States
  const [selectedEvent, setSelectedEvent] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [availableEvents, setAvailableEvents] = useState([]);

  const assignedSport = (user?.assignedSport || 'sports').toLowerCase();
  const isChess = assignedSport === 'chess';
  const sportId = user?.assignedSport || 'badminton';
  const sportName = user?.sportName || (isChess ? 'Chess' : 'Badminton');
  const resultsKey = `sems_completed_results_${sportId}`;

  // Helper to generate default mock results
  const getMockResultsData = () => {
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
        },
        {
          id: 'M-CHESS-102',
          eventTitle: 'Inter-College Chess Championship 2026',
          format: 'INDIVIDUAL',
          category: 'Open',
          team1: 'Aditya Raj (PSIT Kanpur)',
          team2: 'Praggnanandhaa K. (HBTI)',
          score1: 0,
          score2: 1,
          scoreText: 'Result: 0 - 1 (Black Wins)',
          scoreSummary: 'Result: 0 - 1 (Resignation)',
          resultNote: 'Resignation (Move 45)',
          winner: 'Praggnanandhaa K. (HBTI)',
          tableNumber: 'Table 2',
          venue: 'Chess Hall A - Main Board Room',
          completedAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'M-CHESS-103',
          eventTitle: 'All India Rapid Chess League 2026',
          format: 'INDIVIDUAL',
          category: 'Rapid',
          team1: 'Rohan Saxena (MIPS)',
          team2: 'Kavya Sharma (MPEC)',
          score1: 0.5,
          score2: 0.5,
          scoreText: 'Result: ½ - ½ (Draw)',
          scoreSummary: 'Result: ½ - ½ (Stalemate)',
          resultNote: 'Stalemate / Mutual Agreement',
          winner: 'Draw (½ - ½)',
          tableNumber: 'Table 3',
          venue: 'Chess Hall B - Board Room 2',
          completedAt: new Date(Date.now() - 10800000).toISOString()
        },
        {
          id: 'M-CHESS-104',
          eventTitle: 'Inter-College Blitz Knockout',
          format: 'INDIVIDUAL',
          category: 'Blitz',
          team1: 'Siddharth Mishra (KNIT Sultanpur)',
          team2: 'Deepesh Trivedi (MPGI)',
          score1: 1,
          score2: 0,
          scoreText: 'Result: 1 - 0 (White Wins)',
          scoreSummary: 'Result: 1 - 0 (Clock Flag Fall)',
          resultNote: 'Clock Flag Fall (Time Out)',
          winner: 'Siddharth Mishra (KNIT Sultanpur)',
          tableNumber: 'Table 4',
          venue: 'Chess Hall B - Board Room 2',
          completedAt: new Date(Date.now() - 14400000).toISOString()
        },
        {
          id: 'M-CHESS-105',
          eventTitle: "Women's College Chess Masters",
          format: 'INDIVIDUAL',
          category: 'Girls',
          team1: 'Ananya Gupta (MPEC)',
          team2: 'Riya Srivastava (IET Lucknow)',
          score1: 0,
          score2: 1,
          scoreText: 'Result: 0 - 1 (Black Wins)',
          scoreSummary: 'Result: 0 - 1 (Checkmate)',
          resultNote: 'Checkmate (Move 29)',
          winner: 'Riya Srivastava (IET Lucknow)',
          tableNumber: 'Table 5',
          venue: 'Chess Hall A - Main Board Room',
          completedAt: new Date(Date.now() - 18000000).toISOString()
        }
      ];
    }
    if (assignedSport === 'cricket') {
      return [
        {
          id: 'M-CRK-101',
          eventTitle: 'Inter-College T20 Cricket Championship 2026',
          format: 'T20',
          category: 'Men',
          team1: 'MPEC XI',
          team2: 'PSIT Super Kings',
          score1: 145,
          wickets1: 6,
          overs1: '20.0',
          score2: 148,
          wickets2: 4,
          overs2: '18.4',
          scoreSummary: 'PSIT Super Kings won by 6 wickets',
          resultString: 'PSIT Super Kings won by 6 wickets',
          winner: 'PSIT Super Kings',
          tableNumber: 'Cricket Ground 1',
          venue: 'Cricket Ground 1',
          completedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
    if (assignedSport === 'football') {
      return [
        {
          id: 'M-FTB-101',
          eventTitle: 'Inter-College Football Championship 2026',
          format: 'TEAM',
          category: 'Boys',
          team1: 'MPEC FC',
          team2: 'PSIT Strikers',
          score1: 2,
          score2: 1,
          scoreSummary: 'MPEC FC won 2 - 1',
          winner: 'MPEC FC',
          tableNumber: 'Ground 1',
          venue: 'Ground 1',
          completedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'M-FTB-102',
          eventTitle: 'Inter-College Football Championship 2026',
          format: 'TEAM',
          category: 'Boys',
          team1: 'HBTU United',
          team2: 'KIET Warriors',
          score1: 3,
          score2: 0,
          scoreSummary: 'HBTU United won 3 - 0',
          winner: 'HBTU United',
          tableNumber: 'Ground 2',
          venue: 'Ground 2',
          completedAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];
    }
    return [
      {
        id: 'M-BADM-101',
        eventTitle: 'Inter-College Badminton Championship 2026',
        format: 'SINGLES',
        category: 'Boys',
        team1: 'Aarav Sharma (MPEC)',
        team2: 'Rohan Gupta (MIPS)',
        score1: 2,
        score2: 1,
        setsWon1: 2,
        setsWon2: 1,
        scoreSummary: '2 - 1 Sets (S1: 21-19 | S2: 18-21 | S3: 21-16)',
        winner: 'Aarav Sharma (MPEC)',
        tableNumber: 'Court 1',
        venue: 'Indoor Badminton Stadium',
        completedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'M-BADM-102',
        eventTitle: 'Inter-College Badminton Championship 2026',
        format: 'SINGLES',
        category: 'Girls',
        team1: 'Priya Verma (PSIT)',
        team2: 'Sneha Patel (HBTI)',
        score1: 2,
        score2: 0,
        setsWon1: 2,
        setsWon2: 0,
        scoreSummary: '2 - 0 Sets (S1: 21-14 | S2: 21-12)',
        winner: 'Priya Verma (PSIT)',
        tableNumber: 'Court 2',
        venue: 'Indoor Badminton Stadium',
        completedAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
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
          m.status === 'COMPLETED' || m.status === 'FINISHED' || m.status === 'WALKOVER'
        );

        completedApiMatches.forEach((apiMatch) => {
          if (!list.some((existing) => existing.id === apiMatch.id)) {
            list.push(apiMatch);
          }
        });
      } catch (e) {}

      // Purge legacy mock test entries
      const mockIds = ['M540746', 'M635812', 'M741299', 'M882104', 'M645537', 'M-CHESS-101', 'M-CHESS-102', 'M-CHESS-103', 'M-CHESS-104', 'M-CHESS-105'];
      const mockNames = [
        '1', '2', 'a', 'b', 'player 1', 'player 2', 'player 3', 'player 4', 'team 1', 'team 2', 'team a', 'team b', 'albert', 'romi',
        'aarav sharma (mpec)', 'rohan gupta (mips)', 'ankur dixit (mpcps)', 'aditya singh (mpec)',
        'aagaz khan (mpcps kn142)', 'shiv prakash (mpcps kn142)', 'kapil verma (mpcps kn142)', 'anubhav sachan (mpcps kn142)',
        'kapil verma', 'anubhav sachan', 'team a', 'team b', 'team 1', 'team 2', 'player / team a', 'player / team b'
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
  }, [resultsKey, sportName]);

  const handleSetWinner = async (id, currentWinner) => {
    const matchObj = resultsList.find((item) => item.id === id);
    if (!matchObj) return;

    const p1 = matchObj.team1 || 'Player 1 (White)';
    const p2 = matchObj.team2 || 'Player 2 (Black)';

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
              <span>Declare Results & Winner Management</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Showing {filteredResults.length} of {resultsList.length} completed {isChess ? 'chess board' : 'single'} matches
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
                        {r.team1 || 'White Player'} <span className="text-slate-400 text-xs font-normal">vs</span> {r.team2 || 'Black Player'}
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
