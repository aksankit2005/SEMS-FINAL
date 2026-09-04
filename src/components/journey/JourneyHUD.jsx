import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const JourneyHUD = ({ activeMilestone, totalCount = 10, onExit }) => {

  const currentIndex = activeMilestone?.id || 1;
  const currentTitle = activeMilestone?.title || 'APEX FOUNDED';
  const indexFormatted = String(currentIndex).padStart(2, '0');
  const totalFormatted = String(totalCount).padStart(2, '0');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Exit button & Archives Pill */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 hover:border-purple-500/60 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-lg backdrop-blur-md cursor-pointer group"
            title="Exit Journey"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-purple-400" />
            <span>Exit</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d101f]/80 border border-purple-500/20 text-[11px] font-mono tracking-wider text-purple-300/90 shadow-md backdrop-blur-md">
            <span className="text-purple-400 font-bold">A</span>
            <span>APEX LEGACY // ARCHIVES</span>
          </div>
        </div>

        {/* Center: Live Milestone Counter HUD Pill */}
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0a0d1a]/85 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.18)] backdrop-blur-md text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500 shadow-[0_0_8px_#c084fc]" />
            </span>
            <span className="font-semibold tracking-wide text-white uppercase text-[11px] max-w-[160px] sm:max-w-xs truncate">
              {currentTitle}
            </span>
          </div>
        </div>

        {/* Right side spacer */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Audio button completely removed per user request */}
        </div>

      </div>
    </header>
  );
};
