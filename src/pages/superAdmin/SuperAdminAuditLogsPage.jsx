import React, { useState, useEffect } from 'react';
import { superAdminApi } from '../../services/superAdminApi';
import { ShieldCheck, Search, Download, Filter, Clock, Activity, FileText } from 'lucide-react';

export const SuperAdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    setLogs(superAdminApi.getAuditLogs());
  }, []);

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Coordinator Name', 'Role', 'Action', 'Entity', 'Details'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      `"${l.coordinatorName}"`,
      l.role,
      l.action,
      l.entity,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SEMS_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.coordinatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter);

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <span>Audit Trail & Activity Logs</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Complete timestamped activity history — track which coordinator performed what action across the system
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search coordinator, action or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Actions</option>
            <option value="COORDINATOR">Coordinator Created / Updated</option>
            <option value="PASSWORD">Password Resets</option>
            <option value="SCORE">Score Updates</option>
            <option value="REGISTRATION">Registration / Student Actions</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-4">Timestamp & Log ID</th>
                <th className="p-4">Coordinator Name & Role</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">{log.id}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="space-y-0.5">
                      <p className="font-bold text-purple-300">{log.coordinatorName}</p>
                      <span className="inline-block text-[9px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        {log.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {log.action}
                    </span>
                  </td>

                  <td className="p-4">
                    <p className="text-slate-200 font-medium">{log.details}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
