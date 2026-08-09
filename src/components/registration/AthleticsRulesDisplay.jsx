import React, { useState } from 'react';
import { Flame, Award, CheckCircle, Clock, Trophy, AlertCircle, Sparkles } from 'lucide-react';
import { OFFICIAL_ATHLETICS_EVENTS } from './AthleticsRegistration';

export const AthleticsRulesDisplay = () => {
  const [selectedSubEvent, setSelectedSubEvent] = useState('100m Race');

  const subEventDetails = {
    '100m Race': { type: 'Track Event', format: 'Individual Sprint', metric: 'Time in Seconds (s)', rules: ['Automatic electronic timing.', '1 false start results in disqualification.', 'Spikes permitted up to 6mm.'] },
    '200m Race': { type: 'Track Event', format: 'Individual Sprint', metric: 'Time in Seconds (s)', rules: ['Staggered lane start.', 'Runners must remain in allocated lanes throughout.', 'Wind speed reading monitored.'] },
    '4*100m relay Race': { type: 'Track Event', format: '4-Player Team Relay', metric: 'Time in Seconds (s)', rules: ['Baton exchange within 30m takeover zone.', 'Dropped baton must be retrieved by athlete who dropped it.', '4 runners per registered team squad.'] },
    'Long Jump': { type: 'Field Event', format: 'Individual Jump', metric: 'Distance in Meters (m)', rules: ['3 preliminary jumps per athlete.', 'Foul if foot crosses takeoff board edge.', 'Measurement taken from nearest break in sand.'] },
    'Javelin Throw': { type: 'Field Event', format: 'Individual Throw', metric: 'Distance in Meters (m)', rules: ['Tip of javelin must land first within sector.', 'Thrower must not leave runway until javelin lands.', 'Standard 800g (Mens) / 600g (Womens) javelins.'] },
    'Shot Put': { type: 'Field Event', format: 'Individual Put', metric: 'Distance in Meters (m)', rules: ['Shot must be put from shoulder with one hand only.', 'Athlete must exit from rear half of circle after landing.', '7.26kg (Mens) / 4kg (Womens) shot.'] },
    'Discus Throw': { type: 'Field Event', format: 'Individual Throw', metric: 'Distance in Meters (m)', rules: ['Discus must land inside 34.92° landing sector.', 'Must remain inside circle until implement touches ground.', '2kg (Mens) / 1kg (Womens) discus.'] },
  };

  const currentInfo = subEventDetails[selectedSubEvent] || subEventDetails['100m Race'];

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* HEADER BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 space-y-1">
        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> OFFICIAL ATHLETICS RULEBOOK & EVENT GUIDELINES
        </span>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Athletes can register for <span className="text-amber-600 dark:text-amber-400 font-extrabold underline decoration-amber-500">EXACTLY ONE</span> sub-event from the 7 official disciplines below.
        </p>
      </div>

      {/* 7 SUB-EVENTS SELECTOR CHIPS */}
      <div className="space-y-2">
        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
          Select Sub-Event to View Specific Guidelines:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {OFFICIAL_ATHLETICS_EVENTS.map((evt) => {
            const isSelected = selectedSubEvent === evt;
            return (
              <button
                key={evt}
                type="button"
                onClick={() => setSelectedSubEvent(evt)}
                className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition text-left cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
              >
                {evt}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED SUB-EVENT CARD */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
              {currentInfo.type} • {currentInfo.format}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedSubEvent}</h4>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono text-[10px] font-bold">
            {currentInfo.metric}
          </span>
        </div>

        <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
          {currentInfo.rules.map((rule, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};
