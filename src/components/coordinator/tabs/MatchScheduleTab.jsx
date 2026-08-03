import React, { useState, useEffect } from 'react';

import { Plus, Users, Trash2, Edit2, Clock, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const MatchScheduleTab = ({ matches, user, onUpdateMatches }) => {
  const { addToast } = useToast();

  const assignedSport = (user?.assignedSport || 'badminton').toLowerCase();
  const venueLabel = ['table-tennis'].includes(assignedSport)
    ? 'Table'
    : ['cricket', 'football'].includes(assignedSport)
    ? 'Ground'
    : 'Court';

  // Active scheduled matches (completed matches are removed from active schedule view)
  const scheduledMatches = (matches || []).filter((m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED');


  const [createdEvents, setCreatedEvents] = useState([]);

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

  const sportName = user?.sportName || 'Badminton';

  const [form, setForm] = useState({
    format: 'Singles',
    category: 'Male',
    eventTitle: `${sportName} Championship 2026`,
    team1: '',
    team2: '',
    team1Name: '',
    team1Player1: '',
    team1Player2: '',
    team2Name: '',
    team2Player1: '',
    team2Player2: '',
    tableNumber: `${venueLabel} 1`,
    time: '05:34 PM',
  });

  const [editingId, setEditingId] = useState(null);

  const handleGenerateSingles = async () => {
    try {
      const generated = await coordinatorApi.generateFixtures('Singles');
      if (generated) {
        onUpdateMatches(generated);
        addToast(`Generated 1v1 Singles fixtures on ${venueLabel}s!`, 'success');
      } else {
        addToast('No registered participants found for this sport. Please add registrations first or create match slots manually.', 'warning');
      }
    } catch (err) {
      addToast('Error generating fixtures', 'error');
    }
  };

  const handleGenerateDoubles = async () => {
    try {
      const generated = await coordinatorApi.generateFixtures('Doubles');
      if (generated) {
        onUpdateMatches(generated);
        addToast(`Generated 2v2 Doubles fixtures on ${venueLabel}s!`, 'success');
      } else {
        addToast('No registered participants found for this sport. Please add registrations first or create match slots manually.', 'warning');
      }
    } catch (err) {
      addToast('Error generating fixtures', 'error');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all scheduled matches from the database?')) {
      await coordinatorApi.clearAllSchedules();
      onUpdateMatches([]);
      addToast('All match schedules cleared from database', 'warning');
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();

    let finalTeam1 = '';
    let finalTeam2 = '';

    if (form.format === 'Doubles') {
      if (!form.team1Name.trim() || !form.team1Player1.trim() || !form.team1Player2.trim()) {
        addToast('Please enter Team 1 Name, Player 1 Name, and Player 2 Name for Side A Doubles', 'error');
        return;
      }
      if (!form.team2Name.trim() || !form.team2Player1.trim() || !form.team2Player2.trim()) {
        addToast('Please enter Team 2 Name, Player 1 Name, and Player 2 Name for Side B Doubles', 'error');
        return;
      }
      finalTeam1 = `${form.team1Name.trim()} (${form.team1Player1.trim()} & ${form.team1Player2.trim()})`;
      finalTeam2 = `${form.team2Name.trim()} (${form.team2Player1.trim()} & ${form.team2Player2.trim()})`;
    } else {
      if (!form.team1.trim() || !form.team2.trim()) {
        addToast('Please enter both team/player names', 'error');
        return;
      }
      finalTeam1 = form.team1.trim();
      finalTeam2 = form.team2.trim();
    }

    if (editingId) {
      const matchData = {
        ...form,
        team1: finalTeam1,
        team2: finalTeam2,
        matchTitle: `${finalTeam1} vs ${finalTeam2}`
      };
      await coordinatorApi.updateMatch(editingId, matchData);
      const updated = matches.map((m) => (m.id === editingId ? { ...m, ...matchData } : m));
      onUpdateMatches(updated);
      addToast('Match schedule updated in database', 'success');
      setEditingId(null);
    } else {
      const newMatch = {
        id: `M${Math.floor(100000 + Math.random() * 900000)}`,
        format: form.format.toUpperCase(),
        category: form.category || 'Male',
        eventTitle: form.eventTitle || `${sportName} Championship 2026`,
        status: 'SCHEDULED',
        team1: finalTeam1,
        team2: finalTeam2,
        matchTitle: `${finalTeam1} vs ${finalTeam2}`,
        tableNumber: form.tableNumber,
        time: form.time || '05:40 PM',
      };
      await coordinatorApi.createMatch(newMatch);
      onUpdateMatches([newMatch, ...matches]);
      addToast(`Match fixture saved for ${form.tableNumber}`, 'success');
    }

    setForm({
      format: 'Singles',
      category: 'Male',
      eventTitle: createdEvents[0]?.title || `${sportName} Championship 2026`,
      team1: '',
      team2: '',
      team1Name: '',
      team1Player1: '',
      team1Player2: '',
      team2Name: '',
      team2Player1: '',
      team2Player2: '',
      tableNumber: `${venueLabel} 1`,
      time: '05:34 PM',
    });
  };


  const handleDeleteSlot = async (id) => {
    await coordinatorApi.deleteMatch(id);
    onUpdateMatches(matches.filter((m) => m.id !== id));
    addToast('Match fixture deleted from database', 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900 dark:text-slate-200 animate-fade-in">
      
      {/* Left Column: Generator Actions & Form */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Generator Quick Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleGenerateSingles}
            className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#334155] border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-indigo-300 font-bold text-xs shadow-soft dark:shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <span>+ Generate Singles (1v1)</span>
          </button>

          <button
            onClick={handleGenerateDoubles}
            className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#334155] border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-indigo-300 font-bold text-xs shadow-soft dark:shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <span>👥 Generate Doubles (2v2)</span>
          </button>

          <button
            onClick={handleClearAll}
            className="w-full py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-600/20 hover:bg-rose-100 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white border border-rose-200 dark:border-rose-500/30 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Schedules</span>
          </button>
        </div>


        {/* Form Box: Add Match Slot Manually */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-2xl space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Add Match Slot Manually</h3>

          <form onSubmit={handleAddSlot} className="space-y-3.5">
            {/* Event Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Event Name</label>
              {createdEvents.length > 0 ? (
                <select
                  value={form.eventTitle}
                  onChange={(e) => setForm({ ...form, eventTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
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
                  placeholder={`e.g. ${sportName} Championship 2026`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
              )}
            </div>

            {/* Format & Gender Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Format</label>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Singles">1v1 Singles</option>
                  <option value="Doubles">2v2 Doubles</option>
                  <option value="Team">Team Match</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Open">Open</option>
                </select>
              </div>
            </div>

            {/* Conditional Player / Team Name Inputs */}
            {form.format === 'Doubles' ? (
              <div className="space-y-4 pt-1">
                {/* Side A / Team 1 Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-wider block">
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
                      placeholder="e.g. MPEC Strikers"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
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
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
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
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Side B / Team 2 Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
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
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
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
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
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
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {form.format === 'Team' ? 'Team 1 Name' : 'Player 1 Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.team1}
                    onChange={(e) => setForm({ ...form, team1: e.target.value })}
                    placeholder={form.format === 'Team' ? 'e.g. MPEC College Team' : 'e.g. Aman Sharma'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {form.format === 'Team' ? 'Team 2 Name' : 'Player 2 Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.team2}
                    onChange={(e) => setForm({ ...form, team2: e.target.value })}
                    placeholder={form.format === 'Team' ? 'e.g. MIPS College Team' : 'e.g. Vikas Gupta'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </>
            )}


            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{venueLabel} No.</label>
                <select
                  value={form.tableNumber}
                  onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value={`${venueLabel} 1`}>{venueLabel} 1</option>
                  <option value={`${venueLabel} 2`}>{venueLabel} 2</option>
                  <option value={`${venueLabel} 3`}>{venueLabel} 3</option>
                  <option value={`${venueLabel} 4`}>{venueLabel} 4</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Time</label>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="05:34 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <button

              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
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
          <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-soft dark:shadow-md">
            No upcoming scheduled matches. All completed matches have been moved to Results.
          </div>
        ) : (
          scheduledMatches.map((m) => {
            const rawVenue = m.tableNumber || `${venueLabel} 1`;
            const displayVenue = rawVenue.replace(/Table/gi, venueLabel);

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-blue-500/50 dark:hover:border-slate-700"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">#{m.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-indigo-300 border border-blue-500/20">
                      {m.format || 'SINGLES'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                      {m.category || 'Male'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      SCHEDULED
                    </span>
                    {m.eventTitle && (
                      <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                        {m.eventTitle}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {m.team1 || m.matchTitle?.split(' vs ')[0]} <span className="text-slate-400 font-normal">vs</span> {m.team2 || m.matchTitle?.split(' vs ')[1]}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <span>📍 {displayVenue}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {m.time || '5:34 PM'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setEditingId(m.id);
                      setForm({
                        format: m.format === 'DOUBLES' ? 'Doubles' : 'Singles',
                        category: m.category || 'Male',
                        eventTitle: m.eventTitle || createdEvents[0]?.title || `${sportName} Championship 2026`,
                        team1: m.team1 || '',
                        team2: m.team2 || '',
                        tableNumber: displayVenue,
                        time: m.time || '05:34 PM',
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" /> Edit Schedule
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

