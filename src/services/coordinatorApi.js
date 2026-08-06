import axios from 'axios';
import { SPORT_PLAYER_BOUNDS, resolveSportKey } from '../data/sportsConfig';

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
// NOTE: Passwords are NOT stored here — authentication is handled by the backend.
export const COORDINATOR_ACCOUNTS = [
  { assignedSport: 'cricket',       sportName: 'Cricket',       username: 'coord_cricket',       coordinatorName: 'Vikramaditya Sharma',    email: 'cricket.coord@sems.edu' },
  { assignedSport: 'table-tennis',  sportName: 'Table Tennis',  username: 'coord_table_tennis',  coordinatorName: 'Rohan Mehta',            email: 'tt.coord@sems.edu' },
  { assignedSport: 'badminton',     sportName: 'Badminton',     username: 'coord_badminton',     coordinatorName: 'Badminton Coordinator',  email: '' },
  { assignedSport: 'chess',         sportName: 'Chess',         username: 'coord_chess',         coordinatorName: 'Grandmaster Anand Verma',email: 'chess.coord@sems.edu' },
  { assignedSport: 'football',      sportName: 'Football',      username: 'coord_football',      coordinatorName: 'Carlos Rodriguez',       email: 'football.coord@sems.edu' },
  { assignedSport: 'basketball',    sportName: 'Basketball',    username: 'coord_basketball',    coordinatorName: 'Michael Jordan Singh',   email: 'basketball.coord@sems.edu' },
  { assignedSport: 'volleyball',    sportName: 'Volleyball',    username: 'coord_volleyball',    coordinatorName: 'Siddharth Rao',          email: 'volleyball.coord@sems.edu' },
  { assignedSport: 'kabaddi',       sportName: 'Kabaddi',       username: 'coord_kabaddi',       coordinatorName: 'Pradeep Narwal Kumar',   email: 'kabaddi.coord@sems.edu' },
  { assignedSport: 'kho-kho',       sportName: 'Kho-Kho',       username: 'coord_kho_kho',       coordinatorName: 'Sunita Jadhav',          email: 'khokho.coord@sems.edu' },
  { assignedSport: 'athletics',     sportName: 'Athletics',     username: 'coord_athletics',     coordinatorName: 'PT Usha Pillai',         email: 'athletics.coord@sems.edu' },
  { assignedSport: 'tug-of-war',    sportName: 'Tug of War',    username: 'coord_tug_of_war',    coordinatorName: 'Bheem Singh Power',      email: 'tugofwar.coord@sems.edu' },
  { assignedSport: 'gully-cricket', sportName: 'Gully Cricket', username: 'coord_gully_cricket', coordinatorName: 'Chiku Bhai',             email: 'gullycricket.coord@sems.edu' },
];

