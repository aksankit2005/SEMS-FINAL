import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FolderOpen } from 'lucide-react';

export const JourneyMilestonesOverlay = ({
  milestones = [],
  activeMilestoneId,
  onSelectMilestone,
  onSwitchToTeam
}) => {
  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:pr-24 lg:pl-12 xl:px-12 pt-2 sm:pt-4 pb-28 sm:pb-32">
      
      {/* ── Hero Header: Title & Description ── */}
      <section className="text-center mb-8 sm:mb-12 lg:mb-16">
        {/* Responsive Cinzel Title */}
        <h1 className="font-serif-luxury text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[#211D2B] dark:text-[#F5F2FA] tracking-wider uppercase drop-shadow-[0_10px_35px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          APEX LEGACY
        </h1>

        {/* Editorial Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-[#686370] dark:text-[#AAA4B8] font-sans-clean max-w-2xl mx-auto italic mt-3 sm:mt-5 leading-relaxed px-4">
          Curated aesthetic chronicles spanning classical MPGI sports epochs, championship horizons, and luminous tournament nightscapes.
        </p>
      </section>

      {/* ── Alternating Milestones Timeline Section (Active on Mobile & Desktop) ── */}
      <div className="relative">
        
        {/* Continuous Central Illuminated Neon Laser Spine (Mobile & Desktop) */}
        <div 
          aria-hidden="true" 
          className="absolute left-1/2 -translate-x-1/2 top-4 bottom-72 w-[2px] timeline-laser-spine z-10 pointer-events-none"
        />

        {/* Milestone Items List */}
        <div className="space-y-12 xs:space-y-16 sm:space-y-24 md:space-y-32 lg:space-y-36">
          {milestones.map((m, index) => {
            const isLeftCard = index % 2 === 0; // Alternating: 0 is Left, 1 is Right...
            const isActive = m.id === activeMilestoneId;

            return (
              <article
                key={m.id}
                id={`milestone-${m.id}`}
                className="relative scroll-mt-24 sm:scroll-mt-36"
              >
                {/* ── 2-COLUMN ALTERNATING GRID (Mobile, Tablet, Laptop & Desktop) ─────── */}
                <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:gap-14 xl:gap-20 items-center">
                  
                  {/* LEFT COLUMN */}
                  <div className="relative">
                    {isLeftCard ? (
                      /* CARD ON LEFT */
                      <div className="relative mr-2 sm:mr-0">
                        <MilestoneCard milestone={m} isActive={isActive} />
                      </div>
                    ) : (
                      /* Opposing Side Typography (when card is on Right) */
                      <div className="flex flex-col items-end justify-center pr-7 sm:pr-8 md:pr-10 lg:pr-12 xl:pr-14 text-right select-none transition-all duration-300">
                        <span className={`font-serif-luxury text-xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight transition-colors duration-500 ${
                          isActive ? 'text-[#7156A5] dark:text-[#B8A5E5]' : 'text-slate-300 dark:text-slate-500/35'
                        }`}>
                          {m.year}
                        </span>
                        <span className="text-[9px] sm:text-xs font-mono font-bold tracking-widest text-[#7156A5] dark:text-[#B8A5E5] uppercase mt-1 sm:mt-1.5 line-clamp-1">
                          {m.title}
                        </span>
                        <p className="text-[8px] sm:text-xs font-serif italic text-[#686370] dark:text-[#AAA4B8] mt-1 sm:mt-1.5 max-w-[130px] sm:max-w-xs line-clamp-2 sm:line-clamp-none">
                          &ldquo;{m.opposingQuote || m.subtitle}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="relative">
                    {isLeftCard ? (
                      /* Opposing Side Typography (when card is on Left) */
                      <div className="flex flex-col items-start justify-center pl-7 sm:pl-8 md:pl-10 lg:pr-12 xl:pl-14 text-left select-none transition-all duration-300">
                        <span className={`font-serif-luxury text-xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight transition-colors duration-500 ${
                          isActive ? 'text-[#7156A5] dark:text-[#B8A5E5]' : 'text-slate-300 dark:text-slate-500/35'
                        }`}>
                          {m.year}
                        </span>
                        <span className="text-[9px] sm:text-xs font-mono font-bold tracking-widest text-[#7156A5] dark:text-[#B8A5E5] uppercase mt-1 sm:mt-1.5 line-clamp-1">
                          {m.title}
                        </span>
                        <p className="text-[8px] sm:text-xs font-serif italic text-[#686370] dark:text-[#AAA4B8] mt-1 sm:mt-1.5 max-w-[130px] sm:max-w-xs line-clamp-2 sm:line-clamp-none">
                          &ldquo;{m.opposingQuote || m.subtitle}&rdquo;
                        </p>
                      </div>
                    ) : (
                      /* CARD ON RIGHT */
                      <div className="relative ml-2 sm:ml-0">
                        <MilestoneCard milestone={m} isActive={isActive} />
                      </div>
                    )}
                  </div>

                </div>

                {/* ── CENTRAL MILESTONE NODE (Universal: Mobile & Desktop) ───────── */}
                <div className="flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 flex-col items-center pointer-events-auto">
                  {/* Dynamic Branch connector connecting node to active side */}
                  {isLeftCard ? (
                    <div 
                      aria-hidden="true" 
                      className="absolute right-full top-3.5 sm:top-5 lg:top-6 -translate-y-1/2 w-3 sm:w-8 lg:w-12 xl:w-16 h-[1.5px] sm:h-[2px] bg-gradient-to-l from-[#7156A5] to-transparent pointer-events-none"
                    />
                  ) : (
                    <div 
                      aria-hidden="true" 
                      className="absolute left-full top-3.5 sm:top-5 lg:top-6 -translate-y-1/2 w-3 sm:w-8 lg:w-12 xl:w-16 h-[1.5px] sm:h-[2px] bg-gradient-to-r from-[#7156A5] to-transparent pointer-events-none"
                    />
                  )}

                  <button
                    onClick={() => { onSelectMilestone(m.id); }}
                    className={`w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-mono font-bold text-[9px] sm:text-xs lg:text-sm transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-[#F4F2F7] dark:bg-[#150e2d] border-2 border-[#7156A5] dark:border-[#B8A5E5] text-[#7156A5] dark:text-white shadow-[0_0_16px_rgba(113,86,165,0.5)] scale-110 timeline-node-active'
                        : 'bg-white dark:bg-[#0d0f1f] border-2 border-[#E5E1E8] dark:border-[rgba(184,165,229,0.3)] text-[#686370] dark:text-[#AAA4B8] hover:border-[#7156A5] dark:hover:border-[#B8A5E5] hover:scale-105 shadow-md'
                    }`}
                  >
                    {m.indexStr}
                  </button>

                  {/* Year badge below node */}
                  <span className="mt-1 sm:mt-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#090b16]/95 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.3)] text-[8px] sm:text-[10px] font-mono font-bold text-[#7156A5] dark:text-[#B8A5E5] shadow-xs whitespace-nowrap">
                    {m.year}
                  </span>
                </div>

              </article>
            );
          })}
        </div>

        {/* ── THE JOURNEY CONTINUES SECTION ─────── */}
        <section className="relative mt-20 sm:mt-28 md:mt-36 text-center px-4">
          {/* Central Glowing Sparkle Node on the Spine */}
          <div className="relative z-20 flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#7156A5] p-[2px] shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-white dark:bg-[#120e24] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#A98B57] dark:text-[#D2AB45] animate-pulse" />
              </div>
            </div>

            {/* Year Range Pill Badge */}
            <span className="mt-2.5 sm:mt-3 px-3 sm:px-3.5 py-0.5 rounded-md bg-white/95 dark:bg-[#090b16]/95 border border-[#A98B57]/40 text-[10px] sm:text-[11px] font-mono font-bold text-[#A98B57] dark:text-[#D2AB45] shadow-xs whitespace-nowrap">
              2017 &rarr; 2026-27
            </span>
          </div>

          {/* Responsive Title */}
          <h2 className="font-serif-luxury text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#211D2B] dark:text-[#F5F2FA] tracking-wider uppercase drop-shadow-[0_10px_35px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] mt-5 sm:mt-6 px-2">
            THE JOURNEY CONTINUES
          </h2>

          {/* Subtitle */}
          <p className="text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-mono font-bold tracking-widest text-[#7156A5] dark:text-[#B8A5E5] uppercase mt-2 sm:mt-3 px-2">
            THIS IS NOT THE END. IT&apos;S THE NEXT <span className="text-[#A98B57] dark:text-[#D2AB45] font-extrabold">CHAPTER.</span>
          </p>

          {/* Editorial Paragraph */}
          <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] font-sans-clean max-w-xl mx-auto italic mt-3 sm:mt-4 leading-relaxed px-4">
            The path of APEX stretches into the infinite horizon. What began as a bold dream has forged an enduring athletic legacy, and the greatest championships are yet to be played.
          </p>

          {/* Action Button */}
          <div className="flex items-center justify-center mt-6 sm:mt-8 pb-4">
            <button
              onClick={() => {
                if (typeof onSwitchToTeam === 'function') {
                  onSwitchToTeam();
                }
              }}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span>MEET THE TEAM</span>
            </button>
          </div>
        </section>

      </div>

    </div>
  );
};

