import express from 'express';
import { registerPublicEvent } from '../controllers/registrationController.js';
import { getHeroSlidesDB } from '../controllers/adminController.js';
import { queryDb, prisma, pool } from '../config/db.js';

const router = express.Router();

router.get('/public/hero-slides', getHeroSlidesDB);

// GET /api/live-matches - Spectator endpoint
router.get('/live-matches', async (req, res) => {
  try {
    let dbRes = await queryDb(
      `SELECT id, sport_id AS "sportId", format, status, team1, team2, 
              match_title AS "matchTitle", table_number AS "tableNumber", 
              time, score1, score2, winner,
              youtube_video_id AS "youtubeVideoId",
              stream_url AS "streamUrl",
              is_live_streaming AS "isLiveStreaming",
              details,
              sets_history AS "setsHistory",
              current_set AS "currentSet",
              sets_won1 AS "setsWon1",
              sets_won2 AS "setsWon2",
              updated_at AS "updatedAt"
       FROM live_matches 
       WHERE LOWER(status) IN ('running', 'live', 'in_progress', 'active') 
       ORDER BY updated_at DESC`
    );

    if (!dbRes || !dbRes.rows) {
      dbRes = await queryDb(
        `SELECT id, sport_id AS "sportId", format, status, team1, team2, 
                match_title AS "matchTitle", table_number AS "tableNumber", 
                time, score1, score2, winner
         FROM live_matches 
         WHERE LOWER(status) IN ('running', 'live', 'in_progress', 'active')`
      );
    }

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      const formatted = dbRes.rows.map((m) => {
        let detailsObj = m.details;
        if (typeof detailsObj === 'string') {
          try { detailsObj = JSON.parse(detailsObj); } catch (e) {}
        }

        let parsedSetsHistory = m.setsHistory || (detailsObj && detailsObj.setsHistory) || null;
        if (typeof parsedSetsHistory === 'string' && parsedSetsHistory.trim()) {
          try {
            parsedSetsHistory = JSON.parse(parsedSetsHistory);
          } catch (e) {}
        }
        return {
          ...m,
          sportId: m.sportId,
          sportName: (m.sportId || '').replace(/-/g, ' ').toUpperCase(),
          liveTimer: m.time || '14:32',
          youtubeVideoId: m.youtubeVideoId || m.youtube_video_id || null,
          streamUrl: m.streamUrl || m.stream_url || null,
          isLiveStreaming: Boolean(m.isLiveStreaming || m.youtubeVideoId || m.streamUrl),
          setsHistory: Array.isArray(parsedSetsHistory) ? parsedSetsHistory : null,
          currentSet: m.currentSet || (detailsObj && detailsObj.currentSet) || 1,
          setsWon1: m.setsWon1 || (detailsObj && detailsObj.setsWon1) || 0,
          setsWon2: m.setsWon2 || (detailsObj && detailsObj.setsWon2) || 0,
          updatedAt: m.updatedAt || new Date().toISOString()
        };
      });
      return res.json(formatted);
    }
  } catch (err) {
    console.error('Error in GET /api/live-matches route:', err);
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
