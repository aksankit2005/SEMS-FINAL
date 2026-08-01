import React, { useState, useEffect } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const TotalParticipationTab = ({ user }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [participants, setParticipants] = useState([]);

  const sportId = user?.assignedSport || 'table-tennis';
  const participantsKey = `sems_participants_${sportId}`;

  // Load participants from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(participantsKey);
    if (saved) {
      try {
        setParticipants(JSON.parse(saved));
      } catch (e) {}
    } else {
      const defaults = [
        { name: 'Aditya Singh', roll: '25261101308', sport: 'Table Tennis', college: 'MPCPS (KN142) |', format: 'SINGLES', contact: '9336938985 | adityasinghmlzs01@gmail.com' },
        { name: 'Kavyansh Sonwani', roll: '2300461540052', sport: 'Table Tennis', college: 'MPEC |', format: 'SINGLES', contact: '8112425951 | kavyanshsonwani@gmail.com' },
        { name: 'Kavyansh Sonwani', roll: '2300461540052', sport: 'Table Tennis', college: 'MPEC |', format: 'DOUBLES', contact: '8112425951 | kavyanshsonwani@gmail.com' },
        { name: 'parthgupta', roll: '2500461520107', sport: 'Table Tennis', college: 'MPEC |', format: 'SINGLES', contact: '989529585 | guptaparth579@gmail.com' },
        { name: 'Vedansh Awasthi', roll: '2403491530115', sport: 'Table Tennis', college: 'MIPS |', format: 'SINGLES', contact: '7704879025 | vedanshawasthi2507@gmail.com' },
      ];
      setParticipants(defaults);
      localStorage.setItem(participantsKey, JSON.stringify(defaults));
    }
  }, [participantsKey]);

  const handleClearParticipants = () => {
    if (window.confirm('Clear all participant data from storage?')) {
      setParticipants([]);
      localStorage.removeItem(participantsKey);
      addToast('All participant data cleared', 'warning');
    }
  };

  const sportName = user?.sportName || 'Table Tennis';

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.roll.toLowerCase().includes(search.toLowerCase()) ||
    p.college.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-200 animate-fade-in">
      
      {/* Table Container */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 shadow-2xl space-y-5">
        
        {/* Header Title & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-white tracking-tight">
              Participant Database (Read Only)
            </h3>
            {participants.length > 0 && (
              <button
                onClick={handleClearParticipants}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Participation Data</span>
              </button>
            )}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, roll..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0B1120] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="p-4">FULL NAME</th>
                <th className="p-4">ROLL NUMBER</th>
                <th className="p-4">SPORT</th>
                <th className="p-4">COLLEGE & COURSE</th>
                <th className="p-4">FORMAT</th>
                <th className="p-4">CONTACT INFO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No participant registrations found. Registered participants will appear here automatically.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-bold text-white font-sans">{p.name}</td>
                    <td className="p-4 text-slate-300 font-bold">{p.roll}</td>
                    <td className="p-4 text-slate-300 font-sans">{sportName}</td>
                    <td className="p-4 text-slate-400 font-sans">{p.college}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {p.format}
                      </span>
                    </td>
                    <td className="p-4 text-indigo-400 text-[11px]">{p.contact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
