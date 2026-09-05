import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Sparkles, ChevronDown,
  GraduationCap, Code, Compass, Users, X, Eye
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { committeeApi } from '../services/committeeApi';
import { JOURNEY_MILESTONES } from '../data/journeyData';
import { JourneyMilestonesOverlay } from '../components/journey/JourneyMilestonesOverlay';
import { JourneyTimelineRail } from '../components/journey/JourneyTimelineRail';
import '../styles/spatialGallery.css';

const DEFAULT_EXEC_COMMITTEE = [
  { role: 'President', name: 'Praveen Rai', image: '/team/praveen.jpg' },
  { role: 'Vice President', name: 'Harsh Singh', image: '/team/harsh.jpg' },
  { role: 'Technical Head', name: 'Ankit Kumar Singh', image: '/team/ankit.jpg' },
  { role: 'Secretary', name: 'Aditya Singh', image: '/team/aditya.jpg' },
  { role: 'Treasurer', name: 'Shubham Tiwari', image: '/team/shubham.jpg' },
  { role: 'Coordinator', name: 'Gunjan Gupta', image: '/team/gunjan.jpg' },
  { role: 'PR Head', name: 'Vishesh Panday', image: '/team/vishesh.jpg' }
];

const MEMBER_DESCRIPTIONS = {
  'Mr. Susil Kushwaha': {
    description: 'Senior faculty mentor leading sports coordination, strategic council oversight, and student athletic empowerment across all MPGI institutions.',
    department: 'Faculty Leadership & Mentorship',
    tags: ['Tournament Oversight', 'Leadership Guidance', 'Student Athletic Development']
  },
  'Mr. Kaushal Maurya': {
    description: 'Co-Faculty Advisor dedicated to tournament governance, inter-college athletic relations, and student welfare across competitive collegiate sports.',
    department: 'Athletic Coordination & Affairs',
    tags: ['Inter-College Relations', 'Event Governance', 'Team Ethics']
  },
  'Mr. Rahul Kumar': {
    description: 'Advising tournament committee operations, match integrity, discipline enforcement, and fair-play compliance throughout the championship.',
    department: 'Operations & Rules Advisory',
    tags: ['Match Integrity', 'Discipline & Conduct', 'Tournament Protocols']
  },
  'Mr. Amit kr Verma': {
    description: 'Guiding championship logistics, scheduling framework, referee coordination, and arena infrastructure readiness.',
    department: 'Logistics & Infrastructure Advisory',
    tags: ['Arena Readiness', 'Event Logistics', 'Schedule Strategy']
  },
  'Dr. Ajay kr Singh': {
    description: 'Chief Sports Coach directing student athletic conditioning, specialized discipline training, and tactical match preparation across disciplines.',
    department: 'Athletic Coaching & Training',
    tags: ['Strength & Conditioning', 'Tactical Training', 'Championship Coaching']
  },
  'Praveen Rai': {
    description: 'Serving as President, orchestrating cross-campus sporting operations, executive council alignment, and championship ceremonies.',
    department: 'Executive Leadership',
    tags: ['Executive Vision', 'Event Direction', 'Campus Alignment']
  },
  'Harsh Singh': {
    description: 'Vice President driving player registrations, venue management, and liaison between department captains and the executive committee.',
    department: 'Executive Leadership',
    tags: ['Operations Management', 'Captain Relations', 'Venue Planning']
  },
  'Ankit Kumar Singh': {
    description: 'Technical Head leading full-stack engineering of the APEX platform, live scoreboards, match telemetry, and system reliability.',
    department: 'Technical & Platform Operations',
    tags: ['Full Stack Architecture', 'Real-Time Telemetry', 'Platform UX']
  },
  'Aditya Singh': {
    description: 'Secretary overseeing official tournament documentation, match minutes, score validations, and formal announcements.',
    department: 'Secretariat & Governance',
    tags: ['Tournament Records', 'Rule Validation', 'Official Communications']
  },
  'Shubham Tiwari': {
    description: 'Treasurer managing tournament budgeting, equipment procurement, sponsorship allocations, and fiscal transparency.',
    department: 'Finance & Accounts',
    tags: ['Budget Allocation', 'Equipment Procurement', 'Financial Audit']
  },
  'Gunjan Gupta': {
    description: 'Chief Coordinator directing volunteers, court marshals, match schedules, and on-ground athlete assistance.',
    department: 'Field Coordination',
    tags: ['Ground Operations', 'Volunteer Management', 'Match Flow']
  },
  'Vishesh Panday': {
    description: 'PR Head commanding press relations, social media broadcasts, tournament photography, and media engagement.',
    department: 'Media & Public Relations',
    tags: ['Media Outreach', 'Social Broadcasts', 'Public Engagement']
  },
  'Divya Singh': {
    description: 'Frontend Developer crafting responsive user experiences, interactive sports leaderboards, and accessible mobile layouts.',
    department: 'Software Engineering',
    tags: ['UI/UX Development', 'Responsive Design', 'Frontend State']
  },
  'Ritik Kumar Singh': {
    description: 'Backend Developer designing microservices, secure authentication, real-time WebSocket feeds, and database endpoints.',
    department: 'Software Engineering',
    tags: ['API Architecture', 'Real-Time WebSockets', 'Database Optimization']
  },
  'Harshit Singh': {
    description: 'Database Engineer designing schemas, query optimization, high-availability storage, and data security.',
    department: 'Software Engineering',
    tags: ['Schema Design', 'Data Security', 'Performance Tuning']
  }
};

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Open Journey by default when About Us is clicked
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'team' ? 'team' : 'journey');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [sessions, setSessions] = useState(() => committeeApi.getCachedData());
  const [activeMilestoneId, setActiveMilestoneId] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const lastActiveRef = useRef(1);

  // Close profile modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedMember(null);
    };
    if (selectedMember) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedMember]);

  const handleMemberClick = (member, fallbackBadge = '', { hideMeta = false } = {}) => {
    const details = MEMBER_DESCRIPTIONS[member.name] || {};
    setSelectedMember({
      name: member.name,
      role: member.role,
      designation: member.designation || '',
      image: member.image,
      badgeColorClass: member.badgeColor || member.badgeColorClass || fallbackBadge || 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-400/40',
      linkedin: member.linkedin,
      description: member.description || member.bio || details.description || 'Distinguished leader and mentor dedicated to upholding sports excellence and collegiate competition across APEX championships.',
      department: hideMeta ? null : (member.department || details.department || 'APEX Tournament Council'),
      tags: hideMeta ? [] : (member.tags || details.tags || ['Sports Excellence', 'Collegiate Athletic Team'])
    });
  };

  const scrollToMilestone = (id) => {
    setActiveMilestoneId(id);
    const element = document.getElementById(`milestone-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (activeTab !== 'journey') return;

    const handleScroll = () => {
      const milestoneElements = JOURNEY_MILESTONES.map((m) =>
        document.getElementById(`milestone-${m.id}`)
      );

      const viewportCenter = window.innerHeight / 2;
      let closestId = 1;
      let closestDistance = Infinity;

      milestoneElements.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const distance = Math.abs(elementCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = JOURNEY_MILESTONES[idx].id;
        }
      });

      if (closestId !== lastActiveRef.current) {
        lastActiveRef.current = closestId;
        setActiveMilestoneId(closestId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  useEffect(() => {
    const load = () => {
      committeeApi.getCommitteeData().then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSessions(data);
        }
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

  const developersData = [
    {
      name: 'Praveen Rai',
      role: 'Team Lead',
      image: '/team/praveen.jpg',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      linkedin: 'https://linkedin.com/in/praveen-rai-409400280'
    },
    {
      name: 'Ankit Kumar Singh',
      role: 'Frontend Developer',
      image: '/team/ankit.jpg',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      linkedin: 'https://linkedin.com/in/ankit-kumar-singh-a7433b328'
    },
    {
      name: 'Divya Singh',
      role: 'Frontend Developer',
      image: '/team/divya.jpg',
      badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30',
      linkedin: 'https://www.linkedin.com/in/divya-singh0210'
    },
    {
      name: 'Ritik Kumar Singh',
      role: 'Backend Developer',
      image: '/team/ritik.jpg',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      linkedin: 'https://linkedin.com/in/ritik-kumar-singh-1784a328a'
    },
    {
      name: 'Harshit Singh',
      role: 'Database Engineer',
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
    if (s.id) committeeYears[s.id] = s;
  });

  const activeSession = sessions.find((s) => s.isActive) || sessions[0] || null;
  const selectedSession = committeeYears[selectedYear] || activeSession;

  // Faculty Advisors from active session
  const rawAdvisors = activeSession?.advisors || [];
  const advisors = [...rawAdvisors].sort((a, b) => {
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return Number(a.sortOrder) - Number(b.sortOrder);
    }
    return 0;
  });

  const rawTeam = (
    (selectedSession?.executiveCommittee && selectedSession.executiveCommittee.length > 0)
      ? selectedSession.executiveCommittee
      : (activeSession?.executiveCommittee && activeSession.executiveCommittee.length > 0)
        ? activeSession.executiveCommittee
        : DEFAULT_EXEC_COMMITTEE
  );
  const currentTeam = [...rawTeam].sort((a, b) => {
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return Number(a.sortOrder) - Number(b.sortOrder);
    }
    return 0;
  }).map((m) => ({
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
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* ── Top Toggle Buttons (Symbols only on mobile, Symbol + text on desktop) ── */}
      <div className="absolute top-2 right-2 sm:right-4 lg:right-6 z-30 flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={() => {
            setActiveTab('journey');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="APEX Journey"
          title="APEX Journey"
          className={`flex items-center justify-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'journey'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/40 font-black scale-[1.02]'
              : 'bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-white/10'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
          <span className="hidden sm:inline">APEX Journey</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('team');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Team Members"
          title="Team Members"
          className={`flex items-center justify-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40 font-black scale-[1.02]'
              : 'bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-white/10'
          }`}
        >
          <Users className="w-3 h-3 text-indigo-200 shrink-0" />
          <span className="hidden sm:inline">Team Members</span>
        </button>
      </div>

      {/* ── TAB 1: APEX JOURNEY TIMELINE (DEFAULT) ── */}
      {activeTab === 'journey' ? (
        <div className="relative spatial-nebula-responsive min-h-[calc(100vh-80px)] overflow-x-hidden">
          {/* Subtle Film Grain Noise Texture */}
          <div 
            aria-hidden="true" 
            className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20"
          />

          <main className="relative z-10">
            <JourneyMilestonesOverlay
              milestones={JOURNEY_MILESTONES}
              activeMilestoneId={activeMilestoneId}
              onSelectMilestone={scrollToMilestone}
              onSwitchToTeam={() => {
                setActiveTab('team');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </main>

          {/* Desktop Right Rail & Mobile Bottom Floating Progress Pill */}
          <JourneyTimelineRail
            milestones={JOURNEY_MILESTONES}
            activeMilestoneId={activeMilestoneId}
            onSelectMilestone={scrollToMilestone}
          />
        </div>
      ) : (
        /* ── TAB 2: TEAM MEMBERS (FACULTY, DEVELOPERS, COMMITTEE) ── */
        <div className="relative spatial-nebula-responsive min-h-[calc(100vh-80px)] overflow-x-hidden">
          {/* Grain texture overlay */}
          <div aria-hidden="true" className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-10 dark:opacity-20" />

          <div className="relative z-10 max-w-7xl mx-auto px-2.5 xs:px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">

            {/* ─── FACULTY ADVISORS ──────────────────────────────────── */}
            <section>
              {/* Glass Section Header */}
              <div className="mb-8 p-5 sm:p-7 rounded-2xl backdrop-blur-md
                bg-white/70 dark:bg-white/5
                border border-slate-200 dark:border-white/10
                shadow-lg dark:shadow-[0_8px_40px_rgba(99,102,241,0.12)]">
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
                  <GraduationCap className="w-4 h-4" />
                  Academic Mentors
                </div>
                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-black tracking-wide uppercase text-slate-900 dark:text-white">
                  Faculty Advisors
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-sans-clean">
                  Distinguished faculty members guiding APEX sports tournament operations and leadership.
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 xs:gap-3 sm:gap-6">
                {advisors.map((advisor, index) => (
                  <TeamCard
                    key={advisor.id || index}
                    name={advisor.name}
                    role={advisor.role}
                    designation={advisor.designation}
                    image={advisor.image}
                    badgeColorClass="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-400/40"
                    hoverGlowClass="hover:border-indigo-400/60 dark:hover:border-indigo-500/50 hover:shadow-indigo-200 dark:hover:shadow-indigo-950/40"
                    onClick={() => handleMemberClick(advisor, "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-400/40", { hideMeta: true })}
                  />
                ))}
              </div>
            </section>

            {/* ─── DEVELOPERS ────────────────────────────────────────── */}
            <section>
              <div className="mb-8 p-5 sm:p-7 rounded-2xl backdrop-blur-md
                bg-white/70 dark:bg-white/5
                border border-slate-200 dark:border-white/10
                shadow-lg dark:shadow-[0_8px_40px_rgba(6,182,212,0.10)]">
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1.5">
                  <Code className="w-4 h-4" />
                  Platform Engineers
                </div>
                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-black tracking-wide uppercase text-slate-900 dark:text-white">
                  Developers
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-sans-clean">
                  The technical team behind building and designing the APEX Sports Management System.
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 xs:gap-3 sm:gap-6">
                {developersData.map((dev, index) => (
                  <TeamCard
                    key={index}
                    name={dev.name}
                    role={dev.role}
                    image={dev.image}
                    badgeColorClass={dev.badgeColor}
                    hoverGlowClass="hover:border-cyan-400/60 dark:hover:border-cyan-500/50 hover:shadow-cyan-200 dark:hover:shadow-cyan-950/40"
                    linkedin={dev.linkedin}
                    onClick={() => handleMemberClick(dev, dev.badgeColor)}
                  />
                ))}
              </div>
            </section>

            {/* ─── EXECUTIVE COMMITTEE ───────────────────────────────── */}
            <section>
              <div className="mb-8 p-5 sm:p-7 rounded-2xl backdrop-blur-md
                bg-white/70 dark:bg-white/5
                border border-slate-200 dark:border-white/10
                shadow-lg dark:shadow-[0_8px_40px_rgba(16,185,129,0.08)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Leadership &amp; Governance
                    </div>
                    <h2 className="font-serif-luxury text-2xl sm:text-3xl font-black tracking-wide uppercase text-slate-900 dark:text-white">
                      {isUpcoming ? `Executive Committee (${upcomingLabel})` : `Executive Committee ${upcomingLabel}`}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-sans-clean">
                      Select a tournament year to view the office bearers and core coordinators.
                    </p>
                  </div>

                  {/* Year Selector */}
                  <div className="flex items-center gap-3 bg-slate-100/80 dark:bg-white/5 p-1.5 sm:p-2 rounded-2xl border border-slate-200 dark:border-white/10 shrink-0 self-start md:self-auto backdrop-blur-sm">
                    <label className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-2">
                      Year:
                    </label>
                    <div className="relative">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="appearance-none bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md cursor-pointer transition-all"
                      >
                        {yearOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                            {opt.label}{opt.isUpcoming ? ' (Upcoming)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white absolute right-2.5 sm:right-3 top-3 sm:top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {isUpcoming ? (
                <div className="py-12 sm:py-16 px-4 sm:px-6 text-center rounded-3xl border border-dashed
                  border-purple-400/40 dark:border-purple-500/30
                  bg-white/60 dark:bg-purple-950/10
                  backdrop-blur-sm space-y-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    🚀 Upcoming Edition
                  </span>
                  <h3 className="font-serif-luxury text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white">
                    APEX {upcomingLabel} Executive Committee
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Official committee appointments and office bearer announcements for the {upcomingLabel} edition will be revealed closer to the tournament opening ceremony.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 xs:gap-3 sm:gap-6">
                  {currentTeam.map((member, index) => (
                    <TeamCard
                      key={index}
                      name={member.name}
                      role={member.role}
                      image={member.image}
                      badgeColorClass={member.badgeColor}
                      hoverGlowClass=""
                      disableClick
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ─── LUXURY SPORTS PHILOSOPHY STATEMENT ────────────────────────────────────────── */}
            <div className="relative mt-12 sm:mt-16 py-12 px-6 sm:px-12 text-center rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#080c1b]/70 backdrop-blur-xl shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Subtle ambient background glow */}
              <div 
                aria-hidden="true" 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-3xl pointer-events-none"
              />

              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                {/* Accent Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-300/60 dark:border-purple-500/30 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>The APEX Spirit</span>
                </div>

                {/* Luxury Heading */}
                <h3 className="font-serif-luxury text-2xl sm:text-4xl font-black tracking-wide text-slate-900 dark:text-white uppercase leading-tight">
                  We Are Here To Make Sports Legendary
                </h3>

                {/* Expressive Editorial Description */}
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300/90 font-sans-clean leading-relaxed italic">
                  &ldquo;We are here to ignite athletic passion, foster unyielding sportsmanship, and build an enduring sporting sanctuary across our campuses. Through every hard-fought match, every united cheer, and every champion crowned, APEX is dedicated to celebrating the authentic soul of collegiate sports.&rdquo;
                </p>

                {/* Values Pillar Row */}
                <div className="pt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono tracking-wider text-amber-600 dark:text-amber-400 uppercase font-semibold">
                  <span>Passion</span>
                  <span className="text-purple-400">•</span>
                  <span>Integrity</span>
                  <span className="text-purple-400">•</span>
                  <span>Resilience</span>
                  <span className="text-purple-400">•</span>
                  <span>Collegiate Excellence</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Member Detail Modal on Photo/Card Click ── */}
      <MemberDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />

    </div>
  );
};

/**
 * Journey-style Team Member Card — Light & Dark Mode
 * Polaroid photo frame, glowing role badge, name plate, click to open profile modal.
 */
const TeamCard = ({ name, role, designation, image, badgeColorClass = '', hoverGlowClass = '', linkedin, onClick, disableClick = false }) => {
  return (
    <div
      onClick={disableClick ? undefined : onClick}
      className={`group relative rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg
        bg-white/80 dark:bg-gradient-to-b dark:from-[#090e1c] dark:to-[#040712]
        border-slate-200 dark:border-white/10
        ${disableClick ? '' : `cursor-pointer hover:scale-[1.03] hover:shadow-2xl ${hoverGlowClass}`}`}
      title={disableClick ? name : `Click to view profile of ${name}`}
    >
      {/* Photo Frame (Polaroid Style) */}
      <div className="p-1 sm:p-2 bg-white m-1.5 sm:m-3 rounded-lg sm:rounded-xl shadow-md overflow-hidden relative">
        <div className="relative aspect-[3/3.5] overflow-hidden rounded-md sm:rounded-lg bg-slate-200 dark:bg-slate-800">
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
          {/* Hover Eye — only when clickable */}
          {!disableClick && (
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="p-1 sm:p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-purple-600 dark:text-purple-300 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Name Plate */}
      <div className="px-1 xs:px-1.5 sm:px-3 pb-2 sm:pb-4 text-center flex flex-col items-center gap-0.5 sm:gap-1.5">
        <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[7.5px] xs:text-[8px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider border leading-tight line-clamp-1 max-w-full truncate ${badgeColorClass}`}>
          {role}
        </span>
        <h3 className={`text-[10px] xs:text-[11px] sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight sm:leading-snug line-clamp-2 text-center transition-colors ${disableClick ? '' : 'group-hover:text-purple-600 dark:group-hover:text-purple-400'}`}>
          {name}
        </h3>
        {designation && (
          <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 px-0.5">
            {designation}
          </p>
        )}
        {linkedin && (
          <a
            href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] xs:text-[9px] sm:text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition"
          >
            <LinkedinIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0" />
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
};

/**
 * Interactive Member Profile Modal — Light & Dark Mode
 * Shows high-res photo, full name, role badge, department, description, focus tags, and LinkedIn.
 */
const MemberDetailModal = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0c1022]/95 backdrop-blur-2xl shadow-2xl dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glows */}
        <div 
          aria-hidden="true" 
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-500/15 dark:bg-purple-600/20 blur-3xl pointer-events-none"
        />
        <div 
          aria-hidden="true" 
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/15 dark:bg-indigo-600/20 blur-3xl pointer-events-none"
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-sm"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-5 relative z-10">
          
          {/* Header Section with Photo */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            {/* White Polaroid Photo Frame */}
            <div className="p-2 bg-white rounded-2xl shadow-xl shrink-0">
              <div className="w-28 h-32 sm:w-32 sm:h-36 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="flex-1 space-y-2 min-w-0">
              <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border leading-tight ${member.badgeColorClass || 'bg-purple-500/10 text-purple-600 border-purple-500/30'}`}>
                {member.role}
              </span>
              
              <h2 className="font-serif-luxury text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase leading-snug">
                {member.name}
              </h2>

              {member.designation && (
                <p className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {member.designation}
                </p>
              )}

              {member.department && (
                <p className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                  {member.department}
                </p>
              )}

              {member.linkedin && (
                <div className="pt-1">
                  <a
                    href={member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900/40 transition-colors"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>LinkedIn Profile</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Description / Bio */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
              About &amp; Responsibilities
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic font-sans-clean">
              &ldquo;{member.description}&rdquo;
            </div>
          </div>

          {/* Focus Tags */}
          {member.tags && member.tags.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                Focus Areas &amp; Contributions
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {member.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Close Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-md active:scale-95"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
