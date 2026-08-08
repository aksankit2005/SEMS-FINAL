import React from 'react';
import { Crown, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { superAdminApi } from '../../services/superAdminApi';

export const SuperAdminProfilePage = () => {
  const user = superAdminApi.getCurrentUser();

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl">
            <Crown className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user.name}</h1>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">{user.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Official Email</span>
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" /> {user.email}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Master Access Privilege</span>
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Full System Root Authorization
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
