import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sems_college_head_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Official College Head identities for all 9 MPGI Colleges (Zero Passwords in Frontend)
export const ALL_9_COLLEGE_HEAD_USERS = [
  { username: 'head_mpec', college: 'MPEC', faculty_name: 'Mr. Kaushal Maurya', role: 'college_head' },
  { username: 'head_mips', college: 'MIPS', faculty_name: 'Mr. Sushil Kushwaha', role: 'college_head' },
  { username: 'head_mpcps', college: 'MPCPS (KN142)', faculty_name: 'Rahul Kumar', role: 'college_head' },
  { username: 'head_mpcps_bpharm', college: 'MPCPS (BPharmacy)', faculty_name: 'Vinay Tiwari', role: 'college_head' },
  { username: 'head_mpcp', college: 'MPCP', faculty_name: 'Anuj Kumar Sonker', role: 'college_head' },
  { username: 'head_mpdc', college: 'MPDC', faculty_name: 'Dr. Himanshu Gupta', role: 'college_head' },
  { username: 'head_mpcnps', college: 'MPCN&PS', faculty_name: 'Saurabh Pratap Singh', role: 'college_head' },
  { username: 'head_mpamc', college: 'MPAMC', faculty_name: 'Dr Rahul Sharma', role: 'college_head' },
  { username: 'head_mpcams', college: 'MPCAMS', faculty_name: 'Prof. Sanjay Saxena', role: 'college_head' },
];

export const collegeHeadApi = {
  async login(username, password) {
    try {
      const res = await api.post('/college-head/login', { username, password });
      if (res.data && res.data.token) {
        localStorage.setItem('sems_college_head_token', res.data.token);
        localStorage.setItem('sems_college_head_user', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('sems-auth-change'));
      }
      return res.data;
    } catch (err) {
      if (err.response) {
        throw new Error(err.response.data?.message || 'Invalid username or password.');
      }
      throw new Error('Cannot connect to server. Please check your connection.');
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('sems_college_head_token');
    localStorage.removeItem('sems_college_head_user');
    window.dispatchEvent(new Event('sems-auth-change'));
  },

  // Get current session user
  getUser() {
    const saved = localStorage.getItem('sems_college_head_user');
    return saved ? JSON.parse(saved) : null;
  },

  // Get token
  getToken() {
    return localStorage.getItem('sems_college_head_token');
  },

  // Check auth
  isAuthenticated() {
    const token = localStorage.getItem('sems_college_head_token');
    const user = this.getUser();
    return Boolean(token && user && user.role === 'college_head');
  },

  // Read-only Live Dashboard Stats (Zero Mock Data)
  async getDashboardStats() {
    try {
      const res = await api.get('/college-head/dashboard-stats');
      return res.data;
    } catch (err) {
      console.warn('Live dashboard stats fetch error:', err.message);
      const user = this.getUser();
      const college = user?.college || 'MPEC';
      return {
        college,
        facultyName: user?.faculty_name || 'College Head Faculty',
        totalStudents: 0,
        totalRegistrations: 0,
        sportsCount: 0,
        medals: { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
      };
    }
  },

  // Read-only Live Students List for assigned college ONLY (Zero Mock Data)
  async getStudents(params = {}) {
    try {
      const res = await api.get('/college-head/students', { params });
      return res.data;
    } catch (err) {
      console.warn('Live students list fetch error:', err.message);
      const user = this.getUser();
      const college = user?.college || 'MPEC';
      return { college, count: 0, students: [] };
    }
  },

  // Read-only Live Sports Participation (Zero Mock Data)
  async getSportsParticipation() {
    try {
      const res = await api.get('/college-head/sports-participation');
      return res.data;
    } catch (err) {
      console.warn('Live sports participation fetch error:', err.message);
      return [];
    }
  },

  // Read-only Live Medal Summary (Zero Mock Data)
  async getMedalSummary() {
    try {
      const res = await api.get('/college-head/medal-summary');
      return res.data;
    } catch (err) {
      console.warn('Live medal summary fetch error:', err.message);
      const user = this.getUser();
      const college = user?.college || 'MPEC';
      return { college, gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
    }
  },

  // Read-only Available Created Events List
  async getEvents() {
    try {
      const res = await api.get('/college-head/events');
      return res.data?.events || [];
    } catch (err) {
      console.warn('Live events fetch error:', err.message);
      return [];
    }
  },

  // Self-Service Change Password for authenticated College Head
  async changePassword(currentPassword, newPassword) {
    try {
      const res = await api.post('/college-head/change-password', {
        currentPassword,
        newPassword
      });
      return res.data;
    } catch (err) {
      if (err.response) {
        throw new Error(err.response.data?.message || 'Failed to update password.');
      }
      throw new Error(err.message || 'Network error while updating password.');
    }
  }
};

