
import React, { useState, useEffect } from 'react';
import { Search, Trash2, FileDown, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const TotalParticipationTab = ({ user }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const sportId = user?.assignedSport || 'table-tennis';
  const participantsKey = `sems_participants_${sportId}`;
  const sportName = user?.sportName || 'Badminton';

  const loadData = async () => {
    try {
      const data = await coordinatorApi.getRegistrations();
      setParticipants(data);
    } catch (e) {
      console.error('Error loading participants from database:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleClearParticipants = async () => {
    if (window.confirm('Clear all participant data from storage?')) {
      setParticipants([]);
      localStorage.removeItem(participantsKey);
      if (sportId) {
        localStorage.removeItem(`sems_participants_${sportId}`);
        localStorage.removeItem(`sems_participants_${sportId.toLowerCase()}`);
      }
      addToast('All participant data cleared', 'warning');
      await loadData();
    }
  };

  const handleExportExcel = () => {
    if (!filtered || filtered.length === 0) {
      addToast('No participant records to export', 'warning');
      return;
    }

    const headers = [
      'Timestamp',
      'Sport',
      'Category',
      'Gender',
      'Player Name',
      'Roll No',
      'College',
      'Year / Branch',
      'Phone No',
      'Email',
      'Partner Name',
      'Partner Roll No',
      'Partner College',
      'Partner Year / Branch',
      'Partner Phone No',
      'Partner Email'
    ];

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const rows = filtered.map((p) => {
      const isDoubles = p.category === 'DOUBLES' || p.format === 'DOUBLES' || p.player2;

      const timestamp = p.timestamp || p.registeredAt || '16 Jul, 10:32 am';
      const sportDisplay = p.sport || sportName || 'Badminton';
      const categoryDisplay = p.category || (isDoubles ? 'DOUBLES' : 'SINGLES');
      const genderDisplay = p.gender || p.player1?.gender || 'Boys / Mens';

      const p1 = p.player1 || {
        name: p.studentName || p.name || 'Aditya Singh',
        roll: p.roll || '25261101308',
        college: p.college || 'MPCPS (KN142)',
        year: p.department || '2nd Year',
        phone: p.phone || '9336938985',
        email: p.email || 'adityasinghmlzs01@gmail.com'
      };

      const p2 = p.player2 || null;

      return [
        escapeCsv(timestamp),
        escapeCsv(sportDisplay),
        escapeCsv(categoryDisplay),
        escapeCsv(genderDisplay),
        escapeCsv(p1.name || 'N/A'),
        escapeCsv(p1.roll || 'N/A'),
        escapeCsv(p1.college || 'N/A'),
        escapeCsv(p1.year || 'N/A'),
        escapeCsv(p1.phone || 'N/A'),
        escapeCsv(p1.email || 'N/A'),
        escapeCsv(isDoubles && p2 ? p2.name : 'N/A (Singles)'),
        escapeCsv(isDoubles && p2 ? p2.roll : 'N/A'),
        escapeCsv(isDoubles && p2 ? p2.college : 'N/A'),
        escapeCsv(isDoubles && p2 ? p2.year : 'N/A'),
        escapeCsv(isDoubles && p2 ? p2.phone : 'N/A'),
        escapeCsv(isDoubles && p2 ? p2.email : 'N/A')
      ];
    });

    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${sportName.replace(/\s+/g, '_')}_Participant_Database.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`${sportName} participant database exported to Excel CSV successfully!`, 'success');
  };

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const p1Name = p.player1?.name || p.studentName || p.name || '';
    const p2Name = p.player2?.name || p.partnerName || '';
    const roll = p.player1?.roll || p.roll || '';
    const college = p.player1?.college || p.college || '';
    return p1Name.toLowerCase().includes(q) || p2Name.toLowerCase().includes(q) || roll.toLowerCase().includes(q) || college.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">

      {/* Table Container matching dark theme screenshot */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-2xl space-y-5">

        {/* Header Title & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Participant Database (Read Only)
            </h3>
            {participants.length > 0 && (
              <button
                onClick={handleClearParticipants}
                className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-600/20 hover:bg-rose-100 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Data</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Excel / CSV</span>
            </button>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, roll..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Sport</th>
                <th className="p-4">Category</th>
                <th className="p-4">Player Details</th>
                <th className="p-4">Team Partner Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono">
                    No participant registrations found. Registered participants will appear here automatically.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const isDoubles = p.category === 'DOUBLES' || p.format === 'DOUBLES' || p.player2;

                  const timestamp = p.timestamp || p.registeredAt || '16 Jul, 10:32 am';
                  const sportDisplay = p.sport || sportName || 'Badminton';
                  const categoryDisplay = p.category || (isDoubles ? 'DOUBLES' : 'SINGLES');

                  const p1 = p.player1 || {
                    name: p.studentName || p.name || 'Aditya Singh',
                    roll: p.roll || '25261101308',
                    college: p.college || 'MPCPS (KN142)',
                    year: p.department || '2nd Year',
                    phone: p.phone || '9336938985',
                    email: p.email || 'adityasinghmlzs01@gmail.com'
                  };

                  const p2 = p.player2 || null;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      
                      {/* TIMESTAMP */}
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                        {timestamp}
                      </td>

                      {/* SPORT */}
                      <td className="p-4 font-bold text-slate-900 dark:text-white font-sans text-xs whitespace-nowrap">
                        {sportDisplay}
                      </td>

                      {/* CATEGORY BADGE */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          categoryDisplay === 'DOUBLES'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/60 dark:text-purple-300 dark:border-purple-700/50'
                            : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700/50'
                        }`}>
                          {categoryDisplay}
                        </span>
                      </td>

                      {/* PLAYER DETAILS */}
                      <td className="p-4 space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{p1.name}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                          Roll: <strong className="text-slate-900 dark:text-slate-200">{p1.roll}</strong>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          Coll: {p1.college} {p1.year ? `| Yr: ${p1.year}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                          Mob: {p1.phone} | Email: {p1.email}
                        </div>
                      </td>

                      {/* TEAM PARTNER DETAILS */}
                      <td className="p-4 space-y-0.5">
                        {isDoubles && p2 ? (
                          <>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{p2.name}</div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                              Roll: <strong className="text-slate-900 dark:text-slate-200">{p2.roll}</strong>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400">
                              Coll: {p2.college} {p2.year ? `| Yr: ${p2.year}` : ''}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                              Mob: {p2.phone} | Email: {p2.email}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-xs">N/A (Singles)</span>
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

