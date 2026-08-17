import axios from 'axios';
import { SPORT_PLAYER_BOUNDS, resolveSportKey } from '../data/sportsConfig';
import { API_BASE_URL } from './apiConfig';

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 429) {
      console.warn('[429 Rate Limit] Server rate limit triggered. Request halted safely.');
    }
    return Promise.reject(error);
  }
);

// Helper to deterministically sort live matches (sportId -> numeric court/table -> match ID)
export const sortLiveMatches = (matches) => {
  if (!Array.isArray(matches)) return [];
  return [...matches].sort((a, b) => {
    // 1. Primary: sportId (alphabetical)
    const sportA = (a.sportId || a.sport || (a.sportName ? a.sportName.toLowerCase().replace(/[^a-z0-9]/g, '-') : '')).toLowerCase();
    const sportB = (b.sportId || b.sport || (b.sportName ? b.sportName.toLowerCase().replace(/[^a-z0-9]/g, '-') : '')).toLowerCase();
    if (sportA !== sportB) {
      return sportA.localeCompare(sportB);
    }

    // 2. Secondary: numeric Court/Table number (e.g. Court 1 < Court 2 < Court 10)
    const venueA = String(a.tableNumber || a.venue || '');
    const venueB = String(b.tableNumber || b.venue || '');
    const matchNumA = venueA.match(/\d+/);
    const matchNumB = venueB.match(/\d+/);
    const numA = matchNumA ? parseInt(matchNumA[0], 10) : null;
    const numB = matchNumB ? parseInt(matchNumB[0], 10) : null;

    if (numA !== null && numB !== null && numA !== numB) {
      return numA - numB;
    }
    if (numA !== null && numB === null) return -1;
    if (numA === null && numB !== null) return 1;

    const venueComp = venueA.localeCompare(venueB);
    if (venueComp !== 0) return venueComp;

    // 3. Final tie-breaker: Match ID
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
};

// Helper to safely merge live match states without score regressions or field loss
export const mergeMatchState = (existing, incoming) => {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const incStatus = (incoming.status || '').toLowerCase();
  const extStatus = (existing.status || '').toLowerCase();

  // If status is completed/finished, prioritize completed state
  if (incStatus === 'completed' || incStatus === 'finished') return { ...existing, ...incoming };
  if (extStatus === 'completed' || extStatus === 'finished') return existing;

  // Check explicit timestamps if both have valid dates
  const incTime = new Date(incoming.updatedAt || incoming.timestamp || 0).getTime();
  const extTime = new Date(existing.updatedAt || existing.timestamp || 0).getTime();

  if (incTime > 0 && extTime > 0 && incTime !== extTime) {
    return incTime > extTime ? { ...existing, ...incoming } : { ...incoming, ...existing };
  }

  // Score extraction helpers
  const getS1 = (m) => {
    if (m.score1 !== undefined && m.score1 !== null) return Number(m.score1) || 0;
    if (typeof m.team1 === 'object' && m.team1?.score !== undefined) return Number(m.team1.score) || 0;
    return 0;
  };

  const getS2 = (m) => {
    if (m.score2 !== undefined && m.score2 !== null) return Number(m.score2) || 0;
    if (typeof m.team2 === 'object' && m.team2?.score !== undefined) return Number(m.team2.score) || 0;
    return 0;
  };

  const extS1 = getS1(existing);
  const extS2 = getS2(existing);
  const incS1 = getS1(incoming);
  const incS2 = getS2(incoming);

  const incSet = incoming.currentSet || incoming.currentSetIndex || 1;
  const extSet = existing.currentSet || existing.currentSetIndex || 1;

  const incLockedCount = Array.isArray(incoming.setsHistory) ? incoming.setsHistory.filter((s) => s.isLocked).length : 0;
  const extLockedCount = Array.isArray(existing.setsHistory) ? existing.setsHistory.filter((s) => s.isLocked).length : 0;

  // If incoming has newer timestamp, new set index, or newly locked set, trust incoming score directly
  const isSetTransitionOrNewer = incSet !== extSet || incLockedCount !== extLockedCount || (incTime > 0 && incTime >= extTime);

  const finalS1 = isSetTransitionOrNewer ? incS1 : Math.max(extS1, incS1);
  const finalS2 = isSetTransitionOrNewer ? incS2 : Math.max(extS2, incS2);

  const team1Merged = typeof incoming.team1 === 'object'
    ? { ...incoming.team1, score: finalS1 }
    : (typeof existing.team1 === 'object' ? { ...existing.team1, score: finalS1 } : (incoming.team1 || existing.team1));

  const team2Merged = typeof incoming.team2 === 'object'
    ? { ...incoming.team2, score: finalS2 }
    : (typeof existing.team2 === 'object' ? { ...existing.team2, score: finalS2 } : (incoming.team2 || existing.team2));

  // Stream properties preservation
  const mergedYoutubeVideoId = incoming.youtubeVideoId || existing.youtubeVideoId || null;
  const mergedStreamUrl = incoming.streamUrl || existing.streamUrl || null;
  const mergedIsLiveStreaming = incoming.isLiveStreaming !== undefined ? incoming.isLiveStreaming : (existing.isLiveStreaming ?? Boolean(mergedYoutubeVideoId || mergedStreamUrl));

  // Sets History preservation
  const mergedSetsHistory = (Array.isArray(incoming.setsHistory) && incoming.setsHistory.length > 0)
    ? incoming.setsHistory
    : (Array.isArray(existing.setsHistory) ? existing.setsHistory : null);

  return {
    ...existing,
    ...incoming,
    score1: finalS1,
    score2: finalS2,
    team1: team1Merged,
    team2: team2Merged,
    currentSet: incSet || extSet,
    setsHistory: mergedSetsHistory,
    youtubeVideoId: mergedYoutubeVideoId,
    streamUrl: mergedStreamUrl,
    isLiveStreaming: mergedIsLiveStreaming,
    updatedAt: new Date().toISOString()
  };
};

// Password pattern: {sport_key}#2026  (e.g. cricket#2026, table_tennis#2026)
// NOTE: Passwords are NOT stored here — authentication is handled by the backend.
export const COORDINATOR_ACCOUNTS = [
  { assignedSport: 'cricket', sportName: 'Cricket', username: 'coord_cricket', coordinatorName: 'Vikramaditya Sharma', email: 'cricket.coord@apex.edu' },
  { assignedSport: 'table-tennis', sportName: 'Table Tennis', username: 'coord_table_tennis', coordinatorName: 'Rohan Mehta', email: 'tt.coord@apex.edu' },
  { assignedSport: 'badminton', sportName: 'Badminton', username: 'coord_badminton', coordinatorName: 'Badminton Coordinator', email: '' },
  { assignedSport: 'chess', sportName: 'Chess', username: 'coord_chess', coordinatorName: 'Grandmaster Anand Verma', email: 'chess.coord@apex.edu' },
  { assignedSport: 'football', sportName: 'Football', username: 'coord_football', coordinatorName: 'Carlos Rodriguez', email: 'football.coord@apex.edu' },
  { assignedSport: 'basketball', sportName: 'Basketball', username: 'coord_basketball', coordinatorName: 'Michael Jordan Singh', email: 'basketball.coord@apex.edu' },
  { assignedSport: 'volleyball', sportName: 'Volleyball', username: 'coord_volleyball', coordinatorName: 'Siddharth Rao', email: 'volleyball.coord@apex.edu' },
  { assignedSport: 'kabaddi', sportName: 'Kabaddi', username: 'coord_kabaddi', coordinatorName: 'Pradeep Narwal Kumar', email: 'kabaddi.coord@apex.edu' },
  { assignedSport: 'kho-kho', sportName: 'Kho-Kho', username: 'coord_kho_kho', coordinatorName: 'Sunita Jadhav', email: 'khokho.coord@apex.edu' },
  { assignedSport: 'athletics', sportName: 'Athletics', username: 'coord_athletics', coordinatorName: 'PT Usha Pillai', email: 'athletics.coord@apex.edu' },
  { assignedSport: 'tug-of-war', sportName: 'Tug of War', username: 'coord_tug_of_war', coordinatorName: 'Bheem Singh Power', email: 'tugofwar.coord@apex.edu' },
  { assignedSport: 'gully-cricket', sportName: 'Gully Cricket', username: 'coord_gully_cricket', coordinatorName: 'Chiku Bhai', email: 'gullycricket.coord@apex.edu' },
];

export const getSportRoute = (assignedSport) => {
  const normalized = (assignedSport || '').toLowerCase().trim().replace(/_/g, '-');
  const routes = {
    'badminton': '/coordinator/badminton',
    'cricket': '/coordinator/cricket',
    'football': '/coordinator/football',
    'basketball': '/coordinator/basketball',
    'volleyball': '/coordinator/volleyball',
    'table-tennis': '/coordinator/table-tennis',
    'chess': '/coordinator/chess',
    'kabaddi': '/coordinator/kabaddi',
    'kho-kho': '/coordinator/kho-kho',
    'athletics': '/coordinator/athletics',
    'tug-of-war': '/coordinator/tug-of-war',
    'gully-cricket': '/coordinator/gully-cricket',
  };
  return routes[normalized] || (normalized ? `/coordinator/${normalized}` : '/coordinator/badminton');
};



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
        window.dispatchEvent(new Event('sems-auth-change'));
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
    window.dispatchEvent(new Event('sems-auth-change'));
  },

  isAuthenticated() {
    const token = localStorage.getItem('sems_coordinator_token');
    const user = localStorage.getItem('sems_coordinator_user');
    return Boolean(token && user);
  },

  getCurrentUser() {
    const saved = localStorage.getItem('sems_coordinator_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return null;
  },


  // Read matches for assigned sport from Backend API with localStorage fallback
  async getMatches() {
    const user = this.getCurrentUser();
    if (!user) return [];

    const sportKey = (user.assignedSport || '').toLowerCase();
    const cacheKey = sportKey === 'basketball'
      ? 'basketballMatchSchedules'
      : sportKey === 'volleyball'
        ? 'volleyballMatchSchedules'
        : `sems_coord_matches_${sportKey}`;

    let savedMatches = [];
    const saved = localStorage.getItem(cacheKey) || localStorage.getItem(`sems_coord_matches_${sportKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          savedMatches = parsed.filter(m => {
            if (!m) return false;
            const mSport = (m.sport || m.sportId || '').toLowerCase();
            return !mSport || mSport === sportKey;
          });
        }
      } catch (e) { }
    }

    try {
      const res = await api.get('/coordinator/matches');
      if (res.data && Array.isArray(res.data)) {
        const serverData = res.data.map(m => ({
          ...m,
          sport: sportKey,
          sportId: sportKey,
          sportName: user.sportName || (sportKey.charAt(0).toUpperCase() + sportKey.slice(1))
        }));
        return serverData;
      }
    } catch (e) {
      console.warn('Backend matches API fallback:', e.message);
    }

    return savedMatches.map(m => ({
      ...m,
      sport: sportKey,
      sportId: sportKey,
      sportName: user.sportName || (sportKey.charAt(0).toUpperCase() + sportKey.slice(1))
    }));
  },

  // Save matches array to localStorage & sync to Backend PostgreSQL DB
  async saveMatches(matches) {
    const user = this.getCurrentUser();
    if (!user) return;
    const sportKey = (user.assignedSport || '').toLowerCase();
    const cacheKey = sportKey === 'basketball'
      ? 'basketballMatchSchedules'
      : sportKey === 'volleyball'
        ? 'volleyballMatchSchedules'
        : `sems_coord_matches_${sportKey}`;

    const filtered = (matches || []).filter(m => {
      if (!m) return false;
      const mSport = (m.sport || m.sportId || '').toLowerCase();
      return !mSport || mSport === sportKey;
    }).map(m => ({
      ...m,
      sport: sportKey,
      sportId: sportKey,
      sportName: user.sportName || (sportKey.charAt(0).toUpperCase() + sportKey.slice(1))
    }));

    localStorage.setItem(cacheKey, JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('sems_matches_updated', { detail: { sportId: sportKey } }));

    try {
      await api.post('/coordinator/matches/batch', { matches: filtered, sportId: sportKey });
    } catch (e) {
      console.warn('Backend saveMatches batch sync warning:', e?.message || e);
    }
  },

  // Get all public match schedules across all sports
  async getPublicMatches() {
    const allMatches = [];
    const seenIds = new Set();
    let deletedIds = new Set();

    try {
      const deletedStr = localStorage.getItem('sems_deleted_match_ids');
      if (deletedStr) {
        deletedIds = new Set(JSON.parse(deletedStr));
      }
    } catch (e) {}

    // 1. Scan localStorage for all scheduled match keys across all sports
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('sems_coord_matches_') ||
          key.startsWith('sems_matches_') ||
          key === 'basketballMatchSchedules' ||
          key === 'volleyballMatchSchedules')
      ) {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            list.forEach((m) => {
              if (
                m &&
                m.id &&
                !seenIds.has(m.id) &&
                !deletedIds.has(m.id) &&
                m.status !== 'COMPLETED' &&
                m.status !== 'FINISHED'
              ) {
                seenIds.add(m.id);
                allMatches.push(m);
              }
            });
          }
        } catch (e) {}
      }
    }

    // 2. Try fetching from Backend API public schedules
    try {
      const backendMatches = await this.getPublicSchedules();
      if (Array.isArray(backendMatches)) {
        backendMatches.forEach((m) => {
          if (
            m &&
            m.id &&
            !seenIds.has(m.id) &&
            !deletedIds.has(m.id) &&
            m.status !== 'COMPLETED' &&
            m.status !== 'FINISHED'
          ) {
            seenIds.add(m.id);
            allMatches.push(m);
          }
        });
      }
    } catch (e) {}

    return allMatches;
  },

  // Get all public match schedules across all sports
  async getPublicSchedules() {
    try {
      const res = await api.get('/schedules');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.warn('Error fetching public schedules:', e.message);
    }
    return [];
  },

  // Create match & persist to Backend API & localStorage
 async createMatch(matchData) {
  try {
    const user = this.getCurrentUser();
    const sportKey = (
      user?.assignedSport ||
      matchData.sportId ||
      matchData.sport ||
      'badminton'
    ).toLowerCase();

    const payload = {
      ...matchData,
      sport: sportKey,
      sportId: sportKey,
      sportName:
        user?.sportName ||
        matchData.sportName ||
        sportKey.charAt(0).toUpperCase() + sportKey.slice(1),
      status: matchData.status || 'SCHEDULED',
    };

    const res = await api.post(
      '/coordinator/matches',
      payload
    );

    if (!res.data || !res.data.match) {
      throw new Error('Server did not return the created match');
    }

    const createdMatch = res.data.match;

    const matches = await this.getMatches();

    const updated = [
      createdMatch,
      ...matches.filter(
        (m) => m.id !== createdMatch.id
      ),
    ];

    this.saveMatches(updated);

    return createdMatch;
  } catch (error) {
    console.error(
      'Failed to create match:',
      error
    );

    throw error;
  }
},

  // Update match & persist to Backend API & localStorage
 async updateMatch(id, matchData) {
  try {
    const res = await api.put(
      `/coordinator/matches/${id}`,
      matchData
    );

    if (!res.data || !res.data.match) {
      throw new Error('Server returned no updated match');
    }

    const updatedMatch = res.data.match;

    const matches = await this.getMatches();

    const updated = matches.map((m) =>
      m.id === id
        ? { ...m, ...updatedMatch }
        : m
    );

    this.saveMatches(updated);

    return updatedMatch;
  } catch (error) {
    console.error(
      `Failed to update match ${id}:`,
      error
    );

    throw error;
  }
},

  // Delete match & persist to Backend API & localStorage
async deleteMatch(id) {
  try {
    await api.delete(`/coordinator/matches/${id}`);
  } catch (error) {
    console.error(
      `Failed to delete match ${id}:`,
      error
    );

    throw error;
  }

  try {
    const deletedArr = JSON.parse(
      localStorage.getItem('sems_deleted_match_ids') || '[]'
    );

    if (!deletedArr.includes(id)) {
      deletedArr.push(id);

      localStorage.setItem(
        'sems_deleted_match_ids',
        JSON.stringify(deletedArr)
      );
    }
  } catch (error) {
    console.warn(
      'Failed to update deleted match cache:',
      error
    );
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (
        key &&
        (
          key.startsWith('sems_coord_matches_') ||
          key.endsWith('MatchSchedules') ||
          key.startsWith('sems_matches_')
        )
      ) {
        const raw = localStorage.getItem(key);

        if (!raw) continue;

        const list = JSON.parse(raw);

        if (Array.isArray(list)) {
          const updated = list.filter(
            (m) => m && m.id !== id
          );

          localStorage.setItem(
            key,
            JSON.stringify(updated)
          );
        }
      }
    }

    const activeRaw = localStorage.getItem(
      'sems_active_live_matches'
    );

    if (activeRaw) {
      const activeMap = JSON.parse(activeRaw);

      Object.keys(activeMap).forEach((key) => {
        if (activeMap[key]?.id === id || key === id) {
          delete activeMap[key];
        }
      });

      localStorage.setItem(
        'sems_active_live_matches',
        JSON.stringify(activeMap)
      );
    }
  } catch (error) {
    console.warn(
      'Failed to clean deleted match cache:',
      error
    );
  }

  return true;
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

  // Clear all schedules & live matches in localStorage and backend server
  async clearAllSchedules() {
    try {
      await api.delete('/coordinator/matches');
    } catch (e) {
      console.warn('Backend clearAllSchedules fallback:', e);
    }

    this.saveMatches([]);

    // Clear active live assignments from localStorage
    const user = this.getCurrentUser();
    const assignedSport = (user?.assignedSport || '').toLowerCase();

    if (assignedSport) {
      localStorage.removeItem(`sems_active_live_matches_${assignedSport}`);
    }

    const savedActiveStr = localStorage.getItem('sems_active_live_matches');
    if (savedActiveStr) {
      try {
        const activeMap = JSON.parse(savedActiveStr);
        if (activeMap && typeof activeMap === 'object') {
          const cleaned = {};
          Object.keys(activeMap).forEach((id) => {
            const m = activeMap[id];
            const mSport = (m?.sportId || m?.sportName || '').toLowerCase();
            if (mSport && assignedSport && mSport.includes(assignedSport)) {
              // Delete match for assigned sport
            } else {
              cleaned[id] = m;
            }
          });
          localStorage.setItem('sems_active_live_matches', JSON.stringify(cleaned));
        }
      } catch (e) { }
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('sems_matches_updated'));
  },

  // Update live match score & persist active live matches to Backend API & localStorage
  async updateMatchScoring(matchId, scoreData) {
  try {
    const res = await api.post(
      `/coordinator/matches/${matchId}/score`,
      scoreData
    );

    if (!res.data || !res.data.match) {
      throw new Error('Server returned no updated match');
    }

    const updatedMatch = res.data.match;

    const matches = await this.getMatches();

    const existingIndex = matches.findIndex(
      (m) => m.id === matchId
    );

    let updatedList;

    if (existingIndex !== -1) {
      updatedList = matches.map((m) =>
        m.id === matchId
          ? { ...m, ...updatedMatch }
          : m
      );
    } else {
      updatedList = [
        updatedMatch,
        ...matches
      ];
    }

    this.saveMatches(updatedList);

    let activeMap = {};

    try {
      const savedActiveStr = localStorage.getItem(
        'sems_active_live_matches'
      );

      if (savedActiveStr) {
        const parsed = JSON.parse(savedActiveStr);

        if (parsed && typeof parsed === 'object') {
          Object.values(parsed).forEach((match) => {
            if (match?.id) {
              activeMap[match.id] = match;
            }
          });
        }
      }
    } catch (error) {
      console.warn(
        'Invalid live match local cache:',
        error
      );
    }

    const status = String(
      updatedMatch.status || ''
    ).toLowerCase();

    const isLive =
      status === 'running' ||
      status === 'live' ||
      status === 'in_progress' ||
      status === 'active';

    if (isLive) {
      activeMap[matchId] = {
        ...(activeMap[matchId] || {}),
        ...updatedMatch,
      };
    } else {
      delete activeMap[matchId];
    }

    localStorage.setItem(
      'sems_active_live_matches',
      JSON.stringify(activeMap)
    );

    window.dispatchEvent(
      new Event('storage')
    );

    window.dispatchEvent(
      new CustomEvent('sems_matches_updated', {
        detail: {
          matchId,
          match: updatedMatch,
        },
      })
    );

    return updatedMatch;
  } catch (error) {
    console.error(
      `Failed to save score for match ${matchId}:`,
      error
    );

    throw error;
  }
},
  // Fetch real basketball player stats from Supabase
  async getBasketballMatchPlayers(matchId) {
    try {
      const res = await api.get(`/coordinator/matches/${matchId}/players`);
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend getBasketballMatchPlayers fallback:', e);
    }
    return [];
  },

  // Get public completed match results from Supabase database
  async getPublicResults() {
    try {
      const res = await api.get('/results');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (e) {
      console.warn('getPublicResults endpoint fallback:', e.message);
      return null;
    }
  },

  // Get public match schedules from Supabase database
  async getPublicSchedules() {
    try {
      const res = await api.get('/schedules');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (e) {
      console.warn('getPublicSchedules endpoint fallback:', e.message);
      return null;
    }
  },

  // Get public live matches from Supabase database
  async getPublicLiveMatches() {
    try {
      const res = await api.get('/live-matches');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (e) {
      console.warn('getPublicLiveMatches endpoint error:', e.message);
      return null;
    }
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
      await api.post(
  `/coordinator/matches/${matchId}/complete`,
  winnerData
);
    } catch (e) {
      console.warn('Backend completeMatch API fallback:', e);
    }

    // Remove completed match from active match schedule list
    const updatedList = matches.filter((m) => m.id !== matchId);
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
        } catch (e) { }
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

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('sems_matches_updated'));
    window.dispatchEvent(new Event('sems_results_updated'));
    return completedObj;
  },


  // Fetch all registrations from backend server PostgreSQL DB
  async getRegistrations() {
    const user = this.getCurrentUser();
    const sportKey = resolveSportKey(user?.assignedSport || 'badminton');

    try {
      const res = await api.get('/coordinator/registrations');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend getRegistrations error:', e.message);
    }

    const key = `sems_participants_${sportKey}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    return [];
  },

  // Save registrations array to localStorage
  saveRegistrations(registrations) {
    const user = this.getCurrentUser();
    if (!user) return;
    const sportKey = resolveSportKey(user.assignedSport || 'badminton');
    const key = `sems_participants_${sportKey}`;

    localStorage.setItem(key, JSON.stringify(registrations || []));
    window.dispatchEvent(new Event('sems_registrations_updated'));
    window.dispatchEvent(new Event('storage'));
  },

  // Create registration and persist to backend server PostgreSQL DB
  async createRegistration(regData) {
    const sportKey = resolveSportKey(regData.sportId || regData.sportName || regData.sport || 'badminton');

    try {
      const res = await api.post('/public/register-event', {
        eventId: regData.eventId || 'DEFAULT',
        sportId: sportKey,
        participantData: {
          fullName: regData.studentName || regData.name || regData.fullName || 'Athlete',
          fatherName: regData.fatherName || 'N/A',
          collegeName: regData.college || 'MPEC',
          department: regData.department || regData.branch || 'Engineering',
          email: regData.email || 'athlete@apex.edu',
          phone: regData.phone || regData.mobile || '+91 98765 43210',
          gender: regData.gender || 'Male',
          emergencyContact: regData.emergencyContact || '+91 98765 43211',
          entryFee: regData.feePaid || 0,
          teamName: regData.teamName || null,
          roster: regData.roster || regData.members || []
        },
        paymentData: {
          razorpayPaymentId: regData.paymentId || `TXN-RP-${Math.floor(100000000000 + Math.random() * 900000000000)}`
        }
      });

      if (res.data && res.data.receipt) {
        window.dispatchEvent(new Event('sems_registrations_updated'));
        return res.data.receipt;
      }
    } catch (e) {
      console.warn('Backend register-event error:', e?.response?.data || e.message);
    }

    const key = `sems_participants_${sportKey}`;
    let currentParticipants = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) currentParticipants = JSON.parse(saved);
    } catch (e) { }

    const updatedParticipants = [regData, ...currentParticipants.filter(r => r.id !== regData.id)];
    localStorage.setItem(key, JSON.stringify(updatedParticipants));
    window.dispatchEvent(new Event('sems_registrations_updated'));
    return regData;
  },

  // Delete registration by ID (Coordinator & User persistence)
  async deleteRegistration(id) {
    const user = this.getCurrentUser();
    const sportKey = resolveSportKey(user?.assignedSport || '');

    // Add to deleted set
    try {
      const deletedArr = JSON.parse(localStorage.getItem('sems_deleted_registration_ids') || '[]');
      if (!deletedArr.includes(id)) {
        deletedArr.push(id);
        localStorage.setItem('sems_deleted_registration_ids', JSON.stringify(deletedArr));
      }
    } catch (e) { }

    // Remove from sems_participants_${sportKey}
    if (sportKey) {
      const key = `sems_participants_${sportKey}`;
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          const filtered = parsed.filter(r => r.id !== id);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch (e) { }
    }

    // Remove from sems_registrations
    try {
      const savedGlobal = localStorage.getItem('sems_registrations');
      if (savedGlobal) {
        const parsed = JSON.parse(savedGlobal);
        const filtered = parsed.filter(r => r.id !== id);
        localStorage.setItem('sems_registrations', JSON.stringify(filtered));
      }
    } catch (e) { }

    // Backend server call
    try {
      await api.delete(`/coordinator/registrations/${id}`);
    } catch (e) {
      console.warn('Backend deleteRegistration fallback:', e);
    }

    window.dispatchEvent(new Event('sems_registrations_updated'));
    window.dispatchEvent(new Event('storage'));
  },


  // --- COORDINATOR EVENT MANAGEMENT API METHODS ---

  // Get events for logged-in coordinator's assigned sport (combining Server + LocalStorage)
  async getEvents() {
    const user = this.getCurrentUser();
    if (!user) return [];

    let deletedSet = new Set();
    try {
      const deletedArr = JSON.parse(localStorage.getItem('sems_deleted_event_ids') || '[]');
      deletedSet = new Set(deletedArr);
    } catch (e) { }

    const assignedKey = resolveSportKey(user.assignedSport || '');

    let serverEvents = [];
    try {
      const res = await api.get('/coordinator/events');
      if (res.data && Array.isArray(res.data)) {
        serverEvents = res.data;
      }
    } catch (e) {
      console.warn('Backend events API fallback to localStorage', e);
    }

    const key = `sems_coord_events_${assignedKey}`;
    const keyUnderscore = `sems_coord_events_${assignedKey.replace(/-/g, '_')}`;

    let combinedLocal = [];
    [key, keyUnderscore].forEach((k) => {
      const saved = localStorage.getItem(k);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            combinedLocal.push(...parsed);
          }
        } catch (err) { }
      }
    });

    const uniqueMap = new Map();
    // Load local storage events
    combinedLocal.forEach((e) => {
      if (e && e.id && !deletedSet.has(e.id)) {
        uniqueMap.set(e.id, { ...e, sportId: user.assignedSport, sportName: user.sportName });
      }
    });
    // Merge server events
    serverEvents.forEach((e) => {
      if (e && e.id && !deletedSet.has(e.id)) {
        const eKey = resolveSportKey(e.sportId || e.assignedSport || e.sportName || '');
        if (!eKey || eKey === assignedKey) {
          const existing = uniqueMap.get(e.id) || {};
          uniqueMap.set(e.id, { ...existing, ...e, sportId: user.assignedSport, sportName: user.sportName });
        }
      }
    });

    return Array.from(uniqueMap.values());
  },

  // Save events array to localStorage
  saveEvents(events) {
    const user = this.getCurrentUser();
    if (!user) return;
    const sportKey = resolveSportKey(user.assignedSport || 'badminton');
    const key = `sems_coord_events_${sportKey}`;

    try {
      const prevSaved = JSON.parse(localStorage.getItem(key) || '[]');
      const newIds = new Set((events || []).map(e => e?.id).filter(Boolean));
      const deletedArr = JSON.parse(localStorage.getItem('sems_deleted_event_ids') || '[]');
      let updatedDeleted = false;

      (prevSaved || []).forEach(oldEv => {
        if (oldEv && oldEv.id && !newIds.has(oldEv.id) && !deletedArr.includes(oldEv.id)) {
          deletedArr.push(oldEv.id);
          updatedDeleted = true;
        }
      });

      if (updatedDeleted) {
        localStorage.setItem('sems_deleted_event_ids', JSON.stringify(deletedArr));
      }
    } catch (e) { }

    localStorage.setItem(key, JSON.stringify(events || []));
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
    } catch (e) {
      console.warn('Backend delete event fallback', e);
    }

    // Add ID to globally deleted event IDs set in localStorage
    try {
      const deletedArr = JSON.parse(localStorage.getItem('sems_deleted_event_ids') || '[]');
      if (!deletedArr.includes(id)) {
        deletedArr.push(id);
        localStorage.setItem('sems_deleted_event_ids', JSON.stringify(deletedArr));
      }
    } catch (e) { }

    // Purge event safely from ALL sems_coord_events_* keys in localStorage
    try {
      const eventKeys = Object.keys(localStorage).filter(k => k && k.toLowerCase().startsWith('sems_coord_events_'));
      eventKeys.forEach(key => {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            const filtered = list.filter((e) => e && e.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch (e) { }
      });
    } catch (e) { }

    window.dispatchEvent(new Event('sems_events_updated'));
    window.dispatchEvent(new Event('storage'));
  },

  // Clear all coordinator created events across localStorage
  clearAllEvents() {
    try {
      const eventKeys = Object.keys(localStorage).filter(k => k && k.toLowerCase().startsWith('sems_coord_events_'));
      const deletedArr = [];
      eventKeys.forEach(key => {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            list.forEach(e => {
              if (e && e.id) deletedArr.push(e.id);
            });
          }
          localStorage.removeItem(key);
        } catch (e) { }
      });

      const existingDeleted = JSON.parse(localStorage.getItem('sems_deleted_event_ids') || '[]');
      const combinedDeleted = Array.from(new Set([...existingDeleted, ...deletedArr]));
      localStorage.setItem('sems_deleted_event_ids', JSON.stringify(combinedDeleted));
    } catch (e) { }

    window.dispatchEvent(new Event('sems_events_updated'));
    window.dispatchEvent(new Event('storage'));
  },

  // One-time auto purge of old test events so user portal starts clean
  purgeOldTestEvents() {
    if (!localStorage.getItem('sems_events_purged_v3')) {
      this.clearAllEvents();
      localStorage.setItem('sems_events_purged_v3', 'true');
    }
  },

  // Get all Published & Closed coordinator events across all sports from production database
  async getPublicEvents() {
    let deletedSet = new Set();
    try {
      const deletedArr = JSON.parse(localStorage.getItem('sems_deleted_event_ids') || '[]');
      deletedSet = new Set(deletedArr);
    } catch (e) { }

    try {
      const res = await api.get('/public/events');
      if (res.data && Array.isArray(res.data)) {
        const currentDate = new Date();
        return res.data
          .filter((e) => e && e.id && !deletedSet.has(e.id))
          .map((e) => {
            let status = e.status || 'Published';
            if (e.regEndDate && new Date(e.regEndDate + 'T23:59:59') < currentDate) {
              status = 'Closed';
            }
            return {
              ...e,
              status,
              availableSlots: Math.max(0, (e.maxRegistrations || 64) - (e.registeredCount || 0))
            };
          });
      }
    } catch (e) {
      console.warn('Error fetching public events from server:', e.message);
    }

    return [];
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
      } catch (err) { }
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

