import React, { createContext, useContext, useState, useEffect } from 'react';
import { SPORTS_DATA } from '../data/sportsData';
import { LIVE_MATCHES_DATA } from '../data/liveMatchesData';
import { SCHEDULE_DATA } from '../data/scheduleData';
import { RESULTS_DATA } from '../data/resultsData';
import { ANNOUNCEMENTS_DATA } from '../data/announcementsData';
import { ALL_COLLEGES } from '../services/superCoordinatorApi';

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
    } catch (e) {}
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
    } catch (e) {}

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
    const syncLiveMatches = () => {
      let activeList = [];
      const saved = localStorage.getItem('sems_active_live_matches');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          activeList = Object.values(parsed).filter(
            (m) => m && m.id !== 'M595473' && (m.status === 'running' || m.status === 'live' || m.status === 'in_progress')
          );
        } catch (e) {}
      }

      const hasTTLive = activeList.some(
        (m) => (m.sportId || m.sportName || '').toLowerCase().includes('table-tennis') || (m.sportId || m.sportName || '').toLowerCase().includes('tt')
      );

      const filteredFallback = LIVE_MATCHES_DATA.filter((m) => {
        const isTT = (m.sportId || m.sportName || '').toLowerCase().includes('table-tennis') || (m.sportId || m.sportName || '').toLowerCase().includes('tt');
        if (isTT && !hasTTLive) return false;
        return true;
      });

      const combined = [...activeList, ...filteredFallback];
      const uniqueMap = {};
      combined.forEach((m) => {
        if (m && m.id) uniqueMap[m.id] = m;
      });
      setLiveMatches(Object.values(uniqueMap));
    };

    syncLiveMatches();
    window.addEventListener('storage', syncLiveMatches);
    window.addEventListener('sems_matches_updated', syncLiveMatches);
    return () => {
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
    setLiveMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              team1: { ...m.team1, score: team1Score },
              team2: { ...m.team2, score: team2Score },
              currentInfo: statusInfo
            }
          : m
      )
    );
  };

  const addAnnouncement = (newAnn) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  return (
    <SportsDataContext.Provider
      value={{
        sports,
        liveMatches,
        schedule,
        results,
        leaderboard,
        announcements,
        updateLiveMatchScore,
        addAnnouncement
      }}
    >
      {children}
    </SportsDataContext.Provider>
  );
};

export const useSportsData = () => useContext(SportsDataContext);
