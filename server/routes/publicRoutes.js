import express from 'express';
import { registerPublicEvent } from '../controllers/registrationController.js';
import { queryDb, prisma, pool } from '../config/db.js';

const router = express.Router();

// GET /api/live-matches - Spectator endpoint
router.get('/live-matches', async (req, res) => {
  const dbRes = await queryDb(
    `SELECT id, sport_id AS "sportId", format, status, team1, team2, 
            match_title AS "matchTitle", table_number AS "tableNumber", 
            time, score1, score2, winner 
     FROM live_matches 
     WHERE LOWER(status) IN ('running', 'live') 
     ORDER BY updated_at DESC`
  );

  if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
    const formatted = dbRes.rows.map((m) => ({
      ...m,
      sportId: m.sportId,
      sportName: (m.sportId || '').replace(/-/g, ' ').toUpperCase(),
      liveTimer: m.time || '14:32',
    }));
    return res.json(formatted);
  }

  return res.json([]);
});

// GET /api/public/events - Public event catalog
router.get('/public/events', async (req, res) => {
  const publishedEvents = [];
  const currentDate = new Date();

  try {
    const dbEvents = await prisma.coordinatorEventItem.findMany({
      where: {
        status: { in: ['Published', 'Closed', 'Coming Soon'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (dbEvents && dbEvents.length > 0) {
      dbEvents.forEach((e) => {
        let currentStatus = e.status;
        if (e.regEndDate && new Date(e.regEndDate + 'T23:59:59') < currentDate) {
          currentStatus = 'Closed';
        }
        if ((e.registeredCount || 0) >= (e.maxRegistrations || 64)) {
          currentStatus = 'Closed';
        }
        publishedEvents.push({
          ...e,
          status: currentStatus,
          availableSlots: Math.max(0, (e.maxRegistrations || 64) - (e.registeredCount || 0))
        });
      });
      return res.json(publishedEvents);
    }
  } catch (err) {
    console.error('Error fetching public events from DB:', err.message);
  }

  return res.json([]);
});

// POST /api/public/register-event - Event registration endpoint
router.post('/public/register-event', registerPublicEvent);

// Health check
router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'SEMS API Server', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'SEMS API Server', db: 'disconnected' });
  }
});

export default router;
