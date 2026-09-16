import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Crown, Search, Sparkles, X, Medal, ChevronRight, Layers, Users, Filter } from 'lucide-react';
import { ALL_COLLEGES } from '../services/superCoordinatorApi';
import { apiUrl } from '../services/apiConfig';
import { useSportsData } from '../context/SportsDataContext';
import { useTheme } from '../context/ThemeContext';
import { StudentMedalCard } from '../components/leaderboard/StudentMedalCard';
import { CollegeMedalsModal } from '../components/leaderboard/CollegeMedalsModal';
import { getFlattenedMedalists } from '../data/mockLeaderboardMedals';
import '../styles/spatialGallery.css';

// Build college standings from Super Coordinator awarded points in localStorage
const computeStandings = () => {
  let entries = [];
  try {
    const stored = localStorage.getItem('sems_super_coord_leaderboard');
    if (stored) entries = JSON.parse(stored);
  } catch (e) { }

  // Tally gold and silver per college
  const tally = {};
  entries.forEach((entry) => {
    const winner = entry.winnerCollege;
    const runnerUp = entry.runnerUpCollege;
    if (winner) {
      if (!tally[winner]) tally[winner] = { gold: 0, silver: 0 };
      tally[winner].gold += 1;
    }
    if (runnerUp) {
      if (!tally[runnerUp]) tally[runnerUp] = { gold: 0, silver: 0 };
      tally[runnerUp].silver += 1;
    }
  });

  // Include ALL colleges — those without points get 0s
  const standings = ALL_COLLEGES
    .filter((c) => String(c.id || '').toUpperCase() !== 'EXTERNAL') // exclude external/guest colleges from table
    .map((college) => {
      const counts = tally[college.id] || { gold: 0, silver: 0 };
      return {
        id: String(college.id || ''),
        college: String(college.name || college.id || ''),
        code: String(college.id || ''),
        gold: Number(counts.gold || 0),
        silver: Number(counts.silver || 0),
        totalPoints: Number((counts.gold || 0) * 5 + (counts.silver || 0) * 3),
      };
    });

  // Sort: points desc → gold desc → silver desc → name asc
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    return String(a.college || '').localeCompare(String(b.college || ''));
  });

  return standings;
};

