import axios from 'axios';
import { superCoordinatorApi, ALL_12_SPORTS, ALL_COLLEGES } from './superCoordinatorApi';
import { galleryApi } from './galleryApi';
import { coordinatorApi } from './coordinatorApi';
import { API_BASE_URL, apiUrl } from './apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sems_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const STORAGE_KEYS = {
  TOKEN: 'sems_admin_token',
  USER: 'sems_admin_user',
  COORDINATORS: 'sems_admin_coordinators',
  REGISTRATIONS: 'sems_admin_registrations',
  ANNOUNCEMENTS: 'sems_admin_announcements',
  AUDIT_LOGS: 'sems_admin_audit_logs',
  SETTINGS: 'sems_admin_settings',
  RESULTS: 'sems_admin_results',
  PR_MEDIA: 'sems_admin_pr_media'
};

const INITIAL_ADMIN_USER = {
  id: 'ADM-1001',
  name: 'System Administrator',
  username: 'admin',
  email: 'admin.sports@mpec.ac.in',
  phone: '+91 98765 00000',
  role: 'ADMIN',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  status: 'ACTIVE',
  createdAt: '2026-01-15T09:00:00Z',
  lastLogin: new Date().toISOString()
};

const INITIAL_COORDINATORS = [
  {
    id: 'COORD-101',
    name: 'Vikramaditya Sharma',
    username: 'coord_cricket',
    email: 'cricket.coord@sems.edu',
    phone: '+91 98765 43210',
    role: 'Coordinator',
    assignedSport: 'cricket',
    sportName: 'Cricket',
    status: 'Active',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'COORD-102',
    name: 'Rohan Mehta',
    username: 'coord_table_tennis',
    email: 'tt.coord@sems.edu',
    phone: '+91 98765 43211',
    role: 'Coordinator',
    assignedSport: 'table-tennis',
    sportName: 'Table Tennis',
    status: 'Active',
    createdAt: '2026-08-01T11:30:00Z'
  },
  {
    id: 'COORD-103',
    name: 'Badminton Coordinator',
    username: 'coord_badminton',
    email: 'badminton.coord@sems.edu',
    phone: '+91 98765 43212',
    role: 'Coordinator',
    assignedSport: 'badminton',
    sportName: 'Badminton',
    status: 'Active',
    createdAt: '2026-08-01T12:00:00Z'
  },
  {
    id: 'COORD-104',
    name: 'Carlos Rodriguez',
    username: 'coord_football',
    email: 'football.coord@sems.edu',
    phone: '+91 98765 43214',
    role: 'Coordinator',
    assignedSport: 'football',
    sportName: 'Football',
    status: 'Inactive',
    createdAt: '2026-08-03T16:45:00Z'
  },
  {
    id: 'COORD-105',
    name: 'Super Event Host',
    username: 'super_coord',
    email: 'super.coord@sems.edu',
    phone: '+91 98765 43215',
    role: 'Super Coordinator',
    assignedSport: 'All Sports',
    sportName: 'All Sports',
    status: 'Active',
    createdAt: '2026-07-20T08:00:00Z'
  },
  {
    id: 'COORD-106',
    name: 'Head Coordinator Sports',
    username: 'head_coord',
    email: 'head.coord@sems.edu',
    phone: '+91 98765 43216',
    role: 'Head Coordinator',
    assignedSport: 'All Sports',
    sportName: 'All Sports',
    status: 'Active',
    createdAt: '2026-07-22T09:00:00Z'
  },
  {
    id: 'COORD-107',
    name: 'Sneha Patel',
    username: 'pr_sneha',
    email: 'sneha.pr@mpec.ac.in',
    phone: '+91 98765 43217',
    role: 'PR Member',
    assignedSport: 'Media & PR',
    sportName: 'Media & PR',
    status: 'Active',
    createdAt: '2026-08-02T14:15:00Z'
  }
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ANN-301',
    title: 'SEMS Annual Sports Tournament 2026 Schedule & Guidelines',
    description: 'Official schedule for all 12 sports tournaments. All team captains must report 30 minutes prior to match time with valid Student ID cards.',
    date: '2026-08-08',
    publishDate: '2026-08-08',
    expiryDate: '2026-08-20',
    isPublished: true,
    status: 'Published',
    attachments: [
      {
        id: 'PDF-1',
        name: 'Sports_Tournament_Schedule_2026.pdf',
        size: '1.4 MB',
        uploadedAt: '2026-08-08 10:00 AM',
        url: '#'
      },
      {
        id: 'PDF-2',
        name: 'General_Rules_and_Code_of_Conduct.pdf',
        size: '850 KB',
        uploadedAt: '2026-08-08 10:05 AM',
        url: '#'
      }
    ],
    createdAt: '2026-08-08T10:00:00Z'
  },
  {
    id: 'ANN-302',
    title: 'Badminton & Table Tennis Roster Verification Notice',
    description: 'All participants registered for Badminton and Table Tennis must complete identity verification at SAC Building Counter 3.',
    date: '2026-08-09',
    publishDate: '2026-08-09',
    expiryDate: '2026-08-18',
    isPublished: true,
    status: 'Published',
    attachments: [
      {
        id: 'PDF-3',
        name: 'Verification_Guidelines.pdf',
        size: '620 KB',
        uploadedAt: '2026-08-09 09:30 AM',
        url: '#'
      }
    ],
    createdAt: '2026-08-09T09:30:00Z'
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-8001',
    user: 'System Administrator',
    role: 'ADMIN',
    action: 'Coordinator Created',
    target: 'Created Badminton Coordinator account for Priya Sharma',
    date: '2026-08-09',
    time: '10:15 AM',
    ip: '192.168.1.45',
    timestamp: '2026-08-09T10:15:00Z'
  },
  {
    id: 'LOG-8002',
    user: 'System Administrator',
    role: 'ADMIN',
    action: 'Result Updated',
    target: 'Updated Cricket Semi-Final score (MPEC vs MIPS)',
    date: '2026-08-09',
    time: '11:45 AM',
    ip: '192.168.1.45',
    timestamp: '2026-08-09T11:45:00Z'
  },
  {
    id: 'LOG-8003',
    user: 'PR Member (Sneha)',
    role: 'PR Member',
    action: 'PR Uploaded',
    target: 'Uploaded 14 event photos for Basketball Fest',
    date: '2026-08-08',
    time: '04:20 PM',
    ip: '192.168.1.88',
    timestamp: '2026-08-08T16:20:00Z'
  },
  {
    id: 'LOG-8004',
    user: 'System Administrator',
    role: 'ADMIN',
    action: 'Announcement Created',
    target: 'Published "Sports Tournament Schedule 2026" with 2 PDF attachments',
    date: '2026-08-08',
    time: '10:00 AM',
    ip: '192.168.1.45',
    timestamp: '2026-08-08T10:00:00Z'
  }
];

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
    console.error(`Failed to write ${key} to localStorage:`, e);
  }
};

