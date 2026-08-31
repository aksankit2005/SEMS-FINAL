import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const COMMITTEE_STORAGE_KEY = 'sems_committee_data';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('sems_admin_token');
  const prToken = localStorage.getItem('pr_auth_token');
  const token = adminToken || prToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const DEFAULT_FACULTY_ADVISORS = [
  { id: 'FA-1', name: 'Mr. Susil Kushwaha', role: 'Faculty Advisor', image: '/team/faculty_susil.jpg' },
  { id: 'FA-2', name: 'Mr. Kaushal Maurya', role: 'Co-Faculty Advisor', image: '/team/faculty_kaushal.jpg' },
  { id: 'FA-3', name: 'Mr. Rahul Kumar', role: 'Co-Faculty Advisor', image: '/team/faculty_rahul.jpg' },
  { id: 'FA-4', name: 'Mr. Amit kr Verma', role: 'Co-Faculty Advisor', image: '/team/faculty_amit.jpg' },
  { id: 'FA-5', name: 'Dr. Ajay kr Singh', role: 'Sports Coach', image: '/team/faculty_ajay.jpg' }
];

const DEFAULT_EXECUTIVE_COMMITTEE = [
  { id: 'EC-1', role: 'President', name: 'Praveen Rai', image: '/team/praveen.jpg' },
  { id: 'EC-2', role: 'Vice President', name: 'Harsh Singh', image: '/team/harsh.jpg' },
  { id: 'EC-3', role: 'Technical Head', name: 'Ankit Kumar Singh', image: '/team/ankit.jpg' },
  { id: 'EC-4', role: 'Secretary', name: 'Aditya Singh', image: '/team/aditya.jpg' },
  { id: 'EC-5', role: 'Treasurer', name: 'Shubham Tiwari', image: '/team/shubham.jpg' },
  { id: 'EC-6', role: 'Coordinator', name: 'Gunjan Gupta', image: '/team/gunjan.jpg' },
  { id: 'EC-7', role: 'PR Head', name: 'Vishesh Panday', image: '/team/vishesh.jpg' }
];

const DEFAULT_SESSIONS = [
  {
    id: 'session-2025-26',
    label: '2025-26',
    isActive: true,
    advisors: DEFAULT_FACULTY_ADVISORS,
    executiveCommittee: DEFAULT_EXECUTIVE_COMMITTEE
  },
  {
    id: 'session-2026-27',
    label: '2026-27',
    isActive: false,
    advisors: [],
    executiveCommittee: []
  },
  {
    id: 'session-2027-28',
    label: '2027-28',
    isActive: false,
    advisors: [],
    executiveCommittee: []
  }
];

