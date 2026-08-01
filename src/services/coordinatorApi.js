import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sems_coordinator_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Password pattern: {sport_key}#2026  (e.g. cricket#2026, table_tennis#2026)
export const COORDINATOR_ACCOUNTS = [
  { assignedSport: 'cricket',       sportName: 'Cricket',       username: 'coord_cricket',       password: 'cricket#2026',       coordinatorName: 'Vikramaditya Sharma',    email: 'cricket.coord@sems.edu' },
  { assignedSport: 'table-tennis',  sportName: 'Table Tennis',  username: 'coord_table_tennis',  password: 'table_tennis#2026',  coordinatorName: 'Rohan Mehta',            email: 'tt.coord@sems.edu' },
  { assignedSport: 'badminton',     sportName: 'Badminton',     username: 'coord_badminton',     password: 'badminton#2026',     coordinatorName: 'Pooja Deshmukh',         email: 'badminton.coord@sems.edu' },
  { assignedSport: 'chess',         sportName: 'Chess',         username: 'coord_chess',         password: 'chess#2026',         coordinatorName: 'Grandmaster Anand Verma',email: 'chess.coord@sems.edu' },
  { assignedSport: 'football',      sportName: 'Football',      username: 'coord_football',      password: 'football#2026',      coordinatorName: 'Carlos Rodriguez',       email: 'football.coord@sems.edu' },
  { assignedSport: 'basketball',    sportName: 'Basketball',    username: 'coord_basketball',    password: 'basketball#2026',    coordinatorName: 'Michael Jordan Singh',   email: 'basketball.coord@sems.edu' },
  { assignedSport: 'volleyball',    sportName: 'Volleyball',    username: 'coord_volleyball',    password: 'volleyball#2026',    coordinatorName: 'Siddharth Rao',          email: 'volleyball.coord@sems.edu' },
  { assignedSport: 'kabaddi',       sportName: 'Kabaddi',       username: 'coord_kabaddi',       password: 'kabaddi#2026',       coordinatorName: 'Pradeep Narwal Kumar',   email: 'kabaddi.coord@sems.edu' },
  { assignedSport: 'kho-kho',       sportName: 'Kho-Kho',       username: 'coord_kho_kho',       password: 'kho_kho#2026',       coordinatorName: 'Sunita Jadhav',          email: 'khokho.coord@sems.edu' },
  { assignedSport: 'athletics',     sportName: 'Athletics',     username: 'coord_athletics',     password: 'athletics#2026',     coordinatorName: 'PT Usha Pillai',         email: 'athletics.coord@sems.edu' },
  { assignedSport: 'tug-of-war',    sportName: 'Tug of War',    username: 'coord_tug_of_war',    password: 'tug_of_war#2026',    coordinatorName: 'Bheem Singh Power',      email: 'tugofwar.coord@sems.edu' },
  { assignedSport: 'gully-cricket', sportName: 'Gully Cricket', username: 'coord_gully_cricket', password: 'gully_cricket#2026', coordinatorName: 'Chiku Bhai',             email: 'gullycricket.coord@sems.edu' },
];

