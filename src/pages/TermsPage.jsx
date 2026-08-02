import React from 'react';
import { FileText, ShieldAlert, CheckCircle, Scale } from 'lucide-react';

export const TermsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider border border-cyan-500/20">
            <Scale className="w-4 h-4 text-cyan-500" /> Legal Governance
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Terms & <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">Conditions</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official Guidelines & Operating Regulations for APEX 2026 Sports Tournament. Last updated: August 2026.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-500" /> 1. Eligibility & Athlete Code of Conduct
            </h2>
            <p>
              All participating athletes must be full-time registered students of their respective colleges. False documentation, impersonation, or unsportsmanlike conduct on or off the field will result in immediate disqualification of the entire team and forfeiture of matches.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-500" /> 2. Tournament Fixtures & Reporting Timings
            </h2>
            <p>
              Teams must report to their assigned sports ground at least 30 minutes prior to the scheduled match kickoff time. Late arrivals exceeding 15 minutes beyond the match time will result in a walkover given to the opposing team.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-500" /> 3. Refereeing & Umpiring Appeals
            </h2>
            <p>
              The decision of official match referees, umpires, and tournament judges is final and binding. Any formal technical protest must be submitted in writing by the Team Captain/Manager to the APEX Appeal Directorate within 1 hour of match completion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> 4. Safety & Injury Disclaimer
            </h2>
            <p>
              While first-aid stations and emergency medical teams are stationed at all venues, APEX Sports Directorate and college authorities shall not be held liable for accidental physical injuries or property loss incurred during the sports event.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-500" /> 5. Media & Broadcast Rights
            </h2>
            <p>
              By participating in APEX 2026, athletes grant the organizers rights to capture photographs, video recordings, and live commentary for official website broadcasting, leaderboards, and promotional news bulletins.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};
