import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Clock } from 'lucide-react';

export const SportCard = ({ sport, onRegisterSelect }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [status, setStatus] = useState({ code: '', label: '', color: '' });

  // Calculate status and format dates
  const startDate = new Date(sport.startDate + 'T00:00:00');
  const endDate = new Date(sport.endDate + 'T23:59:59');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();

      if (now < startDate) {
        setStatus({ code: 'COMING_SOON', label: 'Coming Soon', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' });
        const diff = startDate - now;
        setTimeLeft(formatTime(diff));
      } else if (now >= startDate && now <= endDate) {
        setStatus({ code: 'OPEN', label: 'Open', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' });
        const diff = endDate - now;
        setTimeLeft(formatTime(diff));
      } else {
        setStatus({ code: 'CLOSED', label: 'Closed', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' });
        setTimeLeft('Registration Ended');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sport.startDate, sport.endDate]);

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const secs = totalSecs % 60;
    const totalMins = Math.floor(totalSecs / 60);
    const mins = totalMins % 60;
    const totalHours = Math.floor(totalMins / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);

    const pad = (num) => String(num).padStart(2, '0');

    if (days > 0) {
      return `${days}d ${pad(hours)}h ${pad(mins)}m`;
    }
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  const formatDateString = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isBtnDisabled = status.code === 'CLOSED' || status.code === 'COMING_SOON';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-soft hover:shadow-lg transition duration-300 flex flex-col justify-between h-full relative overflow-hidden group">
      
      {/* Background Hover glow */}
      <div className="absolute -inset-y-12 -inset-x-12 bg-gradient-to-tr from-blue-500/0 via-indigo-500/0 to-orange-500/0 group-hover:to-blue-500/5 group-hover:via-indigo-500/5 rounded-full blur-3xl transition duration-500 pointer-events-none" />

      <div className="space-y-4 relative z-10">
        {/* Image Frame */}
        <div className="h-44 w-full rounded-2xl overflow-hidden relative border border-slate-100 dark:border-slate-800">
          <img
            src={sport.image}
            alt={sport.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          
          {/* Status Badge */}
          <span className={`absolute top-3 left-3 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border border-solid backdrop-blur-md shadow-sm ${status.color}`}>
            {status.code === 'OPEN' && '🟢 '}
            {status.code === 'COMING_SOON' && '🟡 '}
            {status.code === 'CLOSED' && '🔴 '}
            {status.label}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{sport.name}</h3>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md uppercase">
              {sport.category}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{sport.description}</p>
        </div>

        {/* Dates & Pricing */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
          <div className="space-y-0.5">
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Starts</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{formatDateString(sport.startDate)}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Ends</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>{formatDateString(sport.endDate)}</span>
            </div>
          </div>
        </div>

        {/* Fee & Roster Type */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-slate-400 block text-[9px] uppercase">Roster Limit</span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{sport.teamSize}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[9px] uppercase">Entry Fee</span>
            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">₹{sport.entryFee}</span>
          </div>
        </div>
      </div>

      {/* Button & Timer section */}
      <div className="mt-5 space-y-3 relative z-10">
        {/* Countdown Timer */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            {status.code === 'COMING_SOON' ? 'Starts in:' : status.code === 'OPEN' ? 'Closes in:' : 'Status:'}
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 uppercase">
            {timeLeft}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => !isBtnDisabled && onRegisterSelect(sport)}
          disabled={isBtnDisabled}
          className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
            isBtnDisabled
              ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed border border-slate-200/50 dark:border-slate-800/30'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>{status.code === 'CLOSED' ? 'Registration Closed' : status.code === 'COMING_SOON' ? 'Opening Soon' : 'Register Now'}</span>
        </button>
      </div>
    </div>
  );
};
