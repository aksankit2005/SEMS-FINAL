import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, CheckCircle2, Loader2 } from 'lucide-react';
import { ALL_12_SPORTS, ALL_COLLEGES } from '../../services/superCoordinatorApi';

export const ResultEditModal = ({ isOpen, result = null, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    sportId: 'cricket',
    sportName: 'Cricket',
    eventTitle: '',
    matchFormat: 'Team',
    gender: 'Boys',
    winnerName: '',
    winnerCollege: 'MPEC',
    runnerUpName: '',
    runnerUpCollege: 'MIPS',
    score: '',
    status: 'COMPLETED'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (result) {
      setFormData({
        id: result.id,
        sportId: result.sportId || 'cricket',
        sportName: result.sportName || 'Cricket',
        eventTitle: result.eventTitle || '',
        matchFormat: result.matchFormat || 'Team',
        gender: result.gender || 'Boys',
        winnerName: result.winnerName || result.winnerTeamName || '',
        winnerCollege: result.winnerCollege || 'MPEC',
        runnerUpName: result.runnerUpName || result.runnerUpTeamName || '',
        runnerUpCollege: result.runnerUpCollege || 'MIPS',
        score: result.score || '',
        status: result.status || 'COMPLETED'
      });
    } else {
      setFormData({
        sportId: 'cricket',
        sportName: 'Cricket',
        eventTitle: 'Fest Championship Tournament',
        matchFormat: 'Team',
        gender: 'Boys',
        winnerName: '',
        winnerCollege: 'MPEC',
        runnerUpName: '',
        runnerUpCollege: 'MIPS',
        score: '',
        status: 'COMPLETED'
      });
    }
    setError('');
  }, [result, isOpen]);

  if (!isOpen) return null;

  const handleSportChange = (sId) => {
    const sObj = ALL_12_SPORTS.find(s => s.id === sId) || ALL_12_SPORTS[0];
    setFormData({
      ...formData,
      sportId: sId,
      sportName: sObj.name
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.winnerName.trim()) {
      setError('🥇 First Position (Winner) is required!');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save result update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {result ? 'Edit Match Result & Leaderboard' : 'Declare New Result'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update official First (🥇) & Second (🥈) positions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Sport / Game</label>
              <select
                value={formData.sportId}
                onChange={(e) => handleSportChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                {ALL_12_SPORTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Event / Tournament Title</label>
              <input
                type="text"
                value={formData.eventTitle}
                onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                placeholder="e.g. Mens Cricket Championship Finals"
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Format</label>
              <select
                value={formData.matchFormat}
                onChange={(e) => setFormData({ ...formData, matchFormat: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Team">Team Game</option>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Individual">Individual</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Gender Category</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>

          {/* Winner (🥇 1st Position) */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <label className="text-xs font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span>🥇</span>
              <span>FIRST POSITION (WINNER) *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.winnerName}
                onChange={(e) => setFormData({ ...formData, winnerName: e.target.value })}
                placeholder="Winner Player or Team Name"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <select
                value={formData.winnerCollege}
                onChange={(e) => setFormData({ ...formData, winnerCollege: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                {ALL_COLLEGES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Runner-Up (🥈 2nd Position) */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>🥈</span>
              <span>SECOND POSITION (RUNNER-UP)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.runnerUpName}
                onChange={(e) => setFormData({ ...formData, runnerUpName: e.target.value })}
                placeholder="Runner-up Player or Team Name"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <select
                value={formData.runnerUpCollege}
                onChange={(e) => setFormData({ ...formData, runnerUpCollege: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                {ALL_COLLEGES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Score & Points */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Score / Final Result Details</label>
            <input
              type="text"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              placeholder="e.g. 21-18, 19-21, 21-16 or 164/5 (20.0)"
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save & Update Leaderboard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
