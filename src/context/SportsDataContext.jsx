import React, { createContext, useContext, useState, useEffect } from 'react';
import { SPORTS_DATA } from '../data/sportsData';
import { LIVE_MATCHES_DATA } from '../data/liveMatchesData';
import { SCHEDULE_DATA } from '../data/scheduleData';
import { RESULTS_DATA } from '../data/resultsData';
import { ANNOUNCEMENTS_DATA } from '../data/announcementsData';
import { ALL_COLLEGES } from '../services/superCoordinatorApi';
import { coordinatorApi } from '../services/coordinatorApi';

const SportsDataContext = createContext();

export const SportsDataProvider = ({ children }) => {
  const [sports] = useState(SPORTS_DATA);
  const [liveMatches, setLiveMatches] = useState([]);
  const [schedule] = useState(SCHEDULE_DATA);
  const [results] = useState(RESULTS_DATA);
  const [leaderboard, setLeaderboard] = useState([]);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_DATA);

  const computeLeaderboard = () => {
    let entries = [];
    try {
      const stored = localStorage.getItem('sems_super_coord_leaderboard');
      if (stored) entries = JSON.parse(stored);
    } catch (e) { }
    const tally = {};
    entries.forEach((entry) => {
      if (entry.winnerCollege) {
        if (!tally[entry.winnerCollege]) tally[entry.winnerCollege] = { gold: 0, silver: 0 };
        tally[entry.winnerCollege].gold += 1;
      }
      if (entry.runnerUpCollege) {
        if (!tally[entry.runnerUpCollege]) tally[entry.runnerUpCollege] = { gold: 0, silver: 0 };
        tally[entry.runnerUpCollege].silver += 1;
      }
    });
    const standings = ALL_COLLEGES
      .filter((c) => c.id !== 'EXTERNAL')
      .map((college) => {
        const counts = tally[college.id] || { gold: 0, silver: 0 };
        return {
          id: college.id,
          college: college.name,
          code: college.id,
          gold: counts.gold,
          silver: counts.silver,
          totalPoints: counts.gold * 2 + counts.silver * 1,
        };
      });
    standings.sort((a, b) => b.totalPoints - a.totalPoints || b.gold - a.gold || b.silver - a.silver || a.college.localeCompare(b.college));
    setLeaderboard(standings);
  };

  const syncAnnouncements = () => {
    let adminList = [];
    try {
      const stored = localStorage.getItem('sems_admin_announcements');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          adminList = parsed.filter((a) => a && (a.isPublished !== false));
        }
      }
    } catch (e) { }

    const formattedAdminList = adminList.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.description || a.summary || 'Official announcement notice',
      content: a.description || a.content || 'Official announcement notice',
      category: a.category || 'Rules & Guidelines',
      date: a.date || a.publishDate || new Date().toISOString().split('T')[0],
      time: a.time || '10:00 AM',
      author: 'System Administrator (Admin)',
      isImportant: Boolean(a.isImportant || a.important || true),
      attachments: a.attachments || []
    }));

    const combined = [...formattedAdminList, ...ANNOUNCEMENTS_DATA];
    const seen = new Set();
    const unique = [];
    combined.forEach((item) => {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    });

    setAnnouncements(unique);
  };

  useEffect(() => {
    const syncLiveMatches = async () => {
      try {
        const resData = await coordinatorApi.getPublicLiveMatches();
        if (resData && Array.isArray(resData)) {
          const dbLive = resData.filter(
            (m) => m && m.id && (m.status === 'running' || m.status === 'live' || m.status === 'in_progress' || m.status === 'active')
          );
          setLiveMatches(dbLive);
          return;
        }
      } catch (e) {
        console.warn('Live matches API fetch error:', e.message);
      }

      setLiveMatches([]);
    };

    syncLiveMatches();
    const intervalId = setInterval(syncLiveMatches, 3000);

    window.addEventListener('storage', syncLiveMatches);
    window.addEventListener('sems_matches_updated', syncLiveMatches);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', syncLiveMatches);
      window.removeEventListener('sems_matches_updated', syncLiveMatches);
    };
  }, []);

  useEffect(() => {
    computeLeaderboard();
    window.addEventListener('sems_leaderboard_updated', computeLeaderboard);
    window.addEventListener('storage', computeLeaderboard);
    return () => {
      window.removeEventListener('sems_leaderboard_updated', computeLeaderboard);
      window.removeEventListener('storage', computeLeaderboard);
    };
  }, []);

  useEffect(() => {
    syncAnnouncements();
    window.addEventListener('sems_announcements_updated', syncAnnouncements);
    window.addEventListener('storage', syncAnnouncements);
    return () => {
      window.removeEventListener('sems_announcements_updated', syncAnnouncements);
      window.removeEventListener('storage', syncAnnouncements);
    };
  }, []);

  const updateLiveMatchScore = (matchId, team1Score, team2Score, statusInfo) => {
    if (!matchId) return;
    setLiveMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const curS1 = m.score1 !== undefined ? Number(m.score1) : (m.team1?.score !== undefined ? Number(m.team1.score) : 0);
        const curS2 = m.score2 !== undefined ? Number(m.score2) : (m.team2?.score !== undefined ? Number(m.team2.score) : 0);
        const newS1 = Math.max(curS1, Number(team1Score) || 0);
        const newS2 = Math.max(curS2, Number(team2Score) || 0);

        return {
          ...m,
          score1: newS1,
          score2: newS2,
          team1: typeof m.team1 === 'object' ? { ...m.team1, score: newS1 } : m.team1,
          team2: typeof m.team2 === 'object' ? { ...m.team2, score: newS2 } : m.team2,
          currentInfo: statusInfo || m.currentInfo,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const addAnnouncement = (newAnn) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const contextValue = React.useMemo(() => ({
    sports,
    liveMatches,
    schedule,
    results,
    leaderboard,
    announcements,
    updateLiveMatchScore,
    addAnnouncement
  }), [sports, liveMatches, schedule, results, leaderboard, announcements]);

  return (
    <SportsDataContext.Provider value={contextValue}>
      {children}
    </SportsDataContext.Provider>
  );
};

export const useSportsData = () => useContext(SportsDataContext);
