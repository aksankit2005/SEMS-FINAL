import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { exportToCSV } from '../../utils/pdfExporter';
import {
  History,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export const AdminActivityPage = () => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');

  useEffect(() => {
    fetchAuditLogs();
  }, [filterRole]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs({ role: filterRole });
      setLogs(data || []);
    } catch (err) {
      addToast('Failed to load activity audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterRole !== 'ALL' && (log.role || '').toUpperCase() !== filterRole.toUpperCase()) return false;
    if (filterAction !== 'ALL' && (log.action || '').toLowerCase() !== filterAction.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = (log.user || '').toLowerCase().includes(q);
      const matchAction = (log.action || '').toLowerCase().includes(q);
      const matchTarget = (log.target || '').toLowerCase().includes(q);
      const matchRole = (log.role || '').toLowerCase().includes(q);
      return matchUser || matchAction || matchTarget || matchRole;
    }
    return true;
  });

  const getRoleBadge = (role = '') => {
    const r = role.toUpperCase();
    if (r.includes('SUPER')) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Super Coordinator
        </span>
      );
    }
    if (r.includes('COLLEGE') || r.includes('HEAD')) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          College Head
        </span>
      );
    }
    if (r.includes('SPORTS') || r.includes('COORD')) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Sports Coordinator
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
        Admin
      </span>
    );
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const exportData = filteredLogs.map(l => ({
      'Log ID': l.id,
      'User / Actor': l.user,
      'Role': l.role,
      'Action': l.action,
      'Target / Details': l.target,
      'Date': l.date,
      'Time': l.time,
      'IP Address': l.ip
    }));
    exportToCSV(exportData, `Admin_Audit_Logs_${Date.now()}`);
    addToast('Audit logs exported to CSV', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Activity Logs & Audit Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive audit trail of key actions from Admin, Super Coordinator, College Heads, and Sports Coordinators ({logs.length} Total Logs)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Export Logs</span>
          </button>
          <button
            onClick={fetchAuditLogs}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, action, details..."
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900">Actor Role: All Roles</option>
            <option value="ADMIN" className="bg-white dark:bg-slate-900">Admin</option>
            <option value="SUPER_COORDINATOR" className="bg-white dark:bg-slate-900">Super Coordinator</option>
            <option value="COLLEGE_HEAD" className="bg-white dark:bg-slate-900">College Head</option>
            <option value="SPORTS_COORDINATOR" className="bg-white dark:bg-slate-900">Sports Coordinator</option>
          </select>

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900">Action Type: All Actions</option>
            <option value="Admin Login" className="bg-white dark:bg-slate-900">Admin Login</option>
            <option value="Super Coordinator Login" className="bg-white dark:bg-slate-900">Super Coordinator Login</option>
            <option value="College Head Login" className="bg-white dark:bg-slate-900">College Head Login</option>
            <option value="Coordinator Login" className="bg-white dark:bg-slate-900">Coordinator Login</option>
            <option value="Coordinator Created" className="bg-white dark:bg-slate-900">Coordinator Created</option>
            <option value="Coordinator Updated" className="bg-white dark:bg-slate-900">Coordinator Updated</option>
            <option value="Coordinator Deleted" className="bg-white dark:bg-slate-900">Coordinator Deleted</option>
            <option value="Event Created" className="bg-white dark:bg-slate-900">Event Created</option>
            <option value="Event Updated" className="bg-white dark:bg-slate-900">Event Updated</option>
            <option value="Event Deleted" className="bg-white dark:bg-slate-900">Event Deleted</option>
            <option value="Match Scheduled" className="bg-white dark:bg-slate-900">Match Scheduled</option>
            <option value="Matches Batch Scheduled" className="bg-white dark:bg-slate-900">Matches Batch Scheduled</option>
            <option value="Match Completed" className="bg-white dark:bg-slate-900">Match Completed</option>
            <option value="Leaderboard Updated" className="bg-white dark:bg-slate-900">Leaderboard Updated</option>
            <option value="Hero Slides Updated" className="bg-white dark:bg-slate-900">Hero Slides Updated</option>
            <option value="Registration Deleted" className="bg-white dark:bg-slate-900">Registration Deleted</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-6 h-6 text-amber-500 dark:text-amber-400 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading audit activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No activity logs found matching filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">User / Actor</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target Details</th>
                  <th className="py-3 px-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.date} {log.time}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getRoleBadge(log.role)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.target || log.details}>
                      {log.target}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 text-right whitespace-nowrap">
                      {log.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
