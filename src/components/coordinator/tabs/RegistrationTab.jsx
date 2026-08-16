import { 
  UserCheck, UserX, Search, Filter, Calendar, CheckCircle2, 
  XCircle, Clock, Eye, Download, ShieldCheck, ToggleLeft, ToggleRight, X, Trash2
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { getMemberCaptainStatus } from '../../../utils/booleanHelper';

export const RegistrationTab = ({ registrations, user, onUpdateRegistrations }) => {
  const { addToast } = useToast();
  const isBadminton = (user?.assignedSport || user?.sportName || '').toLowerCase().includes('badminton');

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete registration for "${name || id}"?`)) {
      await coordinatorApi.deleteRegistration(id);
      const updated = (registrations || []).filter(r => r.id !== id);
      onUpdateRegistrations(updated);
      addToast(`Registration for "${name || id}" deleted successfully!`, 'warning');
    }
  };
  
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isRegOpen, setIsRegOpen] = useState(true);
  const [deadlineDate, setDeadlineDate] = useState('2026-08-15');
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);

  const filtered = registrations.filter((r) => {
    const matchesSearch = 
      r.teamName?.toLowerCase().includes(search.toLowerCase()) ||
      r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      r.college?.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.toLowerCase().includes(search.toLowerCase());

    const matchesCollege = collegeFilter === 'all' || r.college === collegeFilter;
    const matchesGender = genderFilter === 'all' || r.gender === genderFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesCollege && matchesGender && matchesStatus;
  });

  const handleApprove = (id) => {
    const updated = registrations.map((r) =>
      r.id === id ? { ...r, status: 'Approved' } : r
    );
    onUpdateRegistrations(updated);
    addToast('Team registration approved successfully!', 'success');
  };

  const handleReject = (id) => {
    const updated = registrations.map((r) =>
      r.id === id ? { ...r, status: 'Rejected' } : r
    );
    onUpdateRegistrations(updated);
    addToast('Team registration rejected', 'info');
  };

  const handleToggleRegistrationStatus = () => {
    setIsRegOpen(!isRegOpen);
    addToast(
      `Registration is now ${!isRegOpen ? 'OPEN' : 'CLOSED'} for ${user?.sportName}`,
      !isRegOpen ? 'success' : 'warning'
    );
  };

  const handleSaveDeadline = () => {
    addToast(`Registration deadline updated to ${deadlineDate}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Registration Settings Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-orange-500" /> {user?.sportName} Registration Controls
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toggle registration status and set official submission deadline date.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleToggleRegistrationStatus}
              className={`px-4 py-2 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
                isRegOpen 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              {isRegOpen ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span>{isRegOpen ? 'Registration OPEN' : 'Registration CLOSED'}</span>
            </button>

            <span className="text-xs font-bold text-slate-400">
              Status: <span className={isRegOpen ? 'text-emerald-500 font-extrabold' : 'text-rose-500 font-extrabold'}>
                {isRegOpen ? 'Accepting Entries' : 'Submissions Locked'}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6 pt-4 md:pt-0">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Set Registration Deadline
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
            />
            <button
              onClick={handleSaveDeadline}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Multi-field Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams, captains..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={collegeFilter}
          onChange={(e) => setCollegeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Colleges</option>
          <option value="MPEC">MPEC</option>
          <option value="MIPS">MIPS</option>
          <option value="MPCPS (KN142)">MPCPS (KN142)</option>
          <option value="MPCP">MPCP</option>
          <option value="MPDC">MPDC</option>
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Genders</option>
          <option value="Male">Male Teams</option>
          <option value="Female">Female Teams</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Verification Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending Review</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Registrations Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="p-4">Reg ID / Team</th>
                <th className="p-4">Captain / Student</th>
                <th className="p-4">College</th>
                <th className="p-4">Razorpay Payment ID</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    <div>{r.teamName}</div>
                    <span className="text-[10px] font-mono text-slate-400">{r.id}</span>
                  </td>
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{r.studentName}</td>
                  <td className="p-4 font-bold text-blue-600 dark:text-indigo-400">{r.college}</td>
                  <td className="p-4 font-mono text-xs">
                    <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                      {r.utrNumber || r.paymentId || 'pay_FREE_PASS'}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      (r.paymentStatus || r.status || '').toLowerCase().includes('paid') || r.feePaid > 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {r.feePaid > 0 ? `PAID (₹${r.feePaid})` : 'FREE PASS'}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{r.gender}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                      r.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {r.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTeamModal(r)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-500 transition"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {r.status !== 'Approved' && (
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-[10px] hover:bg-emerald-600 transition flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" /> Approve
                        </button>
                      )}

                      {r.status !== 'Rejected' && (
                        <button
                          onClick={() => handleReject(r.id)}
                          className="px-2 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-[10px] hover:bg-rose-500 hover:text-white transition flex items-center gap-1 cursor-pointer"
                        >
                          <UserX className="w-3 h-3" /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Details Modal */}
      {selectedTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">{selectedTeamModal.teamName || selectedTeamModal.studentName}</h4>
                <p className="text-xs text-orange-500 font-bold">{user?.sportName} Registration Card</p>
              </div>
              <button onClick={() => setSelectedTeamModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <p><strong>Registration ID:</strong> <span className="font-mono">{selectedTeamModal.id}</span></p>
              <p><strong>Captain:</strong> {selectedTeamModal.studentName}</p>
              <p><strong>College:</strong> {selectedTeamModal.college}</p>
              <p><strong>Course:</strong> {selectedTeamModal.department || 'N/A'}</p>
              <p><strong>Gender:</strong> {selectedTeamModal.gender}</p>
              <p><strong>Registered Date:</strong> {selectedTeamModal.registeredDate || 'N/A'}</p>
            </div>

            {/* Full Team Roster List */}
            {Array.isArray(selectedTeamModal.members) && selectedTeamModal.members.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h5 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Registered Team Roster ({selectedTeamModal.members.length} Athletes)
                </h5>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                  {selectedTeamModal.members.map((m, idx) => {
                    const isCap = getMemberCaptainStatus(m, idx, selectedTeamModal.members);
                    return (
                      <div key={idx} className="p-2.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            <span>{m.fullName || m.name}</span>
                            {isCap && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Captain
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {m.rollNo ? `Roll: ${m.rollNo} • ` : ''}{m.course || 'N/A'} {m.yearSemester ? `• ${m.yearSemester}` : ''}
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-mono text-slate-500">
                          {m.mobile || m.phone || 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTeamModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
