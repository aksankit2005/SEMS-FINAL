import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sems_pr_coordinator_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool Setup
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'sems_db',
  port: parseInt(process.env.PGPORT || '5432', 10),
};

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : dbConfig
);

// Fallback in-memory dataset when PostgreSQL database connection is unavailable
let inMemoryEvents = [];
let inMemoryMedia = [];

// Helper to execute SQL query with fallback to memory
const queryDb = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    return null; // DB fallback trigger
  }
};

// Authentication Middleware for PR Coordinator Routes
const verifyPRToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. PR Coordinator token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
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
    // In production bcrypt password comparison
    if (password === 'password123' || user.password_hash) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ success: true, token, user: { username: user.username, role: user.role } });
    }
  }

  // Default hardcoded credential check (pr_admin / password123)
  if (username === 'pr_admin' && password === 'password123') {
    const token = jwt.sign({ username: 'pr_admin', role: 'pr_coordinator' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ success: true, token, user: { username: 'pr_admin', role: 'pr_coordinator' } });
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SEMS PR Coordinator API Server' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 PR Coordinator API Server running on port ${PORT}`);
});
