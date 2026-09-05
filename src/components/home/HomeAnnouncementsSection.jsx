import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ArrowRight, FileText, Calendar, Paperclip } from 'lucide-react';
import { useSportsData } from '../../context/SportsDataContext';

export const HomeAnnouncementsSection = () => {
  const { announcements } = useSportsData();

  // Only display authoritative announcements from context/backend
  const displayAnnouncements = Array.isArray(announcements) && announcements.length > 0
    ? announcements.slice(0, 3)
    : [];

  return (
    <section className="py-12 sm:py-14 bg-[#F4F2F7] dark:bg-[#08090E] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-4 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#A98B57] dark:text-[#D2AB45] mb-1.5">
              <Bell className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
              <span>Official Directorate Circulars</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#211D2B] dark:text-[#F5F2FA] tracking-tight font-spatial-display">
              Latest <span className="text-[#7156A5] dark:text-[#B8A5E5]">Announcements</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] mt-1">
              Official circulars, regulatory guidelines, and championship notices
            </p>
          </div>

          <Link
            to="/announcements"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:border-[#7156A5] dark:hover:border-[#B8A5E5] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-all shadow-2xs"
          >
            <span>All Circulars</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Announcements Journal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayAnnouncements.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
              <Bell className="w-8 h-8 text-[#686370] dark:text-[#AAA4B8] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA]">No Announcements Published</p>
              <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-1">Directives and circulars will appear here once released</p>
            </div>
          ) : (
            displayAnnouncements.map((item) => (
              <Link
                key={item.id || item.title}
                to="/announcements"
                className="bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg p-5 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/40 dark:hover:border-[#8B5CF6]/40 transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  {/* Category & Date */}
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FAF9F6] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                      {item.category || 'Notice'}
                    </span>
                    <span className="text-[#686370] dark:text-[#AAA4B8] text-[11px] flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-[#686370] dark:text-[#AAA4B8]" />
                      {item.date || item.createdAt || 'Aug 2026'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-[#211D2B] dark:text-[#F5F2FA] group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors line-clamp-2 leading-snug mb-2 font-spatial-display">
                    {item.title}
                  </h3>

                  {/* Excerpt Summary */}
                  <p className="text-xs text-[#686370] dark:text-[#AAA4B8] line-clamp-3 leading-relaxed">
                    {item.summary || item.content || 'Click to view full announcement details and downloadable circular attachments.'}
                  </p>
                </div>

                {/* Footer action */}
                <div className="mt-5 pt-3 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center justify-between text-xs font-semibold text-[#686370] dark:text-[#AAA4B8]">
                  {item.attachment ? (
                    <span className="flex items-center gap-1 text-[#7156A5] dark:text-[#B8A5E5] text-[11px]">
                      <Paperclip className="w-3.5 h-3.5" /> PDF Document
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-[#686370] dark:text-[#AAA4B8]">
                      <FileText className="w-3.5 h-3.5" /> APEX Sports Directorate
                    </span>
                  )}
                  <span className="text-[#7156A5] dark:text-[#B8A5E5] group-hover:translate-x-0.5 transition-transform duration-150 flex items-center gap-0.5">
                    Read <ArrowRight className="w-3 h-3" />
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
