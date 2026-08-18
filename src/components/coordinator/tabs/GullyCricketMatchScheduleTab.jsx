import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit2, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const GullyCricketMatchScheduleTab = ({ matches, user, onUpdateMatches, onNavigateToLive, globalSearch }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();

  const assignedSport = 'gully-cricket';
  const sportName = 'Gully Cricket';

  // Active scheduled matches for Gully Cricket
  const scheduledMatches = (matches || []).filter(
    (m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED'
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
    format: '6-Overs Fast Box',
    category: 'Open',
    eventTitle: 'Official Gully & Box Cricket Championship 2026',
    team1: '',
    team2: '',
    team1Id: '',
    team2Id: '',
    tableNumber: 'Street Pitch Ground 1',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
  });

  const activeEvents = createdEvents.filter((e) => e && e.status !== 'Draft' && e.status !== 'Completed');
  const selectedEvent = activeEvents.find((e) => e.id === selectedEventId) || activeEvents[0] || null;
  const isRegClosed = Boolean(selectedEvent && (selectedEvent.registrationOpen === false || selectedEvent.status === 'Closed'));

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const list = await coordinatorApi.getEvents();
        const filtered = (list || []).filter(
          (e) => (e.sportId || e.sportName || '').toLowerCase().includes('gully') || (e.title || '').toLowerCase().includes('gully')
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
        console.warn('Error loading eligible gully cricket teams:', e);
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
            matchTitle: `${finalTeam1} vs ${finalTeam2}`,
            format: form.format,
            category: form.category,
            eventId: selectedEvent.id,
            eventTitle: selectedEvent.title,
            tableNumber: form.tableNumber,
            date: form.date,
            time: form.time,
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
        format: form.format,
        category: form.category,
      });
      setEditingId(null);
      addToast('Gully Cricket match schedule updated successfully', 'success');
    } else {
      const newMatch = {
        id: `M-GUL-${Math.floor(100000 + Math.random() * 900000)}`,
        sport: assignedSport,
        sportId: assignedSport,
        sportName: sportName,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        team1: finalTeam1,
        team2: finalTeam2,
        team1Id: finalTeam1Id,
        team2Id: finalTeam2Id,
        matchTitle: `${finalTeam1} vs ${finalTeam2}`,
        format: form.format,
        category: form.category,
        tableNumber: form.tableNumber,
        venue: form.tableNumber,
        date: form.date,
        time: form.time,
        status: 'SCHEDULED',
        score1: 0,
        score2: 0,
      };

      const updated = [newMatch, ...(matches || [])];
      onUpdateMatches(updated);
      await coordinatorApi.saveMatches(updated);
      addToast('Gully Cricket match schedule created successfully!', 'success');
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
      title: 'Delete Gully Cricket Match',
      message: 'Are you sure you want to remove this scheduled Gully Cricket match?'
    });
    if (!isConfirmed) return;
    await coordinatorApi.deleteMatch(id);
    onUpdateMatches(matches.filter((m) => m.id !== id));
    addToast('Gully Cricket match schedule deleted', 'info');
  };

  const handleEdit = (m) => {
    setEditingId(m.id);
    setForm({
      format: m.format || '6-Overs Fast Box',
      category: m.category || 'Open',
      eventTitle: m.eventTitle || 'Official Gully & Box Cricket Championship 2026',
      team1: m.team1 || '',
      team2: m.team2 || '',
      team1Id: m.team1Id || '',
      team2Id: m.team2Id || '',
      tableNumber: m.tableNumber || 'Street Pitch Ground 1',
      date: m.date || new Date().toISOString().split('T')[0],
      time: m.time || '10:00 AM',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
              🏏 GULLY CRICKET FIXTURES
            </span>
            <span className="text-xs font-mono text-slate-400">Total Scheduled: {scheduledMatches.length}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Gully & Box Cricket Match Scheduler
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate 6-Overs street pitch match fixtures, allocate match times, and promote matches to Live Scoring
          </p>
        </div>
      </div>

      {/* Grid: Match Creation Form (Left) & Scheduled List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Schedule Creation Card */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* LIFECYCLE GATE BANNER */}
          {!selectedEvent ? (
            <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider">⚠️ No Active Gully Cricket Event</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Create and publish a Gully Cricket event in the Events tab to enable match scheduling.
              </p>
            </div>
          ) : !isRegClosed ? (
            <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-indigo-300 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider">Event Active • Registration Open — Scheduling Locked</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Teams are actively registering for <strong>"{selectedEvent.title}"</strong>. To schedule matches, navigate to the <strong>Events tab</strong> and click <strong>"Close Reg"</strong> to freeze team rosters.
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

          <div className={`bg-white dark:bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-24 ${
            !isRegClosed ? 'opacity-60 pointer-events-none' : ''
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  🏏
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {editingId ? 'Edit Gully Match Slot' : 'Create Match Schedule Slot'}
                </h3>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      format: '6-Overs Fast Box',
                      category: 'Open',
                      eventTitle: 'Official Gully & Box Cricket Championship 2026',
                      team1: '',
                      team2: '',
                      team1Id: '',
                      team2Id: '',
                      tableNumber: 'Street Pitch Ground 1',
                      date: new Date().toISOString().split('T')[0],
                      time: '10:00 AM',
                    });
                  }}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Event</label>
                {activeEvents.length > 0 ? (
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      const ev = activeEvents.find(a => a.id === e.target.value);
                      if (ev) setForm(prev => ({ ...prev, eventTitle: ev.title }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {activeEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>{evt.title} ({evt.registrationOpen === false || evt.status === 'Closed' ? 'Reg Closed' : 'Reg Open'})</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-500">No active events found.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Format</label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="6-Overs Fast Box">6-Overs Fast Box</option>
                    <option value="4-Overs Box">4-Overs Box</option>
                    <option value="8-Overs Street">8-Overs Street</option>
                    <option value="Super 6 Knockout">Super 6 Knockout</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                  </select>
                </div>
              </div>

              {/* Team 1 & Team 2 Registered Selectors */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Team 1 (Batting First - Registered Team) *</label>
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
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Registered Team 1 --</option>
                    {(eligibleCompetitors.teams.length > 0 ? eligibleCompetitors.teams : eligibleCompetitors.participants).map((t) => (
                      <option key={t.id} value={t.teamName || t.name}>
                        {t.displayName || t.teamName || t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Team 2 (Batting Second - Registered Team) *</label>
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
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    ⚠️ No verified registrations found for this Gully Cricket event.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pitch / Area Allocation</label>
                <input
                  type="text"
                  value={form.tableNumber}
                  onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                  placeholder="Street Pitch Ground 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Match Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Match Time</label>
                  <input
                    type="text"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingId ? 'Save Gully Slot Updates' : 'Add to Gully Schedule'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Scheduled Matches List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Upcoming Gully Match Fixtures ({filteredMatches.length})</span>
            </h3>
            {onNavigateToLive && (
              <button
                onClick={onNavigateToLive}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Go to Live Scoring</span>
                <span>→</span>
              </button>
            )}
          </div>

          {filteredMatches.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-[#0F172A] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-xl">
                🏏
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Gully Cricket Matches Scheduled</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Use the form on the left to schedule Gully Cricket fixtures.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatches.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500/40 transition"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                        {m.format || '6-Overs Fast Box'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">#{m.id}</span>
                      <span className="text-[10px] font-mono text-slate-400">• {m.tableNumber || 'Street Pitch Ground 1'}</span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                      <span className="text-emerald-600 dark:text-emerald-400">{m.team1}</span>
                      <span className="text-slate-400 mx-2 text-xs font-normal">vs</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{m.team2}</span>
                    </h4>

                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-3">
                      <span>📅 {m.date || 'Today'}</span>
                      <span>⏰ {m.time || '10:00 AM'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleFinishSlot(m)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Declare Finished"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Finish</span>
                    </button>
                    <button
                      onClick={() => handleEdit(m)}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
                      title="Edit Match"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete Match"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
