import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// Pre-seeded College Head users for offline/local mode fallback (No passwords in source code)
const MOCK_COLLEGE_HEAD_USERS = [
  { username: 'head_mpec', college: 'MPEC', faculty_name: 'Dr. Rajesh Sharma', role: 'college_head' },
  { username: 'head_mips', college: 'MIPS', faculty_name: 'Prof. Anita Verma', role: 'college_head' },
  { username: 'head_mpcps', college: 'MPCPS (KN142)', faculty_name: 'Dr. Vikram Singh', role: 'college_head' },
  { username: 'head_mpcp', college: 'MPCP', faculty_name: 'Prof. Sunita Gupta', role: 'college_head' },
  { username: 'head_mpdc', college: 'MPDC', faculty_name: 'Dr. Rakesh Trivedi', role: 'college_head' },
  { username: 'head_mpcnps', college: 'MPCN&PS', faculty_name: 'Prof. Meenakshi Joshi', role: 'college_head' },
  { username: 'head_mpamc', college: 'MPAMC', faculty_name: 'Dr. Alok Pandey', role: 'college_head' },
  { username: 'head_mpcams', college: 'MPCAMS', faculty_name: 'Prof. Sanjay Saxena', role: 'college_head' },
];

const MOCK_REGISTRATIONS = [];

const MOCK_MEDAL_TALLY = {
  'MPEC': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MIPS': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCPS (KN142)': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCP': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPDC': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCN&PS': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPAMC': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCAMS': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' }
};

// NOTE: Passwords are NOT stored in the frontend.
// Authentication is handled exclusively by the backend.

export const collegeHeadApi = {
  async login(username, password) {
    try {
      const res = await api.post('/college-head/login', { username, password });
      if (res.data && res.data.token) {
        localStorage.setItem('sems_college_head_token', res.data.token);
        localStorage.setItem('sems_college_head_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } catch (err) {
      // Re-throw backend error message (401, 403)
      if (err.response) {
        throw new Error(err.response.data?.message || 'Invalid username or password.');
      }
      // Network/server offline errors
      throw new Error('Cannot connect to server. Please check your connection.');
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('sems_college_head_token');
    localStorage.removeItem('sems_college_head_user');
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

  // Read-only Dashboard Stats
  async getDashboardStats() {
    try {
      const res = await api.get('/college-head/dashboard-stats');
      return res.data;
    } catch (err) {
      const user = this.getUser();
      const college = user?.college || 'MPEC';
      const students = MOCK_REGISTRATIONS.filter((s) => s.college.toLowerCase() === college.toLowerCase());
      const sportsSet = new Set(students.map((s) => s.sportId));
      const medals = MOCK_MEDAL_TALLY[college] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
      return {
        college,
        facultyName: user?.faculty_name || 'College Head Faculty',
        totalStudents: students.length,
        totalRegistrations: students.length,
        sportsCount: sportsSet.size,
        medals,
      };
    }
  },

  // Read-only Students List for assigned college ONLY
  async getStudents(params = {}) {
    try {
      const res = await api.get('/college-head/students', { params });
      return res.data;
    } catch (err) {
      const user = this.getUser();
      const college = user?.college || 'MPEC';
      let students = MOCK_REGISTRATIONS.filter((s) => s.college.toLowerCase() === college.toLowerCase());

      if (params.search) {
        const q = params.search.toLowerCase();
        students = students.filter(
          (s) =>
            s.studentName.toLowerCase().includes(q) ||
            s.rollNumber.toLowerCase().includes(q) ||
            (s.course && s.course.toLowerCase().includes(q)) ||
            (s.branch && s.branch.toLowerCase().includes(q)) ||
            (s.sportName && s.sportName.toLowerCase().includes(q))
        );
      }

      if (params.sport && params.sport !== 'all') {
        students = students.filter((s) => s.sportId.toLowerCase() === params.sport.toLowerCase());
      }

      if (params.status && params.status !== 'all') {
        students = students.filter((s) => s.status.toLowerCase() === params.status.toLowerCase());
      }

      // Sanitize payment details
      const sanitized = students.map((s) => {
        const item = { ...s };
        delete item.feePaid;
        delete item.paymentMethod;
        delete item.receiptId;
        delete item.transactionId;
        delete item.cardNumber;
        delete item.cardHolder;
        delete item.cardExpiry;
        delete item.cardCvv;
        delete item.selectedBank;
        delete item.upiId;
        return item;
      });
      return { college, count: sanitized.length, students: sanitized };
    }
  },

  // Read-only Sports Participation
  async getSportsParticipation() {
    try {
      const res = await api.get('/college-head/sports-participation');
      return res.data;
    } catch (err) {
      const user = this.getUser();
      const college = user?.college || 'MPEC';
      const students = MOCK_REGISTRATIONS.filter((s) => s.college.toLowerCase() === college.toLowerCase());
      const map = {};
      students.forEach((s) => {
        if (!map[s.sportName]) {
          map[s.sportName] = { sportName: s.sportName, sportId: s.sportId, total: 0, male: 0, female: 0 };
        }
        map[s.sportName].total += 1;
        if (s.gender === 'Female') map[s.sportName].female += 1;
        else map[s.sportName].male += 1;
      });
      return Object.values(map);
    }
  },

  // Read-only Medal Summary
  async getMedalSummary() {
    try {
      const res = await api.get('/college-head/medal-summary');
      return res.data;
    } catch (err) {
      const user = this.getUser();
      const college = user?.college || 'MPEC';
      const medals = MOCK_MEDAL_TALLY[college] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
      return { college, ...medals };
    }
  }
};
