import React from 'react';
import { Users, Shield, Trophy } from 'lucide-react';

export const SuperAdminMembersPage = () => {
  const members = [
    { id: 'MEM-01', name: 'Dr. Vivek Srivastava', department: 'Sports HOD / Director', accessLevel: 'Super Admin Access' },
    { id: 'MEM-02', name: 'Er. Nitin Kumar', department: 'IT & Portal Infrastructure', accessLevel: 'System Admin' },
    { id: 'MEM-03', name: 'Dr. Archana Roy', department: 'Dean Student Welfare', accessLevel: 'Supervisory Access' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Executive Members Directory</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin view of faculty members & Sports Board Executives</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Member ID & Name</th>
              <th className="p-4">Department / Designation</th>
              <th className="p-4">Access Rights</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <p className="font-bold text-white text-sm">{m.name}</p>
                  <span className="text-[10px] text-slate-500 font-mono">{m.id}</span>
                </td>
                <td className="p-4 text-slate-300">{m.department}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {m.accessLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
