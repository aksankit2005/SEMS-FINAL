import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Search, Trophy, Grid, List, X } from 'lucide-react';
import { SCHEDULE_DATA } from '../data/scheduleData';

export const SchedulePage = () => {
  const [query, setQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [viewMode, setViewMode] = useState('list');
  const [activeVenueModal, setActiveVenueModal] = useState(null);

  const sportsList = ['All', 'Cricket', 'Football', 'Badminton', 'Table Tennis', 'Chess', 'Basketball', 'Kabaddi', 'Athletics', 'Tug of War'];

  const filteredFixtures = SCHEDULE_DATA.filter((item) => {
    const matchesQuery = item.event.toLowerCase().includes(query.toLowerCase()) ||
      item.team1.toLowerCase().includes(query.toLowerCase()) ||
      item.team2.toLowerCase().includes(query.toLowerCase());
    const matchesSport = selectedSport === 'All' || item.sport === selectedSport;
    return matchesQuery && matchesSport;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            <CalendarIcon className="w-4 h-4" /> Tournament Schedule & Venues
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Championship <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Fixtures</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Never miss a match. Filter by sport discipline, match date, court venue, or team roster.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {sportsList.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSport(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedSport === s
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams or events..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl text-xs transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl text-xs transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Fixtures List View */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredFixtures.map((fix) => (
              <div
                key={fix.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-soft hover:border-emerald-500/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm text-center shrink-0">
                    <Trophy className="w-5 h-5 mx-auto" />
                    <span className="text-[10px] block uppercase mt-0.5">{fix.sport}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {fix.gender}
                      </span>
                      <h3 className="font-black text-base text-slate-900 dark:text-white">{fix.event}</h3>
                    </div>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {fix.team1} <span className="text-slate-400 font-normal">vs</span> {fix.team2}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold">{fix.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>{fix.time}</span>
                  </div>
                  <button
                    onClick={() => setActiveVenueModal(fix)}
                    className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{fix.venue}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFixtures.map((fix) => (
              <div key={fix.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">{fix.sport}</span>
                  <span className="text-slate-400">{fix.time}</span>
                </div>
                <h3 className="font-bold text-base">{fix.event}</h3>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center font-black text-sm text-blue-600 dark:text-blue-400">
                  {fix.team1} vs {fix.team2}
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>{fix.date}</span>
                  <span>{fix.venue}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Venue Modal */}
      {activeVenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg">Venue Directions</h3>
              <button onClick={() => setActiveVenueModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Venue: <strong>{activeVenueModal.venue}</strong>
            </p>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400">
              📍 Gate Access: Main Sports Complex Entrance 2. Shuttle available from Campus Gate A.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
