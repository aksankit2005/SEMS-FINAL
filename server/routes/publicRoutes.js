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
      const formatted = await Promise.all(dbRes.rows.map(async (m) => {
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

        let roster1 = detailsObj?.roster1 || null;
        let roster2 = detailsObj?.roster2 || null;
        let currentQuarter = m.current_quarter || detailsObj?.quarter || 'Quarter 1';

        // Query database table basketball_player_stats for exact DB records
        try {
          const statsRes = await queryDb(
            `SELECT id, match_id AS "matchId", team_name AS "teamName", 
                    jersey_no AS "jerseyNo", player_name AS "playerName", 
                    is_on_pitch AS "isOnPitch", points, fouls 
             FROM basketball_player_stats 
             WHERE match_id = $1 
             ORDER BY jersey_no ASC`,
            [m.id]
          );

          if (statsRes && statsRes.rows && statsRes.rows.length > 0) {
            const allPlayers = statsRes.rows.map((p) => ({
              id: p.id,
              name: p.playerName,
              playerName: p.playerName,
              jersey: p.jerseyNo,
              jerseyNo: p.jerseyNo,
              onCourt: Boolean(p.isOnPitch),
              isOnPitch: Boolean(p.isOnPitch),
              points: Number(p.points || 0),
              fouls: Number(p.fouls || 0),
              teamName: p.teamName
            }));

            const t1Name = (m.team1 || '').trim().toLowerCase();
            const t2Name = (m.team2 || '').trim().toLowerCase();

            const r1 = allPlayers.filter((p) => (p.teamName || '').trim().toLowerCase() === t1Name);
            const r2 = allPlayers.filter((p) => (p.teamName || '').trim().toLowerCase() === t2Name);

            if (r1.length > 0) roster1 = r1;
            if (r2.length > 0) roster2 = r2;
          }
        } catch (err) {
          console.error('Error fetching player stats for live match:', m.id, err.message);
        }

        return {
          ...m,
          sportId: m.sportId,
          sportName: (m.sportId || '').replace(/-/g, ' ').toUpperCase(),
          liveTimer: m.time || '14:32',
          quarter: currentQuarter,
          youtubeVideoId: m.youtubeVideoId || m.youtube_video_id || null,
          streamUrl: m.streamUrl || m.stream_url || null,
          isLiveStreaming: Boolean(m.isLiveStreaming || m.youtubeVideoId || m.streamUrl),
          setsHistory: Array.isArray(parsedSetsHistory) ? parsedSetsHistory : null,
          currentSet: m.currentSet || (detailsObj && detailsObj.currentSet) || 1,
          setsWon1: m.setsWon1 || (detailsObj && detailsObj.setsWon1) || 0,
          setsWon2: m.setsWon2 || (detailsObj && detailsObj.setsWon2) || 0,
          roster1,
          roster2,
          updatedAt: m.updatedAt || new Date().toISOString()
        };
      }));
      return res.json(formatted);
    }
  } catch (err) {
    console.error('Error in GET /api/live-matches route:', err);
  }

  return res.json([]);
});

// GET /api/live-matches/:matchId/players - Public Spectator Player Stats endpoint
router.get('/live-matches/:matchId/players', async (req, res) => {
  const { matchId } = req.params;
  try {
    const statsRes = await queryDb(
      `SELECT id, match_id AS "matchId", team_name AS "teamName", 
              jersey_no AS "jerseyNo", player_name AS "playerName", 
              is_on_pitch AS "isOnPitch", points, fouls, 
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM basketball_player_stats 
       WHERE match_id = $1 
       ORDER BY team_name, jersey_no ASC`,
      [matchId]
    );

    return res.json(statsRes ? statsRes.rows : []);
  } catch (err) {
    console.error('Error fetching public basketball player stats:', err.message);
    return res.status(500).json({ message: 'Failed to fetch player statistics' });
  }
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
