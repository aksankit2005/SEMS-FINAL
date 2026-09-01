import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { superCoordinatorApi, ALL_12_SPORTS, ALL_COLLEGES } from '../../services/superCoordinatorApi';
import { SPORTS_DATA } from '../../data/sportsData';
import { useToast } from '../../context/ToastContext';
import { exportToCSV, exportToPDF } from '../../utils/pdfExporter';
import { getParticipationType } from '../../utils/rosterHelper';
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
  IndianRupee,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  X
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

  // Multi-Select & Delete Modal State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'SINGLE', // 'SINGLE' or 'BULK'
    item: null,
    count: 0
  });

  useEffect(() => {
    fetchMasterData();
    const handleUpdate = () => fetchMasterData();
    window.addEventListener('sems_registrations_updated', handleUpdate);
    window.addEventListener('sems_events_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sems_registrations_updated', handleUpdate);
      window.removeEventListener('sems_events_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [data, eventsList] = await Promise.all([
        superCoordinatorApi.getMasterParticipants(),
        superCoordinatorApi.getCoordinatorEvents()
      ]);
      setParticipants(data || []);
      setCoordinatorEvents(eventsList || []);
    } catch (err) {
      addToast('Failed to load Master Data participants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getItemId = (p) => String(p.receiptId || p.registrationId || p.memberId || p.id).trim();

  const handleToggleSelectRow = (p) => {
    const idVal = getItemId(p);
    setSelectedIds((prev) =>
      prev.includes(idVal) ? prev.filter((id) => id !== idVal) : [...prev, idVal]
    );
  };

  const handleToggleSelectAll = (isChecked, currentList) => {
    if (isChecked) {
      const pageIds = currentList.map(getItemId).filter(Boolean);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(currentList.map(getItemId));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleOpenSingleDelete = (p) => {
    setConfirmModal({
      isOpen: true,
      type: 'SINGLE',
      item: p,
      count: 1
    });
  };

  const handleOpenBulkDelete = () => {
    if (selectedIds.length === 0) {
      addToast('Please select at least one record to delete.', 'warning');
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'BULK',
      item: null,
      count: selectedIds.length
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (confirmModal.type === 'SINGLE' && confirmModal.item) {
        const targetId = getItemId(confirmModal.item);
        await superCoordinatorApi.deleteMasterDataParticipant(targetId);
        setParticipants((prev) =>
          prev.filter(
            (item) =>
              getItemId(item) !== targetId &&
              item.id !== targetId &&
              item.receiptId !== targetId &&
              item.registrationId !== targetId &&
              item.memberId !== targetId
          )
        );
        setSelectedIds((prev) => prev.filter((id) => id !== targetId));
        addToast(`Participant "${confirmModal.item.name || 'Record'}" deleted successfully!`, 'success');
      } else if (confirmModal.type === 'BULK') {
        const res = await superCoordinatorApi.bulkDeleteMasterData(selectedIds);
        const deletedNum = res?.deletedCount || selectedIds.length;
        const selectedSet = new Set(selectedIds);
        setParticipants((prev) =>
          prev.filter((item) => !selectedSet.has(getItemId(item)))
        );
        setSelectedIds([]);
        addToast(`Successfully deleted ${deletedNum} participant records from database!`, 'success');
      }
      await fetchMasterData();
    } catch (err) {
      addToast(err.message || 'Failed to delete record(s) from database', 'error');
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, type: 'SINGLE', item: null, count: 0 });
    }
  };

  // Available Coordinator Events matching selected sport
  const availableEvents = coordinatorEvents.filter((evt) => {
    if (selectedSport === 'ALL') return true;
    return (evt.sportId || '').toLowerCase() === selectedSport.toLowerCase() ||
           (evt.sportName || '').toLowerCase().includes(selectedSport.toLowerCase()) ||
           selectedSport.toLowerCase().includes((evt.sportName || '').toLowerCase());
  });

  // Filtered Master Participants - matching Super Coordinator view logic
  const filteredParticipants = participants.filter((p) => {
    const matchesSport = selectedSport === 'ALL' ||
      (p.sportId || '').toLowerCase() === selectedSport.toLowerCase() ||
      (p.sportName || '').toLowerCase().includes(selectedSport.toLowerCase()) ||
      selectedSport.toLowerCase().includes((p.sportName || '').toLowerCase());

    const matchesEvent = selectedEvent === 'ALL' ||
      (p.eventTitle || '').toLowerCase().trim() === selectedEvent.toLowerCase().trim() ||
      (p.eventTitle || '').toLowerCase().includes(selectedEvent.toLowerCase()) ||
      selectedEvent.toLowerCase().includes((p.eventTitle || '').toLowerCase());

    const pGender = (p.gender || '').toLowerCase();
    const sGender = selectedGender.toLowerCase();
    const matchesGender = selectedGender === 'ALL' ||
      (sGender === 'male' ? (pGender.includes('male') || pGender.includes('boy')) :
       sGender === 'female' ? (pGender.includes('female') || pGender.includes('girl')) :
       pGender.includes(sGender));

    const pCollege = (p.college || '').toLowerCase();
    const matchesCollege = selectedCollege === 'ALL' ||
      pCollege.includes(selectedCollege.toLowerCase()) ||
      selectedCollege.toLowerCase().includes(pCollege) ||
      (selectedCollege === 'EXTERNAL' && !['mpec', 'mips', 'mpcps', 'mpcp', 'mpdc', 'mpcn', 'mpamc', 'mpcams'].some(c => pCollege.includes(c)));

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.teamName || '').toLowerCase().includes(q) ||
      (p.mobile || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.college || '').toLowerCase().includes(q) ||
      (p.sportName || '').toLowerCase().includes(q) ||
      (p.receiptId || '').toLowerCase().includes(q) ||
      (p.registrationId || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q) ||
      (p.rollNo || '').toLowerCase().includes(q);

    return matchesSport && matchesEvent && matchesGender && matchesCollege && matchesSearch;
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
      'Registration Date': p.date || 'N/A',
      'Registration Time': p.time || 'N/A',
      'Participation Type': p.participationType || getParticipationType(p),
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
    const headers = ['#', 'Reg ID', 'Type', 'Sport', 'Team Name', 'College', 'Player Name', 'Role', 'Roll No', 'Mobile', 'Course', 'Status'];
    const rows = filteredParticipants.map((p, idx) => [
      idx + 1,
      p.receiptId || p.registrationId || p.id || 'N/A',
      p.participationType || getParticipationType(p),
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
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
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
            <label className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">
              📋 Filter by Event Title
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => { setSelectedEvent(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-blue-500/40 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
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
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Genders</option>
              <option value="Male" className="bg-white dark:bg-slate-900">Male</option>
              <option value="Female" className="bg-white dark:bg-slate-900">Female</option>
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
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Showing {filteredParticipants.length} of {participants.length} Participants
            </span>
            {selectedIds.length > 0 && (
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {selectedIds.length} Selected
              </span>
            )}
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">Master Database Records</span>
        </div>

        {/* Multi-Select Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs shadow-sm transition-all animate-fadeIn">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
              <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Selected: {selectedIds.length} participant record{selectedIds.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold transition-colors"
              >
                Clear Selection
              </button>
              <button
                disabled={isDeleting}
                onClick={handleOpenBulkDelete}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

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
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedParticipants.length > 0 &&
                        paginatedParticipants.every((p) => selectedIds.includes(getItemId(p)))
                      }
                      onChange={(e) => handleToggleSelectAll(e.target.checked, paginatedParticipants)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500/20 cursor-pointer accent-purple-600"
                      title="Select All Records on Current Page"
                    />
                  </th>
                  <th className="py-3 px-3">Reg Time</th>
                  <th className="py-3 px-3">Game & Event Title</th>
                  <th className="py-3 px-3">Team Name</th>
                  <th className="py-3 px-3">College Name</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Mobile No</th>
                  <th className="py-3 px-3">Gender</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Details & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {paginatedParticipants.map((p) => {
                  const pId = getItemId(p);
                  const isSelected = selectedIds.includes(pId);
                  return (
                    <tr
                      key={p.id || p.memberId || pId}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-purple-500/5 dark:bg-purple-500/10' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(p)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500/20 cursor-pointer accent-purple-600"
                        />
                      </td>

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
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">
                        {p.college}
                      </td>

                      {/* 5. Student Name */}
                      <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.isCaptain && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
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

                      {/* 9. Details & Delete Action */}
                      <td className="py-3 px-3 whitespace-nowrap text-right flex items-center justify-end gap-1">
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
                        <button
                          disabled={isDeleting}
                          onClick={() => handleOpenSingleDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40"
                          title="Delete Participant Record from Master Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Confirm Database Deletion</span>
              </div>
              <button
                disabled={isDeleting}
                onClick={() => setConfirmModal({ isOpen: false, type: 'SINGLE', item: null, count: 0 })}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmModal.type === 'SINGLE' ? (
                <>
                  <p>
                    Are you sure you want to delete participant <strong className="text-slate-900 dark:text-white font-bold">{confirmModal.item?.name}</strong> ({confirmModal.item?.sportName}) from Master Data?
                  </p>
                  {confirmModal.item && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 font-mono text-[11px] space-y-1">
                      <div>Student: <span className="text-purple-600 dark:text-purple-400 font-semibold">{confirmModal.item.name}</span></div>
                      <div>Sport: <span className="text-blue-600 dark:text-blue-400 font-semibold">{confirmModal.item.sportName}</span></div>
                      <div>College: {confirmModal.item.college}</div>
                      {confirmModal.item.mobile && <div>Mobile: {confirmModal.item.mobile}</div>}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p>
                    Are you sure you want to delete <strong className="text-rose-600 dark:text-rose-400 font-bold">{confirmModal.count} selected records</strong> from Master Data?
                  </p>
                  <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-medium">
                    ⚠️ Warning: This will permanently remove all selected registrations and associated roster members from the PostgreSQL database. This action cannot be undone.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                disabled={isDeleting}
                onClick={() => setConfirmModal({ isOpen: false, type: 'SINGLE', item: null, count: 0 })}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{confirmModal.type === 'SINGLE' ? 'Delete Record' : `Delete (${confirmModal.count}) Records`}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
