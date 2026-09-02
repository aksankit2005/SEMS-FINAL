import React, { useState } from 'react';
import { User, ShieldCheck, Mail, Building2, MapPin, Trophy, FileText, Key, Calendar, CheckCircle2, Download, LogOut } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const ProfileTab = ({ user, matches = [], registrations = [], onLogout }) => {
  const sportName = user?.sportName || user?.sport || 'Badminton';
  const coordName = user?.coordinatorName || user?.name || `${sportName} Head Coordinator`;
  const username = user?.username || `coord_${sportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const email = user?.email || `${sportName.toLowerCase().replace(/[^a-z0-9]/g, '')}.coord@apex.edu`;
  const venue = user?.venue || 'Main Sports Complex Arena';
  const college = user?.college || 'APEX Official Campus';

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">
      
      {/* Profile Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-2xl space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <User className="w-10 h-10" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {coordName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active Official
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Username: <strong className="text-blue-600 dark:text-indigo-400">@{username}</strong>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Head Coordinator for <strong className="text-slate-900 dark:text-white">{sportName}</strong>
              </p>
            </div>
          </div>

        </div>

        {/* Profile Detail Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Sport</span>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{sportName}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Athletes</span>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{registrations.length} Entries</span>
            </div>
          </div>

        </div>

      </div>

      {/* Account Security & Overview Section */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Account Details Box */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-xl space-y-4 max-w-2xl">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-indigo-400" /> Coordinator Credentials
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-400">Coordinator Name</span>
              <span className="font-black text-slate-900 dark:text-white">{coordName}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-400">System Username</span>
              <span className="font-mono font-bold text-blue-600 dark:text-indigo-400">@{username}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-400">Access Level</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Head Sport Coordinator</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-400">Assigned Domain</span>
              <span className="font-bold text-slate-900 dark:text-white">{sportName} Championship 2026</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
