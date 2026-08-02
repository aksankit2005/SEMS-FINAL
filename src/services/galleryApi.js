import axios from 'axios';

// API Base URL & Fallback Credentials
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PR_ADMIN_USER = import.meta.env.VITE_PR_ADMIN_USERNAME || 'pr_admin';
const PR_ADMIN_PASS = import.meta.env.VITE_PR_ADMIN_PASSWORD || 'password123';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization JWT Header if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pr_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Initial empty fallback events & media
const INITIAL_FALLBACK_EVENTS = [];
const INITIAL_FALLBACK_MEDIA = [];

// Helper to manage localStorage mock state when API server is not running
const getLocalEvents = () => {
  const stored = localStorage.getItem('sems_events_data');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('sems_events_data', JSON.stringify(INITIAL_FALLBACK_EVENTS));
  return INITIAL_FALLBACK_EVENTS;
};

const saveLocalEvents = (events) => {
  localStorage.setItem('sems_events_data', JSON.stringify(events));
};

const getLocalMedia = () => {
  const stored = localStorage.getItem('sems_media_data');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('sems_media_data', JSON.stringify(INITIAL_FALLBACK_MEDIA));
  return INITIAL_FALLBACK_MEDIA;
};

const saveLocalMedia = (media) => {
  localStorage.setItem('sems_media_data', JSON.stringify(media));
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
      }
      return res.data;
    } catch (err) {
      // Local fallback auth check
      if (username === PR_ADMIN_USER && password === PR_ADMIN_PASS) {
        const mockToken = 'mock_jwt_token_pr_coordinator_2026';
        const mockUser = { username: PR_ADMIN_USER, role: 'pr_coordinator' };
        localStorage.setItem('pr_auth_token', mockToken);
        localStorage.setItem('pr_user', JSON.stringify(mockUser));
        return { success: true, token: mockToken, user: mockUser };
      }
      throw new Error(err.response?.data?.message || 'Invalid PR Coordinator Credentials');
    }
  },

  // Logout PR Coordinator
  logoutPR() {
    localStorage.removeItem('pr_auth_token');
    localStorage.removeItem('pr_user');
  },

  // Check PR Auth status
  isPRAuthenticated() {
    return !!localStorage.getItem('pr_auth_token');
  },

  // GET /api/events - List all events with media counts
  async getEvents() {
    try {
      const res = await api.get('/events');
      return res.data;
    } catch (err) {
      // Fallback
      const events = getLocalEvents();
      const media = getLocalMedia();
      return events.map((ev) => {
        const evMedia = media.filter((m) => Number(m.event_id) === Number(ev.id));
        return {
          ...ev,
          photos_count: evMedia.filter((m) => m.media_type === 'image').length,
          videos_count: evMedia.filter((m) => m.media_type === 'video').length,
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
        photos: eventMedia.filter((m) => m.media_type === 'image'),
        videos: eventMedia.filter((m) => m.media_type === 'video'),
      };
    }
  },

  // POST /api/events - Create new event
  async createEvent(eventData) {
    try {
      const res = await api.post('/events', eventData);
      return res.data;
    } catch (err) {
      const events = getLocalEvents();
      const newEvent = {
        id: Date.now(),
        event_name: eventData.event_name,
        event_date: eventData.event_date,
        cover_image: eventData.cover_image,
        description: eventData.description || '',
        created_at: new Date().toISOString(),
        photos_count: 0,
        videos_count: 0,
      };
      const updated = [newEvent, ...events];
      saveLocalEvents(updated);
      return newEvent;
    }
  },

  // PUT /api/events/:id - Edit existing event
  async updateEvent(id, eventData) {
    try {
      const res = await api.put(`/events/${id}`, eventData);
      return res.data;
    } catch (err) {
      const events = getLocalEvents();
      const updated = events.map((e) =>
        Number(e.id) === Number(id) ? { ...e, ...eventData } : e
      );
      saveLocalEvents(updated);
      return updated.find((e) => Number(e.id) === Number(id));
    }
  },

  // DELETE /api/events/:id - Delete event and cascade delete media
  async deleteEvent(id) {
    try {
      const res = await api.delete(`/events/${id}`);
      return res.data;
    } catch (err) {
      const events = getLocalEvents();
      const media = getLocalMedia();
      saveLocalEvents(events.filter((e) => Number(e.id) !== Number(id)));
      saveLocalMedia(media.filter((m) => Number(m.event_id) !== Number(id)));
      return { success: true, message: 'Event deleted successfully' };
    }
  },

  // POST /api/media/upload - Upload media item
  async uploadMedia(mediaData) {
    try {
      const res = await api.post('/media/upload', mediaData);
      return res.data;
    } catch (err) {
      const media = getLocalMedia();
      const newMedia = {
        id: Date.now(),
        event_id: Number(mediaData.event_id),
        media_type: mediaData.media_type,
        title: mediaData.title,
        media_url: mediaData.media_url,
        uploaded_by: 'PR Coordinator',
        uploaded_at: new Date().toISOString(),
      };
      const updated = [newMedia, ...media];
      saveLocalMedia(updated);
      return newMedia;
    }
  },

  // GET /api/media/event/:eventId - Get media for event
  async getMediaByEventId(eventId) {
    try {
      const res = await api.get(`/media/event/${eventId}`);
      return res.data;
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
        photos: list.filter((m) => m.media_type === 'image'),
        videos: list.filter((m) => m.media_type === 'video'),
      };
    } catch (err) {
      const media = getLocalMedia();
      const eventMedia = media.filter((m) => Number(m.event_id) === Number(eventId));
      return {
        all: eventMedia,
        photos: eventMedia.filter((m) => m.media_type === 'image'),
        videos: eventMedia.filter((m) => m.media_type === 'video'),
      };
    }
  },

  // DELETE /api/media/:id - Delete single media item
  async deleteMedia(id) {
    try {
      const res = await api.delete(`/media/${id}`);
      return res.data;
    } catch (err) {
      const media = getLocalMedia();
      const updated = media.filter((m) => Number(m.id) !== Number(id));
      saveLocalMedia(updated);
      return { success: true, message: 'Media item deleted successfully' };
    }
  },

  // GET Stats summary for PR Dashboard
  async getDashboardStats() {
    try {
      const events = await this.getEvents();
      let totalPhotos = 0;
      let totalVideos = 0;
      const media = getLocalMedia();
      
      totalPhotos = media.filter((m) => m.media_type === 'image').length;
      totalVideos = media.filter((m) => m.media_type === 'video').length;

      return {
        totalEvents: events.length,
        totalPhotos,
        totalVideos,
        recentUploads: media.slice(0, 5),
      };
    } catch (err) {
      const events = getLocalEvents();
      const media = getLocalMedia();
      return {
        totalEvents: events.length,
        totalPhotos: media.filter((m) => m.media_type === 'image').length,
        totalVideos: media.filter((m) => m.media_type === 'video').length,
        recentUploads: media.slice(0, 5),
      };
    }
  },
};
