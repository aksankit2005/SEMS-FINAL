import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronRight, Trophy, Sparkles } from 'lucide-react';
import { SCHEDULE_DATA } from '../../data/scheduleData';
import { coordinatorApi } from '../../services/coordinatorApi';

export const HomeScheduleSection = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const publicMatches = await coordinatorApi.getPublicMatches().catch(() => []);
        let combined = [];

        if (publicMatches && Array.isArray(publicMatches) && publicMatches.length > 0) {
          combined = publicMatches
            .filter((m) => m && m.status !== 'COMPLETED' && m.status !== 'FINISHED')
            .map((m) => {
              const sportId = (m.sportId || m.sport || 'event').toLowerCase();
              const sportName = m.sportName || m.sport || (sportId.charAt(0).toUpperCase() + sportId.slice(1));
              const t1 = typeof m.team1 === 'object' ? (m.team1?.name || 'TBD') : String(m.team1 || 'TBD');
              const t2 = typeof m.team2 === 'object' ? (m.team2?.name || 'TBD') : String(m.team2 || 'TBD');
              const eventTitle = (t1 && t2 && t1 !== 'TBD' && t2 !== 'TBD') 
                ? `${t1} vs ${t2}` 
                : (m.eventTitle || m.matchTitle || `${t1} vs ${t2}`);

              const timeStr = m.time 
                ? (m.date ? `${m.date} | ${m.time}` : m.time)
                : (m.startTime || 'Scheduled Today');

              return {
                id: m.id || Math.random().toString(),
                sportName,
                eventTitle,
                team1: t1,
                team2: t2,
                time: timeStr,
                venue: m.tableNumber || m.venue || m.court || 'Main Arena',
                status: m.status || 'SCHEDULED'
              };
            });
        }

        // Fallback to SCHEDULE_DATA only if no real scheduled matches exist
        if (combined.length === 0) {
          combined = (SCHEDULE_DATA || []).slice(0, 4).map((s) => ({
            id: s.id || Math.random().toString(),
            sportName: s.sport || s.sportName || 'Championship',
            eventTitle: `${s.team1 || 'College Team A'} vs ${s.team2 || 'College Team B'}`,
            team1: s.team1 || 'College Team A',
            team2: s.team2 || 'College Team B',
            time: s.time || '10:00 AM',
            venue: s.venue || 'Indoor Sports Complex',
            status: 'SCHEDULED'
          }));
        }

        setSchedules(combined.slice(0, 8));
      } catch (e) {
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();

    const handleUpdate = () => loadSchedule();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('sems_matches_updated', handleUpdate);
    window.addEventListener('sems_results_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('sems_matches_updated', handleUpdate);
      window.removeEventListener('sems_results_updated', handleUpdate);
    };
  }, []);

  return (
    <section className="py-10 sm:py-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full max-w-[1440px] px-3 sm:px-5 lg:px-6 xl:px-8 mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Tournament Schedule
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Upcoming <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Match Fixtures</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Timetable, venues, and court assignments for upcoming matches
            </p>
          </div>

          <Link
            to="/schedule"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <span>Full Schedule</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Schedule Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {loading ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
            ))
          ) : schedules.length === 0 ? (
            <div className="col-span-full py-10 text-center bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Fixtures Scheduled Right Now</p>
            </div>
          ) : (
            schedules.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-5 border border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-wider">
                      {item.sportName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                      {item.status}
                    </span>
                  </div>

                  {/* Match Teams */}
                  <div className="my-2">
                    <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {item.eventTitle}
                    </h3>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2 font-medium">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{item.time}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{item.venue}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
};
