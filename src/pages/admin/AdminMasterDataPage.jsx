import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { superCoordinatorApi, ALL_12_SPORTS, ALL_COLLEGES } from '../../services/superCoordinatorApi';
import { SPORTS_DATA } from '../../data/sportsData';
import { useToast } from '../../context/ToastContext';
import { exportToCSV, exportToPDF } from '../../utils/pdfExporter';
import { RegistrationDetailsModal } from '../../components/admin/RegistrationDetailsModal';
import {
  Database,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  IndianRupee
} from 'lucide-react';

export const AdminMasterDataPage = () => {
  const { addToast } = useToast();
  const [participants, setParticipants] = useState([]);
  const [coordinatorEvents, setCoordinatorEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Exact 5 Filters State for Master Data
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Inspection Modal
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [data, eventsList] = await Promise.all([
        superCoordinatorApi.getMasterParticipants(),
        adminApi.getCoordinatorEvents()
      ]);
      setParticipants(data || []);
      setCoordinatorEvents(eventsList || []);
    } catch (err) {
      addToast('Failed to load Master Data participants', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Available Coordinator Events matching selected sport
  const availableEvents = coordinatorEvents.filter((evt) => {
    if (selectedSport === 'ALL') return true;
    return (evt.sportId || '').toLowerCase() === selectedSport.toLowerCase() ||
           (evt.sportName || '').toLowerCase().includes(selectedSport.toLowerCase());
  });

  // Filtered Master Participants
  const filteredParticipants = participants.filter((p) => {
    if (selectedSport !== 'ALL') {
      const pSport = (p.sportName || p.sportId || '').toLowerCase();
      if (!pSport.includes(selectedSport.toLowerCase())) return false;
    }

    if (selectedEvent !== 'ALL') {
      const pEvent = (p.eventTitle || '').toLowerCase();
      if (!pEvent.includes(selectedEvent.toLowerCase())) return false;
    }

    if (selectedGender !== 'ALL') {
      const pGender = (p.gender || '').toLowerCase();
      if (!pGender.includes(selectedGender.toLowerCase())) return false;
    }

    if (selectedCollege !== 'ALL') {
      const pCollege = (p.college || '').toLowerCase();
      if (!pCollege.includes(selectedCollege.toLowerCase())) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || p.teamName || '').toLowerCase().includes(q);
      const matchCollege = (p.college || '').toLowerCase().includes(q);
      const matchSport = (p.sportName || '').toLowerCase().includes(q);
      const matchMobile = (p.mobile || '').toLowerCase().includes(q);
      const matchEmail = (p.email || '').toLowerCase().includes(q);
      return matchName || matchCollege || matchSport || matchMobile || matchEmail;
    }

    return true;
  });

  // Fee per participant derived from sport entry fee (or stored feePaid when present)
  const sportFeeMap = Object.fromEntries(
    SPORTS_DATA.map((s) => [s.name.toLowerCase(), s.entryFee])
  );
  const participantFee = (p) => {
    if (p && p.feePaid) return Number(p.feePaid) || 0;
    const fee = sportFeeMap[(p?.sportName || '').toLowerCase()];
    return fee || 400;
  };

  // Totals that update whenever filters change without multiplying team fees
  const totalParticipants = filteredParticipants.length;
  const uniqueRegistrations = new Set(filteredParticipants.map((p) => p.registrationId || p.receiptId || p.id));
  const totalRegistrations = uniqueRegistrations.size;

  const uniqueRegFees = new Map();
  filteredParticipants.forEach((p) => {
    const key = p.registrationId || p.receiptId || p.id;
    if (!uniqueRegFees.has(key)) {
      uniqueRegFees.set(key, Number(p.feePaid || 0));
    }
  });
  const totalMoney = Array.from(uniqueRegFees.values()).reduce((sum, v) => sum + v, 0);

  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / itemsPerPage));
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    if (filteredParticipants.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }
    const exportData = filteredParticipants.map((p, idx) => ({
      'S.No.': idx + 1,
      'Registration ID': p.receiptId || p.registrationId || p.id || 'N/A',
      'Registration Date': `${p.date || ''} ${p.time || ''}`.trim() || 'N/A',
      'Sport': p.sportName || 'N/A',
      'Event': p.eventTitle || `${p.sportName || 'Sport'} Championship`,
      'Team Name': p.teamName || p.name || 'N/A',
      'College': p.college || 'N/A',
      'Player Name': p.name || 'N/A',
      'Role': (p.isCaptain === true || p.isCaptain === 1 || p.isCaptain === 'true' || p.isCaptain === '1') ? 'Captain' : 'Player',
      'Roll Number': p.rollNo || 'N/A',
      'Mobile Number': p.mobile || 'N/A',
      'Email Address': p.email || 'N/A',
      'Gender': p.gender || 'N/A',
      'Course': p.course || 'N/A',
      'Year / Semester': p.yearSemester || 'N/A',
      'Status': p.status || 'VERIFIED'
    }));
    exportToCSV(exportData, `Admin_Master_Roster_${new Date().toISOString().split('T')[0]}`);
    addToast('Admin Master Roster exported to CSV successfully!', 'success');
  };

  const handleExportPDF = () => {
    if (filteredParticipants.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }
    const headers = ['#', 'Reg ID', 'Sport', 'Team Name', 'College', 'Player Name', 'Role', 'Roll No', 'Mobile', 'Course', 'Status'];
    const rows = filteredParticipants.map((p, idx) => [
      idx + 1,
      p.receiptId || p.registrationId || p.id || 'N/A',
      p.sportName || 'N/A',
      p.teamName || p.name || 'N/A',
      p.college || 'N/A',
      p.name || 'N/A',
      (p.isCaptain === true || p.isCaptain === 1 || p.isCaptain === 'true' || p.isCaptain === '1') ? 'Captain' : 'Player',
      p.rollNo || 'N/A',
      p.mobile || 'N/A',
      p.course || 'N/A',
      p.status || 'VERIFIED'
    ]);
    exportToPDF('APEX 2026 - Master Participants Official Roster', headers, rows, `Admin_Master_Roster_${new Date().toISOString().split('T')[0]}`);
    addToast('Admin Master Roster exported to PDF successfully!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Super Coordinator Replicated View
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Master Data / Participants Roster</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Central database of all registered fest participants & squad rosters ({participants.length} Total Records)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={fetchMasterData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 FILTERS CONTROL BAR */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Master Data Filters</span>
          </div>

          {(selectedSport !== 'ALL' || selectedEvent !== 'ALL' || selectedGender !== 'ALL' || selectedCollege !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSport('ALL');
                setSelectedEvent('ALL');
                setSelectedGender('ALL');
                setSelectedCollege('ALL');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. 🎯 Filter by Game */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              🎯 Filter by Game
            </label>
            <select
              value={selectedSport}
              onChange={(e) => { setSelectedSport(e.target.value); setSelectedEvent('ALL'); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All 12 Sports</option>
              {ALL_12_SPORTS.map((s) => (
                <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900">
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. 📋 Filter by Event Title */}
          <div>
            <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">
              📋 Filter by Event Title
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => { setSelectedEvent(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Created Events ({availableEvents.length})</option>
              {availableEvents.map((evt) => (
                <option key={evt.id} value={evt.eventTitle} className="bg-white dark:bg-slate-900">
                  {evt.eventTitle}
                </option>
              ))}
            </select>
          </div>

          {/* 3. ⚧️ Filter by Gender */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              ⚧️ Filter by Gender
            </label>
            <select
              value={selectedGender}
              onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Genders</option>
              <option value="Boys" className="bg-white dark:bg-slate-900">Boys (Male)</option>
              <option value="Girls" className="bg-white dark:bg-slate-900">Girls (Female)</option>
              <option value="Mixed" className="bg-white dark:bg-slate-900">Mixed</option>
            </select>
          </div>

          {/* 4. 🏫 Filter by College */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              🏫 Filter by College
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => { setSelectedCollege(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Colleges</option>
              {ALL_COLLEGES.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. 🔍 Search Participant */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              🔍 Search Participant
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search name, mobile, team..."
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Showing {filteredParticipants.length} of {participants.length} Participants
          </span>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">Master Database Records</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading Master Participant Roster...</p>
          </div>
        ) : paginatedParticipants.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No participants found matching criteria.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Adjust filters to broaden roster view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Reg Time</th>
                  <th className="py-3 px-3">Game & Event Title</th>
                  <th className="py-3 px-3">Team Name</th>
                  <th className="py-3 px-3">College Name</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Mobile No</th>
                  <th className="py-3 px-3">Gender</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {paginatedParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* 1. Reg Time */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-mono">
                      <div>{p.date || '2026-08-05'}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.time || '10:00 AM'}</div>
                    </td>

                    {/* 2. Game & Event Title */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">{p.sportName}</div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold max-w-[200px] truncate" title={p.eventTitle}>
                        {p.eventTitle || `${p.sportName} Championship`}
                      </div>
                    </td>

                    {/* 3. Team Name */}
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                      {p.teamName || p.name}
                    </td>

                    {/* 4. College Name */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-amber-600 dark:text-amber-400">
                      {p.college}
                    </td>

                    {/* 5. Student Name */}
                    <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isCaptain && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Captain
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {p.rollNo && p.rollNo !== 'N/A' ? `Roll: ${p.rollNo} • ` : ''}{p.email}
                      </div>
                    </td>

                    {/* 6. Mobile No */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-mono">
                      {p.mobile}
                    </td>

                    {/* 7. Gender */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                      {p.gender}
                    </td>

                    {/* 8. Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {p.status || 'VERIFIED'}
                      </span>
                    </td>

                    {/* 9. Details Action */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setSelectedParticipant({
                            id: p.id,
                            participantName: p.name || p.teamName,
                            rollNumber: p.rollNo || 'N/A',
                            college: p.college,
                            course: p.course || 'N/A',
                            yearSemester: p.yearSemester || 'N/A',
                            year: p.yearSemester || 'N/A',
                            gender: p.gender,
                            gameSport: p.sportName,
                            category: p.teamName ? 'Team Event' : 'Individual',
                            mobile: p.mobile,
                            email: p.email,
                            registrationDate: p.date || '2026-08-05',
                            registrationTime: p.time || '10:00 AM',
                            paymentStatus: 'PAID',
                            registrationStatus: p.status || 'VERIFIED',
                            registeredBy: 'Super Coordinator Roster',
                            isCaptain: p.isCaptain
                          });
                          setIsDetailsOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-purple-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="View Full Participant Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && filteredParticipants.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
            <span className="text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredParticipants.length)} of {filteredParticipants.length} master records
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-bold text-white bg-slate-800 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <RegistrationDetailsModal
        isOpen={isDetailsOpen}
        registration={selectedParticipant}
        onClose={() => { setIsDetailsOpen(false); setSelectedParticipant(null); }}
      />
    </div>
  );
};
