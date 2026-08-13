import React from 'react';
import { ShieldAlert, Info, CheckCircle2, X, ArrowLeft } from 'lucide-react';

export const CRICKET_8OVER_RULES_DATA = [
  { label: "Overs", text: "**8 overs** per innings." },
  { label: "Players", text: "**11 players** per team (or as decided by tournament)." },
  { label: "Powerplay", text: "First **2 overs**." },
  { label: "Bowling Limit", text: "Maximum **2 overs per bowler**." },
  { label: "Wide", text: "**1 extra run** + ball is rebowled." },
  { label: "No-Ball", text: "**1 extra run** + ball is rebowled." },
  { label: "Free Hit", text: "Awarded after a **front-foot no-ball**." },
  { label: "Bye / Leg-Bye", text: "Awarded according to **standard cricket rules**." },
  { label: "Innings Break", text: "Around **5 minutes**." },
  { label: "Time Limit", text: "Recommended **45–60 minutes** per match." },
  { label: "Tie", text: "**Super Over**, if required." },
  { label: "Rain / Interrupted Match", text: "Minimum **5 overs** should normally be completed for a result, subject to tournament rules." }
];

export const CRICKET_10OVER_RULES_DATA = [
  { label: "Overs", text: "**10 overs** per innings." },
  { label: "Players", text: "**11 players** per team." },
  { label: "Powerplay", text: "First **3 overs**." },
  { label: "Bowling Limit", text: "Maximum **2 overs per bowler**." },
  { label: "Wide", text: "**1 extra run** + rebowled." },
  { label: "No-Ball", text: "**1 extra run** + rebowled." },
  { label: "Free Hit", text: "Awarded after a **front-foot no-ball**." },
  { label: "Innings Break", text: "Around **5–7 minutes**." },
  { label: "Time Limit", text: "Recommended **55–70 minutes** per match." },
  { label: "Tie", text: "**Super Over**, if required." }
];

export const CRICKET_COMPARISON_TABLE = [
  { rule: "Overs / Innings", over8: "8 overs", over10: "10 overs" },
  { rule: "Powerplay", over8: "2 overs", over10: "3 overs" },
  { rule: "Max overs / bowler", over8: "2 overs", over10: "2 overs" },
  { rule: "Players per team", over8: "11 players", over10: "11 players" },
  { rule: "Innings break", over8: "5 min", over10: "5–7 min" },
  { rule: "Match duration", over8: "~45–60 min", over10: "~55–70 min" },
  { rule: "Tie Decider", over8: "Super Over", over10: "Super Over" }
];

const renderFormattedText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-emerald-400">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

export const CricketRulesDisplay = () => {
  return (
    <div className="space-y-8 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">
            🏏
          </div>
          <div>
            <h4 className="font-black text-base sm:text-lg uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Official Cricket Tournament Rulebook
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Complete 8-Over & 10-Over Format Rules & Match Guidelines</p>
          </div>
        </div>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 self-start sm:self-auto font-mono">
          ⚡ 8 & 10 Over Rules
        </span>
      </div>

      {/* 1. 8-Over Cricket Rules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-black text-sm sm:text-base text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <span>🏏</span>
            <span>8-Over Cricket Rules</span>
          </h5>
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-bold">
            8 Overs / Innings
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-emerald-500/20 shadow-sm dark:shadow-inner">
          {CRICKET_8OVER_RULES_DATA.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80">
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 shrink-0 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                •
              </span>
              <div className="leading-relaxed">
                <strong className="font-bold text-emerald-700 dark:text-emerald-300 mr-1.5 uppercase text-[11px] font-mono tracking-wider block sm:inline">
                  {rule.label}:
                </strong>
                <span className="text-slate-700 dark:text-slate-200">{renderFormattedText(rule.text)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 10-Over Cricket Rules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-black text-sm sm:text-base text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <span>🏏</span>
            <span>10-Over Cricket Rules</span>
          </h5>
          <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-mono font-bold">
            10 Overs / Innings
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-amber-500/20 shadow-sm dark:shadow-inner">
          {CRICKET_10OVER_RULES_DATA.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80">
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 shrink-0 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                •
              </span>
              <div className="leading-relaxed">
                <strong className="font-bold text-amber-700 dark:text-amber-300 mr-1.5 uppercase text-[11px] font-mono tracking-wider block sm:inline">
                  {rule.label}:
                </strong>
                <span className="text-slate-700 dark:text-slate-200">{renderFormattedText(rule.text)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Suggested Tournament Format Comparison Table */}
      <div className="space-y-4">
        <h5 className="font-black text-sm sm:text-base text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
          <span>⚡</span>
          <span>Suggested Tournament Format Comparison</span>
        </h5>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono uppercase text-[11px]">
                <th className="p-3.5 font-black text-slate-900 dark:text-slate-200">Rule</th>
                <th className="p-3.5 font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-x border-slate-200 dark:border-slate-800 text-center">
                  🏏 8 Overs Format
                </th>
                <th className="p-3.5 font-black text-amber-700 dark:text-amber-400 bg-amber-500/10 text-center">
                  🏏 10 Overs Format
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
              {CRICKET_COMPARISON_TABLE.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200 font-sans">{row.rule}</td>
                  <td className="p-3.5 text-emerald-700 dark:text-emerald-300 font-black bg-emerald-500/5 border-x border-slate-200 dark:border-slate-800/60 text-center">
                    {row.over8}
                  </td>
                  <td className="p-3.5 text-amber-700 dark:text-amber-300 font-black bg-amber-500/5 text-center">
                    {row.over10}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export const CricketRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/95 backdrop-blur-xl p-3 sm:p-6 animate-fade-in flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-900 dark:text-white">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-2 transition border border-slate-200 dark:border-slate-700 active:scale-95 shadow-md shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Go Back</span>
          </button>

          <div className="text-center truncate">
            <span className="text-[10px] font-mono uppercase tracking-widest block font-bold text-emerald-600 dark:text-emerald-400">
              Official Cricket Tournament Rulebook
            </span>
            <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-center truncate">
              <span>🏏</span> Cricket Tournament Rules
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800/80 transition shrink-0 cursor-pointer"
            title="Close Rules"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto">
          <CricketRulesDisplay />
        </div>

        {/* Sticky Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 italic hidden sm:inline">
            Official 8-Over & 10-Over Cricket Tournament Regulations
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center gap-2 transition shadow-md active:scale-95 ml-auto cursor-pointer bg-emerald-600 hover:bg-emerald-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back to Registration</span>
          </button>
        </div>

      </div>
    </div>
  );
};
