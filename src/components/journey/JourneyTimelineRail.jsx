import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { journeyAudio } from '../../utils/journeyAudio';

export const JourneyTimelineRail = ({
  milestones = [],
  activeMilestoneId,
  onSelectMilestone
}) => {
  const activeIndex = milestones.findIndex((m) => m.id === activeMilestoneId);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  const handlePrev = () => {
    if (safeActiveIndex > 0) {
      journeyAudio.playWhoosh();
      onSelectMilestone(milestones[safeActiveIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (safeActiveIndex < milestones.length - 1) {
      journeyAudio.playWhoosh();
      onSelectMilestone(milestones[safeActiveIndex + 1].id);
    }
  };

  return (
    <>
      {/* ── Desktop & Laptop Floating Vertical Rail (Right Edge) ────── */}
      <aside
        aria-label="Timeline Navigation"
        className="hidden md:flex fixed right-2 lg:right-3 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-1 sm:gap-1.5 py-2 sm:py-3 px-1 sm:px-1.5 rounded-full bg-white/85 dark:bg-[#080b17]/90 border border-slate-200 dark:border-purple-500/20 backdrop-blur-md shadow-xl shadow-slate-300/50 dark:shadow-purple-950/40 transition-all"
      >
        {/* Prev Chevron */}
        <button
          onClick={handlePrev}
          disabled={safeActiveIndex === 0}
          className="p-0.5 sm:p-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-purple-900/30 transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Previous Milestone"
        >
          <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </button>

        {/* Milestone Dot Nodes with Year Tooltip */}
        <div className="flex flex-col items-center gap-1 sm:gap-1.5 my-0.5">
          {milestones.map((m) => {
            const isActive = m.id === activeMilestoneId;

            return (
              <button
                key={m.id}
                onClick={() => {
                  journeyAudio.playWhoosh();
                  onSelectMilestone(m.id);
                }}
                className="group relative flex items-center justify-center p-0.5 cursor-pointer transition-all"
                title={`${m.year}: ${m.title}`}
              >
                {/* Year tooltip on hover or active */}
                <span
                  className={`absolute right-5 sm:right-6 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono whitespace-nowrap transition-all duration-200 pointer-events-none ${
                    isActive
                      ? 'bg-purple-600 text-white font-bold opacity-100 translate-x-0 shadow-md shadow-purple-900/50'
                      : 'bg-slate-900 text-slate-200 dark:bg-slate-900/95 dark:text-slate-400 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 border border-slate-700/60'
                  }`}
                >
                  {m.year}
                </span>

                {/* Dot */}
                <span
                  className={`rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-[0_0_10px_#c084fc] ring-2 ring-purple-400/50'
                      : 'w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 dark:bg-slate-600/80 group-hover:bg-purple-500 dark:group-hover:bg-purple-400/80 group-hover:scale-125'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Next Chevron */}
        <button
          onClick={handleNext}
          disabled={safeActiveIndex === milestones.length - 1}
          className="p-0.5 sm:p-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-purple-900/30 transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Next Milestone"
        >
          <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </button>
      </aside>
    </>
  );
};
