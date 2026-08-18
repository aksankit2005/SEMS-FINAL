import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Trophy, Users, MapPin, CheckCircle, Info, ArrowRight, ShieldCheck, Flame, X } from 'lucide-react';
import { SPORTS_DATA } from '../data/sportsData';
import { BadmintonRulesDisplay, BadmintonRulesModal } from '../components/registration/BadmintonRulesDisplay';
import { AthleticsRulesDisplay } from '../components/registration/AthleticsRulesDisplay';
import { galleryApi } from '../services/galleryApi';
import { coordinatorApi } from '../services/coordinatorApi';
import { UnifiedSportCard } from '../components/common/UnifiedSportCard';

export const SportsPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalSport, setActiveModalSport] = useState(null);

  const [prEvents, setPrEvents] = useState([]);
  const [coordEvents, setCoordEvents] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const [pr, coord] = await Promise.all([
          galleryApi.getEvents().catch(() => []),
          coordinatorApi.getPublicEvents().catch(() => [])
        ]);
        setPrEvents(pr || []);
        setCoordEvents(coord || []);
      } catch (err) {
        console.warn('Error fetching events for Sports Hub', err);
      }
    };

    loadEvents();

    const handleUpdate = () => loadEvents();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('sems_events_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('sems_events_updated', handleUpdate);
    };
  }, []);

  const isSportOpen = (sport) => {
    // 1. Check coordinator events
    const hasCoord = coordEvents.some((ev) => {
      const sId = (ev.sportId || '').toLowerCase();
      const sName = (ev.sportName || '').toLowerCase();
      const matches = sId === sport.id.toLowerCase() || sName === sport.name.toLowerCase();
      const active = ev.status && ev.status !== 'Closed' && ev.status !== 'Draft' && ev.status !== 'Inactive';
      return matches && active;
    });

    if (hasCoord) return true;

    // 2. Check PR / Admin events
    const hasPr = prEvents.some((ev) => {
      const name = (ev.event_name || '').toLowerCase();
      const sName = sport.name.toLowerCase();
      const sId = sport.id.toLowerCase();
      return name.includes(sName) || name.includes(sId) || sName.includes(name);
    });

    if (hasPr) return true;

    return false;
  };

  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4) {
        return `${day}-${month}-${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  };

  const getActiveEventForSport = (sport) => {
    // 1. Check coordinator events
    const matchingCoordEvents = coordEvents.filter((ev) => {
      const sId = (ev.sportId || '').toLowerCase();
      const sName = (ev.sportName || '').toLowerCase();
      return sId === sport.id.toLowerCase() || sName === sport.name.toLowerCase();
    });

    if (matchingCoordEvents.length > 0) {
      // Prioritize: Open (3) > Upcoming (2) > Closed (1)
      const sortedMatching = [...matchingCoordEvents].sort((a, b) => {
        const getEvPriority = (ev) => {
          const s = (ev.status || '').toLowerCase();
          if (s === 'published' || s === 'open' || s === 'active') return 3;
          if (s === 'upcoming' || s === 'coming soon') return 2;
          if (s === 'closed') return 1;
          return 0;
        };
        return getEvPriority(b) - getEvPriority(a);
      });

      const coordEv = sortedMatching[0];
      const s = (coordEv.status || '').toLowerCase();
      const isUpcoming = s === 'upcoming' || s === 'coming soon';
      const isOpen = !isUpcoming && (s === 'published' || s === 'open' || s === 'active');
      const resolvedFee = typeof coordEv.entryFee === 'number' ? coordEv.entryFee : (typeof coordEv.teamFee === 'number' ? coordEv.teamFee : (coordEv.entryFee ?? coordEv.teamFee ?? sport.entryFee));

      return {
        eventName: coordEv.title || coordEv.eventName || sport.name,
        entryFee: resolvedFee,
        regStartDate: formatDateToDDMMYYYY(coordEv.regStartDate),
        regEndDate: formatDateToDDMMYYYY(coordEv.regEndDate || coordEv.reg_end_date),
        eventDate: formatDateToDDMMYYYY(coordEv.tournStartDate || coordEv.event_date || sport.startDate),
        tournStartDate: formatDateToDDMMYYYY(coordEv.tournStartDate),
        tournEndDate: formatDateToDDMMYYYY(coordEv.tournEndDate),
        venue: coordEv.venue || sport.venue,
        isOpen: isOpen,
        isUpcoming: isUpcoming,
        status: isOpen ? 'Open' : isUpcoming ? 'Upcoming' : 'Closed',
        hasActiveEvent: true,
        raw: coordEv
      };
    }

    // 2. Check PR / Admin events
    const prEv = prEvents.find((ev) => {
      const name = (ev.event_name || '').toLowerCase();
      const sName = sport.name.toLowerCase();
      const sId = sport.id.toLowerCase();
      return name.includes(sName) || name.includes(sId) || sName.includes(name);
    });

    if (prEv) {
      const resolvedFee = typeof prEv.entryFee === 'number' ? prEv.entryFee : (typeof prEv.teamFee === 'number' ? prEv.teamFee : (prEv.entryFee ?? prEv.teamFee ?? sport.entryFee));
      return {
        eventName: prEv.event_name || sport.name,
        entryFee: resolvedFee,
        regStartDate: formatDateToDDMMYYYY(prEv.regStartDate || prEv.created_at?.split('T')[0]),
        regEndDate: formatDateToDDMMYYYY(prEv.regEndDate || '2026-08-30'),
        eventDate: formatDateToDDMMYYYY(prEv.event_date || sport.startDate),
        tournStartDate: formatDateToDDMMYYYY(prEv.tournStartDate || prEv.event_date),
        tournEndDate: formatDateToDDMMYYYY(prEv.tournEndDate),
        venue: prEv.venue || sport.venue,
        isOpen: true,
        isUpcoming: false,
        status: 'Published',
        hasActiveEvent: true,
        raw: prEv
      };
    }

    return {
      eventName: sport.name,
      entryFee: sport.entryFee,
      regStartDate: '-',
      regEndDate: '-',
      eventDate: formatDateToDDMMYYYY(sport.startDate),
      tournStartDate: null,
      tournEndDate: null,
      venue: sport.venue,
      isOpen: false,
      isUpcoming: false,
      status: 'Closed',
      hasActiveEvent: false,
      raw: null
    };
  };

  const categories = ['All', 'Indoor', 'Outdoor', 'Mind Sport', 'Traditional & Combat', 'Track & Field', 'Strength'];

  const filteredSports = SPORTS_DATA.filter((sport) => {
    const matchesQuery = sport.name.toLowerCase().includes(query.toLowerCase()) ||
      sport.description.toLowerCase().includes(query.toLowerCase());
    const matchesCat = selectedCategory === 'All' || sport.category.includes(selectedCategory);
    return matchesQuery && matchesCat;
  });

  const getLatestEventDate = (sport) => {
    let latest = 0;
    coordEvents.forEach((ev) => {
      const sId = (ev.sportId || '').toLowerCase();
      const sName = (ev.sportName || '').toLowerCase();
      const matches = sId === sport.id.toLowerCase() || sName === sport.name.toLowerCase();
      const active = ev.status && ev.status !== 'Closed' && ev.status !== 'Draft' && ev.status !== 'Inactive';
      if (matches && active) {
        const d = new Date(ev.createdAt || ev.regStartDate || 0).getTime();
        if (d > latest) latest = d;
      }
    });

    prEvents.forEach((ev) => {
      const name = (ev.event_name || '').toLowerCase();
      const sName = sport.name.toLowerCase();
      const sId = sport.id.toLowerCase();
      if (name.includes(sName) || name.includes(sId) || sName.includes(name)) {
        const d = new Date(ev.created_at || ev.event_date || 0).getTime();
        if (d > latest) latest = d;
      }
    });

    return latest;
  };

  const sortedSports = [...filteredSports].sort((a, b) => {
    const aEv = getActiveEventForSport(a);
    const bEv = getActiveEventForSport(b);

    const getPriority = (ev) => {
      if (ev.isOpen) return 3;
      if (ev.isUpcoming) return 2;
      return 1;
    };

    const pA = getPriority(aEv);
    const pB = getPriority(bEv);

    if (pA !== pB) return pB - pA;

    const aDate = getLatestEventDate(a);
    const bDate = getLatestEventDate(b);
    return bDate - aDate; // newest first
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
            <Trophy className="w-4 h-4 text-orange-500" /> 11 Championship Disciplines
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Sports & <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">Events Hub</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Browse through all official sports categories. Inspect rules, venue specifications, squad sizes, and register your college team instantly.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sports by name..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedSports.map((sport) => {
            const activeEvent = getActiveEventForSport(sport);
            const isOpen = activeEvent.isOpen;
            return (
              <UnifiedSportCard
                key={sport.id}
                sport={sport}
                activeEvent={activeEvent}
                isOpen={isOpen}
                onRulesClick={() => setActiveModalSport(sport)}
                registerLink={`/register/${activeEvent.raw?.id || sport.id}`}
              />
            );
          })}
        </div>

      </div>

      {/* Rules Modal */}
      <BadmintonRulesModal
        isOpen={!!activeModalSport}
        onClose={() => setActiveModalSport(null)}
        sportName={activeModalSport?.name}
        rules={activeModalSport?.rules || []}
      />
    </div>
  );
};
