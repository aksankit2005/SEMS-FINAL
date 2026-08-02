import React, { useState } from 'react';
import {
  Trophy, Users, Calendar, Award, ShieldCheck,
  Sparkles, ChevronDown, Mail, Globe, Info,
  Flame, Target, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage = () => {
  const [selectedYear, setSelectedYear] = useState('2025');

  // Committee data for years 2025, 2026, 2027, 2028
  const committeeData = {
    '2025': [
      {
        role: 'President',
        name: 'Praveen Rai',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/praveen.jpg',
      },
      {
        role: 'Vice President',
        name: 'Harsh Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/harsh.jpg',
      },
      {
        role: 'Technical Head',
        name: 'Ankit Kumar Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/ankit.jpg',
      },
      {
        role: 'Secretary',
        name: 'Aditya Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/aditya.jpg',
      },
      {
        role: 'Treasurer',
        name: 'Shubham Tiwari',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/shubham.jpg',
      },
      {
        role: 'PR Head',
        name: 'Vishesh Pandey',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/vishesh.jpg',
      },
      {
        role: 'Coordinator',
        name: 'Gunjan Gupta',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/gunjan.jpg',
      }
    ],
    '2026': [
      {
        role: 'President',
        name: 'Praveen Rai',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/praveen.jpg',
      },
      {
        role: 'Vice President',
        name: 'Harsh Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/harsh.jpg',
      },
      {
        role: 'Technical Head',
        name: 'Ankit Kumar Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/ankit.jpg',
      },
      {
        role: 'Secretary',
        name: 'Aditya Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/aditya.jpg',
      },
      {
        role: 'Treasurer',
        name: 'Shubham Tiwari',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/shubham.jpg',
      },
      {
        role: 'PR Head',
        name: 'Vishesh Pandey',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/vishesh.jpg',
      },
      {
        role: 'Coordinator',
        name: 'Gunjan Gupta',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/gunjan.jpg',
      }
    ],
    '2027': [
      {
        role: 'President',
        name: 'Praveen Rai',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/praveen.jpg',
      },
      {
        role: 'Vice President',
        name: 'Harsh Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/harsh.jpg',
      },
      {
        role: 'Technical Head',
        name: 'Ankit Kumar Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/ankit.jpg',
      },
      {
        role: 'Secretary',
        name: 'Aditya Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/aditya.jpg',
      },
      {
        role: 'Treasurer',
        name: 'Shubham Tiwari',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/shubham.jpg',
      },
      {
        role: 'PR Head',
        name: 'Vishesh Pandey',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/vishesh.jpg',
      },
      {
        role: 'Coordinator',
        name: 'Gunjan Gupta',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/gunjan.jpg',
      }
    ],
    '2028': [
      {
        role: 'President',
        name: 'Praveen Rai',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/praveen.jpg',
      },
      {
        role: 'Vice President',
        name: 'Harsh Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/harsh.jpg',
      },
      {
        role: 'Technical Head',
        name: 'Ankit Kumar Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/ankit.jpg',
      },
      {
        role: 'Secretary',
        name: 'Aditya Singh',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/aditya.jpg',
      },
      {
        role: 'Treasurer',
        name: 'Shubham Tiwari',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/shubham.jpg',
      },
      {
        role: 'PR Head',
        name: 'Vishesh Pandey',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/vishesh.jpg',
      },
      {
        role: 'Coordinator',
        name: 'Gunjan Gupta',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        image: '/team/gunjan.jpg',
      }
    ]
  };

  const isUpcoming = selectedYear === '2027' || selectedYear === '2028';
  const upcomingLabel = selectedYear === '2027' ? '2026-27' : '2027-28';
  const currentTeam = committeeData[selectedYear] || committeeData['2025'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider mb-4 border border-cyan-500/20">
            <Info className="w-4 h-4 text-cyan-500" /> APEX Organizing Directorate
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            About <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 bg-clip-text text-transparent">APEX Sports</span>
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            The premier inter-college Sports Event Management System dedicated to fostering athletic talent, sportsmanship, and seamless tournament experiences.
          </p>
        </div>

        {/* Executive Committee Section with Year Dropdown */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-10 relative overflow-hidden">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" /> Leadership & Governance
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isUpcoming ? `Executive Committee (${upcomingLabel})` : 'Executive Committee 2025-26'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select a tournament year to view the office bearers and core coordinators.
              </p>
            </div>

            {/* Year Selector Dropdown */}
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/60 shrink-0">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-2">
                Select Year:
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-md cursor-pointer transition-all"
                >
                  <option value="2025" className="bg-slate-900 text-white">2025-26</option>
                  <option value="2027" className="bg-slate-900 text-white">2026-27 (Upcoming)</option>
                  <option value="2028" className="bg-slate-900 text-white">2027-28 (Upcoming)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-white absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Conditional View: Upcoming Placeholder or Active Committee Grid */}
          {isUpcoming ? (
            <div className="py-16 px-6 text-center bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-dashed border-cyan-500/30 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                🚀 Upcoming Edition
              </span>
              <h3 className="text-2xl font-black">APEX {upcomingLabel} Executive Committee</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Official committee appointments and office bearer announcements for the {upcomingLabel} edition will be revealed closer to the tournament opening ceremony.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentTeam.map((member, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col hover:border-cyan-500/50 transition-all duration-300 group shadow-sm hover:shadow-xl"
                >
                  <div className="relative w-full h-64 sm:h-72 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  </div>

                  <div className="p-4 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800/80 flex-1">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1.5 ${member.badgeColor}`}>
                      {member.role}
                    </span>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                      {member.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>



        {/* CTA Footer Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Ready to join the tournament?</h3>
            <p className="text-sm text-cyan-100 mt-1">Register your team today or explore upcoming match schedules.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/registration"
              className="px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-100 transition shadow-lg"
            >
              Register Team
            </Link>
            <Link
              to="/sports"
              className="px-6 py-3 rounded-xl bg-slate-950/40 hover:bg-slate-950/60 text-white font-bold text-sm transition border border-white/20"
            >
              Explore Sports
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
