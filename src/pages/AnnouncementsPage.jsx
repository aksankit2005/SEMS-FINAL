import React, { useState } from 'react';
import { Bell, Search, ChevronRight, X } from 'lucide-react';
import { useSportsData } from '../context/SportsDataContext';

export const AnnouncementsPage = () => {
  const { announcements } = useSportsData();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [activeModal, setActiveModal] = useState(null);

  const categories = ['All', 'Schedule', 'Rules & Guidelines', 'Emergency & Safety', 'Event Highlight'];

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesQuery = a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.summary.toLowerCase().includes(query.toLowerCase());
    const matchesCat = selectedCat === 'All' || a.category === selectedCat;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
            <Bell className="w-4 h-4 text-orange-500" /> Official Broadcast Center
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            News & <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Announcements</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Stay informed with real-time tournament alerts, schedule updates, and safety circulars.
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">There are currently no official broadcast notices posted.</p>
            </div>
          ) : (
            filteredAnnouncements.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveModal(item)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {item.category}
                    </span>
                    {item.isImportant && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                        IMPORTANT NOTICE
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{item.date} • {item.time}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {item.summary}
                  </p>
                </div>

                <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0 self-start md:self-auto">
                  <span>Read Full Circular</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">{activeModal.category}</span>
                <h3 className="text-xl font-black mt-1">{activeModal.title}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">Issued by {activeModal.author} on {activeModal.date} at {activeModal.time}</p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm leading-relaxed border border-slate-200 dark:border-slate-800">
              {activeModal.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
