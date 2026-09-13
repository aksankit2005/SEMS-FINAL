// Frontend Service for Super Coordinator (President / Event Host Portal)
import { galleryApi } from './galleryApi';
import { apiUrl } from './apiConfig';

export const ALL_12_SPORTS = [
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓', coordinator: 'Amit Sharma', coordinatorEmail: 'tt.coord@apex.edu', category: 'Indoor', squadSize: '1 - 2 Players' },
  { id: 'badminton', name: 'Badminton', icon: '🏸', coordinator: 'Priya Verma', coordinatorEmail: 'badminton.coord@apex.edu', category: 'Indoor', squadSize: '1 - 2 Players' },
  { id: 'chess', name: 'Chess', icon: '♟️', coordinator: 'Rahul Saxena', coordinatorEmail: 'chess.coord@apex.edu', category: 'Mind Sport', squadSize: '1 Player' },
  { id: 'cricket', name: 'Cricket', icon: '🏏', coordinator: 'Rohan Gupta', coordinatorEmail: 'cricket.coord@apex.edu', category: 'Outdoor', squadSize: '11 - 15 Players' },
  { id: 'football', name: 'Football', icon: '⚽', coordinator: 'Vikramjit Singh', coordinatorEmail: 'football.coord@apex.edu', category: 'Outdoor', squadSize: '5 - 8 Players' },
  { id: 'basketball', name: 'Basketball', icon: '🏀', coordinator: 'Neha Kapoor', coordinatorEmail: 'basketball.coord@apex.edu', category: 'Indoor/Outdoor', squadSize: '5 - 10 Players' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', coordinator: 'Suresh Kumar', coordinatorEmail: 'volleyball.coord@apex.edu', category: 'Outdoor', squadSize: '6 - 10 Players' },
  { id: 'kabaddi', name: 'Kabaddi', icon: '🤼', coordinator: 'Deepak Yadav', coordinatorEmail: 'kabaddi.coord@apex.edu', category: 'Outdoor', squadSize: '7 - 12 Players' },
  { id: 'kho-kho', name: 'Kho-Kho', icon: '🏃', coordinator: 'Anita Singh', coordinatorEmail: 'khokho.coord@apex.edu', category: 'Outdoor', squadSize: '9 - 12 Players' },
  { id: 'athletics', name: 'Athletics', icon: '🏃‍♂️', coordinator: 'Manish Pandey', coordinatorEmail: 'athletics.coord@apex.edu', category: 'Track & Field', squadSize: '1 - 4 Players' },
  { id: 'tug-of-war', name: 'Tug of War', icon: '🪢', coordinator: 'Rajesh Mishra', coordinatorEmail: 'tugofwar.coord@apex.edu', category: 'Outdoor Arena', squadSize: '8 - 10 Players' },
  { id: 'gully-cricket', name: 'Gully Cricket', icon: '🏏', coordinator: 'Alok Tripathi', coordinatorEmail: 'gullycricket.coord@apex.edu', category: 'Street Pitch', squadSize: '5 - 8 Players' }
];

export const ALL_COLLEGES = [
  { id: 'MPEC', name: 'MPEC' },
  { id: 'MIPS', name: 'MIPS' },
  { id: 'MPCPS (KN142)', name: 'MPCPS (KN142)' },
  { id: 'MPCP', name: 'MPCP' },
  { id: 'MPCPS (BPharmacy)', name: 'MPCPS (BPharmacy)' },
  { id: 'MPDC', name: 'MPDC' },
  { id: 'MPCN&PS', name: 'MPCN&PS' },
  { id: 'MPAMC', name: 'MPAMC' },
  { id: 'MPCAMS', name: 'MPCAMS' },
  { id: 'EXTERNAL', name: 'EXTERNAL' }
];

export { matchesCollegeFilter } from '../utils/collegeHelper';

const getAuthHeaders = () => {
  const token = localStorage.getItem('sems_super_coord_token') || localStorage.getItem('sems_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const superCoordinatorApi = {
  // Get Sports & Assigned Coordinators from Backend
  getCoordinators: async () => {
    try {
      const res = await fetch(apiUrl('/super-coordinator/coordinators'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {}
    return ALL_12_SPORTS;
  },

  // Get Coordinator Event Creation History — from real database API & local storage
  getCoordinatorEvents: async () => {
    let serverEvents = [];
    try {
      const res = await fetch(apiUrl('/super-coordinator/events'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) serverEvents = data;
      }
    } catch (e) {}

    // Collect any local/offline events from localStorage across all sports
    const localEvents = [];
    try {
      const allSportKeys = [
        'badminton', 'table-tennis', 'cricket', 'football', 'basketball', 
        'volleyball', 'kabaddi', 'kho-kho', 'athletics', 'tug-of-war', 
        'gully-cricket', 'chess'
      ];
      
      const seenIds = new Set(serverEvents.map((e) => e.id));
      const deletedIds = new Set(JSON.parse(localStorage.getItem('sems_deleted_event_ids') || '[]'));

      allSportKeys.forEach((key) => {
        const sportEvents = JSON.parse(localStorage.getItem(`sems_coord_events_${key}`) || '[]');
        sportEvents.forEach((ev) => {
          if (ev && ev.id && !seenIds.has(ev.id) && !deletedIds.has(ev.id)) {
            seenIds.add(ev.id);
            localEvents.push({
              id: ev.id,
              sportId: ev.sportId || key,
              sportName: ev.sportName || key.replace(/-/g, ' ').toUpperCase(),
              eventTitle: ev.title || ev.eventTitle || `${ev.sportName || key} Championship 2026`,
              coordinatorName: ev.contactInfo?.name || ev.coordinatorName || 'Coordinator',
              coordinatorEmail: ev.contactInfo?.email || ev.coordinatorEmail || '',
              createdDate: ev.createdDate || ev.regStartDate || new Date().toISOString().split('T')[0],
              regStartDate: ev.regStartDate || '',
              regEndDate: ev.regEndDate || '',
              tournStartDate: ev.tournStartDate || '',
              tournEndDate: ev.tournEndDate || '',
              venue: ev.venue || 'Sports Arena',
              teamFee: Number(ev.entryFee || ev.teamFee || 0),
              minPlayers: ev.minPlayers || 1,
              maxPlayers: ev.maxPlayers || 1,
              category: ev.category || 'Open',
              status: ev.status || 'Published',
              registeredCount: Number(ev.registeredCount || 0),
              maxRegistrations: Number(ev.maxRegistrations || 64)
            });
          }
        });
      });
    } catch (e) {}

    return [...serverEvents, ...localEvents];
  },

  // Get Master Participants — strictly from real PostgreSQL database API
  getMasterParticipants: async () => {
    try {
      const res = await fetch(apiUrl('/super-coordinator/participants'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {}
    return [];
  },

  // Get PR Event Folders (Created by PR Members)
  getPREventFolders: async () => {
    try {
      return await galleryApi.getEvents();
    } catch (e) {
      return [];
    }
  },

  // Get Media Items inside a specific PR Event Folder
  getPRFolderMedia: async (folderId) => {
    try {
      return await galleryApi.getEventMedia(folderId);
    } catch (e) {
      return { all: [], photos: [], videos: [] };
    }
  },

  // Get All PR Uploaded Media Photos across all folders
  getPRPhotos: async () => {
    try {
      const events = await galleryApi.getEvents();
      const allMedia = [];
      for (const ev of events) {
        const evMedia = await galleryApi.getMediaByEventId(ev.id);
        if (Array.isArray(evMedia)) {
          evMedia.forEach((m) => {
            allMedia.push({
              id: m.id || `PR-${Date.now()}`,
              eventId: ev.id,
              eventTitle: ev.event_name,
              sportId: (ev.event_name || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-'),
              sportName: ev.event_name || 'Sports Highlight',
              title: m.title || 'PR Shot',
              url: m.media_url,
              mediaType: m.media_type || 'image',
              uploadedBy: m.uploaded_by || 'PR Team Member',
              uploadDate: m.uploaded_at ? new Date(m.uploaded_at).toLocaleString() : 'Recent'
            });
          });
        }
      }
      return allMedia;
    } catch (e) {
      return [];
    }
  },

  // Get Inter-College Leaderboard Entries strictly from Backend PostgreSQL DB
  getLeaderboardEntries: async () => {
    try {
      const res = await fetch(apiUrl('/super-coordinator/leaderboard'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.error('Error fetching leaderboard entries:', e);
    }
    return [];
  },

  // Save Inter-College Leaderboard Entry to Backend PostgreSQL DB
  saveLeaderboardEntries: async (entries, latestEntry) => {
    if (!latestEntry) return true;
    try {
      const res = await fetch(apiUrl('/super-coordinator/leaderboard'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(latestEntry)
      });
      if (res.ok) {
        window.dispatchEvent(new Event('sems_leaderboard_updated'));
        return await res.json();
      }
    } catch (e) {
      console.error('Error saving leaderboard entry to DB:', e);
    }
    return null;
  },

  // Delete Inter-College Leaderboard Entry from Backend PostgreSQL DB
  deleteLeaderboardEntry: async (entryId) => {
    try {
      const res = await fetch(apiUrl(`/super-coordinator/leaderboard/${entryId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        window.dispatchEvent(new Event('sems_leaderboard_updated'));
        return true;
      }
    } catch (e) {
      console.error('Error deleting leaderboard entry:', e);
    }
    return false;
  },

  // Get Hero Slides from Backend PostgreSQL DB
  getHeroSlides: async () => {
    try {
      const res = await fetch(apiUrl('/super-coordinator/hero-slides'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.error('Error fetching hero slides from DB:', e);
    }
    return null;
  },

  // Save Hero Slides to Backend PostgreSQL DB
  saveHeroSlides: async (slides) => {
    try {
      const res = await fetch(apiUrl('/super-coordinator/hero-slides'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(slides)
      });
      if (res.ok) {
        window.dispatchEvent(new Event('sems_slides_updated'));
        return await res.json();
      }
    } catch (e) {
      console.error('Error saving hero slides to DB:', e);
    }
    return null;
  },

  changePassword: async (newPass) => {
    try {
      const user = JSON.parse(localStorage.getItem('sems_super_coord_user') || '{}');
      const res = await fetch(apiUrl('/super-coordinator/change-password'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPass, username: user.username })
      });
      const data = await res.json();
      return { ok: res.ok, message: data.message || 'Password update completed' };
    } catch (e) {
      console.error('Error updating password in DB:', e);
      return { ok: false, message: 'Server connection failed while updating password' };
    }
  },

  deleteRegistration: async (id) => {
    try {
      const res = await fetch(apiUrl(`/admin/master-data/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
      const fbRes = await fetch(apiUrl(`/admin/registrations/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (fbRes.ok) return await fbRes.json();
    } catch (e) {
      console.error('Error deleting registration:', e);
    }
    return false;
  },

  deleteMasterDataParticipant: async (id) => {
    try {
      const res = await fetch(apiUrl(`/admin/master-data/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to delete participant from Master Data');
    } catch (e) {
      console.error('Error deleting master data participant:', e);
      throw e;
    }
  },

  bulkDeleteMasterData: async (ids) => {
    try {
      const res = await fetch(apiUrl('/admin/master-data/bulk'), {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids })
      });
      if (res.ok) return await res.json();
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to bulk delete master data records');
    } catch (e) {
      console.error('Error bulk deleting master data records:', e);
      throw e;
    }
  }
};
