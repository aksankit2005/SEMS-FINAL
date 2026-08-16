import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig, headPasswords } from '../config/env.js';
import { queryDb, prisma } from '../config/db.js';

const inMemoryCollegeHeadUsers = [
  { id: 1, username: 'head_mpec', college: 'MPEC', faculty_name: 'Dr. Rajesh Sharma', role: 'college_head' },
  { id: 2, username: 'head_mips', college: 'MIPS', faculty_name: 'Prof. Anita Verma', role: 'college_head' },
  { id: 3, username: 'head_mpcps', college: 'MPCPS (KN142)', faculty_name: 'Dr. Vikram Singh', role: 'college_head' },
  { id: 4, username: 'head_mpcp', college: 'MPCP', faculty_name: 'Prof. Sunita Gupta', role: 'college_head' },
  { id: 5, username: 'head_mpdc', college: 'MPDC', faculty_name: 'Dr. Rakesh Trivedi', role: 'college_head' },
  { id: 6, username: 'head_mpcnps', college: 'MPCN&PS', faculty_name: 'Prof. Meenakshi Joshi', role: 'college_head' },
  { id: 7, username: 'head_mpamc', college: 'MPAMC', faculty_name: 'Dr. Alok Pandey', role: 'college_head' },
  { id: 8, username: 'head_mpcams', college: 'MPCAMS', faculty_name: 'Prof. Sanjay Saxena', role: 'college_head' },
];

const inMemoryCollegeMedals = {
  'MPEC': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MIPS': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCPS (KN142)': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCP': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPDC': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCN&PS': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPAMC': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCAMS': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' }
};

const sanitizeStudentForCollegeHead = (student) => {
  const sanitized = { ...student };
  delete sanitized.feePaid;
  delete sanitized.paymentMethod;
  delete sanitized.receiptId;
  delete sanitized.transactionId;
  delete sanitized.cardNumber;
  delete sanitized.cardHolder;
  delete sanitized.cardExpiry;
  delete sanitized.cardCvv;
  delete sanitized.selectedBank;
  delete sanitized.upiId;
  delete sanitized.amount;
  delete sanitized.fees;
  delete sanitized.revenue;
  delete sanitized.paymentStatus;
  return sanitized;
};

export const collegeHeadLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const userKey = username.toLowerCase();
  const expectedPassword = headPasswords[userKey];

  const dbResult = await queryDb('SELECT * FROM college_head_users WHERE LOWER(username) = $1', [userKey]);
  if (dbResult && dbResult.rows.length > 0) {
    const user = dbResult.rows[0];
    if (user.status && user.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
    }
    let isValid = false;
    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    } else if (expectedPassword) {
      isValid = (password === expectedPassword);
    }
    if (isValid) {
      const token = jwt.sign(
        { id: user.id, username: user.username, college: user.college, faculty_name: user.faculty_name, role: 'college_head' },
        envConfig.jwtSecret,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        token,
        user: { username: user.username, college: user.college, faculty_name: user.faculty_name, role: 'college_head' }
      });
    } else {
      return res.status(401).json({ message: 'Invalid password for this college head. Access denied.' });
    }
  }

  const memoryUser = inMemoryCollegeHeadUsers.find((u) => u.username.toLowerCase() === userKey);
  if (memoryUser) {
    if (memoryUser.status && memoryUser.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
    }
    const isValid = expectedPassword && password === expectedPassword;
    if (isValid) {
      const token = jwt.sign(
        { id: memoryUser.id, username: memoryUser.username, college: memoryUser.college, faculty_name: memoryUser.faculty_name, role: 'college_head' },
        envConfig.jwtSecret,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        token,
        user: { username: memoryUser.username, college: memoryUser.college, faculty_name: memoryUser.faculty_name, role: 'college_head' }
      });
    }
  }

  return res.status(401).json({ message: 'Invalid College Head credentials. Access denied.' });
};

export const getDashboardStats = async (req, res) => {
  try {
    const college = req.user.college || 'MPEC';

    const totalRegistrations = await prisma.collegeRegistration.count({
      where: { college: { equals: college, mode: 'insensitive' } }
    });

    const sportsGroup = await prisma.collegeRegistration.groupBy({
      by: ['sportId'],
      where: { college: { equals: college, mode: 'insensitive' } }
    });

    const medals = inMemoryCollegeMedals[college] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };

    return res.json({
      college,
      facultyName: req.user.faculty_name || req.user.facultyName || 'College Head Faculty',
      totalStudents: totalRegistrations,
      totalRegistrations,
      sportsCount: sportsGroup.length,
      medals,
    });
  } catch (err) {
    console.error('Error fetching college head stats:', err);
    return res.status(500).json({ message: 'Error loading college stats' });
  }
};

