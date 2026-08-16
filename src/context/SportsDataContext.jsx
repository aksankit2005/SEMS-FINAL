import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { SPORTS_DATA } from '../data/sportsData';
import { SCHEDULE_DATA } from '../data/scheduleData';
import { RESULTS_DATA } from '../data/resultsData';
import { ANNOUNCEMENTS_DATA } from '../data/announcementsData';
import { ALL_COLLEGES } from '../services/superCoordinatorApi';
import { coordinatorApi } from '../services/coordinatorApi';
import { API_BASE_URL } from '../services/apiConfig';

const SportsDataContext = createContext();

export const SportsDataProvider = ({ children }) => {
  const [sports] = useState(SPORTS_DATA);
  const [liveMatches, setLiveMatches] = useState([]);
  const [schedule, setSchedule] = useState(SCHEDULE_DATA);
  const [results, setResults] = useState(RESULTS_DATA);
  const [leaderboard, setLeaderboard] = useState([]);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_DATA);

  // Fetch live matches from backend PostgreSQL database
  const syncLiveMatches = async () => {
    try {
      const resData = await coordinatorApi.getPublicLiveMatches();
      if (resData && Array.isArray(resData)) {
        const dbLive = resData.filter(
          (m) => m && m.id && (m.status === 'running' || m.status === 'live' || m.status === 'in_progress' || m.status === 'active')
        );
        setLiveMatches(dbLive);
      }
    } catch (e) {
      console.warn('Live matches API fetch error:', e.message);
    }
  };

  // Fetch schedule from backend PostgreSQL database
  const syncSchedule = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/schedules`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setSchedule(res.data);
      }
    } catch (e) {
      console.warn('Schedules API fetch error:', e.message);
    }
  };

  // Fetch results from backend PostgreSQL database
  const syncResults = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/results`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setResults(res.data);
      }
    } catch (e) {
      console.warn('Results API fetch error:', e.message);
    }
  };

  // Fetch leaderboard standings from backend PostgreSQL database
  const syncLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/leaderboard`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const filtered = res.data.filter(c => (c.code || c.id) !== 'EXTERNAL');
        setLeaderboard(filtered);
        return;
      }
    } catch (e) {
      console.warn('Leaderboard API fetch error:', e.message);
    }

    // Fallback: calculate standings from ALL_COLLEGES if no database entries yet
    const standings = ALL_COLLEGES
      .filter((c) => c.id !== 'EXTERNAL')
      .map((college) => ({
        id: college.id,
        college: college.name,
        code: college.id,
        gold: 0,
        silver: 0,
        totalPoints: 0,
      }));
    setLeaderboard(standings);
  };

  // Fetch announcements from backend PostgreSQL database
  const syncAnnouncements = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/announcements`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const dbList = res.data.map((a) => ({
          id: a.id,
          title: a.title,
          summary: a.description || 'Official announcement notice',
          content: a.description || 'Official announcement notice',
          category: 'Rules & Guidelines',
          date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: '10:00 AM',
          author: 'System Administrator (Admin)',
          isImportant: true,
          attachments: a.attachments || []
        }));
        setAnnouncements(dbList);
        return;
      }
    } catch (e) {
      console.warn('Announcements API fetch error:', e.message);
    }
  };

  useEffect(() => {
    syncLiveMatches();
    syncSchedule();
    syncResults();
    syncLeaderboard();
    syncAnnouncements();

    const intervalId = setInterval(() => {
      syncLiveMatches();
      syncSchedule();
      syncResults();
      syncLeaderboard();
      syncAnnouncements();
    }, 5000);

    return () => clearInterval(intervalId);
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