export const committeeApi = {
  // Get cached sessions synchronously without network delay
  getCachedData: () => {
    try {
      const saved = localStorage.getItem(COMMITTEE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
    } catch (e) {
      return DEFAULT_SESSIONS;
    }
  },

  // Get all sessions with advisors & executive committee from database
  getCommitteeData: async () => {
    try {
      const res = await api.get('/committee');
      if (Array.isArray(res.data) && res.data.length > 0) {
        localStorage.setItem(COMMITTEE_STORAGE_KEY, JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Could not fetch committee from API, loading local fallback:', err.message);
    }

    try {
      const saved = localStorage.getItem(COMMITTEE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
    } catch (e) {
      return DEFAULT_SESSIONS;
    }
  },

  // Save/Create/Update Session
  saveSession: async (sessionData) => {
    try {
      await api.post('/admin/committee/sessions', sessionData);
    } catch (err) {
      console.error('Failed to save session via API:', err.message);
    }
    const updated = await committeeApi.getCommitteeData();
    window.dispatchEvent(new Event('sems_committee_updated'));
    return updated;
  },

  // Delete Session
  deleteSession: async (id) => {
    try {
      await api.delete(`/admin/committee/sessions/${id}`);
    } catch (err) {
      console.error('Failed to delete session via API:', err.message);
    }
    const updated = await committeeApi.getCommitteeData();
    window.dispatchEvent(new Event('sems_committee_updated'));
    return updated;
  },

  // Add / update a member inside a session (type: 'advisors' | 'executiveCommittee')
  saveMember: async (sessionId, type, memberData) => {
    try {
      const payload = {
        id: memberData.id && !memberData.id.startsWith('FA-') && !memberData.id.startsWith('EC-') ? memberData.id : undefined,
        sessionId,
        type,
        name: memberData.name,
        role: memberData.role,
        image: memberData.image,
        publicId: memberData.publicId,
        email: memberData.email || '',
        phone: memberData.phone || '',
        sortOrder: memberData.sortOrder !== undefined && memberData.sortOrder !== '' ? Number(memberData.sortOrder) : undefined
      };
      await api.post('/admin/committee/members', payload);
    } catch (err) {
      console.error('Failed to save committee member via API:', err.message);
    }

    try {
      const saved = localStorage.getItem(COMMITTEE_STORAGE_KEY);
      let data = saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
      const session = data.find((s) => s.id === sessionId) || data[0];
      if (session) {
        let list = session[type] || [];
        const existingIdx = list.findIndex((m) => m.id === memberData.id);
        const orderNum = memberData.sortOrder !== undefined && memberData.sortOrder !== ''
          ? Number(memberData.sortOrder)
          : (existingIdx >= 0 ? (list[existingIdx].sortOrder || existingIdx + 1) : list.length + 1);

        const memberObj = {
          ...memberData,
          id: memberData.id || `${type === 'advisors' ? 'FA' : 'EC'}-${Date.now()}`,
          sortOrder: orderNum
        };

        if (existingIdx >= 0) {
          list[existingIdx] = memberObj;
        } else {
          list.push(memberObj);
        }

        // Sort list by sortOrder
        list.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
        // Normalize sortOrder to 1..N
        list = list.map((m, idx) => ({ ...m, sortOrder: idx + 1 }));
        session[type] = list;
        localStorage.setItem(COMMITTEE_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {}

    const updated = await committeeApi.getCommitteeData();
    window.dispatchEvent(new Event('sems_committee_updated'));
    window.dispatchEvent(new Event('storage'));
    return updated;
  },

  // Reorder members inside a session (type: 'advisors' | 'executiveCommittee')
  reorderMembers: async (sessionId, type, reorderedMembers) => {
    try {
      const listWithOrder = reorderedMembers.map((m, idx) => ({
        ...m,
        sortOrder: idx + 1
      }));

      // Update local storage representation
      const saved = localStorage.getItem(COMMITTEE_STORAGE_KEY);
      let data = saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
      const session = data.find((s) => s.id === sessionId);
      if (session) {
        session[type] = listWithOrder;
        localStorage.setItem(COMMITTEE_STORAGE_KEY, JSON.stringify(data));
      }

      // Persist each member's updated sortOrder via API in background
      Promise.all(
        listWithOrder.map((m, idx) =>
          api.post('/admin/committee/members', {
            id: m.id && !m.id.startsWith('FA-') && !m.id.startsWith('EC-') ? m.id : undefined,
            sessionId,
            type,
            name: m.name,
            role: m.role,
            image: m.image,
            publicId: m.publicId,
            sortOrder: idx + 1
          }).catch(() => {})
        )
      ).catch(() => {});

      window.dispatchEvent(new Event('sems_committee_updated'));
      window.dispatchEvent(new Event('storage'));
      return data;
    } catch (e) {
      console.error('Failed to reorder committee members:', e);
      return await committeeApi.getCommitteeData();
    }
  },

  // Delete a member from a session
  deleteMember: async (sessionId, type, memberId) => {
    try {
      await api.delete(`/admin/committee/members/${memberId}`);
    } catch (err) {
      console.error('Failed to delete committee member via API:', err.message);
    }
    const updated = await committeeApi.getCommitteeData();
    window.dispatchEvent(new Event('sems_committee_updated'));
    return updated;
  },

  // Reset back to default seeded data
  resetCommitteeData: async () => {
    localStorage.setItem(COMMITTEE_STORAGE_KEY, JSON.stringify(DEFAULT_SESSIONS));
    window.dispatchEvent(new Event('sems_committee_updated'));
    return DEFAULT_SESSIONS;
  }
};
