import React, { useState } from 'react';
import { Calendar, Plus, Search, Clock, MapPin, Trophy, Users, CheckCircle, Trash2, Edit } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const GullyCricketMatchScheduleTab = ({ matches = [], user, onUpdateMatches, globalSearch = '' }) => {
  const { addToast } = useToast();
  const [scheduleList, setScheduleList] = useState(() => {
    try {
      const saved = localStorage.getItem('sems_matches_gully_cricket');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'MATCH-GULLY-001',
        eventTitle: '6-Overs Fast Box Championship',
        team1: 'Gully Smashers',
        team2: 'Street Kings',
        date: '2026-09-05',
        time: '10:00 AM',
        venue: 'Central Ground B - Pitch 1',
        status: 'SCHEDULED',
        sportName: 'Gully Cricket',
        overs: 6
      }
    ];
  });

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    team1: '',
    team2: '',
    date: '2026-09-05',
    time: '10:00 AM',
    venue: 'Central Ground B - Pitch 1',
    overs: 6
  });

  const handleAddMatch = (e) => {
    e.preventDefault();
    if (!formData.team1 || !formData.team2) {
      addToast('Please enter both team names', 'error');
      return;
    }
    const newMatch = {
      id: `MATCH-GULLY-${Math.floor(100 + Math.random() * 900)}`,
      eventTitle: '6-Overs Fast Box Championship',
      ...formData,
      status: 'SCHEDULED',
      sportName: 'Gully Cricket'
    };
    const updated = [newMatch, ...scheduleList];
    setScheduleList(updated);
    try {
      localStorage.setItem('sems_matches_gully_cricket', JSON.stringify(updated));
    } catch (e) {}
    if (onUpdateMatches) onUpdateMatches(updated);
    addToast('Gully Cricket match scheduled successfully!', 'success');
    setShowModal(false);
    setFormData({ team1: '', team2: '', date: '2026-09-05', time: '10:00 AM', venue: 'Central Ground B - Pitch 1', overs: 6 });
  };

  const handleDeleteMatch = (id) => {
    if (window.confirm('Are you sure you want to delete this scheduled match?')) {
      const updated = scheduleList.filter(m => m.id !== id);
      setScheduleList(updated);
      try {
        localStorage.setItem('sems_matches_gully_cricket', JSON.stringify(updated));
      } catch (e) {}
      if (onUpdateMatches) onUpdateMatches(updated);
      addToast('Match deleted', 'info');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600">Gully Cricket Scheduler</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Match Fixtures & Ground Allocation</h2>
          <p className="text-xs text-slate-500 mt-1">Schedule tennis ball matches, allocate pitches, and assign overs.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Match</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scheduleList.map((match) => (
          <div key={match.id} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {match.status} • {match.overs || 6} Overs
              </span>
              <span className="text-xs font-mono text-slate-400">{match.date} • {match.time}</span>
            </div>

            <div className="flex items-center justify-between py-2 text-center">
              <div className="flex-1">
                <h4 className="font-black text-slate-900 dark:text-white text-sm">{match.team1}</h4>
                <span className="text-[10px] text-slate-400 font-mono">Team 1</span>
              </div>
              <div className="px-3 font-black text-emerald-600 text-sm">VS</div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 dark:text-white text-sm">{match.team2}</h4>
                <span className="text-[10px] text-slate-400 font-mono">Team 2</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800 text-slate-500">
              <span className="flex items-center gap-1 font-bold text-emerald-600"><MapPin className="w-3.5 h-3.5" /> {match.venue}</span>
              <button
                onClick={() => handleDeleteMatch(match.id)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                title="Delete Fixture"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black">Schedule Gully Cricket Match</h3>
            <form onSubmit={handleAddMatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Team 1 Name *</label>
                <input
                  type="text"
                  required
                  value={formData.team1}
                  onChange={(e) => setFormData(prev => ({ ...prev, team1: e.target.value }))}
                  placeholder="e.g. Gully Smashers"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Team 2 Name *</label>
                <input
                  type="text"
                  required
                  value={formData.team2}
                  onChange={(e) => setFormData(prev => ({ ...prev, team2: e.target.value }))}
                  placeholder="e.g. Street Kings"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Time</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Venue / Pitch</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer">Schedule Match</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
