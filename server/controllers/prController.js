import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.js';
import { queryDb } from '../config/db.js';
import {
  generateUploadSignature,
  deleteCloudinaryAsset,
  deleteCloudinaryBatch,
} from '../services/cloudinaryService.js';

let inMemoryEvents = [];
let inMemoryMedia = [];

/**
 * PR Coordinator Login
 */
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

/**
 * Generate authenticated Cloudinary upload signature for client
 */
export const getCloudinarySignature = (req, res) => {
  try {
    const folder = req.query.folder || envConfig.cloudinaryFolder || 'sems_gallery';
    const signatureData = generateUploadSignature(folder);
    return res.json({ success: true, ...signatureData });
  } catch (err) {
    console.error('Error generating Cloudinary signature:', err.message);
    return res.status(500).json({ message: 'Failed to generate upload signature' });
  }
};

/**
 * List all event albums with photos & videos counts
 */
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

/**
 * Get event details and associated media
 */
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
      photos: media.filter((m) => (m.media_type || '').toLowerCase() === 'image'),
      videos: media.filter((m) => (m.media_type || '').toLowerCase() === 'video'),
    });
  }

  const event = inMemoryEvents.find((e) => Number(e.id) === Number(id));
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const eventMedia = inMemoryMedia.filter((m) => Number(m.event_id) === Number(id));
  return res.json({
    ...event,
    media: eventMedia,
    photos: eventMedia.filter((m) => (m.media_type || '').toLowerCase() === 'image'),
    videos: eventMedia.filter((m) => (m.media_type || '').toLowerCase() === 'video'),
  });
};

/**
 * Create new event album
 */
export const createEvent = async (req, res) => {
  const { event_name, event_date, cover_image, public_id, description } = req.body;

  if (!event_name || !event_date || !cover_image) {
    return res.status(400).json({ message: 'Event name, event date, and cover image are required.' });
  }

  const dbResult = await queryDb(
    'INSERT INTO events (event_name, event_date, cover_image, public_id, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [event_name, event_date, cover_image, public_id || null, description || '']
  );

  if (dbResult && dbResult.rows.length > 0) {
    return res.status(201).json(dbResult.rows[0]);
  }

  const newEvent = {
    id: Date.now(),
    event_name,
    event_date,
    cover_image,
    public_id: public_id || null,
    description: description || '',
    created_at: new Date().toISOString(),
    photos_count: 0,
    videos_count: 0,
  };
  inMemoryEvents.unshift(newEvent);
  return res.status(201).json(newEvent);
};

/**
 * Update event album
 */
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { event_name, event_date, cover_image, public_id, description } = req.body;

  // If cover image was changed and old cover image had a public_id, we can clean up old asset
  if (cover_image) {
    const existing = await queryDb('SELECT public_id, cover_image FROM events WHERE id = $1', [id]);
    if (existing && existing.rows.length > 0) {
      const oldPublicId = existing.rows[0].public_id;
      if (oldPublicId && public_id && oldPublicId !== public_id) {
        deleteCloudinaryAsset(oldPublicId, 'image').catch(() => {});
      }
    }
  }

  const dbResult = await queryDb(
    'UPDATE events SET event_name = $1, event_date = $2, cover_image = $3, public_id = COALESCE($4, public_id), description = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
    [event_name, event_date, cover_image, public_id || null, description, id]
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
    public_id: public_id !== undefined ? public_id : inMemoryEvents[index].public_id,
    description: description !== undefined ? description : inMemoryEvents[index].description,
  };

  return res.json(inMemoryEvents[index]);
};

/**
 * Delete event album and purge associated Cloudinary assets
 */
export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Find all media associated with this event to purge from Cloudinary
    const mediaRes = await queryDb('SELECT public_id, media_type FROM media WHERE event_id = $1', [id]);
    const eventRes = await queryDb('SELECT public_id FROM events WHERE id = $1', [id]);

    const itemsToDelete = [];
    if (mediaRes && mediaRes.rows) {
      mediaRes.rows.forEach((m) => {
        if (m.public_id) {
          itemsToDelete.push({ publicId: m.public_id, resourceType: (m.media_type || '').toLowerCase() });
        }
      });
    }
    if (eventRes && eventRes.rows.length > 0 && eventRes.rows[0].public_id) {
      itemsToDelete.push({ publicId: eventRes.rows[0].public_id, resourceType: 'image' });
    }

    if (itemsToDelete.length > 0) {
      await deleteCloudinaryBatch(itemsToDelete);
    }
  } catch (err) {
    console.error('Error cleaning up Cloudinary assets on deleteEvent:', err.message);
  }

  const dbResult = await queryDb('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

  if (dbResult && dbResult.rows.length > 0) {
    return res.json({ success: true, message: 'Event deleted successfully.' });
  }

  inMemoryEvents = inMemoryEvents.filter((e) => Number(e.id) !== Number(id));
  inMemoryMedia = inMemoryMedia.filter((m) => Number(m.event_id) !== Number(id));

  return res.json({ success: true, message: 'Event deleted successfully.' });
};

/**
 * Upload media record (persisting public_id alongside URL)
 */
export const uploadMedia = async (req, res) => {
  const { event_id, media_type, title, media_url, public_id } = req.body;

  if (!event_id || !media_type || !title || !media_url) {
    return res.status(400).json({ message: 'Event ID, media type, title, and media URL are required.' });
  }

  const normalizedType = media_type.toLowerCase();
  if (!['image', 'video'].includes(normalizedType)) {
    return res.status(400).json({ message: 'media_type must be either image or video' });
  }

  const dbResult = await queryDb(
    'INSERT INTO media (event_id, media_type, title, media_url, public_id, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [event_id, normalizedType, title, media_url, public_id || null, req.user?.username || 'PR Coordinator']
  );

  if (dbResult && dbResult.rows.length > 0) {
    return res.status(201).json(dbResult.rows[0]);
  }

  const newMedia = {
    id: Date.now(),
    event_id: Number(event_id),
    media_type: normalizedType,
    title,
    media_url,
    public_id: public_id || null,
    uploaded_by: req.user?.username || 'PR Coordinator',
    uploaded_at: new Date().toISOString(),
  };

  inMemoryMedia.unshift(newMedia);
  return res.status(201).json(newMedia);
};

/**
 * Get media by event ID
 */
export const getMediaByEventId = async (req, res) => {
  const { eventId } = req.params;

  const dbResult = await queryDb('SELECT * FROM media WHERE event_id = $1 ORDER BY uploaded_at DESC', [eventId]);

  if (dbResult && dbResult.rows) {
    return res.json(dbResult.rows);
  }

  const media = inMemoryMedia.filter((m) => Number(m.event_id) === Number(eventId));
  return res.json(media);
};

/**
 * Delete single media item and purge from Cloudinary
 */
export const deleteMedia = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await queryDb('SELECT public_id, media_type FROM media WHERE id = $1', [id]);
    if (existing && existing.rows.length > 0) {
      const { public_id, media_type } = existing.rows[0];
      if (public_id) {
        await deleteCloudinaryAsset(public_id, media_type || 'image');
      }
    }
  } catch (err) {
    console.error('Error purging Cloudinary asset on deleteMedia:', err.message);
  }

  const dbResult = await queryDb('DELETE FROM media WHERE id = $1 RETURNING *', [id]);

  if (dbResult && dbResult.rows.length > 0) {
    return res.json({ success: true, message: 'Media item deleted successfully.' });
  }

  inMemoryMedia = inMemoryMedia.filter((m) => Number(m.id) !== Number(id));
  return res.json({ success: true, message: 'Media item deleted successfully.' });
};
