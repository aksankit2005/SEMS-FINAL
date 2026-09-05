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
    <div className={`mb-8 p-3 sm:p-4 rounded-lg border transition-all ${
      isDark
        ? 'bg-[#0D101A] border-[rgba(184,165,229,0.16)] shadow-xs'
        : 'bg-[#FFFFFF] border-[#E5E1E8] shadow-2xs'
    }`}>
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs font-semibold font-mono uppercase tracking-wider">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isCompleted = currentStep > s.num;

          return (
            <div
              key={s.num}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] font-bold'
                  : isCompleted
                  ? 'text-[#1B5E20] dark:text-[#81C784]'
                  : 'text-[#686370] dark:text-[#AAA4B8]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-2xs'
                    : isCompleted
                    ? 'bg-[#1B5E20] dark:bg-[#81C784] text-white'
                    : isDark ? 'bg-[#121625] text-[#AAA4B8] border border-[rgba(184,165,229,0.12)]' : 'bg-[#FAF9F6] text-[#686370] border border-[#E5E1E8]'
                }`}
              >
                {isCompleted ? '✓' : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
