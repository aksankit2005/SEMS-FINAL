import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Radio, Users, User, ArrowRight, ChevronRight, ExternalLink } from 'lucide-react';
import { useSportsData } from '../../context/SportsDataContext';
import { coordinatorApi } from '../../services/coordinatorApi';
import { resolveSportKey } from '../../data/sportsConfig';

const TEAM_DISCIPLINES = [
  { key: 'cricket', name: 'Cricket', icon: '🏏', format: 'Squad (11–15 Players)', category: 'T20 Championship' },
  { key: 'football', name: 'Football', icon: '⚽', format: '5v5 Mini Football / Turf', category: 'Inter-College Cup' },
  { key: 'basketball', name: 'Basketball', icon: '🏀', format: '5v5 Full Court', category: 'Arena Trophy' },
  { key: 'volleyball', name: 'Volleyball', icon: '🏐', format: '6v6 Standard Court', category: 'College League' },
  { key: 'kabaddi', name: 'Kabaddi', icon: '🤼', format: '7v7 Pro Mat', category: 'Raid & Defense Trophy' },
  { key: 'kho-kho', name: 'Kho-Kho', icon: '🏃', format: '9v9 Outdoor Field', category: 'Championship' },
  { key: 'tug-of-war', name: 'Tug of War', icon: '🪢', format: '8–10 Players Pull', category: 'Inter-College Pull' },
  { key: 'gully-cricket', name: 'Gully Cricket', icon: '🏏', format: 'Box Cricket (5–8 Players)', category: 'Short-Pitch Trophy' },
];

const INDIVIDUAL_DUO_DISCIPLINES = [
  { key: 'badminton', name: 'Badminton', icon: '🏸', format: 'Singles & Doubles', category: 'Indoor Court' },
  { key: 'table-tennis', name: 'Table Tennis', icon: '🏓', format: 'Singles & Doubles', category: 'ITTF Rules' },
  { key: 'chess', name: 'Chess', icon: '♟️', format: 'Individual Classical / Rapid', category: 'FIDE Swiss / Knockout' },
  { key: 'athletics', name: 'Athletics', icon: '🏃', format: 'Track & Field Heats', category: 'Sprint & Relay' },
];

export const SportsProgrammeSection = () => {
  const { liveMatches } = useSportsData();
  const [publicEvents, setPublicEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPublicEvents = async () => {
      try {
        const events = await coordinatorApi.getPublicEvents().catch(() => []);
        if (isMounted) {
          setPublicEvents(Array.isArray(events) ? events : []);
        }
      } catch (e) {
        if (isMounted) setPublicEvents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPublicEvents();

    const handleUpdate = () => loadPublicEvents();
    window.addEventListener('sems_events_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('sems_events_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Match discipline key to real active event
  const findDisciplineEvent = (sportKey) => {
    return publicEvents.find((e) => resolveSportKey(e) === sportKey && e.status !== 'Draft' && e.status !== 'Cancelled');
  };

  // Check if sport has live match
  const hasLiveMatch = (sportKey) => {
    if (!Array.isArray(liveMatches) || liveMatches.length === 0) return false;
    return liveMatches.some((m) => resolveSportKey(m) === sportKey);
  };

  // Render a single discipline row
  const renderDisciplineRow = (sport) => {
    const isLive = hasLiveMatch(sport.key);
    const event = findDisciplineEvent(sport.key);

    return (
      <div
        key={sport.key}
        className="flex items-center justify-between py-3 px-2 sm:px-3 hover:bg-[#F4F2F7] dark:hover:bg-[#0D101A] transition rounded-md group"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Discipline Icon */}
          <span className="w-8 h-8 rounded-md bg-[#F4F2F7] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] flex items-center justify-center text-base shrink-0">
            {sport.icon}
          </span>

          {/* Discipline Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#211D2B] dark:text-[#F5F2FA] group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors truncate">
                {sport.name}
              </span>

              {/* Dynamic Live Indicator */}
              {isLive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FBEDEF] dark:bg-[#2A0E17] text-[#B71C1C] dark:text-[#FDA4AF] border border-[#FDA4AF]/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B71C1C] dark:bg-[#FDA4AF]" />
                  LIVE
                </span>
              )}
            </div>

            <div className="text-[11px] text-[#686370] dark:text-[#AAA4B8] flex items-center gap-2 mt-0.5">
              <span>{sport.format}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="truncate">{sport.category}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Status / Actions */}
        <div className="flex items-center gap-2.5 shrink-0 pl-2">
          {event ? (
            <div className="text-right">
              {event.status === 'Published' && event.registrationOpen !== false ? (
                <Link
                  to={`/registration?eventId=${event.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white text-[11px] font-semibold transition shadow-2xs"
                >
                  <span>Register</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              ) : event.tournStartDate ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#686370] dark:text-[#AAA4B8]">
                  <Calendar className="w-3 h-3 text-[#A98B57]" />
                  {new Date(event.tournStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#121625] text-[10px] font-mono font-medium text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                  {event.status}
                </span>
              )}
            </div>
          ) : (
            <Link
              to={`/schedule?sport=${sport.key}`}
              className="text-[11px] font-semibold text-[#686370] dark:text-[#AAA4B8] group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition flex items-center gap-1"
            >
              <span>Timetable</span>
              <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="py-12 sm:py-16 bg-[#FFFFFF] dark:bg-[#0D101A] text-[#211D2B] dark:text-[#F5F2FA] border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans">
      <div className="w-full max-w-[1600px] px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 mx-auto">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pb-6 mb-8 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] mb-2">
              <Trophy className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
              <span>Official Tournament Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#211D2B] dark:text-[#F5F2FA] font-spatial-display">
              Sports <span className="text-[#7156A5] dark:text-[#B8A5E5]">Programme</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] mt-1">
              Explore the events included in the current tournament programme.
            </p>
          </div>

          <Link
            to="/schedule"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:border-[#7156A5] dark:hover:border-[#B8A5E5] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-all shadow-2xs"
          >
            <span>View Match Fixtures</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Two Editorial Columns on Desktop (Team Events | Individual and Duo Events) with Hairline Divider */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5E1E8] dark:divide-[rgba(184,165,229,0.16)] items-start">
          
          {/* Column 1: Team Events */}
          <div className="space-y-4 pt-4 lg:pt-0">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7156A5] dark:text-[#B8A5E5]" />
                <h3 className="text-base sm:text-lg font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase">
                  Team Championships
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#686370] dark:text-[#AAA4B8]">
                {TEAM_DISCIPLINES.length} Disciplines
              </span>
            </div>

            <div className="divide-y divide-[#E5E1E8] dark:divide-[rgba(184,165,229,0.12)]">
              {TEAM_DISCIPLINES.map((sport) => renderDisciplineRow(sport))}
            </div>
          </div>

          {/* Column 2: Individual & Duo Events */}
          <div className="space-y-4 pt-8 lg:pt-0 lg:pl-12">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#A98B57] dark:text-[#D2AB45]" />
                <h3 className="text-base sm:text-lg font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase">
                  Individual & Duo Events
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#686370] dark:text-[#AAA4B8]">
                {INDIVIDUAL_DUO_DISCIPLINES.length} Disciplines
              </span>
            </div>

            <div className="divide-y divide-[#E5E1E8] dark:divide-[rgba(184,165,229,0.12)]">
              {INDIVIDUAL_DUO_DISCIPLINES.map((sport) => renderDisciplineRow(sport))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
