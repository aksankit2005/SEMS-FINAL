import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit2, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const TableTennisMatchScheduleTab = ({ matches, user, onUpdateMatches, onNavigateToLive, globalSearch }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();

  const assignedSport = 'table-tennis';
  const sportName = 'Table Tennis';
  const venueLabel = 'Table';
  const venueOptions = ['Table 1', 'Table 2', 'Table 3', 'Table 4'];

  // Filter TT matches from props
  const ttMatches = (matches || []).filter(
    (m) => (m?.sportId || m?.sportName || '').toLowerCase().includes('table-tennis') || (m?.matchTitle || m?.title || '').toLowerCase().includes('table tennis')
  );

  // Active scheduled matches (completed matches are removed from active schedule view)
  const scheduledMatches = ttMatches.filter((m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED');

  const [createdEvents, setCreatedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eligibleCompetitors, setEligibleCompetitors] = useState({ teams: [], participants: [] });
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    format: 'Singles',
    category: 'Male',
    eventTitle: 'Table Tennis Championship 2026',
    team1: '',
    team2: '',
    team1Id: '',
    team2Id: '',
    team1Name: '',
    team1Player1: '',
    team1Player2: '',
    team2Name: '',
    team2Player1: '',
    team2Player2: '',
    tableNumber: 'Table 1',
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
          (e) => (e.sportId || e.sportName || '').toLowerCase().includes('table-tennis') || (e.title || '').toLowerCase().includes('table tennis')
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
      setEligibleCompetitors({ teams: [], participants: [], singles: [], doubles: [], teamSquads: [] });
      return;
    }
    const loadCompetitors = async () => {
      setLoadingCompetitors(true);
      try {
        const data = await coordinatorApi.getEligibleCompetitors(selectedEvent.id, form.format);
        if (data) {
          setEligibleCompetitors({
            teams: data.teams || data.doubles || [],
            participants: data.participants || data.singles || [],
            singles: data.singles || [],
            doubles: data.doubles || [],
            teamSquads: data.teamSquads || []
          });
        }
      } catch (e) {
        console.warn('Error loading eligible TT competitors:', e);
      } finally {
        setLoadingCompetitors(false);
      }
    };
    loadCompetitors();
  }, [selectedEvent?.id, form.format]);

  const getCleanTeamName = (teamStr) => {
    if (!teamStr) return '';
    const match = teamStr.match(/^(.*?)\s*\(/);
    return match ? match[1].trim() : teamStr.trim();
  };

  const handleClearAll = async () => {
    const isConfirmed = await confirmDelete({
      title: 'Clear All Table Tennis Matches',
      message: 'Are you sure you want to clear all scheduled Table Tennis matches from the database? This action cannot be undone.'
    });
    if (isConfirmed) {
      await coordinatorApi.clearAllSchedules();
      onUpdateMatches([]);
      addToast('All match schedules cleared from database', 'warning');
    }
  };

  const handleFinishSlot = async (matchItem) => {
    const defaultWinner = matchItem.team1 || 'Player 1';
    const winnerName = window.prompt(`Enter winning player/team name for "${matchItem.team1} vs ${matchItem.team2}":`, getCleanTeamName(defaultWinner));
    if (!winnerName) return;

    const completedObj = {
      ...matchItem,
      status: 'COMPLETED',
      winner: winnerName.trim(),
      completedAt: new Date().toISOString(),
    };

    try {
      await coordinatorApi.completeMatch(matchItem.id, completedObj);
      const updated = matches.filter((m) => m.id !== matchItem.id);
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

    let finalTeam1 = '';
    let finalTeam2 = '';
    let finalTeam1Id = form.team1Id || null;
    let finalTeam2Id = form.team2Id || null;

    if (form.format === 'Doubles') {
      if (!form.team1.trim() || !form.team2.trim()) {
        addToast('Please select both Team 1 and Team 2 for Doubles', 'error');
        return;
      }
      if (form.team1.trim() === form.team2.trim()) {
        addToast('Team 1 and Team 2 cannot be the same competitor', 'error');
        return;
      }
      finalTeam1 = form.team1.trim();
      finalTeam2 = form.team2.trim();
    } else {
      if (!form.team1.trim() || !form.team2.trim()) {
        addToast('Please select both Player 1 and Player 2', 'error');
        return;
      }
      if (form.team1.trim() === form.team2.trim()) {
        addToast('Competitor 1 and Competitor 2 cannot be the same player', 'error');
        return;
      }
      finalTeam1 = form.team1.trim();
      finalTeam2 = form.team2.trim();
    }

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
            format: form.format,
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
        format: form.format,
        category: form.category,
      });
      addToast('Table Tennis match slot updated!', 'success');
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
        format: form.format,
        category: form.category,
        status: 'SCHEDULED',
        score1: 0,
        score2: 0,
      };
      const updated = [...matches, newSlot];
      onUpdateMatches(updated);
      await coordinatorApi.saveMatches(updated);
      addToast('Table Tennis match slot scheduled successfully!', 'success');
    }

    setForm((prev) => ({
      ...prev,
      team1: '',
      team2: '',
      team1Id: '',
      team2Id: '',
      team1Name: '',
      team1Player1: '',
      team1Player2: '',
      team2Name: '',
      team2Player1: '',
      team2Player2: '',
    }));
  };

  const handleDeleteSlot = async (id) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Match Fixture',
      message: 'Are you sure you want to delete this scheduled Table Tennis match fixture from the database?'
    });
    if (!isConfirmed) return;
    await coordinatorApi.deleteMatch(id);
    onUpdateMatches(matches.filter((m) => m.id !== id));
    addToast('Table Tennis match fixture deleted from database', 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900 dark:text-white animate-fade-in font-sans">

      {/* Left Column: Form Box */}
      <div className="lg:col-span-4 space-y-4">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>🏓</span>
            <span>Add Match Fixture</span>
          </h3>
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Schedules</span>
          </button>
        </div>

        {/* LIFECYCLE GATE BANNER */}
        {!selectedEvent ? (
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider">⚠️ No Active Event Available</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Create and publish a Table Tennis event in the Events tab to enable match fixture scheduling.
            </p>
          </div>
        ) : !isRegClosed ? (
          <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-indigo-300 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-wider">Event Active • Registration Open — Scheduling Locked</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Students are actively registering for <strong>"{selectedEvent.title}"</strong>. Navigate to the <strong>Events tab</strong> and click <strong>"Close Reg"</strong> to freeze participants and enable fixture scheduling.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Registration Closed — Fixtures Ready ({eligibleCompetitors.participants.length} players)</span>
            </span>
          </div>
        )}

        {/* Form Box: Add Match Slot */}
        <div className={`p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/30 shadow-soft dark:shadow-2xl space-y-4 ${
          !isRegClosed ? 'opacity-60 pointer-events-none' : ''
        }`}>
          <form onSubmit={handleAddSlot} className="space-y-3.5">
            {/* Event Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Target Event</label>
              {activeEvents.length > 0 ? (
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    const ev = activeEvents.find(a => a.id === e.target.value);
                    if (ev) setForm(prev => ({ ...prev, eventTitle: ev.title }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {activeEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title} ({ev.registrationOpen === false || ev.status === 'Closed' ? 'Reg Closed' : 'Reg Open'})</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-rose-500">No active events found.</p>
              )}
            </div>

            {/* Format & Category Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Format</label>
                <select
                  value={form.format}
                  onChange={(e) => setForm(prev => ({ ...prev, format: e.target.value, team1: '', team2: '', team1Id: null, team2Id: null }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="Singles">Singles</option>
                  <option value="Doubles">Doubles</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Open">Open</option>
                </select>
              </div>
            </div>

            {/* Competitor Dropdowns */}
            {form.format === 'Doubles' ? (
              <div className="space-y-3 pt-1">
                {(eligibleCompetitors.teams || eligibleCompetitors.doubles || []).length === 0 ? (
                  <p className="text-[11px] font-bold text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                    ⚠️ No verified Doubles/Duo registrations found for this Table Tennis event.
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Side A / Team 1 (Registered Pair/Team) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.team1}
                        onChange={(e) => {
                          const duoList = eligibleCompetitors.teams || eligibleCompetitors.doubles || [];
                          const selected = duoList.find(
                            (t) => (t.teamName || t.name) === e.target.value || t.displayName === e.target.value
                          );
                          setForm({
                            ...form,
                            team1: e.target.value,
                            team1Id: selected?.id || selected?.registrationId || null
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="">-- Select Registered Team 1 --</option>
                        {(eligibleCompetitors.teams || eligibleCompetitors.doubles || []).map((t) => (
                          <option key={t.id} value={t.teamName || t.name}>
                            {t.displayName || t.teamName || t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Side B / Team 2 (Registered Pair/Team) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.team2}
                        onChange={(e) => {
                          const duoList = eligibleCompetitors.teams || eligibleCompetitors.doubles || [];
                          const selected = duoList.find(
                            (t) => (t.teamName || t.name) === e.target.value || t.displayName === e.target.value
                          );
                          setForm({
                            ...form,
                            team2: e.target.value,
                            team2Id: selected?.id || selected?.registrationId || null
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="">-- Select Registered Team 2 --</option>
                        {(eligibleCompetitors.teams || eligibleCompetitors.doubles || []).map((t) => (
                          <option key={t.id} value={t.teamName || t.name}>
                            {t.displayName || t.teamName || t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {(eligibleCompetitors.participants || eligibleCompetitors.singles || []).length === 0 ? (
                  <p className="text-[11px] font-bold text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                    ⚠️ No verified Singles registrations found for this Table Tennis event.
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Player 1 (Registered Athlete) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.team1}
                        onChange={(e) => {
                          const singleList = eligibleCompetitors.participants || eligibleCompetitors.singles || [];
                          const p = singleList.find((item) => (item.name === e.target.value || item.displayName === e.target.value));
                          setForm({
                            ...form,
                            team1: e.target.value,
                            team1Id: p?.id || p?.registrationId || null
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="">-- Select Registered Player 1 --</option>
                        {(eligibleCompetitors.participants || eligibleCompetitors.singles || []).map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.displayName || `${p.name} (${p.college})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Player 2 (Registered Athlete) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.team2}
                        onChange={(e) => {
                          const singleList = eligibleCompetitors.participants || eligibleCompetitors.singles || [];
                          const p = singleList.find((item) => (item.name === e.target.value || item.displayName === e.target.value));
                          setForm({
                            ...form,
                            team2: e.target.value,
                            team2Id: p?.id || p?.registrationId || null
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="">-- Select Registered Player 2 --</option>
                        {(eligibleCompetitors.participants || eligibleCompetitors.singles || []).map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.displayName || `${p.name} (${p.college})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {isRegClosed && eligibleCompetitors.participants.length === 0 && (
              <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400">
                ⚠️ No verified registrations found for this Table Tennis event.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Table No.
                </label>
                <select
                  value={form.tableNumber}
                  onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {venueOptions.map((vOpt) => (
                    <option key={vOpt} value={vOpt}>{vOpt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Time</label>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="10:00 AM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Save Changes' : '+ Add Match Fixture'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* Right Column: Scheduled Matches Cards List */}
      <div className="lg:col-span-8 space-y-3">
        {scheduledMatches.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-cyan-500/20 text-slate-600 dark:text-slate-400 shadow-soft dark:shadow-md">
            No upcoming scheduled matches. All completed matches have been moved to Results.
          </div>
        ) : (
          scheduledMatches.map((m) => {
            const rawVenue = m.tableNumber || 'Table 1';

            // For Doubles, show Team Name ONLY
            const isDoubles = m.format === 'Doubles';
            const displayTeam1 = isDoubles ? getCleanTeamName(m.team1) : m.team1;
            const displayTeam2 = isDoubles ? getCleanTeamName(m.team2) : m.team2;

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/20 shadow-soft dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-cyan-500/50"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 uppercase">
                      {m.format || 'SINGLES'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
                      {m.category || 'MALE'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{m.id}</span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {displayTeam1} <span className="text-slate-400 font-normal">vs</span> {displayTeam2}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    📍 {rawVenue} | Date: {m.date || '2026-08-08'} | Time: {m.time || '10:00 AM'} | Event: {m.eventTitle || 'Table Tennis Championship 2026'}
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
                        format: m.format || 'Singles',
                        category: m.category || 'Male',
                        eventTitle: m.eventTitle || createdEvents[0]?.title || 'Table Tennis Championship 2026',
                        team1: m.team1 || '',
                        team2: m.team2 || '',
                        team1Name: '',
                        team1Player1: '',
                        team1Player2: '',
                        team2Name: '',
                        team2Player1: '',
                        team2Player2: '',
                        tableNumber: m.tableNumber || 'Table 1',
                        date: m.date || new Date().toISOString().split('T')[0],
                        time: m.time || '10:00 AM',
                      });
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Edit Schedule
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
