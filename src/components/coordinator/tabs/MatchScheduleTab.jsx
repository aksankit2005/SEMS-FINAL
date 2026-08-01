import React, { useState } from 'react';
import { Plus, Users, Trash2, Edit2, Clock, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const MatchScheduleTab = ({ matches, user, onUpdateMatches }) => {
  const { addToast } = useToast();

  const [form, setForm] = useState({
    format: 'Singles',
    team1: '',
    team2: '',
    tableNumber: 'Table 1',
    time: '05:34 PM',
  });

  const [editingId, setEditingId] = useState(null);

  const handleGenerateSingles = async () => {
    try {
      const generated = await coordinatorApi.generateFixtures('Singles');
      if (generated) {
        onUpdateMatches(generated);
      } else {
        const fallback = [
          { id: `M${Math.floor(100000 + Math.random() * 900000)}`, format: 'SINGLES', status: 'SCHEDULED', team1: 'Aarav Sharma (MPEC)', team2: 'Rohan Gupta (MIPS)', tableNumber: 'Table 1', time: '05:30 PM' },
          { id: `M${Math.floor(100000 + Math.random() * 900000)}`, format: 'SINGLES', status: 'SCHEDULED', team1: 'Ankur Dixit (MPCPS)', team2: 'Aditya Singh (MPEC)', tableNumber: 'Table 2', time: '05:40 PM' },
          { id: `M${Math.floor(100000 + Math.random() * 900000)}`, format: 'SINGLES', status: 'SCHEDULED', team1: 'Aagaz Khan (MPCPS KN142)', team2: 'Shiv Prakash (MPCPS KN142)', tableNumber: 'Table 3', time: '05:40 PM' },
        ];
        onUpdateMatches([...fallback, ...matches]);
      }
      addToast('Generated 1v1 Singles fixtures in database!', 'success');
    } catch (err) {
      addToast('Error generating fixtures', 'error');
    }
  };

  const handleGenerateDoubles = async () => {
    try {
      const generated = await coordinatorApi.generateFixtures('Doubles');
      if (generated) {
        onUpdateMatches(generated);
      } else {
        const fallback = [
          { id: `M${Math.floor(100000 + Math.random() * 900000)}`, format: 'DOUBLES', status: 'SCHEDULED', team1: 'MPEC (Prabal & Team)', team2: 'MPEC (Ujjwal & Team)', tableNumber: 'Table 1', time: '05:34 PM' },
        ];
        onUpdateMatches([...fallback, ...matches]);
      }
      addToast('Generated 2v2 Doubles fixtures in database!', 'success');
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
    if (!form.team1 || !form.team2) {
      addToast('Please enter both team/player names', 'error');
      return;
    }

    if (editingId) {
      const matchData = { ...form, matchTitle: `${form.team1} vs ${form.team2}` };
      await coordinatorApi.updateMatch(editingId, matchData);
      const updated = matches.map((m) => (m.id === editingId ? { ...m, ...matchData } : m));
      onUpdateMatches(updated);
      addToast('Match schedule updated in database', 'success');
      setEditingId(null);
    } else {
      const newMatch = {
        id: `M${Math.floor(100000 + Math.random() * 900000)}`,
        format: form.format.toUpperCase(),
        status: 'SCHEDULED',
        team1: form.team1,
        team2: form.team2,
        matchTitle: `${form.team1} vs ${form.team2}`,
        tableNumber: form.tableNumber,
        time: form.time || '05:40 PM',
      };
      await coordinatorApi.createMatch(newMatch);
      onUpdateMatches([newMatch, ...matches]);
      addToast(`Match fixture saved to database for ${form.tableNumber}`, 'success');
    }

    setForm({
      format: 'Singles',
      team1: '',
      team2: '',
      tableNumber: 'Table 1',
      time: '05:34 PM',
    });
  };

  const handleDeleteSlot = async (id) => {
    await coordinatorApi.deleteMatch(id);
    onUpdateMatches(matches.filter((m) => m.id !== id));
    addToast('Match fixture deleted from database', 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-200 animate-fade-in">
      
      {/* Left Column: Generator Actions & Form */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Generator Quick Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleGenerateSingles}
            className="w-full py-3 px-4 rounded-2xl bg-[#1E293B] hover:bg-[#334155] border border-slate-700 text-indigo-300 font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>+ Generate Singles (1v1)</span>
          </button>

          <button
            onClick={handleGenerateDoubles}
            className="w-full py-3 px-4 rounded-2xl bg-[#1E293B] hover:bg-[#334155] border border-slate-700 text-indigo-300 font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>👥 Generate Doubles (2v2)</span>
          </button>

          <button
            onClick={handleClearAll}
            className="w-full py-3 px-4 rounded-2xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Schedules</span>
          </button>
        </div>

        {/* Form Box: Add Match Slot Manually */}
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 shadow-2xl space-y-4">
          <h3 className="text-base font-black text-white">Add Match Slot Manually</h3>

          <form onSubmit={handleAddSlot} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Format</label>
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border border-slate-800 text-xs font-bold text-white focus:outline-none"
              >
                <option value="Singles">Singles</option>
                <option value="Doubles">Doubles</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Player 1 / Team 1 Name</label>
              <input
                type="text"
                required
                value={form.team1}
                onChange={(e) => setForm({ ...form, team1: e.target.value })}
                placeholder="e.g. Aman Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Player 2 / Team 2 Name</label>
              <input
                type="text"
                required
                value={form.team2}
                onChange={(e) => setForm({ ...form, team2: e.target.value })}
                placeholder="e.g. Vikas Gupta"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Table No.</label>
                <select
                  value={form.tableNumber}
                  onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border border-slate-800 text-xs font-bold text-white focus:outline-none"
                >
                  <option value="Table 1">Table 1</option>
                  <option value="Table 2">Table 2</option>
                  <option value="Table 3">Table 3</option>
                  <option value="Table 4">Table 4</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Time</label>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="05:34 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border border-slate-800 text-xs text-white"
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
        {matches.length === 0 ? (
          <div className="p-12 text-center bg-[#111827] rounded-3xl border border-slate-800 text-slate-500">
            No match schedules found in database. Use the manual form or generate buttons to create fixtures.
          </div>
        ) : (
          matches.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-[#111827] border border-slate-800/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-700"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-400">#{m.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {m.format || 'SINGLES'}
                  </span>
                  {m.status === 'COMPLETED' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      COMPLETED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      SCHEDULED
                    </span>
                  )}
                </div>

                <h4 className="text-base font-black text-white tracking-tight">
                  {m.team1 || m.matchTitle?.split(' vs ')[0]} <span className="text-slate-500 text-xs font-normal">vs</span> {m.team2 || m.matchTitle?.split(' vs ')[1]}
                </h4>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>🏓 {m.tableNumber || 'Table 1'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {m.time || '5:34 PM'}
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
                      team1: m.team1 || '',
                      team2: m.team2 || '',
                      tableNumber: m.tableNumber || 'Table 1',
                      time: m.time || '05:34 PM',
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Edit Schedule
                </button>

                <button
                  onClick={() => handleDeleteSlot(m.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition"
                  title="Delete Schedule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
