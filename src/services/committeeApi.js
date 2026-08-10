// Frontend Service for Executive Committee & Faculty Advisors management
// Stored session-wise in localStorage so the admin can edit photo, name & position.

const COMMITTEE_STORAGE_KEY = 'sems_committee_data';

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

export const committeeApi = {
  // Get all sessions with their advisors & executive committee
  getCommitteeData: async () => {
    return getStorageItem(COMMITTEE_STORAGE_KEY, DEFAULT_SESSIONS);
  },

  // Save the full session-wise committee data
  saveCommitteeData: async (sessions) => {
    setStorageItem(COMMITTEE_STORAGE_KEY, sessions);
    window.dispatchEvent(new Event('sems_committee_updated'));
    return sessions;
  },

  // Add / update a session
  saveSession: async (sessionData) => {
    const sessions = await committeeApi.getCommitteeData();
    let updated;
    if (sessionData.id && sessions.some((s) => s.id === sessionData.id)) {
      updated = sessions.map((s) => (s.id === sessionData.id ? { ...s, ...sessionData } : s));
    } else {
      const newSession = {
        id: `session-${Date.now()}`,
        label: sessionData.label || 'New Session',
        isActive: false,
        advisors: [],
        executiveCommittee: [],
        ...sessionData
      };
      updated = [...sessions, newSession];
    }
    return committeeApi.saveCommitteeData(updated);
  },

  // Delete a session
  deleteSession: async (id) => {
    const sessions = await committeeApi.getCommitteeData();
    const updated = sessions.filter((s) => s.id !== id);
    return committeeApi.saveCommitteeData(updated);
  },

  // Add / update a member inside a session (type: 'advisors' | 'executiveCommittee')
  saveMember: async (sessionId, type, memberData) => {
    const sessions = await committeeApi.getCommitteeData();
    const updated = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const list = s[type] || [];
      let newList;
      if (memberData.id && list.some((m) => m.id === memberData.id)) {
        newList = list.map((m) => (m.id === memberData.id ? { ...m, ...memberData } : m));
      } else {
        newList = [{ id: `${type === 'advisors' ? 'FA' : 'EC'}-${Date.now()}`, ...memberData }, ...list];
      }
      return { ...s, [type]: newList };
    });
    return committeeApi.saveCommitteeData(updated);
  },

  // Delete a member from a session
  deleteMember: async (sessionId, type, memberId) => {
    const sessions = await committeeApi.getCommitteeData();
    const updated = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      return { ...s, [type]: (s[type] || []).filter((m) => m.id !== memberId) };
    });
    return committeeApi.saveCommitteeData(updated);
  },

  // Reset back to default seeded data
  resetCommitteeData: async () => {
    setStorageItem(COMMITTEE_STORAGE_KEY, DEFAULT_SESSIONS);
    window.dispatchEvent(new Event('sems_committee_updated'));
    return DEFAULT_SESSIONS;
  }
};
