import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 5000;

// ─── SECURITY: JWT Secret — must be set in .env; no insecure default in production ───
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start in production.');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET not set. Using insecure default for development only.');
  }
}
const JWT_SECRET_VALUE = JWT_SECRET || 'sems_dev_only_secret_CHANGE_IN_PRODUCTION';

// PR Admin credentials configurable via environment variables
const PR_ADMIN_USERNAME = process.env.PR_ADMIN_USERNAME || 'pr_admin';
const PR_ADMIN_PASSWORD = process.env.PASS_PR_ADMIN || process.env.PR_ADMIN_PASSWORD || 'password123';

// Common default password configurable via environment variable
const COMMON_PASSWORD = process.env.COMMON_PASSWORD || 'sems#2026';

// Unique Passwords mapping for each College Head (Loaded from Environment Variables)
const HEAD_PASSWORDS = {
  head_mpec: process.env.PASS_HEAD_MPEC,
  head_mips: process.env.PASS_HEAD_MIPS,
  head_mpcps: process.env.PASS_HEAD_MPCPS,
  head_mpcp: process.env.PASS_HEAD_MPCP,
  head_mpdc: process.env.PASS_HEAD_MPDC,
  head_mpcnps: process.env.PASS_HEAD_MPCNPS,
  head_mpamc: process.env.PASS_HEAD_MPAMC,
  head_mpcams: process.env.PASS_HEAD_MPCAMS,
};

// ─── SECURITY HEADERS (Helmet.js) ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Managed at CDN/proxy level for SPA
  crossOriginEmbedderPolicy: false,
}));

// ─── COMPRESSION ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── BODY PARSING with size limit ────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login attempts per 15 min per IP
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests/min per IP
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply API-wide limiter
app.use('/api/', apiLimiter);
// Apply strict limiter on all auth endpoints
app.use('/api/pr/login', authLimiter);
app.use('/api/college-head/login', authLimiter);
app.use('/api/coordinator/login', authLimiter);

// PostgreSQL Connection Pool Setup
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'mydb',
  port: parseInt(process.env.PGPORT || '5432', 10),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(dbConfig);
const prismaAdapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: prismaAdapter });

// Fallback in-memory dataset when PostgreSQL database connection is unavailable
let inMemoryEvents = [];
let inMemoryMedia = [];

// In-memory College Head Users Dataset (No hardcoded passwords in source code)
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

// Clean memory dataset for registrations (wiped of dummy records)
const inMemoryCollegeRegistrations = [];

// College Medal Standings Summary
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

// Helper to execute SQL query with fallback to memory
const queryDb = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Database Query Error:', err.message);
    return null;
  }
};

// ─── Authentication Middleware for PR Coordinator Routes ──────────────────────
const verifyPRToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. PR Coordinator token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALUE);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// ─── Authentication & Authorization Middleware for College Head Routes ─────────
const verifyCollegeHeadToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. College Head token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALUE);
    if (decoded.role !== 'college_head') {
      return res.status(403).json({ message: 'Access denied. College Head role required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired College Head token.' });
  }
};

// ----------------------------------------------------
// 1. PR Coordinator Auth Routes
// ----------------------------------------------------
app.post('/api/pr/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  // Attempt DB Authentication
  const dbResult = await queryDb('SELECT * FROM pr_users WHERE username = $1', [username]);
  if (dbResult && dbResult.rows.length > 0) {
    const user = dbResult.rows[0];
    // Verify via bcrypt hash first
    let isValid = false;
    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    }
    // Fallback plain-text check (env-configured password)
    if (!isValid) {
      isValid = (password === PR_ADMIN_PASSWORD);
    }
    if (isValid) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET_VALUE, { expiresIn: '24h' });
      return res.json({ success: true, token, user: { username: user.username, role: user.role } });
    } else {
      return res.status(401).json({ message: 'Invalid credentials. Access denied.' });
    }
  }

  // Environment-configured credential check (no DB record)
  if (username === PR_ADMIN_USERNAME && password === PR_ADMIN_PASSWORD) {
    const token = jwt.sign({ username: PR_ADMIN_USERNAME, role: 'pr_coordinator' }, JWT_SECRET_VALUE, { expiresIn: '24h' });
    return res.json({ success: true, token, user: { username: PR_ADMIN_USERNAME, role: 'pr_coordinator' } });
  }

  return res.status(401).json({ message: 'Invalid credentials. Access denied.' });
});

// ----------------------------------------------------
// 2. Events API Endpoints
// ----------------------------------------------------

// GET /api/events - List all events with media counts
app.get('/api/events', async (req, res) => {
  const dbResult = await queryDb(`
    SELECT e.*,
      COUNT(CASE WHEN m.media_type = 'image' THEN 1 END)::int AS photos_count,
      COUNT(CASE WHEN m.media_type = 'video' THEN 1 END)::int AS videos_count
    FROM events e
    LEFT JOIN media m ON e.id = m.event_id
    GROUP BY e.id
    ORDER BY e.event_date DESC
  `);

  if (dbResult && dbResult.rows) {
    return res.json(dbResult.rows);
  }

  // Fallback memory list
  const formattedEvents = inMemoryEvents.map((ev) => {
    const evMedia = inMemoryMedia.filter((m) => Number(m.event_id) === Number(ev.id));
    return {
      ...ev,
      photos_count: evMedia.filter((m) => m.media_type === 'image').length,
      videos_count: evMedia.filter((m) => m.media_type === 'video').length,
    };
  });

  return res.json(formattedEvents);
});

