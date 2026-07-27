import React, { useState, useEffect } from 'react';
import { Search, X, Trophy, Calendar, User, Newspaper, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SPORTS_DATA } from '../../data/sportsData';
import { COORDINATORS_DATA } from '../../data/coordinatorsData';
import { ANNOUNCEMENTS_DATA } from '../../data/announcementsData';

export const QuickSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open triggered from parent or direct listener
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSports = SPORTS_DATA.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCoordinators = COORDINATORS_DATA.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.role.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAnnouncements = ANNOUNCEMENTS_DATA.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search sports, schedules, coordinators..."
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-6">
          {/* Quick Page Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Quick Navigation
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleSelect('/sports')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-cyan-500/10 hover:text-cyan-500 text-xs font-medium transition"
              >
                <Trophy className="w-4 h-4 text-cyan-500" /> Sports Hub
              </button>
              <button
                onClick={() => handleSelect('/live')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-rose-500/10 hover:text-rose-500 text-xs font-medium transition"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Live Matches
              </button>
              <button
                onClick={() => handleSelect('/schedule')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-emerald-500/10 hover:text-emerald-500 text-xs font-medium transition"
              >
                <Calendar className="w-4 h-4 text-emerald-500" /> Schedule
              </button>
              <button
                onClick={() => handleSelect('/leaderboard')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-amber-500/10 hover:text-amber-500 text-xs font-medium transition"
              >
                👑 Standings
              </button>
            </div>
          </div>

          {/* Sports Results */}
          {filteredSports.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Sports ({filteredSports.length})
              </h4>
              <div className="space-y-1">
                {filteredSports.slice(0, 4).map((sport) => (
                  <div
                    key={sport.id}
                    onClick={() => handleSelect('/sports')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <img src={sport.image} alt={sport.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{sport.name}</div>
                        <div className="text-xs text-slate-500">{sport.category} • Fee: ₹{sport.entryFee}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coordinators */}
          {filteredCoordinators.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Coordinators ({filteredCoordinators.length})
              </h4>
              <div className="space-y-1">
                {filteredCoordinators.slice(0, 3).map((coord) => (
                  <div
                    key={coord.id}
                    onClick={() => handleSelect('/coordinators')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-cyan-500" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{coord.name}</div>
                        <div className="text-xs text-slate-500">{coord.role}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcements */}
          {filteredAnnouncements.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Announcements ({filteredAnnouncements.length})
              </h4>
              <div className="space-y-1">
                {filteredAnnouncements.slice(0, 3).map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => handleSelect('/announcements')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <Newspaper className="w-5 h-5 text-emerald-500" />
                      <div className="truncate max-w-md">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{ann.title}</div>
                        <div className="text-xs text-slate-500">{ann.date} • {ann.category}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">ESC</kbd> to close</span>
          <span>APEX Command Palette</span>
        </div>
      </div>
    </div>
  );
};
