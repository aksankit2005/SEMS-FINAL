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

  const handleMemberClick = (member, fallbackBadge = '', { hideMeta = false, isAdvisor = false } = {}) => {
    const details = MEMBER_DESCRIPTIONS[member.name] || {};
    setSelectedMember({
      name: member.name,
      role: member.role,
      designation: member.designation || '',
      image: member.image,
      badgeColorClass: member.badgeColor || member.badgeColorClass || fallbackBadge || 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]',
      linkedin: member.linkedin,
      description: member.description || member.bio || details.description || 'Distinguished leader and mentor dedicated to upholding sports excellence and collegiate competition across APEX championships.',
      department: (hideMeta || isAdvisor) ? null : (member.department || details.department || 'APEX Tournament Council'),
      tags: (hideMeta || isAdvisor) ? [] : (member.tags || details.tags || [])
    });
  };

  const scrollToMilestone = (id) => {
    setActiveMilestoneId(id);
    lastActiveRef.current = id;
    const el = document.getElementById(`milestone-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Scroll observer to update active milestone
  useEffect(() => {
    if (activeTab !== 'journey') return;

    let timeoutId = null;
    const handleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        const viewportCenter = window.innerHeight / 2;
        let closestId = lastActiveRef.current;
        let minDistance = Infinity;

        JOURNEY_MILESTONES.forEach((m) => {
          const el = document.getElementById(`milestone-${m.id}`);
          if (el) {
            const rect = el.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            const distance = Math.abs(viewportCenter - elementCenter);
            if (distance < minDistance) {
              minDistance = distance;
              closestId = m.id;
            }
          }
        });

        if (closestId !== lastActiveRef.current) {
          lastActiveRef.current = closestId;
          setActiveMilestoneId(closestId);
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeTab]);

  useEffect(() => {
    const load = () => {
      committeeApi.getCommitteeData().then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSessions(data);
        }
      }).catch((err) => {
        console.warn('Could not fetch committee data in AboutPage:', err?.message || err);
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
      badgeColor: 'bg-[#F4F2F7] dark:bg-[#121625] text-[#596B98] dark:text-[#818CF8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]',
      linkedin: 'https://linkedin.com/in/praveen-rai-409400280'
    },
    {
      name: 'Ankit Kumar Singh',
      role: 'Frontend Developer',
      image: '/team/ankit.jpg',
      badgeColor: 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]',
      linkedin: 'https://linkedin.com/in/ankit-kumar-singh-a7433b328'
    },
    {
      name: 'Divya Singh',
      role: 'Frontend Developer',
      image: '/team/divya.jpg',
      badgeColor: 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]',
      linkedin: 'https://www.linkedin.com/in/divya-singh0210'
    },
    {
      name: 'Ritik Kumar Singh',
      role: 'Backend Developer',
      image: '/team/ritik.jpg',
      badgeColor: 'bg-[#F4F2F7] dark:bg-[#121625] text-[#596B98] dark:text-[#818CF8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]',
      linkedin: 'https://linkedin.com/in/ritik-kumar-singh-1784a328a'
    },
    {
      name: 'Harshit Singh',
      role: 'Database Engineer',
      image: '/team/harshit.jpg',
      badgeColor: 'bg-[#F4F2F7] dark:bg-[#121625] text-[#596B98] dark:text-[#818CF8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]',
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
    badgeColor: 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]'
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
    <div className="relative min-h-screen bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] transition-colors duration-200 font-spatial-sans">
      
      {/* ── Top Toggle Buttons (Symbols only on mobile, Symbol + text on desktop) ── */}
      <div className="absolute top-2 right-2 sm:right-4 lg:right-6 z-30 flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={() => {
            setActiveTab('journey');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="APEX Journey"
          title="APEX Journey"
          className={`flex items-center justify-center gap-1 p-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
            activeTab === 'journey'
              ? 'bg-[#7156A5] text-white shadow-2xs font-bold'
              : 'bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-white border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45] shrink-0" />
          <span className="hidden sm:inline">APEX Journey</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('team');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Team Members"
          title="Team Members"
          className={`flex items-center justify-center gap-1 p-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
            activeTab === 'team'
              ? 'bg-[#7156A5] text-white shadow-2xs font-bold'
              : 'bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-white border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />
          <span className="hidden sm:inline">Team Members</span>
        </button>
      </div>

      {/* ── TAB 1: APEX JOURNEY TIMELINE (DEFAULT) ── */}
      {activeTab === 'journey' ? (
        <div className="relative min-h-[calc(100vh-80px)] overflow-x-hidden">
          {/* Dark mode atmospheric overlays */}
          <div 
            aria-hidden="true" 
            className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60 hidden dark:block"
          />
          <div 
            aria-hidden="true" 
            className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 hidden dark:block"
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
        <div className="relative min-h-[calc(100vh-80px)] overflow-x-hidden">
          {/* Dark mode atmospheric overlays */}
          <div 
            aria-hidden="true" 
            className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60 hidden dark:block"
          />
          <div 
            aria-hidden="true" 
            className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 hidden dark:block" 
          />

          <div className="relative z-10 max-w-7xl mx-auto px-2.5 xs:px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-8 sm:space-y-12">

            {/* Editorial Header Banner */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                <Users className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
                <span>Executive Committee & Mentors</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
                Meet The <span className="text-[#7156A5] dark:text-[#B8A5E5]">Team</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] leading-relaxed">
                The visionary leadership, academic mentors, student council, and platform developers powering APEX.
              </p>
            </div>

            {/* ─── FACULTY ADVISORS ──────────────────────────────────── */}
            <section>
              {/* Glass Section Header */}
              <div className="mb-8 p-5 sm:p-7 rounded-xl bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs">
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-[#596B98] dark:text-[#818CF8] uppercase tracking-widest mb-1.5">
                  <GraduationCap className="w-4 h-4" />
                  Academic Mentors
                </div>
                <h2 className="font-spatial-display text-2xl sm:text-3xl font-bold tracking-tight uppercase text-[#211D2B] dark:text-[#F5F2FA]">
                  Faculty Advisors
                </h2>
                <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-1.5">
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
                    badgeColorClass="bg-[#F4F2F7] dark:bg-[#121625] text-[#596B98] dark:text-[#818CF8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]"
                    hoverGlowClass="hover:border-[#596B98]/60"
                    onClick={() => handleMemberClick(advisor, "bg-[#F4F2F7] dark:bg-[#121625] text-[#596B98] dark:text-[#818CF8] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]", { hideMeta: true, isAdvisor: true })}
                  />
                ))}
              </div>
            </section>

            {/* ─── DEVELOPERS ────────────────────────────────────────── */}
            <section>
              <div className="mb-8 p-5 sm:p-7 rounded-xl bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs">
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-[#7156A5] dark:text-[#B8A5E5] uppercase tracking-widest mb-1.5">
                  <Code className="w-4 h-4" />
                  Platform Engineers
                </div>
                <h2 className="font-spatial-display text-2xl sm:text-3xl font-bold tracking-tight uppercase text-[#211D2B] dark:text-[#F5F2FA]">
                  Developers
                </h2>
                <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-1.5">
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
                    hoverGlowClass="hover:border-[#7156A5]/50"
                    linkedin={dev.linkedin}
                    onClick={() => handleMemberClick(dev, dev.badgeColor)}
                  />
                ))}
              </div>
            </section>

            {/* ─── EXECUTIVE COMMITTEE ───────────────────────────────── */}
            <section>
              <div className="mb-8 p-5 sm:p-7 rounded-xl bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-[#596B98] dark:text-[#818CF8] uppercase tracking-widest mb-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Leadership &amp; Governance
                    </div>
                    <h2 className="font-spatial-display text-2xl sm:text-3xl font-bold tracking-tight uppercase text-[#211D2B] dark:text-[#F5F2FA]">
                      {isUpcoming ? `Executive Committee (${upcomingLabel})` : `Executive Committee ${upcomingLabel}`}
                    </h2>
                    <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-1.5">
                      Select a tournament year to view the office bearers and core coordinators.
                    </p>
                  </div>

                  {/* Year Selector */}
                  <div className="flex items-center gap-3 bg-[#FAF9F6] dark:bg-[#121625] p-1.5 sm:p-2 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] shrink-0 self-start md:self-auto">
                    <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] pl-2">
                      Year:
                    </label>
                    <div className="relative">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="appearance-none bg-[#7156A5] hover:bg-[#5E458B] text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 pr-8 sm:pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7156A5]/50 shadow-2xs cursor-pointer transition-all"
                      >
                        {yearOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                            {opt.label}{opt.isUpcoming ? ' (Upcoming)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white absolute right-2.5 sm:right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {isUpcoming ? (
                <div className="py-12 sm:py-16 px-4 sm:px-6 text-center rounded-xl border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] bg-white dark:bg-[#0D101A] space-y-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-xl bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] flex items-center justify-center border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]">
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse text-[#A98B57] dark:text-[#D2AB45]" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)]">
                    Upcoming Edition
                  </span>
                  <h3 className="font-spatial-display text-xl sm:text-2xl font-bold uppercase text-[#211D2B] dark:text-[#F5F2FA]">
                    APEX {upcomingLabel} Executive Committee
                  </h3>
                  <p className="text-xs text-[#686370] dark:text-[#AAA4B8] max-w-md mx-auto leading-relaxed">
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
            <div className="relative mt-12 sm:mt-16 py-12 px-6 sm:px-12 text-center rounded-xl border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] bg-white dark:bg-[#0D101A] shadow-2xs overflow-hidden">
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                {/* Accent Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-mono font-semibold tracking-wider uppercase bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
                  <span>The APEX Spirit</span>
                </div>

                {/* Luxury Heading */}
                <h3 className="font-spatial-display text-2xl sm:text-4xl font-normal tracking-tight text-[#211D2B] dark:text-[#F5F2FA] uppercase leading-tight">
                  We Are Here To Make Sports Legendary
                </h3>

                {/* Expressive Editorial Description */}
                <p className="text-sm sm:text-base text-[#211D2B] dark:text-[#F5F2FA] leading-relaxed italic">
                  &ldquo;We are here to ignite athletic passion, foster unyielding sportsmanship, and build an enduring sporting sanctuary across our campuses. Through every hard-fought match, every united cheer, and every champion crowned, APEX is dedicated to celebrating the authentic soul of collegiate sports.&rdquo;
                </p>

                {/* Values Pillar Row */}
                <div className="pt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono tracking-wider text-[#A98B57] dark:text-[#D2AB45] uppercase font-semibold">
                  <span>Passion</span>
                  <span className="text-[#686370] dark:text-[#AAA4B8]">•</span>
                  <span>Integrity</span>
                  <span className="text-[#686370] dark:text-[#AAA4B8]">•</span>
                  <span>Resilience</span>
                  <span className="text-[#686370] dark:text-[#AAA4B8]">•</span>
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
 */
const TeamCard = ({ name, role, designation, image, badgeColorClass = '', hoverGlowClass = '', linkedin, onClick, disableClick = false }) => {
  return (
    <div
      onClick={disableClick ? undefined : onClick}
      className={`group relative rounded-xl border transition-all duration-300 overflow-hidden shadow-2xs
        bg-white dark:bg-[#0D101A]
        border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]
        ${disableClick ? '' : `cursor-pointer hover:border-[#7156A5]/40 dark:hover:border-[#8B5CF6]/40 ${hoverGlowClass}`}`}
      title={disableClick ? name : `Click to view profile of ${name}`}
    >
      {/* Photo Frame */}
      <div className="p-1 sm:p-2 bg-white m-1.5 sm:m-3 rounded-lg shadow-2xs overflow-hidden relative border border-[#E5E1E8] dark:border-white/10">
        <div className="relative aspect-[3/3.5] overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
          {/* Hover Eye — only when clickable */}
          {!disableClick && (
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="p-1 sm:p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-[#7156A5] dark:text-[#B8A5E5] shadow-lg scale-90 group-hover:scale-100 transition-transform">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Name Plate */}
      <div className="px-1 xs:px-1.5 sm:px-3 pb-2 sm:pb-4 text-center flex flex-col items-center gap-0.5 sm:gap-1.5">
        <span className={`px-1.5 sm:px-2.5 py-0.5 rounded text-[7.5px] xs:text-[8px] sm:text-[10px] font-semibold uppercase tracking-tight sm:tracking-wider border leading-tight line-clamp-1 max-w-full truncate ${badgeColorClass}`}>
          {role}
        </span>
        <h3 className={`text-[10px] xs:text-[11px] sm:text-sm font-bold text-[#211D2B] dark:text-[#F5F2FA] leading-tight sm:leading-snug line-clamp-2 text-center transition-colors ${disableClick ? '' : 'group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5]'}`}>
          {name}
        </h3>
        {designation && (
          <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-[#686370] dark:text-[#AAA4B8] font-medium line-clamp-1 px-0.5">
            {designation}
          </p>
        )}
        {linkedin && (
          <a
            href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] xs:text-[9px] sm:text-[10px] font-semibold text-[#7156A5] dark:text-[#B8A5E5] hover:underline transition"
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
 */
const MemberDetailModal = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-xl border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] bg-[#FFFFFF] dark:bg-[#0D101A] shadow-2xl overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-lg bg-[#FAF9F6] dark:bg-white/10 hover:bg-[#F4F2F7] dark:hover:bg-white/20 text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-white flex items-center justify-center transition-all cursor-pointer border border-[#E5E1E8] dark:border-white/10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-5 relative z-10 font-spatial-sans">
          
          {/* Header Section with Photo */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            <div className="p-1.5 bg-white rounded-xl shadow-xs shrink-0 border border-[#E5E1E8]">
              <div className="w-28 h-32 sm:w-32 sm:h-36 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="flex-1 space-y-2 min-w-0">
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold uppercase tracking-wider border leading-tight ${member.badgeColorClass || 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]'}`}>
                {member.role}
              </span>
              
              <h2 className="font-spatial-display text-xl sm:text-2xl font-bold text-[#211D2B] dark:text-[#F5F2FA] uppercase leading-snug">
                {member.name}
              </h2>

              {member.designation && (
                <p className="text-xs sm:text-sm font-semibold text-[#596B98] dark:text-[#818CF8]">
                  {member.designation}
                </p>
              )}

              {member.department && (
                <p className="text-xs font-mono font-semibold text-[#7156A5] dark:text-[#B8A5E5] uppercase tracking-wide">
                  {member.department}
                </p>
              )}

              {member.linkedin && (
                <div className="pt-1">
                  <a
                    href={member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] hover:underline text-xs font-semibold border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] transition-colors"
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
            <h4 className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#686370] dark:text-[#AAA4B8] font-semibold">
              About &amp; Responsibilities
            </h4>
            <div className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] text-xs sm:text-sm text-[#211D2B] dark:text-[#F5F2FA] leading-relaxed italic">
              &ldquo;{member.description}&rdquo;
            </div>
          </div>

          {/* Focus Tags */}
          {member.tags && member.tags.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#686370] dark:text-[#AAA4B8] font-semibold">
                Focus Areas &amp; Contributions
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {member.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F4F2F7] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] text-[#7156A5] dark:text-[#B8A5E5]"
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
              className="px-5 py-2 rounded-lg bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
