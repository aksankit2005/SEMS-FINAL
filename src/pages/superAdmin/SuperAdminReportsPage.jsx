import React from 'react';
import { BarChart3, Download, FileSpreadsheet, TrendingUp, IndianRupee } from 'lucide-react';

export const SuperAdminReportsPage = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>Reports & System Analytics</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin financial reports, participation stats & sports analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Fee Revenue Report</h3>
            <IndianRupee className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">₹ 2,45,000</p>
          <p className="text-xs text-slate-400">Total fees collected across all sport registrations</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Participation Report</h3>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">1,245 Students</p>
          <p className="text-xs text-slate-400">Across 8 participating engineering & degree colleges</p>
        </div>
      </div>
    </div>
  );
};
