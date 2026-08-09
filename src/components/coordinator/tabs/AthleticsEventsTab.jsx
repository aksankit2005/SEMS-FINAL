import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Globe, Calendar, RefreshCw } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { OFFICIAL_ATHLETICS_EVENTS } from '../../registration/AthleticsRegistration';

export const AthleticsEventsTab = ({ sportSlug = 'athletics' }) => {
  const { addToast } = useToast();
  const [events, setEvents] = useState([]);
  const [eventTitle, setEventTitle] = useState('Annual Athletics Championship 2026');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const list = await coordinatorApi.getEvents(sportSlug);
      setEvents(list || []);
    } catch (err) {
      console.warn('Error loading Athletics events', err);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) return;

    const newEvt = {
      id: `EVT-ATH-${Date.now()}`,
      sportId: 'athletics',
      sportName: 'Athletics',
      title: eventTitle,
      status: 'Open',
      createdAt: new Date().toISOString(),
      subEvents: OFFICIAL_ATHLETICS_EVENTS,
    };

    try {
      await coordinatorApi.createEvent(newEvt);
      addToast(`🏆 Athletics Registration Event "${eventTitle}" published!`, 'success');
      setEventTitle('');
      loadEvents();
      window.dispatchEvent(new Event('sems_events_updated'));
    } catch (err) {
      addToast('Failed to publish event', 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this Athletics registration event? It will also be removed from the user registration page.')) return;

    try {
      await coordinatorApi.deleteEvent(id);
      addToast('Athletics event deleted', 'info');
      loadEvents();
      window.dispatchEvent(new Event('sems_events_updated'));
    } catch (err) {
      addToast('Failed to delete event', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* CREATE EVENT BAR */}
      <div className="bg-white dark:bg-[#0B1120] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
              REGISTRATION EVENT PUBLISHER
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Athletics Meet Registration Events
            </h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g. Annual Athletics Championship 2026"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none w-full"
          />

          <button
            type="button"
            onClick={handleCreateEvent}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Publish Athletics Event
          </button>
        </div>
      </div>

      {/* EVENT LIST */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 space-y-4 shadow-sm">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" /> Active Athletics Events ({events.length})
        </h3>

        {events.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
            No active Athletics events published. Create one above to allow students to register for the 7 sub-events!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase">
                      {ev.status || 'Open'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{ev.id}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{ev.title || ev.event_name || 'Athletics Event'}</h4>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {OFFICIAL_ATHLETICS_EVENTS.map((se) => (
                      <span key={se} className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                        {se}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