/**
 * Clean Gallery-Style White-Bordered Milestone Card — Fully Responsive
 * Clicking any folder navigates directly to the Gallery page
 */
const MilestoneCard = ({ milestone, isActive }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate('/gallery');
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`relative w-full rounded-xl sm:rounded-2xl border transition-all duration-500 p-2 sm:p-5 lg:p-7 shadow-2xs group cursor-pointer
        bg-white/80 dark:bg-[#0D101A]
        hover:scale-[1.02] active:scale-[0.98]
        ${isActive
          ? 'border-[#7156A5]/60 dark:border-[#8B5CF6]/60 shadow-[#7156A5]/20'
          : 'border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/40 dark:hover:border-[#8B5CF6]/40'
        }`}
      title={`Open ${milestone.title} in Gallery`}
    >
      {/* Crisp White Photo Frame */}
      <div className="relative p-1 sm:p-2 bg-white m-0 rounded-lg sm:rounded-xl shadow-xs overflow-hidden mb-2 sm:mb-4 transition-transform duration-500 group-hover:shadow-md">
        <div className="relative overflow-hidden rounded-md sm:rounded-lg">
          <img
            src={milestone.image}
            alt={milestone.title}
            loading="lazy"
            className="w-full h-20 sm:h-44 md:h-56 lg:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Interactive Hover Badge indicating Gallery destination */}
          <div className="absolute inset-0 bg-slate-950/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg bg-white/95 dark:bg-slate-900/90 text-[#7156A5] dark:text-[#B8A5E5] font-mono text-[8px] sm:text-xs font-bold shadow-lg scale-90 group-hover:scale-100 transition-transform">
              <FolderOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#7156A5] dark:text-[#B8A5E5]" />
              <span>Explore Gallery</span>
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-serif-luxury text-xs sm:text-lg lg:text-xl font-bold text-[#211D2B] dark:text-[#F5F2FA] tracking-wide uppercase leading-tight">
        {milestone.title}
      </h3>

      {/* Muted institutional gold subtitle */}
      <div className="text-[8px] sm:text-xs lg:text-[13px] font-mono font-bold text-[#A98B57] dark:text-[#D2AB45] uppercase tracking-wider mt-0.5 sm:mt-1 mb-1 sm:mb-2 line-clamp-1">
        {milestone.subtitle}
      </div>

      {/* Editorial story */}
      <p className="text-[8.5px] sm:text-xs lg:text-sm text-[#686370] dark:text-[#AAA4B8] font-sans-clean leading-tight sm:leading-relaxed mb-1.5 sm:mb-3 line-clamp-3 sm:line-clamp-none">
        {milestone.story}
      </p>

      {/* Quote pill */}
      <blockquote className="p-1.5 sm:p-3 rounded-lg border-l-2 border-[#7156A5] dark:border-[#8B5CF6] bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] italic text-[7.5px] sm:text-xs font-serif leading-tight mb-1.5 sm:mb-3 line-clamp-2 sm:line-clamp-none">
        &ldquo;{milestone.quote}&rdquo;
      </blockquote>
    </div>
  );
};
