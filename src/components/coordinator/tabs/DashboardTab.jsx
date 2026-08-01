import React from 'react';
import { 
  Calendar, Clock, PlayCircle, CheckCircle2, Users, UserCheck, 
  Hourglass, User, MapPin, ShieldAlert, Trophy, Award, Bell, 
  Megaphone, Plus, Radio, ArrowUpRight, Zap
} from 'lucide-react';

export const DashboardTab = ({ stats, user, onNavigate }) => {
  const cards = [
    { title: "Today's Matches", value: stats?.todayMatches || 3, icon: Calendar, color: "from-blue-500 to-indigo-600", desc: "Scheduled today" },
    { title: "Upcoming Matches", value: stats?.upcomingMatches || 6, icon: Clock, color: "from-amber-500 to-orange-600", desc: "Awaiting kickoff" },
    { title: "Running Matches", value: stats?.runningMatches || 1, icon: PlayCircle, color: "from-emerald-500 to-teal-600", desc: "Live right now", pulse: true },
    { title: "Completed Matches", value: stats?.completedMatches || 5, icon: CheckCircle2, color: "from-purple-500 to-violet-600", desc: "Final scores logged" },
    { title: "Registered Teams", value: stats?.registeredTeams || 12, icon: Users, color: "from-cyan-500 to-blue-600", desc: "Across all colleges" },
    { title: "Approved Teams", value: stats?.approvedTeams || 10, icon: UserCheck, color: "from-green-500 to-emerald-600", desc: "Cleared for play" },
    { title: "Pending Registrations", value: stats?.pendingRegistrations || 2, icon: Hourglass, color: "from-rose-500 to-pink-600", desc: "Requires verification" },
    { title: "Players Registered", value: stats?.playersRegistered || 54, icon: User, color: "from-sky-500 to-blue-600", desc: "Roster athletes" },
    { title: "Venues", value: stats?.venuesCount || 3, icon: MapPin, color: "from-orange-500 to-amber-600", desc: "Allocated courts/grounds" },
    { title: "Referees / Officials", value: stats?.refereesCount || 5, icon: ShieldAlert, color: "from-indigo-500 to-purple-600", desc: "Assigned umpires" },
    { title: "Total Matches", value: stats?.totalMatches || 12, icon: Trophy, color: "from-amber-500 to-yellow-600", desc: "Full tournament fixtures" },
    { title: "Medals Awarded", value: stats?.medalsAwarded || 9, icon: Award, color: "from-yellow-500 to-amber-600", desc: "Gold, Silver & Bronze" },
    { title: "Notifications", value: stats?.notificationsCount || 4, icon: Bell, color: "from-pink-500 to-rose-600", desc: "System alerts" },
    { title: "Announcements", value: stats?.announcementsCount || 6, icon: Megaphone, color: "from-fuchsia-500 to-purple-600", desc: "Public notices" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider mb-3">
              <Zap className="w-4 h-4 text-amber-300" /> Active Control Scope: {user?.sportName}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Welcome back, {user?.coordinatorName}!
            </h1>
            <p className="text-sm text-orange-100 mt-2 max-w-2xl">
              You are managing all <strong>{user?.sportName}</strong> matches, team approvals, referee assignments, live scores, and official rulebooks for SEMS 2026.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => onNavigate('live-scoring')}
              className="px-5 py-3 rounded-2xl bg-slate-950 text-white font-bold text-xs shadow-lg hover:bg-slate-900 transition flex items-center gap-2"
            >
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" /> Launch Live Scoring
            </button>
            <button
              onClick={() => onNavigate('matches')}
              className="px-5 py-3 rounded-2xl bg-white text-orange-600 font-bold text-xs shadow-lg hover:bg-orange-50 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Schedule Match
            </button>
          </div>
        </div>
      </div>

      {/* 15 Dashboard Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" /> {user?.sportName} Key Metrics & Overview
          </h3>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">14 Key Dashboard Indicators</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-soft hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {card.value}
                  </span>
                  {card.pulse && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      ● Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Cards & Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Match Preview */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" /> Live Featured Match: {user?.sportName}
            </h4>
            <button
              onClick={() => onNavigate('live-scoring')}
              className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
            >
              Open Scoring Studio <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span className="font-bold uppercase text-orange-500">{user?.sportName} Final Showdown</span>
              <span className="font-mono bg-rose-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black animate-pulse">
                LIVE 18:45
              </span>
            </div>

            <div className="flex items-center justify-around text-center py-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">MPEC Tigers</span>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">3</p>
              </div>
              <div className="text-slate-300 dark:text-slate-700 font-black text-2xl">VS</div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">MIPS Warriors</span>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">2</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Venue: Central Arena Main Ground</span>
              <span>Referee: Official Referee A</span>
            </div>
          </div>
        </div>

        {/* Coordinator Quick Shortcuts */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Coordinator Actions
            </h4>
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('registration')}
                className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center justify-between"
              >
                <span>Approve Registered Teams</span>
                <ArrowUpRight className="w-4 h-4 text-orange-500" />
              </button>
              <button
                onClick={() => onNavigate('fixtures')}
                className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center justify-between"
              >
                <span>Generate Auto Fixtures</span>
                <ArrowUpRight className="w-4 h-4 text-orange-500" />
              </button>
              <button
                onClick={() => onNavigate('documents')}
                className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center justify-between"
              >
                <span>Upload Rulebook PDF</span>
                <ArrowUpRight className="w-4 h-4 text-orange-500" />
              </button>
              <button
                onClick={() => onNavigate('announcements')}
                className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center justify-between"
              >
                <span>Broadcast Notice</span>
                <ArrowUpRight className="w-4 h-4 text-orange-500" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Strict Role Scope: Authorized for <strong>{user?.sportName}</strong> only.
          </div>
        </div>
      </div>

    </div>
  );
};
