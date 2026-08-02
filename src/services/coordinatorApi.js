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


  // Read matches for assigned sport from localStorage with default initial state
  async getMatches() {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Unauthenticated');

    const cacheKey = `sems_coord_matches_${user.assignedSport}`;
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const mockNames = [
            '1', '2', 'a', 'b', 'player 1', 'player 2', 'player 3', 'player 4', 'team 1', 'team 2', 'team a', 'team b', 'albert', 'romi',
            'aarav sharma (mpec)', 'rohan gupta (mips)', 'ankur dixit (mpcps)', 'aditya singh (mpec)',
            'aagaz khan (mpcps kn142)', 'shiv prakash (mpcps kn142)', 'kapil verma (mpcps kn142)', 'anubhav sachan (mpcps kn142)',
            'kapil verma', 'anubhav sachan', 'team a', 'team b', 'team 1', 'team 2', 'player / team a', 'player / team b'
          ];
          const cleaned = parsed.filter((m) => {
            if (!m) return false;
            const t1 = (m.team1 || '').trim().toLowerCase();
            const t2 = (m.team2 || '').trim().toLowerCase();
            return !mockNames.includes(t1) && !mockNames.includes(t2);
          });
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(cacheKey, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      } catch (e) {}
    }

    // Default initial fixtures if empty
    const defaults = [];

    localStorage.setItem(cacheKey, JSON.stringify(defaults));
    return defaults;
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
      const res = await api.get('/public/matches');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.warn('Public matches endpoint fallback to scanning localStorage keys', e);
    }

    const publicMatches = [];
    const mockNames = [
      '1', '2', 'a', 'b', 'player 1', 'player 2', 'player 3', 'player 4', 'team 1', 'team 2', 'team a', 'team b', 'albert', 'romi',
      'aarav sharma (mpec)', 'rohan gupta (mips)', 'ankur dixit (mpcps)', 'aditya singh (mpec)',
      'aagaz khan (mpcps kn142)', 'shiv prakash (mpcps kn142)', 'kapil verma (mpcps kn142)', 'anubhav sachan (mpcps kn142)',
      'kapil verma', 'anubhav sachan', 'team a', 'team b', 'team 1', 'team 2', 'player / team a', 'player / team b'
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sems_coord_matches_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            const sportId = key.replace('sems_coord_matches_', '');
            list.forEach((m) => {
              if (m) {
                const t1 = (m.team1 || '').trim().toLowerCase();
                const t2 = (m.team2 || '').trim().toLowerCase();
                if (mockNames.includes(t1) || mockNames.includes(t2)) return;
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

    // Save updated match in match list & purge completed match from active schedule list
    const updatedList = matches.filter((m) => m.id !== matchId && m.status !== 'COMPLETED' && m.status !== 'FINISHED');
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
    const key = `sems_coord_events_${user.assignedSport}`;
    localStorage.setItem(key, JSON.stringify(events));
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

    const newEvent = {
      id: eventData.id || `EVT-${user.assignedSport.toUpperCase()}-${Date.now()}`,
      title: eventData.title || `${user.sportName} Championship 2026`,
      sportId: user.assignedSport,
      sportName: user.sportName,
      coverImage: eventData.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      description: eventData.description || '',
      regStartDate: eventData.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventData.regEndDate || '2026-08-30',
      tournStartDate: eventData.tournStartDate || '2026-09-01',
      tournEndDate: eventData.tournEndDate || '2026-09-05',
      entryFee: Number(eventData.entryFee || 0),
      teamSize: eventData.teamSize || '1 Player',
      maxRegistrations: Number(eventData.maxRegistrations || 64),
      registeredCount: Number(eventData.registeredCount || 0),
      venue: eventData.venue || 'Central Arena',
      category: eventData.category || 'Open',
      status: eventData.status || 'Draft',
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
    try {
      const res = await api.get('/public/events');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.warn('Public events endpoint fallback to scanning localStorage keys', e);
    }

    const publicList = [];
    const currentDate = new Date();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sems_coord_events_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            list.forEach((e) => {
              if (e && (e.status === 'Published' || e.status === 'Closed')) {
                const sId = (e.sportId || '').toLowerCase();
                const sName = (e.sportName || '').toLowerCase();
                const title = (e.title || '').toLowerCase();
                if (e.id === 'EVT-BADMINTON-001' || e.id === 'EVT-CRICKET-001' || e.id === 'EVT-FOOTBALL-001') return;

                let status = e.status;
                if (e.regEndDate && new Date(e.regEndDate + 'T23:59:59') < currentDate) {
                  status = 'Closed';
                }
                publicList.push({
                  ...e,
                  status,
                  availableSlots: Math.max(0, (e.maxRegistrations || 64) - e.registeredCount)
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

