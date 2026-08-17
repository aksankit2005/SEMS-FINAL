import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import {
  ClipboardList,
  UserCheck,
  UserX,
  Camera,
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  Megaphone,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  Calendar,
  Shield
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashStats, auditLogs] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getAuditLogs()
      ]);
      setStats(dashStats);
      setActivities(auditLogs || []);
    } catch (err) {
      addToast('Error loading Admin Dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading Central Admin Dashboard Statistics...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Registrations', value: stats?.totalRegistrations || 0, icon: ClipboardList, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/10', path: '/admin/registrations' },
    { label: 'Active Coordinators', value: stats?.activeCoordinators || 0, icon: UserCheck, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/10', path: '/admin/coordinators' },
    { label: 'Inactive Coordinators', value: stats?.inactiveCoordinators || 0, icon: UserX, color: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/10', path: '/admin/coordinators' },
    { label: 'Total PR Uploads', value: stats?.totalPRUploads || 0, icon: Camera, color: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/10', path: '/admin/pr-management' },
    { label: 'Total Participants', value: stats?.totalParticipants || 0, icon: Users, color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/10', path: '/admin/master-data' },
    { label: 'Total Games / Sports', value: stats?.totalGames || 12, icon: Trophy, color: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-400/10', path: '/admin/master-data' },
    { label: 'Completed Results', value: stats?.completedResults || 0, icon: CheckCircle2, color: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/10', path: '/admin/results' },
    { label: 'Pending Results', value: stats?.pendingResults || 0, icon: Clock, color: 'from-amber-600 to-orange-500', shadow: 'shadow-amber-600/10', path: '/admin/results' },
    { label: 'Active Announcements', value: stats?.activeAnnouncements || 0, icon: Megaphone, color: 'from-indigo-500 to-violet-600', shadow: 'shadow-indigo-500/10', path: '/admin/announcements' }
  ];

  return (
    <div className="space-y-8 animate-fade-in text-slate-900 dark:text-white">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-amber-500/20 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Live System Overview
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fest Year 2026</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Executive Admin Dashboard</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Real-time status of registrations, coordinators, PR media uploads, and match results across all 12 games.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Refresh Overview</span>
        </button>
      </div>

      {/* 9 Statistics Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => card.path && navigate(card.path)}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 shadow-sm ${card.shadow} flex items-center justify-between group cursor-pointer`}
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">
                  {card.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} p-0.5 shadow-md shrink-0`}>
                <div className="w-full h-full bg-white dark:bg-slate-950/80 rounded-[14px] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-slate-900 dark:text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Timeline Log */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent System Activity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Audit trail of admin and coordinator actions</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {activities.length} Events Logged
          </span>
        </div>

        {activities.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No recent activities recorded.</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 transition-colors flex items-start justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {act.role ? act.role.charAt(0) : 'A'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate">{act.user || 'Admin'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-300 dark:border-slate-700">
                        {act.action}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 truncate">{act.target}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">{act.date}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