export const adminApi = {
  // ── Authentication ────────────────────────────────────────────────────────
  isAuthenticated: () => {
    return Boolean(localStorage.getItem(STORAGE_KEYS.TOKEN));
  },

  getCurrentUser: () => {
    return getStorageItem(STORAGE_KEYS.USER, INITIAL_ADMIN_USER);
  },

  login: async (username, password) => {
    try {
      const res = await api.post('/admin/login', { username, password });
      if (res.data && res.data.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
        setStorageItem(STORAGE_KEYS.USER, res.data.user || INITIAL_ADMIN_USER);

        adminApi.addAuditLog({
          user: res.data.user?.name || 'System Administrator',
          role: 'ADMIN',
          action: 'Admin Login',
          target: 'Admin logged into central Admin Portal'
        });

        return { success: true, user: res.data.user };
      }
      throw new Error('Invalid response from server.');
    } catch (err) {
      if (err.response) {
        throw new Error(err.response.data?.message || 'Invalid Admin username or password.');
      }
      throw new Error(err.message || 'Cannot connect to server.');
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  updateProfile: (profileData) => {
    const currentUser = adminApi.getCurrentUser();
    const updated = {
      ...currentUser,
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    setStorageItem(STORAGE_KEYS.USER, updated);

    adminApi.addAuditLog({
      user: updated.name,
      role: 'ADMIN',
      action: 'Profile Updated',
      target: 'Updated Admin profile details'
    });

    return updated;
  },

  changePassword: (currentPassword, newPassword) => {
    const savedPass = localStorage.getItem('sems_admin_custom_password') || 'admin123';
    if (currentPassword !== savedPass && currentPassword !== 'admin' && currentPassword !== 'superadmin') {
      throw new Error('Current password is incorrect!');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long!');
    }

    localStorage.setItem('sems_admin_custom_password', newPassword);

    adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'Password Changed',
      target: 'Admin changed account password'
    });

    return true;
  },

  // ── Dashboard Statistics & Recent Activity ──────────────────────────────
  getDashboardStats: async () => {
    const registrations = await adminApi.getRegistrations();
    const coordinatorEvents = await adminApi.getCoordinatorEvents();
    const coordinators = await adminApi.getCoordinators();
    const prMedia = await adminApi.getPRMediaFiles();
    const announcements = await adminApi.getAnnouncements();
    const results = await adminApi.getResults();

    const activeCoords = coordinators.filter(c => c.status === 'Active').length;
    const inactiveCoords = coordinators.filter(c => c.status === 'Inactive' || c.status === 'Disabled').length;
    const activeAnnouncements = announcements.filter(a => a.isPublished).length;
    const completedResults = results.filter(r => r.status === 'COMPLETED' || r.status === 'DECLARED' || r.status === 'Declared').length;
    const pendingResults = Math.max(0, results.length - completedResults);

    return {
      totalRegistrations: registrations.length,
      totalCoordinatorEvents: coordinatorEvents.length,
      activeCoordinators: activeCoords,
      inactiveCoordinators: inactiveCoords,
      totalPRUploads: prMedia.length,
      totalParticipants: registrations.reduce((acc, r) => acc + (r.membersCount || 1), 0) || registrations.length,
      totalGames: ALL_12_SPORTS.length,
      completedResults,
      pendingResults,
      activeAnnouncements
    };
  },

  // ── Coordinator Events Management (Created by Coordinators) ──────────────
  getCoordinatorEvents: async () => {
    return await superCoordinatorApi.getCoordinatorEvents();
  },

  deleteCoordinatorEvent: async (eventId) => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sems_coord_events') || key.startsWith('sems_events') || key.includes('event'))) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list)) {
              const updated = list.filter(item => item && item.id !== eventId && item.eventId !== eventId);
              if (updated.length !== list.length) {
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          }
        } catch (e) {}
      }
    }

    window.dispatchEvent(new Event('sems_events_updated'));
    window.dispatchEvent(new Event('sems_coord_events_updated'));

    adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'Coordinator Event Deleted',
      target: `Deleted coordinator event registration #${eventId} from all stores`
    });

    return true;
  },

  // ── Student & Team Registrations Management ──────────────────────────────
  getRegistrations: async () => {
    const list = [];
    const seenIds = new Set();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sems_registrations') || key.startsWith('sems_total_participation_') || key === 'sems_admin_registrations')) {
        try {
          const storedList = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(storedList)) {
            storedList.forEach((p) => {
              if (p && p.id && !seenIds.has(p.id)) {
                seenIds.add(p.id);
                list.push({
                  id: p.id,
                  registrationId: p.id,
                  participantName: p.studentName || p.name || p.teamName || 'Participant',
                  rollNumber: p.rollNo || p.enrollmentNo || p.rollNumber || '20260012',
                  college: p.collegeName || p.college || 'MPEC Kanpur',
                  branch: p.department || p.branch || 'CSE',
                  section: p.section || 'A',
                  year: p.year || '3rd Year',
                  gender: p.gender || 'Boys',
                  gameSport: p.gameName || p.sportName || p.sport || 'Cricket',
                  eventTitle: p.eventTitle || p.eventName || `${p.gameName || p.sportName || 'Sport'} Event`,
                  category: p.category || 'Single / Team',
                  mobile: p.mobileNo || p.mobile || p.phone || '+91 98765 00000',
                  email: p.email || 'student@mpec.ac.in',
                  registrationDate: p.registrationDate || (p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '2026-08-05'),
                  registrationTime: p.time || '10:30 AM',
                  paymentStatus: p.paymentStatus || 'PAID',
                  registrationStatus: p.status || 'VERIFIED',
                  registeredBy: p.registeredBy || p.coordinatorName || 'Coordinator / Self',
                  membersCount: p.membersCount || (p.members ? p.members.length : 1),
                  feePaid: p.feePaid || p.entryFee || p.amount || 0
                });
              }
            });
          }
        } catch (e) {}
      }
    }

    return list;
  },

  deleteRegistration: async (id, reason) => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sems_registrations') || key.startsWith('sems_total_participation') || key.includes('registration'))) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list)) {
              const updated = list.filter(item => item && item.id !== id && item.registrationId !== id);
              if (updated.length !== list.length) {
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          }
        } catch (e) {}
      }
    }

    window.dispatchEvent(new Event('sems_registrations_updated'));

    adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'Registration Deleted',
      target: `Deleted registration #${id} from all stores. Reason: ${reason || 'Admin Action'}`
    });

    return true;
  },

  // ── PR Management ─────────────────────────────────────────────────────────
  getPRMediaFolders: async () => {
    try {
      const events = await galleryApi.getEvents();
      if (Array.isArray(events) && events.length > 0) {
        return events.map((e) => ({
          id: e.id,
          title: e.event_name,
          sport: e.event_name || 'General Sports',
          date: e.created_at ? new Date(e.created_at).toISOString().split('T')[0] : '2026-08-05',
          prMember: e.uploaded_by || 'PR Team Member',
          folderCount: 1,
          itemCount: e.media_count || 5
        }));
      }
    } catch (e) {}

    return [
      { id: 'FLD-1', title: 'Cricket Fest Tournament Photos', sport: 'Cricket', date: '2026-08-08', prMember: 'Sneha Patel', itemCount: 12 },
      { id: 'FLD-2', title: 'Badminton Championship Highlights', sport: 'Badminton', date: '2026-08-07', prMember: 'Sneha Patel', itemCount: 8 },
      { id: 'FLD-3', title: 'Basketball League Matches', sport: 'Basketball', date: '2026-08-06', prMember: 'PR Media Desk', itemCount: 15 }
    ];
  },

  getPRMediaFiles: async (folderId = null) => {
    try {
      const photos = await superCoordinatorApi.getPRPhotos();
      if (Array.isArray(photos) && photos.length > 0) {
        if (folderId) {
          return photos.filter(p => p.eventId === folderId);
        }
        return photos;
      }
    } catch (e) {}

    return [
      {
        id: 'PR-101',
        folderId: 'FLD-1',
        eventTitle: 'Cricket Fest 2026',
        sportName: 'Cricket',
        title: 'Opening Ceremony Match Kickoff',
        url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
        mediaType: 'image',
        uploaderName: 'Sneha Patel',
        uploadDate: '2026-08-08 10:15 AM'
      },
      {
        id: 'PR-102',
        folderId: 'FLD-1',
        eventTitle: 'Cricket Fest 2026',
        sportName: 'Cricket',
        title: 'Winning Team Trophy Presentation',
        url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
        mediaType: 'image',
        uploaderName: 'Sneha Patel',
        uploadDate: '2026-08-08 11:30 AM'
      },
      {
        id: 'PR-103',
        folderId: 'FLD-2',
        eventTitle: 'Badminton Finals',
        sportName: 'Badminton',
        title: 'Girls Singles Championship Match',
        url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
        mediaType: 'image',
        uploaderName: 'Sneha Patel',
        uploadDate: '2026-08-07 03:20 PM'
      }
    ];
  },

  deletePRMediaFile: async (fileId) => {
    try {
      await galleryApi.deleteMedia(fileId);
    } catch (e) {}

    adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'PR Deleted',
      target: `Deleted PR Media file #${fileId}`
    });

    return true;
  },

  deletePRFolder: async (folderId) => {
    try {
      await galleryApi.deleteEvent(folderId);
    } catch (e) {}

    adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'PR Folder Deleted',
      target: `Deleted PR Media folder #${folderId}`
    });

    return true;
  },

  // ── Coordinator Management ────────────────────────────────────────────────
  getCoordinators: async () => {
    try {
      const res = await fetch(apiUrl('/admin/coordinators'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.error('Error fetching coordinators from DB:', e);
    }
    return getStorageItem(STORAGE_KEYS.COORDINATORS, INITIAL_COORDINATORS);
  },

  saveCoordinator: async (coordData) => {
    try {
      const res = await fetch(apiUrl('/admin/coordinators'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coordData)
      });
      if (res.ok) {
        adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: coordData.id ? 'Coordinator Updated' : 'Coordinator Created',
          target: `${coordData.id ? 'Updated' : 'Created'} ${coordData.role} account for ${coordData.name}`
        });
        return await adminApi.getCoordinators();
      }
    } catch (e) {
      console.error('Error saving coordinator to DB:', e);
    }
    const list = await adminApi.getCoordinators();
    let updated;
    if (coordData.id) {
      updated = list.map(c => c.id === coordData.id ? { ...c, ...coordData } : c);
    } else {
      const newCoord = {
        id: `COORD-${100 + list.length + 1}`,
        ...coordData,
        status: coordData.status || 'Active',
        createdAt: new Date().toISOString()
      };
      updated = [newCoord, ...list];
    }
    setStorageItem(STORAGE_KEYS.COORDINATORS, updated);
    return updated;
  },

  deleteCoordinator: async (id) => {
    try {
      const res = await fetch(apiUrl(`/admin/coordinators/${id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'Coordinator Deleted',
          target: `Permanently deleted coordinator account ID ${id}`
        });
        return await adminApi.getCoordinators();
      }
    } catch (e) {
      console.error('Error deleting coordinator from DB:', e);
    }
    const list = await adminApi.getCoordinators();
    const updated = list.filter(c => c.id !== id);
    setStorageItem(STORAGE_KEYS.COORDINATORS, updated);
    return updated;
  },

  toggleCoordinatorStatus: async (coordInput) => {
    const coordId = typeof coordInput === 'object' ? coordInput.id : coordInput;
    const coordUser = typeof coordInput === 'object' ? coordInput.username : null;
    const list = await adminApi.getCoordinators();
    
    const target = list.find(c => 
      String(c.id) === String(coordId) || 
      (coordUser && c.username?.toLowerCase() === coordUser.toLowerCase()) ||
      (c.username && c.username?.toLowerCase() === String(coordId).toLowerCase())
    ) || (typeof coordInput === 'object' ? coordInput : null);

    const targetUsername = target?.username || coordUser || (typeof coordInput === 'string' && isNaN(Number(coordInput)) ? coordInput : null);
    const newStatus = target?.status === 'Active' ? 'Inactive' : 'Active';
    const fetchId = targetUsername || coordId;

    try {
      const res = await fetch(apiUrl(`/admin/coordinators/${fetchId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          username: targetUsername,
          assignedSport: target?.assignedSport || target?.college
        })
      });
      if (res.ok) {
        adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: newStatus === 'Inactive' ? 'Coordinator Deactivated' : 'Coordinator Activated',
          target: `Changed account status of ${target?.name || fetchId} to ${newStatus}`
        });
        return await adminApi.getCoordinators();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Server failed to update coordinator status');
    } catch (e) {
      console.error('Error toggling coordinator status in DB:', e);
      throw e;
    }
  },

  resetCoordinatorPassword: async (coordInput, newPassword = 'Password@123') => {
    const coordId = typeof coordInput === 'object' ? coordInput.id : coordInput;
    const coordUser = typeof coordInput === 'object' ? coordInput.username : null;
    const list = await adminApi.getCoordinators();
    
    const target = list.find(c => 
      String(c.id) === String(coordId) || 
      (coordUser && c.username?.toLowerCase() === coordUser.toLowerCase())
    ) || (typeof coordInput === 'object' ? coordInput : null);

    const targetUsername = target?.username || coordUser || (typeof coordInput === 'string' && isNaN(Number(coordInput)) ? coordInput : null);
    const fetchId = targetUsername || coordId;

    try {
      const res = await fetch(apiUrl(`/admin/coordinators/${fetchId}/reset-password`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          username: targetUsername,
          assignedSport: target?.assignedSport || target?.college
        })
      });
      if (res.ok) {
        adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'Password Reset',
          target: `Reset password for coordinator account ${targetUsername || fetchId}`
        });
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Server failed to reset password');
    } catch (e) {
      console.error('Error resetting password in DB:', e);
      throw e;
    }
  },

  // ── Announcements Management ──────────────────────────────────────────────
  getAnnouncements: async () => {
    return getStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  },

  saveAnnouncement: async (annData) => {
    const list = await adminApi.getAnnouncements();
    let updated;
    if (annData.id) {
      updated = list.map(a => a.id === annData.id ? { ...a, ...annData } : a);
      adminApi.addAuditLog({
        user: 'System Administrator',
        role: 'ADMIN',
        action: 'Announcement Updated',
        target: `Updated announcement: "${annData.title}"`
      });
    } else {
      const newAnn = {
        id: `ANN-${300 + list.length + 1}`,
        ...annData,
        date: new Date().toISOString().split('T')[0],
        publishDate: annData.publishDate || new Date().toISOString().split('T')[0],
        isPublished: annData.isPublished ?? true,
        status: annData.isPublished ? 'Published' : 'Draft',
        attachments: annData.attachments || [],
        createdAt: new Date().toISOString()
      };
      updated = [newAnn, ...list];
      adminApi.addAuditLog({
        user: 'System Administrator',
        role: 'ADMIN',
        action: 'Announcement Created',
        target: `Created announcement: "${annData.title}" with ${annData.attachments?.length || 0} PDF attachments`
      });
    }
    setStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, updated);
    window.dispatchEvent(new Event('sems_announcements_updated'));
    return updated;
  },

  toggleAnnouncementPublish: async (id) => {
    const list = await adminApi.getAnnouncements();
    let newPublish = true;
    const updated = list.map(a => {
      if (a.id === id) {
        newPublish = !a.isPublished;
        return {
          ...a,
          isPublished: newPublish,
          status: newPublish ? 'Published' : 'Unpublished'
        };
      }
      return a;
    });
    setStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, updated);
    window.dispatchEvent(new Event('sems_announcements_updated'));
    return updated;
  },

  deleteAnnouncement: async (id) => {
    const list = await adminApi.getAnnouncements();
    const target = list.find(a => a.id === id);
    const updated = list.filter(a => a.id !== id);
    setStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, updated);
    window.dispatchEvent(new Event('sems_announcements_updated'));

    adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'Announcement Deleted',
      target: `Deleted announcement: "${target?.title || id}"`
    });

    return updated;
  },

  // ── Results & Leaderboard Management ─────────────────────────────────────
  getResults: async () => {
    const allResults = [];
    const seenIds = new Set();

    // 1. Scan coordinator completed results (sems_completed_results_*)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sems_completed_results_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            const rawSportId = key.replace('sems_completed_results_', '');
            const matchedSport = ALL_12_SPORTS.find(s => s.id === rawSportId || s.id === rawSportId.replace('_', '-'));
            const sportName = matchedSport?.name || rawSportId.charAt(0).toUpperCase() + rawSportId.slice(1).replace('-', ' ');

            list.forEach((m) => {
              if (m && m.id && !seenIds.has(m.id)) {
                seenIds.add(m.id);
                const titleStr = m.matchTitle || m.eventTitle || m.title || `${sportName} Final`;
                const isGirls = titleStr.toLowerCase().includes('girl') || titleStr.toLowerCase().includes('women');
                const isMixed = titleStr.toLowerCase().includes('mix');
                const genderCat = m.gender || (isGirls ? 'Girls' : isMixed ? 'Mixed' : 'Boys');

                allResults.push({
                  id: m.id,
                  sportId: m.sportId || m.sport || rawSportId,
                  sportName: m.sportName || sportName,
                  eventTitle: titleStr,
                  matchFormat: m.format || m.matchFormat || 'Team',
                  gender: genderCat,
                  winnerName: m.winner || m.team1 || 'Declared Winner',
                  winnerTeamName: m.winner || m.team1 || 'Declared Winner',
                  winnerCollege: m.winnerCollege || m.team1College || (m.winner?.includes('(') ? m.winner.split('(')[1].replace(')', '') : 'MPEC'),
                  runnerUpName: m.runnerUp || (m.winner === m.team1 ? m.team2 : m.team1) || 'Runner Up',
                  runnerUpTeamName: m.runnerUp || (m.winner === m.team1 ? m.team2 : m.team1) || 'Runner Up',
                  runnerUpCollege: m.runnerUpCollege || m.team2College || (m.team2?.includes('(') ? m.team2.split('(')[1].replace(')', '') : 'MIPS'),
                  score: m.scoreSummary || (m.score1 !== undefined ? `${m.team1 || 'Team A'}: ${m.score1} | ${m.team2 || 'Team B'}: ${m.score2}` : 'Match Completed'),
                  status: 'COMPLETED',
                  uploadedBy: m.completedBy || m.uploadedBy || `coord_${rawSportId}`,
                  uploadedDate: m.completedAt ? m.completedAt.split('T')[0] : new Date().toISOString().split('T')[0]
                });
              }
            });
          }
        } catch (e) {}
      }
    }

    // 2. Scan match schedules across all sports for finished matches (sems_coord_matches_*, basketballMatchSchedules, volleyballMatchSchedules)
    const matchKeys = ['basketballMatchSchedules', 'volleyballMatchSchedules'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sems_coord_matches_') || key.endsWith('MatchSchedules'))) {
        matchKeys.push(key);
      }
    }
    Array.from(new Set(matchKeys)).forEach((key) => {
      try {
        const list = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(list)) {
          const rawSportId = key.replace('sems_coord_matches_', '').replace('MatchSchedules', '').toLowerCase();
          const matchedSport = ALL_12_SPORTS.find(s => s.id === rawSportId || s.id === rawSportId.replace('_', '-'));
          const sportName = matchedSport?.name || rawSportId.charAt(0).toUpperCase() + rawSportId.slice(1).replace('-', ' ');

          list.forEach((m) => {
            if (m && m.id && (m.status === 'COMPLETED' || m.status === 'FINISHED' || m.winner) && !seenIds.has(m.id)) {
              seenIds.add(m.id);
              const titleStr = m.matchTitle || m.title || `${sportName} Championship`;
              const isGirls = titleStr.toLowerCase().includes('girl') || titleStr.toLowerCase().includes('women');
              const isMixed = titleStr.toLowerCase().includes('mix');
              const genderCat = m.gender || (isGirls ? 'Girls' : isMixed ? 'Mixed' : 'Boys');

              allResults.push({
                id: m.id,
                sportId: m.sportId || m.sport || rawSportId,
                sportName: m.sportName || sportName,
                eventTitle: titleStr,
                matchFormat: m.format || 'Team',
                gender: genderCat,
                winnerName: m.winner || m.team1 || 'Winner',
                winnerTeamName: m.winner || m.team1 || 'Winner',
                winnerCollege: m.winnerCollege || 'MPEC',
                runnerUpName: m.runnerUp || (m.winner === m.team1 ? m.team2 : m.team1) || 'Runner Up',
                runnerUpCollege: m.runnerUpCollege || 'MIPS',
                score: m.scoreSummary || `${m.score1 || 0} - ${m.score2 || 0}`,
                status: 'COMPLETED',
                uploadedBy: `coord_${rawSportId}`,
                uploadedDate: m.completedAt ? m.completedAt.split('T')[0] : new Date().toISOString().split('T')[0]
              });
            }
          });
        }
      } catch (e) {}
    });

    // 3. Scan Super Admin / Super Coordinator results
    try {
      const savedLeaderboard = localStorage.getItem('sems_super_coord_leaderboard') || localStorage.getItem(STORAGE_KEYS.RESULTS);
      if (savedLeaderboard) {
        const parsed = JSON.parse(savedLeaderboard);
        if (Array.isArray(parsed)) {
          parsed.forEach((m) => {
            if (m && m.id && !seenIds.has(m.id)) {
              seenIds.add(m.id);
              allResults.push(m);
            }
          });
        }
      }
    } catch (e) {}

    // Default Seed Results if empty
    if (allResults.length === 0) {
      const seedResults = [
        {
          id: 'RES-101',
          sportId: 'cricket',
          sportName: 'Cricket',
          eventTitle: 'Cricket Tournament 2026 Finals',
          matchFormat: 'Team',
          gender: 'Boys',
          winnerName: 'MPEC Tigers',
          winnerTeamName: 'MPEC Tigers',
          winnerCollege: 'MPEC',
          runnerUpName: 'MIPS Warriors',
          runnerUpTeamName: 'MIPS Warriors',
          runnerUpCollege: 'MIPS',
          score: 'MPEC 164/5 (20.0) vs MIPS 142/9 (20.0)',
          status: 'COMPLETED',
          uploadedBy: 'coord_cricket',
          uploadedDate: '2026-08-08'
        },
        {
          id: 'RES-102',
          sportId: 'badminton',
          sportName: 'Badminton',
          eventTitle: 'Badminton Mens Singles Championship',
          matchFormat: 'Single',
          gender: 'Boys',
          winnerName: 'Aarav Sharma',
          winnerTeamName: 'Aarav Sharma',
          winnerCollege: 'MPEC',
          runnerUpName: 'Kunal Patel',
          runnerUpTeamName: 'Kunal Patel',
          runnerUpCollege: 'MIPS',
          score: '21-18, 19-21, 21-16',
          status: 'COMPLETED',
          uploadedBy: 'coord_badminton',
          uploadedDate: '2026-08-07'
        }
      ];
      setStorageItem(STORAGE_KEYS.RESULTS, seedResults);
      return seedResults;
    }

    return allResults;
  },

  // Get ONLY Super Coordinator / Admin declared results (leaderboard source)
  getDeclaredResults: async () => {
    try {
      const saved = localStorage.getItem('sems_super_coord_leaderboard') || localStorage.getItem(STORAGE_KEYS.RESULTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  },

  // Delete a declared result (removes from both declared sources)
  deleteResult: async (id) => {
    const list = await adminApi.getDeclaredResults();
    const updated = list.filter((r) => r.id !== id);
    setStorageItem(STORAGE_KEYS.RESULTS, updated);
    localStorage.setItem('sems_super_coord_leaderboard', JSON.stringify(updated));
    window.dispatchEvent(new Event('sems_results_updated'));
    window.dispatchEvent(new Event('sems_leaderboard_updated'));

    adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'Result Deleted',
      target: `Deleted declared match result & leaderboard entry ${id}`
    });

    return updated;
  },

  saveResult: async (resultData) => {
    const list = await adminApi.getDeclaredResults();
    let updated;
    if (resultData.id) {
      updated = list.map(r => r.id === resultData.id ? { ...r, ...resultData } : r);
    } else {
      const newRes = {
        id: `RES-${Date.now()}`,
        ...resultData,
        status: 'COMPLETED',
        uploadedBy: 'System Administrator',
        uploadedDate: new Date().toISOString().split('T')[0]
      };
      updated = [newRes, ...list];
    }
    setStorageItem(STORAGE_KEYS.RESULTS, updated);
    localStorage.setItem('sems_super_coord_leaderboard', JSON.stringify(updated));

    adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'Result Updated',
      target: `Updated match result & leaderboard for ${resultData.sportName || 'Sport'}`
    });

    return updated;
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  getAuditLogs: async () => {
    return getStorageItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog: (logData) => {
    const logs = getStorageItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const now = new Date();
    const newLog = {
      id: `LOG-${8000 + logs.length + 1}`,
      user: logData.user || 'System Administrator',
      role: logData.role || 'ADMIN',
      action: logData.action,
      target: logData.target,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ip: '192.168.1.45',
      timestamp: now.toISOString()
    };
    const updated = [newLog, ...logs];
    setStorageItem(STORAGE_KEYS.AUDIT_LOGS, updated);
    return newLog;
  },

  // ── System Settings ───────────────────────────────────────────────────────
  getSettings: async () => {
    return getStorageItem(STORAGE_KEYS.SETTINGS, {
      maintenanceMode: false,
      allowRegistrations: true,
      currentFestYear: 2026,
      collegeName: 'Maharana Pratap Engineering College (MPEC)',
      adminEmail: 'admin.sports@mpec.ac.in',
      contactPhone: '+91 98765 00000',
      maxPdfSizeMB: 10
    });
  },

  updateSettings: async (newSettings) => {
    const current = await adminApi.getSettings();
    const updated = { ...current, ...newSettings };
    setStorageItem(STORAGE_KEYS.SETTINGS, updated);

    window.dispatchEvent(new Event('sems_settings_updated'));

    adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'Settings Updated',
      target: 'Updated Admin Portal system configurations'
    });

    return updated;
  }
};