export const MOCK_BADMINTON_PARTICIPANTS = [
  {
    id: "REG-BAD-101",
    timestamp: "16 Jul, 10:32 am",
    sport: "Badminton",
    category: "SINGLES",
    format: "SINGLES",
    player1: {
      name: "Aditya Singh",
      roll: "25261101308",
      college: "MPCPS (KN142)",
      year: "2nd Year",
      phone: "9336938985",
      email: "adityasinghmlzs01@gmail.com"
    },
    feePaid: "₹100",
    transactionStatus: "Captured",
    verificationStatus: "Razorpay Auto-Verified"
  },
  {
    id: "REG-BAD-102",
    timestamp: "19 Jul, 01:11 pm",
    sport: "Badminton",
    category: "SINGLES",
    format: "SINGLES",
    player1: {
      name: "Kavyansh Sonwani",
      roll: "2300461540052",
      college: "MPEC",
      year: "4th Year",
      phone: "8112425951",
      email: "kavyanshsonwani@gmail.com"
    },
    feePaid: "₹100",
    transactionStatus: "Captured",
    verificationStatus: "Razorpay Auto-Verified"
  },
  {
    id: "REG-BAD-103",
    timestamp: "19 Jul, 02:12 pm",
    sport: "Badminton",
    category: "DOUBLES",
    format: "DOUBLES",
    player1: {
      name: "Kavyansh Sonwani",
      roll: "2300461540052",
      college: "MPEC",
      year: "4th Year",
      phone: "8112425951",
      email: "kavyanshsonwani@gmail.com"
    },
    player2: {
      name: "Prabal Agrahari",
      roll: "2300460100084",
      college: "MPEC",
      year: "4th Year",
      phone: "9305828388",
      email: "prabalagrahari2006@gmail.com"
    },
    feePaid: "₹200",
    transactionStatus: "Captured",
    verificationStatus: "Razorpay Auto-Verified"
  },
  {
    id: "REG-BAD-104",
    timestamp: "21 Jul, 11:45 am",
    sport: "Badminton",
    category: "SINGLES",
    format: "SINGLES",
    player1: {
      name: "Rohan Verma",
      roll: "2400460100112",
      college: "MIPS Kanpur",
      year: "3rd Year",
      phone: "9839120492",
      email: "rohanverma2026@gmail.com"
    },
    feePaid: "₹100",
    transactionStatus: "Captured",
    verificationStatus: "Razorpay Auto-Verified"
  },
  {
    id: "REG-BAD-105",
    timestamp: "23 Jul, 04:20 pm",
    sport: "Badminton",
    category: "DOUBLES",
    format: "DOUBLES",
    player1: {
      name: "Aman Sharma",
      roll: "2300460200045",
      college: "MPEC",
      year: "3rd Year",
      phone: "9876543210",
      email: "amansharma@mpec.edu"
    },
    player2: {
      name: "Rahul Verma",
      roll: "2300460200048",
      college: "MPEC",
      year: "3rd Year",
      phone: "9876543211",
      email: "rahulverma@mpec.edu"
    },
    feePaid: "₹200",
    transactionStatus: "Captured",
    verificationStatus: "Razorpay Auto-Verified"
  },
  {
    id: "REG-BAD-106",
    timestamp: "25 Jul, 09:15 am",
    sport: "Badminton",
    category: "SINGLES",
    format: "SINGLES",
    player1: {
      name: "Sanya Malhotra",
      roll: "25261102901",
      college: "MPCP Kanpur",
      year: "2nd Year",
      phone: "9834567890",
      email: "sanyamalhotra@mpcp.edu"
    },
    feePaid: "₹100",
    transactionStatus: "Captured",
    verificationStatus: "Razorpay Auto-Verified"
  }
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
      throw new Error('Invalid response from server. Please try again.');
    } catch (err) {
      // Re-throw backend errors (401, 403) with their proper message
      if (err.response) {
        throw new Error(err.response.data?.message || 'Invalid credentials. Access denied.');
      }
      // Network errors
      throw new Error('Cannot connect to server. Please check your connection.');
    }
  },

  logout() {
    localStorage.removeItem('sems_coordinator_token');
    localStorage.removeItem('sems_coordinator_user');
  },

  getCurrentUser() {
    const saved = localStorage.getItem('sems_coordinator_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const defaultUser = {
      username: 'coord_badminton',
      assignedSport: 'badminton',
      sportName: 'Badminton',
      coordinatorName: 'Pooja Deshmukh',
      email: 'badminton.coord@sems.edu',
      role: 'sport_coordinator',
    };
    localStorage.setItem('sems_coordinator_user', JSON.stringify(defaultUser));
    return defaultUser;
  },


  // Read matches for assigned sport from Backend API with localStorage fallback
  async getMatches() {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Unauthenticated');

    const cacheKey = `sems_coord_matches_${user.assignedSport}`;
    let savedMatches = [];
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          savedMatches = parsed;
        }
      } catch (e) {}
    }

    try {
      const res = await api.get('/coordinator/matches');
      if (res.data && Array.isArray(res.data)) {
        if (res.data.length > 0) {
          const completedMap = new Map();
          savedMatches.forEach((m) => {
            if (m && m.id && (m.status === 'COMPLETED' || m.status === 'FINISHED')) {
              completedMap.set(m.id, m);
            }
          });

          const merged = res.data.map((m) => {
            if (completedMap.has(m.id)) {
              return completedMap.get(m.id);
            }
            return m;
          });

          const serverIds = new Set(res.data.map((m) => m.id));
          const localOnly = savedMatches.filter((m) => m && m.id && !serverIds.has(m.id));
          const finalMatches = [...merged, ...localOnly];
          this.saveMatches(finalMatches);
          return finalMatches;
        } else if (savedMatches.length > 0) {
          return savedMatches;
        } else {
          this.saveMatches([]);
          return [];
        }
      }
    } catch (e) {
      console.warn('Backend matches API fallback to localStorage:', e);
    }

    return savedMatches;
  },

  // Save matches array to localStorage
  saveMatches(matches) {
    const user = this.getCurrentUser();
    if (!user) return;
    const cacheKey = `sems_coord_matches_${user.assignedSport}`;
    localStorage.setItem(cacheKey, JSON.stringify(matches));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('sems_matches_updated', { detail: { sportId: user.assignedSport } }));
  },

  // Get all public match schedules across all sports
  async getPublicMatches() {
    try {
      const res = await api.get('/coordinator/matches');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('Public matches endpoint fallback to scanning localStorage keys', e);
    }

    const publicMatches = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sems_coord_matches_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            const sportId = key.replace('sems_coord_matches_', '');
            list.forEach((m) => {
              if (m) {
                publicMatches.push({
                  ...m,
                  sportId,
                  sportName: m.sportName || (sportId.charAt(0).toUpperCase() + sportId.slice(1).replace('-', ' '))
                });
              }
            });
          }
        } catch (err) {}
      }
    }
    return publicMatches;
  },

  // Create match & persist to Backend API & localStorage
  async createMatch(matchData) {
    const matches = await this.getMatches();
    const newMatch = {
      ...matchData,
      id: matchData.id || `M${Math.floor(100000 + Math.random() * 900000)}`,
      status: matchData.status || 'SCHEDULED',
    };
    const updated = [newMatch, ...matches.filter((m) => m.id !== newMatch.id)];
    this.saveMatches(updated);

    try {
      const res = await api.post('/coordinator/matches', newMatch);
      if (res.data && res.data.match) {
        const currentMatches = await this.getMatches();
        const mergedWithServer = [res.data.match, ...currentMatches.filter((m) => m.id !== res.data.match.id)];
        this.saveMatches(mergedWithServer);
        return res.data.match;
      }
    } catch (e) {
      console.warn('Backend create match fallback:', e);
    }

    return newMatch;
  },

  // Update match & persist to Backend API & localStorage
  async updateMatch(id, matchData) {
    try {
      const res = await api.put(`/coordinator/matches/${id}`, matchData);
      if (res.data && res.data.match) {
        const matches = await this.getMatches();
        const updated = matches.map((m) => (m.id === id ? res.data.match : m));
        this.saveMatches(updated);
        return res.data.match;
      }
    } catch (e) {
      console.warn('Backend update match fallback:', e);
    }

    const matches = await this.getMatches();
    const updated = matches.map((m) => (m.id === id ? { ...m, ...matchData } : m));
    this.saveMatches(updated);
    return updated.find((m) => m.id === id);
  },

  // Delete match & persist to Backend API & localStorage
  async deleteMatch(id) {
    try {
      await api.delete(`/coordinator/matches/${id}`);
    } catch (e) {
      console.warn('Backend delete match fallback:', e);
    }

    const matches = await this.getMatches();
    const updated = matches.filter((m) => m.id !== id);
    this.saveMatches(updated);
  },

  // Auto-generate fixtures & persist to localStorage
  async generateFixtures(type) {
    const matches = await this.getMatches();
    const formatType = (type || 'Singles').toUpperCase();
    const user = this.getCurrentUser();
    const isTT = user?.assignedSport === 'table-tennis';
    const vPrefix = isTT ? 'Table' : ['cricket', 'football'].includes(user?.assignedSport || '') ? 'Ground' : 'Court';

    const participants = await this.getRegistrations();
    const generated = [];

    if (participants && participants.length >= 2) {
      for (let i = 0; i < participants.length - 1; i += 2) {
        const p1 = participants[i];
        const p2 = participants[i + 1];
        const t1 = p1.teamName || p1.studentName || `Participant ${i + 1}`;
        const t2 = p2.teamName || p2.studentName || `Participant ${i + 2}`;
        generated.push({
          id: `M${Math.floor(100000 + Math.random() * 900000)}`,
          format: formatType,
          status: 'SCHEDULED',
          team1: `${t1} (${p1.college || 'MPEC'})`,
          team2: `${t2} (${p2.college || 'MPEC'})`,
          matchTitle: `${t1} vs ${t2}`,
          tableNumber: `${vPrefix} ${generated.length + 1}`,
          time: `0${5 + Math.floor(generated.length / 2)}:${30 + (generated.length % 2) * 10} PM`,
          score1: 0,
          score2: 0,
        });
      }
    } else {
      // No participants registered yet
      return null;
    }

    const updated = [...generated, ...matches];
    this.saveMatches(updated);
    return updated;
  },

  // Clear all schedules in localStorage
  async clearAllSchedules() {
    this.saveMatches([]);
  },

  // Update live match score & persist active live matches to Backend API & localStorage
  async updateMatchScoring(matchId, scoreData) {
    try {
      const res = await api.put(`/coordinator/matches/${matchId}`, scoreData);
      if (res.data && res.data.match) {
        const matches = await this.getMatches();
        const updatedList = matches.map((m) => (m.id === matchId ? res.data.match : m));
        this.saveMatches(updatedList);
        return res.data.match;
      }
    } catch (e) {
      console.warn('Backend updateMatchScoring fallback:', e);
    }

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

    try {
      await api.put(`/coordinator/matches/${matchId}`, { ...winnerData, status: 'COMPLETED' });
    } catch (e) {
      console.warn('Backend completeMatch API fallback:', e);
    }

    // Save updated match in match list with COMPLETED status
    let foundInList = false;
    const updatedList = matches.map((m) => {
      if (m.id === matchId) {
        foundInList = true;
        return completedObj;
      }
      return m;
    });
    if (!foundInList) {
      updatedList.unshift(completedObj);
    }
    this.saveMatches(updatedList);


    // Remove from active live assignments across all storage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sems_active_live_matches')) {
        try {
          const activeMap = JSON.parse(localStorage.getItem(key));
          if (activeMap && typeof activeMap === 'object') {
            let modified = false;
            Object.keys(activeMap).forEach((vKey) => {
              if (activeMap[vKey]?.id === matchId) {
                delete activeMap[vKey];
                modified = true;
              }
            });
            if (modified) {
              localStorage.setItem(key, JSON.stringify(activeMap));
            }
          }
        } catch (e) {}
      }
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


  // Get Registrations directly from PostgreSQL database via Backend API
  async getRegistrations() {
    const user = this.getCurrentUser();
    if (!user) return [];

    try {
      const res = await api.get('/coordinator/registrations');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend registrations API fallback to localStorage:', e);
    }

    const key = `sems_participants_${user.assignedSport}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // Default mock data seed for Badminton or any sport when empty
    if (user.assignedSport === 'badminton' || !saved) {
      localStorage.setItem(key, JSON.stringify(MOCK_BADMINTON_PARTICIPANTS));
      return MOCK_BADMINTON_PARTICIPANTS;
    }

    return [];
  },

  // Get Public Live Matches from Backend API with localStorage fallback
  async getPublicLiveMatches() {
    let serverLive = [];
    try {
      const res = await api.get('/live-matches');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        serverLive = res.data;
      }
    } catch (e) {
      console.warn('Backend live matches API fallback:', e);
    }

    const activeList = [...serverLive];

    const savedActiveStr = localStorage.getItem('sems_active_live_matches');
    if (savedActiveStr) {
      try {
        const activeMap = JSON.parse(savedActiveStr);
        Object.values(activeMap).forEach((m) => {
          const s = (m?.status || '').toLowerCase();
          if (m && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active' || s === 'scheduled')) {
            if (!activeList.some((a) => a.id === m.id)) {
              activeList.push(m);
            }
          }
        });
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
              const s = (m?.status || '').toLowerCase();
              if (m && (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active' || s === 'scheduled')) {
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
  },

  // --- COORDINATOR EVENT MANAGEMENT API METHODS ---

  // Get events for logged-in coordinator's assigned sport
  async getEvents() {
    const user = this.getCurrentUser();
    if (!user) return [];

    try {
      const res = await api.get('/coordinator/events');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend events API fallback to localStorage', e);
    }

    const key = `sems_coord_events_${user.assignedSport}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {}
    }

    return [];
  },

  // Save events array to localStorage
  saveEvents(events) {
    const user = this.getCurrentUser();
    if (!user) return;
    const sportKey = (user.assignedSport || 'badminton').toLowerCase();
    const key = `sems_coord_events_${sportKey}`;
    localStorage.setItem(key, JSON.stringify(events));
    window.dispatchEvent(new Event('sems_events_updated'));
    window.dispatchEvent(new Event('storage'));
  },

  // Create new event
  async createEvent(eventData) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Unauthenticated');

    try {
      const res = await api.post('/coordinator/events', eventData);
      if (res.data && res.data.event) {
        // Sync local storage
        const current = await this.getEvents();
        this.saveEvents([res.data.event, ...current]);
        return res.data.event;
      }
    } catch (e) {
      console.warn('Backend create event fallback', e);
    }

    const sportKey = resolveSportKey(user?.assignedSport || eventData.sportId || eventData.sportName);
    const bounds = SPORT_PLAYER_BOUNDS[sportKey] || { min: 1, max: 10 };

    const newEvent = {
      id: eventData.id || `EVT-${(user.assignedSport || 'SPORT').toUpperCase()}-${Date.now()}`,
      title: eventData.title || `${user.sportName || 'Sports'} Championship 2026`,
      sportId: user.assignedSport || sportKey,
      sportName: user.sportName || eventData.sportName || 'Sports',
      coverImage: eventData.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      description: eventData.description || '',
      regStartDate: eventData.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventData.regEndDate || '2026-08-30',
      tournStartDate: eventData.tournStartDate || '2026-09-01',
      tournEndDate: eventData.tournEndDate || '2026-09-05',
      entryFee: Number(eventData.entryFee || 0),
      singlesFee: eventData.singlesFee,
      doublesFee: eventData.doublesFee,
      minPlayers: eventData.minPlayers !== undefined ? Number(eventData.minPlayers) : bounds.min,
      maxPlayers: eventData.maxPlayers !== undefined ? Number(eventData.maxPlayers) : bounds.max,
      teamSize: eventData.teamSize || `${eventData.minPlayers || bounds.min} - ${eventData.maxPlayers || bounds.max} Players`,
      maxRegistrations: Number(eventData.maxRegistrations || 64),
      registeredCount: Number(eventData.registeredCount || 0),
      venue: eventData.venue || 'Central Arena',
      category: eventData.category || 'Open',
      status: eventData.status || 'Published',
      rules: eventData.rules || [],
      requiredDocuments: eventData.requiredDocuments || ['College ID Card'],
      contactInfo: eventData.contactInfo || {
        name: user.coordinatorName,
        email: user.email,
        phone: '+91 98765 43210'
      },
      createdAt: new Date().toISOString()
    };

    const current = await this.getEvents();
    const updated = [newEvent, ...current];
    this.saveEvents(updated);
    return newEvent;
  },

  // Update existing event
  async updateEvent(id, eventData) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Unauthenticated');

    try {
      const res = await api.put(`/coordinator/events/${id}`, eventData);
      if (res.data && res.data.event) {
        const current = await this.getEvents();
        const updated = current.map((e) => (e.id === id ? res.data.event : e));
        this.saveEvents(updated);
        return res.data.event;
      }
    } catch (e) {
      console.warn('Backend update event fallback', e);
    }

    const current = await this.getEvents();
    const target = current.find((e) => e.id === id);
    if (!target) throw new Error('Event not found');

    let newStatus = eventData.status !== undefined ? eventData.status : target.status;
    const newRegCount = eventData.registeredCount !== undefined ? eventData.registeredCount : target.registeredCount;
    const newMaxReg = eventData.maxRegistrations !== undefined ? eventData.maxRegistrations : target.maxRegistrations;

    if (newRegCount >= newMaxReg) {
      newStatus = 'Closed';
    }

    const updatedEvent = {
      ...target,
      ...eventData,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    const updatedList = current.map((e) => (e.id === id ? updatedEvent : e));
    this.saveEvents(updatedList);
    return updatedEvent;
  },

  // Delete event
  async deleteEvent(id) {
    try {
      await api.delete(`/coordinator/events/${id}`);
    } catch (e) {}

    const current = await this.getEvents();
    const updated = current.filter((e) => e.id !== id);
    this.saveEvents(updated);
  },

  // Get all Published & Closed coordinator events across all sports
  async getPublicEvents() {
    let serverEvents = [];
    try {
      const res = await api.get('/public/events');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        serverEvents = res.data;
      }
    } catch (e) {
      console.warn('Public events endpoint fallback to scanning localStorage keys', e);
    }

    const publicList = [...serverEvents];
    const currentDate = new Date();
    const existingIds = new Set(serverEvents.map((e) => e.id));

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().startsWith('sems_coord_events_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            list.forEach((e) => {
              if (e && (e.status === 'Published' || e.status === 'Open' || e.status === 'Active' || e.status === 'Closed' || !e.status)) {
                if (e.id === 'EVT-BADMINTON-001' || e.id === 'EVT-CRICKET-001' || e.id === 'EVT-FOOTBALL-001') return;
                if (existingIds.has(e.id)) return;

                let status = e.status === 'Closed' ? 'Closed' : 'Published';
                if (e.regEndDate && new Date(e.regEndDate + 'T23:59:59') < currentDate) {
                  status = 'Closed';
                }
                publicList.push({
                  ...e,
                  status,
                  availableSlots: Math.max(0, (e.maxRegistrations || 64) - (e.registeredCount || 0))
                });
              }
            });
          }
        } catch (err) {}
      }
    }

    return publicList;
  },



  // Register for public event
  async registerForEvent(eventId, sportId, participantData, paymentData) {
    try {
      const res = await api.post('/public/register-event', { eventId, sportId, participantData, paymentData });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend register event fallback to localStorage', e);
    }

    // Local storage fallback for incrementing registered count
    const targetSport = (sportId || 'badminton').toLowerCase();
    const key = `sems_coord_events_${targetSport}`;
    const saved = localStorage.getItem(key);
    let event = null;

    if (saved) {
      try {
        const events = JSON.parse(saved);
        const idx = events.findIndex((e) => e.id === eventId);
        if (idx !== -1) {
          events[idx].registeredCount = (events[idx].registeredCount || 0) + 1;
          if (events[idx].registeredCount >= events[idx].maxRegistrations) {
            events[idx].status = 'Closed';
          }
          event = events[idx];
          localStorage.setItem(key, JSON.stringify(events));
        }
      } catch (err) {}
    }

    // Save to participants list
    const participantKey = `sems_participants_${targetSport}`;
    const savedParticipants = localStorage.getItem(participantKey);
    const pList = savedParticipants ? JSON.parse(savedParticipants) : [];

    const receiptId = `REC-APEX-${Math.floor(10000 + Math.random() * 90000)}`;
    const newRecord = {
      id: receiptId,
      eventId: eventId || 'DEFAULT',
      teamName: participantData.teamName || participantData.fullName || 'Solo Entry',
      studentName: participantData.fullName || participantData.captainName || 'Athlete',
      college: participantData.collegeName || 'MPEC',
      department: participantData.department || 'Engineering',
      gender: participantData.gender || 'Male',
      contactPhone: participantData.phone || '+91 98765 43210',
      registeredDate: new Date().toLocaleDateString(),
      status: 'Approved',
      feePaid: event ? event.entryFee : (participantData.entryFee || 0),
      paymentId: paymentData?.razorpayPaymentId || `TXN-RP-${Math.floor(100000000000 + Math.random() * 900000000000)}`
    };

    pList.unshift(newRecord);
    localStorage.setItem(participantKey, JSON.stringify(pList));

    return {
      success: true,
      message: 'Event registration confirmed',
      receipt: newRecord,
      updatedEvent: event
    };
  }
};

