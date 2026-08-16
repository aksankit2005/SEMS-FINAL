import React, { useState } from 'react';
import { User, ShieldCheck, Mail, Building2, MapPin, Trophy, FileText, Key, Calendar, CheckCircle2, Download, LogOut } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const ProfileTab = ({ user, matches = [], registrations = [], onLogout, allowPasswordChange = true }) => {
  const { addToast } = useToast();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });

  const sportName = user?.sportName || user?.sport || 'Badminton';
  const coordName = user?.coordinatorName || user?.name || `${sportName} Head Coordinator`;
  const username = user?.username || `coord_${sportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const email = user?.email || `${sportName.toLowerCase().replace(/[^a-z0-9]/g, '')}.coord@sems.edu`;
  const venue = user?.venue || 'Main Sports Complex Arena';
  const college = user?.college || 'SEMS Official Campus';

  const isBadminton = (user?.assignedSport || user?.sportName || user?.sport || '').toLowerCase().includes('badminton') || sportName.toLowerCase() === 'badminton';
  const canChangePassword = allowPasswordChange && !isBadminton;

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      addToast('New password and confirm password do not match', 'error');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      addToast('Password must be at least 6 characters long', 'error');
      return;
    }
    addToast('Password updated successfully!', 'success');
    setShowPasswordModal(false);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

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

          {canChangePassword && (
            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
                <span>Change Password</span>
              </button>
            </div>
          )}

        </div>

        {/* Profile Detail Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Sport</span>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{sportName}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Venue</span>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{venue}</span>
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
      <div className={`grid grid-cols-1 ${isBadminton ? '' : 'lg:grid-cols-2'} gap-6`}>
        
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

      {/* Change Password Modal */}
      {canChangePassword && showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600 dark:text-indigo-400" /> Update Password
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow-md"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
