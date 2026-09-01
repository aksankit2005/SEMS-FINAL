import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { ResultEditModal } from '../../components/admin/ResultEditModal';
import { ALL_12_SPORTS, ALL_COLLEGES } from '../../services/superCoordinatorApi';
import { exportResultsToExcel } from '../../utils/excelExporter';
import {
  Trophy,
  Medal,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  Crown,
  CheckCircle2
} from 'lucide-react';

// Normalize declared results (super coord leaderboard entries + admin saved results)
const normalizeDeclaredResult = (entry) => {
  const sport = ALL_12_SPORTS.find((s) =>
    s.id === (entry.sportId || '') || s.name === (entry.sportName || '')
  );

  const eventTitle =
    entry.eventTitle ||
    (entry.athleticsSubEvent
      ? `${entry.sportName} (${entry.athleticsSubEvent})`
      : `${entry.sportName || 'Sports'} Championship`);

  return {
    id: entry.id,
    sportId: sport?.id || entry.sportId || '',
    sportName: sport?.name || entry.sportName || '',
    sportIcon: sport?.icon || '🏅',
    eventTitle,
    matchFormat: entry.matchFormat || 'Team',
    gender: entry.gender || 'Boys',
    winnerName: entry.winnerName || entry.winnerTeamName || 'Declared Winner',
    winnerTeamName: entry.winnerTeamName || entry.winnerName || 'Declared Winner',
    winnerCollege: entry.winnerCollegeName || entry.winnerCollege || 'MPEC',
    runnerUpName: entry.runnerUpName || entry.runnerUpTeamName || 'Runner Up',
    runnerUpTeamName: entry.runnerUpTeamName || entry.runnerUpName || 'Runner Up',
    runnerUpCollege: entry.runnerUpCollegeName || entry.runnerUpCollege || 'MIPS',
    score: entry.score || entry.scoreSummary || '',
    status: entry.status || 'COMPLETED',
    uploadedBy: entry.uploadedBy || 'Super Coordinator',
    uploadedDate: entry.uploadedDate || entry.date || ''
  };
};