// GET /api/events/:id - Get event details and media list
app.get('/api/events/:id', async (req, res) => {
  const { id } = req.params;

  const eventDb = await queryDb('SELECT * FROM events WHERE id = $1', [id]);
  const mediaDb = await queryDb('SELECT * FROM media WHERE event_id = $1 ORDER BY uploaded_at DESC', [id]);

  if (eventDb && eventDb.rows.length > 0) {
    const event = eventDb.rows[0];
    const media = mediaDb ? mediaDb.rows : [];
    return res.json({
      ...event,
      media,
      photos: media.filter((m) => m.media_type === 'image'),
      videos: media.filter((m) => m.media_type === 'video'),
    });
  }

  // Fallback memory search
  const event = inMemoryEvents.find((e) => Number(e.id) === Number(id));
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const eventMedia = inMemoryMedia.filter((m) => Number(m.event_id) === Number(id));
  return res.json({
    ...event,
    media: eventMedia,
    photos: eventMedia.filter((m) => m.media_type === 'image'),
    videos: eventMedia.filter((m) => m.media_type === 'video'),
  });
});

// POST /api/events - Create new event (Protected)
app.post('/api/events', verifyPRToken, async (req, res) => {
  const { event_name, event_date, cover_image, description } = req.body;

  if (!event_name || !event_date || !cover_image) {
    return res.status(400).json({ message: 'Event name, event date, and cover image are required.' });
  }

  const dbResult = await queryDb(
    'INSERT INTO events (event_name, event_date, cover_image, description) VALUES ($1, $2, $3, $4) RETURNING *',
    [event_name, event_date, cover_image, description || '']
  );

  if (dbResult && dbResult.rows.length > 0) {
    return res.status(201).json(dbResult.rows[0]);
  }

  // Memory fallback insertion
  const newEvent = {
    id: Date.now(),
    event_name,
    event_date,
    cover_image,
    description: description || '',
    created_at: new Date().toISOString(),
    photos_count: 0,
    videos_count: 0,
  };
  inMemoryEvents.unshift(newEvent);
  return res.status(201).json(newEvent);
});

// PUT /api/events/:id - Update existing event (Protected)
app.put('/api/events/:id', verifyPRToken, async (req, res) => {
  const { id } = req.params;
  const { event_name, event_date, cover_image, description } = req.body;

  const dbResult = await queryDb(
    'UPDATE events SET event_name = $1, event_date = $2, cover_image = $3, description = $4 WHERE id = $5 RETURNING *',
    [event_name, event_date, cover_image, description, id]
  );

  if (dbResult && dbResult.rows.length > 0) {
    return res.json(dbResult.rows[0]);
  }

  // Memory fallback update
  const index = inMemoryEvents.findIndex((e) => Number(e.id) === Number(id));
  if (index === -1) return res.status(404).json({ message: 'Event not found' });

  inMemoryEvents[index] = {
    ...inMemoryEvents[index],
    event_name: event_name || inMemoryEvents[index].event_name,
    event_date: event_date || inMemoryEvents[index].event_date,
    cover_image: cover_image || inMemoryEvents[index].cover_image,
    description: description !== undefined ? description : inMemoryEvents[index].description,
  };

  return res.json(inMemoryEvents[index]);
});

