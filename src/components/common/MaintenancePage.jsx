import React from 'react';
import { Wrench, Shield, Lock, Mail, Phone, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MaintenancePage = ({ settings = {} }) => {
  const contactPhone = settings.contactPhone || '+91 98765 00000';
  const adminEmail = settings.adminEmail || 'admin.sports@mpec.ac.in';
  const collegeName = settings.collegeName || 'Maharana Pratap Engineering College (MPEC)';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10 animate-fade-in">
        {/* Animated Icon Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/10">
          <Wrench className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>System Maintenance Mode Active</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            SEMS Portal is Under <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Scheduled Maintenance
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Our administration & technical team is currently performing essential system updates, server optimization, and fest database maintenance.
          </p>
        </div>

        {/* Live Status Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-left space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Public Service Interruption Notice</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
              Maintenance ON
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Scope of Maintenance</p>
              <p className="font-semibold text-slate-200">Registrations, Fixtures & Leaderboards</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Host Institution</p>
              <p className="font-semibold text-slate-200 line-clamp-1">{collegeName}</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic">
            ℹ️ Normal public browsing, student registration, and live match scoring will resume as soon as system updates complete.
          </p>
        </div>

        {/* Admin Login Bypass & Contact Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/admin/login"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Portal Login</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Check Again (Refresh)</span>
          </button>
        </div>

        {/* Support Footer Info */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Support: {adminEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>Helpline: {contactPhone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
