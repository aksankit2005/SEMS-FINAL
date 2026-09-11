import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Activity } from 'lucide-react';
import { useSportsData } from '../../context/SportsDataContext';
import { coordinatorApi, sortLiveMatches } from '../../services/coordinatorApi';

export const HomeLiveSection = () => {
  const { liveMatches: contextMatches } = useSportsData();
  const [liveList, setLiveList] = useState(() => (Array.isArray(contextMatches) ? contextMatches : []));

  useEffect(() => {
    let isMounted = true;

    const fetchLive = async () => {
      try {
        const publicLive = await coordinatorApi.getPublicLiveMatches().catch(() => []);
        if (isMounted && Array.isArray(publicLive)) {
          const active = publicLive.filter((m) => {
            const s = (m?.status || '').toLowerCase();
            return m && m.id && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active');
          });
          setLiveList(sortLiveMatches(active));
        }
      } catch (e) {
        // Fallback to context matches
        if (isMounted && Array.isArray(contextMatches)) {
          const active = contextMatches.filter((m) => {
            const s = (m?.status || '').toLowerCase();
            return m && m.id && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active');
          });
          setLiveList(sortLiveMatches(active));
        }
      }
    };

    fetchLive();

    // Poll live matches every 6 seconds for instantaneous telemetry
    const interval = setInterval(fetchLive, 6000);

    const handleUpdate = () => fetchLive();
    window.addEventListener('sems_matches_updated', handleUpdate);
    window.addEventListener('sems_live_match_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('sems_matches_updated', handleUpdate);
      window.removeEventListener('sems_live_match_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [contextMatches]);

  const activeMatches = (Array.isArray(liveList) && liveList.length > 0)
    ? liveList
    : (Array.isArray(contextMatches) ? contextMatches : []).filter((m) => {
        const s = (m?.status || '').toLowerCase();
        return m && m.id && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active');
      });

  // If no live matches are currently active/running, completely hide this entire section from the DOM
  if (activeMatches.length === 0) {
    return null;
  }

  return (
    <section id="home-live-arena" className="py-8 sm:py-12 bg-[#FAF9F6] dark:bg-[#070A13] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans animate-fade-in">
      <div className="w-full max-w-[1600px] px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 mx-auto space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pb-4 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B71C1C] dark:bg-[#FDA4AF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B71C1C] dark:bg-[#FDA4AF]" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B71C1C] dark:text-[#FDA4AF]">
                Real-Time Arena Broadcast
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase mt-1">
              Live <span className="text-[#7156A5] dark:text-[#B8A5E5]">Matches</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] mt-0.5">
              Live court telemetry, instantaneous scoring, and match updates across all active arenas
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#FBEDEF] dark:bg-[#2A0E17] text-[#B71C1C] dark:text-[#FDA4AF] border border-[#FDA4AF]/40">
              {activeMatches.length} {activeMatches.length === 1 ? 'Match Live' : 'Matches Live'}
            </span>

            <Link
              to="/live"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:border-[#7156A5] dark:hover:border-[#B8A5E5] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-all shadow-2xs"
            >
              <span>Open Live Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Matches Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeMatches.map((match) => {
            const sportName = match.sportName || match.sport || 'Live Event';
            const court = match.tableNumber || match.venue || 'Main Court';
            const team1Name = typeof match.team1 === 'object' ? (match.team1?.name || 'Team 1') : String(match.team1 || 'Team 1');
            const team2Name = typeof match.team2 === 'object' ? (match.team2?.name || 'Team 2') : String(match.team2 || 'Team 2');
            const team1Score = typeof match.team1 === 'object' ? match.team1?.score : match.score1;
            const team2Score = typeof match.team2 === 'object' ? match.team2?.score : match.score2;
            const statusInfo = match.currentInfo || match.status || 'IN PLAY';

            return (
              <Link
                key={match.id}
                to="/live"
                className="group relative bg-white dark:bg-[#0D101A] rounded-xl p-5 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/50 dark:hover:border-[#8B5CF6]/50 transition-all shadow-2xs flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Pill: Sport & Live Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7156A5] dark:bg-[#B8A5E5]" />
                      {sportName}
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FBEDEF] dark:bg-[#2A0E17] text-[#B71C1C] dark:text-[#FDA4AF] border border-[#FDA4AF]/40 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B71C1C] dark:bg-[#FDA4AF]" />
                      LIVE
                    </span>
                  </div>

                  {/* Venue & Round Info */}
                  <div className="text-[11px] text-[#686370] dark:text-[#AAA4B8] font-mono flex items-center justify-between mb-3">
                    <span>{court}</span>
                    <span className="font-semibold text-[#A98B57] dark:text-[#D2AB45]">{statusInfo}</span>
                  </div>

                  {/* Teams & Real-Time Scores Display */}
                  <div className="space-y-2 py-2 border-y border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-bold text-[#211D2B] dark:text-[#F5F2FA] truncate group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors">
                        {team1Name}
                      </span>
                      {team1Score !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-[#F4F2F7] dark:bg-[#121625] font-mono font-bold text-sm sm:text-base text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] shrink-0">
                          {team1Score}
                        </span>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-bold text-[#211D2B] dark:text-[#F5F2FA] truncate group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors">
                        {team2Name}
                      </span>
                      {team2Score !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-[#F4F2F7] dark:bg-[#121625] font-mono font-bold text-sm sm:text-base text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] shrink-0">
                          {team2Score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="mt-4 pt-2 flex items-center justify-between text-xs font-semibold text-[#686370] dark:text-[#AAA4B8]">
                  <span className="flex items-center gap-1 text-[11px] text-[#A98B57] dark:text-[#D2AB45]">
                    <Activity className="w-3.5 h-3.5" /> Instant Telemetry
                  </span>
                  <span className="text-[#7156A5] dark:text-[#B8A5E5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Watch Live <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
