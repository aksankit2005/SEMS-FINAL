import React from 'react';
import { Lock, Eye, ShieldCheck, Database } from 'lucide-react';

export const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
            <Lock className="w-4 h-4 text-emerald-500" /> Data Protection
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Privacy <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            How APEX Sports Event Management System collects, protects, and uses your personal data.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" /> 1. Information We Collect
            </h2>
            <p>
              When student athletes register for APEX 2026, we collect essential registration details including Full Name, College/University Name, Student ID/Roll Number, Official Email, Phone Number, and selected sports discipline.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" /> 2. How Your Data Is Used
            </h2>
            <p>
              Your data is strictly utilized for verifying athlete eligibility, preparing match rosters, generating digital athlete passes, publishing leaderboard stats, and notifying team managers about match schedule updates.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 3. Data Protection & Security
            </h2>
            <p>
              We enforce strict encryption and access control protocols. Athlete credentials and administrative portals are secured. We never sell, lease, or distribute athlete data to third-party commercial advertisers.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" /> 4. Contact Data Privacy Desk
            </h2>
            <p>
              If you have questions or wish to correct your registered information, please contact the APEX Sports Privacy Officer at <strong>sports@mpgi.edu.in</strong>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};
