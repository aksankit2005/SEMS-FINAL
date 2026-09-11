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
  } else if (cleanCode.includes('BPHARM') || cleanCode === 'MPCPS (BPHARMACY)') {
    exactAliases.add('mpcps (bpharmacy)');
    exactAliases.add('mpcps (bpharm)');
    exactAliases.add('mpcps bpharmacy');
    exactAliases.add('mpcps bpharm');
    exactAliases.add('bpharmacy');
    exactAliases.add('bpharm');
  } else if (cleanCode.includes('KN142') || cleanCode === 'MPCPS (KN142)') {
    exactAliases.add('mpcps (kn142)');
    exactAliases.add('kn142');
    exactAliases.add('kn 142');
    exactAliases.add('mpcps kn142');
    exactAliases.add('maharana pratap college of pharmacy & science');
    exactAliases.add('maharana pratap college of pharmacy and science');
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
      let topSport = 'N/A';
      try {
        const topSportRes = await queryDb(
          `SELECT sport_id, COUNT(*) AS wins 
           FROM leaderboard_entries 
           WHERE LOWER(TRIM(winner_college)) = ANY($1::text[])
           GROUP BY sport_id 
           ORDER BY wins DESC 
           LIMIT 1`,
          [exactAliases]
        );
        if (topSportRes && topSportRes.rows.length > 0) {
          topSport = (topSportRes.rows[0].sport_id || 'Sport').replace(/-/g, ' ').toUpperCase();
        }
      } catch (e) {}

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
          topSport
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
    const { search, sport, status, gender, format, eventTitle, page, limit } = req.query;

    // 1. Fetch coordinator created events to match sport/event IDs to exact event titles
    const coordEventsRes = await queryDb('SELECT id, sport_id, title FROM coordinator_event_items').catch(() => null);
    const coordEventMap = new Map();
    const availableEventsSet = new Set();

    if (coordEventsRes && coordEventsRes.rows) {
      coordEventsRes.rows.forEach(e => {
        if (e.title && e.title.trim()) {
          availableEventsSet.add(e.title.trim());
        }
        if (e.sport_id && e.title) {
          const sKey = e.sport_id.toLowerCase().replace(/[^a-z0-9]/g, '-');
          coordEventMap.set(sKey, e.title.trim());
          coordEventMap.set(e.sport_id.toLowerCase().trim(), e.title.trim());
          coordEventMap.set(e.id.toString(), e.title.trim());
        }
      });
    }

    // 2. Query athlete roster joining registration_members, registrations, and college_registrations safely
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
        COALESCE(cr.members_count, 1) AS "membersCount",
        COALESCE(cr.sport_id, r."sportId"::text, s.slug, s.name, 'sport') AS "sportId",
        COALESCE(s.name, cr.sport_id, r."sportId"::text, 'Sport') AS "sportName",
        COALESCE(cei.title, cr.participant_data->>'eventTitle', cr.participant_data->>'selectedEvent', cr.participant_data->>'subEvent', cr.participant_data->>'category', cr.participant_data->>'eventType', cr.participant_data->>'eventName', NULL) AS "eventTitleFromDb",
        COALESCE(r."registrationType", cr.participant_data->>'matchFormat', NULL) AS "rawFormat",
        COALESCE(cr.team_name, r."teamName", 'Individual') AS "teamName",
        COALESCE(cr.college, c.code, c.name, 'MPEC') AS college,
        COALESCE(cr.status, r.status::text, 'VERIFIED') AS status,
        COALESCE(cr.event_id, r."eventId"::text, 'APEX-2026') AS "eventType",
        COALESCE(cr.participant_data->>'subEvent', cr.participant_data->>'athleticsEvent', cr.participant_data->>'gameName', NULL) AS "subEvent",
        TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', COALESCE(cr.created_at, r."createdAt", m."createdAt"))), 'YYYY-MM-DD') AS "regDate",
        TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', COALESCE(cr.created_at, r."createdAt", m."createdAt"))), 'HH12:MI AM') AS "regTime",
        COALESCE(cr.created_at, r."createdAt", m."createdAt") AS "createdAt"
      FROM registration_members m
      JOIN registrations r ON m."registrationId" = r.id
      LEFT JOIN college_registrations cr ON (cr.registration_id = r.id OR cr.id::text = r.id::text OR cr.id::text = m."registrationId"::text)
      LEFT JOIN coordinator_event_items cei ON (cei.id::text = cr.event_id::text OR cei.id::text = r."eventId"::text)
      LEFT JOIN sports s ON (s.slug = r."sportId"::text OR s.slug = cr.sport_id OR s.name = r."sportId"::text OR s.id::text = r."sportId"::text)
      LEFT JOIN colleges c ON (c.id = r."collegeId" OR c.code = cr.college OR c.name = cr.college)
      WHERE (
        ($1::text IS NOT NULL AND (r."collegeId"::text = $1 OR c.id::text = $1))
        OR (
          LOWER(TRIM(COALESCE(c.code, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(c.name, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($2::text[])
        )
      )
      ORDER BY COALESCE(cr.created_at, m."createdAt") DESC
    `, [collegeId, exactAliases]).catch((err) => {
      console.warn('College head members query warning:', err.message);
      return null;
    });

    let rawList = [];
    const seenIds = new Set();

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      dbRes.rows.forEach(row => {
        seenIds.add(row.id);
        rawList.push(row);
      });
    }

    // 3. Include any standalone entries from college_registrations for complete coverage
    try {
      const crStandaloneRes = await queryDb(`
        SELECT 
          cr.id,
          cr.student_name AS "studentName",
          cr.enrollment_no AS "rollNumber",
          cr.department AS course,
          'N/A' AS "yearSemester",
          'N/A' AS year,
          cr.gender,
          cr.phone,
          cr.email,
          true AS "isCaptain",
          COALESCE(cr.members_count, 1) AS "membersCount",
          COALESCE(cr.sport_id, 'sport') AS "sportId",
          COALESCE(cr.sport_id, 'Sport') AS "sportName",
          COALESCE(cr.participant_data->>'subEvent', cr.participant_data->>'athleticsEvent', cr.participant_data->>'gameName', NULL) AS "subEvent",
          COALESCE(cei.title, cr.participant_data->>'eventTitle', cr.participant_data->>'selectedEvent', cr.participant_data->>'subEvent', cr.participant_data->>'category', cr.participant_data->>'eventType', cr.participant_data->>'eventName', NULL) AS "eventTitleFromDb",
          COALESCE(cr.participant_data->>'matchFormat', NULL) AS "rawFormat",
          COALESCE(cr.team_name, 'Individual') AS "teamName",
          COALESCE(cr.college, 'MPEC') AS college,
          COALESCE(cr.status, 'VERIFIED') AS status,
          COALESCE(cr.event_id, 'APEX-2026') AS "eventType",
          TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', cr.created_at)), 'YYYY-MM-DD') AS "regDate",
          TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', cr.created_at)), 'HH12:MI AM') AS "regTime",
          cr.created_at AS "createdAt"
        FROM college_registrations cr
        LEFT JOIN coordinator_event_items cei ON cei.id::text = cr.event_id::text
        WHERE LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($1::text[])
        ORDER BY cr.created_at DESC
      `, [exactAliases]);

      if (crStandaloneRes && crStandaloneRes.rows) {
        crStandaloneRes.rows.forEach(r => {
          if (!seenIds.has(r.id)) {
            seenIds.add(r.id);
            rawList.push(r);
          }
        });
      }
    } catch (crErr) {}

    // Fallback to Prisma if database returned empty
    if (rawList.length === 0) {
      const fallbackRegs = await prisma.collegeRegistration.findMany({
        where: {
          college: { in: exactAliases, mode: 'insensitive' }
        },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []);

      rawList = fallbackRegs.map((r) => ({
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
        membersCount: Number(r.membersCount || 1),
        sportId: r.sportId || 'sport',
        sportName: r.sportId || 'Sport',
        subEvent: r.participantData?.subEvent || r.participantData?.athleticsEvent || null,
        eventTitleFromDb: r.participantData?.eventTitle || r.participantData?.eventName || null,
        rawFormat: r.participantData?.matchFormat || null,
        teamName: r.teamName || 'Individual',
        college: r.college || 'MPEC',
        regDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '2026-08-10',
        regTime: r.createdAt ? new Date(r.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : '10:00 AM',
        createdAt: r.createdAt,
        status: r.status || 'VERIFIED',
        eventType: r.eventId || 'APEX-2026'
      }));
    }

    // 4. Map, normalize, and resolve event titles & match formats
    let students = rawList.map((s) => {
      const rawGen = (s.gender || '').toUpperCase().trim();
      const normalizedGender = (rawGen.includes('FEM') || rawGen.includes('GIRL') || rawGen.includes('WOM')) ? 'FEMALE' : 'MALE';

      const sportKey = (s.sportId || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-');
      let sportDisplayName = (s.sportName || 'Sport').replace(/-/g, ' ').toUpperCase();

      // Athletics subEvent handling
      const isAthletics = sportKey.includes('athletics') || sportDisplayName.toLowerCase().includes('athletics');
      let subEvent = s.subEvent || null;
      if (isAthletics && !subEvent) {
        const OFFICIAL = ['100m Race', '200m Race', '4*100m relay Race', 'Long Jump', 'Javelin Throw', 'Shot Put', 'Discus Throw'];
        const searchStr = `${s.eventTitleFromDb || ''} ${s.teamName || ''}`;
        const found = OFFICIAL.find((o) => searchStr.toLowerCase().includes(o.toLowerCase()));
        if (found) subEvent = found;
        if (!subEvent) subEvent = '100m Race';
      }

      if (isAthletics && subEvent) {
        sportDisplayName = `ATHLETICS (${subEvent.toUpperCase()})`;
      }

      // Priority for eventTitle: Athletics subEvent -> Exact coordinator created event title -> DB eventTitle -> APEX 2026 title
      const matchedCoordTitle = coordEventMap.get(sportKey) || coordEventMap.get((s.sportId || '').toLowerCase()) || coordEventMap.get(s.eventType || '');
      let displayEventTitle = s.eventTitleFromDb;
      if (isAthletics && subEvent) {
        displayEventTitle = `Athletics - ${subEvent}`;
      } else if (!displayEventTitle || displayEventTitle.toLowerCase().endsWith('championship')) {
        displayEventTitle = matchedCoordTitle || `APEX ${sportDisplayName} 2026`;
      }
      // Available events set strictly retains only genuine active coordinator created events

      // Accurate Match Format Resolution
      const sKey = sportKey.toLowerCase();
      const isPureTeamSport = ['cricket', 'football', 'basketball', 'volleyball', 'kabaddi', 'kho-kho', 'tug-of-war'].some(ts => sKey.includes(ts));
      const teamNameVal = (s.teamName || '').trim();
      const isIndivName = !teamNameVal || teamNameVal.toLowerCase() === 'individual' || teamNameVal.toLowerCase() === (s.studentName || '').toLowerCase();
      const rawFmt = (s.rawFormat || '').toUpperCase().trim();

      let resolvedFormat = 'Single';
      if (rawFmt === 'DOUBLE' || rawFmt === 'DOUBLES' || rawFmt === 'DUO' || Number(s.membersCount || 1) === 2) {
        resolvedFormat = 'Double';
      } else if (isPureTeamSport || (!isIndivName && Number(s.membersCount || 1) > 1) || rawFmt === 'TEAM') {
        resolvedFormat = 'Team';
      } else {
        resolvedFormat = 'Single';
      }

      // Accurate Time & Date resolution
      let regTime = s.regTime;
      let regDate = s.regDate;
      if (!regTime || !regDate) {
        const ts = s.createdAt;
        if (ts && !isNaN(new Date(ts).getTime())) {
          const d = new Date(ts);
          regDate = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
          regTime = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
        } else {
          regDate = '2026-08-10';
          regTime = '10:00 AM';
        }
      }

      return {
        id: s.id,
        studentName: s.studentName,
        rollNumber: s.rollNumber || 'N/A',
        course: s.course || 'N/A',
        yearSemester: s.yearSemester || 'N/A',
        year: s.year || s.yearSemester || 'N/A',
        gender: normalizedGender,
        phone: s.phone || 'N/A',
        email: s.email || 'N/A',
        isCaptain: (s.isCaptain === true || s.isCaptain === 1 || s.isCaptain === 'true' || s.isCaptain === '1'),
        membersCount: Number(s.membersCount || 1),
        sportId: sportKey,
        sportName: sportDisplayName,
        subEvent: subEvent || 'N/A',
        eventTitle: displayEventTitle,
        matchFormat: resolvedFormat,
        teamName: isIndivName ? 'Individual' : (s.teamName || 'Individual'),
        college: s.college || collegeCode,
        regDate,
        regTime,
        status: s.status || 'VERIFIED',
        eventType: s.eventType || 'APEX-2026',
        createdAt: s.createdAt
      };
    });

    const availableEvents = Array.from(availableEventsSet);

    // 5. Apply filters
    if (sport && sport !== 'all' && sport !== 'ALL') {
      const sp = sport.toLowerCase().trim().replace(/_/g, '-');
      const isStdCricket = sp === 'cricket' || (sp.includes('cricket') && !sp.includes('gully'));
      const isGully = sp.includes('gully');

      students = students.filter((s) => {
        const sid = (s.sportId || '').toLowerCase().replace(/_/g, '-');
        const sname = (s.sportName || '').toLowerCase().replace(/_/g, '-');

        if (isStdCricket) {
          if (sid.includes('gully') || sname.includes('gully')) return false;
          return sid.includes('cricket') || sname.includes('cricket');
        }
        if (isGully) {
          return sid.includes('gully') || sname.includes('gully');
        }
        return (
          sid === sp ||
          sid.replace(/[^a-z0-9]/g, '') === sp.replace(/[^a-z0-9]/g, '') ||
          sname === sp ||
          sname.includes(sp) ||
          sid.includes(sp)
        );
      });
    }

    if (status && status !== 'all' && status !== 'ALL') {
      students = students.filter((s) => (s.status || '').toLowerCase() === status.toLowerCase().trim());
    }

    if (gender && gender !== 'all' && gender !== 'ALL') {
      const g = gender.toUpperCase().trim();
      students = students.filter((s) => (s.gender || '').toUpperCase().trim() === g);
    }

    if (format && format !== 'all' && format !== 'ALL') {
      const fmt = format.toUpperCase().trim();
      students = students.filter((s) => {
        const mf = (s.matchFormat || '').toUpperCase().trim();
        if (fmt === 'SINGLE' || fmt === 'INDIVIDUAL' || fmt === 'SOLO') {
          return mf === 'SINGLE' || mf === 'INDIVIDUAL' || mf === 'SOLO';
        }
        if (fmt === 'DOUBLE' || fmt === 'DOUBLES' || fmt === 'DUO') {
          return mf === 'DOUBLE' || mf === 'DOUBLES' || mf === 'DUO';
        }
        if (fmt === 'TEAM') {
          return mf === 'TEAM';
        }
        return mf === fmt;
      });
    }

    if (eventTitle && eventTitle !== 'all' && eventTitle !== 'ALL') {
      const ev = eventTitle.toLowerCase().trim();
      students = students.filter((s) =>
        (s.eventTitle || '').toLowerCase().trim() === ev ||
        (s.eventTitle || '').toLowerCase().includes(ev) ||
        ev.includes((s.eventTitle || '').toLowerCase().trim())
      );
    }

    if (search) {
      const q = search.toLowerCase().trim();
      students = students.filter((s) =>
        (s.studentName && s.studentName.toLowerCase().includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.sportName && s.sportName.toLowerCase().includes(q)) ||
        (s.eventTitle && s.eventTitle.toLowerCase().includes(q)) ||
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
        totalCount: sanitizedStudents.length,
        students: paginated,
        availableEvents,
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
      totalCount: sanitizedStudents.length,
      students: sanitizedStudents,
      availableEvents
    });
  } catch (err) {
    console.error('Error fetching college head students:', err);
    return res.status(500).json({ message: 'Error loading student list' });
  }
};

export const getCollegeHeadEvents = async (req, res) => {
  try {
    const eventsList = [];
    const seenTitles = new Set();

    // Fetch ONLY active coordinator created events from coordinator_event_items
    try {
      const dbRes = await queryDb(`
        SELECT id, sport_id AS "sportId", title AS "eventTitle"
        FROM coordinator_event_items
        WHERE title IS NOT NULL AND TRIM(title) != ''
        ORDER BY title ASC
      `);
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        dbRes.rows.forEach((r) => {
          const t = (r.eventTitle || '').trim();
          if (t && !seenTitles.has(t.toLowerCase())) {
            seenTitles.add(t.toLowerCase());
            eventsList.push({
              id: r.id,
              sportId: r.sportId || '',
              title: t
            });
          }
        });
      }
    } catch (e) {
      console.warn('Direct SQL fetch for coordinator_event_items failed, using Prisma fallback:', e.message);
    }

    if (eventsList.length === 0) {
      try {
        const prismaEvents = await prisma.coordinatorEventItem.findMany({
          where: { title: { not: '' } },
          select: { id: true, sportId: true, title: true },
          orderBy: { title: 'asc' }
        });
        if (prismaEvents) {
          prismaEvents.forEach((r) => {
            const t = (r.title || '').trim();
            if (t && !seenTitles.has(t.toLowerCase())) {
              seenTitles.add(t.toLowerCase());
              eventsList.push({
                id: r.id,
                sportId: r.sportId || '',
                title: t
              });
            }
          });
        }
      } catch (pErr) {}
    }

    return res.json({
      success: true,
      count: eventsList.length,
      events: eventsList
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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

    let topSport = 'N/A';
    try {
      const topSportRes = await queryDb(
        `SELECT sport_id, COUNT(*) AS wins 
         FROM leaderboard_entries 
         WHERE LOWER(TRIM(winner_college)) = ANY($1::text[])
         GROUP BY sport_id 
         ORDER BY wins DESC 
         LIMIT 1`,
        [exactAliases]
      );
      if (topSportRes && topSportRes.rows.length > 0) {
        topSport = (topSportRes.rows[0].sport_id || 'Sport').replace(/-/g, ' ').toUpperCase();
      }
    } catch (e) {}

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
        topSport
      });
    }

    const medals = inMemoryCollegeMedals[collegeCode] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
    return res.json({ college: collegeCode, ...medals, topSport });
  } catch (err) {
    console.warn('Error fetching college head medal summary from DB:', err.message);
    const scope = await getCollegeAuthScope(req.user).catch(() => ({ collegeCode: 'MPEC' }));
    const medals = inMemoryCollegeMedals[scope.collegeCode] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
    return res.json({ college: scope.collegeCode, ...medals, topSport: 'N/A' });
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
      LEFT JOIN college_registrations cr ON (cr.registration_id = r.id OR cr.id::text = r.id::text OR cr.id::text = m."registrationId"::text)
      LEFT JOIN sports s ON (s.slug = r."sportId"::text OR s.slug = cr.sport_id OR s.name = r."sportId"::text OR s.id::text = r."sportId"::text)
      LEFT JOIN colleges c ON (c.id = r."collegeId" OR c.code = cr.college OR c.name = cr.college)
      WHERE (
        ($1::text IS NOT NULL AND (r."collegeId"::text = $1 OR c.id::text = $1))
        OR (
          LOWER(TRIM(COALESCE(c.code, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(c.name, ''))) = ANY($2::text[])
          OR LOWER(TRIM(COALESCE(cr.college, ''))) = ANY($2::text[])
        )
      )
      ORDER BY COALESCE(cr.created_at, m."createdAt") DESC
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
