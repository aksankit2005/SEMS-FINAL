import React, { createContext, useContext, useState, useEffect } from 'react';
import { SPORTS_DATA } from '../data/sportsData';
import { LIVE_MATCHES_DATA } from '../data/liveMatchesData';
import { SCHEDULE_DATA } from '../data/scheduleData';
import { RESULTS_DATA } from '../data/resultsData';
import { LEADERBOARD_DATA } from '../data/leaderboardData';
import { ANNOUNCEMENTS_DATA } from '../data/announcementsData';

const SportsDataContext = createContext();

export const SportsDataProvider = ({ children }) => {
  const [sports] = useState(SPORTS_DATA);
  const [liveMatches, setLiveMatches] = useState([]);
  const [schedule] = useState(SCHEDULE_DATA);
  const [results] = useState(RESULTS_DATA);
  const [leaderboard] = useState(LEADERBOARD_DATA);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_DATA);

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
