import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit2, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const FootballMatchScheduleTab = ({ matches, user, onUpdateMatches, globalSearch }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();

  const assignedSport = 'football';
  const sportName = 'Football';

  // Active scheduled matches for Football
  const scheduledMatches = (matches || []).filter(
    (m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && (!m.sport || m.sport.toLowerCase() === assignedSport || m.sportId === assignedSport)
  );

  // Search filter
  const filteredMatches = scheduledMatches.filter((m) => {
    if (!globalSearch || !globalSearch.trim()) return true;
    const q = globalSearch.toLowerCase();
    return (
      (m.team1 || '').toLowerCase().includes(q) ||
      (m.team2 || '').toLowerCase().includes(q) ||
      (m.eventTitle || '').toLowerCase().includes(q) ||
      (m.tableNumber || '').toLowerCase().includes(q) ||
      (m.id || '').toLowerCase().includes(q)
    );
  });

  const [createdEvents, setCreatedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eligibleCompetitors, setEligibleCompetitors] = useState({ teams: [], participants: [] });
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    format: 'Team',
    category: 'Boys',
    eventTitle: 'Football Championship 2026',
    team1: '',
    team2: '',
    team1Id: '',
    team2Id: '',
    tableNumber: 'Ground 1',
    date: new Date().toISOString().split('T')[0],
    time: '04:00 PM',
  });

  const activeEvents = createdEvents.filter((e) => e && e.status !== 'Draft' && e.status !== 'Completed');
  const selectedEvent = activeEvents.find((e) => e.id === selectedEventId) || activeEvents[0] || null;
  const isRegClosed = Boolean(selectedEvent && (selectedEvent.registrationOpen === false || selectedEvent.status === 'Closed'));

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const list = await coordinatorApi.getEvents();
        const filtered = (list || []).filter(
          (e) => (e.sportId || e.sportName || '').toLowerCase().includes('football') || (e.title || '').toLowerCase().includes('football')
        );
        if (filtered && filtered.length > 0) {
          setCreatedEvents(filtered);
          const act = filtered.filter((e) => e && e.status !== 'Draft' && e.status !== 'Completed');
          if (act.length > 0) {
            setSelectedEventId(act[0].id);
            setForm((prev) => ({ ...prev, eventTitle: act[0].title }));
          }
        }
      } catch (e) { }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent?.id) {
      setEligibleCompetitors({ teams: [], participants: [] });
      return;
    }
    const loadCompetitors = async () => {
      setLoadingCompetitors(true);
      try {
        const data = await coordinatorApi.getEligibleCompetitors(selectedEvent.id);
        if (data) {
          setEligibleCompetitors({
            teams: data.teams || [],
            participants: data.participants || []
          });
        }
      } catch (e) {
        console.warn('Error loading eligible football teams:', e);
      } finally {
        setLoadingCompetitors(false);
      }
    };
    loadCompetitors();
  }, [selectedEvent?.id]);

  const getCleanTeamName = (teamStr) => {
    if (!teamStr) return '';
    const match = teamStr.match(/^(.*?)\s*\(/);
    return match ? match[1].trim() : teamStr.trim();
  };

  const handleFinishSlot = async (matchItem) => {
    const defaultWinner = matchItem.team1 || 'Team 1';
    const winnerName = window.prompt(
      `Enter winning team name for "${matchItem.team1} vs ${matchItem.team2}":`,
      getCleanTeamName(defaultWinner)
    );
    if (!winnerName) return;

    const completedObj = {
      ...matchItem,
      status: 'COMPLETED',
      winner: winnerName.trim(),
      completedAt: new Date().toISOString(),
    };

    try {
      await coordinatorApi.completeMatch(matchItem.id, completedObj);
      const updated = matches.map((m) => (m.id === matchItem.id ? completedObj : m));
      onUpdateMatches(updated);
      addToast(`🏆 Match Finished! Winner: ${winnerName.trim()}. Saved to Results section.`, 'success');
    } catch (err) {
      addToast('Failed to finish match', 'error');
    }
  };

  const handleClearAll = async () => {
    const isConfirmed = await confirmDelete({
      title: 'Clear All Football Matches',
      message: 'Are you sure you want to clear all scheduled Football matches? This action cannot be undone.'
    });
    if (isConfirmed) {
      await coordinatorApi.clearAllSchedules();
      onUpdateMatches([]);
      addToast('All Football match schedules cleared', 'warning');
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();

    if (!selectedEvent) {
      addToast('No active event selected for match scheduling.', 'error');
      return;
    }

    if (!isRegClosed) {
      addToast('Registration must be closed before fixtures can be scheduled.', 'error');
      return;
    }

    if (!form.team1.trim() || !form.team2.trim()) {
      addToast('Please select both Team 1 and Team 2', 'error');
      return;
    }

    if (form.team1.trim() === form.team2.trim()) {
      addToast('Team 1 and Team 2 cannot be the same team', 'error');
      return;
    }

    const finalTeam1 = form.team1.trim();
    const finalTeam2 = form.team2.trim();
    const finalTeam1Id = form.team1Id || null;
    const finalTeam2Id = form.team2Id || null;

    if (editingId) {
      const updated = matches.map((m) =>
        m.id === editingId
          ? {
            ...m,
            team1: finalTeam1,
            team2: finalTeam2,
            team1Id: finalTeam1Id,
            team2Id: finalTeam2Id,
            eventId: selectedEvent.id,
            eventTitle: selectedEvent.title,
            tableNumber: form.tableNumber,
            date: form.date,
            time: form.time,
            format: 'Team',
            category: form.category,
          }
          : m
      );
      onUpdateMatches(updated);
      await coordinatorApi.updateMatchScoring(editingId, {
        team1: finalTeam1,
        team2: finalTeam2,
        team1Id: finalTeam1Id,
        team2Id: finalTeam2Id,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        tableNumber: form.tableNumber,
        date: form.date,
        time: form.time,
        format: 'Team',
        category: form.category,
      });
      addToast('Football match fixture updated!', 'success');
      setEditingId(null);
    } else {
      const newSlot = {
        id: `M${Math.floor(100000 + Math.random() * 900000)}`,
        sportId: assignedSport,
        sportName: sportName,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        team1: finalTeam1,
        team2: finalTeam2,
        team1Id: finalTeam1Id,
        team2Id: finalTeam2Id,
        tableNumber: form.tableNumber,
        date: form.date,
        time: form.time,
        format: 'Team',
        category: form.category,
        status: 'SCHEDULED',
        score1: 0,
        score2: 0,
      };
      const updated = [...matches, newSlot];
      onUpdateMatches(updated);
      await coordinatorApi.saveMatches(updated);
      addToast('Football match fixture scheduled successfully!', 'success');
    }

    setForm((prev) => ({
      ...prev,
      team1: '',
      team2: '',
      team1Id: '',
      team2Id: '',
    }));
  };

  const handleDeleteSlot = async (id) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Match Fixture',
      message: 'Are you sure you want to delete this scheduled Football match fixture from the database?'
    });
    if (!isConfirmed) return;
    await coordinatorApi.deleteMatch(id);
    onUpdateMatches(matches.filter((m) => m.id !== id));
    addToast('Match fixture deleted from database', 'info');
  };

  const handleEditClick = (m) => {
    setEditingId(m.id);
    setForm({
      format: 'Team',
      category: m.category || 'Boys',
      eventTitle: m.eventTitle || 'Football Championship 2026',
      team1: m.team1 || '',
      team2: m.team2 || '',
      team1Id: m.team1Id || '',
      team2Id: m.team2Id || '',
      tableNumber: m.tableNumber || 'Ground 1',
      date: m.date || new Date().toISOString().split('T')[0],
      time: m.time || '04:00 PM',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">

      {/* Left Column: Form Box */}
      <div className="lg:col-span-4 space-y-4">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {editingId ? 'Edit Football Fixture' : 'Add Football Fixture'}
          </h3>
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-600/20 hover:bg-rose-100 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Schedules</span>
          </button>
        </div>

        {/* LIFECYCLE GATE BANNER */}
        {!selectedEvent ? (
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider">⚠️ No Active Football Event</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Create and publish a Football event in the Events tab to enable match scheduling.
            </p>
          </div>
        ) : !isRegClosed ? (
          <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-indigo-300 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-wider">Event Active • Registration Open — Scheduling Locked</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Teams are actively registering for <strong>"{selectedEvent.title}"</strong>. Navigate to the <strong>Events tab</strong> and click <strong>"Close Reg"</strong> to freeze team rosters and enable fixture scheduling.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Registration Closed — Fixtures Ready ({eligibleCompetitors.teams.length} teams)</span>
            </span>
          </div>
        )}

        {/* Form Box */}
        <div className={`p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-2xl space-y-4 ${
          !isRegClosed ? 'opacity-60 pointer-events-none' : ''
        }`}>
          <form onSubmit={handleAddSlot} className="space-y-4">

            {/* Event Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                Target Event
              </label>
              {activeEvents.length > 0 ? (
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    const ev = activeEvents.find(a => a.id === e.target.value);
                    if (ev) setForm(prev => ({ ...prev, eventTitle: ev.title }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {activeEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title} ({ev.registrationOpen === false || ev.status === 'Closed' ? 'Reg Closed' : 'Reg Open'})</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-rose-500">No active events found.</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Open">Open</option>
              </select>
            </div>

            {/* TEAM 1 Registered Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Team 1 (Registered Team) <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.team1}
                onChange={(e) => {
                  const selected = (eligibleCompetitors.teams.length > 0 ? eligibleCompetitors.teams : eligibleCompetitors.participants).find(
                    (t) => (t.teamName || t.name) === e.target.value || t.displayName === e.target.value
                  );
                  setForm({
                    ...form,
                    team1: e.target.value,
                    team1Id: selected?.id || selected?.registrationId || null
                  });
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Select Registered Team 1 --</option>
                {(eligibleCompetitors.teams.length > 0 ? eligibleCompetitors.teams : eligibleCompetitors.participants).map((t) => (
                  <option key={t.id} value={t.teamName || t.name}>
                    {t.displayName || t.teamName || t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TEAM 2 Registered Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Team 2 (Registered Team) <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.team2}
                onChange={(e) => {
                  const selected = (eligibleCompetitors.teams.length > 0 ? eligibleCompetitors.teams : eligibleCompetitors.participants).find(
                    (t) => (t.teamName || t.name) === e.target.value || t.displayName === e.target.value
                  );
                  setForm({
                    ...form,
                    team2: e.target.value,
                    team2Id: selected?.id || selected?.registrationId || null
                  });
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Select Registered Team 2 --</option>
                {(eligibleCompetitors.teams.length > 0 ? eligibleCompetitors.teams : eligibleCompetitors.participants).map((t) => (
                  <option key={t.id} value={t.teamName || t.name}>
                    {t.displayName || t.teamName || t.name}
                  </option>
                ))}
              </select>
            </div>

            {isRegClosed && eligibleCompetitors.teams.length === 0 && (
              <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400">
                ⚠️ No verified registrations found for this Football event.
              </p>
            )}

            {/* Football Ground Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                Football Ground Allocation
              </label>
              <select
                value={form.tableNumber}
                onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Ground 1">Ground 1</option>
                <option value="Ground 2">Ground 2</option>
                <option value="Main Stadium">Main Stadium</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Select between Ground 1, Ground 2, or Main Stadium</p>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                  Kickoff Time
                </label>
                <input
                  type="text"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="04:00 PM"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Save Updated Football Fixture' : 'Schedule Football Match Fixture'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* Right Column: Scheduled Matches Grid */}
      <div className="lg:col-span-8 space-y-4">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Scheduled Football Fixtures</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              {filteredMatches.length} Active
            </span>
          </h3>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl mx-auto">
              ⚽
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              No scheduled Football matches found. Use the form on the left to add a fixture.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-xl space-y-3 hover:border-emerald-500/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <span className="text-emerald-500 font-mono">{m.id}</span>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      {m.tableNumber || 'Turf 1'}
                    </span>
                  </div>

                  <div className="py-3 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                      {m.category || 'Boys'} &bull; {m.eventTitle}
                    </span>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[120px]">
                        {m.team1}
                      </span>
                      <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                        VS
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[120px] text-right">
                        {m.team2}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" /> {m.time}
                    </span>
                    <span>{m.date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleFinishSlot(m)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Finish & Declare Winner</span>
                  </button>
                  <button
                    onClick={() => handleEditClick(m)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition"
                    title="Edit Fixture"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(m.id)}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition"
                    title="Delete Fixture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
