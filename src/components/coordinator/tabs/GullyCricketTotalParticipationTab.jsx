import React, { useState } from 'react';
import { Users, Download, ShieldCheck, Trash2, Search } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { exportToCSV } from '../../../utils/pdfExporter';

export const GullyCricketTotalParticipationTab = ({ registrations = [], user, onUpdateRegistrations, globalSearch = '' }) => {
  const { addToast } = useToast();
  const [participants, setParticipants] = useState(() => {
    try {
      const saved = localStorage.getItem('sems_registrations_gully_cricket');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'REG-GULLY-5001', teamName: 'Gully Smashers', studentName: 'Dr. Nikhil Arora', college: 'MPDC', department: 'Dental Surgery', squadCount: '7 Players', contactPhone: '+91 9876543210', status: 'VERIFIED', registeredDate: '2026-08-02' },
      { id: 'REG-GULLY-6001', teamName: 'Street Kings', studentName: 'Tushar Saxena', college: 'MPCAMS', department: 'Nursing & Paramedical', squadCount: '6 Players', contactPhone: '+91 9876543211', status: 'VERIFIED', registeredDate: '2026-08-03' }
    ];
  });
  const [search, setSearch] = useState('');

  const handleVerify = (id) => {
    const updated = participants.map(p => p.id === id ? { ...p, status: p.status === 'VERIFIED' ? 'REJECTED' : 'VERIFIED' } : p);
    setParticipants(updated);
    try {
      localStorage.setItem('sems_registrations_gully_cricket', JSON.stringify(updated));
    } catch (e) {}
    addToast('Team verification status updated', 'success');
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this team registration?')) {
      const updated = participants.filter(p => p.id !== id);
      setParticipants(updated);
      try {
        localStorage.setItem('sems_registrations_gully_cricket', JSON.stringify(updated));
      } catch (e) {}
      addToast('Team registration removed', 'info');
    }
  };

  const filtered = participants.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.teamName || '').toLowerCase().includes(q) || (p.studentName || '').toLowerCase().includes(q) || (p.college || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600">Registered Teams Database</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">Total Gully Cricket Participation</h2>
          <p className="text-xs text-slate-500">Manage registered teams, verify documents, and export CSV database.</p>
        </div>
        <button
          onClick={() => {
            exportToCSV(filtered, 'Gully_Cricket_Participant_Database');
            addToast('Exported Gully Cricket participant database to CSV!', 'success');
          }}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Participant DB
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team name, captain, college..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-xs"
        />
      </div>

      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-soft">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500">
            <tr>
              <th className="p-4">Reg ID</th>
              <th className="p-4">Team Name</th>
              <th className="p-4">Captain</th>
              <th className="p-4">College</th>
              <th className="p-4">Squad Size</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">No registered teams found.</td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="p-4 font-mono font-bold text-emerald-600">{p.id}</td>
                  <td className="p-4 font-black text-slate-900 dark:text-white">{p.teamName}</td>
                  <td className="p-4">{p.studentName}</td>
                  <td className="p-4">{p.college}</td>
                  <td className="p-4 font-mono">{p.squadCount || '6-8 Players'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      p.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleVerify(p.id)}
                      className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-[10px] cursor-pointer"
                    >
                      {p.status === 'VERIFIED' ? 'Reject' : 'Verify'}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
