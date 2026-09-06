import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Radio, ArrowRight, ShieldCheck, ChevronDown, Sparkles, Users, Award, Calendar } from 'lucide-react';
import { useSportsData } from '../../context/SportsDataContext';

export const HomeHeroBanner = () => {
  const { liveMatches } = useSportsData();
  const hasLive = (Array.isArray(liveMatches) ? liveMatches : []).some((m) => {
    const s = (m?.status || '').toLowerCase();
    return m && m.id && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active');
  });

  const scrollToContent = () => {
    const targetId = hasLive ? 'home-live-arena' : 'home-registration-section';
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full min-h-[85vh] sm:min-h-[88vh] lg:min-h-[92vh] flex items-center overflow-hidden font-spatial-sans bg-[#070A13] text-white">
      {/* Background Image with Directional Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero/apex-championship-hero.png"
          alt="APEX Sports Championship Grand Trophy Presentation"
          className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000 ease-out"
          loading="eager"
        />

        {/* Multi-Stop Cinematic Scrim (Ensures text readability on all devices while keeping the trophy visible) */}
        {/* Horizontal gradient: heavy on the left for text, transparent towards the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070A13]/95 via-[#070A13]/85 sm:via-[#070A13]/70 to-[#070A13]/30" />
        
        {/* Vertical gradient: soft fade at bottom for section transition */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070A13] via-transparent to-transparent" />
        
        {/* Subtle SVG Film Grain for luxury texture */}
        <div 
          aria-hidden="true" 
          className="absolute inset-0 spatial-grain-overlay opacity-20 pointer-events-none" 
        />
      </div>

      {/* Main Content Hero Container with Top Clearance for Floating Transparent Navbar */}
      <div className="relative z-10 w-full max-w-[1600px] px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 mx-auto pt-20 sm:pt-28 lg:pt-32 pb-8 sm:pb-20 flex flex-col justify-between">
        <div className="max-w-3xl space-y-4 sm:space-y-7">
          
          {/* Top Institutional Badge */}
          <div className="inline-flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3.5 py-1 xs:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F3D78A] text-[10px] xs:text-xs font-mono font-semibold uppercase tracking-tight xs:tracking-wider shadow-sm">
              <Sparkles className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-[#D2AB45] shrink-0" />
              <span>Directorate of Physical Education &amp; Sports</span>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7156A5]/30 backdrop-blur-md border border-[#B8A5E5]/30 text-[#E0D7F5] text-xs font-mono font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B8A5E5]" />
              MPGI Kanpur
            </span>
          </div>

          {/* Grand Main Headline */}
          <div className="space-y-1.5 sm:space-y-2">
            <span className="block text-[11px] xs:text-xs sm:text-sm md:text-base font-mono uppercase tracking-[0.14em] sm:tracking-[0.2em] text-[#D2AB45] font-bold">
              Where Passion Meets Collegiate Glory
            </span>
            <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-spatial-display tracking-tight text-white uppercase leading-[1.1] drop-shadow-md">
              APEX <span className="bg-gradient-to-r from-[#F3D78A] via-[#E2B755] to-[#B8A5E5] bg-clip-text text-transparent">Championship</span>
            </h1>
          </div>

          {/* Editorial Narrative About APEX */}
          <p className="text-xs sm:text-base md:text-lg text-slate-200/90 leading-relaxed max-w-2xl font-normal drop-shadow-sm">
            The premier collegiate sporting sanctuary of MPGI. Built upon an unwavering tradition of athletic excellence, sportsmanship, and collective pride — bringing together student athletes across 9 institutions to compete for the iconic <strong className="text-white font-semibold">Grand Trophy</strong>.
          </p>

          {/* Key Metrics / Highlights Bar */}
          <div className="pt-1 sm:pt-2 grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
            <div className="px-2.5 py-2 sm:p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-center sm:text-left">
              <div className="text-lg sm:text-2xl font-bold font-spatial-display text-[#F3D78A]">9</div>
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-300 uppercase tracking-normal sm:tracking-wider mt-0.5 truncate">Colleges</div>
            </div>
            <div className="px-2.5 py-2 sm:p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-center sm:text-left">
              <div className="text-lg sm:text-2xl font-bold font-spatial-display text-[#B8A5E5]">12</div>
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-300 uppercase tracking-normal sm:tracking-wider mt-0.5 truncate">Sports</div>
            </div>
            <div className="px-2.5 py-2 sm:p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-center sm:text-left">
              <div className="text-lg sm:text-2xl font-bold font-spatial-display text-[#F3D78A]">2,500+</div>
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-300 uppercase tracking-normal sm:tracking-wider mt-0.5 truncate">Athletes</div>
            </div>
          </div>

          {/* Action CTAs - Responsive on Mobile */}
          <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4">
            {/* Primary Action Button (Full width on mobile) */}
            <Link
              to="/registration"
              className="w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl bg-[#7156A5] hover:bg-[#5E458B] text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95 border border-[#8B5CF6]/50 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-[#F3D78A] shrink-0" />
              <span>Register for Tournament</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>

            {/* Secondary Buttons (Side by side on mobile) */}
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-4">
              <Link
                to="/live"
                className="w-full sm:w-auto px-3 py-2.5 sm:px-6 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] xs:text-xs sm:text-sm tracking-tight sm:tracking-wide transition-all backdrop-blur-md border border-white/20 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FDA4AF] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FDA4AF]" />
                </span>
                <span className="truncate">Live Arena</span>
              </Link>

              <Link
                to="/about"
                className="w-full sm:w-auto px-3 py-2.5 sm:px-5 sm:py-3.5 rounded-xl bg-white/5 sm:bg-transparent text-slate-300 hover:text-white border border-white/10 sm:border-transparent font-semibold text-[11px] xs:text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>About APEX</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Quick-Jump to Live Arena Indicator */}
        <div className="pt-4 sm:pt-12 flex items-center gap-2">
          <button
            onClick={scrollToContent}
            className="group inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span>{hasLive ? 'Scroll To Live Arena' : 'Explore Tournaments'}</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-[#D2AB45]" />
          </button>
        </div>
      </div>
    </section>
  );
};
