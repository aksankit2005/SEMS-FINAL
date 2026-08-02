import React, { useState } from 'react';
import { Bell, Send, Megaphone, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const AnnouncementsTab = ({ announcements, user, onUpdateAnnouncements }) => {
  const { addToast } = useToast();
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Match Reminder');
  const [message, setMessage] = useState('');

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    if (!title || !message) {
      addToast('Please fill in title and announcement text', 'error');
      return;
    }

    const newAnn = {
      id: `ann-${Date.now()}`,
      title,
      type,
      message,
      date: new Date().toLocaleString(),
    };

    onUpdateAnnouncements([newAnn, ...announcements]);
    addToast(`Announcement "${title}" broadcasted successfully to all ${user?.sportName} athletes!`, 'success');
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Broadcast Form */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-orange-500" /> Send Broadcast Announcement for {user?.sportName}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Push match reminders, schedule changes, venue updates, registration notices, and results.
        </p>

        <form onSubmit={handleSendAnnouncement} className="space-y-3.5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Changed: Football Semi Finals Postponed by 30 mins"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Notification Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
              >
                <option value="Match Reminder">Match Reminder</option>
                <option value="Schedule Changed">Schedule Changed</option>
                <option value="Venue Changed">Venue Changed</option>
                <option value="Registration Open">Registration Open</option>
                <option value="Registration Closed">Registration Closed</option>
                <option value="Results Published">Results Published</option>
                <option value="General Announcement">General Announcement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Notice Message Body
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your official coordinator notice message here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Broadcast Announcement
            </button>
          </div>
        </form>
      </div>

      {/* Announcements Stream */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft space-y-4">
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Sent Announcements History ({announcements.length})
        </h4>

        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/10 text-orange-500">
                  {a.type}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{a.date}</span>
              </div>
              <h5 className="text-sm font-black text-slate-900 dark:text-white pt-1">{a.title}</h5>
              <p className="text-xs text-slate-600 dark:text-slate-300">{a.message}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
