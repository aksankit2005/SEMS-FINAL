import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="py-10 sm:py-16 bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 relative overflow-hidden transition-all duration-300">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[700px] h-[350px] bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-orange-500/15 dark:from-blue-600/20 dark:to-orange-500/20 blur-3xl pointer-events-none z-0" />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4 sm:space-y-6">
        
        {/* Main Heading */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
          REGISTER YOUR COLLEGE SQUAD FOR <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 dark:from-blue-400 dark:via-indigo-400 dark:to-orange-400 bg-clip-text text-transparent">APEX 2026</span>
        </h2>

        {/* Description Text */}
        <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
          Slots are filling up fast for Team Sports (Cricket, Football, Kabaddi, Basketball, Volleyball, Kho-Kho, Tug of War) and Individual Championships (Table Tennis, Badminton, Chess, Athletics).
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 pt-2 sm:pt-4 w-full">
          <Link
            to="/registration"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/25 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span>Open Registration Wizard</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          
          <Link
            to="/contact"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm sm:text-base transition shadow-sm active:scale-95 flex items-center justify-center"
          >
            Contact Help Desk
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="pt-6 sm:pt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Official University Certification</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <Trophy className="w-4 h-4 text-orange-500 dark:text-orange-400 shrink-0" />
            <span>Trophies & Merit Medals</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Digital Player Passes & Receipts</span>
          </div>
        </div>

      </div>
    </section>
  );
};
