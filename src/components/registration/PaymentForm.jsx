import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PaymentForm = ({
  sport,
  formData,
}) => {

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">

      {/* Secure Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
          R
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Razorpay Payment Gateway</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Powered by Razorpay 256-Bit Secure SSL
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">College / Institution:</span>
          <span className="font-bold">{formData.collegeName}</span>
        </div>
        {formData.teamName && (
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Team Name:</span>
            <span className="font-bold">{formData.teamName}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">Registration Sport:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{sport.name}</span>
        </div>
        <div className="pt-2.5 border-t border-slate-200 dark:border-slate-850 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Amount to Pay:</span>
          <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">₹{sport.entryFee}</span>
        </div>
      </div>

    </div>
  );
};
