import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig, headPasswords } from '../config/env.js';
import { queryDb, prisma } from '../config/db.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const inMemoryCollegeHeadUsers = [
  { id: 1, username: 'head_mpec', college: 'MPEC', faculty_name: 'Mr. Kaushal Maurya', role: 'college_head' },
  { id: 2, username: 'head_mips', college: 'MIPS', faculty_name: 'Mr. Sushil Kushwaha', role: 'college_head' },
  { id: 3, username: 'head_mpcps', college: 'MPCPS (KN142)', faculty_name: 'Rahul Kumar', role: 'college_head' },
  { id: 4, username: 'head_mpcp', college: 'MPCP', faculty_name: 'Anuj Kumar Sonker', role: 'college_head' },
  { id: 5, username: 'head_mpdc', college: 'MPDC', faculty_name: 'Dr. Himanshu Gupta', role: 'college_head' },
  { id: 6, username: 'head_mpcnps', college: 'MPCN&PS', faculty_name: 'Saurabh Pratap Singh', role: 'college_head' },
  { id: 7, username: 'head_mpamc', college: 'MPAMC', faculty_name: 'Dr Rahul Sharma', role: 'college_head' },
  { id: 8, username: 'head_mpcams', college: 'MPCAMS', faculty_name: 'Prof. Sanjay Saxena', role: 'college_head' },
  { id: 9, username: 'head_mpcps_bpharm', college: 'MPCPS (BPharmacy)', faculty_name: 'Vinay Tiwari', role: 'college_head' },
];

const inMemoryCollegeMedals = {
  'MPEC': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MIPS': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCPS (KN142)': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCPS (BPharmacy)': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCP': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPDC': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCN&PS': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPAMC': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' },
  'MPCAMS': { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' }
};

