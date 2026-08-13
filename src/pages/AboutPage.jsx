import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Sparkles, ChevronDown,
  GraduationCap, Code
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { committeeApi } from '../services/committeeApi';

const DEFAULT_EXEC_COMMITTEE = [
  { role: 'President', name: 'Praveen Rai', image: '/team/praveen.jpg' },
  { role: 'Vice President', name: 'Harsh Singh', image: '/team/harsh.jpg' },
  { role: 'Technical Head', name: 'Ankit Kumar Singh', image: '/team/ankit.jpg' },
  { role: 'Secretary', name: 'Aditya Singh', image: '/team/aditya.jpg' },
  { role: 'Treasurer', name: 'Shubham Tiwari', image: '/team/shubham.jpg' },
  { role: 'Coordinator', name: 'Gunjan Gupta', image: '/team/gunjan.jpg' },
  { role: 'PR Head', name: 'Vishesh Panday', image: '/team/vishesh.jpg' }
];

const LinkedinIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.6 1.6 0 1 0 1.6 1.6 1.6 1.6 0 0 0-1.6-1.6z" />
  </svg>
);

export const AboutPage = () => {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const load = () => {
      committeeApi.getCommitteeData().then((data) => {
        setSessions(data || []);
      });
    };
    load();
    window.addEventListener('sems_committee_updated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('sems_committee_updated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  const facultyAdvisors = [
    {
      name: 'Mr. Susil Kushwaha',
      role: 'Faculty Advisor',
      image: '/team/faculty_susil.jpg'
    },
    {
      name: 'Mr. Kaushal Maurya',
      role: 'Co-Faculty Advisor',
      image: '/team/faculty_kaushal.jpg'
    },
    {
      name: 'Mr. Rahul Kumar',
      role: 'Co-Faculty Advisor',
      image: '/team/faculty_rahul.jpg'
    },
    {
      name: 'Mr. Amit kr Verma',
      role: 'Co-Faculty Advisor',
      image: '/team/faculty_amit.jpg'
    },
    {
      name: 'Dr. Ajay kr Singh',
      role: 'Sports Coach',
      image: '/team/faculty_ajay.jpg'
    }
  ];

  const developersData = [
    {
      name: 'Praveen Rai',
      role: 'Team Lead',
      image: '/team/praveen_dev.jpg',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      linkedin: 'https://linkedin.com/in/praveen-rai-409400280'
    },
    {
      name: 'Ankit Kumar Singh',
      role: 'Frontend',
      image: '/team/ankit.jpg',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      linkedin: 'https://linkedin.com/in/ankit-kumar-singh-a7433b328'
    },
    {
      name: 'Divya Singh',
      role: 'Frontend',
      image: '/team/divya.jpg',
      badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30',
      linkedin: 'https://www.linkedin.com/in/divya-singh0210'
    },
    {
      name: 'Ritik Kumar Singh',
      role: 'Backend',
      image: '/team/ritik.jpg',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      linkedin: 'https://linkedin.com/in/ritik-kumar-singh-1784a328a'
    },
    {
      name: 'Harshit Singh',
      role: 'Database',
      image: '/team/harshit.jpg',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      linkedin: 'https://linkedin.com/in/harshit-singh-21jan2004'
    }
  ];

  const committeeData = { '2025': DEFAULT_EXEC_COMMITTEE };

  // ── Build year map from admin-managed sessions ───────────────────────────
  const committeeYears = {};
  sessions.forEach((s) => {
    const year = (s.label || '').split('-')[0] || s.label || '2025';
    committeeYears[year] = s;
  });

  const activeSession = sessions.find((s) => s.isActive) || sessions[0] || null;
  const selectedSession = committeeYears[selectedYear] || activeSession;

  // Faculty Advisors from active session (fallback to static defaults)
  const advisors =
    activeSession?.advisors && activeSession.advisors.length > 0
      ? activeSession.advisors
      : facultyAdvisors;

  const currentTeam = (selectedSession?.executiveCommittee || committeeData['2025'] || []).map((m) => ({
    ...m,
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
  }));

  const isUpcoming = !(currentTeam && currentTeam.length > 0);
  const upcomingLabel = selectedSession?.label || `${selectedYear}-26`;

  const yearOptions = sessions.map((s) => {
    const year = (s.label || '').split('-')[0] || s.label || '2025';
    return {
      value: year,
      label: s.label || year,
      isUpcoming: !(s.executiveCommittee && s.executiveCommittee.length > 0)
    };
  });

  if (yearOptions.length === 0) {
    yearOptions.push({ value: '2025', label: '2025-26', isUpcoming: false });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Faculty Advisors Section */}
        <div className="p-4 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 relative overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" /> Academic Mentors
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Faculty Advisors
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Distinguished faculty members guiding APEX sports tournament operations and leadership.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {advisors.map((advisor, index) => (
              <div
                key={advisor.id || index}
                className="overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col hover:border-indigo-500/50 transition-all duration-300 group shadow-sm hover:shadow-xl"
              >
                <div className="relative w-full h-56 overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={advisor.image}
                    alt={advisor.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                </div>

                <div className="p-4 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800/80 flex-1">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                    {advisor.role}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                    {advisor.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Developers Section */}
        <div className="p-4 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 relative overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
              <Code className="w-4 h-4" /> Platform Engineers
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Developers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The technical team behind building and designing the APEX Sports Management System.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {developersData.map((dev, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col hover:border-cyan-500/50 transition-all duration-300 group shadow-sm hover:shadow-xl"
              >
                <div className="relative w-full h-56 overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={dev.image}
                    alt={dev.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                </div>

                <div className="p-4 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800/80 flex-1">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1.5 ${dev.badgeColor}`}>
                    {dev.role}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                    {dev.name}
                  </h3>

                  {dev.linkedin && (
                    <a
                      href={dev.linkedin.startsWith('http') ? dev.linkedin : `https://${dev.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition"
                    >
                      <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Executive Committee Section with Year Dropdown */}
        <div className="p-4 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" /> Leadership & Governance
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isUpcoming ? `Executive Committee (${upcomingLabel})` : `Executive Committee ${upcomingLabel}`}
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
                  {yearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                      {opt.label}{opt.isUpcoming ? ' (Upcoming)' : ''}
                    </option>
                  ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {currentTeam.map((member, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col hover:border-cyan-500/50 transition-all duration-300 group shadow-sm hover:shadow-xl"
                >
                  <div className="relative w-full h-56 overflow-hidden bg-slate-200 dark:bg-slate-800">
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
        <div className="p-6 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Ready to join the tournament?</h3>
            <p className="text-sm text-cyan-100 mt-1">Register your team today or explore upcoming match schedules.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              to="/registration"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-sm text-center hover:bg-slate-100 transition shadow-lg"
            >
              Register Team
            </Link>
            <Link
              to="/sports"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-950/40 hover:bg-slate-950/60 text-white font-bold text-sm text-center transition border border-white/20"
            >
              Explore Sports
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
