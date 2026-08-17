import React, { useState, useEffect } from 'react';
import { Search, FileDown, Users, Trophy } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { flattenRegistrationRoster } from '../../../utils/rosterHelper';
import { exportToCSV } from '../../../utils/pdfExporter';

export const TotalParticipationTab = ({ user, assignedSport, globalSearch = '' }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const sportId = (assignedSport || user?.assignedSport || user?.sportName || 'football').toLowerCase();
  const sportName = user?.sportName || (sportId.charAt(0).toUpperCase() + sportId.slice(1).replace(/-/g, ' '));

  const loadData = async () => {
    try {
      const data = await coordinatorApi.getRegistrations();
      const cleanSportId = sportId.replace(/_/g, '-');
      const baseSportId = cleanSportId.split('-')[0];

      const filteredBySport = (data || []).filter((d) => {
        const rSport = String(d.sport || d.sportId || d.sportName || '').toLowerCase().replace(/_/g, '-');
        const rEvent = String(d.eventTitle || d.eventType || '').toLowerCase().replace(/_/g, '-');
        return (
          rSport.includes(cleanSportId) ||
          rSport.includes(baseSportId) ||
          rEvent.includes(cleanSportId) ||
          rEvent.includes(baseSportId)
        );
      });

      setRegistrations(filteredBySport);
    } catch (e) {
      console.error('Failed to load total participation registrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, assignedSport]);

  const flattenedAthletes = flattenRegistrationRoster(registrations, { defaultSport: sportName });

  const filtered = flattenedAthletes.filter((p) => {
    const activeSearch = (search || globalSearch || '').toLowerCase().trim();
    if (!activeSearch) return true;

    return (
      (p.name && p.name.toLowerCase().includes(activeSearch)) ||
      (p.teamName && p.teamName.toLowerCase().includes(activeSearch)) ||
      (p.collegeName && p.collegeName.toLowerCase().includes(activeSearch)) ||
      (p.rollNo && p.rollNo.toLowerCase().includes(activeSearch)) ||
      (p.phone && p.phone.toLowerCase().includes(activeSearch)) ||
      (p.email && p.email.toLowerCase().includes(activeSearch)) ||
      (p.sport && p.sport.toLowerCase().includes(activeSearch))
    );
  });

  const handleExportExcel = () => {
    if (!flattenedAthletes || flattenedAthletes.length === 0) {
      addToast('No participant records to export', 'warning');
      return;
    }

    const exportData = flattenedAthletes.map((p, idx) => ({
      'S.No.': idx + 1,
      'Registration ID': p.registrationId || 'N/A',
      'Timestamp': p.timestamp || 'N/A',
      'Participation Type': p.participationType || 'INDIVIDUAL',
      'Game Name': p.sport || sportName,
      'Team Name': p.teamName || 'Individual',
      'College Name': p.collegeName || 'N/A',
      'Player Name': p.name || 'N/A',
      'Role': p.role || (p.isCaptain ? 'Captain' : 'Player'),
      'Roll No': p.rollNo || 'N/A',
      'Mobile No': p.phone || 'N/A',
      'Email': p.email || 'N/A',
      'Gender': p.gender || 'Male',
      'Course': p.course || 'N/A',
      'Year / Semester': p.yearSemester || 'N/A',
      'Status': p.status || 'VERIFIED'
    }));

    exportToCSV(exportData, `${sportName.replace(/\s+/g, '_')}_Official_Roster_${new Date().toISOString().split('T')[0]}`);
    addToast(`${sportName} official roster exported to CSV successfully!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* HEADER STATS & SUMMARY */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{sportName} Total Participants</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative database roster with every registered student athlete and verified team captain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-black">
            Total Athletes: {flattenedAthletes.length}
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
            Registered Teams: {registrations.length}
          </div>
        </div>
      </div>

      {/* FILTER & EXPORT BAR */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athlete, team, roll no, college, mobile..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-xl text-white text-xs font-black bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Official CSV</span>
            </button>
          </div>
        </div>

        {/* ATHLETE ROSTER TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                <th className="p-4">Time</th>
                <th className="p-4">Game / Sport</th>
                <th className="p-4">Team Name</th>
                <th className="p-4">College Name</th>
                <th className="p-4">Player Name</th>
                <th className="p-4">Roll No</th>
                <th className="p-4">Mobile No</th>
                <th className="p-4">Email & Academic</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                    {loading ? 'Loading participants from database...' : `No registered ${sportName} student athletes found in database.`}
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                      {p.timestamp}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-[11px]">
                        {p.sport || sportName}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {p.teamName || 'Individual'}
                    </td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {p.collegeName}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 dark:text-white">{p.name}</span>
                        {p.isCaptain ? (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Captain
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Player
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {p.rollNo && p.rollNo !== 'N/A' ? p.rollNo : '—'}
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {p.phone}
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      <div className="font-mono text-[11px]">{p.email}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.course && p.course !== 'N/A' ? p.course : ''} {p.yearSemester && p.yearSemester !== 'N/A' ? `• ${p.yearSemester}` : ''}
                      </div>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                        {p.status || 'VERIFIED'}
                      </span>
                    </td>
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