export const coordinatorApi = {
  getPresetAccount(usernameOrSport) {
    return COORDINATOR_ACCOUNTS.find(
      (a) =>
        a.username.toLowerCase() === usernameOrSport.toLowerCase() ||
        a.assignedSport.toLowerCase() === usernameOrSport.toLowerCase()
    );
  },

  async login(username, password) {
    try {
      const res = await api.post('/coordinator/login', { username, password });
      if (res.data && res.data.token) {
        localStorage.setItem('sems_coordinator_token', res.data.token);
        localStorage.setItem('sems_coordinator_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      console.warn('Backend login fallback used', err);
    }

    const preset = COORDINATOR_ACCOUNTS.find(
      (a) =>
        a.username.toLowerCase() === username.toLowerCase().replace(/-/g, '_') ||
        a.assignedSport.toLowerCase() === username.toLowerCase()
    );

    // Must have a matching account AND the correct password
    if (!preset) {
      throw new Error('Invalid Sport Coordinator credentials. Unknown username.');
    }

    if (password !== preset.password) {
      throw new Error('Incorrect password. Please check your credentials.');
    }

    const user = {
      username: preset.username,
      assignedSport: preset.assignedSport,
      sportName: preset.sportName,
      coordinatorName: preset.coordinatorName,
      email: preset.email,
      role: 'sport_coordinator',
    };
    localStorage.setItem('sems_coordinator_token', `token-${preset.assignedSport}-${Date.now()}`);
    localStorage.setItem('sems_coordinator_user', JSON.stringify(user));
    return { success: true, user };
  },

  logout() {
    localStorage.removeItem('sems_coordinator_token');
    localStorage.removeItem('sems_coordinator_user');
  },

  getCurrentUser() {
    const saved = localStorage.getItem('sems_coordinator_user');
    return saved ? JSON.parse(saved) : null;
  },

  // Read matches for assigned sport from localStorage with default initial state
  async getMatches() {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Unauthenticated');

    const cacheKey = `sems_coord_matches_${user.assignedSport}`;
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    // Default initial fixtures if empty
    const defaults = [
      { id: 'M915370', format: 'SINGLES', status: 'SCHEDULED', team1: 'Albert', team2: 'Romi', matchTitle: 'Albert vs Romi', tableNumber: 'Table 1', score1: 0, score2: 0, time: '05:30 PM' },
      { id: 'M540746', format: 'DOUBLES', status: 'COMPLETED', team1: 'MPEC (Prabal)', team2: 'MPEC (Ujjwal)', matchTitle: 'MPEC (Prabal) vs MPEC (Ujjwal)', tableNumber: null, score1: 2, score2: 0, time: '05:34 PM', winner: 'MPEC (Prabal)' },
      { id: 'M635812', format: 'SINGLES', status: 'COMPLETED', team1: 'Aagaz Khan(MPCPS KN142)', team2: 'Shiv Prakash(MPCPS KN142)', matchTitle: 'Aagaz Khan vs Shiv Prakash', tableNumber: null, score1: 2, score2: 0, time: '05:40 PM', winner: 'Aagaz Khan(MPCPS KN142)' },
      { id: 'M843913', format: 'SINGLES', status: 'SCHEDULED', team1: 'Kapil verma (MPCPS KN142)', team2: 'Anubhav Sachan (MPCPS KN142)', matchTitle: 'Kapil verma vs Anubhav Sachan', tableNumber: 'Table 4', score1: 0, score2: 0, time: '05:40 PM' },
    ];

    localStorage.setItem(cacheKey, JSON.stringify(defaults));
    return defaults;
  },

  // Save matches array to localStorage
  saveMatches(matches) {
    const user = this.getCurrentUser();
    if (!user) return;
    const cacheKey = `sems_coord_matches_${user.assignedSport}`;
    localStorage.setItem(cacheKey, JSON.stringify(matches));
  },

  // Create match & persist to localStorage
  async createMatch(matchData) {
    const matches = await this.getMatches();
    const newMatch = {
      ...matchData,
      id: matchData.id || `M${Math.floor(100000 + Math.random() * 900000)}`,
      status: matchData.status || 'SCHEDULED',
    };
    const updated = [newMatch, ...matches];
    this.saveMatches(updated);
    return newMatch;
  },

  // Update match & persist to localStorage
  async updateMatch(id, matchData) {
    const matches = await this.getMatches();
    const updated = matches.map((m) => (m.id === id ? { ...m, ...matchData } : m));
    this.saveMatches(updated);
    return updated.find((m) => m.id === id);
  },

  // Delete match & persist to localStorage
  async deleteMatch(id) {
    const matches = await this.getMatches();
    const updated = matches.filter((m) => m.id !== id);
    this.saveMatches(updated);
  },

  // Auto-generate fixtures & persist to localStorage
  async generateFixtures(type) {
    const matches = await this.getMatches();
    const formatType = (type || 'Singles').toUpperCase();
    const generated = [
      { id: `M${Math.floor(100000 + Math.random() * 900000)}`, format: formatType, status: 'SCHEDULED', team1: 'Aarav Sharma (MPEC)', team2: 'Rohan Gupta (MIPS)', matchTitle: 'Aarav Sharma vs Rohan Gupta', tableNumber: 'Table 1', time: '05:30 PM', score1: 0, score2: 0 },
      { id: `M${Math.floor(100000 + Math.random() * 900000)}`, format: formatType, status: 'SCHEDULED', team1: 'Ankur Dixit (MPCPS)', team2: 'Aditya Singh (MPEC)', matchTitle: 'Ankur Dixit vs Aditya Singh', tableNumber: 'Table 2', time: '05:40 PM', score1: 0, score2: 0 },
      { id: `M${Math.floor(100000 + Math.random() * 900000)}`, format: formatType, status: 'SCHEDULED', team1: 'Aagaz Khan (MPCPS KN142)', team2: 'Shiv Prakash (MPCPS KN142)', matchTitle: 'Aagaz Khan vs Shiv Prakash', tableNumber: 'Table 3', time: '05:50 PM', score1: 0, score2: 0 },
    ];
    const updated = [...generated, ...matches];
    this.saveMatches(updated);
    return updated;
  },

  // Clear all schedules in localStorage
  async clearAllSchedules() {
    this.saveMatches([]);
  },

  // Update live match score & persist active live matches
  async updateMatchScoring(matchId, scoreData) {
    const matches = await this.getMatches();
    let target = matches.find((m) => m.id === matchId);

    if (!target) {
      target = {
        id: matchId,
        format: scoreData.format || 'SINGLES',
        status: scoreData.status || 'running',
        team1: scoreData.team1 || 'Team A',
        team2: scoreData.team2 || 'Team B',
        matchTitle: scoreData.matchTitle || `${scoreData.team1} vs ${scoreData.team2}`,
        tableNumber: scoreData.venue || scoreData.tableNumber || 'Table 1',
        score1: scoreData.score1 || 0,
        score2: scoreData.score2 || 0,
      };
      matches.unshift(target);
    }

    const updatedMatch = { ...target, ...scoreData };
    if (scoreData.venue) updatedMatch.tableNumber = scoreData.venue;

    const updatedList = matches.map((m) => (m.id === matchId ? updatedMatch : m));
    this.saveMatches(updatedList);

    // Update active live assignments key in localStorage
    const savedActiveStr = localStorage.getItem('sems_active_live_matches');
    let activeMap = savedActiveStr ? JSON.parse(savedActiveStr) : {};

    if (updatedMatch.status === 'running' || updatedMatch.status === 'live') {
      const tableKey = updatedMatch.tableNumber || 'Table 1';
      activeMap[tableKey] = updatedMatch;
    } else if (updatedMatch.status === 'COMPLETED' || updatedMatch.status === 'DEMOTED' || updatedMatch.status === 'SCHEDULED') {
      Object.keys(activeMap).forEach((key) => {
        if (activeMap[key]?.id === matchId) delete activeMap[key];
      });
    }

    localStorage.setItem('sems_active_live_matches', JSON.stringify(activeMap));
    return updatedMatch;
  },

  // Complete match, save result, remove from active live assignments
  async completeMatch(matchId, winnerData) {
    const user = this.getCurrentUser();
    const matches = await this.getMatches();
    const target = matches.find((m) => m.id === matchId) || { id: matchId };

    const completedObj = {
      ...target,
      ...winnerData,
      status: 'COMPLETED',
      tableNumber: null,
      isLiveStreaming: false,
      completedAt: new Date().toISOString(),
      winner: winnerData.winner || (target.score1 >= target.score2 ? target.team1 : target.team2),
    };

    // Save updated match in match list
    const updatedList = matches.map((m) => (m.id === matchId ? completedObj : m));
    this.saveMatches(updatedList);

    // Remove from active live assignments
    const savedActiveStr = localStorage.getItem('sems_active_live_matches');
    if (savedActiveStr) {
      try {
        const activeMap = JSON.parse(savedActiveStr);
        Object.keys(activeMap).forEach((key) => {
          if (activeMap[key]?.id === matchId) delete activeMap[key];
        });
        localStorage.setItem('sems_active_live_matches', JSON.stringify(activeMap));
      } catch (e) {}
    }

    // Save into results list in localStorage
    if (user) {
      const resultsKey = `sems_completed_results_${user.assignedSport}`;
      const savedResultsStr = localStorage.getItem(resultsKey);
      const existingResults = savedResultsStr ? JSON.parse(savedResultsStr) : [];
      const updatedResults = [completedObj, ...existingResults.filter((r) => r.id !== matchId)];
      localStorage.setItem(resultsKey, JSON.stringify(updatedResults));
    }

    return completedObj;
  },

  // Get Registrations from localStorage
  async getRegistrations() {
    const user = this.getCurrentUser();
    if (!user) return [];
    const key = `sems_participants_${user.assignedSport}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  },

  // Get Public Live Matches from localStorage
  async getPublicLiveMatches() {
    const savedActiveStr = localStorage.getItem('sems_active_live_matches');
    let activeList = [];

    if (savedActiveStr) {
      try {
        const activeMap = JSON.parse(savedActiveStr);
        activeList = Object.values(activeMap).filter((m) => m && (m.status === 'running' || m.status === 'live'));
      } catch (e) {}
    }

    // Also scan all sems_coord_matches_* keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sems_coord_matches_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            list.forEach((m) => {
              if (m && (m.status === 'running' || m.status === 'live')) {
                if (!activeList.some((a) => a.id === m.id)) {
                  activeList.push(m);
                }
              }
            });
          }
        } catch (e) {}
      }
    }

    return activeList;
  }
};
