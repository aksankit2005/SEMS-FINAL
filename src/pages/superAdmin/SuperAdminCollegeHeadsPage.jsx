import React from 'react';
import { Building2, Mail, Phone, ShieldCheck, CheckCircle } from 'lucide-react';

export const SuperAdminCollegeHeadsPage = () => {
  const collegeHeads = [
    { id: 'CH-101', name: 'Dr. R. K. Gupta', college: 'MPEC Kanpur', email: 'rk.gupta@mpec.ac.in', phone: '+91 98765 43212', status: 'ACTIVE' },
    { id: 'CH-102', name: 'Prof. S. N. Mishra', college: 'PSIT Kanpur', email: 'sn.mishra@psit.ac.in', phone: '+91 98765 43299', status: 'ACTIVE' },
    { id: 'CH-103', name: 'Dr. Alok Verma', college: 'KIET Ghaziabad', email: 'alok.verma@kiet.edu', phone: '+91 98765 43288', status: 'ACTIVE' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>College Heads Portal Management</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Super Admin oversight of faculty college coordinators and institute heads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {collegeHeads.map((head) => (
          <div key={head.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">{head.id}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {head.status}
              </span>
            </div>
            <h3 className="font-bold text-white text-base">{head.name}</h3>
            <p className="text-xs text-purple-300 font-semibold">{head.college}</p>
            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-400">
              <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {head.email}</p>
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {head.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
