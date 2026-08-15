import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Search, Trophy, Grid, List, X, Sparkles } from 'lucide-react';
import { SCHEDULE_DATA } from '../data/scheduleData';
import { coordinatorApi } from '../services/coordinatorApi';
import { resolveSportConfig } from '../data/sportsConfig';

export const SchedulePage = () => {
  const [query, setQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [activeVenueModal, setActiveVenueModal] = useState(null);
  const [dynamicSchedules, setDynamicSchedules] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      const allSchedules = [];
      const completedMatchIds = new Set();
      const completedMatchTitles = new Set();

      // Scan localStorage for any completed match IDs and titles
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sems_completed_results_') || key.startsWith('sems_coord_matches_'))) {
          try {
            const list = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(list)) {
              list.forEach((m) => {
                if (m && (m.status === 'COMPLETED' || m.status === 'FINISHED')) {
                  if (m.id) completedMatchIds.add(m.id);
                  const t1 = typeof m.team1 === 'object' ? (m.team1?.name || '') : String(m.team1 || '').trim();
                  const t2 = typeof m.team2 === 'object' ? (m.team2?.name || '') : String(m.team2 || '').trim();
                  if (t1 && t2) {
                    completedMatchTitles.add(`${t1} vs ${t2}`.toLowerCase());
                  }
                }
              });
            }
          } catch (e) {}
        }
      }

      try {
        const publicMatches = await coordinatorApi.getPublicMatches();
        if (publicMatches && Array.isArray(publicMatches)) {
          publicMatches.forEach((m) => {
            if (m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && !completedMatchIds.has(m.id)) {
              const sportId = (m.sportId || m.sport || 'badminton').toLowerCase();
              const rawSportName = m.sportName || m.sport || (sportId.charAt(0).toUpperCase() + sportId.slice(1).replace('-', ' '));

              const t1 = typeof m.team1 === 'object' ? (m.team1?.name || '') : String(m.team1 || '').trim();
              const t2 = typeof m.team2 === 'object' ? (m.team2?.name || '') : String(m.team2 || '').trim();

              const eventTitle = m.eventTitle || m.matchTitle || m.title || m.subEvent || `${rawSportName} Championship 2026`;
              const finalTeam1 = t1 || m.subEvent || eventTitle;
              const finalTeam2 = t2 || (m.subEvent ? '' : 'TBD');

              if (t1 && t2) {
                const matchKey = `${t1} vs ${t2}`.toLowerCase();
                if (completedMatchTitles.has(matchKey)) return;
              }

              const rawVenue = m.tableNumber || m.venue || 'Arena 1';
              let displayVenue = rawVenue;
              const isChess = sportId.includes('chess') || rawSportName.toLowerCase().includes('chess');
              const isTT = sportId.includes('table-tennis') || rawSportName.toLowerCase().includes('table tennis');
              const isKabaddi = sportId.includes('kabaddi') || rawSportName.toLowerCase().includes('kabaddi');

              if (isChess || isTT) {
                if (/court/gi.test(rawVenue)) {
                  displayVenue = rawVenue.replace(/court/gi, 'Table');
                } else if (!/table/gi.test(rawVenue)) {
                  const num = rawVenue.replace(/\D/g, '') || '1';
                  displayVenue = `Table ${num}`;
                }
              } else if (sportId.includes('cricket') || sportId.includes('football')) {
                if (/table/gi.test(rawVenue)) {
                  displayVenue = rawVenue.replace(/table/gi, 'Ground');
                }
              } else if (isKabaddi) {
                if (/table/gi.test(rawVenue)) {
                  displayVenue = rawVenue.replace(/table/gi, 'Mat');
                }
              } else {
                if (/table/gi.test(rawVenue)) {
                  displayVenue = rawVenue.replace(/table/gi, 'Court');
                }
              }

              allSchedules.push({
                id: m.id || `M-${Math.random()}`,
                event: eventTitle,
                sport: rawSportName,
                sportId: sportId,
                gender: m.category || m.gender || 'Open',
                team1: finalTeam1,
                team2: finalTeam2,
                venue: displayVenue,
                date: m.date || new Date().toISOString().split('T')[0],
                time: m.time || '10:00 AM',
                format: m.format || 'STANDARD',
                mapUrl: 'https://maps.google.com'
              });
            }
          });
        }
      } catch (e) {}

      setDynamicSchedules(allSchedules);
    };

    fetchSchedules();

    const handleRefresh = () => fetchSchedules();
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('sems_matches_updated', handleRefresh);
    window.addEventListener('sems_results_updated', handleRefresh);

    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('sems_matches_updated', handleRefresh);
      window.removeEventListener('sems_results_updated', handleRefresh);
    };
  }, []);

  const sportsList = [
    'All',
    'Table Tennis',
    'Badminton',
    'Football',
    'Cricket',
    'Basketball',
    'Kabaddi',
    'Chess',
    'Athletics',
    'Volleyball',
    'Kho-Kho',
    'Tug of War',
    'Gully Cricket'
  ];

  const combinedList = [...dynamicSchedules, ...SCHEDULE_DATA];

  const filteredFixtures = combinedList.filter((item) => {
    const matchesQuery =
      (item.event || '').toLowerCase().includes(query.toLowerCase()) ||
      (item.team1 || '').toLowerCase().includes(query.toLowerCase()) ||
      (item.team2 || '').toLowerCase().includes(query.toLowerCase()) ||
      (item.sport || '').toLowerCase().includes(query.toLowerCase()) ||
      (item.venue || '').toLowerCase().includes(query.toLowerCase());
    
    const sportKey = (item.sport || item.sportId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const selectedKey = selectedSport.toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchesSport = selectedSport === 'All' || 
      sportKey === selectedKey || 
      (sportKey.length > 2 && selectedKey.includes(sportKey)) || 
      (selectedKey.length > 2 && sportKey.includes(selectedKey));
    
    return matchesQuery && matchesSport;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-500/20 shadow-xs">
            <CalendarIcon className="w-4 h-4 text-emerald-500" /> Tournament Schedule & Venues
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Championship <span className="bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent">Fixtures</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            Never miss a match. Filter by any of the 12 sports disciplines, dates, or match venues.
          </p>
        </div>

        {/* Filters Bar with 12 Games Chips */}
        <div className="space-y-4 mb-8 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-emerald-500" /> Filter Discipline ({sportsList.length - 1} Games)
            </span>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl text-xs font-bold transition ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl text-xs font-bold transition ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 12 Games Horizontal Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {sportsList.map((s) => {
              const cfg = s === 'All' ? null : resolveSportConfig(s);
              const icon = s === 'All' ? '⚡' : cfg?.icon || '🏆';
              const isSelected = selectedSport === s;

              return (
                <button
                  key={s}
                  onClick={() => setSelectedSport(s)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20 font-black scale-105'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{s}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full pt-1">
            <Search className="w-4 h-4 absolute left-3.5 top-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams, players, venue, or match title..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Fixtures View / Empty State */}
        {filteredFixtures.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8 space-y-3">
            <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Fixtures Scheduled</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              There are no scheduled fixtures matching "{selectedSport}" discipline or search query.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View: Box with Sport Icon, Sport Name, Date, Time, Venue */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFixtures.map((fix) => {
              const sportCfg = resolveSportConfig(fix.sport || fix);
              const sportIcon = sportCfg.icon || '🏆';
              const isAthletics = (fix.sport || '').toLowerCase().includes('athletic');

              return (
                <div
                  key={fix.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between space-y-4 group"
                >
                  {/* Card Top: Sport Icon, Sport Name & Gender Badge */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 dark:from-emerald-600/30 dark:to-teal-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-black shadow-xs shrink-0">
                        {sportIcon}
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                          {fix.sport}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">#{fix.id}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] border border-slate-200 dark:border-slate-700/60 uppercase">
                      {fix.gender || 'Open'}
                    </span>
                  </div>

                  {/* Event Title & Team Matchup Box (Hide team vs team for Athletics) */}
                  <div className="space-y-2 flex-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      {fix.event}
                    </h3>
                    {!isAthletics && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
                        <p className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 truncate">
                          {fix.team1} <span className="text-slate-400 font-normal">vs</span> {fix.team2}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Box Bottom Metadata: Date, Time & Venue */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-bold text-xs">{fix.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-bold font-mono text-xs">{fix.time}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveVenueModal(fix)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700/60 active:scale-98"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{fix.venue}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View: Row Box with Sport Icon, Sport Name, Date, Time, Venue */
          <div className="space-y-4">
            {filteredFixtures.map((fix) => {
              const sportCfg = resolveSportConfig(fix.sport || fix);
              const sportIcon = sportCfg.icon || '🏆';
              const isAthletics = (fix.sport || '').toLowerCase().includes('athletic');

              return (
                <div
                  key={fix.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 dark:from-emerald-600/30 dark:to-teal-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-black shrink-0">
                      {sportIcon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wide">
                          {fix.sport}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                          {fix.gender || 'Open'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate mt-0.5">
                        {fix.event}
                      </h3>
                      {!isAthletics && (
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate mt-0.5">
                          {fix.team1} <span className="text-slate-400 font-normal">vs</span> {fix.team2}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                      <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{fix.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-mono font-bold">{fix.time}</span>
                    </div>
                    <button
                      onClick={() => setActiveVenueModal(fix)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="max-w-[140px] truncate">{fix.venue}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Venue Modal */}
      {activeVenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <h3 className="font-black text-lg">Venue Access Directions</h3>
              </div>
              <button onClick={() => setActiveVenueModal(null)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Court / Venue</span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{activeVenueModal.venue}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
              <p className="font-bold">📍 Access Gate & Facilities:</p>
              <p>Main Sports Complex Entrance 2. Shuttle available from Campus Gate A. First Aid & Refreshment Tent adjacent to Court Entry.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
