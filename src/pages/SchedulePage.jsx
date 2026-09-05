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
  const [viewMode, setViewMode] = useState('list');
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

  const filteredFixtures = combinedList.filter((item) => {
    const sportKey = (item.sport || item.sportId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const selectedKey = selectedSport.toLowerCase().replace(/[^a-z0-9]/g, '');
    return selectedSport === 'All' ||
      sportKey === selectedKey ||
      (sportKey.length > 2 && selectedKey.includes(sportKey)) ||
      (selectedKey.length > 2 && sportKey.includes(selectedKey));
  });

  return (
    <div className={`relative min-h-screen font-spatial-sans selection:bg-[#7156A5]/20 selection:text-[#211D2B] dark:selection:text-white overflow-x-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070A13] text-[#F5F2FA]' : 'bg-[#FAF9F6] text-[#211D2B]'
    }`}>

      {/* Atmospheric overlays preserved for dark mode */}
      {isDark && (
        <>
          <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60" />
          <div className="fixed inset-0 spatial-grain-overlay z-[1] pointer-events-none opacity-20" />
        </>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-6">

        {/* Editorial Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
            <CalendarIcon className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5]" />
            <span>Tournament Schedule</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
            Championship <span className="text-[#7156A5] dark:text-[#B8A5E5]">Fixtures</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] leading-relaxed">
            Official timetable, court assignments, and tournament fixtures across all championship disciplines.
          </p>
        </div>

        {/* Controls & Filter Bar */}
        <div className="bg-[#FFFFFF] dark:bg-[#0D101A] p-3 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          {/* Left: Discipline & Count */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA]">
              {selectedSport === 'All' ? 'All Disciplines' : selectedSport}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
              {filteredFixtures.length} {filteredFixtures.length === 1 ? 'Fixture' : 'Fixtures'}
            </span>
          </div>

          {/* Right: View Toggle + Roll-Down Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] bg-[#FAF9F6] dark:bg-[#121625]">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#7156A5] text-white shadow-2xs'
                    : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-white'
                }`}
                title="List View"
                aria-label="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#7156A5] text-white shadow-2xs'
                    : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-white'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Roll-Down Sport Filter Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] hover:border-[#7156A5] dark:hover:border-[#B8A5E5]"
                title="Filter by Sport"
                aria-label="Filter discipline roll-down dropdown"
              >
                <Filter className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />
                <span className="truncate max-w-[120px]">
                  {selectedSport === 'All' ? 'Filter Sport' : selectedSport}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#686370] dark:text-[#AAA4B8] shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Roll-Down Menu Popover */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-lg p-1.5 z-50 shadow-md border bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] max-h-80 overflow-y-auto font-spatial-sans">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.1)] mb-1 flex items-center justify-between">
                    <span>Select Discipline</span>
                    <span className="text-[9px]">{sportsList.length} Options</span>
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
                        className={`w-full px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] font-semibold'
                            : 'hover:bg-[#FAF9F6] dark:hover:bg-[#161B2E] text-[#211D2B] dark:text-[#F5F2FA]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs">{icon}</span>
                          <span className="truncate">{s}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />}
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
          <div className="py-16 text-center bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] p-8 space-y-2">
            <CalendarIcon className="w-10 h-10 text-[#686370] dark:text-[#AAA4B8] mx-auto mb-2 opacity-60" />
            <h3 className="text-base font-bold text-[#211D2B] dark:text-[#F5F2FA]">No Match Fixtures Found</h3>
            <p className="text-xs text-[#686370] dark:text-[#AAA4B8] max-w-sm mx-auto">
              There are no fixtures currently scheduled for {selectedSport === 'All' ? 'any discipline' : selectedSport}.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFixtures.map((fix) => {
              const sportCfg = resolveSportConfig(fix.sport || fix);
              const sportIcon = sportCfg.icon || '🏆';
              const isAthletics = (fix.sport || '').toLowerCase().includes('athletic');

              return (
                <div
                  key={fix.id}
                  className="bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg p-5 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/40 dark:hover:border-[#8B5CF6]/40 transition-all flex flex-col justify-between space-y-4 group shadow-2xs"
                >
                  {/* Card Top: Sport Icon, Sport Name & Gender Badge */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold shrink-0 bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                        {sportIcon}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#7156A5] dark:text-[#B8A5E5]">
                          {fix.sport}
                        </h4>
                        <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8] block">#{fix.id}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                      {fix.gender || 'Open'}
                    </span>
                  </div>

                  {/* Event Title & Team Matchup */}
                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-sm leading-snug text-[#211D2B] dark:text-[#F5F2FA]">
                      {fix.event}
                    </h3>
                    {!isAthletics && (
                      <div className="p-2.5 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] text-center">
                        <p className="text-xs font-bold truncate text-[#211D2B] dark:text-[#F5F2FA]">
                          {fix.team1} <span className="text-[#686370] dark:text-[#AAA4B8] font-normal">vs</span> {fix.team2}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Date, Time & Venue */}
                  <div className="pt-3 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] space-y-2 text-xs">
                    <div className="flex items-center justify-between font-medium text-[#686370] dark:text-[#AAA4B8]">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#596B98] dark:text-[#B8A5E5] shrink-0" />
                        <span className="text-[11px] font-semibold">{fix.date}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] text-[#211D2B] dark:text-[#F5F2FA]">
                        <Clock className="w-3 h-3 text-[#596B98] dark:text-[#B8A5E5] shrink-0" />
                        <span className="font-mono text-[11px] font-semibold">{fix.time}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveVenueModal(fix)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#161B2E] text-[#211D2B] dark:text-[#F5F2FA] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45] shrink-0" />
                      <span className="truncate">{fix.venue}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View (Editorial Row Programme) */
          <div className="space-y-3">
            {filteredFixtures.map((fix) => {
              const sportCfg = resolveSportConfig(fix.sport || fix);
              const sportIcon = sportCfg.icon || '🏆';
              const isAthletics = (fix.sport || '').toLowerCase().includes('athletic');

              return (
                <div
                  key={fix.id}
                  className="bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg p-4 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/40 dark:hover:border-[#8B5CF6]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                      {sportIcon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#7156A5] dark:text-[#B8A5E5]">
                          {fix.sport}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                          {fix.gender || 'Open'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm truncate mt-0.5 text-[#211D2B] dark:text-[#F5F2FA]">
                        {fix.event}
                      </h3>
                      {!isAthletics && (
                        <p className="text-xs font-medium truncate mt-0.5 text-[#686370] dark:text-[#AAA4B8]">
                          <strong className="text-[#211D2B] dark:text-[#F5F2FA]">{fix.team1}</strong> vs <strong className="text-[#211D2B] dark:text-[#F5F2FA]">{fix.team2}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs border-t md:border-t-0 pt-2.5 md:pt-0 shrink-0 border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA]">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#596B98] dark:text-[#B8A5E5]" />
                      <span className="font-semibold text-xs">{fix.date}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA]">
                      <Clock className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
                      <span className="font-mono font-semibold text-xs">{fix.time}</span>
                    </div>
                    <button
                      onClick={() => setActiveVenueModal(fix)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#161B2E] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA] font-semibold transition-all shadow-2xs cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
                      <span className="max-w-[140px] truncate">{fix.venue}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dedication Footer */}
        <div className="pt-12 pb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 opacity-40">
            <div className="h-[1px] w-16 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
            <CalendarIcon className="w-3 h-3 text-[#7156A5] dark:text-[#B8A5E5]" />
            <div className="h-[1px] w-16 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
          </div>

          <p className="font-spatial-display text-xs sm:text-sm tracking-wider uppercase font-semibold text-[#686370] dark:text-[#AAA4B8] select-none">
            &ldquo;Discipline in Schedule, Excellence in Performance.&rdquo;
          </p>

          <p className="text-[11px] font-spatial-sans text-[#686370] dark:text-[#AAA4B8]">
            Official Directorate of Physical Education & Sports • MPGI Kanpur
          </p>
        </div>

      </div>

      {/* Venue Modal */}
      {activeVenueModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-spatial-sans"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveVenueModal(null);
          }}
        >
          <div className="border rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#A98B57] dark:text-[#D2AB45]" />
                <h3 className="font-bold text-base font-spatial-display">Venue Access & Directions</h3>
              </div>
              <button
                onClick={() => setActiveVenueModal(null)}
                className="p-1 rounded text-[#686370] hover:text-[#211D2B] dark:text-[#AAA4B8] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] bg-[#FAF9F6] dark:bg-[#121625] space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] block">Assigned Court / Venue</span>
              <p className="text-sm font-bold text-[#7156A5] dark:text-[#B8A5E5]">{activeVenueModal.venue}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#EDF7F0] dark:bg-[#1B5E20]/20 border border-[#C8E6C9] dark:border-[#1B5E20]/30 text-xs text-[#1B5E20] dark:text-[#81C784] space-y-1">
              <p className="font-bold">📍 Campus Gate & Arena Access:</p>
              <p>Main Sports Arena Gate 2. Athletes and squad managers should report 20 minutes prior to scheduled match time for biometric verification.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