// DELETE /api/events/:id - Delete event & cascade media (Protected)
app.delete('/api/events/:id', verifyPRToken, async (req, res) => {
  const { id } = req.params;

  const dbResult = await queryDb('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

  if (dbResult && dbResult.rows.length > 0) {
    return res.json({ success: true, message: 'Event deleted successfully.' });
  }

  // Memory fallback deletion
  inMemoryEvents = inMemoryEvents.filter((e) => Number(e.id) !== Number(id));
  inMemoryMedia = inMemoryMedia.filter((m) => Number(m.event_id) !== Number(id));

  return res.json({ success: true, message: 'Event deleted successfully.' });
});

// ----------------------------------------------------
// 3. Media Upload & Management Endpoints
// ----------------------------------------------------

// POST /api/media/upload - Upload media photo/video (Protected)
app.post('/api/media/upload', verifyPRToken, async (req, res) => {
  const { event_id, media_type, title, media_url } = req.body;

  if (!event_id || !media_type || !title || !media_url) {
    return res.status(400).json({ message: 'Event ID, media type, title, and media URL are required.' });
  }

  if (!['image', 'video'].includes(media_type)) {
    return res.status(400).json({ message: 'media_type must be either image or video' });
  }

  const dbResult = await queryDb(
    'INSERT INTO media (event_id, media_type, title, media_url, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [event_id, media_type, title, media_url, req.user?.username || 'PR Coordinator']
  );

  if (dbResult && dbResult.rows.length > 0) {
    return res.status(201).json(dbResult.rows[0]);
  }

  // Memory fallback media insertion
  const newMedia = {
    id: Date.now(),
    event_id: Number(event_id),
    media_type,
    title,
    media_url,
    uploaded_by: req.user?.username || 'PR Coordinator',
    uploaded_at: new Date().toISOString(),
  };

  inMemoryMedia.unshift(newMedia);
  return res.status(201).json(newMedia);
});

// GET /api/media/event/:eventId - Get media by Event ID
app.get('/api/media/event/:eventId', async (req, res) => {
  const { eventId } = req.params;

  const dbResult = await queryDb('SELECT * FROM media WHERE event_id = $1 ORDER BY uploaded_at DESC', [eventId]);

  if (dbResult && dbResult.rows) {
    return res.json(dbResult.rows);
  }

  const media = inMemoryMedia.filter((m) => Number(m.event_id) === Number(eventId));
  return res.json(media);
});

// DELETE /api/media/:id - Delete media item (Protected)
app.delete('/api/media/:id', verifyPRToken, async (req, res) => {
  const { id } = req.params;

  const dbResult = await queryDb('DELETE FROM media WHERE id = $1 RETURNING *', [id]);

  if (dbResult && dbResult.rows.length > 0) {
    return res.json({ success: true, message: 'Media item deleted successfully.' });
  }

  inMemoryMedia = inMemoryMedia.filter((m) => Number(m.id) !== Number(id));
  return res.json({ success: true, message: 'Media item deleted successfully.' });
});

// ----------------------------------------------------
// 4. College Head Sports Faculty Routes (Read-Only)
// ----------------------------------------------------

// Helper to sanitize student data for College Head (strip all financial/payment fields)
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

// POST /api/college-head/login - Authenticate College Head
app.post('/api/college-head/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const userKey = username.toLowerCase();
  const expectedPassword = HEAD_PASSWORDS[userKey];

  // Attempt DB Authentication (passwords stored as bcrypt hash)
  const dbResult = await queryDb('SELECT * FROM college_head_users WHERE LOWER(username) = $1', [userKey]);
  if (dbResult && dbResult.rows.length > 0) {
    const user = dbResult.rows[0];

    // Try bcrypt hash compare first (DB stored hash)
    let isValid = false;
    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    }

    // Fallback: plain-text comparison with env passwords
    if (!isValid) {
      isValid =
        password === COMMON_PASSWORD ||
        (expectedPassword && password === expectedPassword) ||
        password === PR_ADMIN_PASSWORD;
    }

    if (isValid) {
      const token = jwt.sign(
        { id: user.id, username: user.username, college: user.college, faculty_name: user.faculty_name, role: 'college_head' },
        JWT_SECRET_VALUE,
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

  // Fallback in-memory check (plain-text env passwords)
  const memoryUser = inMemoryCollegeHeadUsers.find(
    (u) => u.username.toLowerCase() === userKey
  );

  if (memoryUser) {
    const isValid =
      password === COMMON_PASSWORD ||
      (expectedPassword && password === expectedPassword) ||
      password === PR_ADMIN_PASSWORD;

    if (isValid) {
      const token = jwt.sign(
        { id: memoryUser.id, username: memoryUser.username, college: memoryUser.college, faculty_name: memoryUser.faculty_name, role: 'college_head' },
        JWT_SECRET_VALUE,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        token,
        user: { username: memoryUser.username, college: memoryUser.college, faculty_name: memoryUser.faculty_name, role: 'college_head' }
      });
    } else {
      return res.status(401).json({ message: 'Invalid password for this college head. Access denied.' });
    }
  }

  return res.status(401).json({ message: 'Invalid College Head credentials. Access denied.' });
});

// GET /api/college-head/dashboard-stats - Read-Only Stats for Assigned College from PostgreSQL
app.get('/api/college-head/dashboard-stats', verifyCollegeHeadToken, async (req, res) => {
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
});

// GET /api/college-head/students - Read-Only Student List for Assigned College ONLY from PostgreSQL
app.get('/api/college-head/students', verifyCollegeHeadToken, async (req, res) => {
  try {
    const college = req.user.college || 'MPEC';
    const { search, sport, status, year } = req.query;

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

    return res.json({
      college,
      count: sanitizedStudents.length,
      students: sanitizedStudents,
    });
  } catch (err) {
    console.error('Error fetching college head students:', err);
    return res.status(500).json({ message: 'Error loading student list' });
  }
});

// GET /api/college-head/registrations - Read-Only Registrations for Assigned College ONLY from PostgreSQL
app.get('/api/college-head/registrations', verifyCollegeHeadToken, async (req, res) => {
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
});

// GET /api/college-head/sports-participation - Sports Breakdown for Assigned College
app.get('/api/college-head/sports-participation', verifyCollegeHeadToken, async (req, res) => {
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
});

// GET /api/college-head/medal-summary - Read-Only Medal Tally for Assigned College
app.get('/api/college-head/medal-summary', verifyCollegeHeadToken, (req, res) => {
  const college = req.user.college || 'MPEC';
  const medals = inMemoryCollegeMedals[college] || { gold: 0, silver: 0, bronze: 0, totalPoints: 0, topSport: 'N/A' };
  return res.json({ college, ...medals });
});

// GET /api/college-head/export-report - Export Summary Data for Assigned College ONLY
app.get('/api/college-head/export-report', verifyCollegeHeadToken, async (req, res) => {
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
});

// ----------------------------------------------------
// 5. Sport Coordinator Routes (Strictly Assigned Sport Isolation)
// ----------------------------------------------------

const COORDINATOR_PASSWORDS = {
  coord_cricket: process.env.PASS_COORD_CRICKET || 'cricket#2026',
  coord_table_tennis: process.env.PASS_COORD_TABLE_TENNIS || 'table_tennis#2026',
  coord_badminton: process.env.PASS_COORD_BADMINTON || 'badminton#2026',
  coord_chess: process.env.PASS_COORD_CHESS || 'chess#2026',
  coord_football: process.env.PASS_COORD_FOOTBALL || 'football#2026',
  coord_basketball: process.env.PASS_COORD_BASKETBALL || 'basketball#2026',
  coord_volleyball: process.env.PASS_COORD_VOLLEYBALL || 'volleyball#2026',
  coord_kabaddi: process.env.PASS_COORD_KABADDI || 'kabaddi#2026',
  coord_kho_kho: process.env.PASS_COORD_KHO_KHO || 'kho_kho#2026',
  coord_athletics: process.env.PASS_COORD_ATHLETICS || 'athletics#2026',
  coord_tug_of_war: process.env.PASS_COORD_TUG_OF_WAR || 'tug_of_war#2026',
  coord_gully_cricket: process.env.PASS_COORD_GULLY_CRICKET || 'gully_cricket#2026',
};

const inMemorySportCoordinators = [
  { id: 1, username: 'coord_cricket', assignedSport: 'cricket', sportName: 'Cricket', coordinatorName: 'Vikramaditya Sharma', email: 'cricket.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 2, username: 'coord_table_tennis', assignedSport: 'table-tennis', sportName: 'Table Tennis', coordinatorName: 'Rohan Mehta', email: 'tt.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 3, username: 'coord_badminton', assignedSport: 'badminton', sportName: 'Badminton', coordinatorName: 'Pooja Deshmukh', email: 'badminton.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 4, username: 'coord_chess', assignedSport: 'chess', sportName: 'Chess', coordinatorName: 'Grandmaster Anand Verma', email: 'chess.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 5, username: 'coord_football', assignedSport: 'football', sportName: 'Football', coordinatorName: 'Carlos Rodriguez', email: 'football.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 6, username: 'coord_basketball', assignedSport: 'basketball', sportName: 'Basketball', coordinatorName: 'Michael Jordan Singh', email: 'basketball.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 7, username: 'coord_volleyball', assignedSport: 'volleyball', sportName: 'Volleyball', coordinatorName: 'Siddharth Rao', email: 'volleyball.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 8, username: 'coord_kabaddi', assignedSport: 'kabaddi', sportName: 'Kabaddi', coordinatorName: 'Pradeep Narwal Kumar', email: 'kabaddi.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 9, username: 'coord_kho_kho', assignedSport: 'kho-kho', sportName: 'Kho-Kho', coordinatorName: 'Sunita Jadhav', email: 'khokho.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 10, username: 'coord_athletics', assignedSport: 'athletics', sportName: 'Athletics', coordinatorName: 'PT Usha Pillai', email: 'athletics.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 11, username: 'coord_tug_of_war', assignedSport: 'tug-of-war', sportName: 'Tug of War', coordinatorName: 'Bheem Singh Power', email: 'tugofwar.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
  { id: 12, username: 'coord_gully_cricket', assignedSport: 'gully-cricket', sportName: 'Gully Cricket', coordinatorName: 'Chiku Bhai', email: 'gullycricket.coord@sems.edu', role: 'sport_coordinator', status: 'active' },
];

// Coordinator Dynamic Data Stores (Keyed by assignedSport) - Cleared of dummy records
let inMemoryCoordinatorMatches = {};

let inMemoryCoordinatorDocuments = {};
let inMemoryCoordinatorAnnouncements = {};
let inMemoryRegistrationSettings = {};
let inMemoryCoordinatorEvents = {};

// ─── Authentication & Authorization Middleware for Sport Coordinator Routes ────
const verifyCoordinatorToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Sport Coordinator token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALUE);
    if (decoded.role !== 'sport_coordinator') {
      return res.status(403).json({ message: 'Access denied. Sport Coordinator role required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired Sport Coordinator token.' });
  }
};

