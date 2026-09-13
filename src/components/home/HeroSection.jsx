import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, ArrowRight, ShieldCheck, ChevronRight, Users } from 'lucide-react';
import { coordinatorApi } from '../../services/coordinatorApi';

export const HeroSection = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const publicEvents = await coordinatorApi.getPublicEvents().catch(() => []);
        if (isMounted) {
          // Filter to active published, upcoming, or scheduled events
          const active = (Array.isArray(publicEvents) ? publicEvents : []).filter(
            (e) => e && e.status !== 'Draft' && e.status !== 'Cancelled'
          );

          // Priority ordering: Open/Published first -> Upcoming -> Closed
          const getStatusPriority = (status) => {
            const s = (status || '').toLowerCase();
            if (s === 'open' || s === 'published' || s === 'ongoing') return 1;
            if (s === 'upcoming' || s === 'scheduled') return 2;
            if (s === 'closed' || s === 'completed' || s === 'concluded') return 3;
            return 4;
          };

          active.sort((a, b) => {
            const priorityA = getStatusPriority(a.status);
            const priorityB = getStatusPriority(b.status);
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            const dateA = a.tournStartDate ? new Date(a.tournStartDate).getTime() : 0;
            const dateB = b.tournStartDate ? new Date(b.tournStartDate).getTime() : 0;
            return dateA - dateB;
          });

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

  // Auto-slide to next event every 4 seconds
  useEffect(() => {
    if (events.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setSelectedEventIndex((prev) => (prev + 1) % events.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [events.length, isPaused, selectedEventIndex]);

  const activeEvent = events.length > 0 ? events[selectedEventIndex] || events[0] : null;

  // Format date utility
  const formatEventDate = (startDate, endDate) => {
    if (!startDate) return null;
    const s = new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (!endDate || endDate === startDate) return s;
    const e = new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${s} – ${e}`;
  };

  // Check if genuine uploaded cover image exists (exclude stock placeholder URLs)
  const hasGenuineBanner =
    activeEvent?.coverImage &&
    typeof activeEvent.coverImage === 'string' &&
    activeEvent.coverImage.trim() !== '' &&
    !activeEvent.coverImage.includes('images.unsplash.com');

  // Normalize squad size label to avoid redundant "Players Players"
  const teamSizeDisplay = (() => {
    if (!activeEvent?.teamSize) return null;
    const raw = String(activeEvent.teamSize).trim();
    return raw.toLowerCase().includes('player') ? raw : `${raw} Players`;
  })();

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans"
    >
      {/* Dynamic Cover Image Backdrop with Theme-Separated Directional Scrim */}
      {hasGenuineBanner && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={activeEvent.coverImage}
            alt={activeEvent.title}
            className="w-full h-full object-cover object-center transition-all duration-700
              opacity-100 dark:opacity-80
              brightness-[1] contrast-[1.02]
              dark:brightness-[0.80] dark:contrast-[1.05]"
          />
          {/* Light-mode directional scrim: Soft compact ivory fade from left strictly behind text */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-[45%] bg-gradient-to-r from-[#FAF9F6]/95 via-[#FAF9F6]/60 to-transparent dark:hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6]/85 via-transparent to-transparent sm:hidden dark:hidden" />

          {/* Dark-mode directional scrim: Obsidian fade from left strictly behind text */}
          <div className="hidden dark:block absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-[45%] bg-gradient-to-r from-[#070A13]/95 via-[#070A13]/60 to-transparent" />
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-t from-[#070A13]/85 via-transparent to-transparent sm:hidden" />
        </div>
      )}

      {/* Editorial Content Container */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 py-6 sm:py-10 md:py-12">
        {loading ? (
          <div className="space-y-4 max-w-3xl animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-12 w-3/4 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-20 w-full bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-10 w-64 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
        ) : activeEvent ? (
          /* Dynamic Active Championship Layout */
          <div className="space-y-3.5 sm:space-y-4">
            {/* Top Institutional & Status Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#F4F2F7] dark:bg-white/10 border border-[#E5E1E8] dark:border-white/15 text-[#7156A5] dark:text-[#F3D78A] font-mono uppercase tracking-wider font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A98B57]" />
                {activeEvent.sportName || 'Official Tournament'}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs uppercase tracking-wider font-semibold border ${
                  activeEvent.status === 'Closed'
                    ? 'bg-[#FBEDEF] dark:bg-[#B71C1C]/15 border-[#FFCDD2] dark:border-[#B71C1C]/30 text-[#B71C1C] dark:text-[#FDA4AF]'
                    : activeEvent.status === 'Upcoming'
                    ? 'bg-amber-50 dark:bg-[#A98B57]/15 border-amber-200 dark:border-[#A98B57]/30 text-amber-800 dark:text-[#F3D78A]'
                    : 'bg-[#EDF7F0] dark:bg-[#1B5E20]/20 border-[#C8E6C9] dark:border-[#81C784]/30 text-[#1B5E20] dark:text-[#81C784]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeEvent.status === 'Closed'
                      ? 'bg-[#B71C1C] dark:bg-[#FDA4AF]'
                      : activeEvent.status === 'Upcoming'
                      ? 'bg-[#A98B57] dark:bg-[#F3D78A]'
                      : 'bg-[#1B5E20] dark:bg-[#81C784] animate-pulse'
                  }`}
                />
                {activeEvent.status === 'Closed'
                  ? 'Registration Closed'
                  : activeEvent.status === 'Upcoming'
                  ? 'Upcoming Programme'
                  : 'Registration Open'}
              </span>

              {/* Explicitly labeled Category badge (resolving raw "open" control issue) */}
              {activeEvent.category && (
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-[#F4F2F7] dark:bg-white/5 border border-[#E5E1E8] dark:border-white/10 text-[#686370] dark:text-[#AAA4B8] font-mono text-[11px] font-medium">
                  Category: {activeEvent.category.toUpperCase()}
                </span>
              )}
            </div>

            {/* Main Championship Headline */}
            <div className="space-y-1.5 sm:space-y-2 max-w-2xl">
              <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-white uppercase leading-[1.15]">
                {activeEvent.title}
              </h1>

              {activeEvent.description && (
                <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3">
                  {activeEvent.description}
                </p>
              )}
            </div>

            {/* Event Key Facts Bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] border-t border-[#E5E1E8] dark:border-white/10 max-w-2xl">
              {activeEvent.tournStartDate && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-4 h-4 text-[#A98B57]" />
                  <span className="font-medium text-[#211D2B] dark:text-[#F5F2FA]">
                    {formatEventDate(activeEvent.tournStartDate, activeEvent.tournEndDate)}
                  </span>
                </div>
              )}

              {activeEvent.venue && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MapPin className="w-4 h-4 text-[#A98B57]" />
                  <span>{activeEvent.venue}</span>
                </div>
              )}

              {teamSizeDisplay && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users className="w-4 h-4 text-[#7156A5] dark:text-[#B8A5E5]" />
                  <span>Squad: {teamSizeDisplay}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[#A98B57] dark:text-[#F3D78A] font-semibold">
                  {activeEvent.entryFee ? `Fee: ₹${activeEvent.entryFee}` : 'Entry: Free'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3">
              {activeEvent.status !== 'Closed' && (
                <Link
                  to={`/registration${activeEvent.id ? `?eventId=${activeEvent.id}` : ''}`}
                  className="px-5 py-2.5 rounded-lg bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center gap-2 active:scale-98 min-h-[38px]"
                >
                  <Trophy className="w-4 h-4 text-white" />
                  <span>Register for Event</span>
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </Link>
              )}

              <Link
                to="/schedule"
                className="px-5 py-2.5 rounded-lg bg-[#FFFFFF] dark:bg-white/10 hover:bg-[#F4F2F7] dark:hover:bg-white/20 text-[#211D2B] dark:text-white font-semibold text-xs sm:text-sm border border-[#E5E1E8] dark:border-white/25 hover:border-[#7156A5] dark:hover:border-white/50 transition-all flex items-center gap-2 active:scale-98 min-h-[38px] shadow-2xs"
              >
                <span>Tournament Timetable</span>
                <ArrowRight className="w-4 h-4 text-[#7156A5] dark:text-white/80" />
              </Link>

              <Link
                to="/results"
                className="px-5 py-2.5 rounded-lg bg-transparent hover:bg-slate-200/50 dark:hover:bg-white/5 text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-white font-semibold text-xs sm:text-sm border border-[#E5E1E8] dark:border-white/10 transition-all flex items-center gap-2 min-h-[38px]"
              >
                <span>Match Ledger</span>
              </Link>
            </div>

            {/* Multiple Active Events Selector (if > 1 event exists) */}
            {events.length > 1 && (
              <div className="pt-4 border-t border-[#E5E1E8] dark:border-white/10 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-mono text-[#686370] dark:text-[#AAA4B8] uppercase tracking-wider shrink-0 mr-1 font-medium">
                  Active Tournaments:
                </span>
                {events.map((ev, idx) => (
                  <button
                    key={ev.id || idx}
                    onClick={() => setSelectedEventIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer min-h-[32px] ${
                      idx === selectedEventIndex
                        ? 'bg-[#7156A5] text-white shadow-2xs'
                        : 'bg-[#FFFFFF] dark:bg-white/5 hover:bg-[#F4F2F7] dark:hover:bg-white/10 text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-white/10'
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
          <div className="space-y-4 sm:space-y-5 max-w-3xl">
            {/* Institutional Hierarchy */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A98B57] dark:text-[#F3D78A]">
                <ShieldCheck className="w-4 h-4 text-[#A98B57]" />
                <span>Directorate of Physical Education & Sports • MPGI Kanpur</span>
              </div>

              <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-white uppercase leading-[1.15]">
                Maharana Pratap <br className="hidden sm:inline" />
                Sports Championship
              </h1>
            </div>

            {/* Official Notice */}
            <div className="p-4 sm:p-5 rounded-lg bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] space-y-2 max-w-2xl shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#A98B57]">
                <span className="w-2 h-2 rounded-full bg-[#A98B57]" />
                <span>CHAMPIONSHIP SCHEDULE FORTHCOMING</span>
              </div>
              <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] leading-relaxed">
                Official inter-collegiate tournament fixtures, participant registrations, and court allocations are currently being finalized by the sports committee. Consult the match ledger for historical records or review tournament rules.
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
                className="px-6 py-3 rounded-lg bg-[#FFFFFF] dark:bg-white/10 hover:bg-[#F4F2F7] dark:hover:bg-white/20 text-[#211D2B] dark:text-white font-semibold text-xs sm:text-sm border border-[#E5E1E8] dark:border-white/25 hover:border-[#7156A5] dark:hover:border-white/50 transition-all flex items-center gap-2 active:scale-98 min-h-[44px] shadow-2xs"
              >
                <Trophy className="w-4 h-4 text-[#A98B57] dark:text-[#F3D78A]" />
                <span>Historical Match Ledger</span>
              </Link>
            </div>

            {/* Key Directorate Metrics */}
            <div className="pt-4 border-t border-[#E5E1E8] dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-lg sm:text-xl font-bold font-spatial-display text-[#211D2B] dark:text-white">12</div>
                <div className="text-[#686370] dark:text-[#AAA4B8] text-[11px] mt-0.5">Approved Disciplines</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold font-spatial-display text-[#211D2B] dark:text-white">AKTU</div>
                <div className="text-[#686370] dark:text-[#AAA4B8] text-[11px] mt-0.5">Affiliated Standards</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold font-spatial-display text-[#211D2B] dark:text-white">6 Courts</div>
                <div className="text-[#686370] dark:text-[#AAA4B8] text-[11px] mt-0.5">Indoor & Outdoor Arenas</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold font-spatial-display text-[#211D2B] dark:text-white">Live</div>
                <div className="text-[#686370] dark:text-[#AAA4B8] text-[11px] mt-0.5">Real-time Digital Scoring</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
