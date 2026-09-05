import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, ArrowRight, ShieldCheck, ChevronRight, Users } from 'lucide-react';
import { coordinatorApi } from '../../services/coordinatorApi';

export const HeroSection = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const publicEvents = await coordinatorApi.getPublicEvents().catch(() => []);
        if (isMounted) {
          // Filter to active published or upcoming events
          const active = (Array.isArray(publicEvents) ? publicEvents : []).filter(
            (e) => e && e.status !== 'Draft' && e.status !== 'Cancelled'
          );
          setEvents(active);
        }
      } catch (err) {
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

  const activeEvent = events.length > 0 ? events[selectedEventIndex] || events[0] : null;

  // Format date utility
  const formatEventDate = (startDate, endDate) => {
    if (!startDate) return null;
    const s = new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (!endDate || endDate === startDate) return s;
    const e = new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${s} – ${e}`;
  };

  // Check if genuine uploaded cover image exists (ignore third-party stock placeholders)
  const hasGenuineBanner =
    activeEvent?.coverImage &&
    typeof activeEvent.coverImage === 'string' &&
    activeEvent.coverImage.trim() !== '' &&
    !activeEvent.coverImage.includes('images.unsplash.com');

  return (
    <section className="relative w-full overflow-hidden bg-[#070A13] text-[#F5F2FA] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans">
      {/* Subtle genuine banner backdrop if provided by coordinator, else solid editorial dark */}
      {hasGenuineBanner && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={activeEvent.coverImage}
            alt={activeEvent.title}
            className="w-full h-full object-cover object-center opacity-20 filter blur-xs"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070A13] via-[#070A13]/85 to-[#070A13]/90" />
        </div>
      )}

      {/* Editorial Content Container */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 py-12 sm:py-16 md:py-20">
        {loading ? (
          <div className="space-y-4 max-w-3xl animate-pulse">
            <div className="h-6 w-48 bg-white/10 rounded" />
            <div className="h-12 w-3/4 bg-white/10 rounded" />
            <div className="h-20 w-full bg-white/10 rounded" />
            <div className="h-10 w-64 bg-white/10 rounded" />
          </div>
        ) : activeEvent ? (
          /* Dynamic Active Championship Layout */
          <div className="space-y-6 sm:space-y-8">
            {/* Top Institutional & Status Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 border border-white/15 text-[#F3D78A] font-mono uppercase tracking-wider font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A98B57]" />
                {activeEvent.sportName || activeEvent.category || 'Official Tournament'}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs uppercase tracking-wider font-semibold border ${
                  activeEvent.status === 'Closed'
                    ? 'bg-[#B71C1C]/15 border-[#B71C1C]/30 text-[#FDA4AF]'
                    : activeEvent.status === 'Upcoming'
                    ? 'bg-[#A98B57]/15 border-[#A98B57]/30 text-[#F3D78A]'
                    : 'bg-[#1B5E20]/20 border-[#81C784]/30 text-[#81C784]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeEvent.status === 'Closed'
                      ? 'bg-[#FDA4AF]'
                      : activeEvent.status === 'Upcoming'
                      ? 'bg-[#F3D78A]'
                      : 'bg-[#81C784] animate-pulse'
                  }`}
                />
                {activeEvent.status === 'Closed'
                  ? 'Registration Closed'
                  : activeEvent.status === 'Upcoming'
                  ? 'Upcoming Programme'
                  : 'Registration Open'}
              </span>

              {activeEvent.category && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/70 font-mono text-[11px]">
                  {activeEvent.category}
                </span>
              )}
            </div>

            {/* Main Championship Headline */}
            <div className="space-y-3 max-w-4xl">
              <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-normal font-spatial-display tracking-tight text-white uppercase leading-[1.1]">
                {activeEvent.title}
              </h1>

              {activeEvent.description && (
                <p className="text-xs sm:text-sm md:text-base text-[#AAA4B8] leading-relaxed max-w-2xl line-clamp-3">
                  {activeEvent.description}
                </p>
              )}
            </div>

            {/* Event Key Facts Bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1 text-xs sm:text-sm text-[#AAA4B8] border-t border-white/10">
              {activeEvent.tournStartDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#A98B57]" />
                  <span>{formatEventDate(activeEvent.tournStartDate, activeEvent.tournEndDate)}</span>
                </div>
              )}

              {activeEvent.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#A98B57]" />
                  <span>{activeEvent.venue}</span>
                </div>
              )}

              {activeEvent.teamSize && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#B8A5E5]" />
                  <span>Squad: {activeEvent.teamSize} Players</span>
                </div>
              )}

              <div className="flex items-center gap-2 font-mono">
                <span className="text-[#F3D78A]">
                  {activeEvent.entryFee ? `Fee: ₹${activeEvent.entryFee}` : 'Entry: Free'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {activeEvent.status !== 'Closed' && (
                <Link
                  to={`/registration${activeEvent.id ? `?eventId=${activeEvent.id}` : ''}`}
                  className="px-6 py-3 rounded-lg bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center gap-2 active:scale-98 min-h-[44px]"
                >
                  <Trophy className="w-4 h-4 text-white" />
                  <span>Register for Event</span>
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </Link>
              )}

              <Link
                to="/schedule"
                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/25 hover:border-white/50 transition-all flex items-center gap-2 active:scale-98 min-h-[44px]"
              >
                <span>Tournament Timetable</span>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </Link>

              <Link
                to="/results"
                className="px-6 py-3 rounded-lg bg-transparent hover:bg-white/5 text-[#AAA4B8] hover:text-white font-semibold text-xs sm:text-sm border border-white/10 hover:border-white/25 transition-all flex items-center gap-2 min-h-[44px]"
              >
                <span>Match Ledger</span>
              </Link>
            </div>

            {/* Multiple Active Events Selector (if > 1 event exists) */}
            {events.length > 1 && (
              <div className="pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-mono text-[#AAA4B8] uppercase tracking-wider shrink-0 mr-1">
                  Active Tournaments:
                </span>
                {events.map((ev, idx) => (
                  <button
                    key={ev.id || idx}
                    onClick={() => setSelectedEventIndex(idx)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                      idx === selectedEventIndex
                        ? 'bg-[#7156A5] text-white'
                        : 'bg-white/5 hover:bg-white/10 text-[#AAA4B8] border border-white/10'
                    }`}
                  >
                    {ev.sportName || ev.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Dignified Institutional APEX Masthead (Truthful Zero-Active State) */
          <div className="space-y-6 sm:space-y-8 max-w-4xl">
            {/* Institutional Hierarchy */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F3D78A]">
                <ShieldCheck className="w-4 h-4 text-[#A98B57]" />
                <span>Directorate of Physical Education & Sports • MPGI Kanpur</span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-normal font-spatial-display tracking-tight text-white uppercase leading-[1.1]">
                Maharana Pratap <br className="hidden sm:inline" />
                Sports Championship
              </h1>
            </div>

            {/* Official Notice */}
            <div className="p-4 sm:p-5 rounded-lg bg-[#0D101A] border border-[rgba(184,165,229,0.16)] space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#A98B57]">
                <span className="w-2 h-2 rounded-full bg-[#A98B57]" />
                <span>CHAMPIONSHIP SCHEDULE FORTHCOMING</span>
              </div>
              <p className="text-xs sm:text-sm text-[#AAA4B8] leading-relaxed">
                Official inter-collegiate tournament fixtures, participant registrations, and court allocations are currently being finalized by the sports committee. Consult the match ledger for historical records or review the tournament rules.
              </p>
            </div>

            {/* Directorate Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/schedule"
                className="px-6 py-3 rounded-lg bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center gap-2 active:scale-98 min-h-[44px]"
              >
                <Calendar className="w-4 h-4 text-white" />
                <span>Tournament Timetable</span>
                <ChevronRight className="w-4 h-4 text-white/80" />
              </Link>

              <Link
                to="/results"
                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/25 hover:border-white/50 transition-all flex items-center gap-2 active:scale-98 min-h-[44px]"
              >
                <Trophy className="w-4 h-4 text-[#F3D78A]" />
                <span>Historical Match Ledger</span>
              </Link>
            </div>

            {/* Key Directorate Metrics */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-lg sm:text-xl font-bold font-spatial-display text-white">12</div>
                <div className="text-[#AAA4B8] text-[11px] mt-0.5">Approved Disciplines</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold font-spatial-display text-white">AKTU</div>
                <div className="text-[#AAA4B8] text-[11px] mt-0.5">Affiliated Standards</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold font-spatial-display text-white">6 Courts</div>
                <div className="text-[#AAA4B8] text-[11px] mt-0.5">Indoor & Outdoor Arenas</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold font-spatial-display text-white">Live</div>
                <div className="text-[#AAA4B8] text-[11px] mt-0.5">Real-time Digital Scoring</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
