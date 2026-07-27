import React from 'react';
import { User, ShieldCheck, CreditCard, Ticket } from 'lucide-react';

export const RegistrationStepper = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Athlete Details', icon: User },
    { num: 2, label: 'Declaration & Policy', icon: ShieldCheck },
    { num: 3, label: 'Payment Verification', icon: CreditCard },
    { num: 4, label: 'Receipt & Pass', icon: Ticket }
  ];

  return (
    <div className="mb-10 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
      <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs font-bold">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isCompleted = currentStep > s.num;

          return (
            <div
              key={s.num}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                isActive
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : isCompleted
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {isCompleted ? '✓' : <Icon className="w-4 h-4" />}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
