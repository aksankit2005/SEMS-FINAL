import React, { useState, useEffect } from 'react';
import { Search, Trash2, FileDown, Users } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const TugOfWarTotalParticipationTab = ({ user, globalSearch = '' }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [participants, setParticipants] = useState([]);

  const sportId = 'tug-of-war';
  const participantsKey = `sems_participants_${sportId}`;
  const sportName = 'Tug of War';

  const loadData = async () => {
    try {
      const data = await coordinatorApi.getRegistrations();
      const towData = (data || []).filter((d) => 
        !d.sport || d.sport.toLowerCase().includes('tug of war') || d.eventTitle?.toLowerCase().includes('tug of war')
      );

      setParticipants(towData || []);
    } catch (e) {
      setParticipants([]);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleClearParticipants = async () => {
    if (window.confirm('Clear all tug of war participant data from storage?')) {
      setParticipants([]);
      localStorage.removeItem(participantsKey);
      localStorage.removeItem('sems_participants_tug_of_war');
      addToast('All tug of war participant data cleared', 'warning');
      await loadData();
    }
  };

  const filtered = participants.filter((p) => {
    const activeSearch = (search || globalSearch || '').toLowerCase().trim();
    if (!activeSearch) return true;

    const teamName = p.teamName || p.college || p.name || '';
    const collegeName = p.collegeName || p.college || p.player1?.college || '';
    const personName = p.name || p.captainName || p.leaderName || p.player1?.name || p.studentName || '';
    const phone = p.phone || p.mobile || p.player1?.phone || '';
    const email = p.email || p.player1?.email || '';

    return (
      teamName.toLowerCase().includes(activeSearch) ||
      collegeName.toLowerCase().includes(activeSearch) ||
      personName.toLowerCase().includes(activeSearch) ||
      phone.toLowerCase().includes(activeSearch) ||
      email.toLowerCase().includes(activeSearch)
    );
  });

  const handleExportExcel = () => {
    if (!filtered || filtered.length === 0) {
      addToast('No participant records to export', 'warning');
      return;
    }

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    const headers = ['Time', 'Game Name', 'Team Name', 'College Name', 'Name', 'Mobile No', 'Email'];
    const rows = filtered.map((p) => {
      return [
        escapeCsv(p.timestamp || p.registeredAt || 'N/A'),
        escapeCsv(p.sport || sportName),
        escapeCsv(p.teamName || p.name || 'Team'),
        escapeCsv(p.collegeName || p.college || 'N/A'),
        escapeCsv(p.name || p.captainName || p.player1?.name || 'N/A'),
        escapeCsv(p.phone || p.mobile || p.player1?.phone || 'N/A'),
        escapeCsv(p.email || p.player1?.email || 'N/A')
      ];
    });

    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TugOfWar_Participant_Database.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Tug of war participant database exported to CSV successfully!`, 'success');
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">

      <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-2xl space-y-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Participant Database (Read Only)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  READ ONLY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified registration records for Tug of War
              </p>
            </div>

            {participants.length > 0 && (
              <button
                onClick={handleClearParticipants}
                className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-600/20 hover:bg-rose-100 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Data</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Export CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team name, college, captain, phone or email..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Game Name</th>
                <th className="p-3.5">Team Name</th>
                <th className="p-3.5">College Name</th>
                <th className="p-3.5">Captain / Name</th>
                <th className="p-3.5">Mobile No</th>
                <th className="p-3.5">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-mono">
                    No participants found.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-mono text-slate-500">{p.timestamp || p.registeredAt || 'N/A'}</td>
                    <td className="p-3.5 font-bold text-orange-600 dark:text-orange-400">{p.sport || sportName}</td>
                    <td className="p-3.5 font-black text-slate-900 dark:text-white">{p.teamName || p.name || 'Team'}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{p.collegeName || p.college || 'N/A'}</td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{p.name || p.captainName || p.player1?.name || 'N/A'}</td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{p.phone || p.mobile || p.player1?.phone || 'N/A'}</td>
                    <td className="p-3.5 font-mono text-slate-500">{p.email || p.player1?.email || 'N/A'}</td>
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
