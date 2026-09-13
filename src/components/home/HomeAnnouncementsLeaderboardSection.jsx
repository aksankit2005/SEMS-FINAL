import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Trophy, ArrowRight, ChevronRight, FileText, Calendar, Paperclip, Crown, Sparkles } from 'lucide-react';
import { useSportsData } from '../../context/SportsDataContext';
import { apiUrl } from '../../services/apiConfig';
import { ALL_COLLEGES } from '../../services/superCoordinatorApi';

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

const computeStandings = () => {
  let entries = [];
  try {
    const stored = localStorage.getItem('sems_super_coord_leaderboard');
    if (stored) entries = JSON.parse(stored);
  } catch (e) {}

  const tally = {};
  entries.forEach((entry) => {
    const winner = entry.winnerCollege;
    const runnerUp = entry.runnerUpCollege;
    if (winner) {
      if (!tally[winner]) tally[winner] = { gold: 0, silver: 0 };
      tally[winner].gold += 1;
    }
    if (runnerUp) {
      if (!tally[runnerUp]) tally[runnerUp] = { gold: 0, silver: 0 };
      tally[runnerUp].silver += 1;
    }
  });

  const standings = ALL_COLLEGES
    .filter((c) => String(c.id || '').toUpperCase() !== 'EXTERNAL')
    .map((college) => {
      const counts = tally[college.id] || { gold: 0, silver: 0 };
      return {
        id: String(college.id || ''),
        college: String(college.name || college.id || ''),
        code: String(college.id || ''),
        gold: Number(counts.gold || 0),
        silver: Number(counts.silver || 0),
        totalPoints: Number((counts.gold || 0) * 5 + (counts.silver || 0) * 3),
      };
    });

  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    return String(a.college || '').localeCompare(String(b.college || ''));
  });

  return standings;
};

