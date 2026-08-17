import axios from 'axios';
import { API_BASE_URL } from './apiConfig';
import { GALLERY_EVENTS, GALLERY_MEDIA } from '../data/galleryData';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization JWT Header if available
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('pr_auth_token') ||
    localStorage.getItem('sems_super_coord_token') ||
    localStorage.getItem('sems_admin_token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Initial fallback data for read queries
const INITIAL_FALLBACK_EVENTS = GALLERY_EVENTS;
const INITIAL_FALLBACK_MEDIA = GALLERY_MEDIA;

const getLocalEvents = () => {
  try {
    const stored = localStorage.getItem('sems_events_data');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return INITIAL_FALLBACK_EVENTS;
};

const getLocalMedia = () => {
  try {
    const stored = localStorage.getItem('sems_media_data');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return INITIAL_FALLBACK_MEDIA;
};

// API Services Object
export const galleryApi = {
  // PR Coordinator Login
  async loginPR(username, password) {
    try {
      const res = await api.post('/pr/login', { username, password });
      if (res.data && res.data.token) {
        localStorage.setItem('pr_auth_token', res.data.token);
        localStorage.setItem('pr_user', JSON.stringify(res.data.user || { username, role: 'pr_coordinator' }));
        window.dispatchEvent(new Event('sems-auth-change'));
      }
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Invalid PR Coordinator Credentials');
    }
  },

  // Logout PR Coordinator
  logoutPR() {
    localStorage.removeItem('pr_auth_token');
    localStorage.removeItem('pr_user');
    window.dispatchEvent(new Event('sems-auth-change'));
  },

  // Check PR Auth status
  isPRAuthenticated() {
    return !!(localStorage.getItem('pr_auth_token') || localStorage.getItem('sems_admin_token') || localStorage.getItem('sems_super_coord_token'));
  },

  // Get Cloudinary upload signature from backend
  async getCloudinarySignature(folder = 'sems_gallery') {
    const isSuperCoord = !!localStorage.getItem('sems_super_coord_token');
    const isAdmin = !!localStorage.getItem('sems_admin_token');
    const endpoint = isSuperCoord
      ? '/super-coordinator/cloudinary-signature'
      : isAdmin
      ? '/admin/cloudinary-signature'
      : '/pr/cloudinary-signature';

    try {
      const res = await api.get(endpoint, { params: { folder } });
      return res.data;
    } catch (err) {
      try {
        const altEndpoint = isSuperCoord
          ? '/admin/cloudinary-signature'
          : isAdmin
          ? '/pr/cloudinary-signature'
          : '/admin/cloudinary-signature';
        const res2 = await api.get(altEndpoint, { params: { folder } });
        return res2.data;
      } catch (err2) {
        throw new Error(err.response?.data?.message || err2.response?.data?.message || 'Failed to obtain Cloudinary upload signature');
      }
    }
  },

  // GET /api/events - List all events with media counts
  async getEvents() {
    try {
      const res = await api.get('/events');
      if (Array.isArray(res.data)) {
        localStorage.setItem('sems_events_data', JSON.stringify(res.data));
        return res.data;
      }
      return res.data;
    } catch (err) {
      const events = getLocalEvents();
      const media = getLocalMedia();
      return events.map((ev) => {
        const evMedia = media.filter((m) => Number(m.event_id) === Number(ev.id));
        return {
          ...ev,
          photos_count: evMedia.filter((m) => (m.media_type || '').toLowerCase() === 'image').length,
          videos_count: evMedia.filter((m) => (m.media_type || '').toLowerCase() === 'video').length,
        };
      });
    }
  },

  // GET /api/events/:id - Get event details and associated media
  async getEventById(id) {
    try {
      const res = await api.get(`/events/${id}`);
      return res.data;
    } catch (err) {
      const events = getLocalEvents();
      const media = getLocalMedia();
      const event = events.find((e) => Number(e.id) === Number(id));
      if (!event) throw new Error('Event not found');
      const eventMedia = media.filter((m) => Number(m.event_id) === Number(id));
      return {
        ...event,
        media: eventMedia,
        photos: eventMedia.filter((m) => (m.media_type || '').toLowerCase() === 'image'),
        videos: eventMedia.filter((m) => (m.media_type || '').toLowerCase() === 'video'),
      };
    }
  },

  // POST /api/events - Create new event
  async createEvent(eventData) {
    try {
      const res = await api.post('/events', eventData);
      window.dispatchEvent(new Event('sems_events_updated'));
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create event album');
    }
  },

  // PUT /api/events/:id - Edit existing event
  async updateEvent(id, eventData) {
    try {
      const res = await api.put(`/events/${id}`, eventData);
      window.dispatchEvent(new Event('sems_events_updated'));
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update event details');
    }
  },

  // DELETE /api/events/:id - Delete event and cascade delete media
  async deleteEvent(id) {
    try {
      const res = await api.delete(`/events/${id}`);
      window.dispatchEvent(new Event('sems_events_updated'));
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete event');
    }
  },

  // POST /api/media/upload - Upload media item
  async uploadMedia(mediaData) {
    try {
      const res = await api.post('/media/upload', mediaData);
      window.dispatchEvent(new Event('sems_events_updated'));
      window.dispatchEvent(new Event('sems_media_updated'));
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to save media record');
    }
  },

  // GET /api/media - Get all media across all events
  async getAllMedia() {
    try {
      const res = await api.get('/media');
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return res.data?.media || [];
    } catch (err) {
      const media = getLocalMedia();
      return media;
    }
  },

  // GET /api/media/event/:eventId - Get media for event
  async getMediaByEventId(eventId) {
    try {
      const res = await api.get(`/media/event/${eventId}`);
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return res.data?.media || [];
    } catch (err) {
      const media = getLocalMedia();
      return media.filter((m) => Number(m.event_id) === Number(eventId));
    }
  },

  // Helper method for Event Media Management
  async getEventMedia(eventId) {
    try {
      const res = await api.get(`/media/event/${eventId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.media || []);
      return {
        all: list,
        photos: list.filter((m) => (m.media_type || '').toLowerCase() === 'image'),
        videos: list.filter((m) => (m.media_type || '').toLowerCase() === 'video'),
      };
    } catch (err) {
      const media = getLocalMedia();
      const eventMedia = media.filter((m) => Number(m.event_id) === Number(eventId));
      return {
        all: eventMedia,
        photos: eventMedia.filter((m) => (m.media_type || '').toLowerCase() === 'image'),
        videos: eventMedia.filter((m) => (m.media_type || '').toLowerCase() === 'video'),
      };
    }
  },

  // DELETE /api/media/:id - Delete single media item
  async deleteMedia(id) {
    try {
      const res = await api.delete(`/media/${id}`);
      window.dispatchEvent(new Event('sems_media_updated'));
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete media item');
    }
  },

  // GET Stats summary for PR Dashboard
  async getDashboardStats() {
    try {
      const events = await this.getEvents();
      let totalPhotos = 0;
      let totalVideos = 0;
      const allRecent = [];

      for (const ev of events.slice(0, 10)) {
        totalPhotos += ev.photos_count || 0;
        totalVideos += ev.videos_count || 0;
      }

      // Fetch recent media items
      const recentMediaRes = await api.get('/admin/pr-media/files').catch(() => null);
      if (recentMediaRes && Array.isArray(recentMediaRes.data)) {
        return {
          totalEvents: events.length,
          totalPhotos,
          totalVideos,
          recentUploads: recentMediaRes.data.slice(0, 8),
        };
      }

      return {
        totalEvents: events.length,
        totalPhotos,
        totalVideos,
        recentUploads: [],
      };
    } catch (err) {
      const events = getLocalEvents();
      const media = getLocalMedia();
      return {
        totalEvents: events.length,
        totalPhotos: media.filter((m) => (m.media_type || '').toLowerCase() === 'image').length,
        totalVideos: media.filter((m) => (m.media_type || '').toLowerCase() === 'video').length,
        recentUploads: media.slice(0, 5),
      };
    }
  },
};
