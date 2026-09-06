import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, ArrowRight, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';
import { coordinatorApi } from '../../services/coordinatorApi';
import { resolveSportKey } from '../../data/sportsConfig';

export const HomeRegistrationSection = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const publicEvents = await coordinatorApi.getPublicEvents().catch(() => []);
        if (isMounted) {
          const active = (Array.isArray(publicEvents) ? publicEvents : []).filter(
            (e) => e && e.status !== 'Draft' && e.status !== 'Cancelled'
          );

          // Priority ordering: Open/Published first -> Upcoming -> Closed
          const getStatusPriority = (status) => {
            const s = (status || '').toLowerCase();
            if (s === 'open' || s === 'published' || s === 'ongoing') return 1;
            if (s === 'upcoming' || s === 'scheduled') return 2;
            if (s === 'closed' || s === 'completed') return 3;
            return 4;
          };

          active.sort((a, b) => {
            const pA = getStatusPriority(a.status);
            const pB = getStatusPriority(b.status);
            if (pA !== pB) return pA - pB;
            const dA = a.tournStartDate ? new Date(a.tournStartDate).getTime() : 0;
            const dB = b.tournStartDate ? new Date(b.tournStartDate).getTime() : 0;
            return dA - dB;
          });

          setEvents(active.slice(0, 6));
        }
      } catch (e) {
        if (isMounted) setEvents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEvents();

    const handleUpdate = () => loadEvents();
    window.addEventListener('sems_events_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('sems_events_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const formatEventDate = (startDate, endDate) => {
    if (!startDate) return 'Dates Announced Soon';
    const s = new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (!endDate || endDate === startDate) return s;
    const e = new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${s} – ${e}`;
  };

  return (
    <section id="home-registration-section" className="py-8 sm:py-14 bg-[#FFFFFF] dark:bg-[#0D101A] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans">
      <div className="w-full max-w-[1600px] px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 mx-auto space-y-5 sm:space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pb-4 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] xs:text-xs font-semibold uppercase tracking-wider text-[#A98B57] dark:text-[#D2AB45] mb-1">
              <Trophy className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
              <span>Championship Registration Dossier</span>
            </div>
            
            <h2 className="text-xl sm:text-3xl font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase">
              Event <span className="text-[#7156A5] dark:text-[#B8A5E5]">Registration</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] mt-0.5">
              Official team enrollment, participant dossiers, and slot verification across championship events
            </p>
          </div>

          <Link
            to="/registration"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:border-[#7156A5] dark:hover:border-[#B8A5E5] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-all shadow-2xs w-full sm:w-auto"
          >
            <span>All Disciplines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Registration Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] animate-pulse" />
            ))
          ) : events.length === 0 ? (
            <div className="col-span-full py-10 text-center bg-[#FAF9F6] dark:bg-[#121625] rounded-xl border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] space-y-2">
              <ShieldCheck className="w-8 h-8 text-[#686370] dark:text-[#AAA4B8] mx-auto opacity-60" />
              <p className="text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA]">No Active Event Registrations</p>
              <p className="text-xs text-[#686370] dark:text-[#AAA4B8]">New championship events and entry forms will be published shortly.</p>
            </div>
          ) : (
            events.map((ev) => {
              const isOpen = ev.status === 'Published' || ev.status === 'Open';
              const isClosed = ev.status === 'Closed';

              return (
                <div
                  key={ev.id}
                  className="bg-[#FAF9F6] dark:bg-[#121625] rounded-xl p-5 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/50 dark:hover:border-[#8B5CF6]/50 transition-all flex flex-col justify-between group shadow-2xs"
                >
                  <div>
                    {/* Top Row: Sport Name & Registration Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-white dark:bg-[#0D101A] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                        {ev.sportName || ev.sport || 'Championship'}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider border ${
                          isClosed
                            ? 'bg-[#FBEDEF] dark:bg-[#B71C1C]/15 border-[#FFCDD2] dark:border-[#B71C1C]/30 text-[#B71C1C] dark:text-[#FDA4AF]'
                            : isOpen
                            ? 'bg-[#EDF7F0] dark:bg-[#1B5E20]/20 border-[#C8E6C9] dark:border-[#81C784]/30 text-[#1B5E20] dark:text-[#81C784]'
                            : 'bg-amber-50 dark:bg-[#A98B57]/15 border-amber-200 dark:border-[#A98B57]/30 text-amber-800 dark:text-[#F3D78A]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isClosed
                              ? 'bg-[#B71C1C] dark:bg-[#FDA4AF]'
                              : isOpen
                              ? 'bg-[#1B5E20] dark:bg-[#81C784] animate-pulse'
                              : 'bg-[#A98B57] dark:bg-[#F3D78A]'
                          }`}
                        />
                        {isClosed ? 'Closed' : isOpen ? 'Open' : 'Upcoming'}
                      </span>
                    </div>

                    {/* Event Title */}
                    <h3 className="font-bold text-[#211D2B] dark:text-[#F5F2FA] text-base group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors line-clamp-2 leading-snug mb-2 font-spatial-display">
                      {ev.title}
                    </h3>

                    {/* Meta information: Date & Squad */}
                    <div className="space-y-1.5 text-xs text-[#686370] dark:text-[#AAA4B8]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#A98B57]" />
                        <span>{formatEventDate(ev.tournStartDate, ev.tournEndDate)}</span>
                      </div>
                      {ev.teamSize && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5]" />
                          <span>Squad: {String(ev.teamSize).toLowerCase().includes('player') ? ev.teamSize : `${ev.teamSize} Players`}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-5 pt-3 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#A98B57] dark:text-[#D2AB45]">
                      {ev.entryFee ? `Fee: ₹${ev.entryFee}` : 'Entry: Free'}
                    </span>

                    {isOpen ? (
                      <Link
                        to={`/registration?eventId=${ev.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white text-xs font-semibold transition-all shadow-2xs group-hover:shadow-xs active:scale-95"
                      >
                        <span>Register Now</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        to="/registration"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#686370] dark:text-[#AAA4B8] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
};