export const HomeAnnouncementsLeaderboardSection = () => {
  const { announcements, leaderboard } = useSportsData();

  const [standings, setStandings] = useState(() => (
    Array.isArray(leaderboard) && leaderboard.length > 0
      ? normalizeStandings(leaderboard)
      : []
  ));

  useEffect(() => {
    if (Array.isArray(leaderboard) && leaderboard.length > 0) {
      setStandings(normalizeStandings(leaderboard));
    }
  }, [leaderboard]);

  useEffect(() => {
    let isMounted = true;
    const fetchStandings = async () => {
      try {
        const res = await fetch(apiUrl('/leaderboard'));
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setStandings(normalizeStandings(data));
            return;
          }
        }
      } catch (e) {}

      if (isMounted && leaderboard && leaderboard.length > 0) {
        setStandings(normalizeStandings(leaderboard));
        return;
      }

      if (isMounted) {
        setStandings(normalizeStandings(computeStandings()));
      }
    };

    fetchStandings();

    const handler = () => fetchStandings();
    window.addEventListener('sems_leaderboard_updated', handler);
    window.addEventListener('storage', handler);

    return () => {
      isMounted = false;
      window.removeEventListener('sems_leaderboard_updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, [leaderboard]);

  const displayAnnouncements = Array.isArray(announcements) && announcements.length > 0
    ? announcements.slice(0, 3)
    : [];

  const topStandings = standings.slice(0, 5);

  return (
    <section className="py-8 sm:py-16 bg-[#F4F2F7] dark:bg-[#08090E] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans">
      <div className="w-full max-w-[1600px] px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 mx-auto">
        
        {/* Two-Column Grid on Desktop (Left: Announcements, Right: Leaderboard) / Vertical Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5E1E8] dark:divide-[rgba(184,165,229,0.16)] items-start">
          
          {/* ========================================================================= */}
          {/* COLUMN 1: LATEST ANNOUNCEMENT                                             */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2 lg:pt-0">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#A98B57] dark:text-[#D2AB45]" />
                  <h3 className="text-lg sm:text-2xl font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase">
                    Latest <span className="text-[#7156A5] dark:text-[#B8A5E5]">Announcements</span>
                  </h3>
                </div>
                <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-0.5">
                  Official circulars, regulatory guidelines, and championship notices
                </p>
              </div>

              <Link
                to="/announcements"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline shrink-0"
              >
                <span>All Circulars</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Announcements List */}
            {displayAnnouncements.length === 0 ? (
              <div className="py-12 text-center bg-white dark:bg-[#0D101A] rounded-xl border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs">
                <Bell className="w-8 h-8 text-[#686370] dark:text-[#AAA4B8] mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA]">No Announcements Published</p>
                <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-1">Directives and circulars will appear here once released by the directorate.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {displayAnnouncements.map((item) => (
                  <Link
                    key={item.id || item.title}
                    to="/announcements"
                    className="block p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/50 dark:hover:border-[#8B5CF6]/50 transition-all group shadow-2xs"
                  >
                    {/* Category & Date Header */}
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FAF9F6] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                        {item.category || 'Official Notice'}
                      </span>
                      <span className="text-[#686370] dark:text-[#AAA4B8] text-[11px] flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-[#686370] dark:text-[#AAA4B8]" />
                        {item.date || item.createdAt || 'Aug 2026'}
                      </span>
                    </div>

                    {/* Announcement Title */}
                    <h4 className="text-sm sm:text-base font-bold text-[#211D2B] dark:text-[#F5F2FA] group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors line-clamp-2 leading-snug mb-1.5 font-spatial-display">
                      {item.title}
                    </h4>

                    {/* Excerpt Summary */}
                    <p className="text-xs text-[#686370] dark:text-[#AAA4B8] line-clamp-2 leading-relaxed">
                      {item.summary || item.content || 'Click to view full announcement details and downloadable circular attachments.'}
                    </p>

                    {/* Bottom Indicator */}
                    <div className="mt-3 pt-2.5 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center justify-between text-xs font-semibold text-[#686370] dark:text-[#AAA4B8]">
                      {item.attachment ? (
                        <span className="flex items-center gap-1 text-[#7156A5] dark:text-[#B8A5E5] text-[11px]">
                          <Paperclip className="w-3 h-3" /> PDF Document Attached
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-[#686370] dark:text-[#AAA4B8]">
                          <FileText className="w-3 h-3" /> APEX Sports Directorate
                        </span>
                      )}
                      <span className="text-[#7156A5] dark:text-[#B8A5E5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Read Circular <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: LEADERBOARD                                                     */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-6 lg:pt-0 lg:pl-12">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#A98B57] dark:text-[#D2AB45]" />
                  <h3 className="text-lg sm:text-2xl font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase">
                    Tournament <span className="text-[#7156A5] dark:text-[#B8A5E5]">Leaderboard</span>
                  </h3>
                </div>
                <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-0.5">
                  Inter-college medal standings &amp; cumulative championship points
                </p>
              </div>

              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline shrink-0"
              >
                <span>Full Standings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Standings List */}
            {topStandings.length === 0 ? (
              <div className="py-12 text-center bg-white dark:bg-[#0D101A] rounded-xl border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs">
                <Trophy className="w-8 h-8 text-[#686370] dark:text-[#AAA4B8] mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA]">No Medal Standings Yet</p>
                <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-1">Standings will update automatically as match results conclude.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0D101A] rounded-xl border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs overflow-hidden divide-y divide-[#E5E1E8] dark:divide-[rgba(184,165,229,0.12)]">
                {topStandings.map((item, idx) => {
                  const isFirst = idx === 0;
                  const isSecond = idx === 1;
                  const isThird = idx === 2;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3.5 sm:p-4 hover:bg-[#FAF9F6] dark:hover:bg-[#121625] transition-colors ${
                        isFirst ? 'bg-amber-50/40 dark:bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                            isFirst
                              ? 'bg-[#A98B57] text-white dark:bg-[#D2AB45] dark:text-[#070A13] shadow-xs'
                              : isSecond
                              ? 'bg-slate-200 text-[#211D2B] dark:bg-slate-800 dark:text-[#F5F2FA]'
                              : isThird
                              ? 'bg-amber-900/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300'
                              : 'bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]'
                          }`}
                        >
                          {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : idx + 1}
                        </span>

                        {/* College info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-[#211D2B] dark:text-[#F5F2FA] truncate">
                              {item.college}
                            </span>
                            {isFirst && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#A98B57]/15 dark:bg-[#D2AB45]/20 text-[#A98B57] dark:text-[#F3D78A] border border-[#A98B57]/30">
                                <Crown className="w-2.5 h-2.5" /> LEADER
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[11px] text-[#686370] dark:text-[#AAA4B8] font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{item.code}</span>
                            <span>•</span>
                            <span>🥇 {item.gold} Gold</span>
                            <span>•</span>
                            <span>🥈 {item.silver} Silver</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Points */}
                      <div className="text-right shrink-0 pl-3">
                        <div className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                          isFirst ? 'text-[#A98B57] dark:text-[#D2AB45]' : 'text-[#7156A5] dark:text-[#B8A5E5]'
                        }`}>
                          {item.totalPoints}
                        </div>
                        <div className="text-[9px] font-mono uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8]">
                          pts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Standings Footer Action */}
            <div className="pt-2 flex items-center justify-between text-xs text-[#686370] dark:text-[#AAA4B8]">
              <span className="font-mono text-[11px]">Rule: 🥇 1st = 5 pts • 🥈 2nd = 3 pts</span>
              <Link
                to="/leaderboard"
                className="font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline flex items-center gap-1 text-xs"
              >
                <span>Complete Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
