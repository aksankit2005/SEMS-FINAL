import React, { useState, useEffect } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const TotalParticipationTab = ({ user }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [participants, setParticipants] = useState([]);

  const sportId = user?.assignedSport || 'table-tennis';
  const participantsKey = `sems_participants_${sportId}`;

  const sportName = user?.sportName || 'Badminton';

  // Load participants from localStorage on mount & purge legacy mock entries
  useEffect(() => {
    const mockIds = ['REG-101', 'REG-102', 'REG-103', 'REG-104'];
    const saved = localStorage.getItem(participantsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = Array.isArray(parsed) ? parsed.filter((p) => !mockIds.includes(p.id)) : [];
        setParticipants(cleaned);
        localStorage.setItem(participantsKey, JSON.stringify(cleaned));
      } catch (e) {
        setParticipants([]);
      }
    } else {
      setParticipants([]);
    }
  }, [participantsKey, sportName]);


  const handleClearParticipants = () => {
    if (window.confirm('Clear all participant data from storage?')) {
      setParticipants([]);
      localStorage.removeItem(participantsKey);
      addToast('All participant data cleared', 'warning');
    }
  };

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const p1Name = p.player1?.name || p.studentName || p.name || '';
    const p2Name = p.player2?.name || p.partnerName || '';
    const roll = p.roll || '';
    const college = p.college || '';
    return p1Name.toLowerCase().includes(q) || p2Name.toLowerCase().includes(q) || roll.toLowerCase().includes(q) || college.toLowerCase().includes(q);
  });

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
                <th className="p-4">PLAYERS / PARTICIPANTS</th>
                <th className="p-4">ROLL NUMBERS</th>
                <th className="p-4">SPORT</th>
                <th className="p-4">COLLEGE & COURSE</th>
                <th className="p-4">FORMAT</th>
                <th className="p-4">CONTACT INFO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    No participant registrations found. Registered participants will appear here automatically.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const isDoubles = p.format === 'DOUBLES' || p.player2 || p.partnerName || (p.name && p.name.includes('&'));

                  const p1Name = p.player1?.name || p.studentName || p.name?.split('&')[0]?.trim() || p.name;
                  const p1Roll = p.player1?.roll || p.roll?.split('/')[0]?.trim() || p.roll;
                  const p1Phone = p.player1?.phone || p.contactPhone || p.contact?.split('|')[0]?.replace('P1:', '')?.trim() || p.contact;

                  const p2Name = p.player2?.name || p.partnerName || p.name?.split('&')[1]?.trim() || 'Partner (Player 2)';
                  const p2Roll = p.player2?.roll || p.partnerRoll || p.roll?.split('/')[1]?.trim() || 'N/A';
                  const p2Phone = p.player2?.phone || p.partnerPhone || p.contact?.split('|')[1]?.replace('P2:', '')?.trim() || 'N/A';

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      
                      {/* FULL NAME / PLAYERS */}
                      <td className="p-4 font-sans">
                        {isDoubles ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                P1
                              </span>
                              <span className="font-bold text-white text-xs">{p1Name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                P2
                              </span>
                              <span className="font-bold text-cyan-300 text-xs">{p2Name}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-white text-xs">{p1Name}</span>
                        )}
                      </td>

                      {/* ROLL NUMBERS */}
                      <td className="p-4 font-mono">
                        {isDoubles ? (
                          <div className="space-y-1.5 text-xs">
                            <div className="text-slate-200">
                              <span className="text-slate-500 text-[10px] mr-1">P1:</span>
                              <span className="font-bold">{p1Roll}</span>
                            </div>
                            <div className="text-cyan-300">
                              <span className="text-slate-500 text-[10px] mr-1">P2:</span>
                              <span className="font-bold">{p2Roll}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold text-xs">{p1Roll}</span>
                        )}
                      </td>

                      {/* SPORT */}
                      <td className="p-4 text-slate-300 font-sans text-xs">{sportName}</td>

                      {/* COLLEGE & COURSE */}
                      <td className="p-4 text-slate-400 font-sans text-xs">{p.college}</td>

                      {/* FORMAT */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          isDoubles
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {isDoubles ? 'DOUBLES (2v2)' : 'SINGLES (1v1)'}
                        </span>
                      </td>

                      {/* CONTACT INFO */}
                      <td className="p-4 font-mono">
                        {isDoubles ? (
                          <div className="space-y-1.5 text-[11px]">
                            <div className="text-emerald-400">
                              <span className="text-slate-500 text-[10px] mr-1">P1:</span>
                              {p1Phone}
                            </div>
                            <div className="text-cyan-400">
                              <span className="text-slate-500 text-[10px] mr-1">P2:</span>
                              {p2Phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-indigo-400 text-[11px]">{p1Phone}</span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

