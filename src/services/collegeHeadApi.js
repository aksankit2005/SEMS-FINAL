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
  // MPEC Kanpur Students
  { id: 'REG-1001', studentName: 'Aarav Sharma', rollNumber: '210016010001', college: 'MPEC', course: 'B.Tech', branch: 'Computer Science', year: '3rd Year', gender: 'Male', sportId: 'table-tennis', sportName: 'Table Tennis', category: 'Singles', status: 'VERIFIED' },
  { id: 'REG-1002', studentName: 'Aditya Singh', rollNumber: '210016010015', college: 'MPEC', course: 'B.Tech', branch: 'Information Technology', year: '4th Year', gender: 'Male', sportId: 'cricket', sportName: 'Cricket', category: 'Mens Team', status: 'VERIFIED' },
  { id: 'REG-1003', studentName: 'Kabir Singh', rollNumber: '210016010042', college: 'MPEC', course: 'B.Tech', branch: 'Mechanical Engineering', year: '3rd Year', gender: 'Male', sportId: 'chess', sportName: 'Chess', category: 'Individual Rapid', status: 'VERIFIED' },
  { id: 'REG-1004', studentName: 'Riya Tiwari', rollNumber: '220016010088', college: 'MPEC', course: 'B.Tech', branch: 'Computer Science', year: '2nd Year', gender: 'Female', sportId: 'badminton', sportName: 'Badminton', category: 'Womens Singles', status: 'VERIFIED' },
  { id: 'REG-1005', studentName: 'Siddharth Mishra', rollNumber: '210016010110', college: 'MPEC', course: 'B.Tech', branch: 'Civil Engineering', year: '4th Year', gender: 'Male', sportId: 'football', sportName: 'Football', category: 'Mens Team', status: 'VERIFIED' },
  { id: 'REG-1006', studentName: 'Ananya Gupta', rollNumber: '230016010023', college: 'MPEC', course: 'BCA', branch: 'Computer Applications', year: '1st Year', gender: 'Female', sportId: 'athletics', sportName: 'Athletics', category: '100m Sprint', status: 'PENDING' },
  { id: 'REG-1007', studentName: 'Manish Rawat', rollNumber: '210016010144', college: 'MPEC', course: 'B.Tech', branch: 'Electrical Engineering', year: '4th Year', gender: 'Male', sportId: 'basketball', sportName: 'Basketball', category: 'Mens 5v5', status: 'VERIFIED' },
  { id: 'REG-1008', studentName: 'Harsh Vardhan', rollNumber: '220016010190', college: 'MPEC', course: 'B.Tech', branch: 'Computer Science', year: '2nd Year', gender: 'Male', sportId: 'tug-of-war', sportName: 'Tug of War', category: 'Heavyweight', status: 'VERIFIED' },

  // MIPS Kanpur Students
  { id: 'REG-2001', studentName: 'Rohan Gupta', rollNumber: '210025010005', college: 'MIPS', course: 'B.Tech', branch: 'Computer Science', year: '3rd Year', gender: 'Male', sportId: 'badminton', sportName: 'Badminton', category: 'Mens Singles', status: 'VERIFIED' },
  { id: 'REG-2002', studentName: 'Varun Teja', rollNumber: '210025010034', college: 'MIPS', course: 'B.Tech', branch: 'Electronics Engineering', year: '4th Year', gender: 'Male', sportId: 'athletics', sportName: 'Athletics', category: '100m & 200m Sprint', status: 'VERIFIED' },
  { id: 'REG-2003', studentName: 'Kavya Sen', rollNumber: '220025010055', college: 'MIPS', course: 'MBA', branch: 'Marketing', year: '1st Year', gender: 'Female', sportId: 'volleyball', sportName: 'Volleyball', category: 'Womens Team', status: 'VERIFIED' },
  { id: 'REG-2004', studentName: 'Aakash Verma', rollNumber: '210025010078', college: 'MIPS', course: 'B.Tech', branch: 'Information Technology', year: '3rd Year', gender: 'Male', sportId: 'football', sportName: 'Football', category: 'Mens Team', status: 'VERIFIED' },
  { id: 'REG-2005', studentName: 'Saurabh Srivastava', rollNumber: '210025010092', college: 'MIPS', course: 'MCA', branch: 'Computer Applications', year: '2nd Year', gender: 'Male', sportId: 'kho-kho', sportName: 'Kho-Kho', category: 'Mens Team', status: 'VERIFIED' },

  // MPCPS (KN142) Students
  { id: 'REG-3001', studentName: 'Priya Verma', rollNumber: '210038010012', college: 'MPCPS (KN142)', course: 'B.Pharm', branch: 'Pharmacy', year: '3rd Year', gender: 'Female', sportId: 'badminton', sportName: 'Badminton', category: 'Womens Singles', status: 'VERIFIED' },
  { id: 'REG-3002', studentName: 'Devendra Rao', rollNumber: '210038010045', college: 'MPCPS (KN142)', course: 'B.Pharm', branch: 'Pharmacy', year: '4th Year', gender: 'Male', sportId: 'chess', sportName: 'Chess', category: 'Rapid Chess', status: 'VERIFIED' },
  { id: 'REG-3003', studentName: 'Kunal Dixith', rollNumber: '220038010089', college: 'MPCPS (KN142)', course: 'D.Pharm', branch: 'Pharmacy', year: '2nd Year', gender: 'Male', sportId: 'table-tennis', sportName: 'Table Tennis', category: 'Singles & Doubles', status: 'VERIFIED' },

  // MPCP Students
  { id: 'REG-4001', studentName: 'Shivangi Pandey', rollNumber: '210042010008', college: 'MPCP', course: 'B.Pharm', branch: 'Pharmacy', year: '3rd Year', gender: 'Female', sportId: 'kho-kho', sportName: 'Kho-Kho', category: 'Womens Team', status: 'VERIFIED' },
  { id: 'REG-4002', studentName: 'Deepak Yadav', rollNumber: '210042010030', college: 'MPCP', course: 'M.Pharm', branch: 'Pharmaceutics', year: '1st Year', gender: 'Male', sportId: 'kabaddi', sportName: 'Kabaddi', category: 'Mens Team', status: 'VERIFIED' },
  { id: 'REG-4003', studentName: 'Vikas Dubey', rollNumber: '220042010060', college: 'MPCP', course: 'B.Pharm', branch: 'Pharmacy', year: '2nd Year', gender: 'Male', sportId: 'volleyball', sportName: 'Volleyball', category: 'Mens Team', status: 'VERIFIED' },

  // MPDC Students (Dental College)
  { id: 'REG-5001', studentName: 'Dr. Nikhil Arora', rollNumber: '210055010014', college: 'MPDC', course: 'BDS', branch: 'Dental Surgery', year: '4th Year', gender: 'Male', sportId: 'gully-cricket', sportName: 'Gully Cricket', category: '6-Overs Fast Box', status: 'VERIFIED' },
  { id: 'REG-5002', studentName: 'Simran Jolly', rollNumber: '220055010033', college: 'MPDC', course: 'BDS', branch: 'Dental Surgery', year: '3rd Year', gender: 'Female', sportId: 'table-tennis', sportName: 'Table Tennis', category: 'Womens Singles', status: 'VERIFIED' },

  // MPCAMS Students
  { id: 'REG-6001', studentName: 'Tushar Saxena', rollNumber: '210066010019', college: 'MPCAMS', course: 'B.Sc', branch: 'Nursing & Paramedical', year: '3rd Year', gender: 'Male', sportId: 'gully-cricket', sportName: 'Gully Cricket', category: '6-Overs Fast Box', status: 'VERIFIED' },
  { id: 'REG-6002', studentName: 'Pankaj Tripathi', rollNumber: '210066010050', college: 'MPCAMS', course: 'B.Sc', branch: 'Biotechnology', year: '4th Year', gender: 'Male', sportId: 'tug-of-war', sportName: 'Tug of War', category: 'Open Weight', status: 'VERIFIED' }
];

const MOCK_MEDAL_TALLY = {
  'MPEC': { gold: 12, silver: 8, bronze: 5, totalPoints: 170, topSport: 'Cricket & Football' },
  'MIPS': { gold: 9, silver: 11, bronze: 6, totalPoints: 157, topSport: 'Badminton & Athletics' },
  'MPCPS (KN142)': { gold: 7, silver: 9, bronze: 10, totalPoints: 135, topSport: 'Table Tennis & Chess' },
  'MPCP': { gold: 3, silver: 4, bronze: 6, totalPoints: 62, topSport: 'Kho-Kho' },
  'MPDC': { gold: 2, silver: 4, bronze: 5, totalPoints: 50, topSport: 'Gully Cricket' },
  'MPCN&PS': { gold: 1, silver: 3, bronze: 4, totalPoints: 35, topSport: 'Volleyball' },
  'MPAMC': { gold: 1, silver: 2, bronze: 3, totalPoints: 26, topSport: 'Track & Field' },
  'MPCAMS': { gold: 2, silver: 3, bronze: 4, totalPoints: 43, topSport: 'Tug of War' }
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
        window.dispatchEvent(new Event('sems-auth-change'));
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
