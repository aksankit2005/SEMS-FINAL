import React from 'react';
import { ClipboardList, CheckCircle, Clock, Search, Filter } from 'lucide-react';

export const SuperAdminRegistrationsPage = () => {
  const registrations = [
    { id: 'REG-501', student: 'Aarav Sharma', sport: 'Badminton', college: 'MPEC Kanpur', amount: '₹300', status: 'VERIFIED', date: '2026-08-01' },
    { id: 'REG-502', student: 'Vikramjit Singh', sport: 'Cricket', college: 'PSIT Kanpur', amount: '₹1200', status: 'VERIFIED', date: '2026-08-02' },
    { id: 'REG-503', student: 'Kavya Gupta', sport: 'Chess', college: 'HBTU Kanpur', amount: '₹200', status: 'PENDING', date: '2026-08-03' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            <span>Master Registration Records</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin audit of student registrations, fee logs & payment verification</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Reg ID & Date</th>
              <th className="p-4">Student & College</th>
              <th className="p-4">Sport</th>
              <th className="p-4">Fee Paid</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {registrations.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <p className="font-bold text-white">{r.id}</p>
                  <span className="text-[10px] text-slate-500">{r.date}</span>
                </td>
                <td className="p-4">
                  <p className="font-semibold text-slate-300">{r.student}</p>
                  <span className="text-[10px] text-slate-400">{r.college}</span>
                </td>
                <td className="p-4 text-purple-300 font-bold">{r.sport}</td>
                <td className="p-4 font-semibold text-emerald-400">{r.amount}</td>
                <td className="p-4">
                  {r.status === 'VERIFIED' ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">VERIFIED</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
