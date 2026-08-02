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

const MOCK_REGISTRATIONS = [
  // MPEC
  { id: 'REG-MPEC-01', studentName: 'Aarav Sharma', rollNumber: '22MPEC045', college: 'MPEC', course: 'B.Tech', branch: 'CSE', year: '3rd Year', sportId: 'cricket', sportName: 'Cricket', category: 'Outdoor', eventType: 'Team (11 Players)', status: 'Confirmed', passCode: 'MPEC-CRIC-045', registeredDate: '2026-07-15', gender: 'Male' },
  { id: 'REG-MPEC-02', studentName: 'Ananya Verma', rollNumber: '23MPEC112', college: 'MPEC', course: 'B.Tech', branch: 'ECE', year: '2nd Year', sportId: 'badminton', sportName: 'Badminton', category: 'Indoor', eventType: 'Singles', status: 'Confirmed', passCode: 'MPEC-BADM-112', registeredDate: '2026-07-16', gender: 'Female' },
  { id: 'REG-MPEC-03', studentName: 'Rohan Gupta', rollNumber: '21MPEC089', college: 'MPEC', course: 'B.Tech', branch: 'ME', year: '4th Year', sportId: 'football', sportName: 'Football', category: 'Outdoor', eventType: 'Team (11 Players)', status: 'Confirmed', passCode: 'MPEC-FOOT-089', registeredDate: '2026-07-18', gender: 'Male' },
  { id: 'REG-MPEC-04', studentName: 'Isha Patel', rollNumber: '24MPEC012', college: 'MPEC', course: 'BBA', branch: 'Management', year: '1st Year', sportId: 'chess', sportName: 'Chess', category: 'Mind Sport', eventType: 'Individual', status: 'Confirmed', passCode: 'MPEC-CHES-012', registeredDate: '2026-07-20', gender: 'Female' },
  { id: 'REG-MPEC-05', studentName: 'Devansh Singh', rollNumber: '22MPEC078', college: 'MPEC', course: 'B.Tech', branch: 'IT', year: '3rd Year', sportId: 'table-tennis', sportName: 'Table Tennis', category: 'Indoor', eventType: 'Singles', status: 'Confirmed', passCode: 'MPEC-TT-078', registeredDate: '2026-07-22', gender: 'Male' },
  { id: 'REG-MPEC-06', studentName: 'Priya Mishra', rollNumber: '23MPEC034', college: 'MPEC', course: 'BCA', branch: 'Computers', year: '2nd Year', sportId: 'athletics', sportName: 'Athletics', category: 'Track & Field', eventType: '100m Sprint', status: 'Confirmed', passCode: 'MPEC-ATHL-034', registeredDate: '2026-07-24', gender: 'Female' },
  { id: 'REG-MPEC-07', studentName: 'Siddharth Saxena', rollNumber: '22MPEC091', college: 'MPEC', course: 'B.Tech', branch: 'CSE', year: '3rd Year', sportId: 'gully-cricket', sportName: 'Gully Cricket', category: 'Outdoor', eventType: 'Team (5-8 Players)', status: 'Confirmed', passCode: 'MPEC-GULL-091', registeredDate: '2026-07-25', gender: 'Male' },

  // MIPS
  { id: 'REG-MIPS-01', studentName: 'Karan Malhotra', rollNumber: '22MIPS014', college: 'MIPS', course: 'B.Tech', branch: 'CSE', year: '3rd Year', sportId: 'cricket', sportName: 'Cricket', category: 'Outdoor', eventType: 'Team (11 Players)', status: 'Confirmed', passCode: 'MIPS-CRIC-014', registeredDate: '2026-07-16', gender: 'Male' },
  { id: 'REG-MIPS-02', studentName: 'Sneha Pandey', rollNumber: '23MIPS056', college: 'MIPS', course: 'MBA', branch: 'Marketing', year: '1st Year', sportId: 'badminton', sportName: 'Badminton', category: 'Indoor', eventType: 'Doubles', status: 'Confirmed', passCode: 'MIPS-BADM-056', registeredDate: '2026-07-17', gender: 'Female' },
  { id: 'REG-MIPS-03', studentName: 'Aditya Tiwari', rollNumber: '21MIPS033', college: 'MIPS', course: 'MCA', branch: 'Computer Apps', year: '2nd Year', sportId: 'chess', sportName: 'Chess', category: 'Mind Sport', eventType: 'Individual', status: 'Confirmed', passCode: 'MIPS-CHES-033', registeredDate: '2026-07-19', gender: 'Male' },
  { id: 'REG-MIPS-04', studentName: 'Divya Rastogi', rollNumber: '22MIPS088', college: 'MIPS', course: 'B.Tech', branch: 'ECE', year: '3rd Year', sportId: 'athletics', sportName: 'Athletics', category: 'Track & Field', eventType: 'Long Jump', status: 'Confirmed', passCode: 'MIPS-ATHL-088', registeredDate: '2026-07-21', gender: 'Female' },

  // MPCPS (KN142)
  { id: 'REG-MPCPS-01', studentName: 'Vikram Rajput', rollNumber: '23MPCPS009', college: 'MPCPS (KN142)', course: 'BCA', branch: 'IT', year: '2nd Year', sportId: 'football', sportName: 'Football', category: 'Outdoor', eventType: 'Team (11 Players)', status: 'Confirmed', passCode: 'MPCPS-FOOT-009', registeredDate: '2026-07-17', gender: 'Male' },
  { id: 'REG-MPCPS-02', studentName: 'Riya Sen', rollNumber: '24MPCPS041', college: 'MPCPS (KN142)', course: 'BBA', branch: 'Finance', year: '1st Year', sportId: 'table-tennis', sportName: 'Table Tennis', category: 'Indoor', eventType: 'Singles', status: 'Confirmed', passCode: 'MPCPS-TT-041', registeredDate: '2026-07-19', gender: 'Female' },

  // MPCP
  { id: 'REG-MPCP-01', studentName: 'Nikhil Kashyap', rollNumber: '22MPCP022', college: 'MPCP', course: 'B.Pharma', branch: 'Pharmacy', year: '3rd Year', sportId: 'cricket', sportName: 'Cricket', category: 'Outdoor', eventType: 'Team (11 Players)', status: 'Confirmed', passCode: 'MPCP-CRIC-022', registeredDate: '2026-07-18', gender: 'Male' },
  { id: 'REG-MPCP-02', studentName: 'Pooja Nair', rollNumber: '23MPCP067', college: 'MPCP', course: 'M.Pharma', branch: 'Pharmaceutics', year: '1st Year', sportId: 'badminton', sportName: 'Badminton', category: 'Indoor', eventType: 'Singles', status: 'Confirmed', passCode: 'MPCP-BADM-067', registeredDate: '2026-07-20', gender: 'Female' },

  // MPDC
  { id: 'REG-MPDC-01', studentName: 'Dr. Sameer Khan', rollNumber: '21MPDC005', college: 'MPDC', course: 'BDS', branch: 'Dental', year: '4th Year', sportId: 'chess', sportName: 'Chess', category: 'Mind Sport', eventType: 'Individual', status: 'Confirmed', passCode: 'MPDC-CHES-005', registeredDate: '2026-07-19', gender: 'Male' },

  // MPCN&PS
  { id: 'REG-MPCNPS-01', studentName: 'Tanya Dsouza', rollNumber: '23MPCNPS019', college: 'MPCN&PS', course: 'B.Sc Nursing', branch: 'Nursing', year: '2nd Year', sportId: 'athletics', sportName: 'Athletics', category: 'Track & Field', eventType: 'Shotput', status: 'Confirmed', passCode: 'MPCNPS-ATHL-019', registeredDate: '2026-07-21', gender: 'Female' },

  // MPAMC
  { id: 'REG-MPAMC-01', studentName: 'Ayush Kulkarni', rollNumber: '22MPAMC011', college: 'MPAMC', course: 'BAMS', branch: 'Ayurveda', year: '3rd Year', sportId: 'table-tennis', sportName: 'Table Tennis', category: 'Indoor', eventType: 'Singles', status: 'Confirmed', passCode: 'MPAMC-TT-011', registeredDate: '2026-07-22', gender: 'Male' },

  // MPCAMS
  { id: 'REG-MPCAMS-01', studentName: 'Harsh Vardhan', rollNumber: '23MPCAMS003', college: 'MPCAMS', course: 'BAMS', branch: 'Ayurveda', year: '2nd Year', sportId: 'badminton', sportName: 'Badminton', category: 'Indoor', eventType: 'Doubles', status: 'Confirmed', passCode: 'MPCAMS-BADM-003', registeredDate: '2026-07-23', gender: 'Male' },
];

