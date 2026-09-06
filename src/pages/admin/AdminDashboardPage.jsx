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
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">Loading Central Admin Dashboard Statistics...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Registrations', value: stats?.totalRegistrations || 0, icon: ClipboardList, color: 'from-[#7156A5] to-[#8B5CF6]', shadow: 'shadow-purple-500/10', path: '/admin/registrations' },
    { label: 'Active Coordinators', value: stats?.activeCoordinators || 0, icon: UserCheck, color: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/10', path: '/admin/coordinators' },
    { label: 'Inactive Coordinators', value: stats?.inactiveCoordinators || 0, icon: UserX, color: 'from-rose-600 to-red-600', shadow: 'shadow-rose-500/10', path: '/admin/coordinators' },
    { label: 'Total PR Uploads', value: stats?.totalPRUploads || 0, icon: Camera, color: 'from-[#7156A5] to-[#596B98]', shadow: 'shadow-purple-500/10', path: '/admin/pr-management' },
    { label: 'Total Participants', value: stats?.totalParticipants || 0, icon: Users, color: 'from-[#596B98] to-[#7156A5]', shadow: 'shadow-indigo-500/10', path: '/admin/master-data' },
    { label: 'Total Games / Sports', value: stats?.totalGames || 12, icon: Trophy, color: 'from-[#A98B57] to-[#D2AB45]', shadow: 'shadow-amber-500/10', path: '/admin/master-data' },
    { label: 'Completed Results', value: stats?.completedResults || 0, icon: CheckCircle2, color: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/10', path: '/admin/results' },
    { label: 'Pending Results', value: stats?.pendingResults || 0, icon: Clock, color: 'from-amber-600 to-orange-600', shadow: 'shadow-amber-500/10', path: '/admin/results' },
    { label: 'Active Announcements', value: stats?.activeAnnouncements || 0, icon: Megaphone, color: 'from-[#7156A5] to-[#8B5CF6]', shadow: 'shadow-purple-500/10', path: '/admin/announcements' }
  ];

  return (
    <div className="space-y-8 animate-fade-in text-[#211D2B] dark:text-[#F5F2FA]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] font-mono">
              Live System Overview
            </span>
            <span className="text-xs font-semibold text-[#686370] dark:text-[#AAA4B8]">Fest Year 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase">
            Executive Admin <span className="text-[#7156A5] dark:text-[#B8A5E5]">Dashboard</span>
          </h1>
          <p className="text-xs text-[#686370] dark:text-[#AAA4B8]">
            Real-time status of registrations, coordinators, PR media uploads, and match results across all 12 games.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#181D30] text-[#211D2B] dark:text-[#F5F2FA] text-xs font-bold border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors shrink-0 cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5]" />
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
              className={`p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/50 dark:hover:border-[rgba(184,165,229,0.4)] transition-all duration-300 shadow-2xs flex items-center justify-between group cursor-pointer`}
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#686370] dark:text-[#AAA4B8]">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA] group-hover:scale-105 transition-transform origin-left">
                  {card.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} p-0.5 shadow-sm shrink-0`}>
                <div className="w-full h-full bg-[#FFFFFF] dark:bg-[#070A13] rounded-[10px] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#7156A5] dark:text-[#B8A5E5]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Timeline Log */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] space-y-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7156A5]/10 dark:bg-[rgba(184,165,229,0.12)] text-[#7156A5] dark:text-[#B8A5E5] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA] uppercase tracking-wide">Recent System Activity</h2>
              <p className="text-xs text-[#686370] dark:text-[#AAA4B8]">Audit trail of admin and coordinator actions</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#686370] dark:text-[#AAA4B8] bg-[#FAF9F6] dark:bg-[#121625] px-3 py-1 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] font-mono">
            {activities.length} Events Logged
          </span>
        </div>

        {activities.length === 0 ? (
          <p className="text-xs text-[#686370] dark:text-[#AAA4B8] text-center py-6">No recent activities recorded.</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#181D30] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] transition-colors flex items-start justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#7156A5]/10 dark:bg-[rgba(184,165,229,0.15)] text-[#7156A5] dark:text-[#B8A5E5] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {act.role ? act.role.charAt(0) : 'A'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#211D2B] dark:text-[#F5F2FA] truncate">{act.user || 'Admin'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F4F2F7] dark:bg-[#181D30] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] font-mono">
                        {act.action}
                      </span>
                    </div>
                    <p className="text-[#686370] dark:text-[#AAA4B8] mt-0.5 truncate">{act.target}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[#686370] dark:text-[#AAA4B8] block text-[11px] font-medium font-mono">{act.date}</span>
                  <span className="text-[#8B8599] text-[10px] font-mono">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
