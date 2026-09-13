import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, CheckCircle2, Play, RefreshCw, Trophy, Layers } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { OFFICIAL_ATHLETICS_EVENTS } from '../../registration/AthleticsRegistration';

export const AthleticsMatchScheduleTab = ({ user }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();
  const [schedules, setSchedules] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  
  // Form State
  const [selectedSubEvent, setSelectedSubEvent] = useState('100m Race');
  const [roundTitle, setRoundTitle] = useState('Heat 1 (Prelims)');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [venueLocation, setVenueLocation] = useState('Main Stadium Track (Lanes 1-8)');
  const [filterGame, setFilterGame] = useState('All');

  const activeEvents = createdEvents.filter((e) => e && e.status !== 'Draft' && e.status !== 'Completed');
  const selectedEvent = activeEvents.find((e) => e.id === selectedEventId) || activeEvents[0] || null;
  const isRegClosed = Boolean(selectedEvent && (selectedEvent.registrationOpen === false || selectedEvent.status === 'Closed'));

  // Available athletics games from active event or official defaults
  const availableSubEvents = (
    (Array.isArray(selectedEvent?.subEventsConfig) && selectedEvent.subEventsConfig.length > 0 && selectedEvent.subEventsConfig.filter((s) => s.enabled !== false).map((s) => s.name)) ||
    (Array.isArray(selectedEvent?.subEvents) && selectedEvent.subEvents.length > 0 && selectedEvent.subEvents) ||
    OFFICIAL_ATHLETICS_EVENTS
  );

  // Sync selected sub-event when event changes
  useEffect(() => {
    if (availableSubEvents && availableSubEvents.length > 0) {
      if (!selectedSubEvent || !availableSubEvents.includes(selectedSubEvent)) {
        setSelectedSubEvent(availableSubEvents[0]);
      }
    }
  }, [selectedEventId, availableSubEvents]);

  useEffect(() => {
    loadSchedules();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const list = await coordinatorApi.getEvents();
      const filtered = (list || []).filter(
        (e) => (e.sportId || e.sportName || '').toLowerCase().includes('athletics') || (e.title || '').toLowerCase().includes('athletics')
      );
      if (filtered && filtered.length > 0) {
        setCreatedEvents(filtered);
        const act = filtered.filter((e) => e && e.status !== 'Draft' && e.status !== 'Completed');
        if (act.length > 0) {
          setSelectedEventId(act[0].id);
        }
      }
    } catch (e) { }
  };

  const loadSchedules = async () => {
    try {
      const list = await coordinatorApi.getMatches();
      setSchedules(list || []);
    } catch (err) {
      console.warn('Error loading Athletics schedules', err);
    }
  };

  // Helper to suggest appropriate venue sector
  const getSuggestedVenue = (gameName) => {
    const lower = (gameName || '').toLowerCase();
    if (lower.includes('jump')) return 'Long Jump Pit & Runway';
    if (lower.includes('javelin')) return 'Javelin Throw Runway & Sector';
    if (lower.includes('shot put')) return 'Shot Put Circle & Throw Sector';
    if (lower.includes('discus')) return 'Discus Throw Cage & Sector';
    if (lower.includes('relay')) return 'Main Stadium Track (Relay Lanes 1-8)';
    return 'Main Stadium Synthetic Track (Lanes 1-8)';
  };

  const handleSubEventSelectChange = (newGame) => {
    setSelectedSubEvent(newGame);
    setVenueLocation(getSuggestedVenue(newGame));
    // Suggest appropriate default round title
    const lower = newGame.toLowerCase();
    if (lower.includes('jump') || lower.includes('throw') || lower.includes('put')) {
      if (!roundTitle || roundTitle.includes('Heat')) {
        setRoundTitle('Qualifying Flight A');
      }
    } else {
      if (!roundTitle || roundTitle.includes('Flight')) {
        setRoundTitle('Heat 1 (Prelims)');
      }
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();

    if (!selectedEvent) {
      addToast('No active Athletics event selected.', 'error');
      return;
    }

    if (!isRegClosed) {
      addToast('Registration must be closed before fixtures/heats can be scheduled.', 'error');
      return;
    }

    if (!selectedSubEvent || !roundTitle.trim()) {
      addToast('Please select sub-event and enter round/phase title', 'info');
      return;
    }

    const newSchedule = {
      id: `M-ATH-${Date.now()}`,
      sportId: 'athletics',
      sportName: 'Athletics',
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      subEvent: selectedSubEvent,
      matchTitle: `${selectedSubEvent} — ${roundTitle}`,
      team1: `${selectedSubEvent}`,
      team2: `${roundTitle}`,
      date: scheduledDate,
      time: scheduledTime,
      venue: venueLocation,
      tableNumber: venueLocation,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
    };

    const updated = [newSchedule, ...schedules];
    setSchedules(updated);
    await coordinatorApi.saveMatches(updated);
    window.dispatchEvent(new Event('sems_matches_updated'));
    window.dispatchEvent(new Event('storage'));

    addToast(`📅 ${selectedSubEvent} (${roundTitle}) Scheduled Successfully!`, 'success');
  };

  const handleDeleteSchedule = async (id) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Time Slot',
      message: 'Are you sure you want to remove this scheduled time slot?'
    });
    if (!isConfirmed) return;
    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);
    await coordinatorApi.saveMatches(updated);
    window.dispatchEvent(new Event('sems_matches_updated'));
    window.dispatchEvent(new Event('storage'));
    addToast('Schedule slot removed', 'info');
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const updated = schedules.map((s) => (s.id === id ? { ...s, status: newStatus } : s));
    setSchedules(updated);
    await coordinatorApi.saveMatches(updated);
    window.dispatchEvent(new Event('sems_matches_updated'));
    window.dispatchEvent(new Event('storage'));
    addToast(`Status updated to ${newStatus}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* LIFECYCLE GATE BANNER */}
      {!selectedEvent ? (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-1.5">
          <h4 className="text-xs font-black uppercase tracking-wider">⚠️ No Active Athletics Event</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Create and publish an Athletics event in the Events tab to enable heat/fixture scheduling.
          </p>
        </div>
      ) : !isRegClosed ? (
        <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-indigo-300 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h4 className="text-xs font-black uppercase tracking-wider">Event Active • Registration Open — Scheduling Locked</h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Athletes are actively registering for <strong>"{selectedEvent.title}"</strong>. Navigate to the <strong>Events tab</strong> and click <strong>"Close Reg"</strong> to freeze participants and enable fixture scheduling.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Registration Closed — Fixtures Ready for {selectedEvent.title}</span>
          </span>
        </div>
      )}
      
      {/* HEADER & SCHEDULE FORM */}
      <div className={`bg-white dark:bg-[#0B1120] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5 ${
        !isRegClosed ? 'opacity-60 pointer-events-none' : ''
      }`}>
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            OFFICIAL ATHLETICS TIME SLOTTING CONSOLE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Sub-Event Schedule Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select target event, choose Athletics game (100m, 200m, 4*100m relay, Long Jump, etc.), enter heat/round details, date, and timing.
          </p>
        </div>

        <form onSubmit={handleAddSchedule} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          
          {/* 1. Target Event Dropdown */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Target Event <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {activeEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title} ({ev.registrationOpen === false || ev.status === 'Closed' ? 'Reg Closed' : 'Reg Open'})</option>
              ))}
            </select>
          </div>

          {/* 2. Athletics Game / Sub-Event Selection (NEW OPTION) */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-blue-500" />
                Athletics Game / Sub-Event <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-blue-500 font-semibold lowercase">({availableSubEvents.length} games)</span>
            </label>
            <select
              value={selectedSubEvent}
              onChange={(e) => handleSubEventSelectChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-500/40 text-xs font-bold text-blue-900 dark:text-blue-200 focus:border-blue-600 focus:outline-none cursor-pointer"
              required
            >
              {availableSubEvents.map((gameName) => (
                <option key={gameName} value={gameName}>
                  🏃 {gameName} {gameName.toLowerCase().includes('relay') ? '(4-Player Relay)' : '(Individual)'}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Round / Phase Title */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Round / Phase Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={roundTitle}
              onChange={(e) => setRoundTitle(e.target.value)}
              placeholder="e.g. Heat 1 (Prelims), Semi-Final, Grand Final"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              required
            />
            {/* Quick Round Presets */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {(selectedSubEvent.toLowerCase().includes('jump') || selectedSubEvent.toLowerCase().includes('throw') || selectedSubEvent.toLowerCase().includes('put')
                ? ['Qualifying Flight A', 'Qualifying Flight B', 'Final 8', 'Grand Final']
                : ['Heat 1 (Prelims)', 'Heat 2 (Prelims)', 'Semi-Final', 'Grand Final']
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRoundTitle(preset)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition cursor-pointer ${
                    roundTitle === preset
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Date Picker */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Scheduled Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* 5. Time Picker / Slot */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Timing / Time Slot <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              placeholder="e.g. 10:00 AM - 10:30 AM"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* 6. Track / Field Sector Venue Location */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Track / Field Sector Location
            </label>
            <input
              type="text"
              value={venueLocation}
              onChange={(e) => setVenueLocation(e.target.value)}
              placeholder="e.g. Main Stadium Track Lane 1-8"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-end sm:col-span-2 md:col-span-3">
            <button
              type="submit"
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Schedule Time Slot for {selectedSubEvent}
            </button>
          </div>

        </form>
      </div>

      {/* SCHEDULED TIME SLOTS TABLE */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" /> Scheduled Athletics Meet Time Slots ({schedules.length})
            </h3>
            <span className="text-xs font-mono text-slate-400">Auto-synced with Public Spectator Schedule</span>
          </div>

          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Showing: {filterGame === 'All' ? 'All Sub-Events' : filterGame}
          </span>
        </div>

        {/* Sub-Event Game Filter Tabs */}
        {schedules.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-mono font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-500" /> Filter Game:
            </span>
            <button
              type="button"
              onClick={() => setFilterGame('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterGame === 'All'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Games ({schedules.length})
            </button>
            {availableSubEvents.map((game) => {
              const count = schedules.filter((s) => (s.subEvent || s.team1 || '').toLowerCase() === game.toLowerCase()).length;
              return (
                <button
                  key={game}
                  type="button"
                  onClick={() => setFilterGame(game)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    filterGame === game
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{game}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      filterGame === game ? 'bg-white/20 text-white' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {schedules.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
            <p>No Athletics schedules created yet. Select a game (e.g. 100m Race) and timing above to create a schedule slot!</p>
          </div>
        ) : (
          (() => {
            const filteredList = schedules.filter((sch) => {
              if (filterGame === 'All') return true;
              const gName = (sch.subEvent || sch.team1 || '').toLowerCase();
              return gName === filterGame.toLowerCase();
            });

            if (filteredList.length === 0) {
              return (
                <div className="py-8 text-center space-y-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <p>No scheduled heats or flights found for <strong>{filterGame}</strong>.</p>
                  <button
                    type="button"
                    onClick={() => setFilterGame('All')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    View All Games
                  </button>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">Sub-Event Game</th>
                      <th className="py-3 px-3">Phase / Round</th>
                      <th className="py-3 px-3">Scheduled Date & Time</th>
                      <th className="py-3 px-3">Venue / Sector</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                    {filteredList.map((sch, idx) => (
                      <tr key={sch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                        
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            🏃 {sch.subEvent || sch.team1 || 'Athletics Game'}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                          {sch.matchTitle || sch.team2 || 'Schedule Slot'}
                        </td>

                        <td className="py-3 px-3 font-mono">
                          <span className="block font-bold text-slate-900 dark:text-white">{sch.time || '10:00 AM'}</span>
                          <span className="text-[10px] text-slate-400">{sch.date || '2026-09-01'}</span>
                        </td>

                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-semibold">
                          {sch.venue || sch.tableNumber || 'Main Stadium Track'}
                        </td>

                        <td className="py-3 px-3">
                          <select
                            value={sch.status || 'SCHEDULED'}
                            onChange={(e) => handleUpdateStatus(sch.id, e.target.value)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="running">In Progress (Live)</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(sch.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()
        )}
      </div>

    </div>
  );
};
