import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-500/20 to-orange-500/20 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-orange-400" /> Ready to Dominate the Court?
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
          REGISTER YOUR COLLEGE SQUAD FOR <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-orange-400 bg-clip-text text-transparent">SEMS 2026</span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Slots are filling up fast for Team Sports (Cricket, Football, Kabaddi, Basketball, Volleyball, Kho-Kho, Tug of War) and Individual Championships (Table Tennis, Badminton, Chess, Athletics).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/registration"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-black text-base shadow-2xl shadow-blue-500/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <UserCheck className="w-5 h-5 text-white" />
            <span>Open Registration Wizard</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link
            to="/contact"
            className="px-8 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-white font-bold text-base transition"
          >
            Contact Help Desk
          </Link>
        </div>

        <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Official University Certification
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-400" /> Trophies & Merit Medals
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" /> Digital Player Passes & Receipts
          </div>
        </div>

      </div>
    </section>
  );
};
