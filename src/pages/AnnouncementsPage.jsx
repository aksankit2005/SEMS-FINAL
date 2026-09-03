import React, { useState } from 'react';
import { 
  Bell, Search, ChevronRight, X, FileText, Download, Eye, Paperclip,
  Calendar, BookOpen, AlertTriangle, Sparkles, Filter, CheckCircle2
} from 'lucide-react';
import { useSportsData } from '../context/SportsDataContext';

export const getCategoryMeta = (category) => {
  switch (category) {
    case 'Schedule':
      return {
        label: 'Schedule',
        icon: Calendar,
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        bannerTitle: 'Match Schedules, Fixtures & Timing Updates',
        bannerDesc: 'Official tournament fixtures, court allocations, report timings, and venue updates.'
      };
    case 'Rules & Guidelines':
      return {
        label: 'Rules & Guidelines',
        icon: BookOpen,
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        bannerTitle: 'Tournament Rules, Eligibility & Directives',
        bannerDesc: 'Official rulebooks, squad size guidelines, code of conduct, and coordinator instructions.'
      };
    case 'Emergency & Safety':
      return {
        label: 'Emergency & Safety',
        icon: AlertTriangle,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        bannerTitle: 'Emergency Protocols, Medical & Safety Directives',
        bannerDesc: 'Urgent weather alerts, first-aid stations, evacuation protocols, and medical notices.'
      };
    case 'Event Highlight':
      return {
        label: 'Event Highlight',
        icon: Sparkles,
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        bannerTitle: 'Tournament Highlights & Special Broadcasts',
        bannerDesc: 'Opening ceremony bulletins, chief guest announcements, and marquee matches.'
      };
    default:
      return {
        label: category || 'Official Notice',
        icon: Bell,
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        bannerTitle: 'Official Directorate Announcements',
        bannerDesc: 'Verified broadcasts and official PDF circulars issued for APEX 2026.'
      };
  }
};

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

  const handleViewPdf = (pdf) => {
    if (!pdf || !pdf.url || pdf.url === '#') return;
    const url = pdf.url;
    if (url.startsWith('data:application/pdf') || url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const base64Str = parts[1] || parts[0];
        const binaryStr = atob(base64Str);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const newWin = window.open(blobUrl, '_blank');
        if (newWin) newWin.focus();
      } catch (e) {
        console.warn('Blob conversion error, falling back to direct window.open', e);
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  const handleDownloadPdf = (pdf) => {
    if (!pdf || !pdf.url || pdf.url === '#') return;
    const fileName = pdf.name || 'Announcement_Document.pdf';
    const url = pdf.url;

    if (url.startsWith('data:application/pdf') || url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const base64Str = parts[1] || parts[0];
        const binaryStr = atob(base64Str);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } catch (e) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map((c) => {
              const meta = getCategoryMeta(c);
              const Icon = meta.icon;
              const count = c === 'All'
                ? (announcements || []).length
                : (announcements || []).filter(a => a.category === c).length;
              const isSelected = selectedCat === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCat(c)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
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

        {/* Specific Section Banner when filtered */}
        {selectedCat !== 'All' && (
          <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 border border-slate-200 dark:border-slate-800 flex items-center gap-4 animate-fade-in">
            {(() => {
              const meta = getCategoryMeta(selectedCat);
              const Icon = meta.icon;
              return (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-md flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {meta.label} Section
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {filteredAnnouncements.length} Announcement{filteredAnnouncements.length !== 1 ? 's' : ''} Published
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {meta.bannerTitle}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {meta.bannerDesc}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* News List */}
        <div className="space-y-6">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
              <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedCat === 'All' ? 'No Announcements Available' : `No ${selectedCat} Announcements`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedCat === 'All'
                  ? 'There are currently no official broadcast notices posted matching your criteria.'
                  : `There are currently no announcements published under ${selectedCat}. Check other sections.`}
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((item) => {
              const meta = getCategoryMeta(item.category);
              const Icon = meta.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveModal(item)}
                  className="group bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${meta.badgeClass}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{meta.label}</span>
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
              );
            })
          )}
        </div>

      </div>

      {/* Detail Modal with PDF View & Download */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md text-slate-900 dark:text-white animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                {(() => {
                  const modalMeta = getCategoryMeta(activeModal.category);
                  const ModalIcon = modalMeta.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${modalMeta.badgeClass}`}>
                      <ModalIcon className="w-3.5 h-3.5" />
                      <span>{modalMeta.label}</span>
                    </span>
                  );
                })()}
                <h3 className="text-lg sm:text-xl font-black mt-2 leading-snug">{activeModal.title}</h3>
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
                            <button
                              type="button"
                              onClick={() => handleViewPdf(pdf)}
                              className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 transition-colors border border-blue-500/20 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(pdf)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 transition-colors border border-emerald-500/20 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
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