// POST /api/coordinator/login
app.post('/api/coordinator/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const userKey = username.toLowerCase().replace(/-/g, '_');

  // Attempt DB Login — verify bcrypt hash
  const dbResult = await queryDb('SELECT * FROM sport_coordinators WHERE LOWER(username) = $1', [userKey]);
  if (dbResult && dbResult.rows.length > 0) {
    const user = dbResult.rows[0];

    // Try bcrypt hash compare first
    let isValid = false;
    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    }
    // Fallback: plain-text env password comparison
    if (!isValid) {
      const expectedPassword = COORDINATOR_PASSWORDS[userKey];
      isValid =
        password === COMMON_PASSWORD ||
        (expectedPassword && password === expectedPassword) ||
        password === PR_ADMIN_PASSWORD;
    }

    if (isValid) {
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          assignedSport: user.assigned_sport,
          sportName: user.sport_name,
          coordinatorName: user.coordinator_name,
          email: user.email,
          role: 'sport_coordinator',
        },
        JWT_SECRET_VALUE,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        token,
        user: {
          username: user.username,
          assignedSport: user.assigned_sport,
          sportName: user.sport_name,
          coordinatorName: user.coordinator_name,
          email: user.email,
          role: 'sport_coordinator',
        },
      });
    } else {
      return res.status(401).json({ message: 'Invalid Sport Coordinator credentials. Access denied.' });
    }
  }

  // In-memory fallback authentication
  const expectedPassword = COORDINATOR_PASSWORDS[userKey];
  const isValidPassword =
    password === COMMON_PASSWORD ||
    (expectedPassword && password === expectedPassword) ||
    password === PR_ADMIN_PASSWORD;

  const coord = inMemorySportCoordinators.find(
    (c) => c.username.toLowerCase() === userKey || c.assignedSport.toLowerCase() === userKey
  );

  if (coord && isValidPassword) {
    const token = jwt.sign(
      {
        id: coord.id,
        username: coord.username,
        assignedSport: coord.assignedSport,
        sportName: coord.sportName,
        coordinatorName: coord.coordinatorName,
        email: coord.email,
        role: 'sport_coordinator',
      },
      JWT_SECRET_VALUE,
      { expiresIn: '24h' }
    );
    return res.json({
      success: true,
      token,
      user: {
        username: coord.username,
        assignedSport: coord.assignedSport,
        sportName: coord.sportName,
        coordinatorName: coord.coordinatorName,
        email: coord.email,
        role: 'sport_coordinator',
      },
    });
  }

  return res.status(401).json({ message: 'Invalid Sport Coordinator credentials. Access denied.' });
});

// GET /api/coordinator/profile
app.get('/api/coordinator/profile', verifyCoordinatorToken, (req, res) => {
  return res.json(req.user);
});

// GET /api/coordinator/matches - Get matches for assigned sport ONLY
app.get('/api/coordinator/matches', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const matches = inMemoryCoordinatorMatches[sportId] || [];
  return res.json(matches);
});

// POST /api/coordinator/matches - Create new match fixture
app.post('/api/coordinator/matches', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const newMatch = {
    id: req.body.id || `M${Math.floor(100000 + Math.random() * 900000)}`,
    format: (req.body.format || 'SINGLES').toUpperCase(),
    status: req.body.status || 'SCHEDULED',
    team1: req.body.team1,
    team2: req.body.team2,
    matchTitle: req.body.matchTitle || `${req.body.team1} vs ${req.body.team2}`,
    tableNumber: req.body.tableNumber || 'Table 1',
    time: req.body.time || '05:30 PM',
    score1: 0,
    score2: 0,
    winner: null,
    createdAt: new Date().toISOString(),
  };

  if (!inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = [];
  }
  inMemoryCoordinatorMatches[sportId].unshift(newMatch);
  return res.status(201).json({ success: true, match: newMatch });
});

