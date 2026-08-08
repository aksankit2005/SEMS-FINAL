import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit2, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const TableTennisMatchScheduleTab = ({ matches, user, onUpdateMatches, onNavigateToLive, globalSearch }) => {
  const { addToast } = useToast();

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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const list = await coordinatorApi.getEvents();
        const filtered = (list || []).filter(
          (e) => (e.sportId || e.sportName || '').toLowerCase().includes('table-tennis') || (e.title || '').toLowerCase().includes('table tennis')
        );
        if (filtered && filtered.length > 0) {
          setCreatedEvents(filtered);
          if (!form.eventTitle) {
            setForm((prev) => ({ ...prev, eventTitle: filtered[0].title }));
          }
        }
      } catch (e) {}
    };
    fetchEvents();
  }, []);

  const [form, setForm] = useState({
    format: 'Singles',
    category: 'Male',
    eventTitle: 'Table Tennis Championship 2026',
    team1: '',
    team2: '',
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

  const [editingId, setEditingId] = useState(null);

  const getCleanTeamName = (teamStr) => {
    if (!teamStr) return '';
    const match = teamStr.match(/^(.*?)\s*\(/);
    return match ? match[1].trim() : teamStr.trim();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all scheduled Table Tennis matches from the database?')) {
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

    let finalTeam1 = '';
    let finalTeam2 = '';

    if (form.format === 'Doubles') {
      if (!form.team1Name.trim()) {
        addToast('Please enter Team 1 Name for Doubles', 'error');
        return;
      }
      if (!form.team2Name.trim()) {
        addToast('Please enter Team 2 Name for Doubles', 'error');
        return;
      }
      const p1a = form.team1Player1.trim() || 'Player 1';
      const p1b = form.team1Player2.trim() || 'Player 2';
      const p2a = form.team2Player1.trim() || 'Player 1';
      const p2b = form.team2Player2.trim() || 'Player 2';

      finalTeam1 = `${form.team1Name.trim()} (${p1a} & ${p1b})`;
      finalTeam2 = `${form.team2Name.trim()} (${p2a} & ${p2b})`;
    } else {
      if (!form.team1.trim() || !form.team2.trim()) {
        addToast('Please enter both player names', 'error');
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
              tableNumber: form.tableNumber,
              date: form.date,
              time: form.time,
              format: form.format,
              category: form.category,
              eventTitle: form.eventTitle,
            }
          : m
      );
      onUpdateMatches(updated);
      await coordinatorApi.updateMatchScoring(editingId, {
        team1: finalTeam1,
        team2: finalTeam2,
        tableNumber: form.tableNumber,
        date: form.date,
        time: form.time,
        format: form.format,
        category: form.category,
        eventTitle: form.eventTitle,
      });
      addToast('Table Tennis match slot updated!', 'success');
      setEditingId(null);
    } else {
      const newSlot = {
        id: `M-TT-${Math.floor(100000 + Math.random() * 900000)}`,
        sportId: 'table-tennis',
        sportName: 'Table Tennis',
        team1: finalTeam1,
        team2: finalTeam2,
        tableNumber: form.tableNumber,
        venue: form.tableNumber,
        date: form.date,
        time: form.time,
        format: form.format,
        category: form.category,
        eventTitle: form.eventTitle,
        status: 'SCHEDULED',
        score1: 0,
        score2: 0,
      };
      const updated = [newSlot, ...(matches || [])];
      onUpdateMatches(updated);
      await coordinatorApi.saveMatches(updated);
      addToast('Table Tennis match slot added successfully!', 'success');
    }

    setForm({
      format: 'Singles',
      category: 'Male',
      eventTitle: createdEvents[0]?.title || 'Table Tennis Championship 2026',
      team1: '',
      team2: '',
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
  };

  const handleDeleteSlot = async (id) => {
    await coordinatorApi.deleteMatch(id);
    onUpdateMatches(matches.filter((m) => m.id !== id));
    addToast('Match fixture deleted from database', 'info');
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

        {/* Form Box: Add Match Slot Manually */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/30 shadow-soft dark:shadow-2xl space-y-4">
          <form onSubmit={handleAddSlot} className="space-y-3.5">
            {/* Event Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Event Name</label>
              {createdEvents.length > 0 ? (
                <select
                  value={form.eventTitle}
                  onChange={(e) => setForm({ ...form, eventTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {createdEvents.map((ev) => (
                    <option key={ev.id} value={ev.title}>{ev.title}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={form.eventTitle}
                  onChange={(e) => setForm({ ...form, eventTitle: e.target.value })}
                  placeholder="Table Tennis Championship 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              )}
            </div>

            {/* Format & Category Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Format</label>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
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

            {/* Conditional Player / Team Name Inputs */}
            {form.format === 'Doubles' ? (
              <div className="space-y-4 pt-1">
                {/* Side A / Team 1 Box */}
                <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/30 space-y-2.5">
                  <span className="text-[11px] font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block">
                    👥 Side A / Team 1 (Doubles Pair)
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                      Team 1 Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.team1Name}
                      onChange={(e) => setForm({ ...form, team1Name: e.target.value })}
                      placeholder="e.g. MPEC Spinners"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                        Player 1 Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.team1Player1}
                        onChange={(e) => setForm({ ...form, team1Player1: e.target.value })}
                        placeholder="e.g. Aman Sharma"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                        Player 2 / Partner <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.team1Player2}
                        onChange={(e) => setForm({ ...form, team1Player2: e.target.value })}
                        placeholder="e.g. Rahul Verma"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Side B / Team 2 Box */}
                <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-500/30 space-y-2.5">
                  <span className="text-[11px] font-mono font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
                    👥 Side B / Team 2 (Doubles Pair)
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                      Team 2 Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.team2Name}
                      onChange={(e) => setForm({ ...form, team2Name: e.target.value })}
                      placeholder="e.g. MIPS Smashers"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                        Player 1 Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.team2Player1}
                        onChange={(e) => setForm({ ...form, team2Player1: e.target.value })}
                        placeholder="e.g. Vikas Gupta"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                        Player 2 / Partner <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.team2Player2}
                        onChange={(e) => setForm({ ...form, team2Player2: e.target.value })}
                        placeholder="e.g. Rohan Kumar"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Player 1 Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.team1}
                    onChange={(e) => setForm({ ...form, team1: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Player 2 Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.team2}
                    onChange={(e) => setForm({ ...form, team2: e.target.value })}
                    placeholder="e.g. Rohan Gupta"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </>
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