export const getStudents = async (req, res) => {
  try {
    const college = req.user.college || 'MPEC';
    const { search, sport, status, page, limit } = req.query;

    const whereCondition = {
      college: { equals: college, mode: 'insensitive' }
    };

    if (sport && sport !== 'all') {
      whereCondition.sportId = { contains: sport.toLowerCase(), mode: 'insensitive' };
    }

    if (status && status !== 'all') {
      whereCondition.status = { equals: status, mode: 'insensitive' };
    }

    let students = await prisma.collegeRegistration.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' }
    });

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(
        (s) =>
          (s.studentName && s.studentName.toLowerCase().includes(q)) ||
          (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q)) ||
          (s.sportId && s.sportId.toLowerCase().includes(q))
      );
    }

    const sanitizedStudents = students.map(sanitizeStudentForCollegeHead);

    // Support pagination if explicitly requested
    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page || '1', 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10)));
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = sanitizedStudents.slice(startIndex, startIndex + limitNum);

      return res.json({
        college,
        count: sanitizedStudents.length,
        students: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: sanitizedStudents.length,
          totalPages: Math.ceil(sanitizedStudents.length / limitNum)
        }
      });
    }

    return res.json({
      college,
      count: sanitizedStudents.length,
      students: sanitizedStudents,
    });
  } catch (err) {
    console.error('Error fetching college head students:', err);
    return res.status(500).json({ message: 'Error loading student list' });
  }
};

export const getRegistrations = async (req, res) => {
  try {
    const college = req.user.college || 'MPEC';

    const registrations = await prisma.collegeRegistration.findMany({
      where: { college: { equals: college, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' }
    });

    const sanitized = registrations.map(sanitizeStudentForCollegeHead);
    return res.json(sanitized);
  } catch (err) {
    console.error('Error fetching college head registrations:', err);
    return res.status(500).json({ message: 'Error loading college registrations' });
  }
};

export const getSportsParticipation = async (req, res) => {
  try {
    const college = req.user.college || 'MPEC';

    const registrations = await prisma.collegeRegistration.findMany({
      where: { college: { equals: college, mode: 'insensitive' } }
    });

    const breakdownMap = {};
    registrations.forEach((s) => {
      const sportName = s.sportId ? s.sportId.replace(/-/g, ' ').toUpperCase() : 'GENERAL';
      if (!breakdownMap[sportName]) {
        breakdownMap[sportName] = { sportName, sportId: s.sportId, total: 0, male: 0, female: 0 };
      }
      breakdownMap[sportName].total += 1;
      if ((s.gender || '').toLowerCase() === 'female') breakdownMap[sportName].female += 1;
      else breakdownMap[sportName].male += 1;
    });

    return res.json(Object.values(breakdownMap));
  } catch (err) {
    console.error('Error fetching sports participation:', err);
    return res.status(500).json({ message: 'Error loading sports breakdown' });
  }
};

export const getMedalSummary = async (req, res) => {
  const college = req.user.college || 'MPEC';
  try {
    const dbRes = await queryDb(
      `SELECT gold_count AS "gold", silver_count AS "silver", bronze_count AS "bronze", total_points AS "totalPoints" 
       FROM college_leaderboards 
       WHERE LOWER(college_code) = LOWER($1) OR LOWER(college_name) = LOWER($1) 
       LIMIT 1`,
      [college]
    );
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      const row = dbRes.rows[0];
      return res.json({
        college,
        gold: Number(row.gold || 0),
        silver: Number(row.silver || 0),
        bronze: Number(row.bronze || 0),
        totalPoints: Number(row.totalPoints || 0),
        topSport: 'N/A'
      });
    }
  } catch (err) {
    console.warn('Error fetching college head medal summary from DB:', err.message);
  }
  const medals = inMemoryCollegeMedals[college] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
  return res.json({ college, ...medals });
};

export const exportReport = async (req, res) => {
  try {
    const college = req.user.college || 'MPEC';

    const collegeStudents = await prisma.collegeRegistration.findMany({
      where: { college: { equals: college, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' }
    });

    const medals = inMemoryCollegeMedals[college] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0 };
    const sanitizedStudents = collegeStudents.map(sanitizeStudentForCollegeHead);

    return res.json({
      college,
      generatedAt: new Date().toISOString(),
      facultyHead: req.user.faculty_name || 'Sports Coordinator',
      totalStudentsCount: sanitizedStudents.length,
      medalTally: medals,
      students: sanitizedStudents,
    });
  } catch (err) {
    console.error('Error exporting report:', err);
    return res.status(500).json({ message: 'Error exporting report' });
  }
};
