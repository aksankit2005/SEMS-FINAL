import React from 'react';
import { Image, Upload, Film } from 'lucide-react';

export const SuperAdminGalleryPage = () => {
  const mediaItems = [
    { id: 'IMG-1', title: 'Basketball Final Highlights', type: 'Photo', date: '2026-08-05' },
    { id: 'IMG-2', title: 'Badminton Championship Trophy Moment', type: 'Photo', date: '2026-08-04' },
    { id: 'VID-1', title: 'Opening Ceremony Procession', type: 'Video', date: '2026-08-01' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Image className="w-6 h-6 text-indigo-400" />
            <span>Media Gallery & Video Hub</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin photo/video moderation & festival media vault</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {mediaItems.map((m) => (
          <div key={m.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-full h-32 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-500 font-bold text-xs">
              {m.type === 'Video' ? <Film className="w-8 h-8 text-purple-400" /> : <Image className="w-8 h-8 text-indigo-400" />}
            </div>
            <h3 className="font-bold text-white text-xs">{m.title}</h3>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{m.type}</span>
              <span>{m.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