// PUT /api/coordinator/matches/:id - Update match schedule
app.put('/api/coordinator/matches/:id', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;
  const list = inMemoryCoordinatorMatches[sportId] || [];

  const index = list.findIndex((m) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Match not found' });
  }

  list[index] = { ...list[index], ...req.body };
  return res.json({ success: true, match: list[index] });
});

// DELETE /api/coordinator/matches/:id - Delete match fixture
app.delete('/api/coordinator/matches/:id', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  if (inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = inMemoryCoordinatorMatches[sportId].filter((m) => m.id !== id);
  }
  return res.json({ success: true, message: 'Match fixture deleted' });
});

// POST /api/coordinator/matches/generate - Auto-generate tournament fixtures
app.post('/api/coordinator/matches/generate', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const formatType = (req.body.type || 'Singles').toUpperCase();
  const list = inMemoryRegistrations[sportId] || [];

  if (!list || list.length < 2) {
    return res.json({ success: false, message: 'No registered participants found for this sport. Please add registrations first.' });
  }

  const generated = [];
  for (let i = 0; i < list.length - 1; i += 2) {
    const p1 = list[i];
    const p2 = list[i + 1];
    const t1 = p1.teamName || p1.studentName || `Participant ${i + 1}`;
    const t2 = p2.teamName || p2.studentName || `Participant ${i + 2}`;
    generated.push({
      id: `M${Math.floor(100000 + Math.random() * 900000)}`,
      format: formatType,
      status: 'SCHEDULED',
      team1: `${t1} (${p1.college || 'MPEC'})`,
      team2: `${t2} (${p2.college || 'MPEC'})`,
      matchTitle: `${t1} vs ${t2}`,
      tableNumber: `Table ${generated.length + 1}`,
      time: `05:${30 + (generated.length % 2) * 10} PM`,
      score1: 0,
      score2: 0,
    });
  }

  if (!inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = [];
  }
  inMemoryCoordinatorMatches[sportId] = [...generated, ...inMemoryCoordinatorMatches[sportId]];
  return res.json({ success: true, count: generated.length, matches: inMemoryCoordinatorMatches[sportId] });
});

// POST /api/coordinator/matches/clear-all - Clear all fixtures for assigned sport
app.post('/api/coordinator/matches/clear-all', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  inMemoryCoordinatorMatches[sportId] = [];
  return res.json({ success: true, message: 'All scheduled matches cleared' });
});

// POST /api/coordinator/matches/:id/score - Live score entry & YouTube Live Stream update
app.post('/api/coordinator/matches/:id/score', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  if (!inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = [];
  }
  const list = inMemoryCoordinatorMatches[sportId];

  let match = list.find((m) => m.id === id);
  if (!match) {
    match = {
      id,
      format: req.body.format || 'SINGLES',
      status: req.body.status || 'running',
      team1: req.body.team1 || 'Team A',
      team2: req.body.team2 || 'Team B',
      matchTitle: req.body.matchTitle || `${req.body.team1} vs ${req.body.team2}`,
      tableNumber: req.body.venue || req.body.tableNumber || 'Table 1',
      score1: req.body.score1 || 0,
      score2: req.body.score2 || 0,
      createdAt: new Date().toISOString(),
    };
    list.unshift(match);
  }

  if (req.body.score1 !== undefined) match.score1 = req.body.score1;
  if (req.body.score2 !== undefined) match.score2 = req.body.score2;
  if (req.body.status !== undefined) match.status = req.body.status;
  if (req.body.venue !== undefined) match.tableNumber = req.body.venue;
  if (req.body.tableNumber !== undefined) match.tableNumber = req.body.tableNumber;
  if (req.body.team1 !== undefined) match.team1 = req.body.team1;
  if (req.body.team2 !== undefined) match.team2 = req.body.team2;
  if (req.body.matchTitle !== undefined) match.matchTitle = req.body.matchTitle;

  // YouTube Live Stream Metadata fields
  if (req.body.liveStreamUrl !== undefined) match.liveStreamUrl = req.body.liveStreamUrl;
  if (req.body.youtubeVideoId !== undefined) match.youtubeVideoId = req.body.youtubeVideoId;
  if (req.body.isLiveStreaming !== undefined) match.isLiveStreaming = req.body.isLiveStreaming;
  if (req.body.streamStartedAt !== undefined) match.streamStartedAt = req.body.streamStartedAt;
  if (req.body.streamEndedAt !== undefined) match.streamEndedAt = req.body.streamEndedAt;
  if (req.body.liveStreamPlatform !== undefined) match.liveStreamPlatform = req.body.liveStreamPlatform;

  return res.json({ success: true, match });
});

// POST /api/coordinator/matches/:id/complete - Complete match & finalize winner
app.post('/api/coordinator/matches/:id/complete', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  if (!inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = [];
  }
  const list = inMemoryCoordinatorMatches[sportId];

  let match = list.find((m) => m.id === id);
  if (!match) {
    match = {
      id,
      format: req.body.format || 'SINGLES',
      team1: req.body.team1 || 'Team A',
      team2: req.body.team2 || 'Team B',
      matchTitle: req.body.matchTitle || `${req.body.team1} vs ${req.body.team2}`,
    };
    list.unshift(match);
  }

  match.status = 'COMPLETED';
  match.tableNumber = null;
  match.isLiveStreaming = false;
  match.winner = req.body.winner || (match.score1 >= match.score2 ? match.team1 : match.team2);
  match.completedAt = new Date().toISOString();

  return res.json({ success: true, match });
});

