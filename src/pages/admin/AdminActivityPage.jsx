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

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      addToast('Failed to load activity audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && (log.action || '').toLowerCase() !== filterAction.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = (log.user || '').toLowerCase().includes(q);
      const matchAction = (log.action || '').toLowerCase().includes(q);
      const matchTarget = (log.target || '').toLowerCase().includes(q);
      return matchUser || matchAction || matchTarget;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const exportData = filteredLogs.map(l => ({
      'Log ID': l.id,
      'User / Admin': l.user,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">Activity Logs & Audit Overview</h1>
          <p className="text-xs text-slate-400">
            Comprehensive audit trail of all administrative actions, coordinator changes, and deletions ({logs.length} Total Logs)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Logs</span>
          </button>
          <button
            onClick={fetchAuditLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, action, details..."
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Action Type: All</option>
            <option value="Coordinator Created">Coordinator Created</option>
            <option value="Coordinator Updated">Coordinator Updated</option>
            <option value="Registration Deleted">Registration Deleted</option>
            <option value="Announcement Created">Announcement Created</option>
            <option value="Result Updated">Result Updated</option>
            <option value="Admin Login">Admin Login</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading audit activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-bold text-slate-300">No activity logs found matching filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Log ID</th>
                  <th className="py-3 px-3">User / Admin</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target Details</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-amber-400 whitespace-nowrap">{log.id}</td>
                    <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">{log.user || 'Admin'}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {log.role || 'ADMIN'}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-200">{log.action}</td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{log.target}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">{log.date}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">{log.time}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-right font-mono text-slate-500">{log.ip || '192.168.1.45'}</td>
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
