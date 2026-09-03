import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit2, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const TugOfWarMatchScheduleTab = ({ matches, user, onUpdateMatches, globalSearch }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();

  const assignedSport = 'tug-of-war';
  const sportName = 'Tug of War';

  // Active scheduled matches for Tug of War
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
    format: 'Team Match (8v8)',
    category: 'Open',
    eventTitle: 'Tug of War Championship 2026',
    team1: '',
    team2: '',
    team1Id: '',
    team2Id: '',
    tableNumber: 'Tug of War Ground 1',
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
          (e) => (e.sportId || e.sportName || '').toLowerCase().includes('tug') || (e.title || '').toLowerCase().includes('tug')
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
        console.warn('Error loading eligible tug of war teams:', e);
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
            format: 'Team Match (8v8)',
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
        format: 'Team Match (8v8)',
        category: form.category,
      });
      addToast('Tug of War match fixture updated!', 'success');
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
        format: 'Team Match (8v8)',
        category: form.category,
        status: 'SCHEDULED',
        score1: 0,
        score2: 0,
      };
      const updated = [...matches, newSlot];
      onUpdateMatches(updated);
      await coordinatorApi.saveMatches(updated);
      addToast('Tug of War match fixture scheduled successfully!', 'success');
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
      message: 'Are you sure you want to delete this scheduled tug of war match fixture from the database?'
    });
    if (!isConfirmed) return;
    await coordinatorApi.deleteMatch(id);
    onUpdateMatches(matches.filter((m) => m.id !== id));
    addToast('Match fixture deleted from database', 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">

      {/* Left Column: Form Box */}
      <div className="lg:col-span-4 space-y-4">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {editingId ? 'Edit Tug of War Fixture' : 'Add Tug of War Fixture'}
          </h3>
        </div>

        {/* LIFECYCLE GATE BANNER */}
        {!selectedEvent ? (
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider">⚠️ No Active Tug of War Event</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Create and publish a Tug of War event in the Events tab to enable match scheduling.
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                ⚠️ No verified registrations found for this Tug of War event.
              </p>
            )}

            {/* Tug of War Ground Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                Tug of War Ground Allocation
              </label>
              <select
                value={form.tableNumber}
                onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Tug of War Ground 1">Tug of War Ground 1</option>
                <option value="Tug of War Ground 2">Tug of War Ground 2</option>
                <option value="Tug of War Ground 3">Tug of War Ground 3</option>
                <option value="Tug of War Ground 4">Tug of War Ground 4</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Select between Ground 1 and Ground 4</p>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Match Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Start Time</label>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="04:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Save Fixture Changes' : '+ Add Tug of War Match'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    format: 'Team Match (8v8)',
                    category: 'Open',
                    eventTitle: createdEvents[0]?.title || 'Tug of War Championship 2026',
                    team1: '',
                    team2: '',
                    tableNumber: 'Tug of War Ground 1',
                    date: new Date().toISOString().split('T')[0],
                    time: '04:00 PM',
                  });
                }}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel Editing
              </button>
            )}
          </form>
        </div>

      </div>

      {/* Right Column: Scheduled Matches Cards List */}
      <div className="lg:col-span-8 space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Scheduled Tug of War Matches ({filteredMatches.length})
          </h3>
          <span className="text-xs font-mono text-slate-400">Grounds: Ground 1 to Ground 4</span>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-soft dark:shadow-md">
            No scheduled tug of war matches found. Add your first match fixture using the form on the left.
          </div>
        ) : (
          filteredMatches.map((m) => {
            const rawVenue = m.tableNumber || 'Tug of War Ground 1';
            const displayVenue = rawVenue.includes('Ground') ? rawVenue : `Tug of War ${rawVenue}`;

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-orange-500/50 dark:hover:border-slate-700"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 uppercase">
                      TEAM MATCH (8v8)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
                      {m.category || 'OPEN'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{m.id}</span>
                  </div>

                  {/* Team 1 vs Team 2 Display */}
                  <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="text-orange-600 dark:text-orange-400">{getCleanTeamName(m.team1)}</span>
                    <span className="text-slate-400 font-normal text-xs uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">VS</span>
                    <span className="text-amber-600 dark:text-amber-400">{getCleanTeamName(m.team2)}</span>
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    📍 {displayVenue} | Date: {m.date || new Date().toISOString().split('T')[0]} | Time: {m.time || '04:00 PM'} | Event: {m.eventTitle || 'Tug of War Championship'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleFinishSlot(m)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Finish Match</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingId(m.id);
                      setForm({
                        format: 'Team Match (8v8)',
                        category: m.category || 'Open',
                        eventTitle: m.eventTitle || createdEvents[0]?.title || 'Tug of War Championship 2026',
                        team1: m.team1 || '',
                        team2: m.team2 || '',
                        tableNumber: m.tableNumber || 'Tug of War Ground 1',
                        date: m.date || new Date().toISOString().split('T')[0],
                        time: m.time || '04:00 PM',
                      });
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> Edit
                  </button>

                  <button
                    onClick={() => handleDeleteSlot(m.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white border border-rose-200 dark:border-rose-500/20 transition cursor-pointer"
                    title="Delete Schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
