import axios from 'axios';
import { superCoordinatorApi, ALL_12_SPORTS, ALL_COLLEGES } from './superCoordinatorApi';
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
  USER: 'sems_admin_user'
};

const DEFAULT_ADMIN_USER = {
  id: 'ADM-1001',
  name: 'System Administrator',
  username: 'admin',
  email: 'admin.sports@mpec.ac.in',
  role: 'ADMIN',
  status: 'ACTIVE'
};

export const adminApi = {
  // ── Authentication ────────────────────────────────────────────────────────
  isAuthenticated: () => {
    return Boolean(localStorage.getItem(STORAGE_KEYS.TOKEN));
  },

  getCurrentUser: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_USER;
    } catch (e) {
      return DEFAULT_ADMIN_USER;
    }
  },

  login: async (username, password) => {
    try {
      const res = await api.post('/admin/login', { username, password });
      if (res.data && res.data.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
        const userObj = res.data.user || DEFAULT_ADMIN_USER;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));

        await adminApi.addAuditLog({
          user: userObj.name || 'System Administrator',
          role: 'ADMIN',
          action: 'Admin Login',
          target: 'Admin logged into central Admin Portal'
        });

        return { success: true, user: userObj };
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

  updateProfile: async (profileData) => {
    const currentUser = adminApi.getCurrentUser();
    const updated = {
      ...currentUser,
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));

    await adminApi.addAuditLog({
      user: updated.name,
      role: 'ADMIN',
      action: 'Profile Updated',
      target: 'Updated Admin profile details'
    });

    return updated;
  },

  changePassword: async (currentPassword, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long!');
    }
    await adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'Password Changed',
      target: 'Admin updated account password configuration'
    });
    return true;
  },

  // ── Central Dashboard Statistics & Audit Trail ───────────────────────────
  getDashboardStats: async () => {
    try {
      const res = await fetch(apiUrl('/admin/dashboard-stats'));
      if (res.ok) {
        const stats = await res.json();
        return stats;
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats from API:', err);
    }
    return {
      totalRegistrations: 0,
      totalCoordinatorEvents: 0,
      activeCoordinators: 0,
      inactiveCoordinators: 0,
      totalPRUploads: 0,
      totalParticipants: 0,
      totalGames: 12,
      completedResults: 0,
      pendingResults: 0,
      activeAnnouncements: 0
    };
  },

  // ── Coordinator Events Management ─────────────────────────────────────────
  getCoordinatorEvents: async () => {
    return await superCoordinatorApi.getCoordinatorEvents();
  },

  deleteCoordinatorEvent: async (eventId) => {
    const token = localStorage.getItem('sems_admin_token') || localStorage.getItem('sems_coordinator_token');
    const res = await fetch(apiUrl(`/admin/coordinator-events/${eventId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to delete coordinator event (HTTP ${res.status})`);
    }

    await adminApi.addAuditLog({
      user: 'System Administrator',
      role: 'ADMIN',
      action: 'Coordinator Event Deleted',
      target: `Deleted coordinator event registration #${eventId}`
    }).catch(() => {});

    return true;
  },

  // ── Student & Team Registrations Management ──────────────────────────────
  getRegistrations: async () => {
    try {
      const res = await fetch(apiUrl('/admin/registrations'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.error('Error fetching registrations from DB:', err);
    }
    return [];
  },

  deleteRegistration: async (id, reason) => {
    try {
      const res = await fetch(apiUrl(`/admin/registrations/${id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'Registration Deleted',
          target: `Deleted registration #${id} from database. Reason: ${reason || 'Admin Action'}`
        });
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to delete registration from database');
    } catch (err) {
      console.error('Error deleting registration from DB:', err);
      throw err;
    }
  },

  // ── PR Media Management ──────────────────────────────────────────────────
  getPRMediaFolders: async () => {
    try {
      const res = await fetch(apiUrl('/admin/pr-media/folders'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.error('Error fetching PR media folders from DB:', err);
    }
    return [];
  },

  getPRMediaFiles: async (folderId = null) => {
    try {
      const res = await fetch(apiUrl('/admin/pr-media/files'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (folderId) {
            return data.filter(f => String(f.folderId) === String(folderId));
          }
          return data;
        }
      }
    } catch (err) {
      console.error('Error fetching PR media files from DB:', err);
    }
    return [];
  },

  deletePRMediaFile: async (fileId) => {
    try {
      const res = await fetch(apiUrl(`/admin/pr-media/files/${fileId}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'PR Deleted',
          target: `Deleted PR Media file #${fileId} from database`
        });
        return true;
      }
    } catch (err) {
      console.error('Error deleting PR media file from DB:', err);
    }
    return true;
  },

  deletePRFolder: async (folderId) => {
    try {
      const res = await fetch(apiUrl(`/admin/pr-media/folders/${folderId}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'PR Folder Deleted',
          target: `Deleted PR Media folder #${folderId} from database`
        });
        return true;
      }
    } catch (err) {
      console.error('Error deleting PR folder from DB:', err);
    }
    return true;
  },

  // ── Coordinator Management ────────────────────────────────────────────────
  getCoordinators: async () => {
    try {
      const res = await fetch(apiUrl('/admin/coordinators'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.error('Error fetching coordinators from DB:', e);
    }
    return [];
  },

  saveCoordinator: async (coordData) => {
    try {
      const res = await fetch(apiUrl('/admin/coordinators'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coordData)
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: coordData.id ? 'Coordinator Updated' : 'Coordinator Created',
          target: `${coordData.id ? 'Updated' : 'Created'} ${coordData.role} account for ${coordData.name} in database`
        });
        return await adminApi.getCoordinators();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Server failed to save coordinator in database');
    } catch (e) {
      console.error('Error saving coordinator to DB:', e);
      throw e;
    }
  },

  deleteCoordinator: async (id) => {
    try {
      const res = await fetch(apiUrl(`/admin/coordinators/${id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'Coordinator Deleted',
          target: `Permanently deleted coordinator account ID ${id} from database`
        });
        return await adminApi.getCoordinators();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Server failed to delete coordinator from database');
    } catch (e) {
      console.error('Error deleting coordinator from DB:', e);
      throw e;
    }
  },

  toggleCoordinatorStatus: async (coordInput) => {
    const coordId = typeof coordInput === 'object' ? coordInput.id : coordInput;
    const coordUser = typeof coordInput === 'object' ? coordInput.username : null;
    const list = await adminApi.getCoordinators();
    
    const target = list.find(c => 
      String(c.id) === String(coordId) || 
      (coordUser && c.username?.toLowerCase() === coordUser.toLowerCase())
    ) || (typeof coordInput === 'object' ? coordInput : null);

    const targetUsername = target?.username || coordUser || (typeof coordInput === 'string' ? coordInput : null);
    const newStatus = target?.status === 'Active' ? 'Inactive' : 'Active';
    const fetchId = coordId || targetUsername;

    try {
      const res = await fetch(apiUrl(`/admin/coordinators/${fetchId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          username: targetUsername
        })
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: newStatus === 'Inactive' ? 'Coordinator Deactivated' : 'Coordinator Activated',
          target: `Changed account status of ${target?.name || fetchId} to ${newStatus} in database`
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

    const targetUsername = target?.username || coordUser || (typeof coordInput === 'string' ? coordInput : null);
    const fetchId = coordId || targetUsername;

    try {
      const res = await fetch(apiUrl(`/admin/coordinators/${fetchId}/reset-password`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          username: targetUsername
        })
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'Password Reset',
          target: `Reset password for coordinator account ${targetUsername || fetchId} in database`
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
    try {
      const res = await fetch(apiUrl('/admin/announcements'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.error('Error fetching announcements from DB:', err);
    }
    return [];
  },

  saveAnnouncement: async (annData) => {
    try {
      const res = await fetch(apiUrl('/admin/announcements'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annData)
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: annData.id ? 'Announcement Updated' : 'Announcement Created',
          target: `Saved announcement "${annData.title}" to database`
        });
        return await adminApi.getAnnouncements();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to save announcement to database');
    } catch (err) {
      console.error('Error saving announcement to DB:', err);
      throw err;
    }
  },

  toggleAnnouncementPublish: async (id) => {
    try {
      const res = await fetch(apiUrl(`/admin/announcements/${id}/publish`), {
        method: 'PATCH'
      });
      if (res.ok) {
        return await adminApi.getAnnouncements();
      }
    } catch (err) {
      console.error('Error toggling announcement publish in DB:', err);
    }
    return await adminApi.getAnnouncements();
  },

  deleteAnnouncement: async (id) => {
    try {
      const res = await fetch(apiUrl(`/admin/announcements/${id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'Announcement Deleted',
          target: `Deleted announcement ID ${id} from database`
        });
        return await adminApi.getAnnouncements();
      }
    } catch (err) {
      console.error('Error deleting announcement from DB:', err);
    }
    return await adminApi.getAnnouncements();
  },

  // ── Results & Leaderboard Management ─────────────────────────────────────
  getResults: async () => {
    try {
      const res = await fetch(apiUrl('/super-coordinator/leaderboard'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.error('Error fetching match results from DB:', err);
    }
    return [];
  },

  getDeclaredResults: async () => {
    return await adminApi.getResults();
  },

  deleteResult: async (id) => {
    try {
      const res = await fetch(apiUrl(`/super-coordinator/leaderboard/${id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'Result Deleted',
          target: `Deleted match result & leaderboard entry #${id} from database`
        });
        return await adminApi.getResults();
      }
    } catch (err) {
      console.error('Error deleting match result from DB:', err);
    }
    return await adminApi.getResults();
  },

  saveResult: async (resultData) => {
    try {
      const res = await fetch(apiUrl('/super-coordinator/leaderboard'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData)
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'Result Updated',
          target: `Saved match result for ${resultData.sportName || 'Sport'} in database`
        });
        return await adminApi.getResults();
      }
    } catch (err) {
      console.error('Error saving match result to DB:', err);
    }
    return await adminApi.getResults();
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  getAuditLogs: async () => {
    try {
      const res = await fetch(apiUrl('/admin/audit-logs'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.error('Error fetching audit logs from DB:', err);
    }
    return [];
  },

  addAuditLog: async (logData) => {
    try {
      await fetch(apiUrl('/admin/audit-logs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch (err) {
      console.error('Error adding audit log to DB:', err);
    }
  },

  // ── System Settings ───────────────────────────────────────────────────────
  getSettings: async () => {
    try {
      const res = await fetch(apiUrl('/admin/settings'));
      if (res.ok) {
        const data = await res.json();
        if (data) return data;
      }
    } catch (err) {
      console.error('Error fetching system settings from DB:', err);
    }
    return {
      maintenanceMode: false,
      allowRegistrations: true,
      currentFestYear: 2026,
      collegeName: 'Maharana Pratap Engineering College (MPEC)',
      adminEmail: 'admin.sports@mpec.ac.in',
      contactPhone: '+91 98765 00000',
      maxPdfSizeMB: 10
    };
  },

  updateSettings: async (newSettings) => {
    try {
      const res = await fetch(apiUrl('/admin/settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        await adminApi.addAuditLog({
          user: 'System Administrator',
          role: 'ADMIN',
          action: 'Settings Updated',
          target: 'Updated system configuration in database'
        });
        const data = await res.json();
        return data.settings || newSettings;
      }
    } catch (err) {
      console.error('Error updating system settings in DB:', err);
    }
    return newSettings;
  }
};
