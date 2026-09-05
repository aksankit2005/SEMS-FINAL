import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Grid, List, X, Filter, ChevronDown, Check } from 'lucide-react';
import { SCHEDULE_DATA } from '../data/scheduleData';
import { coordinatorApi } from '../services/coordinatorApi';
import { resolveSportConfig } from '../data/sportsConfig';
import { useTheme } from '../context/ThemeContext';
import '../styles/spatialGallery.css';

export const SchedulePage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedSport, setSelectedSport] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [activeVenueModal, setActiveVenueModal] = useState(null);
  const [dynamicSchedules, setDynamicSchedules] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeVenueModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveVenueModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVenueModal]);

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
          } catch (e) { }
        }
      }

      try {
        const dbSchedules = await coordinatorApi.getPublicSchedules();
        if (dbSchedules && Array.isArray(dbSchedules)) {
          dbSchedules.forEach((m) => {
            if (m && m.id && !completedMatchIds.has(m.id)) {
              allSchedules.push({
                id: m.id,
                event: m.event || m.matchTitle || `${m.sport} Match`,
                sport: m.sport || 'Sports Event',
                sportId: m.sportId || 'badminton',
                gender: m.gender || 'Open',
                team1: m.team1 || 'TBD',
                team2: m.team2 || 'TBD',
                venue: m.venue || m.tableNumber || 'Arena 1',
                date: m.date || new Date().toISOString().split('T')[0],
                time: m.time || '10:00 AM',
                format: m.format || 'STANDARD',
                mapUrl: 'https://maps.google.com'
              });
            }
          });
        }
      } catch (e) {
        console.warn('Could not fetch DB schedules:', e);
      }

      try {
        const publicMatches = await coordinatorApi.getPublicMatches();
        if (publicMatches && Array.isArray(publicMatches)) {
          publicMatches.forEach((m) => {
            if (m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && !completedMatchIds.has(m.id)) {
              if (allSchedules.some((s) => s.id === m.id)) return;
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
      } catch (e) { }

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

  const combinedList = dynamicSchedules;

  // Filter logic (no search bar, only sport filter)
  const filteredFixtures = combinedList.filter((item) => {
    const sportKey = (item.sport || item.sportId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const selectedKey = selectedSport.toLowerCase().replace(/[^a-z0-9]/g, '');
    return selectedSport === 'All' ||
      sportKey === selectedKey ||
      (sportKey.length > 2 && selectedKey.includes(sportKey)) ||
      (selectedKey.length > 2 && sportKey.includes(selectedKey));
  });

  return (
    <div className={`relative min-h-screen font-spatial-sans selection:bg-blue-500/30 selection:text-white overflow-x-hidden transition-colors duration-500 ${isDark ? 'text-slate-100' : 'text-slate-900'
      }`}>

      {/* ─── ATMOSPHERIC NEBULA BACKDROP ─── */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-all duration-700 ${isDark ? 'spatial-nebula-dark' : 'spatial-nebula-light'
        }`} />

      {/* ─── TACTILE FILM GRAIN OVERLAY ─── */}
      <div className="fixed inset-0 spatial-grain-overlay z-[1] pointer-events-none opacity-25" />
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-8 sm:pb-12 space-y-4 sm:space-y-5">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-normal tracking-[0.06em] font-spatial-display uppercase ${isDark ? 'text-white' : 'text-slate-900'
            }`}>
            Championship{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent font-semibold ${isDark
                ? 'from-blue-400 via-indigo-300 to-orange-300'
                : 'from-blue-700 via-indigo-700 to-orange-600'
              }`}>
              Fixtures
            </span>
          </h1>
          <p className={`text-xs sm:text-sm max-w-xl mx-auto italic font-spatial-sans font-light leading-relaxed mt-2 ${isDark ? 'text-slate-300/85' : 'text-slate-600'
            }`}>
            Never miss a match. Filter by any of the 12 sports disciplines, dates, or match venues.
          </p>
        </div>

        {/* ─── SPORTS FILTER SECTION (ResultsPage style roll-down) ─── */}
        <div className="flex items-center justify-between gap-2.5 pt-1 pb-1 mb-6">
          {/* Left: Discipline label + count */}
          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline-block text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-blue-300/80' : 'text-blue-700'
              }`}>
              {selectedSport === 'All' ? 'All Disciplines' : selectedSport}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
              {filteredFixtures.length} {filteredFixtures.length === 1 ? 'Fixture' : 'Fixtures'}
            </span>
          </div>

          {/* Right: View Toggle + Roll-Down Filter Dropdown */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className={`flex items-center p-1 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
              }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl text-xs font-bold transition ${viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl text-xs font-bold transition ${viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Roll-Down Sport Filter Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${isDark
                    ? 'bg-[#10121a]/90 hover:bg-[#181a24] text-blue-200 border-blue-500/30 shadow-xs hover:border-blue-400/50'
                    : 'bg-white hover:bg-slate-50 text-blue-900 border-slate-300 shadow-xs'
                  }`}
                title="Filter by Sport"
                aria-label="Filter discipline roll-down dropdown"
              >
                <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                  {selectedSport === 'All' ? 'Filter Sport' : selectedSport}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-blue-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Roll-Down Menu Popover */}
              {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-52 sm:w-60 rounded-2xl p-1.5 z-50 shadow-2xl border backdrop-blur-2xl max-h-80 overflow-y-auto no-scrollbar transition-all ${isDark
                    ? 'bg-[#0d0f18]/95 border-blue-500/30 text-slate-200 shadow-[0_12px_35px_rgba(0,0,0,0.85)]'
                    : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl'
                  }`}>
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold text-blue-400 border-b border-blue-500/10 mb-1 flex items-center justify-between">
                    <span>Select Discipline</span>
                    <span className="text-slate-400 text-[9px]">{sportsList.length} Options</span>
                  </div>
                  {sportsList.map((s) => {
                    const cfg = s === 'All' ? null : resolveSportConfig(s);
                    const icon = s === 'All' ? '⚡' : cfg?.icon || '🏆';
                    const isSelected = selectedSport === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setSelectedSport(s);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${isSelected
                            ? isDark
                              ? 'bg-blue-500/20 text-blue-200 font-bold border border-blue-500/30'
                              : 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                            : isDark
                              ? 'hover:bg-white/5 text-slate-300'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-sm">{icon}</span>
                          <span className="truncate">{s}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixtures View / Empty State */}
        {filteredFixtures.length === 0 ? (
          <div className={`py-16 text-center bg-transparent border-0 shadow-none ${isDark
              ? 'text-slate-300'
              : 'text-slate-700'
            }`}>
            <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No Match Fixtures Found</h3>
            <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Try adjusting your discipline filter or clearing your search keywords.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View: Box with Sport Icon, Sport Name, Date, Time, Venue */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 sm:gap-6">
            {filteredFixtures.map((fix) => {
              const sportCfg = resolveSportConfig(fix.sport || fix);
              const sportIcon = sportCfg.icon || '🏆';
              const isAthletics = (fix.sport || '').toLowerCase().includes('athletic');

              return (
                <div
                  key={fix.id}
                  className={`rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between space-y-4 group backdrop-blur-xl ${isDark
                      ? 'spatial-glass-card-dark border-blue-500/20 hover:border-blue-400/50 hover:shadow-[0_20px_45px_rgba(0,0,0,0.8),0_0_25px_rgba(59,130,246,0.18)]'
                      : 'spatial-glass-card-light border-slate-200 hover:border-blue-300 hover:shadow-xl'
                    }`}
                >
                  {/* Card Top: Sport Icon, Sport Name & Gender Badge */}
                  <div className={`flex items-center justify-between gap-3 pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xs shrink-0 border transition-transform group-hover:scale-105 ${isDark
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                        {sportIcon}
                      </div>
                      <div>
                        <h4 className={`text-sm font-black uppercase tracking-wide ${isDark ? 'text-blue-300' : 'text-blue-700'
                          }`}>
                          {fix.sport}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">#{fix.id}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-extrabold text-[10px] border uppercase ${isDark
                        ? 'bg-white/5 border-white/10 text-slate-300'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                      {fix.gender || 'Open'}
                    </span>
                  </div>

                  {/* Event Title & Team Matchup Box (Hide team vs team for Athletics) */}
                  <div className="space-y-2 flex-1">
                    <h3 className={`font-extrabold text-sm sm:text-base leading-snug ${isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                      {fix.event}
                    </h3>
                    {!isAthletics && (
                      <div className={`p-3.5 rounded-2xl border text-center shadow-xs ${isDark
                          ? 'bg-white/[0.04] border-white/10'
                          : 'bg-slate-50 border-slate-200/80'
                        }`}>
                        <p className={`text-xs sm:text-sm font-black truncate ${isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                          {fix.team1} <span className="text-slate-400 font-normal">vs</span> {fix.team2}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Box Bottom Metadata: Date, Time & Venue */}
                  <div className={`pt-3 border-t space-y-2.5 text-xs ${isDark ? 'border-white/10' : 'border-slate-100'
                    }`}>
                    <div className={`flex items-center justify-between font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-bold text-xs">{fix.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-bold font-mono text-xs">{fix.time}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveVenueModal(fix)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border active:scale-98 ${isDark
                          ? 'bg-white/5 hover:bg-blue-500/10 text-slate-200 hover:text-blue-400 border-white/10'
                          : 'bg-slate-100 hover:bg-blue-500/10 text-slate-700 hover:text-blue-600 border-slate-200/80'
                        }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
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
                  className={`rounded-3xl p-5 border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl ${isDark
                      ? 'spatial-glass-card-dark border-blue-500/20 hover:border-blue-400/50 hover:shadow-[0_12px_30px_rgba(0,0,0,0.7)]'
                      : 'spatial-glass-card-light border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 border ${isDark
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                      {sportIcon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-black uppercase tracking-wide ${isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                          {fix.sport}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {fix.gender || 'Open'}
                        </span>
                      </div>
                      <h3 className={`font-extrabold text-sm sm:text-base truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                        {fix.event}
                      </h3>
                      {!isAthletics && (
                        <p className={`text-xs font-bold truncate mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                          {fix.team1} <span className="text-slate-400 font-normal">vs</span> {fix.team2}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`flex flex-wrap items-center gap-3 sm:gap-4 text-xs border-t md:border-t-0 pt-3 md:pt-0 shrink-0 ${isDark ? 'border-white/10' : 'border-slate-100'
                    }`}>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isDark
                        ? 'bg-white/[0.04] border-white/10 text-slate-200'
                        : 'bg-slate-50 border-slate-200/60 text-slate-800'
                      }`}>
                      <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-bold">{fix.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700">
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

        {/* ─── DEDICATION QUOTE (Replacing Standard Footer) ─── */}
        <div className="pt-14 sm:pt-20 pb-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-3 opacity-60">
            <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent to-blue-400" />
            <CalendarIcon className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-l from-transparent to-blue-400" />
          </div>

          <p className={`font-spatial-display text-sm sm:text-base md:text-lg tracking-[0.14em] uppercase font-medium select-none ${isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
            &ldquo;I am constantly looking for ways to{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent font-bold ${isDark
                ? 'from-blue-400 via-indigo-300 to-orange-300'
                : 'from-blue-700 via-indigo-700 to-orange-600'
              }`}>
              improve
            </span>
            , to be better.&rdquo;
          </p>

          <p className={`text-[11px] sm:text-xs font-spatial-sans tracking-widest uppercase italic ${isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
            That&rsquo;s the mindset you need.
          </p>
        </div>

      </div>

      {/* Venue Modal */}
      {activeVenueModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isDark ? 'bg-slate-950/70 text-white' : 'bg-slate-900/40 text-slate-900'
            }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveVenueModal(null);
          }}
        >
          <div className={`border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl ${isDark
              ? 'bg-[#0d0f18]/98 border-white/10 text-white'
              : 'bg-white border-slate-200 text-slate-900'
            }`}>
            <div className={`flex justify-between items-center pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-200'
              }`}>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-lg">Venue Access Directions</h3>
              </div>
              <button
                onClick={() => setActiveVenueModal(null)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/10'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`p-4 rounded-xl border space-y-1 ${isDark
                ? 'bg-white/[0.04] border-white/10'
                : 'bg-slate-50 border-slate-200'
              }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>Assigned Court / Venue</span>
              <p className={`text-sm font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}>{activeVenueModal.venue}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 space-y-1">
              <p className="font-bold">📍 Access Gate & Facilities:</p>
              <p>Main Sports Complex Entrance 2. Shuttle available from Campus Gate A. First Aid & Refreshment Tent adjacent to Court Entry.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
