import React from 'react';
import { Trophy, Users, Calendar, Award } from 'lucide-react';

export const QuickStats = () => {
  const stats = [
    { icon: Trophy, count: "12", label: "Sports Categories", sub: "Indoor & Outdoor" },
    { icon: Users, count: "1,200+", label: "Registered Athletes", sub: "Mpgi All Colleges" },
    { icon: Calendar, count: "140+", label: "Tournament Fixtures", sub: "5 Championship Days" },
    { icon: Award, count: "Gift/Cash", label: "Price Pool", sub: "Trophies & Medals" }
  ];

  return (
    <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:border-blue-500/50 transition-all duration-300 group shadow-sm"
              >
                <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {item.count}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
