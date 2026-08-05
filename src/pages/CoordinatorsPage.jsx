import React, { useState } from 'react';
import { Users, Search, Mail, Phone, MapPin, Award, Shield, CheckCircle } from 'lucide-react';
import { COORDINATORS_DATA } from '../data/coordinatorsData';

export const CoordinatorsPage = () => {
  const [query, setQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');

  const sportsList = ['All', ...Array.from(new Set(COORDINATORS_DATA.map((c) => c.sport)))];

  const filteredCoordinators = COORDINATORS_DATA.filter((coord) => {
    const matchesQuery =
      coord.name.toLowerCase().includes(query.toLowerCase()) ||
      coord.sport.toLowerCase().includes(query.toLowerCase()) ||
      coord.college.toLowerCase().includes(query.toLowerCase());
    const matchesSport = selectedSport === 'All' || coord.sport === selectedSport;
    return matchesQuery && matchesSport;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
            <Shield className="w-4 h-4 text-orange-500" /> APEX Tournament Officials
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Sports <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-500 bg-clip-text text-transparent">Coordinators</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Meet the official tournament directors, referee leads, and faculty coordinators managing APEX 2026.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          {/* Sports Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {sportsList.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedSport === sport
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search coordinator, sport or college..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Coordinators Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCoordinators.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Coordinators Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try clearing your search query or selecting another sport.</p>
            </div>
          ) : (
            filteredCoordinators.map((coord) => (
              <div
                key={coord.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-2xl transition flex flex-col justify-between space-y-5 group"
              >
                {/* Header Profile Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={coord.avatar}
                      alt={coord.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/30 group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {coord.name}
                        </h3>
                        <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-block mt-1">
                        {coord.role}
                      </span>
                    </div>
                  </div>

                  {/* Sport Badge & Bio */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-orange-500 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> {coord.sport}
                      </span>
                      <span className="text-slate-400 text-[11px]">{coord.college}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {coord.bio}
                    </p>
                  </div>
                </div>

                {/* Venue & Contact Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{coord.venue}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`mailto:${coord.email}`}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center justify-center gap-1.5 truncate"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">Email</span>
                    </a>
                    <a
                      href={`tel:${coord.phone}`}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center justify-center gap-1.5 truncate"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="truncate">Call</span>
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
