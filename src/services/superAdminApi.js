/**
 * Super Admin API Service
 * Handles authentication, coordinator management, audit logs, event/sports control,
 * and demo state persistence using localStorage.
 */

const STORAGE_KEYS = {
  TOKEN: 'sems_superadmin_token',
  USER: 'sems_superadmin_user',
  COORDINATORS: 'sems_superadmin_coordinators',
  AUDIT_LOGS: 'sems_superadmin_audit_logs',
  SPORTS: 'sems_superadmin_sports',
  EVENTS: 'sems_superadmin_events',
  SETTINGS: 'sems_superadmin_settings'
};

// Initial Seed Data for Demo & Testing
const INITIAL_COORDINATORS = [
  {
    id: 'COORD-101',
    name: 'Ankit Kumar',
    email: 'ankit.cricket@mpec.ac.in',
    phone: '+91 98765 43210',
    role: 'SPORTS_COORDINATOR',
    assignedSport: 'Cricket',
    sportId: 'cricket',
    status: 'ACTIVE',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'COORD-102',
    name: 'Priya Sharma',
    email: 'priya.badminton@mpec.ac.in',
    phone: '+91 98765 43211',
    role: 'SPORTS_COORDINATOR',
    assignedSport: 'Badminton',
    sportId: 'badminton',
    status: 'ACTIVE',
    createdAt: '2026-08-01T11:30:00Z'
  },
  {
    id: 'COORD-103',
    name: 'Dr. R. K. Gupta',
    email: 'rk.gupta@mpec.ac.in',
    phone: '+91 98765 43212',
    role: 'COLLEGE_HEAD',
    college: 'MPEC Kanpur',
    status: 'ACTIVE',
    createdAt: '2026-07-25T09:00:00Z'
  },
  {
    id: 'COORD-104',
    name: 'Sneha Patel',
    email: 'sneha.pr@mpec.ac.in',
    phone: '+91 98765 43213',
    role: 'PR_MEMBER',
    assignedDepartment: 'Media & PR',
    status: 'ACTIVE',
    createdAt: '2026-08-02T14:15:00Z'
  },
  {
    id: 'COORD-105',
    name: 'Vikram Singh',
    email: 'vikram.football@mpec.ac.in',
    phone: '+91 98765 43214',
    role: 'SPORTS_COORDINATOR',
    assignedSport: 'Football',
    sportId: 'football',
    status: 'DISABLED',
    createdAt: '2026-08-03T16:45:00Z'
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-5001',
    coordinatorName: 'Super Admin',
    role: 'SUPER_ADMIN',
    action: 'COORDINATOR_CREATED',
    entity: 'Coordinator',
    details: 'Created Badminton Coordinator account for Priya Sharma',
    timestamp: '2026-08-08T10:15:00Z'
  },
  {
    id: 'LOG-5002',
    coordinatorName: 'Ankit Kumar',
    role: 'SPORTS_COORDINATOR',
    action: 'SCORE_UPDATED',
    entity: 'Match',
    details: 'Updated Cricket Semi-Final score (MPEC vs PSIT)',
    timestamp: '2026-08-08T11:45:00Z'
  },
  {
    id: 'LOG-5003',
    coordinatorName: 'Dr. R. K. Gupta',
    role: 'COLLEGE_HEAD',
    action: 'REGISTRATION_VERIFIED',
    entity: 'Student',
    details: 'Verified team roster for MPEC Football Squad',
    timestamp: '2026-08-08T14:20:00Z'
  },
  {
    id: 'LOG-5004',
    coordinatorName: 'Super Admin',
    role: 'SUPER_ADMIN',
    action: 'PASSWORD_RESET',
    entity: 'Coordinator',
    details: 'Reset password for Sneha Patel (PR Member)',
    timestamp: '2026-08-08T15:10:00Z'
  }
];

