import React, { useState } from 'react';
import { Bell, Search, ChevronRight, X, FileText, Download, Eye, Paperclip } from 'lucide-react';
import { useSportsData } from '../context/SportsDataContext';

export const AnnouncementsPage = () => {
  const { announcements } = useSportsData();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [activeModal, setActiveModal] = useState(null);

  const categories = ['All', 'Schedule', 'Rules & Guidelines', 'Emergency & Safety', 'Event Highlight'];

  const filteredAnnouncements = (announcements || []).filter((a) => {
    const title = (a.title || '').toLowerCase();
    const summary = (a.summary || a.content || '').toLowerCase();
    const q = query.toLowerCase();
    const matchesQuery = title.includes(q) || summary.includes(q);
    const matchesCat = selectedCat === 'All' || a.category === selectedCat;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
            <Bell className="w-4 h-4 text-orange-500 animate-bounce" /> Official Broadcast Center
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            News & <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">Announcements</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Stay informed with real-time tournament alerts, schedule updates, and official PDF circulars published by Admin & Coordinators.
          </p>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCat(c)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCat === c
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* News List */}
        <div className="space-y-6">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
              <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Announcements Available</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">There are currently no official broadcast notices posted matching your criteria.</p>
            </div>
          ) : (
            filteredAnnouncements.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveModal(item)}
                className="group bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {item.category}
                    </span>

                    {item.isImportant && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                        IMPORTANT NOTICE
                      </span>
                    )}

                    {item.attachments && item.attachments.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        <span>{item.attachments.length} PDF Attachment{item.attachments.length > 1 ? 's' : ''}</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400">{item.date} • {item.time || '10:00 AM'}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {item.summary || item.content}
                  </p>
                </div>

                <span className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-auto pointer-events-none">
                  <span>Read Full Circular</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Detail Modal with PDF View & Download */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md text-slate-900 dark:text-white animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{activeModal.category}</span>
                <h3 className="text-lg sm:text-xl font-black mt-1 leading-snug">{activeModal.title}</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <span>Issued by {activeModal.author || 'System Administrator'}</span>
              <span>{activeModal.date} {activeModal.time ? `• ${activeModal.time}` : ''}</span>
            </div>

            {/* Announcement Full Content */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm leading-relaxed border border-slate-200 dark:border-slate-800 whitespace-pre-line text-slate-700 dark:text-slate-300">
              {activeModal.content || activeModal.summary}
            </div>

            {/* ATTACHED PDF DOCUMENTS SECTION FOR USER */}
            {activeModal.attachments && activeModal.attachments.length > 0 ? (
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-amber-500" />
                  <span>Official PDF Document Attachments ({activeModal.attachments.length})</span>
                </h4>

                <div className="space-y-2">
                  {activeModal.attachments.map((pdf) => (
                    <div
                      key={pdf.id || pdf.name}
                      className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-500/20">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate" title={pdf.name}>{pdf.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{pdf.size || 'PDF Document'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {pdf.url && pdf.url !== '#' ? (
                          <>
                            <a
                              href={pdf.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 transition-colors border border-blue-500/20"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View PDF</span>
                            </a>
                            <a
                              href={pdf.url}
                              download={pdf.name || 'Announcement_Document.pdf'}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 transition-colors border border-emerald-500/20"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Document File Attached</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-800">
                ℹ️ No PDF documents attached to this notice.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