const sanitizeStudentForCollegeHead = (student) => {
  if (!student) return student;
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

/**
 * Resolves the authenticated College Head's exact authorized college scope.
 * Uses authenticated account from DB/token (NEVER trusts frontend query params).
 */
export const getCollegeAuthScope = async (user) => {
  let collegeId = user?.collegeId || user?.college_id || null;
  let collegeCode = user?.college || '';
  let collegeName = '';

  // 1. If collegeId UUID is already provided in token
  if (collegeId) {
    try {
      const colRes = await queryDb('SELECT id, code, name FROM colleges WHERE id::text = $1', [String(collegeId)]);
      if (colRes && colRes.rows.length > 0) {
        collegeCode = colRes.rows[0].code;
        collegeName = colRes.rows[0].name;
      }
    } catch (e) {}
  }

  // 2. Lookup DB account by username if collegeId is not set
  if (!collegeId && user?.username) {
    try {
      const headRes = await queryDb(`
        SELECT chu.college_id, chu.college, c.code, c.name 
        FROM college_head_users chu
        LEFT JOIN colleges c ON chu.college_id = c.id
        WHERE LOWER(chu.username) = LOWER($1)
      `, [user.username]);

      if (headRes && headRes.rows.length > 0) {
        const row = headRes.rows[0];
        collegeId = row.college_id || null;
        collegeCode = row.code || row.college || collegeCode;
        collegeName = row.name || collegeName;
      }
    } catch (e) {}
  }

  // 3. Lookup college by code or name if collegeId still missing
  if (!collegeId && collegeCode) {
    try {
      const colRes = await queryDb(
        'SELECT id, code, name FROM colleges WHERE LOWER(code) = LOWER($1) OR LOWER(name) = LOWER($1)',
        [collegeCode.trim()]
      );
      if (colRes && colRes.rows.length > 0) {
        collegeId = colRes.rows[0].id;
        collegeCode = colRes.rows[0].code;
        collegeName = colRes.rows[0].name;
      }
    } catch (e) {}
  }

  // 4. Build exact canonical aliases for strict comparison (NO substring LIKE matches)
  const exactAliases = new Set();
  if (collegeCode) exactAliases.add(collegeCode.trim().toLowerCase());
  if (collegeName) exactAliases.add(collegeName.trim().toLowerCase());

  const cleanCode = (collegeCode || '').toUpperCase().trim();
  if (cleanCode === 'MPEC') {
    exactAliases.add('mpec');
    exactAliases.add('maharana pratap engineering college');
    exactAliases.add('mpec kanpur');
  } else if (cleanCode === 'MIPS') {
    exactAliases.add('mips');
    exactAliases.add('maharana institute of professional studies');
    exactAliases.add('mips kanpur');
  } else if (cleanCode === 'MPCPS (KN142)' || cleanCode === 'MPCPS' || cleanCode.includes('KN142')) {
    exactAliases.add('mpcps (kn142)');
    exactAliases.add('mpcps');
    exactAliases.add('kn142');
    exactAliases.add('maharana pratap college of pharmacy & science');
    exactAliases.add('maharana pratap college of pharmacy and science');
  } else if (cleanCode === 'MPCPS (BPHARMACY)' || cleanCode.includes('BPHARM')) {
    exactAliases.add('mpcps (bpharmacy)');
    exactAliases.add('mpcps (bpharm)');
    exactAliases.add('mpcps bpharmacy');
    exactAliases.add('mpcps bpharm');
  } else if (cleanCode === 'MPCP') {
    exactAliases.add('mpcp');
    exactAliases.add('maharana pratap college of pharmacy');
  } else if (cleanCode === 'MPDC') {
    exactAliases.add('mpdc');
    exactAliases.add('maharana pratap dental college');
  } else if (cleanCode === 'MPCN&PS' || cleanCode === 'MPCNPS' || cleanCode.includes('MPCN')) {
    exactAliases.add('mpcn&ps');
    exactAliases.add('mpcnps');
    exactAliases.add('mpcn & ps');
    exactAliases.add('mpcn and ps');
    exactAliases.add('maharana pratap college of nursing & paramedical sciences');
    exactAliases.add('maharana pratap college of nursing and paramedical sciences');
  } else if (cleanCode === 'MPAMC') {
    exactAliases.add('mpamc');
    exactAliases.add('maharana pratap ayurvedic medical college');
  } else if (cleanCode === 'MPCAMS') {
    exactAliases.add('mpcams');
    exactAliases.add('maharana pratap college of applied medical sciences');
  }

  return {
    collegeId: collegeId ? String(collegeId) : null,
    collegeCode: collegeCode || 'MPEC',
    collegeName: collegeName || collegeCode || 'MPEC',
    exactAliases: Array.from(exactAliases)
  };
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
        {
          id: user.id,
          username: user.username,
          college: user.college,
          collegeId: user.college_id,
          college_id: user.college_id,
          faculty_name: user.faculty_name,
          role: 'college_head'
        },
        envConfig.jwtSecret,
        { expiresIn: '24h' }
      );
      logAuditEvent({
        userId: user.id,
        actorName: user.username,
        role: 'COLLEGE_HEAD',
        action: 'College Head Login',
        entity: `College Head: ${user.username} (${user.college})`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({
        success: true,
        token,
        user: {
          username: user.username,
          college: user.college,
          collegeId: user.college_id,
          faculty_name: user.faculty_name,
          role: 'college_head'
        }
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
        {
          id: memoryUser.id,
          username: memoryUser.username,
          college: memoryUser.college,
          collegeId: memoryUser.collegeId || null,
          faculty_name: memoryUser.faculty_name,
          role: 'college_head'
        },
        envConfig.jwtSecret,
        { expiresIn: '24h' }
      );
      logAuditEvent({
        userId: memoryUser.id,
        actorName: memoryUser.username,
        role: 'COLLEGE_HEAD',
        action: 'College Head Login',
        entity: `College Head: ${memoryUser.username} (${memoryUser.college})`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({
        success: true,
        token,
        user: {
          username: memoryUser.username,
          college: memoryUser.college,
          faculty_name: memoryUser.faculty_name,
          role: 'college_head'
        }
      });
    }
  }

  return res.status(401).json({ message: 'Invalid College Head credentials. Access denied.' });
};

export const getDashboardStats = async (req, res) => {
  try {
    const scope = await getCollegeAuthScope(req.user);
    const { collegeId, collegeCode, exactAliases } = scope;

    const [regCountRes, studentCountRes, sportsGroupRes] = await Promise.all([
      queryDb(`
        SELECT COUNT(DISTINCT r.id) AS count
        FROM registrations r
        LEFT JOIN colleges c ON r."collegeId" = c.id
        LEFT JOIN college_registrations cr ON cr.registration_id = r.id OR cr.id::text = r.id::text
        WHERE (
          ($1::text IS NOT NULL AND r."collegeId"::text = $1)
          OR (r."collegeId" IS NULL AND (
            LOWER(TRIM(COALESCE(c.code, ''))) = ANY($2::text[])
            OR LOWER(TRIM(COALESCE(c.name, ''))) = ANY($2::text[])
            OR LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($2::text[])
          ))
        )
      `, [collegeId, exactAliases]).catch(() => null),

      queryDb(`
        SELECT COUNT(m.id) AS count
        FROM registration_members m
        JOIN registrations r ON m."registrationId" = r.id
        LEFT JOIN colleges c ON r."collegeId" = c.id
        LEFT JOIN college_registrations cr ON cr.registration_id = r.id OR cr.id::text = r.id::text
        WHERE (
          ($1::text IS NOT NULL AND r."collegeId"::text = $1)
          OR (r."collegeId" IS NULL AND (
            LOWER(TRIM(COALESCE(c.code, ''))) = ANY($2::text[])
            OR LOWER(TRIM(COALESCE(c.name, ''))) = ANY($2::text[])
            OR LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($2::text[])
          ))
        )
      `, [collegeId, exactAliases]).catch(() => null),

      queryDb(`
        SELECT COUNT(DISTINCT COALESCE(cr.sport_id, r."sportId", s.slug, s.name)) AS count
        FROM registrations r
        LEFT JOIN colleges c ON r."collegeId" = c.id
        LEFT JOIN college_registrations cr ON cr.registration_id = r.id
        LEFT JOIN sports s ON (s.id::text = r."sportId"::text OR s.slug = r."sportId")
        WHERE (
          ($1::text IS NOT NULL AND r."collegeId"::text = $1)
          OR (r."collegeId" IS NULL AND (
            LOWER(TRIM(COALESCE(c.code, ''))) = ANY($2::text[])
            OR LOWER(TRIM(COALESCE(c.name, ''))) = ANY($2::text[])
            OR LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($2::text[])
          ))
        )
      `, [collegeId, exactAliases]).catch(() => null)
    ]);

    const totalRegistrations = Number(regCountRes?.rows[0]?.count || 0);
    const totalStudents = Number(studentCountRes?.rows[0]?.count || 0);
    const sportsCount = Number(sportsGroupRes?.rows[0]?.count || 0);

    // Medal Summary
    let medals = inMemoryCollegeMedals[collegeCode] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
    try {
      const medalRes = await queryDb(
        `SELECT gold_count AS "gold", silver_count AS "silver", bronze_count AS "bronze", total_points AS "totalPoints" 
         FROM college_leaderboards 
         WHERE ($1::text IS NOT NULL AND college_id::text = $1)
            OR LOWER(TRIM(college_code)) = ANY($2::text[])
            OR LOWER(TRIM(college_name)) = ANY($2::text[])
         LIMIT 1`,
        [collegeId, exactAliases]
      );
      if (medalRes && medalRes.rows.length > 0) {
        medals = {
          gold: Number(medalRes.rows[0].gold || 0),
          silver: Number(medalRes.rows[0].silver || 0),
          bronze: Number(medalRes.rows[0].bronze || 0),
          totalPoints: Number(medalRes.rows[0].totalPoints || 0),
          topSport: 'N/A'
        };
      }
    } catch (e) {}

    return res.json({
      college: collegeCode,
      facultyName: req.user.faculty_name || req.user.facultyName || 'College Head Faculty',
      totalStudents: totalStudents > 0 ? totalStudents : totalRegistrations,
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
    const scope = await getCollegeAuthScope(req.user);
    const { collegeId, collegeCode, exactAliases } = scope;
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
      LEFT JOIN sports s ON s.slug = r."sportId" OR s.slug = cr.sport_id OR s.name = r."sportId" OR s.id::text = r."sportId"::text
      LEFT JOIN colleges c ON c.id = r."collegeId"
      WHERE (
        ($1::text IS NOT NULL AND r."collegeId"::text = $1)
        OR (r."collegeId" IS NULL AND (
          LOWER(TRIM(COALESCE(c.code, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(c.name, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($2::text[])
        ))
      )
      ORDER BY m."createdAt" DESC
    `, [collegeId, exactAliases]).catch((err) => {
      console.warn('College head members query error:', err.message);
      return null;
    });

    let students = [];
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      students = dbRes.rows.map((s) => ({
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
        where: {
          college: { in: exactAliases, mode: 'insensitive' }
        },
        orderBy: { createdAt: 'desc' }
      });
      students = fallbackRegs.map((r) => ({
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
      students = students.filter((s) => (s.sportId || '').toLowerCase().includes(sp) || (s.sportName || '').toLowerCase().includes(sp));
    }

    if (status && status !== 'all') {
      students = students.filter((s) => (s.status || '').toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase().trim();
      students = students.filter((s) =>
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
        college: collegeCode,
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
      college: collegeCode,
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
    const scope = await getCollegeAuthScope(req.user);
    const { collegeId, exactAliases } = scope;

    const dbRes = await queryDb(`
      SELECT 
        cr.id,
        cr.registration_id AS "registrationId",
        cr.event_id AS "eventId",
        cr.sport_id AS "sportId",
        cr.student_name AS "studentName",
        cr.team_name AS "teamName",
        cr.college,
        cr.department,
        cr.email,
        cr.phone,
        cr.gender,
        cr.emergency_contact AS "emergencyContact",
        cr.status,
        cr.members_count AS "membersCount",
        cr.participant_data AS "participantData",
        COALESCE(cei.title, cr.participant_data->>'eventTitle', cr.participant_data->>'eventName', NULL) AS "eventTitleFromDb",
        TO_CHAR(cr.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS "registrationDate",
        TO_CHAR(cr.created_at AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM') AS "registrationTime",
        cr.created_at AS "createdAt"
      FROM college_registrations cr
      LEFT JOIN coordinator_event_items cei ON cei.id::text = cr.event_id::text
      LEFT JOIN registrations r ON cr.registration_id = r.id
      LEFT JOIN colleges c ON r."collegeId" = c.id
      WHERE (
        ($1::text IS NOT NULL AND r."collegeId"::text = $1)
        OR LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($2::text[])
        OR (r."collegeId" IS NULL AND (
          LOWER(TRIM(COALESCE(c.code, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(c.name, ''))) = ANY($2::text[])
        ))
      )
      ORDER BY cr.created_at DESC
    `, [collegeId, exactAliases]);

    const sanitized = (dbRes?.rows || []).map(r => {
      const sanitizedObj = sanitizeStudentForCollegeHead(r);
      sanitizedObj.eventTitle = r.eventTitleFromDb || `${(r.sportId || 'Sport').replace(/-/g, ' ').toUpperCase()} Championship`;
      return sanitizedObj;
    });
    return res.json(sanitized);
  } catch (err) {
    console.error('Error fetching college head registrations:', err);
    return res.status(500).json({ message: 'Error loading college registrations' });
  }
};

export const getSportsParticipation = async (req, res) => {
  try {
    const scope = await getCollegeAuthScope(req.user);
    const { collegeId, exactAliases } = scope;

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
        ($1::text IS NOT NULL AND r."collegeId"::text = $1)
        OR (r."collegeId" IS NULL AND (
          LOWER(TRIM(COALESCE(c.code, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(c.name, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($2::text[])
        ))
      )
    `, [collegeId, exactAliases]).catch(() => null);

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
      const fallbackRegs = await prisma.collegeRegistration.findMany({
        where: { college: { in: exactAliases, mode: 'insensitive' } }
      });
      fallbackRegs.forEach((s) => {
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
  try {
    const scope = await getCollegeAuthScope(req.user);
    const { collegeId, collegeCode, exactAliases } = scope;

    const dbRes = await queryDb(
      `SELECT gold_count AS "gold", silver_count AS "silver", bronze_count AS "bronze", total_points AS "totalPoints" 
       FROM college_leaderboards 
       WHERE ($1::text IS NOT NULL AND college_id::text = $1)
          OR LOWER(TRIM(college_code)) = ANY($2::text[])
          OR LOWER(TRIM(college_name)) = ANY($2::text[])
       LIMIT 1`,
      [collegeId, exactAliases]
    );

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      const row = dbRes.rows[0];
      return res.json({
        college: collegeCode,
        gold: Number(row.gold || 0),
        silver: Number(row.silver || 0),
        bronze: Number(row.bronze || 0),
        totalPoints: Number(row.totalPoints || 0),
        topSport: 'N/A'
      });
    }

    const medals = inMemoryCollegeMedals[collegeCode] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
    return res.json({ college: collegeCode, ...medals });
  } catch (err) {
    console.warn('Error fetching college head medal summary from DB:', err.message);
    const scope = await getCollegeAuthScope(req.user).catch(() => ({ collegeCode: 'MPEC' }));
    const medals = inMemoryCollegeMedals[scope.collegeCode] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
    return res.json({ college: scope.collegeCode, ...medals });
  }
};

export const exportReport = async (req, res) => {
  try {
    const scope = await getCollegeAuthScope(req.user);
    const { collegeId, collegeCode, exactAliases } = scope;

    // Fetch full members roster for export
    const dbRes = await queryDb(`
      SELECT 
        m.id,
        m."fullName" AS "studentName",
        m."rollNo" AS "rollNumber",
        m.course,
        m.year_semester AS "yearSemester",
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
        ($1::text IS NOT NULL AND r."collegeId"::text = $1)
        OR (r."collegeId" IS NULL AND (
          LOWER(TRIM(COALESCE(c.code, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(c.name, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($2::text[])
        ))
      )
      ORDER BY m."createdAt" DESC
    `, [collegeId, exactAliases]);

    const sanitizedStudents = (dbRes?.rows || []).map(sanitizeStudentForCollegeHead);

    let medals = inMemoryCollegeMedals[collegeCode] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0 };
    try {
      const medalRes = await queryDb(
        `SELECT gold_count AS "gold", silver_count AS "silver", bronze_count AS "bronze", total_points AS "totalPoints" 
         FROM college_leaderboards 
         WHERE ($1::text IS NOT NULL AND college_id::text = $1)
            OR LOWER(TRIM(college_code)) = ANY($2::text[])
            OR LOWER(TRIM(college_name)) = ANY($2::text[])
         LIMIT 1`,
        [collegeId, exactAliases]
      );
      if (medalRes && medalRes.rows.length > 0) {
        medals = {
          gold: Number(medalRes.rows[0].gold || 0),
          silver: Number(medalRes.rows[0].silver || 0),
          bronze: Number(medalRes.rows[0].bronze || 0),
          totalPoints: Number(medalRes.rows[0].totalPoints || 0)
        };
      }
    } catch (e) {}

    return res.json({
      college: collegeCode,
      generatedAt: new Date().toISOString(),
      facultyHead: req.user.faculty_name || req.user.facultyName || 'Sports Coordinator',
      totalStudentsCount: sanitizedStudents.length,
      medalTally: medals,
      students: sanitizedStudents,
    });
  } catch (err) {
    console.error('Error exporting report:', err);
    return res.status(500).json({ message: 'Error exporting report' });
  }
};
