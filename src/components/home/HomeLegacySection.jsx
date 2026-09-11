import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, ChevronRight, Compass, Trophy } from 'lucide-react';
import { JOURNEY_MILESTONES } from '../../data/journeyData';

export const HomeLegacySection = () => {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 360;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className="py-10 sm:py-20 bg-[#FAF9F6] dark:bg-[#070A13] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] transition-colors duration-200 font-spatial-sans relative overflow-hidden">
      <div className="w-full max-w-[1600px] px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 mx-auto space-y-6 sm:space-y-8">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 sm:pb-6 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] xs:text-xs font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] mb-1.5 sm:mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
              <span>Championship Heritage &amp; Vision</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-spatial-display tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase">
              APEX <span className="text-[#7156A5] dark:text-[#B8A5E5]">Legacy</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] mt-1 max-w-2xl">
              From foundational roots in 2017 to the modern collegiate championship era — explore the milestones, mentors, and student athletes who built the APEX spirit.
            </p>
          </div>

          {/* Action CTAs & Scroll Controls */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Navigational Scroll Controls (Desktop Only) */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <button
                onClick={() => handleScroll('left')}
                className="w-9 h-9 rounded-lg bg-white dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95"
                title="Scroll Previous Milestones"
                aria-label="Previous Milestones"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="w-9 h-9 rounded-lg bg-white dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95"
                title="Scroll Next Milestones"
                aria-label="Next Milestones"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Timeline Link */}
            <Link
              to="/journey"
              className="px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-lg bg-white dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-xs sm:text-sm font-semibold text-[#211D2B] dark:text-[#F5F2FA] hover:border-[#7156A5] dark:hover:border-[#B8A5E5] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-all shadow-2xs flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7156A5] dark:text-[#B8A5E5]" />
              <span className="truncate">Journey Arena</span>
            </Link>

            {/* Explicit ABOUT US CTA Button Required by Reference Wireframe */}
            <Link
              to="/about"
              className="px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-lg bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
            >
              <span>About Us</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>

        {/* Horizontal Timeline Rail Track */}
        <div className="relative">
          {/* Scrollable Milestone Cards Strip */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-5 overflow-x-auto pb-6 pt-2 scroll-smooth no-scrollbar select-none"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {JOURNEY_MILESTONES.map((item, idx) => {
              const isLast = idx === JOURNEY_MILESTONES.length - 1;

              return (
                <div
                  key={item.id}
                  style={{ scrollSnapAlign: 'start' }}
                  className="w-[300px] xs:w-[330px] sm:w-[360px] shrink-0 flex flex-col justify-between rounded-xl bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] p-5 hover:border-[#7156A5]/50 dark:hover:border-[#8B5CF6]/50 transition-all duration-200 shadow-2xs group relative"
                >
                  <div>
                    {/* Top Row: Year Badge & Index Indicator */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-[#FAF9F6] dark:bg-[#121625] text-[#A98B57] dark:text-[#D2AB45] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]">
                        {item.year}
                      </span>

                      <span className="text-[11px] font-mono font-bold text-[#686370] dark:text-[#AAA4B8]">
                        Milestone {item.indexStr}
                      </span>
                    </div>

                    {/* Milestone Image Thumbnail */}
                    {item.image && (
                      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden mb-3 bg-slate-100 dark:bg-slate-900 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}

                    {/* Milestone Title */}
                    <h3 className="font-spatial-display text-lg sm:text-xl font-bold tracking-tight text-[#211D2B] dark:text-[#F5F2FA] group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* Subtitle */}
                    {item.subtitle && (
                      <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#A98B57] dark:text-[#D2AB45] mt-1 mb-2">
                        {item.subtitle}
                      </p>
                    )}

                    {/* Excerpt Story */}
                    <p className="text-xs text-[#686370] dark:text-[#AAA4B8] leading-relaxed line-clamp-3">
                      {item.story}
                    </p>
                  </div>

                  {/* Milestone Footer / Quote Tag */}
                  <div className="mt-4 pt-3 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] flex items-center justify-between text-xs">
                    {item.quote ? (
                      <span className="text-[10px] font-mono text-[#7156A5] dark:text-[#B8A5E5] italic truncate max-w-[200px]">
                        &ldquo;{item.quote}&rdquo;
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#686370] dark:text-[#AAA4B8]">
                        APEX Sports Archive
                      </span>
                    )}

                    <Link
                      to="/about"
                      className="text-[11px] font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>Read</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
