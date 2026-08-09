import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit2, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const GullyCricketMatchScheduleTab = ({ matches, user, onUpdateMatches, globalSearch }) => {
  const { addToast } = useToast();

  const assignedSport = 'gully-cricket';
  const sportName = 'Gully Cricket';

  const scheduledMatches = (matches || []).filter(
    (m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && (!m.sport || m.sport.toLowerCase().includes('gully') || m.sportId === assignedSport)
  );

  const filteredMatches = scheduledMatches.filter((m) => {
    if (!globalSearch || !globalSearch.trim()) return true;
    const q = globalSearch.toLowerCase();
    return (
      (m.team1 || '').toLowerCase().includes(q) ||
      (m.team2 || '').toLowerCase().includes(q) ||
      (m.eventTitle || '').toLowerCase().includes(q) ||
      (m.ground || '').toLowerCase().includes(q) ||
      (m.id || '').toLowerCase().includes(q)
    );
  });

  const [createdEvents, setCreatedEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    format: 'Team',
    category: 'Open',
    eventTitle: 'Inter-College Gully Cricket Championship 2026',
    team1: '',
    team2: '',
    ground: 'Ground 1',
    date: new Date().toISOString().split('T')[0],
    time: '04:00 PM',
    tossWinner: '',
    battingFirst: '',
    overs: 6,
    ballType: 'Tennis Ball',
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const list = await coordinatorApi.getEvents();
        if (list && list.length > 0) {
          setCreatedEvents(list);
          if (!form.eventTitle) {
            setForm((prev) => ({ ...prev, eventTitle: list[0].title }));
          }
        }
      } catch (e) {}
    };
    fetchEvents();
  }, []);

  const getCleanTeamName = (teamStr) => {
    if (!teamStr) return '';
    const match = teamStr.match(/^(.*?)\s*\(/);
    return match ? match[1].trim() : teamStr.trim();
  };

  const handleFinishSlot = async (matchItem) => {
    const defaultWinner = matchItem.team1 || 'Team A';
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
    if (window.confirm('Are you sure you want to clear all scheduled gully cricket matches?')) {
      await coordinatorApi.clearAllSchedules();
      onUpdateMatches([]);
      addToast('All gully cricket match schedules cleared', 'warning');
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();

    if (!form.team1.trim() || !form.team2.trim()) {
      addToast('Please enter both Team A Name and Team B Name', 'error');
      return;
    }

    const finalTeam1 = form.team1.trim();
    const finalTeam2 = form.team2.trim();

    if (editingId) {
      const updated = matches.map((m) =>
        m.id === editingId
          ? {
              ...m,
              team1: finalTeam1,
              team2: finalTeam2,
              ground: form.ground,
              date: form.date,
              time: form.time,
              tossWinner: form.tossWinner,
              battingFirst: form.battingFirst,
              overs: form.overs,
              ballType: form.ballType,
              format: 'Team',
              category: form.category,
              eventTitle: form.eventTitle,
            }
          : m
      );
      onUpdateMatches(updated);
      await coordinatorApi.updateMatchScoring(editingId, {
        team1: finalTeam1,
        team2: finalTeam2,
        ground: form.ground,
        date: form.date,
        time: form.time,
        tossWinner: form.tossWinner,
        battingFirst: form.battingFirst,
        overs: form.overs,
        ballType: form.ballType,
        format: 'Team',
        category: form.category,
        eventTitle: form.eventTitle,
      });
      addToast('Gully Cricket match fixture updated!', 'success');
      setEditingId(null);
    } else {
      const newSlot = {
        id: `M-GCK-${Math.floor(100000 + Math.random() * 900000)}`,
        sport: 'gully-cricket',
        sportId: 'gully-cricket',
        sportName: 'Gully Cricket',
        team1: finalTeam1,
        team2: finalTeam2,
        ground: form.ground,
        date: form.date,
        time: form.time,
        tossWinner: form.tossWinner || finalTeam1,
        battingFirst: form.battingFirst || finalTeam1,
        overs: form.overs || 6,
        ballType: form.ballType || 'Tennis Ball',
        format: 'Team',
        category: form.category,
        eventTitle: form.eventTitle,
        status: 'SCHEDULED',
        score1: '0/0',
        score2: '0/0',
      };
      const updated = [...matches, newSlot];
      onUpdateMatches(updated);
      await coordinatorApi.saveMatches(updated);
      addToast('Gully Cricket match fixture scheduled successfully!', 'success');
    }

    setForm({
      format: 'Team',
      category: 'Open',
      eventTitle: createdEvents[0]?.title || 'Inter-College Gully Cricket Championship 2026',
      team1: '',
      team2: '',
      ground: 'Ground 1',
      date: new Date().toISOString().split('T')[0],
      time: '04:00 PM',
      tossWinner: '',
      battingFirst: '',
      overs: 6,
      ballType: 'Tennis Ball',
    });
  };

  const handleDeleteSlot = async (id) => {
    await coordinatorApi.deleteMatch(id);
    onUpdateMatches(matches.filter((m) => m.id !== id));
    addToast('Gully Cricket match fixture deleted', 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">
      
      {/* Left Column: Fixture Creation Form */}
      <div className="lg:col-span-4 space-y-4">
        
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {editingId ? 'Edit Gully Cricket Fixture' : 'Add Gully Cricket Match Fixture'}
          </h3>
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-600/20 hover:bg-rose-100 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Schedules</span>
          </button>
        </div>

        {/* Form Box */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-2xl space-y-4">
          <form onSubmit={handleAddSlot} className="space-y-4">
            
            {/* Event Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                Event Title
              </label>
              {createdEvents.length > 0 ? (
                <select
                  value={form.eventTitle}
                  onChange={(e) => setForm({ ...form, eventTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  placeholder="e.g. Inter-College Gully Cricket Championship 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Open">Open</option>
              </select>
            </div>

            {/* Team A Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Team A <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.team1}
                onChange={(e) => setForm({ ...form, team1: e.target.value })}
                placeholder="e.g. Gully Smashers"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Team B Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Team B <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.team2}
                onChange={(e) => setForm({ ...form, team2: e.target.value })}
                placeholder="e.g. Street Kings"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Ground Allocation */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                Ground
              </label>
              <select
                value={form.ground}
                onChange={(e) => setForm({ ...form, ground: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Ground 1">Ground 1</option>
                <option value="Ground 2">Ground 2</option>
                <option value="Ground 3">Ground 3</option>
                <option value="Ground 4">Ground 4</option>
              </select>
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
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Match Time</label>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="04:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Toss Winner & Batting First */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Toss Winner</label>
                <select
                  value={form.tossWinner}
                  onChange={(e) => setForm({ ...form, tossWinner: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Toss Winner</option>
                  {form.team1 && <option value={form.team1}>{form.team1}</option>}
                  {form.team2 && <option value={form.team2}>{form.team2}</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Batting First</label>
                <select
                  value={form.battingFirst}
                  onChange={(e) => setForm({ ...form, battingFirst: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Batting First</option>
                  {form.team1 && <option value={form.team1}>{form.team1}</option>}
                  {form.team2 && <option value={form.team2}>{form.team2}</option>}
                </select>
              </div>
            </div>

            {/* Overs & Ball Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Overs</label>
                <select
                  value={form.overs}
                  onChange={(e) => setForm({ ...form, overs: parseInt(e.target.value, 10) || 6 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value={5}>5 Overs</option>
                  <option value={6}>6 Overs</option>
                  <option value={8}>8 Overs</option>
                  <option value={10}>10 Overs</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Ball Type</label>
                <select
                  value={form.ballType}
                  onChange={(e) => setForm({ ...form, ballType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Tennis Ball">Tennis Ball</option>
                  <option value="Tape Ball">Tape Ball</option>
                  <option value="Rubber Ball">Rubber Ball</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Save Fixture Changes' : '+ Add Gully Cricket Match'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    format: 'Team',
                    category: 'Open',
                    eventTitle: createdEvents[0]?.title || 'Inter-College Gully Cricket Championship 2026',
                    team1: '',
                    team2: '',
                    ground: 'Ground 1',
                    date: new Date().toISOString().split('T')[0],
                    time: '04:00 PM',
                    tossWinner: '',
                    battingFirst: '',
                    overs: 6,
                    ballType: 'Tennis Ball',
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
            Scheduled Gully Cricket Matches ({filteredMatches.length})
          </h3>
          <span className="text-xs font-mono text-slate-400">Grounds: Ground 1 to Ground 4</span>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-soft dark:shadow-md">
            No scheduled gully cricket matches found. Add your first match fixture using the form on the left.
          </div>
        ) : (
          filteredMatches.map((m) => {
            const rawVenue = m.ground || m.tableNumber || 'Ground 1';
            const displayVenue = rawVenue.includes('Ground') ? rawVenue : `Ground ${rawVenue}`;

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-orange-500/50 dark:hover:border-slate-700"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 uppercase">
                      TEAM MATCH • {m.overs || 6} OVERS ({m.ballType || 'Tennis Ball'})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
                      {m.category || 'OPEN'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{m.id}</span>
                  </div>

                  {/* Team A vs Team B Display */}
                  <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="text-orange-600 dark:text-orange-400">{getCleanTeamName(m.team1)}</span>
                    <span className="text-slate-400 font-normal text-xs uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">VS</span>
                    <span className="text-amber-600 dark:text-amber-400">{getCleanTeamName(m.team2)}</span>
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    📍 {displayVenue} | Date: {m.date || '2026-09-05'} | Time: {m.time || '04:00 PM'} | Toss: {m.tossWinner || 'TBD'} | Batting: {m.battingFirst || 'TBD'}
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
                        format: 'Team',
                        category: m.category || 'Open',
                        eventTitle: m.eventTitle || createdEvents[0]?.title || 'Inter-College Gully Cricket Championship 2026',
                        team1: m.team1 || '',
                        team2: m.team2 || '',
                        ground: m.ground || m.tableNumber || 'Ground 1',
                        date: m.date || new Date().toISOString().split('T')[0],
                        time: m.time || '04:00 PM',
                        tossWinner: m.tossWinner || '',
                        battingFirst: m.battingFirst || '',
                        overs: m.overs || 6,
                        ballType: m.ballType || 'Tennis Ball',
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
