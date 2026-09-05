import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronRight, Trophy, Sparkles, ArrowRight } from 'lucide-react';
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
    <section className="py-12 sm:py-14 bg-[#FAF9F6] dark:bg-[#070A13] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-4 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7156A5] dark:text-[#B8A5E5] mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5]" />
              <span>Official Tournament Programme</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#211D2B] dark:text-[#F5F2FA] tracking-tight font-spatial-display">
              Upcoming <span className="text-[#7156A5] dark:text-[#B8A5E5]">Fixtures</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] mt-1">
              Court allocations, match times, and official schedules
            </p>
          </div>

          <Link
            to="/schedule"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:border-[#7156A5] dark:hover:border-[#B8A5E5] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-all shadow-2xs"
          >
            <span>Full Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Schedule Programme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="h-40 rounded-lg bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] animate-pulse" />
            ))
          ) : schedules.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <Calendar className="w-8 h-8 text-[#686370] dark:text-[#AAA4B8] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA]">No Upcoming Fixtures Scheduled</p>
              <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-1">Check back once coordinators publish the tournament timetable</p>
            </div>
          ) : (
            schedules.map((item) => (
              <div
                key={item.id}
                className="bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg p-4 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/40 dark:hover:border-[#8B5CF6]/40 transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  {/* Top Bar: Sport & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                      {item.sportName}
                    </span>
                    <span className="text-[10px] font-medium text-[#686370] dark:text-[#AAA4B8] px-1.5 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#08090E] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                      {item.status}
                    </span>
                  </div>

                  {/* Match Event Title */}
                  <div className="my-1.5">
                    <h3 className="font-bold text-[#211D2B] dark:text-[#F5F2FA] text-sm leading-snug group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors line-clamp-2">
                      {item.eventTitle}
                    </h3>
                  </div>
                </div>

                {/* Details Footer with Hairline */}
                <div className="mt-4 pt-3 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] space-y-1.5 text-xs text-[#686370] dark:text-[#AAA4B8]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#596B98] dark:text-[#B8A5E5] shrink-0" />
                    <span className="truncate">{item.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45] shrink-0" />
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
