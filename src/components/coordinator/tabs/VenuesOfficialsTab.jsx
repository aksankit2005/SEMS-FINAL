import React, { useState } from 'react';
import { MapPin, ShieldAlert, Plus, CheckCircle2, User } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const VenuesOfficialsTab = ({ user }) => {
  const { addToast } = useToast();
  
  const [venues, setVenues] = useState([
    { id: 1, name: 'Central Arena Main Ground', type: 'Outdoor Stadium', capacity: '2,500 Spectators', status: 'Allocated' },
    { id: 2, name: 'Indoor Sports Complex Hall A', type: 'Indoor Synthetic Arena', capacity: '800 Spectators', status: 'Allocated' },
    { id: 3, name: 'Ground 2 Outdoor Stadium', type: 'Turf Pitch', capacity: '1,200 Spectators', status: 'Allocated' },
  ]);

  const [officials, setOfficials] = useState([
    { id: 1, name: 'Official Referee A', role: 'Head Ref', license: 'National Federation Grade A', matchesHandled: 8 },
    { id: 2, name: 'Senior Umpire B', role: 'Line Umpire', license: 'State Certified Ref', matchesHandled: 6 },
    { id: 3, name: 'Head Umpire C', role: 'Timekeeper & Match Chief', license: 'University Sports Board', matchesHandled: 10 },
  ]);

  const handleAddVenue = () => {
    const venueName = prompt('Enter new venue name:');
    if (venueName) {
      setVenues([...venues, { id: Date.now(), name: venueName, type: 'Arena Ground', capacity: '500', status: 'Allocated' }]);
      addToast(`Venue "${venueName}" assigned for ${user?.sportName}`, 'success');
    }
  };

  const handleAddOfficial = () => {
    const officialName = prompt('Enter referee/official name:');
    if (officialName) {
      setOfficials([...officials, { id: Date.now(), name: officialName, role: 'Official Umpire', license: 'Certified Ref', matchesHandled: 0 }]);
      addToast(`Referee "${officialName}" assigned for ${user?.sportName}`, 'success');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Venues Management */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" /> Allocated {user?.sportName} Venues
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Courts, pitches, and arenas dedicated for {user?.sportName} matches.
            </p>
          </div>
          <button
            onClick={handleAddVenue}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Venue
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {venues.map((v) => (
            <div key={v.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-orange-500 uppercase">{v.type}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-500">
                  {v.status}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">{v.name}</h4>
              <p className="text-xs text-slate-400">Capacity: {v.capacity}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referees & Officials Management */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" /> Assigned Referees & Umpires
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official referees presiding over {user?.sportName} fixtures.
            </p>
          </div>
          <button
            onClick={handleAddOfficial}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Assign Referee
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {officials.map((o) => (
            <div key={o.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{o.name}</h4>
                  <p className="text-[10px] text-slate-400">{o.role}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                <span>{o.license}</span>
                <span className="font-bold text-indigo-500">{o.matchesHandled} Matches</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
