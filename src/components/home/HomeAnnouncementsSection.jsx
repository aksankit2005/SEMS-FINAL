import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronRight, FileText, Calendar, Paperclip, Sparkles } from 'lucide-react';
import { useSportsData } from '../../context/SportsDataContext';
import { ANNOUNCEMENTS_DATA } from '../../data/announcementsData';

export const HomeAnnouncementsSection = () => {
  const { announcements } = useSportsData();

  // Combine real context announcements with fallback mock data
  const displayAnnouncements = (announcements && announcements.length > 0)
    ? announcements.slice(0, 3)
    : (ANNOUNCEMENTS_DATA || []).slice(0, 3);

  return (
    <section className="py-10 sm:py-12 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full max-w-[1440px] px-3 sm:px-5 lg:px-6 xl:px-8 mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-wider mb-2">
              <Bell className="w-3.5 h-3.5 text-orange-500 animate-bounce" /> Official Directorate Alerts
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Latest <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">Announcements</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Important circulars, rule guidelines, and official tournament notices
            </p>
          </div>

          <Link
            to="/announcements"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-orange-500 dark:hover:bg-orange-500 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <span>All Circulars</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Announcements Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {displayAnnouncements.length === 0 ? (
            <div className="col-span-full py-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <Bell className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Announcements Published Yet</p>
            </div>
          ) : (
            displayAnnouncements.map((item) => (
              <Link
                key={item.id || item.title}
                to="/announcements"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Category & Date */}
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">
                      {item.category || 'Official Notice'}
                    </span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.date || item.createdAt || 'Aug 2026'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-orange-500 transition line-clamp-2 leading-snug mb-2">
                    {item.title}
                  </h3>

                  {/* Excerpt Summary */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {item.summary || item.content || 'Click to view full announcement details and downloadable circular attachments.'}
                  </p>
                </div>

                {/* Footer action badge */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  {item.attachment ? (
                    <span className="flex items-center gap-1.5 text-blue-500 font-semibold text-[11px]">
                      <Paperclip className="w-3.5 h-3.5" /> PDF Attached
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <FileText className="w-3.5 h-3.5" /> APEX Sports Dept
                    </span>
                  )}
                  <span className="text-orange-500 group-hover:translate-x-1 transition duration-200 flex items-center gap-0.5">
                    Read Notice <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </section>
  );
};
