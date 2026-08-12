import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Filter,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  Activity,
  Calendar,
  MapPin,
  User2,
  Users2,
  Medal,
  Swords,
  Clock
} from 'lucide-react';
import { exportResultsToExcel } from '../../utils/excelExporter';
import { useToast } from '../../context/ToastContext';

// ── All 12 Sports ────────────────────────────────────────────────────────────
const ALL_12_SPORTS = [
  { id: 'cricket',      name: 'Cricket',       icon: '🏏' },
  { id: 'badminton',    name: 'Badminton',      icon: '🏸' },
  { id: 'football',     name: 'Football',       icon: '⚽' },
  { id: 'basketball',   name: 'Basketball',     icon: '🏀' },
  { id: 'volleyball',   name: 'Volleyball',     icon: '🏐' },
  { id: 'table-tennis', name: 'Table Tennis',   icon: '🏓' },
  { id: 'chess',        name: 'Chess',          icon: '♟️' },
  { id: 'kabaddi',      name: 'Kabaddi',        icon: '🤼' },
  { id: 'kho-kho',      name: 'Kho Kho',        icon: '🏃' },
  { id: 'athletics',    name: 'Athletics',      icon: '🏃‍♂️' },
  { id: 'tug-of-war',   name: 'Tug of War',     icon: '💪' },
  { id: 'gully-cricket',name: 'Gully Cricket',  icon: '🏏' },
];

