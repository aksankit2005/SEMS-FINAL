import React from 'react';
import { User, ShieldCheck, CreditCard, Ticket } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const RegistrationStepper = ({ currentStep }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const steps = [
    { num: 1, label: 'Athlete Details', icon: User },
    { num: 2, label: 'Declaration & Payment', icon: CreditCard },
    { num: 3, label: 'Receipt & Pass', icon: Ticket }
  ];

  return (
    <div className={`mb-10 p-4 sm:p-6 rounded-3xl border transition-all ${
      isDark
        ? 'spatial-glass-card-dark border-white/10 shadow-lg'
        : 'spatial-glass-card-light border-slate-200/90 shadow-md'
    }`}>
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isCompleted = currentStep > s.num;

          return (
            <div
              key={s.num}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                isActive
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : isCompleted
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-200 text-slate-500'
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
