import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowRight, Trophy, Crown, ChevronRight, Activity } from 'lucide-react';
import { useSportsData } from '../../context/SportsDataContext';
import { apiUrl } from '../../services/apiConfig';

const normalizeStandings = (data) => {
  if (!Array.isArray(data)) return [];
  return data
    .filter((c) => String(c.code || c.id || '').toUpperCase() !== 'EXTERNAL')
    .map((item) => ({
      id: String(item.id || item.code || item.college || ''),
      code: String(item.code || item.id || ''),
      college: String(item.college || item.name || item.code || 'College'),
      gold: Number(item.gold ?? item.wins ?? item.goldCount ?? item.firsts ?? 0),
      silver: Number(item.silver ?? item.runnerUps ?? item.silverCount ?? item.seconds ?? 0),
      totalPoints: Number(item.totalPoints ?? item.points ?? 0),
      rank: Number(item.rank || 0),
    }));
};

export const LiveTicker = () => {
  const { liveMatches, leaderboard } = useSportsData();
  const [standings, setStandings] = useState(() => (Array.isArray(leaderboard) && leaderboard.length > 0 ? normalizeStandings(leaderboard) : []));

  useEffect(() => {
    if (Array.isArray(leaderboard) && leaderboard.length > 0) {
      setStandings(normalizeStandings(leaderboard));
    }
  }, [leaderboard]);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await fetch(apiUrl('/leaderboard'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setStandings(normalizeStandings(data));
          }
        }
      } catch (e) {
        console.warn('LiveTicker leaderboard fetch warning:', e.message);
      }
    };

    const handler = () => fetchStandings();
    window.addEventListener('sems_leaderboard_updated', handler);
    return () => {
      window.removeEventListener('sems_leaderboard_updated', handler);
    };
  }, []);

  const topStandings = standings.slice(0, 4);

  return (
    <section className="py-8 sm:py-12 bg-[#FAF9F6] dark:bg-[#070A13] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans">
      <div className="w-full max-w-[1600px] px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 mx-auto">
        
        {/* Open Two-Column Spread with Vertical Separator on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5E1E8] dark:divide-[rgba(184,165,229,0.16)] items-start">
          
          {/* Column 1: Live Matches */}
          <div className="space-y-4 pt-4 lg:pt-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B71C1C] dark:bg-[#FDA4AF] animate-pulse" />
                  <h3 className="text-xl sm:text-2xl font-normal font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase">
                    Live Matches
                  </h3>
                </div>
                <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-0.5">Real-time match scores & court updates</p>
              </div>

              <Link
                to="/live"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Match Rows List */}
            {(!liveMatches || liveMatches.length === 0) ? (
              <div className="py-10 text-center bg-white dark:bg-[#0D101A] rounded-lg border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
                <Radio className="w-7 h-7 text-[#686370] dark:text-[#AAA4B8] mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA]">No Matches In Progress</p>
                <p className="text-[11px] text-[#686370] dark:text-[#AAA4B8] mt-0.5">Live scores will stream here once tournament fixtures begin.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E1E8] dark:divide-[rgba(184,165,229,0.12)] border-y border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                {liveMatches.slice(0, 4).map((match) => (
                  <Link
                    key={match.id}
                    to="/live"
                    className="block py-3 px-2 hover:bg-[#F4F2F7] dark:hover:bg-[#0D101A] transition rounded-md group"
                  >
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-[#B71C1C] dark:text-[#FDA4AF] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B71C1C] dark:bg-[#FDA4AF]" />
                        {match.sportName || match.sport || 'Live Event'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
                        {match.currentInfo || match.status || 'LIVE'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA]">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="truncate">
                          {typeof match.team1 === 'object' ? match.team1?.name : match.team1}
                        </span>
                        {match.team1?.score !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-[#F4F2F7] dark:bg-[#121625] text-xs font-mono font-bold text-[#7156A5] dark:text-[#B8A5E5] shrink-0">
                            {match.team1.score}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono font-normal text-[#686370] dark:text-[#AAA4B8] px-3 shrink-0">VS</span>

                      <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                        {match.team2?.score !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-[#F4F2F7] dark:bg-[#121625] text-xs font-mono font-bold text-[#7156A5] dark:text-[#B8A5E5] shrink-0">
                            {match.team2.score}
                          </span>
                        )}
                        <span className="truncate">
                          {typeof match.team2 === 'object' ? match.team2?.name : match.team2}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {Array.isArray(liveMatches) && liveMatches.length > 0 && (
              <div className="pt-2 flex items-center justify-between text-xs text-[#686370] dark:text-[#AAA4B8]">
                <span>Active: <strong className="text-[#1B5E20] dark:text-[#81C784] font-semibold">{liveMatches.length} Match(es) Live</strong></span>
                <Link to="/live" className="font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline flex items-center gap-1">
                  Open Live Arena <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Column 2: Leaderboard Standings */}
          <div className="space-y-4 pt-6 lg:pt-0 lg:pl-12">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#A98B57] dark:text-[#D2AB45]" />
                  <h3 className="text-xl sm:text-2xl font-normal font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase">
                    Tournament Leaderboard
                  </h3>
                </div>
                <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-0.5">Inter-college points & medal standings</p>
              </div>

              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline"
              >
                <span>Full Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Standings Rows List */}
            {topStandings.length === 0 ? (
              <div className="py-10 text-center bg-white dark:bg-[#0D101A] rounded-lg border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
                <Trophy className="w-7 h-7 text-[#686370] dark:text-[#AAA4B8] mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA]">No Medal Standings Yet</p>
                <p className="text-[11px] text-[#686370] dark:text-[#AAA4B8] mt-0.5">Standings will update automatically as match results conclude.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E1E8] dark:divide-[rgba(184,165,229,0.12)] border-y border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                {topStandings.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 px-2 hover:bg-[#F4F2F7] dark:hover:bg-[#0D101A] transition rounded-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                          idx === 0
                            ? 'bg-[#A98B57]/15 text-[#A98B57] dark:text-[#F3D78A] border border-[#A98B57]/30'
                            : idx === 1
                            ? 'bg-slate-200 dark:bg-slate-800 text-[#211D2B] dark:text-[#F5F2FA]'
                            : idx === 2
                            ? 'bg-amber-900/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'text-[#686370] dark:text-[#AAA4B8]'
                        }`}
                      >
                        {idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA] truncate">
                          {item.college}
                        </div>
                        <div className="text-[10px] text-[#686370] dark:text-[#AAA4B8]">
                          {item.code} • 🥇 {item.gold} Gold • 🥈 {item.silver} Silver
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span className="text-sm font-mono font-bold text-[#A98B57] dark:text-[#D2AB45]">
                        {item.totalPoints} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-[#686370] dark:text-[#AAA4B8]">
              <span>Rule: 🥇 1st = 5 pts • 🥈 2nd = 3 pts</span>
              <Link to="/leaderboard" className="font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline flex items-center gap-1">
                View All Colleges <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