// GET /api/coordinator/dashboard-stats - Live counts from PostgreSQL via Prisma Client
app.get('/api/coordinator/dashboard-stats', verifyCoordinatorToken, async (req, res) => {
  try {
    const sportId = (req.user.assignedSport || '').toLowerCase();

    // Query live count from PostgreSQL via Prisma
    const registeredTeams = await prisma.collegeRegistration.count({
      where: {
        sportId: {
          contains: sportId,
          mode: 'insensitive'
        }
      }
    });

    const approvedTeams = await prisma.collegeRegistration.count({
      where: {
        sportId: {
          contains: sportId,
          mode: 'insensitive'
        },
        status: { in: ['Approved', 'Confirmed', 'VERIFIED'] }
      }
    });

    const pendingRegistrations = await prisma.collegeRegistration.count({
      where: {
        sportId: {
          contains: sportId,
          mode: 'insensitive'
        },
        status: 'Pending'
      }
    });

    const sportMatches = inMemoryCoordinatorMatches[sportId] || [];
    const runningMatches = sportMatches.filter((m) => m.status === 'running' || m.status === 'live').length;
    const completedMatches = sportMatches.filter((m) => m.status === 'COMPLETED' || m.status === 'FINISHED').length;
    const upcomingMatches = sportMatches.filter((m) => m.status === 'SCHEDULED').length;

    return res.json({
      assignedSport: req.user.assignedSport,
      sportName: req.user.sportName,
      coordinatorName: req.user.coordinatorName,
      todayMatches: runningMatches + upcomingMatches,
      upcomingMatches,
      runningMatches,
      completedMatches,
      registeredTeams,
      approvedTeams,
      pendingRegistrations,
      playersRegistered: registeredTeams,
      totalMatches: sportMatches.length,
    });
  } catch (err) {
    console.error('Error fetching coordinator dashboard stats from PostgreSQL:', err);
    return res.status(500).json({ message: 'Error loading stats' });
  }
});

