import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { superAdminApi } from '../../services/superAdminApi';
import {
  Trophy,
  Calendar,
  Users,
  Radio,
  Clock,
  IndianRupee,
  PlusCircle,
  UserPlus,
  Megaphone,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SuperAdminDashboardPage = () => {
  const [coordinators, setCoordinators] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [sports, setSports] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setCoordinators(superAdminApi.getCoordinators());
    setAuditLogs(superAdminApi.getAuditLogs());
    setSports(superAdminApi.getSports());
    setEvents(superAdminApi.getEvents());
  }, []);

  const stats = [
    { label: 'Total Sports', value: sports.length || 10, icon: Trophy, color: 'from-blue-500 to-indigo-600' },
    { label: 'Total Events', value: events.length || 25, icon: Calendar, color: 'from-emerald-500 to-teal-600' },
    { label: 'Total Participants', value: '1,245', icon: Users, color: 'from-purple-500 to-indigo-600' },
    { label: 'Live Matches', value: '12', icon: Radio, color: 'from-rose-500 to-pink-600' },
    { label: "Today's Matches", value: '32', icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: 'Total Revenue', value: '₹ 2,45,000', icon: IndianRupee, color: 'from-emerald-600 to-green-600' }
  ];

  const todaySchedule = [
    { time: '09:00 AM', sport: 'Basketball', match: 'MPEC vs PSIT', court: 'Court 1', status: 'Upcoming' },
    { time: '11:00 AM', sport: 'Badminton', match: 'MPEC vs KIET', court: 'Court 2', status: 'Live' },
    { time: '01:00 PM', sport: 'Football', match: 'MPEC vs BBDIT', court: 'Ground 1', status: 'Upcoming' },
    { time: '03:00 PM', sport: 'Volleyball', match: 'MPEC vs HBTU', court: 'Court 1', status: 'Upcoming' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Admin Portal Control Dashboard</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Handover Ready
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Complete real-time overview & module control from Admin Login to All Modules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/super-admin/coordinators"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manage Coordinators</span>
          </Link>
        </div>
      </div>

      {/* Top 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium truncate">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} p-0.5 shadow-md`}>
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white group-hover:scale-105 transition-transform">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Admin Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/super-admin/events-sports"
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-purple-600/20 border border-slate-700 hover:border-purple-500/40 text-slate-200 hover:text-purple-300 font-semibold text-xs transition-all flex items-center gap-3 group"
          >
            <PlusCircle className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Add Event</span>
          </Link>
          <Link
            to="/super-admin/events-sports"
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 font-semibold text-xs transition-all flex items-center gap-3 group"
          >
            <Trophy className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Add Sport</span>
          </Link>
          <Link
            to="/super-admin/coordinators"
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 font-semibold text-xs transition-all flex items-center gap-3 group"
          >
            <UserPlus className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Add Coordinator</span>
          </Link>
          <Link
            to="/super-admin/audit-logs"
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/40 text-slate-200 hover:text-indigo-300 font-semibold text-xs transition-all flex items-center gap-3 group"
          >
            <Megaphone className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>View Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Activities, Today's Schedule & Participants Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities Feed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Recent Admin Activities</span>
            </h2>
            <Link to="/super-admin/audit-logs" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-purple-300">{log.coordinatorName}</span>
                  <span className="text-[10px]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-200 font-medium">{log.details}</p>
                <span className="inline-block text-[10px] text-slate-500 font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded">
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule Widget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Today's Schedule</span>
            </h2>
            <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded font-semibold">
              Live Courts
            </span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
            {todaySchedule.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">{item.time}</span>
                    <span className="text-xs font-semibold text-white">{item.sport}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.match}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700 block mb-1">
                    {item.court}
                  </span>
                  {item.status === 'Live' && (
                    <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                      Live
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants Overview */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Participants Overview</span>
          </h2>
          <div className="space-y-3 flex-1">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Badminton</span>
              <span className="font-bold text-white">320 Participants</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Basketball</span>
              <span className="font-bold text-white">280 Participants</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Football</span>
              <span className="font-bold text-white">210 Participants</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Volleyball</span>
              <span className="font-bold text-white">180 Participants</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Total Verified Participants</span>
              <span className="text-sm font-black text-purple-400">1,245</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Flow Diagram Footer Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-800/30">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Active Super Admin System Pipeline</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-medium">Sports</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-medium">Events</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded-lg bg-purple-600/30 border border-purple-500/40 font-bold text-purple-300">Coordinators</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-medium">Registration</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-medium">Schedule</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-medium">Live Matches</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-medium">Results</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-medium">Reports</span>
        </div>
      </div>
    </div>
  );
};
