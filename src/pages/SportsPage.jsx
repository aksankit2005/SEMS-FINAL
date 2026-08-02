import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Trophy, Users, MapPin, CheckCircle, Info, ArrowRight, ShieldCheck, Flame, X } from 'lucide-react';
import { SPORTS_DATA } from '../data/sportsData';
import { coordinatorApi } from '../services/coordinatorApi';
import { galleryApi } from '../services/galleryApi';
import { useToast } from '../context/ToastContext';

export const SportsPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalSport, setActiveModalSport] = useState(null);

  const [coordEvents, setCoordEvents] = useState([]);
  const [prEvents, setPrEvents] = useState([]);
  const { showToast } = useToast();

  const fetchAllEvents = async () => {
    try {
      const publicCoord = await coordinatorApi.getPublicEvents();
      const galleryList = await galleryApi.getEvents();
      setCoordEvents(publicCoord || []);
      setPrEvents(galleryList || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchAllEvents();
    const interval = setInterval(fetchAllEvents, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    try {
      const cleanStr = String(dateStr).split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        // [YYYY, MM, DD] -> [DD, MM, YYYY]
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getActiveEventForSport = (sport) => {
    const coordEvent = coordEvents.find((ev) => {
      const sId = (ev.sportId || '').toLowerCase();
      const sName = (ev.sportName || '').toLowerCase();
      const title = (ev.title || '').toLowerCase();
      const sportMatches = sId === sport.id.toLowerCase() || sName === sport.name.toLowerCase() || title.includes(sport.name.toLowerCase());
      const isActive = ev.status === 'Published' || ev.status === 'Open';
      return sportMatches && isActive;
    });

    if (coordEvent) {
      const tournStart = coordEvent.tournStartDate || coordEvent.event_date || sport.startDate || '2026-09-01';
      const tournEnd = coordEvent.tournEndDate || tournStart;
      const isMultiDay = tournStart !== tournEnd;

      return {
        eventName: coordEvent.title || coordEvent.event_name || `${sport.name} Championship 2026`,
        entryFee: coordEvent.entryFee !== undefined ? Number(coordEvent.entryFee) : sport.entryFee,
        regStartDate: formatDateDDMMYYYY(coordEvent.regStartDate || sport.startDate || '2026-08-01'),
        regEndDate: formatDateDDMMYYYY(coordEvent.regEndDate || sport.endDate || '2026-08-30'),
        tournStartDate: formatDateDDMMYYYY(tournStart),
        tournEndDate: formatDateDDMMYYYY(tournEnd),
        isMultiDay,
        venue: coordEvent.venue || sport.venue || 'Central Arena',
        eventObj: coordEvent
      };
    }

    const prEvent = prEvents.find((ev) => {
      const name = (ev.event_name || '').toLowerCase();
      return name.includes(sport.name.toLowerCase());
    });

    if (prEvent) {
      const tournStart = prEvent.event_date || sport.startDate || '2026-09-01';
      return {
        eventName: prEvent.event_name,
        entryFee: sport.entryFee,
        regStartDate: formatDateDDMMYYYY(sport.startDate || '2026-08-01'),
        regEndDate: formatDateDDMMYYYY(sport.endDate || '2026-08-30'),
        tournStartDate: formatDateDDMMYYYY(tournStart),
        tournEndDate: formatDateDDMMYYYY(tournStart),
        isMultiDay: false,
        venue: sport.venue || 'Central Arena',
        eventObj: prEvent
      };
    }

    return null;
  };

  const isSportOpen = (sport) => {
    return Boolean(getActiveEventForSport(sport));
  };

  const getLatestEventTime = (sport) => {
    const active = getActiveEventForSport(sport);
    if (!active || !active.eventObj) return 0;
    const ev = active.eventObj;
    return new Date(ev.createdAt || ev.updatedAt || ev.regStartDate || ev.created_at || ev.event_date || 0).getTime();
  };

  const categories = ['All', 'Indoor', 'Outdoor', 'Mind Sport', 'Traditional & Combat', 'Track & Field', 'Strength'];

  const filteredSports = SPORTS_DATA.filter((sport) => {
    const matchesQuery = sport.name.toLowerCase().includes(query.toLowerCase()) ||
      sport.description.toLowerCase().includes(query.toLowerCase());
    const matchesCat = selectedCategory === 'All' || sport.category.includes(selectedCategory);
    return matchesQuery && matchesCat;
  });

  const sortedSports = [...filteredSports].sort((a, b) => {
    const aOpen = isSportOpen(a);
    const bOpen = isSportOpen(b);

    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;

    if (aOpen && bOpen) {
      const aTime = getLatestEventTime(a);
      const bTime = getLatestEventTime(b);
      return bTime - aTime;
    }

    return 0;
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
            Sports & <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Events Hub</span>
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
            const isOpen = isSportOpen(sport);
            const activeEvent = getActiveEventForSport(sport);

            return (
              <div
                key={sport.id}
                className={`group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between ${
                  !isOpen ? 'opacity-65' : 'opacity-100'
                }`}
              >
                {/* Image & Status Tag */}
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={sport.image}
                    alt={sport.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900/90 backdrop-blur-md text-blue-400 border border-slate-700">
                      {sport.category}
                    </span>
                    {isOpen ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black backdrop-blur-md border bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse">
                        OPEN
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black backdrop-blur-md border bg-slate-700/45 dark:bg-slate-800/45 text-slate-300 dark:text-slate-400 border-slate-500/40">
                        CLOSED
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {isOpen && activeEvent ? activeEvent.eventName : sport.name}
                    </h2>
                    <p className="text-xs text-slate-300 line-clamp-1">{sport.tagline}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {sport.description}
                  </p>

                  {/* Specs / Event Details */}
                  {isOpen && activeEvent ? (
                    <div className="space-y-2.5 py-3 px-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Registration Fee:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">₹{activeEvent.entryFee}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Registration Start Date:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{activeEvent.regStartDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Registration Last Date:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{activeEvent.regEndDate}</span>
                      </div>
                      {activeEvent.isMultiDay ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">Event Start Date:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{activeEvent.tournStartDate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">Event End Date:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{activeEvent.tournEndDate}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Event Date:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{activeEvent.tournStartDate}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-500 block text-[10px] uppercase font-bold">Format</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{sport.type}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Roster</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{sport.teamSize}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Fee</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{sport.entryFee}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{isOpen && activeEvent ? activeEvent.venue : sport.venue}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActiveModalSport(sport)}
                        className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" /> Rules & Specs
                      </button>
                      
                      {isOpen ? (
                        <Link
                          to={`/register/${activeEvent?.eventObj?.id || sport.id}`}
                          className="py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 text-center transition flex items-center justify-center gap-1"
                        >
                          Register <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          onClick={() => showToast('Registration Not Available for this sport currently.', 'info')}
                          className="py-2.5 rounded-xl bg-slate-700/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold text-xs cursor-not-allowed text-center flex items-center justify-center gap-1"
                        >
                          Registration Not Available
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Rules Modal */}
      {activeModalSport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">{activeModalSport.category}</span>
                <h3 className="text-2xl font-black">{activeModalSport.name} Rules</h3>
              </div>
              <button
                onClick={() => setActiveModalSport(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300">
                <span className="font-bold block mb-1">Venue & Schedule:</span>
                <p>{activeModalSport.venue} • {activeModalSport.schedule}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 uppercase text-xs">Official Rulebook:</h4>
                <ul className="space-y-2">
                  {activeModalSport.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Link
                to={`/register/${activeModalSport.id}`}
                onClick={() => setActiveModalSport(null)}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md"
              >
                Proceed to Register for {activeModalSport.name}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