export const LeaderboardPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('standings'); // 'standings' | 'showcase'
  const [selectedCollegeModal, setSelectedCollegeModal] = useState(null);

  // Standings table search
  const [query, setQuery] = useState('');
  const { leaderboard } = useSportsData();

  // Showcase filters
  const [showcaseCollegeFilter, setShowcaseCollegeFilter] = useState('ALL');
  const [showcaseSportFilter, setShowcaseSportFilter] = useState('ALL');
  const [showcaseMedalFilter, setShowcaseMedalFilter] = useState('ALL'); // 'ALL' | 'GOLD' | 'SILVER'
  const [showcaseSearch, setShowcaseSearch] = useState('');

  const [medalsVersion, setMedalsVersion] = useState(0);

  const normalizeStandings = (data) => {
    if (!Array.isArray(data)) return [];
    return data
      .filter((c) => String(c.code || c.id || '').toUpperCase() !== 'EXTERNAL')
      .map((item) => ({
        id: String(item.id || item.code || item.college || ''),
        code: String(item.code || item.id || ''),
        college: String(item.college || item.name || item.code || 'College'),
        gold: Number(item.gold ?? item.wins ?? item.goldCount ?? item.firsts ?? 0),
        silver: Number(item.silver ?? item.runnerUps ?? item.silverCount ?? item.seconds ?? 0),
        totalPoints: Number(item.totalPoints ?? item.points ?? 0),
        rank: Number(item.rank || 0),
      }));
  };

  const [standings, setStandings] = useState(() => (Array.isArray(leaderboard) && leaderboard.length > 0 ? normalizeStandings(leaderboard) : []));

  useEffect(() => {
    if (Array.isArray(leaderboard) && leaderboard.length > 0) {
      setStandings(normalizeStandings(leaderboard));
    }
  }, [leaderboard]);

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch(apiUrl('/leaderboard'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setStandings(normalizeStandings(data));
            return;
          }
        }
      } catch (e) { }

      if (leaderboard && leaderboard.length > 0) {
        setStandings(normalizeStandings(leaderboard));
        return;
      }

      setStandings(normalizeStandings(computeStandings()));
    };

    if (!leaderboard || leaderboard.length === 0) {
      refresh();
    }

    const handler = () => {
      refresh();
      setMedalsVersion((v) => v + 1);
    };
    window.addEventListener('sems_leaderboard_updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('sems_leaderboard_updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, [leaderboard]);

  const filteredStandings = standings.filter((item) => {
    const colName = String(item.college || item.name || '').toLowerCase();
    const colCode = String(item.code || item.id || '').toLowerCase();
    const q = String(query || '').toLowerCase();
    return colName.includes(q) || colCode.includes(q);
  });

  const top3 = standings.slice(0, 3);
  const hasData = standings.length > 0;

  // All student medalists (reactive to medalsVersion)
  const allMedalists = useMemo(() => getFlattenedMedalists(), [medalsVersion]);

  // Distinct sports from medalists
  const distinctSports = useMemo(() => {
    const map = new Map();
    allMedalists.forEach((m) => {
      const key = m.sportName || m.sportId;
      if (!map.has(key)) {
        map.set(key, { name: key, icon: m.sportIcon || '🏆', id: m.sportId });
      }
    });
    return Array.from(map.values());
  }, [allMedalists]);

  // Distinct colleges from medalists
  const distinctColleges = useMemo(() => {
    const set = new Set();
    allMedalists.forEach((m) => {
      if (m.collegeCode) set.add(m.collegeCode);
    });
    return Array.from(set).sort();
  }, [allMedalists]);

  // Filtered medalists for showcase tab
  const filteredMedalists = useMemo(() => {
    return allMedalists.filter((m) => {
      if (showcaseCollegeFilter !== 'ALL' && m.collegeCode !== showcaseCollegeFilter) {
        return false;
      }
      if (showcaseSportFilter !== 'ALL' && (m.sportName || m.sportId) !== showcaseSportFilter) {
        return false;
      }
      if (showcaseMedalFilter === 'GOLD' && m.medal !== 'GOLD') return false;
      if (showcaseMedalFilter === 'SILVER' && m.medal !== 'SILVER') return false;

      if (showcaseSearch.trim()) {
        const q = showcaseSearch.toLowerCase().trim();
        const student = (m.studentName || '').toLowerCase();
        const team = (m.teamName || '').toLowerCase();
        const college = (m.collegeCode || '').toLowerCase();
        const roll = (m.rollNo || '').toLowerCase();
        const course = (m.course || '').toLowerCase();
        const sport = (m.sportName || '').toLowerCase();
        const sub = (m.subEvent || '').toLowerCase();
        if (!student.includes(q) && !team.includes(q) && !college.includes(q) && !roll.includes(q) && !course.includes(q) && !sport.includes(q) && !sub.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allMedalists, showcaseCollegeFilter, showcaseSportFilter, showcaseMedalFilter, showcaseSearch]);

  const handleOpenCollegeModal = (collegeObj, rankNumber = null) => {
    setSelectedCollegeModal({
      ...collegeObj,
      rankNumber: rankNumber || collegeObj.rank || null
    });
  };

  return (
    <div className={`relative min-h-screen font-spatial-sans selection:bg-[#7156A5]/20 selection:text-[#211D2B] dark:selection:text-white overflow-x-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070A13] text-[#F5F2FA]' : 'bg-[#FAF9F6] text-[#211D2B]'
    }`}>
      {/* Atmospheric overlays preserved for dark mode */}
      {isDark && (
        <>
          <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60" />
          <div className="fixed inset-0 spatial-grain-overlay z-[1] pointer-events-none opacity-20" />
        </>
      )}

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-6">

        {/* Editorial Header Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
            <Trophy className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
            <span>Official Tournament Standings & Medals</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
            APEX <span className="text-[#7156A5] dark:text-[#B8A5E5]">Leaderboard</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] leading-relaxed">
            Live inter-college medal tallies and student champion cards across all sports. 🥇 Winner = 5 pts • 🥈 Runner-Up = 3 pts
          </p>
        </div>

        {/* ─── VIEW MODE TOGGLE ─── */}
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-xl p-1 bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-xs">
            <button
              onClick={() => setActiveTab('standings')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-spatial-display font-semibold transition-all duration-200 ${
                activeTab === 'standings'
                  ? 'bg-[#7156A5] text-white shadow-sm'
                  : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>College Standings</span>
            </button>

            <button
              onClick={() => setActiveTab('showcase')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-spatial-display font-semibold transition-all duration-200 ${
                activeTab === 'showcase'
                  ? 'bg-[#7156A5] text-white shadow-sm'
                  : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Champions & Medalists Showcase</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-white/10 font-bold">
                {allMedalists.length}
              </span>
            </button>
          </div>
        </div>

        {/* ════════════════ TAB 1: COLLEGE STANDINGS & PODIUM ════════════════ */}
        {activeTab === 'standings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* ─── TOP 3 PODIUM OR EMPTY STATE ─── */}
            {!hasData ? (
              <div className="text-center py-16 rounded-2xl border p-8 max-w-lg mx-auto transition-all bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs">
                <Trophy className="w-12 h-12 text-[#686370] dark:text-[#AAA4B8] mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold font-spatial-display uppercase tracking-wide text-[#211D2B] dark:text-[#F5F2FA]">
                  No Leaderboard Standings Yet
                </h3>
                <p className="text-xs font-mono mt-1 text-[#686370] dark:text-[#AAA4B8]">
                  Inter-college standings will appear here as the Super Coordinator awards match points.
                </p>
              </div>
            ) : (
              <div className={`grid gap-2 xs:gap-3 sm:gap-4 md:gap-6 items-end pt-2 pb-2 ${
                top3.length === 1 
                  ? 'grid-cols-1 max-w-md mx-auto' 
                  : top3.length === 2 
                    ? 'grid-cols-2 max-w-4xl mx-auto' 
                    : 'grid-cols-3 max-w-7xl mx-auto'
              }`}>

                {/* Silver – Rank 2 Card (Left on all screens, Column 1) */}
                {top3[1] && (
                  <div 
                    onClick={() => handleOpenCollegeModal(top3[1], 2)}
                    className="group rounded-2xl p-3 sm:p-7 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 order-1 bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs cursor-pointer hover:border-slate-400 hover:shadow-md hover:-translate-y-1"
                    title="Click to view college sport medals breakdown"
                  >
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] xs:text-[9px] sm:text-xs font-mono font-bold tracking-wider uppercase mb-1 sm:mb-3 border bg-[#F4F2F7] dark:bg-[#121625] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#686370] dark:text-[#AAA4B8]">
                      <span className="hidden sm:inline">🥈 RANK 2 — SILVER</span>
                      <span className="inline sm:hidden">🥈 #2 SILVER</span>
                    </span>

                    <div className="text-2xl xs:text-3xl sm:text-5xl mb-1 sm:mb-3 filter drop-shadow">🏛️</div>

                    <h3 className="font-spatial-display font-semibold text-xs xs:text-sm sm:text-xl tracking-wide max-w-sm truncate w-full text-[#211D2B] dark:text-[#F5F2FA] group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors">
                      {top3[1].college}
                    </h3>

                    <p className="text-[9px] xs:text-[10px] sm:text-xs font-mono tracking-wider mt-0.5 mb-1 sm:mb-4 text-[#686370] dark:text-[#AAA4B8]">
                      {top3[1].code}
                    </p>

                    {/* Gold / Silver Medals Count */}
                    <div className="w-full max-w-xs p-1.5 sm:p-3 rounded-lg border flex items-center justify-around text-[9px] xs:text-[10px] sm:text-xs font-mono font-bold transition-all bg-[#FAF9F6] dark:bg-[#121625] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] text-[#211D2B] dark:text-[#F5F2FA]">
                      <span className="flex items-center gap-0.5 sm:gap-1.5">
                        <span className="text-[#A98B57] dark:text-[#D2AB45]">🥇</span> {top3[1].gold}<span className="hidden sm:inline"> Gold</span>
                      </span>
                      <span className="text-[#686370] dark:text-[#AAA4B8]">•</span>
                      <span className="flex items-center gap-0.5 sm:gap-1.5">
                        <span className="text-[#686370] dark:text-[#AAA4B8]">🥈</span> {top3[1].silver}<span className="hidden sm:inline"> Silver</span>
                      </span>
                    </div>

                    {/* Total Points */}
                    <div className="mt-2 sm:mt-4 flex flex-col items-center">
                      <span className="text-xl xs:text-2xl sm:text-4xl font-black font-mono tracking-tight text-[#211D2B] dark:text-[#F5F2FA]">
                        {top3[1].totalPoints}
                      </span>
                      <span className="text-[8px] xs:text-[9px] sm:text-[11px] font-mono uppercase tracking-widest font-semibold mt-0.5 text-[#686370] dark:text-[#AAA4B8]">
                        <span className="hidden sm:inline">Championship Points</span>
                        <span className="inline sm:hidden">PTS</span>
                      </span>
                    </div>

                    {/* Click hint pill */}
                    <div className="mt-3 text-[10px] font-mono font-semibold text-[#7156A5] dark:text-[#B8A5E5] flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <span>View Medals</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                )}

                {/* Gold – Rank 1 Champion Card (CENTER on all screens, Column 2, Highlighted & Elevated) */}
                {top3[0] && (
                  <div 
                    onClick={() => handleOpenCollegeModal(top3[0], 1)}
                    className="group rounded-2xl p-3.5 sm:p-8 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 order-2 -translate-y-2 sm:-translate-y-3 scale-[1.02] sm:scale-105 z-20 bg-[#FFFFFF] dark:bg-[#0D101A] border-2 border-[#A98B57]/60 dark:border-[#D2AB45]/60 shadow-md cursor-pointer hover:border-[#D2AB45] hover:shadow-xl"
                    title="Click to view college sport medals breakdown"
                  >
                    {/* Champion Tag */}
                    <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 text-[8px] xs:text-[9px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#A98B57] dark:bg-[#D2AB45] text-white dark:text-[#070A13] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">CHAMPION</span>
                      <span className="inline sm:hidden">#1</span>
                    </div>

                    <div className="relative mb-1 sm:mb-2">
                      <Crown className="w-7 h-7 xs:w-8 xs:h-8 sm:w-12 sm:h-12 text-[#A98B57] dark:text-[#D2AB45] drop-shadow-xs" />
                    </div>

                    <span className="px-2 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase mb-1 sm:mb-3 border bg-[#A98B57]/15 dark:bg-[#D2AB45]/20 border-[#A98B57]/40 dark:border-[#D2AB45]/40 text-[#A98B57] dark:text-[#F3D78A]">
                      <span className="hidden sm:inline">🥇 RANK 1 — GOLD</span>
                      <span className="inline sm:hidden">🥇 #1 GOLD</span>
                    </span>

                    <h3 className="font-spatial-display font-bold text-sm xs:text-base sm:text-2xl md:text-3xl tracking-wide max-w-sm truncate w-full text-[#211D2B] dark:text-[#F5F2FA] group-hover:text-[#A98B57] dark:group-hover:text-[#D2AB45] transition-colors">
                      {top3[0].college}
                    </h3>

                    <p className="text-[10px] xs:text-[11px] sm:text-sm font-mono tracking-widest uppercase mt-0.5 mb-1 sm:mb-4 font-semibold text-[#A98B57] dark:text-[#F3D78A]">
                      {top3[0].code}
                    </p>

                    {/* Gold / Silver Medals Count */}
                    <div className="w-full max-w-xs p-1.5 sm:p-3 rounded-lg border flex items-center justify-around text-[9px] xs:text-[10px] sm:text-sm font-mono font-bold transition-all bg-[#FAF9F6] dark:bg-[#121625] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] text-[#211D2B] dark:text-[#F5F2FA]">
                      <span className="flex items-center gap-0.5 sm:gap-1.5">
                        <span className="text-[#A98B57] dark:text-[#D2AB45]">🥇</span> {top3[0].gold}<span className="hidden sm:inline"> Gold</span>
                      </span>
                      <span className="text-[#686370] dark:text-[#AAA4B8]">•</span>
                      <span className="flex items-center gap-0.5 sm:gap-1.5">
                        <span className="text-[#686370] dark:text-[#AAA4B8]">🥈</span> {top3[0].silver}<span className="hidden sm:inline"> Silver</span>
                      </span>
                    </div>

                    {/* Total Points */}
                    <div className="mt-2 sm:mt-4 flex flex-col items-center">
                      <span className="text-2xl xs:text-3xl sm:text-5xl font-black font-mono tracking-tight text-[#A98B57] dark:text-[#D2AB45]">
                        {top3[0].totalPoints}
                      </span>
                      <span className="text-[8px] xs:text-[9px] sm:text-xs font-mono uppercase tracking-widest font-bold mt-0.5 sm:mt-1 text-[#A98B57] dark:text-[#F3D78A]">
                        <span className="hidden sm:inline">Championship Points</span>
                        <span className="inline sm:hidden">PTS</span>
                      </span>
                    </div>

                    {/* Click hint pill */}
                    <div className="mt-3 text-[10px] sm:text-xs font-mono font-bold text-[#A98B57] dark:text-[#D2AB45] flex items-center gap-1">
                      <span>Explore Champion Medals</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                )}

                {/* Bronze – Rank 3 Card (Right on all screens, Column 3) */}
                {top3[2] && (
                  <div 
                    onClick={() => handleOpenCollegeModal(top3[2], 3)}
                    className="group rounded-2xl p-3 sm:p-7 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 order-3 bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs cursor-pointer hover:border-amber-500/60 hover:shadow-md hover:-translate-y-1"
                    title="Click to view college sport medals breakdown"
                  >
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] xs:text-[9px] sm:text-xs font-mono font-bold tracking-wider uppercase mb-1 sm:mb-3 border bg-[#FAF9F6] dark:bg-[#121625] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-amber-800 dark:text-amber-300">
                      <span className="hidden sm:inline">🥉 RANK 3 — BRONZE</span>
                      <span className="inline sm:hidden">🥉 #3 BRONZE</span>
                    </span>

                    <div className="text-2xl xs:text-3xl sm:text-5xl mb-1 sm:mb-3 filter drop-shadow">🏛️</div>

                    <h3 className="font-spatial-display font-semibold text-xs xs:text-sm sm:text-xl tracking-wide max-w-sm truncate w-full text-[#211D2B] dark:text-[#F5F2FA] group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors">
                      {top3[2].college}
                    </h3>

                    <p className="text-[9px] xs:text-[10px] sm:text-xs font-mono tracking-wider mt-0.5 mb-1 sm:mb-4 text-[#686370] dark:text-[#AAA4B8]">
                      {top3[2].code}
                    </p>

                    {/* Gold / Silver Medals Count */}
                    <div className="w-full max-w-xs p-1.5 sm:p-3 rounded-lg border flex items-center justify-around text-[9px] xs:text-[10px] sm:text-xs font-mono font-bold transition-all bg-[#FAF9F6] dark:bg-[#121625] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] text-[#211D2B] dark:text-[#F5F2FA]">
                      <span className="flex items-center gap-0.5 sm:gap-1.5">
                        <span className="text-[#A98B57] dark:text-[#D2AB45]">🥇</span> {top3[2].gold}<span className="hidden sm:inline"> Gold</span>
                      </span>
                      <span className="text-[#686370] dark:text-[#AAA4B8]">•</span>
                      <span className="flex items-center gap-0.5 sm:gap-1.5">
                        <span className="text-[#686370] dark:text-[#AAA4B8]">🥈</span> {top3[2].silver}<span className="hidden sm:inline"> Silver</span>
                      </span>
                    </div>

                    {/* Total Points */}
                    <div className="mt-2 sm:mt-4 flex flex-col items-center">
                      <span className="text-xl xs:text-2xl sm:text-4xl font-black font-mono tracking-tight text-[#211D2B] dark:text-[#F5F2FA]">
                        {top3[2].totalPoints}
                      </span>
                      <span className="text-[8px] xs:text-[9px] sm:text-[11px] font-mono uppercase tracking-widest font-semibold mt-0.5 text-[#686370] dark:text-[#AAA4B8]">
                        <span className="hidden sm:inline">Championship Points</span>
                        <span className="inline sm:hidden">PTS</span>
                      </span>
                    </div>

                    {/* Click hint pill */}
                    <div className="mt-3 text-[10px] font-mono font-semibold text-[#7156A5] dark:text-[#B8A5E5] flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <span>View Medals</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TABLE CONTROLS & SEARCH BAR ─── */}
            <div className="bg-[#FFFFFF] dark:bg-[#0D101A] p-3 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#A98B57] dark:text-[#D2AB45]" />
                <h2 className="text-sm sm:text-base font-spatial-display uppercase tracking-wider font-semibold text-[#211D2B] dark:text-[#F5F2FA]">
                  Complete Standings
                </h2>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                  {filteredStandings.length} {filteredStandings.length === 1 ? 'College' : 'Colleges'}
                </span>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#686370] dark:text-[#AAA4B8]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search college name or code..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] placeholder-[#686370] dark:placeholder-[#AAA4B8] focus:outline-none focus:border-[#7156A5] dark:focus:border-[#8B5CF6] transition-colors font-mono"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#686370] hover:text-[#211D2B] dark:text-[#AAA4B8] dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ─── STANDINGS TABLE ─── */}
            <div className="rounded-xl border overflow-hidden transition-all bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="uppercase text-[10px] sm:text-[11px] font-mono font-bold tracking-wider border-b bg-[#FAF9F6] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
                    <tr>
                      <th className="p-3.5 sm:p-4 text-center w-16">Rank</th>
                      <th className="p-3.5 sm:p-4">Institute</th>
                      <th className="p-3.5 sm:p-4 text-center">Gold 🥇 (+5 pts)</th>
                      <th className="p-3.5 sm:p-4 text-center">Silver 🥈 (+3 pts)</th>
                      <th className="p-3.5 sm:p-4 text-center font-bold">Total Points</th>
                      <th className="p-3.5 sm:p-4 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1E8] dark:divide-[rgba(184,165,229,0.12)]">
                    {filteredStandings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs font-mono text-[#686370] dark:text-[#AAA4B8]">
                          {hasData ? 'No college matches your search.' : 'No rankings yet — points will be awarded as matches complete.'}
                        </td>
                      </tr>
                    ) : (
                      filteredStandings.map((item, index) => (
                        <tr 
                          key={item.id || item.code || index} 
                          onClick={() => handleOpenCollegeModal(item, index + 1)}
                          className="group transition-colors duration-150 hover:bg-[#F4F2F7] dark:hover:bg-white/[0.04] cursor-pointer"
                          title="Click to view college sport medals & student cards"
                        >
                          <td className="p-3.5 sm:p-4 text-center font-mono font-bold">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold ${
                              index === 0
                                ? 'bg-[#A98B57] text-white dark:bg-[#D2AB45] dark:text-[#070A13]'
                                : index === 1
                                  ? 'bg-slate-200 text-[#211D2B] dark:bg-slate-700 dark:text-slate-100'
                                  : index === 2
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/40'
                                    : 'bg-[#FAF9F6] text-[#686370] dark:bg-white/5 dark:text-[#AAA4B8] border border-[#E5E1E8] dark:border-white/10'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="p-3.5 sm:p-4 font-medium">
                            <div className="font-semibold text-xs sm:text-sm text-[#211D2B] dark:text-[#F5F2FA] group-hover:text-[#7156A5] dark:group-hover:text-[#B8A5E5] transition-colors flex items-center gap-1.5">
                              <span>{item.college}</span>
                            </div>
                            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8]">
                              {item.code}
                            </div>
                          </td>
                          <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-[#A98B57] dark:text-[#D2AB45]">
                            {item.gold}
                          </td>
                          <td className="p-3.5 sm:p-4 text-center font-mono font-medium text-[#686370] dark:text-[#AAA4B8]">
                            {item.silver}
                          </td>
                          <td className="p-3.5 sm:p-4 text-center font-mono font-black text-sm sm:text-base">
                            <span className={
                              index === 0
                                ? 'text-[#A98B57] dark:text-[#D2AB45]'
                                : 'text-[#7156A5] dark:text-[#B8A5E5]'
                            }>
                              {item.totalPoints}
                            </span>
                          </td>
                          <td className="p-3.5 sm:p-4 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#7156A5] dark:text-[#B8A5E5] group-hover:underline">
                              <span>Medals</span>
                              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ TAB 2: CHAMPIONS & MEDALISTS SHOWCASE ════════════════ */}
        {activeTab === 'showcase' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#686370] dark:text-[#AAA4B8]" />
                  <input
                    type="text"
                    value={showcaseSearch}
                    onChange={(e) => setShowcaseSearch(e.target.value)}
                    placeholder="Search athlete name, roll no, sport, sub-event..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] placeholder-[#686370] dark:placeholder-[#AAA4B8] focus:outline-none focus:border-[#7156A5] dark:focus:border-[#8B5CF6] transition-colors font-mono"
                  />
                  {showcaseSearch && (
                    <button
                      onClick={() => setShowcaseSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#686370] hover:text-[#211D2B] dark:text-[#AAA4B8] dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Medal Type Filter */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl p-1 bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] text-xs font-mono">
                    <button
                      onClick={() => setShowcaseMedalFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        showcaseMedalFilter === 'ALL'
                          ? 'bg-[#FFFFFF] dark:bg-[#1A1F30] text-[#211D2B] dark:text-[#F5F2FA] shadow-xs'
                          : 'text-[#686370] dark:text-[#AAA4B8]'
                      }`}
                    >
                      All Medals
                    </button>
                    <button
                      onClick={() => setShowcaseMedalFilter('GOLD')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        showcaseMedalFilter === 'GOLD'
                          ? 'bg-[#A98B57]/20 dark:bg-[#D2AB45]/20 text-[#A98B57] dark:text-[#F3D78A] shadow-xs'
                          : 'text-[#686370] dark:text-[#AAA4B8]'
                      }`}
                    >
                      🥇 Gold Only
                    </button>
                    <button
                      onClick={() => setShowcaseMedalFilter('SILVER')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        showcaseMedalFilter === 'SILVER'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs'
                          : 'text-[#686370] dark:text-[#AAA4B8]'
                      }`}
                    >
                      🥈 Silver Only
                    </button>
                  </div>

                  {/* College Select */}
                  <select
                    value={showcaseCollegeFilter}
                    onChange={(e) => setShowcaseCollegeFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-mono font-semibold rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] focus:outline-none focus:border-[#7156A5]"
                  >
                    <option value="ALL">All Colleges</option>
                    {distinctColleges.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sport Pills Horizontal Scroll */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                <button
                  onClick={() => setShowcaseSportFilter('ALL')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex-shrink-0 border ${
                    showcaseSportFilter === 'ALL'
                      ? 'bg-[#7156A5] text-white border-[#7156A5] shadow-xs'
                      : 'bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] hover:border-[#7156A5]'
                  }`}
                >
                  <span>🏆 All Sports</span>
                </button>

                {distinctSports.map((sp) => (
                  <button
                    key={sp.name}
                    onClick={() => setShowcaseSportFilter(sp.name)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex-shrink-0 border ${
                      showcaseSportFilter === sp.name
                        ? 'bg-[#7156A5] text-white border-[#7156A5] shadow-xs'
                        : 'bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] hover:border-[#7156A5]'
                    }`}
                  >
                    <span>{sp.icon}</span>
                    <span>{sp.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between px-1 text-xs font-mono text-[#686370] dark:text-[#AAA4B8]">
              <span>
                Showing <strong className="text-[#211D2B] dark:text-[#F5F2FA]">{filteredMedalists.length}</strong> Student Medalist Cards
              </span>
              {(showcaseCollegeFilter !== 'ALL' || showcaseSportFilter !== 'ALL' || showcaseMedalFilter !== 'ALL' || showcaseSearch) && (
                <button
                  onClick={() => {
                    setShowcaseCollegeFilter('ALL');
                    setShowcaseSportFilter('ALL');
                    setShowcaseMedalFilter('ALL');
                    setShowcaseSearch('');
                  }}
                  className="text-[#7156A5] dark:text-[#B8A5E5] hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Student Cards Grid */}
            {filteredMedalists.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border p-8 max-w-md mx-auto bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xs">
                <Medal className="w-12 h-12 text-[#686370] dark:text-[#AAA4B8] mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold font-spatial-display uppercase tracking-wide text-[#211D2B] dark:text-[#F5F2FA]">
                  No Student Medalists Found
                </h3>
                <p className="text-xs font-mono mt-1 text-[#686370] dark:text-[#AAA4B8]">
                  Try adjusting your sport, college, or search query.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMedalists.map((medalist) => (
                  <StudentMedalCard 
                    key={medalist.id} 
                    medalist={medalist} 
                    onCollegeClick={(colCode) => {
                      const found = standings.find((s) => s.code === colCode || s.id === colCode);
                      handleOpenCollegeModal(found || { code: colCode, college: colCode });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── DEDICATION QUOTE (The Climb Footer) ─── */}
        <div className="pt-12 sm:pt-16 pb-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 opacity-60">
            <div className="h-[1px] w-12 sm:w-24 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
            <Trophy className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
            <div className="h-[1px] w-12 sm:w-24 bg-[#E5E1E8] dark:bg-[rgba(184,165,229,0.2)]" />
          </div>

          <p className="font-spatial-display text-xs sm:text-sm md:text-base tracking-[0.1em] uppercase font-semibold text-[#211D2B] dark:text-[#F5F2FA] select-none">
            &ldquo;It’s a slow climb to the <span className="text-[#7156A5] dark:text-[#B8A5E5]">top</span>, but the view is worth it.&rdquo;
          </p>

          <p className="text-[11px] font-spatial-sans tracking-wider uppercase font-semibold text-[#686370] dark:text-[#AAA4B8]">
            The Climb • APEX Sports Championship
          </p>
        </div>

      </div>

      {/* ─── COLLEGE MEDALS BREAKDOWN MODAL ─── */}
      <CollegeMedalsModal
        isOpen={Boolean(selectedCollegeModal)}
        onClose={() => setSelectedCollegeModal(null)}
        college={selectedCollegeModal}
        standingsRank={selectedCollegeModal?.rankNumber}
      />
    </div>
  );
};
