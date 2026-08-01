import React from 'react';
import { Settings, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, User, Lock } from 'lucide-react';
import { ThemeToggle } from '../../common/ThemeToggle';

export const SettingsTab = ({ user }) => {
  const allowedPermissions = [
    "View Dashboard & Assigned Sport Metrics",
    "Schedule & Manage Assigned Sport Matches",
    "Generate & Edit Tournament Fixtures",
    "Interactive Real-Time Live Scoring Studio",
    "Open / Close Registration & Set Deadlines",
    "Approve / Reject Team Participants",
    "Manage Assigned Venues & Referees",
    "Upload Result Sheets & Publish Results",
    "Upload Rulebooks & Fixture PDFs",
    "Broadcast Announcements & Match Reminders",
    "View & Export Reports (PDF / Excel)",
  ];

  const prohibitedActions = [
    "Access Admin Dashboard",
    "Delete Overall Event / Tournament",
    "Create New Sports Categories",
    "Change Global System Settings",
    "Access Other Sports Data",
    "View Payment Information",
    "View Financial Reports",
    "Edit College Details",
    "Create Users / Delete Users",
    "Manage User Roles & Permissions",
    "Access Database Settings",
    "Modify Authentication & Security",
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Profile Overview Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" /> Coordinator Profile & Assigned Scope
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Account identity and strict role authorization parameters.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-black uppercase">
            Strict Sport Scope
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Coordinator Name</span>
            <span className="font-black text-sm text-slate-900 dark:text-white mt-1 block">{user?.coordinatorName}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Sport Scope</span>
            <span className="font-black text-sm text-orange-500 mt-1 block">{user?.sportName} ONLY</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">System Username</span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">{user?.username}</span>
          </div>
        </div>
      </div>

      {/* Security Compliance Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Allowed Permissions */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/30 p-6 shadow-soft space-y-4">
          <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Granted Coordinator Rights ({allowedPermissions.length})
          </h4>
          <div className="space-y-2 text-xs">
            {allowedPermissions.map((perm, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prohibited Actions */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-rose-500/30 p-6 shadow-soft space-y-4">
          <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Enforced Prohibitions ({prohibitedActions.length})
          </h4>
          <div className="space-y-2 text-xs">
            {prohibitedActions.map((action, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="line-through">{action}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
