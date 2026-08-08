import React, { useState } from 'react';
import { Bell, PlusCircle, CheckCircle } from 'lucide-react';

export const SuperAdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([
    { id: 'ANN-101', title: 'Opening Ceremony Schedule Announced', date: '2026-08-01', status: 'PUBLISHED' },
    { id: 'ANN-102', title: 'Badminton Fixtures Venue Shifted to Court 2', date: '2026-08-02', status: 'PUBLISHED' }
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-400" />
            <span>Announcements & Public Bulletins</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin notice board broadcasts & urgent event alerts</p>
        </div>
      </div>

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">{a.title}</h3>
              <span className="text-[10px] text-slate-500">{a.date} &bull; {a.id}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
