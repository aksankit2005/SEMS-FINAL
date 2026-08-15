import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { ALL_12_SPORTS, ALL_COLLEGES } from '../../services/superCoordinatorApi';
import { CoordinatorFormModal } from '../../components/admin/CoordinatorFormModal';
import { ResetPasswordModal } from '../../components/admin/ResetPasswordModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit,
  Power,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  Filter,
  RefreshCw,
  Building,
  Crown,
  Camera
} from 'lucide-react';

export const AdminCoordinatorsPage = () => {
  const { addToast } = useToast();
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCollege, setFilterCollege] = useState('ALL');
  const [filterSport, setFilterSport] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [resetTargetCoord, setResetTargetCoord] = useState(null);
  const [toggleTargetCoord, setToggleTargetCoord] = useState(null);
  const [deleteTargetCoord, setDeleteTargetCoord] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCoordinators();
      setCoordinators(data || []);
    } catch (err) {
      addToast('Failed to load coordinator accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Form Save Handler (Create / Edit)
  const handleSaveCoordinator = async (formData) => {
    try {
      const updatedList = await adminApi.saveCoordinator(formData);
      setCoordinators(updatedList);
      addToast(
        formData.id ? 'Coordinator account updated successfully' : 'New account created successfully',
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Failed to save coordinator', 'error');
    }
  };

  // Toggle Activate / Deactivate Handler
  const handleToggleConfirm = async () => {
    if (!toggleTargetCoord) return;

    setIsToggling(true);
    try {
      const updatedList = await adminApi.toggleCoordinatorStatus(toggleTargetCoord);
      setCoordinators(updatedList);
      const actionStr = toggleTargetCoord.status === 'Active' ? 'deactivated' : 'activated';
      addToast(`Account ${toggleTargetCoord.name} ${actionStr} successfully!`, 'success');
      setToggleTargetCoord(null);
    } catch (err) {
      addToast(err.message || 'Failed to change status', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  // Password Reset Handler
  const handleResetPassword = async (id, newPass) => {
    try {
      await adminApi.resetCoordinatorPassword(resetTargetCoord || id, newPass);
      addToast('Password reset successfully! Password log generated.', 'success');
      setResetTargetCoord(null);
    } catch (err) {
      addToast(err.message || 'Password reset failed', 'error');
    }
  };

  // Delete Account Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTargetCoord) return;

    setIsDeleting(true);
    try {
      const updatedList = await adminApi.deleteCoordinator(deleteTargetCoord);
      setCoordinators(updatedList);
      addToast(`Account ${deleteTargetCoord.name} deleted permanently!`, 'success');
      setDeleteTargetCoord(null);
    } catch (err) {
      addToast(err.message || 'Failed to delete account', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Coordinator Accounts
  const filteredCoordinators = coordinators.filter((c) => {
    if (filterRole !== 'ALL' && (c.role || '').toLowerCase() !== filterRole.toLowerCase()) return false;
    if (filterStatus !== 'ALL' && (c.status || '').toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterCollege !== 'ALL' && (c.college || '').toLowerCase() !== filterCollege.toLowerCase()) return false;
    if (filterSport !== 'ALL' && (c.assignedSport || c.sportName || '').toLowerCase() !== filterSport.toLowerCase()) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchUser = (c.username || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchSport = (c.sportName || c.assignedSport || '').toLowerCase().includes(q);
      const matchCollege = (c.college || '').toLowerCase().includes(q);
      return matchName || matchUser || matchEmail || matchSport || matchCollege;
    }
    return true;
  });

  // Grouped Accounts into exact 4 sections
  // Section 1: All Sports Coordinators (every Coordinator-role account)
  const sportsCoordinators = filteredCoordinators.filter(
    (c) => c.role === 'Coordinator' || !c.role
  );

  // Section 2: Head Coordinators
  const headCoordinators = filteredCoordinators.filter(c => c.role === 'Head Coordinator');

  // Section 3: Super Coordinators
  const superCoordinators = filteredCoordinators.filter(c => c.role === 'Super Coordinator');

  // Section 4: PR Members
  const prMembers = filteredCoordinators.filter(c => c.role === 'PR Member');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Coordinator & Role Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage 12 Sports Coordinators, Head Coordinators, Super Coordinators & PR Members (Edit, Password Reset, Active/Inactive)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedCoord(null); setIsFormOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Account</span>
          </button>
          <button
            onClick={fetchCoordinators}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Master Account Filters</span>
          </div>

          {(filterRole !== 'ALL' || filterStatus !== 'ALL' || filterCollege !== 'ALL' || filterSport !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setFilterRole('ALL');
                setFilterStatus('ALL');
                setFilterCollege('ALL');
                setFilterSport('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Live Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">🔍 Search Account</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, sport..."
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Filter by Role */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">👤 Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Roles</option>
              <option value="Coordinator" className="bg-white dark:bg-slate-900">Coordinator (12 Sports)</option>
              <option value="Head Coordinator" className="bg-white dark:bg-slate-900">Head Coordinator</option>
              <option value="Super Coordinator" className="bg-white dark:bg-slate-900">Super Coordinator</option>
              <option value="PR Member" className="bg-white dark:bg-slate-900">PR Member</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">⚡ Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Status</option>
              <option value="Active" className="bg-white dark:bg-slate-900">Active</option>
              <option value="Inactive" className="bg-white dark:bg-slate-900">Inactive</option>
            </select>
          </div>

          {/* Filter by College */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">🏫 Filter by College</label>
            <select
              value={filterCollege}
              onChange={(e) => setFilterCollege(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Colleges</option>
              {ALL_COLLEGES.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
                  {c.id}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Sport */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">🎯 Filter by Sport</label>
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All 12 Sports</option>
              {ALL_12_SPORTS.map((s) => (
                <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 1: 12 SPORTS COORDINATORS */}
      {(filterRole === 'ALL' || filterRole === 'Coordinator') && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>1. Sports Coordinators ({sportsCoordinators.length})</span>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">{ALL_12_SPORTS.length} Games Covered</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading sports coordinators...</p>
            </div>
          ) : sportsCoordinators.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No Coordinators match filters.</p>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3">Sport / Game</th>
                    <th className="py-3 px-3">Coordinator Name</th>
                    <th className="py-3 px-3">Username</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {sportsCoordinators.map((coordinator) => {
                    const sportObj = ALL_12_SPORTS.find(
                      (s) =>
                        s.id.toLowerCase() === (coordinator.assignedSport || '').toLowerCase() ||
                        s.name.toLowerCase() === (coordinator.sportName || '').toLowerCase()
                    ) || { icon: '🎯', name: coordinator.sportName || 'General' };
                    return (
                      <tr key={coordinator.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <span className="mr-1.5">{sportObj.icon}</span> {sportObj.name}
                        </td>
                        <td className="py-3 px-3 font-semibold whitespace-nowrap">
                          <span className="text-amber-600 dark:text-amber-400">{coordinator.name}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {coordinator.username}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {coordinator.email}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {coordinator.phone}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              coordinator.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {coordinator.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-right space-x-1">
                          <button
                            onClick={() => { setSelectedCoord(coordinator); setIsFormOpen(true); }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Edit Coordinator Details"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setResetTargetCoord(coordinator)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20 transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => setToggleTargetCoord(coordinator)}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors border cursor-pointer ${
                              coordinator.status === 'Active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {coordinator.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setDeleteTargetCoord(coordinator)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-[11px] border border-rose-500/20 transition-colors cursor-pointer"
                            title="Delete Coordinator Permanently"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: HEAD COORDINATORS */}
      {(filterRole === 'ALL' || filterRole === 'Head Coordinator') && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>2. Head Coordinators / College Heads ({headCoordinators.length})</span>
            </div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">College Head Controls</span>
          </div>

          {headCoordinators.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No Head Coordinators match filters.</p>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3">College Name</th>
                    <th className="py-3 px-3">Head Coordinator Name</th>
                    <th className="py-3 px-3">Username</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {headCoordinators.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">{c.college || 'MPEC'}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{c.name}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{c.username}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{c.email}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{c.phone}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            c.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => { setSelectedCoord(c); setIsFormOpen(true); }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setResetTargetCoord(c)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20 transition-colors cursor-pointer"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => setToggleTargetCoord(c)}
                          className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors border cursor-pointer ${
                            c.status === 'Active'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteTargetCoord(c)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-[11px] border border-rose-500/20 transition-colors cursor-pointer"
                          title="Delete Coordinator Permanently"
                        >
                          Delete
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

      {/* SECTION 3: SUPER COORDINATORS */}
      {(filterRole === 'ALL' || filterRole === 'Super Coordinator') && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>3. Super Coordinators / Event Hosts ({superCoordinators.length})</span>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">Global Fest Authority</span>
          </div>

          {superCoordinators.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No Super Coordinators match filters.</p>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3">Super Coordinator Name</th>
                    <th className="py-3 px-3">Username</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {superCoordinators.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{c.name}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{c.username}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{c.email}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{c.phone}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            c.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => { setSelectedCoord(c); setIsFormOpen(true); }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setResetTargetCoord(c)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20 transition-colors cursor-pointer"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => setToggleTargetCoord(c)}
                          className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors border cursor-pointer ${
                            c.status === 'Active'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteTargetCoord(c)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-[11px] border border-rose-500/20 transition-colors cursor-pointer"
                          title="Delete Coordinator Permanently"
                        >
                          Delete
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

      {/* SECTION 4: PR MEMBERS */}
      {(filterRole === 'ALL' || filterRole === 'PR Member') && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>4. PR Members / Media Team ({prMembers.length})</span>
            </div>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">Media & PR Desk</span>
          </div>

          {prMembers.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No PR Members match filters.</p>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3">PR Member Name</th>
                    <th className="py-3 px-3">Username</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {prMembers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{c.name}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{c.username}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{c.email}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{c.phone}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            c.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => { setSelectedCoord(c); setIsFormOpen(true); }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setResetTargetCoord(c)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20 transition-colors cursor-pointer"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => setToggleTargetCoord(c)}
                          className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors border cursor-pointer ${
                            c.status === 'Active'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteTargetCoord(c)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-[11px] border border-rose-500/20 transition-colors cursor-pointer"
                          title="Delete Coordinator Permanently"
                        >
                          Delete
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

      {/* Create / Edit Account Modal */}
      <CoordinatorFormModal
        isOpen={isFormOpen}
        coordinator={selectedCoord}
        onSave={handleSaveCoordinator}
        onClose={() => { setIsFormOpen(false); setSelectedCoord(null); }}
      />

      {/* Password Reset Modal */}
      <ResetPasswordModal
        isOpen={Boolean(resetTargetCoord)}
        coordinator={resetTargetCoord}
        onReset={handleResetPassword}
        onClose={() => setResetTargetCoord(null)}
      />

      {/* Deactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(toggleTargetCoord)}
        title={toggleTargetCoord?.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
        message={
          toggleTargetCoord?.status === 'Active'
            ? `Are you sure you want to deactivate ${toggleTargetCoord?.name}? They will no longer be able to access their portal.`
            : `Are you sure you want to activate ${toggleTargetCoord?.name}? They will regain portal access.`
        }
        confirmButtonText={toggleTargetCoord?.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
        confirmVariant={toggleTargetCoord?.status === 'Active' ? 'warning' : 'primary'}
        isLoading={isToggling}
        onConfirm={handleToggleConfirm}
        onClose={() => setToggleTargetCoord(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetCoord)}
        title="Delete Coordinator Account"
        message={`Are you sure you want to permanently delete ${deleteTargetCoord?.name} (${deleteTargetCoord?.username})? This action cannot be undone and they will lose all portal access.`}
        warningNote="The coordinator account will be permanently removed. This cannot be undone."
        confirmButtonText="Delete Account"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTargetCoord(null)}
      />
    </div>
  );
};
