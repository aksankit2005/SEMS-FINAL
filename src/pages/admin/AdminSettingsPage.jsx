import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { Settings, Shield, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

export const AdminSettingsPage = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    currentFestYear: 2026,
    collegeName: 'Maharana Pratap Engineering College (MPEC)',
    adminEmail: 'admin.sports@mpec.ac.in',
    contactPhone: '+91 98765 00000',
    maxPdfSizeMB: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSettings();
      setSettings(data || {});
    } catch (err) {
      addToast('Failed to load system settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      addToast('Admin Portal system configuration saved successfully!', 'success');
    } catch (err) {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">System Configuration Settings</h1>
          <p className="text-xs text-slate-400">
            Control global fest toggles, maintenance mode, registration locks, and system parameters
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Toggle Switches Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Portal Toggles & Controls</h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div>
              <p className="text-xs font-bold text-white">Allow Student Registrations</p>
              <p className="text-[11px] text-slate-400">Enable or freeze student & team registrations portal-wide</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowRegistrations}
              onChange={(e) => setSettings({ ...settings, allowRegistrations: e.target.checked })}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div>
              <p className="text-xs font-bold text-white">System Maintenance Mode</p>
              <p className="text-[11px] text-slate-400">Temporarily restrict public access during live maintenance</p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* General Fest Properties Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Fest Metadata & Limits</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Current Fest Edition Year</label>
              <input
                type="number"
                value={settings.currentFestYear}
                onChange={(e) => setSettings({ ...settings, currentFestYear: parseInt(e.target.value) || 2026 })}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Max PDF Upload Size (MB)</label>
              <input
                type="number"
                value={settings.maxPdfSizeMB}
                onChange={(e) => setSettings({ ...settings, maxPdfSizeMB: parseInt(e.target.value) || 10 })}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Host College Organization</label>
            <input
              type="text"
              value={settings.collegeName}
              onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Admin Support Email</label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Support Contact Phone</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save System Settings</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
