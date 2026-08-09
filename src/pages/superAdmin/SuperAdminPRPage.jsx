import React from 'react';
import { Megaphone, Mail, Phone, Video, Image } from 'lucide-react';

export const SuperAdminPRPage = () => {
  const prMembers = [
    { id: 'PR-201', name: 'Sneha Patel', role: 'Media Lead', email: 'sneha.pr@mpec.ac.in', phone: '+91 98765 43213', uploads: 18 },
    { id: 'PR-202', name: 'Aman Saxena', role: 'Press Release Coordinator', email: 'aman.pr@mpec.ac.in', phone: '+91 98765 43277', uploads: 12 }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-400" />
            <span>PR & Media Team Management</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin control for media coordinators, announcements & gallery uploads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prMembers.map((m) => (
          <div key={m.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">{m.id}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {m.uploads} Uploads
              </span>
            </div>
            <h3 className="font-bold text-white text-base">{m.name}</h3>
            <p className="text-xs text-slate-400 font-semibold">{m.role}</p>
            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-400">
              <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {m.email}</p>
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {m.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
