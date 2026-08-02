import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Flame, ChevronRight, PlayCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const HeroSection = () => {
  const { setIsAuthModalOpen } = useAuth();

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 sm:py-24 transition-colors duration-200">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-20 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=2000&q=80')`
        }}
      />
      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 dark:from-slate-950 dark:via-slate-950/80 to-transparent" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/20 via-orange-500/20 to-indigo-600/20 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Championship Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 backdrop-blur-md mb-8 shadow-xl animate-float">
          <img 
            src="/logo-dark.png" 
            alt="APEX Logo" 
            className="hidden dark:block h-5 w-auto object-contain"
          />
          <img 
            src="/logo-light.png" 
            alt="APEX Logo" 
            className="block dark:hidden h-5 w-auto object-contain"
          />
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            APEX 2026 Inter-College Championship
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-xs text-slate-500 dark:text-slate-300">Jul 28 - Aug 02</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight max-w-4xl mx-auto text-slate-900 dark:text-white">
          WHERE <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">LEGENDS</span> ARE BORN.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          The ultimate inter-college sports management platform. 11 dynamic sports, real-time live scoreboards, multi-step athlete registration, and live leaderboard tracking.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/registration"
            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-extrabold text-base shadow-2xl shadow-blue-600/30 transition-all flex items-center gap-3 transform hover:-translate-y-0.5"
          >
            <Trophy className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            <span>Register Your Team</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/live"
            className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white font-bold text-base backdrop-blur-md transition flex items-center gap-3 shadow-xl"
          >
            <PlayCircle className="w-5 h-5 text-rose-500 animate-pulse" />
            <span>Watch Live Scoreboard</span>
          </Link>
        </div>

        {/* Highlight Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">11 Sports</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Indoor & Outdoor</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-emerald-650 dark:text-emerald-400">₹2.5 Lakhs</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Cash Prizes</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-orange-500">60+ Colleges</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Participating Squads</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-rose-500">Real-Time</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Live Arena Updates</div>
          </div>
        </div>

      </div>
    </div>
  );
};