const INITIAL_SPORTS = [
  { id: 'cricket', name: 'Cricket', icon: '🏏', isTeamSport: true, maxTeamSize: 11, category: 'Outdoor' },
  { id: 'football', name: 'Football', icon: '⚽', isTeamSport: true, maxTeamSize: 11, category: 'Outdoor' },
  { id: 'badminton', name: 'Badminton', icon: '🏸', isTeamSport: false, maxTeamSize: 2, category: 'Indoor' },
  { id: 'basketball', name: 'Basketball', icon: '🏀', isTeamSport: true, maxTeamSize: 5, category: 'Outdoor' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓', isTeamSport: false, maxTeamSize: 2, category: 'Indoor' },
  { id: 'chess', name: 'Chess', icon: '♟️', isTeamSport: false, maxTeamSize: 1, category: 'Indoor' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', isTeamSport: true, maxTeamSize: 6, category: 'Outdoor' },
  { id: 'kabaddi', name: 'Kabaddi', icon: '🤼', isTeamSport: true, maxTeamSize: 7, category: 'Indoor/Outdoor' }
];

const INITIAL_EVENTS = [
  {
    id: 'EVT-2026',
    name: 'SEMS Annual Sports Fest 2026',
    year: 2026,
    status: 'LIVE',
    startDate: '2026-08-01',
    endDate: '2026-08-15',
    totalRegistrations: 1245,
    totalRevenue: 245000
  },
  {
    id: 'EVT-2025',
    name: 'SEMS Sports Tournament 2025',
    year: 2025,
    status: 'COMPLETED',
    startDate: '2025-08-01',
    endDate: '2025-08-12',
    totalRegistrations: 980,
    totalRevenue: 195000
  }
];

// Helper to get from storage or set fallback
const getStorageItem = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setStorageItem = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const superAdminApi = {
  // --- Auth Methods ---
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  getCurrentUser: () => {
    return getStorageItem(STORAGE_KEYS.USER, {
      username: 'superadmin',
      name: 'Super Admin / HOD',
      role: 'SUPER_ADMIN',
      email: 'hod.sports@mpec.ac.in'
    });
  },

  login: (username, password) => {
    if (username === 'superadmin' && (password === 'admin123' || password === 'superadmin')) {
      const user = {
        username: 'superadmin',
        name: 'Super Admin / HOD',
        role: 'SUPER_ADMIN',
        email: 'hod.sports@mpec.ac.in',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'mock_superadmin_jwt_token_' + Date.now());
      setStorageItem(STORAGE_KEYS.USER, user);
      
      // Record Audit Log for Super Admin Login
      superAdminApi.addAuditLog({
        coordinatorName: 'Super Admin',
        role: 'SUPER_ADMIN',
        action: 'SUPER_ADMIN_LOGIN',
        entity: 'Auth',
        details: 'Super Admin logged into administration portal'
      });

      return { success: true, user };
    }
    return { success: false, message: 'Invalid Super Admin credentials! Default is superadmin / admin123' };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // --- Coordinator Management Methods ---
  getCoordinators: () => {
    return getStorageItem(STORAGE_KEYS.COORDINATORS, INITIAL_COORDINATORS);
  },

  addCoordinator: (data) => {
    const coordinators = superAdminApi.getCoordinators();
    const newCoord = {
      id: `COORD-${100 + coordinators.length + 1}`,
      name: data.name,
      email: data.email,
      phone: data.phone || '+91 90000 00000',
      role: data.role || 'SPORTS_COORDINATOR',
      assignedSport: data.assignedSport || 'General',
      sportId: data.sportId || 'general',
      college: data.college || 'MPEC Kanpur',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    const updated = [newCoord, ...coordinators];
    setStorageItem(STORAGE_KEYS.COORDINATORS, updated);

    // Record Audit Log
    superAdminApi.addAuditLog({
      coordinatorName: 'Super Admin',
      role: 'SUPER_ADMIN',
      action: 'COORDINATOR_CREATED',
      entity: 'Coordinator',
      details: `Created new ${data.role} account for ${data.name} (${data.assignedSport || 'General'})`
    });

    return newCoord;
  },

  updateCoordinator: (id, data) => {
    const coordinators = superAdminApi.getCoordinators();
    const updated = coordinators.map(c => c.id === id ? { ...c, ...data } : c);
    setStorageItem(STORAGE_KEYS.COORDINATORS, updated);

    superAdminApi.addAuditLog({
      coordinatorName: 'Super Admin',
      role: 'SUPER_ADMIN',
      action: 'COORDINATOR_UPDATED',
      entity: 'Coordinator',
      details: `Updated profile details for coordinator ID ${id}`
    });

    return updated;
  },

  resetCoordinatorPassword: (id, newPassword) => {
    const coordinators = superAdminApi.getCoordinators();
    const target = coordinators.find(c => c.id === id);
    if (!target) return false;

    superAdminApi.addAuditLog({
      coordinatorName: 'Super Admin',
      role: 'SUPER_ADMIN',
      action: 'PASSWORD_RESET',
      entity: 'Coordinator',
      details: `Reset password for coordinator ${target.name} (${target.email})`
    });

    return true;
  },

  toggleCoordinatorStatus: (id) => {
    const coordinators = superAdminApi.getCoordinators();
    let updatedStatus = 'ACTIVE';
    const updated = coordinators.map(c => {
      if (c.id === id) {
        updatedStatus = c.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        return { ...c, status: updatedStatus };
      }
      return c;
    });
    setStorageItem(STORAGE_KEYS.COORDINATORS, updated);

    const target = coordinators.find(c => c.id === id);
    superAdminApi.addAuditLog({
      coordinatorName: 'Super Admin',
      role: 'SUPER_ADMIN',
      action: updatedStatus === 'DISABLED' ? 'ACCOUNT_DISABLED' : 'ACCOUNT_ENABLED',
      entity: 'Coordinator',
      details: `Changed account status of ${target ? target.name : id} to ${updatedStatus}`
    });

    return updated;
  },

  // --- Audit Logs Methods ---
  getAuditLogs: () => {
    return getStorageItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog: (logData) => {
    const logs = superAdminApi.getAuditLogs();
    const newLog = {
      id: `LOG-${5000 + logs.length + 1}`,
      coordinatorName: logData.coordinatorName || 'Super Admin',
      role: logData.role || 'SUPER_ADMIN',
      action: logData.action,
      entity: logData.entity || 'System',
      details: logData.details,
      timestamp: new Date().toISOString()
    };
    const updated = [newLog, ...logs];
    setStorageItem(STORAGE_KEYS.AUDIT_LOGS, updated);
    return newLog;
  },

  // --- Sports & Events Methods ---
  getSports: () => {
    return getStorageItem(STORAGE_KEYS.SPORTS, INITIAL_SPORTS);
  },

  addSport: (sportData) => {
    const sports = superAdminApi.getSports();
    const newSport = {
      id: sportData.name.toLowerCase().replace(/\s+/g, '-'),
      name: sportData.name,
      icon: sportData.icon || '🏅',
      isTeamSport: sportData.isTeamSport ?? true,
      maxTeamSize: sportData.maxTeamSize || 5,
      category: sportData.category || 'General'
    };
    const updated = [...sports, newSport];
    setStorageItem(STORAGE_KEYS.SPORTS, updated);

    superAdminApi.addAuditLog({
      coordinatorName: 'Super Admin',
      role: 'SUPER_ADMIN',
      action: 'SPORT_ADDED',
      entity: 'Sport',
      details: `Added new sport: ${sportData.name}`
    });

    return newSport;
  },

  getEvents: () => {
    return getStorageItem(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  },

  addEvent: (eventData) => {
    const events = superAdminApi.getEvents();
    const newEvent = {
      id: `EVT-${eventData.year || 2026}`,
      name: eventData.name,
      year: parseInt(eventData.year) || 2026,
      status: 'DRAFT',
      startDate: eventData.startDate || '2026-09-01',
      endDate: eventData.endDate || '2026-09-15',
      totalRegistrations: 0,
      totalRevenue: 0
    };
    const updated = [newEvent, ...events];
    setStorageItem(STORAGE_KEYS.EVENTS, updated);

    superAdminApi.addAuditLog({
      coordinatorName: 'Super Admin',
      role: 'SUPER_ADMIN',
      action: 'EVENT_CREATED',
      entity: 'Event',
      details: `Created new tournament event: ${eventData.name}`
    });

    return newEvent;
  },

  // --- System Settings Methods ---
  getSettings: () => {
    return getStorageItem(STORAGE_KEYS.SETTINGS, {
      maintenanceMode: false,
      allowRegistrations: true,
      currentYear: 2026,
      collegeName: 'Maharana Pratap Engineering College (MPEC)',
      adminContactEmail: 'hod.sports@mpec.ac.in'
    });
  },

  updateSettings: (newSettings) => {
    const current = superAdminApi.getSettings();
    const updated = { ...current, ...newSettings };
    setStorageItem(STORAGE_KEYS.SETTINGS, updated);

    superAdminApi.addAuditLog({
      coordinatorName: 'Super Admin',
      role: 'SUPER_ADMIN',
      action: 'SETTINGS_UPDATED',
      entity: 'SystemSettings',
      details: 'Updated global system configuration settings'
    });

    return updated;
  }
};
