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
  const [liveMatches, setLiveMatches] = useState(LIVE_MATCHES_DATA);
  const [schedule] = useState(SCHEDULE_DATA);
  const [results] = useState(RESULTS_DATA);
  const [leaderboard] = useState(LEADERBOARD_DATA);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_DATA);



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
