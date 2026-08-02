import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronRight, Bell } from 'lucide-react';
import { LEADERBOARD_DATA } from '../../data/leaderboardData';
import { ANNOUNCEMENTS_DATA } from '../../data/announcementsData';

export const TournamentHighlights = () => {
  const topPodium = LEADERBOARD_DATA.slice(0, 3);
  const latestNews = ANNOUNCEMENTS_DATA.slice(0, 3);

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left Column: Championship Leaderboard Podium Preview */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-soft">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Inter-College Standings</h3>
                </div>
                <Link
                  to="/leaderboard"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Full Leaderboard <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Top 3 Podium Mini Showcase / Empty State */}
              {topPodium.length < 3 ? (
                <div className="my-8 py-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">No Standings Available Yet</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Leaderboard will be updated as matches conclude.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 my-6 text-center items-end">
                  {/* Silver - 2nd */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center shadow-xs">
                    <div className="text-2xl mb-1">{topPodium[1].logo}</div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mb-1">2nd Silver</span>
                    <div className="text-xs font-bold truncate max-w-full text-slate-900 dark:text-white">{topPodium[1].code}</div>
                    <div className="text-xs text-orange-500 font-black">{topPodium[1].totalPoints} Pts</div>
                  </div>

                  {/* Gold - 1st (Taller) */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-orange-500/10 to-white dark:to-slate-900 border-2 border-orange-500 flex flex-col items-center shadow-md scale-105">
                    <div className="text-3xl mb-1">🏆</div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-orange-500 text-white mb-1">1st Champion</span>
                    <div className="text-sm font-black truncate max-w-full text-orange-600 dark:text-orange-400">{topPodium[0].code}</div>
                    <div className="text-sm text-orange-500 font-black">{topPodium[0].totalPoints} Pts</div>
                  </div>

                  {/* Bronze - 3rd */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center shadow-xs">
                    <div className="text-2xl mb-1">{topPodium[2].logo}</div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-900/20 text-amber-600 dark:text-amber-400 mb-1">3rd Bronze</span>
                    <div className="text-xs font-bold truncate max-w-full text-slate-900 dark:text-white">{topPodium[2].code}</div>
                    <div className="text-xs text-orange-500 font-black">{topPodium[2].totalPoints} Pts</div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Points System: Gold = 5 Pts | Silver = 3 Pts | Bronze = 1 Pt
            </p>
          </div>

          {/* Right Column: Latest Announcements & Notices */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-soft">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Latest Announcements</h3>
                </div>
                <Link
                  to="/announcements"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  All News <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {latestNews.length === 0 ? (
                  <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">No Announcements Broadcasted</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Circulars will be listed here when published.</p>
                  </div>
                ) : (
                  latestNews.map((news) => (
                    <Link
                      key={news.id}
                      to="/announcements"
                      className="block p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition group shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                          {news.category}
                        </span>
                        <span className="text-slate-400">{news.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                        {news.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                        {news.summary}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-400">
                Official notices broadcast by APEX Sports Directorate.
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
