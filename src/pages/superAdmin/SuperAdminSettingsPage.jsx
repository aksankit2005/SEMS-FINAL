import React, { useState } from 'react';
import { superAdminApi } from '../../services/superAdminApi';
import { Settings, ShieldCheck, RefreshCw, KeyRound, AlertTriangle, CheckCircle, Save } from 'lucide-react';

export const SuperAdminSettingsPage = () => {
  const [settings, setSettings] = useState(superAdminApi.getSettings());
  const [savedMsg, setSavedMsg] = useState('');

  const handleToggleMaintenance = () => {
    const updated = superAdminApi.updateSettings({ maintenanceMode: !settings.maintenanceMode });
    setSettings(updated);
  };

  const handleToggleRegistrations = () => {
    const updated = superAdminApi.updateSettings({ allowRegistrations: !settings.allowRegistrations });
    setSettings(updated);
  };

  const handleSave = (e) => {
    e.preventDefault();
    superAdminApi.updateSettings(settings);
    setSavedMsg('System configuration settings successfully saved!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-400" />
          <span>System Settings & Handover Controls</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Configure global system settings, maintenance switches, and master handover credentials for college HOD
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Handover Checklist Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-800/30 space-y-3">
        <h2 className="text-sm font-bold text-purple-300 flex items-center gap-2 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Graduation Handover Checklist</span>
        </h2>
        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
          <li>Super Admin master login credentials (default: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">superadmin / admin123</code>) should be shared with the Sports HOD.</li>
          <li>All coordinator accounts can be created and managed directly from the UI without database editing.</li>
          <li>Audit logs remain intact for full accountability of past actions.</li>
        </ul>
      </div>

      {/* Controls Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Toggle Switches */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Global Portal Controls</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Maintenance Mode</p>
              <p className="text-xs text-slate-400">Temporarily disable public registration & portal logins</p>
            </div>
            <button
              type="button"
              onClick={handleToggleMaintenance}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
            <div>
              <p className="text-sm font-bold text-white">Allow Student Registrations</p>
              <p className="text-xs text-slate-400">Open or close public student sports registration forms</p>
            </div>
            <button
              type="button"
              onClick={handleToggleRegistrations}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.allowRegistrations ? 'bg-emerald-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.allowRegistrations ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Master Details */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Institution Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">College Name</label>
              <input
                type="text"
                value={settings.collegeName}
                onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">HOD Admin Contact Email</label>
              <input
                type="email"
                value={settings.adminContactEmail}
                onChange={(e) => setSettings({ ...settings, adminContactEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
