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

    const [regCountRes, studentCountRes, sportsGroupRes] = await Promise.all([
      queryDb(`
        SELECT COUNT(*) AS count FROM college_registrations cr
        LEFT JOIN colleges c ON cr.college = c.name OR cr.college = c.code
        WHERE LOWER(cr.college) = LOWER($1) OR LOWER(c.code) = LOWER($1) OR LOWER(cr.college) LIKE LOWER($2)
      `, [college, `%${college}%`]).catch(() => null),

      queryDb(`
        SELECT COUNT(*) AS count FROM registration_members m
        JOIN registrations r ON m."registrationId" = r.id
        LEFT JOIN college_registrations cr ON cr.registration_id = r.id OR cr.id::text = r.id::text
        LEFT JOIN colleges c ON r.college_id = c.id
        WHERE LOWER(COALESCE(cr.college, c.name, c.code, '')) = LOWER($1)
           OR LOWER(COALESCE(c.code, '')) = LOWER($1)
           OR LOWER(COALESCE(cr.college, '')) LIKE LOWER($2)
      `, [college, `%${college}%`]).catch(() => null),

      queryDb(`
        SELECT COUNT(DISTINCT COALESCE(cr.sport_id, r.sport_id)) AS count
        FROM college_registrations cr
        LEFT JOIN registrations r ON cr.registration_id = r.id
        LEFT JOIN colleges c ON cr.college = c.name OR cr.college = c.code
        WHERE LOWER(cr.college) = LOWER($1) OR LOWER(c.code) = LOWER($1) OR LOWER(cr.college) LIKE LOWER($2)
      `, [college, `%${college}%`]).catch(() => null)
    ]);

    const totalRegistrations = Number(regCountRes?.rows[0]?.count || 0);
    const totalStudents = Math.max(Number(studentCountRes?.rows[0]?.count || 0), totalRegistrations);
    const sportsCount = Number(sportsGroupRes?.rows[0]?.count || 0);

    const medals = inMemoryCollegeMedals[college] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };

    return res.json({
      college,
      facultyName: req.user.faculty_name || req.user.facultyName || 'College Head Faculty',
      totalStudents,
      totalRegistrations,
      sportsCount,
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

    const dbRes = await queryDb(`
      SELECT 
        m.id,
        m."fullName" AS "studentName",
        m."rollNo" AS "rollNumber",
        m.course,
        m.year_semester AS "yearSemester",
        m.year_semester AS year,
        m.gender,
        m.mobile AS phone,
        m.email,
        m."isCaptain",
        COALESCE(cr.sport_id, r."sportId", s.slug, s.name, 'sport') AS "sportId",
        COALESCE(s.name, cr.sport_id, r."sportId", 'Sport') AS "sportName",
        COALESCE(cr.team_name, r."teamName", 'Individual') AS "teamName",
        COALESCE(cr.status, r.status::text, 'VERIFIED') AS status,
        COALESCE(cr.event_id, 'APEX-2026') AS "eventType",
        m."createdAt" AS "createdAt"
      FROM registration_members m
      JOIN registrations r ON m."registrationId" = r.id
      LEFT JOIN college_registrations cr ON cr.registration_id = r.id
      LEFT JOIN sports s ON s.slug = r."sportId" OR s.slug = cr.sport_id OR s.name = r."sportId"
      LEFT JOIN colleges c ON c.id = r."collegeId"
      WHERE (
        LOWER(COALESCE(c.code, c.name, cr.college, '')) = LOWER($1) OR
        LOWER(COALESCE(cr.college, '')) LIKE LOWER($2)
      )
      ORDER BY m."createdAt" DESC
    `, [college, `%${college}%`]).catch((err) => {
      console.warn('College head members query error:', err.message);
      return null;
    });

    let students = [];
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      students = dbRes.rows.map(s => ({
        id: s.id,
        studentName: s.studentName,
        rollNumber: s.rollNumber || 'N/A',
        course: s.course || 'N/A',
        yearSemester: s.yearSemester || 'N/A',
        year: s.year || s.yearSemester || 'N/A',
        gender: s.gender || 'Boys',
        phone: s.phone || 'N/A',
        email: s.email || 'N/A',
        isCaptain: (s.isCaptain === true || s.isCaptain === 1 || s.isCaptain === 'true' || s.isCaptain === '1'),
        sportId: (s.sportId || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        sportName: (s.sportName || 'Sport').replace(/-/g, ' ').toUpperCase(),
        teamName: s.teamName || 'Individual',
        status: s.status || 'VERIFIED',
        eventType: s.eventType || 'APEX-2026'
      }));
    } else {
      // Fallback to prisma collegeRegistration if no members table entries
      const fallbackRegs = await prisma.collegeRegistration.findMany({
        where: { college: { equals: college, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' }
      });
      students = fallbackRegs.map(r => ({
        id: r.id,
        studentName: r.studentName,
        rollNumber: r.enrollmentNo || 'N/A',
        course: r.department || 'N/A',
        yearSemester: 'N/A',
        year: 'N/A',
        gender: r.gender,
        phone: r.phone || 'N/A',
        email: r.email || 'N/A',
        isCaptain: true,
        sportId: (r.sportId || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        sportName: (r.sportId || 'Sport').replace(/-/g, ' ').toUpperCase(),
        teamName: r.teamName || 'Individual',
        status: r.status || 'VERIFIED',
        eventType: r.eventId || 'APEX-2026'
      }));
    }

    if (sport && sport !== 'all') {
      const sp = sport.toLowerCase();
      students = students.filter(s => (s.sportId || '').toLowerCase().includes(sp) || (s.sportName || '').toLowerCase().includes(sp));
    }

    if (status && status !== 'all') {
      students = students.filter(s => (s.status || '').toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s =>
        (s.studentName && s.studentName.toLowerCase().includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.sportName && s.sportName.toLowerCase().includes(q)) ||
        (s.teamName && s.teamName.toLowerCase().includes(q))
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

    const dbRes = await queryDb(`
      SELECT 
        COALESCE(cr.sport_id, s.slug, s.name, 'general') AS "sportId",
        COALESCE(s.name, cr.sport_id, 'GENERAL') AS "sportName",
        m.gender
      FROM registration_members m
      JOIN registrations r ON m."registrationId" = r.id
      LEFT JOIN college_registrations cr ON cr.registration_id = r.id
      LEFT JOIN sports s ON (r."sportId" IS NOT NULL AND (s.id::text = r."sportId"::text OR s.slug = r."sportId")) OR (r."sportId" IS NULL AND (s.id::text = cr.sport_id OR s.slug = cr.sport_id))
      LEFT JOIN colleges c ON (r."collegeId" IS NOT NULL AND c.id = r."collegeId") OR (r."collegeId" IS NULL AND (c.code = cr.college OR c.name = cr.college))
      WHERE (
        LOWER(COALESCE(cr.college, c.name, c.code, '')) = LOWER($1) OR
        LOWER(COALESCE(c.code, '')) = LOWER($1) OR
        LOWER(COALESCE(cr.college, '')) LIKE LOWER($2)
      )
    `, [college, `%${college}%`]).catch(() => null);

    const breakdownMap = {};

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      dbRes.rows.forEach((s) => {
        const sportName = (s.sportName || s.sportId || 'GENERAL').replace(/-/g, ' ').toUpperCase();
        if (!breakdownMap[sportName]) {
          breakdownMap[sportName] = { sportName, sportId: s.sportId, total: 0, male: 0, female: 0 };
        }
        breakdownMap[sportName].total += 1;
        if ((s.gender || '').toLowerCase() === 'female' || (s.gender || '').toLowerCase() === 'girls') {
          breakdownMap[sportName].female += 1;
        } else {
          breakdownMap[sportName].male += 1;
        }
      });
    } else {
      const registrations = await prisma.collegeRegistration.findMany({
        where: { college: { equals: college, mode: 'insensitive' } }
      });
      registrations.forEach((s) => {
        const sportName = s.sportId ? s.sportId.replace(/-/g, ' ').toUpperCase() : 'GENERAL';
        if (!breakdownMap[sportName]) {
          breakdownMap[sportName] = { sportName, sportId: s.sportId, total: 0, male: 0, female: 0 };
        }
        breakdownMap[sportName].total += 1;
        if ((s.gender || '').toLowerCase() === 'female') breakdownMap[sportName].female += 1;
        else breakdownMap[sportName].male += 1;
      });
    }

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
