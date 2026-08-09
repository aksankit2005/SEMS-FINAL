import React from 'react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';

export const SuperAdminSchedulePage = () => {
  const schedule = [
    { time: '09:00 AM', sport: 'Basketball', match: 'MPEC vs PSIT', venue: 'Court 1', status: 'Upcoming' },
    { time: '11:00 AM', sport: 'Badminton', match: 'MPEC vs KIET', venue: 'Court 2', status: 'Live' },
    { time: '01:00 PM', sport: 'Football', match: 'MPEC vs BBDIT', venue: 'Ground 1', status: 'Upcoming' },
    { time: '03:00 PM', sport: 'Volleyball', match: 'MPEC vs HBTU', venue: 'Court 1', status: 'Upcoming' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-400" />
            <span>Master Schedule & Timetable</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin court allocations, fixture schedules & timing overrides</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {schedule.map((s, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{s.time}</span>
                <span className="text-sm font-bold text-white font-mono">({s.sport})</span>
              </div>
              <p className="text-sm text-slate-200 mt-1 font-semibold">{s.match}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-500" /> {s.venue}
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
              s.status === 'Live' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
