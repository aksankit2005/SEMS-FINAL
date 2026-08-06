import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, X } from 'lucide-react';
import { SPORTS_DATA } from '../../data/sportsData';
import { galleryApi } from '../../services/galleryApi';
import { coordinatorApi } from '../../services/coordinatorApi';
import { UnifiedSportCard } from '../common/UnifiedSportCard';

export const FeaturedSports = () => {
  const [prEvents, setPrEvents] = useState([]);
  const [coordEvents, setCoordEvents] = useState([]);
  const [activeModalSport, setActiveModalSport] = useState(null);

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
        console.warn('Error fetching events for Featured Sports', err);
      }
    };
    loadEvents();
  }, []);

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
    const coordEv = coordEvents.find((ev) => {
      const sId = (ev.sportId || '').toLowerCase();
      const sName = (ev.sportName || '').toLowerCase();
      const matches = sId === sport.id.toLowerCase() || sName === sport.name.toLowerCase();
      const active = ev.status && ev.status !== 'Closed' && ev.status !== 'Draft' && ev.status !== 'Inactive';
      return matches && active;
    });

    if (coordEv) {
      return {
        eventName: coordEv.title || coordEv.eventName || sport.name,
        entryFee: coordEv.entryFee !== undefined ? coordEv.entryFee : sport.entryFee,
        regStartDate: formatDateToDDMMYYYY(coordEv.regStartDate),
        regEndDate: formatDateToDDMMYYYY(coordEv.regEndDate || coordEv.reg_end_date),
        eventDate: formatDateToDDMMYYYY(coordEv.tournStartDate || coordEv.event_date || sport.startDate),
        tournStartDate: formatDateToDDMMYYYY(coordEv.tournStartDate),
        tournEndDate: formatDateToDDMMYYYY(coordEv.tournEndDate),
        venue: coordEv.venue || sport.venue,
        isOpen: true,
        raw: coordEv
      };
    }

    const prEv = prEvents.find((ev) => {
      const name = (ev.event_name || '').toLowerCase();
      const sName = sport.name.toLowerCase();
      const sId = sport.id.toLowerCase();
      return name.includes(sName) || name.includes(sId) || sName.includes(name);
    });

    if (prEv) {
      return {
        eventName: prEv.event_name || sport.name,
        entryFee: prEv.entryFee !== undefined ? prEv.entryFee : sport.entryFee,
        regStartDate: formatDateToDDMMYYYY(prEv.regStartDate || prEv.created_at?.split('T')[0]),
        regEndDate: formatDateToDDMMYYYY(prEv.regEndDate || '2026-08-30'),
        eventDate: formatDateToDDMMYYYY(prEv.event_date || sport.startDate),
        tournStartDate: formatDateToDDMMYYYY(prEv.tournStartDate || prEv.event_date),
        tournEndDate: formatDateToDDMMYYYY(prEv.tournEndDate),
        venue: prEv.venue || sport.venue,
        isOpen: true,
        raw: prEv
      };
    }

    return {
      eventName: sport.name,
      entryFee: sport.entryFee,
      regStartDate: '01-08-2026',
      regEndDate: '30-08-2026',
      eventDate: formatDateToDDMMYYYY(sport.startDate),
      tournStartDate: null,
      tournEndDate: null,
      venue: sport.venue,
      isOpen: true,
      raw: null
    };
  };

  const activeSports = SPORTS_DATA.map((sport) => {
    const activeEvent = getActiveEventForSport(sport);
    return { sport, activeEvent };
  }).filter(({ activeEvent }) => activeEvent.isOpen);

  // Sort by latest event date (newest first)
  activeSports.sort((a, b) => {
    const aDate = new Date(a.activeEvent.raw?.createdAt || a.activeEvent.raw?.created_at || 0).getTime();
    const bDate = new Date(b.activeEvent.raw?.createdAt || b.activeEvent.raw?.created_at || 0).getTime();
    return bDate - aDate;
  });

  return (
    <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Championship Disciplines</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">Sports</span>
            </h2>
          </div>
          <Link
            to="/sports"
            className="inline-flex items-center gap-2 font-bold text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition group"
          >
            <span>Explore All 11 Sports</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grid or Empty State */}
        {activeSports.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-xl mx-auto shadow-soft">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No registrations are currently open. Please check back soon.</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Stay tuned for upcoming championship events and tournament announcements.</p>
            <Link
              to="/sports"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
            >
              <span>View All Sports</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeSports.map(({ sport, activeEvent }) => (
              <UnifiedSportCard
                key={sport.id}
                sport={sport}
                activeEvent={activeEvent}
                isOpen={true}
                onRulesClick={() => setActiveModalSport(sport)}
                registerLink={`/register/${activeEvent.raw?.id || sport.id}`}
              />
            ))}
          </div>
        )}

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
                <h4 className="font-black text-slate-900 dark:text-white mb-2">Tournament Rules & Guidelines:</h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  {activeModalSport.rules?.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-black text-slate-900 dark:text-white mb-2">Required Documents:</h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  {activeModalSport.requiredDocuments?.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveModalSport(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