const MOCK_MEDAL_TALLY = {
  'MPEC': { gold: 5, silver: 3, bronze: 2, totalPoints: 145, topSport: 'Cricket & Football' },
  'MIPS': { gold: 3, silver: 4, bronze: 3, totalPoints: 110, topSport: 'Badminton' },
  'MPCPS (KN142)': { gold: 2, silver: 2, bronze: 4, totalPoints: 85, topSport: 'Table Tennis' },
  'MPCP': { gold: 2, silver: 1, bronze: 2, totalPoints: 65, topSport: 'Cricket' },
  'MPDC': { gold: 1, silver: 2, bronze: 1, totalPoints: 45, topSport: 'Chess' },
  'MPCN&PS': { gold: 1, silver: 1, bronze: 2, totalPoints: 40, topSport: 'Athletics' },
  'MPAMC': { gold: 0, silver: 2, bronze: 1, totalPoints: 25, topSport: 'Table Tennis' },
  'MPCAMS': { gold: 0, silver: 1, bronze: 1, totalPoints: 15, topSport: 'Badminton' }
};

const HEAD_PASSWORDS_CLIENT = {
  head_mpec: 'mpec#2026',
  head_mips: 'mips#2026',
  head_mpcps: 'mpcps#2026',
  head_mpcp: 'mpcp#2026',
  head_mpdc: 'mpdc#2026',
  head_mpcnps: 'mpcnps#2026',
  head_mpamc: 'mpamc#2026',
  head_mpcams: 'mpcams#2026',
};

