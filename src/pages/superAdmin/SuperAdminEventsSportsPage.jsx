import React, { useState, useEffect } from 'react';
import { superAdminApi } from '../../services/superAdminApi';
import { Trophy, Calendar, PlusCircle, CheckCircle, Tag, Users, X } from 'lucide-react';

export const SuperAdminEventsSportsPage = () => {
  const [sports, setSports] = useState([]);
  const [events, setEvents] = useState([]);

  // Modals state
  const [isAddSportModalOpen, setIsAddSportModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // Forms
  const [sportForm, setSportForm] = useState({
    name: '',
    icon: '🏆',
    isTeamSport: true,
    maxTeamSize: 5,
    category: 'Outdoor'
  });

  const [eventForm, setEventForm] = useState({
    name: 'SEMS Annual Sports Championship 2027',
    year: 2027,
    startDate: '2027-08-01',
    endDate: '2027-08-15'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSports(superAdminApi.getSports());
    setEvents(superAdminApi.getEvents());
  };

  const handleAddSport = (e) => {
    e.preventDefault();
    superAdminApi.addSport(sportForm);
    setIsAddSportModalOpen(false);
    setSportForm({ name: '', icon: '🏆', isTeamSport: true, maxTeamSize: 5, category: 'Outdoor' });
    loadData();
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    superAdminApi.addEvent(eventForm);
    setIsAddEventModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Master Sports & Events Control</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Configure active sports games, set team size limits, and publish annual college tournament events
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddSportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Add Sport</span>
          </button>
          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Tournament Event</span>
          </button>
        </div>
      </div>

      {/* Events List Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <span>Annual Tournament Events</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((evt) => (
            <div key={evt.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{evt.name}</h3>
                  <span className="text-xs text-slate-400">Year: {evt.year}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                  evt.status === 'LIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {evt.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Start: {evt.startDate}</span>
                <span>End: {evt.endDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sports Grid Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Active College Sports ({sports.length})</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sports.map((sport) => (
            <div key={sport.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all flex items-center gap-3">
              <span className="text-2xl">{sport.icon}</span>
              <div>
                <h4 className="font-bold text-white text-sm">{sport.name}</h4>
                <p className="text-[11px] text-slate-400">
                  {sport.isTeamSport ? `Team (${sport.maxTeamSize} Max)` : 'Individual / Singles'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Sport */}
      {isAddSportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <span>Add New Sport Game</span>
              </h3>
              <button onClick={() => setIsAddSportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Sport Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lawn Tennis"
                  value={sportForm.name}
                  onChange={(e) => setSportForm({ ...sportForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Icon Emoji</label>
                  <input
                    type="text"
                    required
                    value={sportForm.icon}
                    onChange={(e) => setSportForm({ ...sportForm, icon: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Team Size</label>
                  <input
                    type="number"
                    required
                    value={sportForm.maxTeamSize}
                    onChange={(e) => setSportForm({ ...sportForm, maxTeamSize: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Sport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Event */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>Create Annual Tournament Event</span>
              </h3>
              <button onClick={() => setIsAddEventModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
