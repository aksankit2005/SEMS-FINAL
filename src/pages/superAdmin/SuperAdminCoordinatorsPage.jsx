import React, { useState, useEffect } from 'react';
import { superAdminApi } from '../../services/superAdminApi';
import {
  UserPlus,
  KeyRound,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Trophy,
  X,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

export const SuperAdminCoordinatorsPage = () => {
  const [coordinators, setCoordinators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sports, setSports] = useState([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);

  // New Coordinator Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'SPORTS_COORDINATOR',
    assignedSport: 'Cricket',
    college: 'MPEC Kanpur',
    initialPassword: 'TempPassword123'
  });

  // Password Reset state
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCoordinators();
    setSports(superAdminApi.getSports());
  }, []);

  const loadCoordinators = () => {
    setCoordinators(superAdminApi.getCoordinators());
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    superAdminApi.addCoordinator(formData);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'SPORTS_COORDINATOR',
      assignedSport: sports[0]?.name || 'Cricket',
      college: 'MPEC Kanpur',
      initialPassword: 'TempPassword123'
    });
    loadCoordinators();
  };

  const handleOpenResetModal = (coordinator) => {
    setSelectedCoordinator(coordinator);
    const generated = 'Pass@' + Math.floor(1000 + Math.random() * 9000);
    setNewPassword(generated);
    setResetSuccessMsg('');
    setCopied(false);
    setIsPasswordModalOpen(true);
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!selectedCoordinator) return;
    superAdminApi.resetCoordinatorPassword(selectedCoordinator.id, newPassword);
    setResetSuccessMsg(`Password for ${selectedCoordinator.name} successfully updated to: ${newPassword}`);
    loadCoordinators();
  };

  const handleToggleStatus = (id) => {
    superAdminApi.toggleCoordinatorStatus(id);
    loadCoordinators();
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredCoordinators = coordinators.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.assignedSport && c.assignedSport.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || c.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-purple-400" />
            <span>Coordinator Management Hub</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Create coordinator IDs, assign sports/roles, reset passwords & control account access for handover
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Coordinator</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or sport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Roles</option>
            <option value="SPORTS_COORDINATOR">Sports Coordinators</option>
            <option value="COLLEGE_HEAD">College Heads</option>
            <option value="PR_MEMBER">PR & Media Members</option>
          </select>
        </div>
      </div>

      {/* Coordinators List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-4">Coordinator</th>
                <th className="p-4">Role & Assignment</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredCoordinators.map((coord) => (
                <tr key={coord.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Coordinator Name & ID */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300">
                        {coord.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{coord.name}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{coord.id}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role & Assignment */}
                  <td className="p-4">
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-purple-300 border border-slate-700">
                        {coord.role.replace('_', ' ')}
                      </span>
                      <p className="text-slate-300 font-medium flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>{coord.assignedSport || coord.college || coord.assignedDepartment || 'General'}</span>
                      </p>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="p-4 space-y-0.5 text-slate-400">
                    <p className="flex items-center gap-1.5 text-slate-300">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{coord.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{coord.phone}</span>
                    </p>
                  </td>

                  {/* Status Badge */}
                  <td className="p-4">
                    {coord.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> DISABLED
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenResetModal(coord)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset Pass</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(coord.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          coord.status === 'ACTIVE'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{coord.status === 'ACTIVE' ? 'Disable' : 'Enable'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Coordinator Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span>Create Coordinator Account</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@mpec.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Coordinator Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="SPORTS_COORDINATOR">Sports Coordinator</option>
                    <option value="COLLEGE_HEAD">College Head</option>
                    <option value="PR_MEMBER">PR & Media Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Sport</label>
                  <select
                    value={formData.assignedSport}
                    onChange={(e) => setFormData({ ...formData, assignedSport: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  >
                    {sports.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={formData.initialPassword}
                  onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30 hover:bg-purple-500"
                >
                  Save & Generate ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isPasswordModalOpen && selectedCoordinator && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Reset Password</span>
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <p className="text-slate-400">Target Coordinator:</p>
              <p className="font-bold text-white text-sm">{selectedCoordinator.name}</p>
              <p className="text-[11px] text-purple-300 font-mono">{selectedCoordinator.email}</p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">New Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 shrink-0 flex items-center gap-1"
                    title="Copy to Clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {resetSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  Confirm Password Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
