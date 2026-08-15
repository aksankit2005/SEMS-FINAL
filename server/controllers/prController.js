import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.js';
import { queryDb } from '../config/db.js';

let inMemoryEvents = [];
let inMemoryMedia = [];

export const prLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  // Database authentication
  const dbResult = await queryDb('SELECT * FROM pr_users WHERE username = $1', [username]);
  if (dbResult && dbResult.rows.length > 0) {
    const user = dbResult.rows[0];
    if (user.status && user.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
    }
    let isValid = false;
    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    } else if (envConfig.passPrAdmin) {
      isValid = (password === envConfig.passPrAdmin);
    }
    if (isValid) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role || 'pr_coordinator' },
        envConfig.jwtSecret,
        { expiresIn: '24h' }
      );
      return res.json({ success: true, token, user: { username: user.username, role: user.role || 'pr_coordinator' } });
    } else {
      return res.status(401).json({ message: 'Invalid credentials. Access denied.' });
    }
  }

  // Environment credential check fallback
  if (username === envConfig.prAdminUsername && envConfig.passPrAdmin && password === envConfig.passPrAdmin) {
    const token = jwt.sign(
      { username: envConfig.prAdminUsername, role: 'pr_coordinator' },
      envConfig.jwtSecret,
      { expiresIn: '24h' }
    );
    return res.json({ success: true, token, user: { username: envConfig.prAdminUsername, role: 'pr_coordinator' } });
  }

  return res.status(401).json({ message: 'Invalid credentials. Access denied.' });
};

export const getEvents = async (req, res) => {
  const dbResult = await queryDb(`
    SELECT e.*,
      COUNT(CASE WHEN LOWER(m.media_type::text) = 'image' THEN 1 END)::int AS photos_count,
      COUNT(CASE WHEN LOWER(m.media_type::text) = 'video' THEN 1 END)::int AS videos_count
    FROM events e
    LEFT JOIN media m ON e.id = m.event_id
    GROUP BY e.id
    ORDER BY e.event_date DESC
  `);

  if (dbResult && dbResult.rows) {
    return res.json(dbResult.rows);
  }

  const formattedEvents = inMemoryEvents.map((ev) => {
    const evMedia = inMemoryMedia.filter((m) => Number(m.event_id) === Number(ev.id));
    return {
      ...ev,
      photos_count: evMedia.filter((m) => m.media_type === 'image').length,
      videos_count: evMedia.filter((m) => m.media_type === 'video').length,
    };
  });

  return res.json(formattedEvents);
};

export const getEventById = async (req, res) => {
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

  const event = inMemoryEvents.find((e) => Number(e.id) === Number(id));
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const eventMedia = inMemoryMedia.filter((m) => Number(m.event_id) === Number(id));
  return res.json({
    ...event,
    media: eventMedia,
    photos: eventMedia.filter((m) => m.media_type === 'image'),
    videos: eventMedia.filter((m) => m.media_type === 'video'),
  });
};

export const createEvent = async (req, res) => {
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
};

export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { event_name, event_date, cover_image, description } = req.body;

  const dbResult = await queryDb(
    'UPDATE events SET event_name = $1, event_date = $2, cover_image = $3, description = $4 WHERE id = $5 RETURNING *',
    [event_name, event_date, cover_image, description, id]
  );

  if (dbResult && dbResult.rows.length > 0) {
    return res.json(dbResult.rows[0]);
  }

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
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  const dbResult = await queryDb('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

  if (dbResult && dbResult.rows.length > 0) {
    return res.json({ success: true, message: 'Event deleted successfully.' });
  }

  inMemoryEvents = inMemoryEvents.filter((e) => Number(e.id) !== Number(id));
  inMemoryMedia = inMemoryMedia.filter((m) => Number(m.event_id) !== Number(id));

  return res.json({ success: true, message: 'Event deleted successfully.' });
};

export const uploadMedia = async (req, res) => {
  const { event_id, media_type, title, media_url } = req.body;

  if (!event_id || !media_type || !title || !media_url) {
    return res.status(400).json({ message: 'Event ID, media type, title, and media URL are required.' });
  }

  if (!['image', 'video'].includes(media_type)) {
    return res.status(400).json({ message: 'media_type must be either image or video' });
  }

  const dbResult = await queryDb(
    'INSERT INTO media (event_id, media_type, title, media_url, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [event_id, media_type.toUpperCase(), title, media_url, req.user?.username || 'PR Coordinator']
  );

  if (dbResult && dbResult.rows.length > 0) {
    return res.status(201).json(dbResult.rows[0]);
  }

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
};

export const getMediaByEventId = async (req, res) => {
  const { eventId } = req.params;

  const dbResult = await queryDb('SELECT * FROM media WHERE event_id = $1 ORDER BY uploaded_at DESC', [eventId]);

  if (dbResult && dbResult.rows) {
    return res.json(dbResult.rows);
  }

  const media = inMemoryMedia.filter((m) => Number(m.event_id) === Number(eventId));
  return res.json(media);
};

export const deleteMedia = async (req, res) => {
  const { id } = req.params;

  const dbResult = await queryDb('DELETE FROM media WHERE id = $1 RETURNING *', [id]);

  if (dbResult && dbResult.rows.length > 0) {
    return res.json({ success: true, message: 'Media item deleted successfully.' });
  }

  inMemoryMedia = inMemoryMedia.filter((m) => Number(m.id) !== Number(id));
  return res.json({ success: true, message: 'Media item deleted successfully.' });
};