// GET /api/coordinator/registrations - Strictly assigned sport from PostgreSQL via Prisma
app.get('/api/coordinator/registrations', verifyCoordinatorToken, async (req, res) => {
  try {
    const sportId = (req.user.assignedSport || '').toLowerCase();

    // Query live registrations from PostgreSQL via Prisma
    const registrations = await prisma.collegeRegistration.findMany({
      where: {
        sportId: {
          contains: sportId,
          mode: 'insensitive'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Also enrich with registration_members if available
    const detailedRegistrations = await Promise.all(
      registrations.map(async (r) => {
        let members = [];
        try {
          members = await prisma.registrationMember.findMany({
            where: {
              registration: {
                id: r.id
              }
            }
          });
        } catch (e) {}

        return {
          id: r.id,
          receiptId: r.id,
          eventId: r.eventId,
          sportId: r.sportId,
          studentName: r.studentName,
          name: r.studentName,
          teamName: r.teamName || '',
          college: r.college,
          department: r.department,
          enrollmentNo: r.enrollmentNo,
          roll: r.enrollmentNo,
          email: r.email,
          phone: r.phone,
          gender: r.gender,
          emergencyContact: r.emergencyContact,
          status: r.status || 'Approved',
          feePaid: r.feePaid,
          paymentId: r.paymentId,
          paymentStatus: r.paymentStatus,
          createdAt: r.createdAt,
          registeredDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          members: members || []
        };
      })
    );

    return res.json(detailedRegistrations);
  } catch (err) {
    console.error('Error fetching coordinator registrations from PostgreSQL:', err);
    return res.status(500).json({ message: 'Error loading registrations from database' });
  }
});

// POST /api/coordinator/registrations/toggle-status
app.post('/api/coordinator/registrations/toggle-status', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { status, deadline } = req.body;

  inMemoryRegistrationSettings[sportId] = {
    status: status || 'Open',
    deadline: deadline || '2026-08-15',
    updatedAt: new Date().toISOString()
  };

  return res.json({
    success: true,
    message: `Registration status updated to ${status} for ${req.user.sportName}`,
    settings: inMemoryRegistrationSettings[sportId]
  });
});

// GET /api/live-matches - Public endpoint returning active live matches for spectators
app.get('/api/live-matches', (req, res) => {
  const allLive = [];
  Object.keys(inMemoryCoordinatorMatches).forEach((sport) => {
    const list = inMemoryCoordinatorMatches[sport] || [];
    list.forEach((m) => {
      if (m.status === 'running' || m.status === 'live') {
        allLive.push({
          ...m,
          sportId: sport,
          sportName: sport.replace(/-/g, ' ').toUpperCase(),
          liveTimer: '14:32',
        });
      }
    });
  });
  return res.json(allLive);
});

// ----------------------------------------------------
// Coordinator Events Management Endpoints
// ----------------------------------------------------

// GET /api/coordinator/events - Get events for logged in coordinator's sport ONLY
app.get('/api/coordinator/events', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const events = inMemoryCoordinatorEvents[sportId] || [];
  return res.json(events);
});

// POST /api/coordinator/events - Create new event for assigned sport
app.post('/api/coordinator/events', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const newEvent = {
    id: req.body.id || `EVT-${sportId.toUpperCase()}-${Date.now()}`,
    title: req.body.title || req.body.eventName || `${req.user.sportName} Championship 2026`,
    sportId: sportId,
    sportName: req.user.sportName,
    coverImage: req.body.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    description: req.body.description || '',
    regStartDate: req.body.regStartDate || new Date().toISOString().split('T')[0],
    regEndDate: req.body.regEndDate || '2026-08-30',
    tournStartDate: req.body.tournStartDate || '2026-09-01',
    tournEndDate: req.body.tournEndDate || '2026-09-05',
    entryFee: Number(req.body.entryFee || 0),
    singlesFee: req.body.singlesFee !== undefined ? Number(req.body.singlesFee) : Number(req.body.entryFee || 300),
    doublesFee: req.body.doublesFee !== undefined ? Number(req.body.doublesFee) : (req.body.singlesFee !== undefined ? Number(req.body.singlesFee) * 2 : 600),
    teamSize: req.body.teamSize || '1 Player',
    maxRegistrations: Number(req.body.maxRegistrations || 64),
    registeredCount: Number(req.body.registeredCount || 0),
    venue: req.body.venue || 'Central Sports Arena',
    category: req.body.category || 'Open',
    status: req.body.status || 'Draft', // Draft, Published, Closed
    rules: req.body.rules || [],
    requiredDocuments: req.body.requiredDocuments || ['College ID Card', 'Student Aadhaar/Govt ID'],
    contactInfo: req.body.contactInfo || {
      name: req.user.coordinatorName,
      email: req.user.email || `${sportId}.coord@sems.edu`,
      phone: '+91 98765 43210'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!inMemoryCoordinatorEvents[sportId]) {
    inMemoryCoordinatorEvents[sportId] = [];
  }
  inMemoryCoordinatorEvents[sportId].unshift(newEvent);

  return res.status(201).json({ success: true, event: newEvent });
});

// PUT /api/coordinator/events/:id - Edit existing event
app.put('/api/coordinator/events/:id', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;
  const list = inMemoryCoordinatorEvents[sportId] || [];

  const index = list.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Auto-close if status changed to Closed or max count reached
  let newStatus = req.body.status !== undefined ? req.body.status : list[index].status;
  if (req.body.registeredCount !== undefined && req.body.registeredCount >= (req.body.maxRegistrations || list[index].maxRegistrations)) {
    newStatus = 'Closed';
  }

  list[index] = {
    ...list[index],
    ...req.body,
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  return res.json({ success: true, event: list[index] });
});

// DELETE /api/coordinator/events/:id - Delete event
app.delete('/api/coordinator/events/:id', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  if (inMemoryCoordinatorEvents[sportId]) {
    inMemoryCoordinatorEvents[sportId] = inMemoryCoordinatorEvents[sportId].filter((e) => e.id !== id);
  }
  return res.json({ success: true, message: 'Event deleted successfully' });
});

// GET /api/coordinator/events/:id/participants - Get participants for an event
app.get('/api/coordinator/events/:id/participants', verifyCoordinatorToken, (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;
  const event = (inMemoryCoordinatorEvents[sportId] || []).find((e) => e.id === id);

  const participants = inMemoryCollegeRegistrations.filter(
    (r) => (r.eventId === id || (r.sportId && r.sportId.toLowerCase() === sportId))
  );

  return res.json({
    event,
    count: participants.length,
    participants
  });
});

// GET /api/public/events - Public list of Published coordinator events
app.get('/api/public/events', (req, res) => {
  const publishedEvents = [];
  const currentDate = new Date();

  Object.keys(inMemoryCoordinatorEvents).forEach((sport) => {
    const list = inMemoryCoordinatorEvents[sport] || [];
    list.forEach((e) => {
      // Check if registration end date passed
      let currentStatus = e.status;
      if (e.regEndDate && new Date(e.regEndDate + 'T23:59:59') < currentDate) {
        currentStatus = 'Closed';
      }
      if (e.registeredCount >= e.maxRegistrations) {
        currentStatus = 'Closed';
      }

      if (currentStatus === 'Published' || currentStatus === 'Closed' || currentStatus === 'Coming Soon') {
        publishedEvents.push({
          ...e,
          status: currentStatus,
          availableSlots: Math.max(0, e.maxRegistrations - e.registeredCount)
        });
      }
    });
  });

  return res.json(publishedEvents);
});

// POST /api/public/register-event - Register user for an event & update roster count
app.post('/api/public/register-event', async (req, res) => {
  const { eventId, sportId, participantData, paymentData } = req.body;

  let event = null;
  let targetSportId = (sportId || '').toLowerCase();

  // Find event
  Object.keys(inMemoryCoordinatorEvents).forEach((sp) => {
    const list = inMemoryCoordinatorEvents[sp] || [];
    const found = list.find((e) => e.id === eventId);
    if (found) {
      event = found;
      targetSportId = sp;
    }
  });

  if (event) {
    if (event.registeredCount >= event.maxRegistrations) {
      return res.status(400).json({ message: 'Registration limit reached. All slots filled.' });
    }

    event.registeredCount += 1;
    if (event.registeredCount >= event.maxRegistrations) {
      event.status = 'Closed';
    }
  }

  const receiptId = `REC-APEX-${Math.floor(10000 + Math.random() * 90000)}`;
  const utrNumber = paymentData?.razorpayPaymentId || `TXN-RP-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

  const newRegRecord = {
    id: receiptId,
    eventId: eventId || 'DEFAULT',
    sportId: targetSportId || 'general',
    studentName: participantData.fullName || participantData.captainName || 'Athlete',
    teamName: participantData.teamName || '',
    college: participantData.collegeName || 'MPEC',
    department: participantData.department || 'Engineering',
    enrollmentNo: participantData.enrollmentNo || 'ENR2026-001',
    email: participantData.email || 'athlete@sems.edu',
    phone: participantData.phone || '+91 98765 43210',
    gender: participantData.gender || 'Male',
    emergencyContact: participantData.emergencyContact || '+91 98765 43211',
    status: 'Approved',
    registeredDate: new Date().toLocaleDateString(),
    feePaid: event ? event.entryFee : (participantData.entryFee || 0),
    paymentId: utrNumber,
    paymentStatus: (event ? event.entryFee : 0) > 0 ? 'PAID' : 'FREE_CONFIRMED'
  };

  inMemoryCollegeRegistrations.unshift(newRegRecord);

  // Save registration record directly to PostgreSQL database using Prisma Client transaction
  try {
    console.log(`📡 Processing registration for ${newRegRecord.studentName} (${newRegRecord.email})...`);

    // 1. Resolve or create primary Event & Sport UUIDs
    let primaryEvent = await prisma.event.findFirst({
      where: { name: 'APEX', year: 2026 }
    });
    if (!primaryEvent) {
      primaryEvent = await prisma.event.create({
        data: {
          name: 'APEX',
          year: 2026,
          status: 'LIVE',
          startDate: new Date('2026-08-10'),
          endDate: new Date('2026-08-20')
        }
      });
    }

    const sportQueryName = targetSportId || sportId || 'badminton';
    let sportRecord = await prisma.sport.findFirst({
      where: { name: { equals: sportQueryName.replace(/-/g, ' '), mode: 'insensitive' } }
    });
    if (!sportRecord) {
      sportRecord = await prisma.sport.findFirst();
    }

    const collegeCode = newRegRecord.college || 'MPEC';
    let collegeRecord = await prisma.college.findFirst({
      where: { code: { equals: collegeCode, mode: 'insensitive' } }
    });

    // 2. Execute Prisma transaction populating registrations, registration_members, payments, receipts, teams, and college_registrations
    await prisma.$transaction(async (tx) => {
      // Create Prisma Registration
      const registration = await tx.registration.create({
        data: {
          eventId: primaryEvent.id,
          sportId: sportRecord.id,
          registrationType: newRegRecord.teamName ? 'TEAM' : 'INDIVIDUAL',
          status: 'VERIFIED',
          amount: newRegRecord.feePaid || 0
        }
      });

      // Create Registration Member(s)
      const rosterList = (Array.isArray(participantData.roster) && participantData.roster.length > 0)
        ? participantData.roster
        : [{
            name: newRegRecord.studentName,
            fatherName: participantData.fatherName || 'N/A',
            rollNo: newRegRecord.enrollmentNo,
            dob: participantData.dob ? new Date(participantData.dob) : new Date('2004-05-15'),
            phone: newRegRecord.phone,
            email: newRegRecord.email,
            aadhaarNumber: participantData.aadhaarNumber || null,
            course: participantData.course || newRegRecord.department || 'B.Tech',
            yearSemester: participantData.yearSemester || participantData.year || '3rd Year',
            gender: (newRegRecord.gender || 'Male').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
            isCaptain: true
          }];

      for (const m of rosterList) {
        await tx.registrationMember.create({
          data: {
            registrationId: registration.id,
            fullName: m.name || newRegRecord.studentName,
            fatherMotherName: m.fatherName || m.fatherMotherName || participantData.fatherName || 'N/A',
            rollNo: m.rollNo || m.rollNumber || newRegRecord.enrollmentNo || 'ENR2026-001',
            dateOfBirth: m.dob ? new Date(m.dob) : new Date('2004-05-15'),
            mobile: m.phone || newRegRecord.phone || '+91 98765 43210',
            alternateMobile: m.alternateMobile || null,
            email: m.email || newRegRecord.email || 'athlete@sems.edu',
            aadhaarNumber: m.aadhaarNumber || null,
            course: m.course || participantData.course || newRegRecord.department || 'B.Tech',
            yearSemester: m.yearSemester || m.year || m.semester || '3rd Year',
            gender: (m.gender || newRegRecord.gender || 'Male').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
            isCaptain: m.isCaptain !== undefined ? m.isCaptain : true
          }
        });
      }

      // Create Payment
      const payment = await tx.payment.create({
        data: {
          registrationId: registration.id,
          amount: newRegRecord.feePaid || 0,
          method: 'ONLINE',
          status: 'SUCCESS',
          transactionId: utrNumber,
          gatewayPaymentId: utrNumber,
          paidAt: new Date()
        }
      });

      // Create Receipt
      await tx.receipt.create({
        data: {
          paymentId: payment.id,
          receiptNumber: receiptId
        }
      });

      // Create Team & TeamMember if team event
      if (newRegRecord.teamName && collegeRecord) {
        const team = await tx.team.create({
          data: {
            eventId: primaryEvent.id,
            sportId: sportRecord.id,
            collegeId: collegeRecord.id,
            name: newRegRecord.teamName,
            captainRegistrationId: registration.id
          }
        });

        await tx.teamMember.create({
          data: {
            teamId: team.id,
            registrationId: registration.id
          }
        });
      }

      // Create CollegeRegistration
      await tx.collegeRegistration.create({
        data: {
          id: receiptId,
          eventId: newRegRecord.eventId,
          sportId: newRegRecord.sportId,
          studentName: newRegRecord.studentName,
          teamName: newRegRecord.teamName || null,
          college: newRegRecord.college,
          department: newRegRecord.department,
          enrollmentNo: newRegRecord.enrollmentNo,
          email: newRegRecord.email,
          phone: newRegRecord.phone,
          gender: newRegRecord.gender,
          emergencyContact: newRegRecord.emergencyContact,
          status: newRegRecord.status,
          feePaid: newRegRecord.feePaid,
          paymentId: newRegRecord.paymentId,
          paymentStatus: newRegRecord.paymentStatus
        }
      });
    });

    console.log(`✅ Registration ${receiptId} saved across ALL Prisma ORM tables in PostgreSQL!`);
  } catch (dbErr) {
    console.error('PostgreSQL Prisma Registration Insert Error:', dbErr);
  }

  return res.status(201).json({
    success: true,
    message: 'Event registration successful!',
    receipt: newRegRecord,
    updatedEvent: event
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'SEMS API Server', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'SEMS API Server', db: 'disconnected' });
  }
});

// ─── 404 catch-all for unknown API routes ────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }
  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body.' });
  }
  // Payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request payload too large (max 1MB).' });
  }
  console.error('[Server Error]', err.message);
  // Never expose stack traces in production
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    message: 'Internal server error.',
    ...(isDev && { error: err.message }),
  });
});

// ─── Process-level crash guards ───────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err.message);
  // Graceful shutdown
  process.exit(1);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 SEMS API Server running on port ${PORT}`);
  console.log(`🔒 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});