export const AdminResultsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State (Sport, Gender, Search Query)
  const [filterSport, setFilterSport] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [selectedResult, setSelectedResult] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Active Tab: 'results' | 'leaderboard'
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    fetchResultsData();

    // Listen for super coordinator / admin declared result updates
    const handleResultsUpdate = () => {
      fetchResultsData();
    };

    window.addEventListener('sems_results_updated', handleResultsUpdate);
    window.addEventListener('sems_leaderboard_updated', handleResultsUpdate);
    window.addEventListener('storage', handleResultsUpdate);

    return () => {
      window.removeEventListener('sems_results_updated', handleResultsUpdate);
      window.removeEventListener('sems_leaderboard_updated', handleResultsUpdate);
      window.removeEventListener('storage', handleResultsUpdate);
    };
  }, []);

  const fetchResultsData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDeclaredResults();
      setResults((data || []).map(normalizeDeclaredResult));
    } catch (err) {
      addToast('Failed to load declared match results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async (formData) => {
    try {
      await adminApi.saveResult(formData);
      await fetchResultsData();
      addToast('Match result & Inter-College leaderboard updated successfully!', 'success');
      setIsEditOpen(false);
      setSelectedResult(null);
    } catch (err) {
      addToast(err.message || 'Failed to update result', 'error');
    }
  };

  const handleDeleteResult = async (id) => {
    if (!window.confirm('Are you sure you want to delete this declared result & leaderboard entry?')) {
      return;
    }
    try {
      await adminApi.deleteResult(id);
      await fetchResultsData();
      addToast('Declared result & leaderboard entry removed', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to delete result', 'error');
    }
  };

  const handleExportExcel = () => {
    if (filteredResults.length === 0) {
      addToast('No declared match results available for current filter selection to export!', 'error');
      return;
    }

    try {
      exportResultsToExcel(filteredResults, {
        sport: filterSport,
        gender: filterGender,
        event: 'ALL'
      });
      addToast(`Successfully exported ${filteredResults.length} declared match results to Excel (.csv)!`, 'success');
    } catch (err) {
      addToast('Failed to export match results to Excel', 'error');
    }
  };

  // Calculate Inter-College Leaderboard Standings (Only 🥇 1st & 🥈 2nd)
  const collegeStandings = ALL_COLLEGES
    .filter((c) => c.id !== 'EXTERNAL')
    .map((college) => {
      let goldCount = 0;
      let silverCount = 0;
      let totalPoints = 0;

      results.forEach((res) => {
        const wCol = (res.winnerCollege || '').toLowerCase();
        const rCol = (res.runnerUpCollege || '').toLowerCase();
        const cId = college.id.toLowerCase();
        const cName = college.name.toLowerCase();

        if (wCol === cId || wCol === cName) {
          goldCount += 1;
          totalPoints += 5;
        }
        if (rCol === cId || rCol === cName) {
          silverCount += 1;
          totalPoints += 3;
        }
      });

      return {
        ...college,
        goldCount,
        silverCount,
        totalPoints
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints || b.goldCount - a.goldCount);

  // Filtered Declared Results
  const filteredResults = results.filter((res) => {
    // 1. Sport Filter
    if (filterSport !== 'ALL') {
      const resSport = (res.sportId || res.sportName || '').toLowerCase();
      const targetSport = filterSport.toLowerCase();
      if (!resSport.includes(targetSport) && !targetSport.includes(resSport)) return false;
    }

    // 2. Gender Filter
    if (filterGender !== 'ALL') {
      const resGender = (res.gender || '').toLowerCase().trim();
      const targetGender = filterGender.toLowerCase().trim();
      const isFemale = resGender.includes('female') || resGender.includes('girl') || resGender.includes('women') || resGender.includes('woman') || resGender === 'f';
      const isMale = !isFemale && (resGender.includes('male') || resGender.includes('boy') || resGender.includes('men') || resGender.includes('man') || resGender === 'm');

      if (targetGender === 'male') {
        if (!isMale) return false;
      } else if (targetGender === 'female') {
        if (!isFemale) return false;
      } else if (!resGender.includes(targetGender) && !targetGender.includes(resGender)) {
        return false;
      }
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchWinner = (res.winnerName || res.winnerTeamName || '').toLowerCase().includes(q);
      const matchRunnerUp = (res.runnerUpName || res.runnerUpTeamName || '').toLowerCase().includes(q);
      const matchCollege = (res.winnerCollege || res.runnerUpCollege || '').toLowerCase().includes(q);
      const matchSport = (res.sportName || res.sportId || '').toLowerCase().includes(q);
      const matchEvent = (res.eventTitle || '').toLowerCase().includes(q);
      return matchWinner || matchRunnerUp || matchCollege || matchSport || matchEvent;
    }
    return true;
  });

  const hasActiveFilters = filterSport !== 'ALL' || filterGender !== 'ALL' || searchQuery;

  const resetFilters = () => {
    setFilterSport('ALL');
    setFilterGender('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Super Admin Central Control
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Results & Leaderboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Only Super Coordinator declared match results — row-wise table view with delete option & Excel export
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            title="Export filtered declared match results to Excel (.csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={() => { setSelectedResult(null); setIsEditOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Declare Result</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'results'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            🏆 Super Coordinator Declared Results ({filteredResults.length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            🏅 Inter-College Leaderboard Points
          </button>
        </div>

        <button
          onClick={fetchResultsData}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          title="Refresh results list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'leaderboard' ? (
        /* LEADERBOARD STANDINGS CARD */
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm transition-colors">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Overall Inter-College Championship Standings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Points tally based on 🥇 1st Position (5 pts) & 🥈 2nd Position (3 pts)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collegeStandings.slice(0, 2).map((col, idx) => (
              <div
                key={col.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 relative overflow-hidden ${
                  idx === 0
                    ? 'bg-gradient-to-br from-blue-500/10 via-white to-white dark:from-blue-500/20 dark:via-slate-900 dark:to-slate-900 border-blue-500/40'
                    : 'bg-gradient-to-br from-slate-100 via-white to-white dark:from-slate-300/20 dark:via-slate-900 dark:to-slate-900 border-slate-200 dark:border-slate-600/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">
                    {idx === 0 ? '🥇' : '🥈'}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                    Rank #{idx + 1}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{col.id}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{col.name}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">G: {col.goldCount} | S: {col.silverCount}</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">{col.totalPoints} PTS</span>
                </div>
              </div>
            ))}
          </div>

          {/* Full College Table */}
          <div className="overflow-x-auto custom-scrollbar pt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">College Name</th>
                  <th className="py-3 px-3">🥇 Firsts (Winners)</th>
                  <th className="py-3 px-3">🥈 Seconds (Runners-Up)</th>
                  <th className="py-3 px-3 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {collegeStandings.map((col, idx) => (
                  <tr key={col.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-black text-blue-600 dark:text-blue-400">#{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {col.id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-blue-600 dark:text-blue-400">{col.goldCount}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{col.silverCount}</td>
                    <td className="py-3 px-3 font-black text-blue-600 dark:text-blue-400 text-right">{col.totalPoints} PTS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DECLARED RESULTS TABLE SECTION */
        <div className="space-y-4">
          {/* Filters Control Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Filter className="w-4 h-4" />
                <span>Filter Declared Results</span>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* 1. 🏆 Filter by Sport */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  🏆 Sport Discipline
                </label>
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900">All 12 Sports</option>
                  {ALL_12_SPORTS.map(s => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. 🚻 Filter by Gender */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  🚻 Gender Event
                </label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900">All Genders</option>
                  <option value="Boys" className="bg-white dark:bg-slate-900">Boys (Male)</option>
                  <option value="Girls" className="bg-white dark:bg-slate-900">Girls (Female)</option>
                  <option value="Mixed" className="bg-white dark:bg-slate-900">Mixed</option>
                </select>
              </div>

              {/* 3. 🔍 Search Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  🔍 Search Match / Winner
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search team, winner, college..."
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Header Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
            <span>
              Showing {filteredResults.length} declared result{filteredResults.length !== 1 ? 's' : ''}
              {filterSport !== 'ALL' && <> for <span className="text-blue-600 dark:text-blue-400">{filterSport}</span></>}
              {filterGender !== 'ALL' && <> ({filterGender} Gender)</>}
            </span>
            <button
              onClick={handleExportExcel}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Filtered Table to Excel</span>
            </button>
          </div>

          {/* Results Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading Super Coordinator declared results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No declared results found for current filters.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Only results declared by the Super Coordinator appear here.</p>
              <button
                onClick={() => { setSelectedResult(null); setIsEditOpen(true); }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block cursor-pointer"
              >
                + Declare First Match Result Manually
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">#</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Sport & Event</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Gender</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Format</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 whitespace-nowrap">🥇 Winner</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">🥈 Runner-Up</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Score / Result</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Declared By</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {filteredResults.map((res, idx) => (
                      <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                        {/* # */}
                        <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{idx + 1}</td>

                        {/* Sport & Event */}
                        <td className="px-4 py-3 whitespace-nowrap max-w-[220px]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{res.sportIcon}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border bg-blue-500/10 text-blue-400 border-blue-500/20">
                                {res.sportName}
                              </span>
                            </div>
                            <p className="text-slate-300 font-semibold text-[11px] line-clamp-1 max-w-[190px]" title={res.eventTitle}>
                              {res.eventTitle}
                            </p>
                            <span className="text-[9px] font-mono text-slate-600">#{res.id}</span>
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                            (res.gender || '').toLowerCase().includes('girl')
                              ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                              : (res.gender || '').toLowerCase().includes('mix')
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          }`}>
                            {res.gender || 'Boys'}
                          </span>
                        </td>

                        {/* Format */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase text-slate-400 border border-slate-700">
                            {res.matchFormat}
                          </span>
                        </td>

                        {/* Winner */}
                        <td className="px-4 py-3 whitespace-nowrap max-w-[180px]">
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <div>
                              <p className="font-bold text-blue-400 text-xs line-clamp-1" title={res.winnerName}>{res.winnerName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{res.winnerCollege}</p>
                            </div>
                          </div>
                        </td>

                        {/* Runner-Up */}
                        <td className="px-4 py-3 whitespace-nowrap max-w-[180px]">
                          <div className="flex items-center gap-1.5">
                            <Medal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div>
                              <p className="font-semibold text-slate-300 text-xs line-clamp-1" title={res.runnerUpName}>{res.runnerUpName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{res.runnerUpCollege}</p>
                            </div>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3 whitespace-nowrap max-w-[160px]">
                          <span className="font-mono text-[11px] text-white font-bold line-clamp-2" title={res.score}>
                            {res.score || 'Final Score Declared'}
                          </span>
                        </td>

                        {/* Declared By */}
                        <td className="px-4 py-3 whitespace-nowrap max-w-[130px]">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-[11px] text-emerald-400 font-semibold line-clamp-1" title={res.uploadedBy}>
                              {res.uploadedBy}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                          <span className="text-[10px] font-mono">
                            {res.uploadedDate ? String(res.uploadedDate).split('T')[0] : '—'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setSelectedResult(res); setIsEditOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Result"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteResult(res.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Result"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{filteredResults.length} declared result{filteredResults.length !== 1 ? 's' : ''} shown</span>
                <button onClick={handleExportExcel} className="flex items-center gap-1.5 text-emerald-400 hover:underline cursor-pointer font-semibold">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export Full Table to Excel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Result Modal */}
      <ResultEditModal
        isOpen={isEditOpen}
        result={selectedResult}
        onSave={handleSaveResult}
        onClose={() => { setIsEditOpen(false); setSelectedResult(null); }}
      />
    </div>
  );
};