// ── Helper: Read all coordinator completed matches from localStorage ──────────
function readAllCoordinatorMatches() {
  const results = [];
  const seenIds = new Set();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Source 1: sems_completed_results_<sportId>
    if (key.startsWith('sems_completed_results_')) {
      try {
        const list = JSON.parse(localStorage.getItem(key));
        if (!Array.isArray(list)) continue;
        const rawSportId = key.replace('sems_completed_results_', '');
        const sport = ALL_12_SPORTS.find(s => s.id === rawSportId || s.id === rawSportId.replace('_', '-'));
        const sportName = sport?.name || (rawSportId.charAt(0).toUpperCase() + rawSportId.slice(1).replace(/-/g, ' '));
        const sportIcon = sport?.icon || '🏅';

        list.forEach(m => {
          if (!m || !m.id || seenIds.has(m.id)) return;
          seenIds.add(m.id);

          const title = m.eventTitle || m.matchTitle || m.title || `${sportName} Championship`;
          const isGirls = title.toLowerCase().includes('girl') || title.toLowerCase().includes('women');
          const isMixed = title.toLowerCase().includes('mix');
          const gender = m.gender || m.category || (isGirls ? 'Girls' : isMixed ? 'Mixed' : 'Boys');

          results.push({
            id: m.id,
            sportId: rawSportId,
            sportName,
            sportIcon,
            eventTitle: title,
            format: m.format || m.matchFormat || 'Match',
            gender,
            team1: m.team1 || 'Player / Team A',
            team2: m.team2 || 'Player / Team B',
            score1: m.score1,
            score2: m.score2,
            scoreSummary: m.scoreSummary || m.scoreText || '',
            winner: m.winner || m.team1 || 'Declared',
            winnerCollege: m.winnerCollege || '',
            runnerUp: m.runnerUp || (m.winner === m.team1 ? m.team2 : m.team1) || '',
            runnerUpCollege: m.runnerUpCollege || '',
            venue: m.venue || m.tableNumber || '',
            completedAt: m.completedAt || m.updatedAt || '',
            completedBy: m.completedBy || m.uploadedBy || `Coord (${sportName})`,
            source: 'completed_results',
            status: 'COMPLETED',
          });
        });
      } catch (_) {}
    }

    // Source 2: sems_coord_matches_<sportId> — pick only COMPLETED/FINISHED
    if (key.startsWith('sems_coord_matches_')) {
      try {
        const list = JSON.parse(localStorage.getItem(key));
        if (!Array.isArray(list)) continue;
        const rawSportId = key.replace('sems_coord_matches_', '');
        const sport = ALL_12_SPORTS.find(s => s.id === rawSportId || s.id === rawSportId.replace('_', '-'));
        const sportName = sport?.name || (rawSportId.charAt(0).toUpperCase() + rawSportId.slice(1).replace(/-/g, ' '));
        const sportIcon = sport?.icon || '🏅';

        list.forEach(m => {
          if (!m || !m.id || seenIds.has(m.id)) return;
          const isDone = m.status === 'COMPLETED' || m.status === 'FINISHED' || m.status === 'WALKOVER' || m.winner;
          if (!isDone) return;
          seenIds.add(m.id);

          const title = m.matchTitle || m.title || `${sportName} Championship`;
          const isGirls = title.toLowerCase().includes('girl') || title.toLowerCase().includes('women');
          const isMixed = title.toLowerCase().includes('mix');
          const gender = m.gender || m.category || (isGirls ? 'Girls' : isMixed ? 'Mixed' : 'Boys');

          results.push({
            id: m.id,
            sportId: rawSportId,
            sportName,
            sportIcon,
            eventTitle: title,
            format: m.format || 'Match',
            gender,
            team1: m.team1 || m.player1 || 'Team A',
            team2: m.team2 || m.player2 || 'Team B',
            score1: m.score1,
            score2: m.score2,
            scoreSummary: m.scoreSummary || m.scoreText || `${m.score1 ?? '-'} - ${m.score2 ?? '-'}`,
            winner: m.winner || m.team1 || 'Declared',
            winnerCollege: m.winnerCollege || '',
            runnerUp: m.runnerUp || (m.winner === m.team1 ? m.team2 : m.team1) || '',
            runnerUpCollege: m.runnerUpCollege || '',
            venue: m.venue || m.tableNumber || m.court || '',
            completedAt: m.completedAt || m.endedAt || '',
            completedBy: m.completedBy || `Coord (${sportName})`,
            source: 'coord_matches',
            status: m.status || 'COMPLETED',
          });
        });
      } catch (_) {}
    }
  }

  // Sort newest first
  return results.sort((a, b) => {
    const da = a.completedAt ? new Date(a.completedAt) : new Date(0);
    const db = b.completedAt ? new Date(b.completedAt) : new Date(0);
    return db - da;
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (_) {
    return iso;
  }
}

function genderBadgeClass(gender) {
  const g = (gender || '').toLowerCase();
  if (g.includes('girl') || g.includes('female') || g.includes('women'))
    return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20';
  if (g.includes('mix'))
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
}

// ── Main Component ────────────────────────────────────────────────────────────
export const AdminCoordinatorMatchResultsPage = () => {
  const toastCtx = useToast();
  const addToast = toastCtx?.addToast || (() => {});
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSport, setFilterSport] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterEvent, setFilterEvent] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadMatches = useCallback(() => {
    setLoading(true);
    try {
      const data = readAllCoordinatorMatches();
      setAllMatches(data);
    } catch (_) {
      addToast('Failed to load coordinator match results', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadMatches();
    const handler = () => loadMatches();
    window.addEventListener('storage', handler);
    window.addEventListener('sems_results_updated', handler);
    window.addEventListener('sems_matches_updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('sems_results_updated', handler);
      window.removeEventListener('sems_matches_updated', handler);
    };
  }, [loadMatches]);

  // Unique event titles for dropdown
  const uniqueEvents = [...new Set(
    allMatches
      .filter(m => filterSport === 'ALL' || m.sportId === filterSport)
      .map(m => m.eventTitle)
      .filter(Boolean)
  )].sort();

  // Apply filters
  const filtered = allMatches.filter(m => {
    if (filterSport !== 'ALL' && m.sportId !== filterSport) return false;
    if (filterGender !== 'ALL') {
      const g = (m.gender || '').toLowerCase();
      const fg = filterGender.toLowerCase();
      if (fg === 'boys' && !g.includes('boy') && !g.includes('male') && !g.includes('men')) return false;
      if (fg === 'girls' && !g.includes('girl') && !g.includes('female') && !g.includes('women')) return false;
      if (fg === 'mixed' && !g.includes('mix')) return false;
    }
    if (filterEvent !== 'ALL' && m.eventTitle !== filterEvent) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.team1?.toLowerCase().includes(q) ||
        m.team2?.toLowerCase().includes(q) ||
        m.winner?.toLowerCase().includes(q) ||
        m.eventTitle?.toLowerCase().includes(q) ||
        m.sportName?.toLowerCase().includes(q) ||
        m.winnerCollege?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const hasActiveFilters = filterSport !== 'ALL' || filterGender !== 'ALL' || filterEvent !== 'ALL' || searchQuery;

  const handleResetFilters = () => {
    setFilterSport('ALL');
    setFilterGender('ALL');
    setFilterEvent('ALL');
    setSearchQuery('');
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      addToast('No match results available for export!', 'error');
      return;
    }
    try {
      exportResultsToExcel(
        filtered.map(m => ({
          id: m.id,
          sportName: m.sportName,
          sportId: m.sportId,
          eventTitle: m.eventTitle,
          matchFormat: m.format,
          gender: m.gender,
          winnerName: m.winner,
          winnerCollege: m.winnerCollege,
          runnerUpName: m.runnerUp,
          runnerUpCollege: m.runnerUpCollege,
          score: m.scoreSummary,
          status: m.status,
          uploadedBy: m.completedBy,
          uploadedDate: m.completedAt ? m.completedAt.split('T')[0] : '',
        })),
        { sport: filterSport, gender: filterGender, event: filterEvent },
        `Coordinator_Match_Results_${new Date().toISOString().split('T')[0]}`
      );
      addToast(`${filtered.length} match results exported to Excel!`, 'success');
    } catch (_) {
      addToast('Export failed', 'error');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in font-sans text-slate-900 dark:text-slate-100">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Super Admin · Live Feed
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              Auto-sync enabled
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Coordinator Completed Matches Feed
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All matches finished by sport coordinators — row-wise view with Sport, Gender & Event filters
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={loadMatches}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Completed', value: allMatches.length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Showing Now', value: filtered.length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Sports Covered', value: [...new Set(allMatches.map(m => m.sportId))].length, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Active Filters', value: [filterSport, filterGender, filterEvent].filter(f => f !== 'ALL').length + (searchQuery ? 1 : 0), color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map(stat => (
          <div key={stat.label} className={`p-3 rounded-xl border ${stat.bg} flex flex-col gap-0.5`}>
            <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Coordinator Matches</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <X className="w-3 h-3" /> Reset All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Discipline
            </label>
            <select
              value={filterSport}
              onChange={(e) => { setFilterSport(e.target.value); setFilterEvent('ALL'); }}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Sports</option>
              {ALL_12_SPORTS.map(s => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Gender Category
            </label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Genders</option>
              <option value="Boys" className="bg-white dark:bg-slate-900">Boys (Male)</option>
              <option value="Girls" className="bg-white dark:bg-slate-900">Girls (Female)</option>
              <option value="Mixed" className="bg-white dark:bg-slate-900">Mixed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Event Title
            </label>
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Events ({uniqueEvents.length})</option>
              {uniqueEvents.map(evt => (
                <option key={evt} value={evt} className="bg-white dark:bg-slate-900">{evt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Team, winner, college..."
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading coordinator match results feed...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-14 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <Trophy className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {allMatches.length === 0
              ? 'No coordinator completed matches recorded yet.'
              : 'No matches found matching current filters.'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            As soon as sport coordinators complete a match, it will be listed here in real-time.
          </p>
          {hasActiveFilters && (
            <button onClick={handleResetFilters} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60">
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">#</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">Sport & Event</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">Match (Team 1 vs Team 2)</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">Gender</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">Score / Result</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 whitespace-nowrap">🥇 Winner</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">🥈 Runner-Up</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">Venue</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">Completed At</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">By Coordinator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((m, idx) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* # */}
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {idx + 1}
                    </td>

                    {/* Sport & Event */}
                    <td className="px-4 py-3 whitespace-nowrap max-w-[200px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{m.sportIcon}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            {m.sportName}
                          </span>
                        </div>
                        <p className="text-slate-900 dark:text-slate-200 font-semibold text-[11px] line-clamp-1 max-w-[180px]" title={m.eventTitle}>
                          {m.eventTitle}
                        </p>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">#{m.id}</span>
                      </div>
                    </td>

                    {/* Match (Team1 vs Team2) */}
                    <td className="px-4 py-3 whitespace-nowrap max-w-[240px]">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="flex items-center gap-1">
                          <Users2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 line-clamp-1 max-w-[90px]" title={m.team1}>{m.team1}</span>
                        </div>
                        <span className="text-slate-400 font-black text-[10px] shrink-0">vs</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200 line-clamp-1 max-w-[90px]" title={m.team2}>{m.team2}</span>
                      </div>
                      {m.format && (
                        <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {m.format}
                        </span>
                      )}
                    </td>

                    {/* Gender */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${genderBadgeClass(m.gender)}`}>
                        {m.gender || 'Open'}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3 whitespace-nowrap max-w-[160px]">
                      <div className="font-mono text-[11px] text-slate-900 dark:text-white font-bold">
                        {m.scoreSummary
                          ? <span className="line-clamp-2" title={m.scoreSummary}>{m.scoreSummary}</span>
                          : (m.score1 !== undefined && m.score2 !== undefined)
                            ? `${m.score1} – ${m.score2}`
                            : <span className="text-slate-400">Final Declared</span>
                        }
                      </div>
                    </td>

                    {/* Winner */}
                    <td className="px-4 py-3 whitespace-nowrap max-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <div>
                          <p className="font-bold text-amber-600 dark:text-amber-400 text-xs line-clamp-1" title={m.winner}>{m.winner || '—'}</p>
                          {m.winnerCollege && (
                            <p className="text-[10px] text-slate-500 font-mono">{m.winnerCollege}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Runner-Up */}
                    <td className="px-4 py-3 whitespace-nowrap max-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <Medal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs line-clamp-1" title={m.runnerUp}>
                            {m.runnerUp || '—'}
                          </p>
                          {m.runnerUpCollege && (
                            <p className="text-[10px] text-slate-500 font-mono">{m.runnerUpCollege}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Venue */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 max-w-[130px]">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="text-[11px] line-clamp-1">{m.venue || '—'}</span>
                      </div>
                    </td>

                    {/* Completed At */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 min-w-[130px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="text-[10px] font-mono">{formatDate(m.completedAt)}</span>
                      </div>
                    </td>

                    {/* By Coordinator */}
                    <td className="px-4 py-3 whitespace-nowrap max-w-[140px]">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold line-clamp-1" title={m.completedBy}>
                          {m.completedBy || 'Coordinator'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{filtered.length} match{filtered.length !== 1 ? 'es' : ''} shown</span>
            <button onClick={handleExport} className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Full Table to Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