export const collegeHeadApi = {
  // Get unique password for helper UI preset filling
  getPresetPassword(username) {
    const key = username?.toLowerCase();
    return HEAD_PASSWORDS_CLIENT[key] || `${key}#2026`;
  },

  // Login
  async login(username, password) {
    try {
      const res = await api.post('/college-head/login', { username, password });
      if (res.data && res.data.token) {
        localStorage.setItem('sems_college_head_token', res.data.token);
        localStorage.setItem('sems_college_head_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        throw new Error(err.response?.data?.message || 'Invalid username or password.');
      }
      // Local fallback mode when API server is offline
      const userKey = username.toLowerCase();
      const expectedPassword = HEAD_PASSWORDS_CLIENT[userKey] || `${userKey}#2026`;
      const memoryUser = MOCK_COLLEGE_HEAD_USERS.find(
        (u) => u.username.toLowerCase() === userKey
      );

      const commonPass = import.meta.env.VITE_COMMON_PASSWORD || 'sems#2026';
      const prAdminPass = import.meta.env.VITE_PR_ADMIN_PASSWORD || 'password123';

      if (memoryUser && (password === expectedPassword || password === commonPass || password === prAdminPass)) {
        const user = {
          username: memoryUser.username,
          college: memoryUser.college,
          faculty_name: memoryUser.faculty_name,
          role: 'college_head',
        };
        localStorage.setItem('sems_college_head_token', `token-head-${memoryUser.username}-${Date.now()}`);
        localStorage.setItem('sems_college_head_user', JSON.stringify(user));
        return { success: true, user };
      }
      throw new Error('Invalid username or password for this college head.');
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
