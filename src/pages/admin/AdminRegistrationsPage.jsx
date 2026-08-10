import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { exportToCSV, exportToPDF } from '../../utils/pdfExporter';
import { RegistrationDetailsModal } from '../../components/admin/RegistrationDetailsModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { ALL_12_SPORTS, ALL_COLLEGES } from '../../services/superCoordinatorApi';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  Users
} from 'lucide-react';

export const AdminRegistrationsPage = () => {
  const { addToast } = useToast();

  // Data States
  const [coordinatorEvents, setCoordinatorEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab View: 'student_registrations' | 'coordinator_events'
  const [activeTab, setActiveTab] = useState('student_registrations');

  // Exact 5 Filters State for Student Registrations
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Inspection Modal State
  const [selectedReg, setSelectedReg] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Delete Action Modal State: { type: 'registration' | 'coordinator_event', item: object }
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAllData();

    const handleUpdate = () => {
      fetchAllData();
    };
    window.addEventListener('sems_events_updated', handleUpdate);
    window.addEventListener('sems_coord_events_updated', handleUpdate);
    window.addEventListener('sems_registrations_updated', handleUpdate);

    return () => {
      window.removeEventListener('sems_events_updated', handleUpdate);
      window.removeEventListener('sems_coord_events_updated', handleUpdate);
      window.removeEventListener('sems_registrations_updated', handleUpdate);
    };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [eventsList, regsList] = await Promise.all([
        adminApi.getCoordinatorEvents(),
        adminApi.getRegistrations()
      ]);
      setCoordinatorEvents(eventsList || []);
      setRegistrations(regsList || []);
    } catch (err) {
      addToast('Failed to load registration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete Confirmation Execution
  const handleDeleteConfirm = async (reason) => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      if (deletingItem.type === 'coordinator_event') {
        await adminApi.deleteCoordinatorEvent(deletingItem.item.id);
        addToast(`Coordinator Event "${deletingItem.item.eventTitle || deletingItem.item.id}" removed from all stores!`, 'success');
      } else {
        await adminApi.deleteRegistration(deletingItem.item.id, reason);
        addToast(`Registration #${deletingItem.item.id} removed from all stores!`, 'success');
      }
      setDeletingItem(null);
      await fetchAllData();
    } catch (err) {
      addToast(err.message || 'Failed to delete item', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Available Coordinator Events matching selected sport
  const availableEvents = coordinatorEvents.filter((evt) => {
    if (selectedSport === 'ALL') return true;
    return (evt.sportId || '').toLowerCase() === selectedSport.toLowerCase() ||
           (evt.sportName || '').toLowerCase().includes(selectedSport.toLowerCase());
  });

  // Filtered Student Registrations
  const filteredRegistrations = registrations.filter((reg) => {
    if (selectedSport !== 'ALL') {
      const pSport = (reg.gameSport || reg.sportName || '').toLowerCase();
      if (!pSport.includes(selectedSport.toLowerCase())) return false;
    }

    if (selectedEvent !== 'ALL') {
      const pEvent = (reg.eventTitle || '').toLowerCase();
      if (!pEvent.includes(selectedEvent.toLowerCase())) return false;
    }

    if (selectedGender !== 'ALL') {
      const pGender = (reg.gender || '').toLowerCase();
      if (!pGender.includes(selectedGender.toLowerCase())) return false;
    }

    if (selectedCollege !== 'ALL') {
      const pCollege = (reg.college || reg.collegeName || '').toLowerCase();
      if (!pCollege.includes(selectedCollege.toLowerCase())) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (reg.participantName || reg.studentName || '').toLowerCase().includes(q);
      const matchTeam = (reg.teamName || '').toLowerCase().includes(q);
      const matchMobile = (reg.mobile || '').toLowerCase().includes(q);
      const matchId = (reg.id || '').toLowerCase().includes(q);
      const matchCollege = (reg.college || '').toLowerCase().includes(q);
      const matchSport = (reg.gameSport || '').toLowerCase().includes(q);
      return matchName || matchTeam || matchMobile || matchId || matchCollege || matchSport;
    }
    return true;
  });

  // Filtered Coordinator Events
  const filteredCoordinatorEvents = coordinatorEvents.filter((evt) => {
    if (selectedSport !== 'ALL') {
      const s = (evt.sportName || evt.sportId || '').toLowerCase();
      if (!s.includes(selectedSport.toLowerCase())) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (evt.eventTitle || '').toLowerCase().includes(q);
      const matchCoord = (evt.coordinatorName || '').toLowerCase().includes(q);
      const matchSport = (evt.sportName || '').toLowerCase().includes(q);
      const matchVenue = (evt.venue || '').toLowerCase().includes(q);
      return matchTitle || matchCoord || matchSport || matchVenue;
    }
    return true;
  });

  // Pagination for Student Registrations
  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / itemsPerPage));
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }
    const exportData = filteredRegistrations.map(r => ({
      'Reg Time': `${r.registrationDate} ${r.registrationTime || '10:00 AM'}`,
      'Game & Event Title': `${r.gameSport} - ${r.eventTitle || 'Tournament'}`,
      'Team Name': r.teamName || r.participantName,
      'College Name': r.college,
      'Student Name': r.participantName,
      'Mobile No': r.mobile,
      'Gender': r.gender,
      'Status': r.registrationStatus
    }));
    exportToCSV(exportData, `Student_Registrations_${Date.now()}`);
    addToast('Filtered registrations exported to CSV', 'success');
  };

  const handleExportPDF = () => {
    if (filteredRegistrations.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }
    const headers = [['Reg Time', 'Game & Event Title', 'Team Name', 'College Name', 'Student Name', 'Mobile No', 'Gender', 'Status']];
    const rows = filteredRegistrations.map(r => [
      `${r.registrationDate} ${r.registrationTime || '10:00 AM'}`,
      `${r.gameSport} - ${r.eventTitle || 'Tournament'}`,
      r.teamName || r.participantName,
      r.college,
      r.participantName,
      r.mobile,
      r.gender,
      r.registrationStatus
    ]);
    exportToPDF('Student Registration Detail Report', headers, rows, `Student_Registrations_${Date.now()}`);
    addToast('Filtered registrations exported to PDF', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
              Super Coordinator Replicated View
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Student Registration Details & Events</h1>
          <p className="text-xs text-slate-400">
            View student registration records ({filteredRegistrations.length}) & coordinator event creations ({coordinatorEvents.length})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={fetchAllData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => { setActiveTab('student_registrations'); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'student_registrations'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Registration Detail ({filteredRegistrations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('coordinator_events')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'coordinator_events'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Coordinator Event Creations ({filteredCoordinatorEvents.length})</span>
        </button>
      </div>

      {/* EXACT 5 FILTERS CONTROL BAR REQUESTED BY USER */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>Master Registration Filters</span>
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
              className="text-xs font-bold text-rose-400 hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. 🎯 Filter by Game */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              🎯 Filter by Game
            </label>
            <select
              value={selectedSport}
              onChange={(e) => { setSelectedSport(e.target.value); setSelectedEvent('ALL'); setCurrentPage(1); }}
              className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All 12 Sports</option>
              {ALL_12_SPORTS.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. 📋 Filter by Event Title */}
          <div>
            <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">
              📋 Filter by Event Title
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => { setSelectedEvent(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-800/70 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Created Events ({availableEvents.length})</option>
              {availableEvents.map((evt) => (
                <option key={evt.id} value={evt.eventTitle}>
                  {evt.eventTitle}
                </option>
              ))}
            </select>
          </div>

          {/* 3. ⚧️ Filter by Gender */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              ⚧️ Filter by Gender
            </label>
            <select
              value={selectedGender}
              onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Genders</option>
              <option value="Boys">Boys (Male)</option>
              <option value="Girls">Girls (Female)</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          {/* 4. 🏫 Filter by College */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              🏫 Filter by College
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => { setSelectedCollege(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Colleges</option>
              {ALL_COLLEGES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. 🔍 Search Participant */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              🔍 Search Participant
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search name, mobile, team..."
                className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT TAB 1: STUDENT REGISTRATION DETAIL TABLE */}
      {activeTab === 'student_registrations' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-white">Student Registration Details ({filteredRegistrations.length})</span>
            <span className="text-[11px] text-amber-400 font-mono">Delete action removes registration from every store</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading student registration details...</p>
            </div>
          ) : paginatedRegistrations.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm font-bold text-slate-300">No student registrations found matching filters.</p>
              <p className="text-xs text-slate-500">Try adjusting filters or live search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3">Reg Time</th>
                    <th className="py-3 px-3">Game & Event Title</th>
                    <th className="py-3 px-3">Team Name</th>
                    <th className="py-3 px-3">College Name</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Mobile No</th>
                    <th className="py-3 px-3">Gender</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {paginatedRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* 1. Reg Time */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300 font-mono">
                        <div>{reg.registrationDate}</div>
                        <div className="text-[10px] text-slate-500">{reg.registrationTime || '10:00 AM'}</div>
                      </td>

                      {/* 2. Game & Event Title */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-white">{reg.gameSport}</div>
                        <div className="text-[10px] text-amber-400 font-semibold max-w-[200px] truncate" title={reg.eventTitle}>
                          {reg.eventTitle || `${reg.gameSport} Championship`}
                        </div>
                      </td>

                      {/* 3. Team Name */}
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-200">
                        {reg.teamName || reg.participantName}
                      </td>

                      {/* 4. College Name */}
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-amber-400">
                        {reg.college}
                      </td>

                      {/* 5. Student Name */}
                      <td className="py-3 px-3 whitespace-nowrap font-semibold text-white">
                        <div>{reg.participantName}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{reg.email}</div>
                      </td>

                      {/* 6. Mobile No */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300 font-mono">
                        {reg.mobile}
                      </td>

                      {/* 7. Gender */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300 font-medium">
                        {reg.gender}
                      </td>

                      {/* 8. Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {reg.registrationStatus || 'VERIFIED'}
                        </span>
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3 px-3 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => { setSelectedReg(reg); setIsDetailsOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingItem({ type: 'registration', item: reg })}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Delete Registration (Removes from everywhere)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          {!loading && filteredRegistrations.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRegistrations.length)} of {filteredRegistrations.length} registrations
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
      )}

      {/* CONTENT TAB 2: COORDINATOR EVENT CREATIONS TABLE WITH DELETE OPTION */}
      {activeTab === 'coordinator_events' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-white">Events Created by Coordinators ({filteredCoordinatorEvents.length})</span>
            <span className="text-[11px] text-rose-400 font-mono">Delete action removes event & registration setup from every store</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading coordinator events...</p>
            </div>
          ) : filteredCoordinatorEvents.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm font-bold text-slate-300">No events created by coordinators yet.</p>
              <p className="text-xs text-slate-500">When any coordinator creates an event registration, it will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3">Sport</th>
                    <th className="py-3 px-3">Event Registration Title</th>
                    <th className="py-3 px-3">Created By Coordinator</th>
                    <th className="py-3 px-3">Created On</th>
                    <th className="py-3 px-3">Reg. Dates</th>
                    <th className="py-3 px-3">Venue</th>
                    <th className="py-3 px-3">Entry Fee</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredCoordinatorEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-amber-400 whitespace-nowrap">{evt.sportName}</td>
                      <td className="py-3 px-3 font-extrabold text-white max-w-[200px]">
                        <div className="truncate" title={evt.eventTitle}>{evt.eventTitle}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-white">{evt.coordinatorName}</div>
                        <div className="text-[10px] text-slate-500">{evt.coordinatorEmail}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400">{evt.createdDate || '—'}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                        {evt.regStartDate ? `${evt.regStartDate} → ${evt.regEndDate}` : '—'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300">{evt.venue || 'Main Stadium'}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-emerald-400">
                        {evt.teamFee > 0 ? `₹${evt.teamFee}` : 'Free Entry'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            evt.status === 'Published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {evt.status || 'Published'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => setDeletingItem({ type: 'coordinator_event', item: evt })}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs flex items-center gap-1 ml-auto transition-colors"
                          title="Delete Event Registration from everywhere"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Event</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Details Inspection Modal */}
      <RegistrationDetailsModal
        isOpen={isDetailsOpen}
        registration={selectedReg}
        onClose={() => { setIsDetailsOpen(false); setSelectedReg(null); }}
      />

      {/* Delete Confirmation Modal for Both Registrations and Coordinator Events */}
      <ConfirmationModal
        isOpen={Boolean(deletingItem)}
        title={deletingItem?.type === 'coordinator_event' ? 'Delete Coordinator Event Registration' : 'Delete Student Registration'}
        message={
          deletingItem?.type === 'coordinator_event'
            ? `Are you sure you want to delete event "${deletingItem?.item?.eventTitle}"? This will purge the event from ALL coordinator portals & public registration listings.`
            : `Are you sure you want to delete registration #${deletingItem?.item?.id} (${deletingItem?.item?.participantName})? This will remove the participant record from ALL stores.`
        }
        warningNote="PERMANENT ACTION: Admin delete removes this record from EVERY place in the database/storage."
        requireReason={deletingItem?.type !== 'coordinator_event'}
        confirmButtonText="Confirm Delete & Remove Everywhere"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
};
