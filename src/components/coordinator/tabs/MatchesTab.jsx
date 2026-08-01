import React, { useState } from 'react';
import { 
  Calendar, Clock, MapPin, User, Plus, Edit2, Trash2, Search, 
  Filter, Play, CheckCircle2, ShieldAlert, Award, FileText, Download, X 
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const MatchesTab = ({ matches, user, onUpdateMatches, onNavigate }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);

  const [form, setForm] = useState({
    matchTitle: '',
    team1: '',
    team2: '',
    college1: 'MPEC',
    college2: 'MIPS',
    venue: 'Central Arena Main Ground',
    referee: 'Official Referee A',
    date: '2026-08-03',
    time: '10:00 AM',
    round: 'Quarter Final',
    format: 'Knockout',
  });

  const filteredMatches = matches.filter((m) => {
    const matchesSearch = 
      m.matchTitle.toLowerCase().includes(search.toLowerCase()) ||
      m.team1.toLowerCase().includes(search.toLowerCase()) ||
      m.team2.toLowerCase().includes(search.toLowerCase()) ||
      m.venue.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesRound = roundFilter === 'all' || m.round === roundFilter;

    return matchesSearch && matchesStatus && matchesRound;
  });

  const handleSaveMatch = (e) => {
    e.preventDefault();
    if (!form.matchTitle || !form.team1 || !form.team2) {
      addToast('Please fill in match title and both competing teams', 'error');
      return;
    }

    if (editingMatch) {
      const updated = matches.map((m) =>
        m.id === editingMatch.id ? { ...m, ...form } : m
      );
      onUpdateMatches(updated);
      addToast(`Match "${form.matchTitle}" updated successfully`, 'success');
      setEditingMatch(null);
    } else {
      const newMatch = {
        id: `m-${user?.assignedSport}-${Date.now()}`,
        sportId: user?.assignedSport,
        sportName: user?.sportName,
        ...form,
        score1: 0,
        score2: 0,
        status: 'upcoming',
        liveTimer: '00:00',
        isPaused: false,
        foulsTeam1: 0,
        foulsTeam2: 0,
        yellowCards1: 0,
        yellowCards2: 0,
        redCards1: 0,
        redCards2: 0,
        timeouts1: 2,
        timeouts2: 2,
        winner: null,
      };
      onUpdateMatches([newMatch, ...matches]);
      addToast(`New ${user?.sportName} match scheduled successfully!`, 'success');
      setIsCreateModalOpen(false);
    }

    setForm({
      matchTitle: '',
      team1: '',
      team2: '',
      college1: 'MPEC',
      college2: 'MIPS',
      venue: 'Central Arena Main Ground',
      referee: 'Official Referee A',
      date: '2026-08-03',
      time: '10:00 AM',
      round: 'Quarter Final',
      format: 'Knockout',
    });
  };

  const handleDeleteMatch = (matchId) => {
    const match = matches.find((m) => m.id === matchId);
    if (match?.status !== 'upcoming') {
      addToast('Cannot delete running or completed matches!', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete upcoming match "${match?.matchTitle}"?`)) {
      const updated = matches.filter((m) => m.id !== matchId);
      onUpdateMatches(updated);
      addToast('Upcoming match deleted successfully', 'info');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {user?.sportName} Match Schedule & Management
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create fixtures, assign venues, referees, times, dates & rounds (QF, SF, Final, League, Knockout, Round Robin)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMatch(null);
            setIsCreateModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Match
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${user?.sportName} matches, teams, venues...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Match Statuses</option>
          <option value="running">Running (Live)</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={roundFilter}
          onChange={(e) => setRoundFilter(e.target.value)}
          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Rounds</option>
          <option value="Quarter Final">Quarter Final</option>
          <option value="Semi Final">Semi Final</option>
          <option value="Final">Final</option>
          <option value="League">League</option>
          <option value="Knockout">Knockout</option>
          <option value="Round Robin">Round Robin</option>
        </select>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMatches.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">No Matches Found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredMatches.map((m) => (
            <div
              key={m.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft hover:shadow-xl transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider">
                    {m.round} • {m.format}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    m.status === 'running' ? 'bg-rose-500/10 text-rose-500 animate-pulse' :
                    m.status === 'completed' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    ● {m.status}
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-900 dark:text-white mt-3">{m.matchTitle}</h4>

                {/* Team Vs Score */}
                <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-around text-center">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">{m.team1}</span>
                    <span className="text-[10px] text-slate-400 block">{m.college1}</span>
                    <span className="text-2xl font-black text-orange-500 mt-1 block">{m.score1}</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase">VS</span>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">{m.team2}</span>
                    <span className="text-[10px] text-slate-400 block">{m.college2}</span>
                    <span className="text-2xl font-black text-orange-500 mt-1 block">{m.score2}</span>
                  </div>
                </div>

                {/* Match Metadata */}
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>Venue: {m.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Referee: {m.referee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{m.date} at {m.time}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate('live-scoring')}
                  className="px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Score Match
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingMatch(m);
                      setForm({
                        matchTitle: m.matchTitle,
                        team1: m.team1,
                        team2: m.team2,
                        college1: m.college1,
                        college2: m.college2,
                        venue: m.venue,
                        referee: m.referee,
                        date: m.date,
                        time: m.time,
                        round: m.round,
                        format: m.format,
                      });
                      setIsCreateModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                    title="Edit Match"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {m.status === 'upcoming' && (
                    <button
                      onClick={() => handleDeleteMatch(m.id)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition"
                      title="Delete Match"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Create/Edit Match */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {editingMatch ? 'Edit Match Details' : `Schedule New ${user?.sportName} Match`}
              </h4>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatch} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Match Title / Fixture Name
                </label>
                <input
                  type="text"
                  required
                  value={form.matchTitle}
                  onChange={(e) => setForm({ ...form, matchTitle: e.target.value })}
                  placeholder="e.g. Football Quarter Final 1"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Team 1 Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.team1}
                    onChange={(e) => setForm({ ...form, team1: e.target.value })}
                    placeholder="MPEC Tigers"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Team 2 Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.team2}
                    onChange={(e) => setForm({ ...form, team2: e.target.value })}
                    placeholder="MIPS Warriors"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Assigned Venue
                  </label>
                  <select
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Central Arena Main Ground">Central Arena Main Ground</option>
                    <option value="Indoor Sports Complex Hall A">Indoor Sports Complex Hall A</option>
                    <option value="Badminton Court 1-4">Badminton Court 1-4</option>
                    <option value="Ground 2 Outdoor Stadium">Ground 2 Outdoor Stadium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Assigned Referee / Umpire
                  </label>
                  <input
                    type="text"
                    value={form.referee}
                    onChange={(e) => setForm({ ...form, referee: e.target.value })}
                    placeholder="Official Referee A"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Tournament Round
                  </label>
                  <select
                    value={form.round}
                    onChange={(e) => setForm({ ...form, round: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Quarter Final">Quarter Final</option>
                    <option value="Semi Final">Semi Final</option>
                    <option value="Final">Final</option>
                    <option value="League">League</option>
                    <option value="Knockout">Knockout</option>
                    <option value="Round Robin">Round Robin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Match Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20"
                >
                  {editingMatch ? 'Save Changes' : 'Schedule Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
