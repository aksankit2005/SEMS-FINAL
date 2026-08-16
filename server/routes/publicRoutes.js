import express from 'express';
import { registerPublicEvent } from '../controllers/registrationController.js';
import { getHeroSlidesDB, getCommitteeDB } from '../controllers/adminController.js';
import { getLeaderboardStandings } from '../services/leaderboardService.js';
import { queryDb, prisma, pool } from '../config/db.js';
import { extractYouTubeVideoIdBackend } from '../controllers/coordinatorController.js';

const router = express.Router();

router.get('/public/hero-slides', getHeroSlidesDB);
router.get('/committee', getCommitteeDB);

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
              current_quarter AS "currentQuarter",
              updated_at AS "updatedAt"
       FROM live_matches 
       WHERE LOWER(status) IN ('running', 'live', 'in_progress', 'active') 
       ORDER BY sport_id ASC, table_number ASC, id ASC`
    );

    if (!dbRes || !dbRes.rows) {
      dbRes = await queryDb(
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
         WHERE LOWER(status) IN ('running', 'live', 'in_progress', 'active')`
      );
    }

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      const formatted = await Promise.all(dbRes.rows.map(async (m) => {
        let detailsObj = m.details;
        if (typeof detailsObj === 'string') {
          try { detailsObj = JSON.parse(detailsObj); } catch (e) {}
        }
        if (!detailsObj || typeof detailsObj !== 'object') {
          detailsObj = {};
        }

        const rawStream = m.streamUrl || m.stream_url || detailsObj.streamUrl || detailsObj.liveStreamUrl || null;
        let videoId = m.youtubeVideoId || m.youtube_video_id || detailsObj.youtubeVideoId || detailsObj.youtube_video_id || extractYouTubeVideoIdBackend(rawStream) || null;
        if (!videoId && rawStream) {
          videoId = extractYouTubeVideoIdBackend(rawStream);
        }

        const isStreaming = Boolean(m.isLiveStreaming || videoId || rawStream);

        let parsedSetsHistory = m.setsHistory || detailsObj.setsHistory || null;
        if (typeof parsedSetsHistory === 'string' && parsedSetsHistory.trim()) {
          try {
            parsedSetsHistory = JSON.parse(parsedSetsHistory);
          } catch (e) {}
        }

        let roster1 = detailsObj?.roster1 || null;
        let roster2 = detailsObj?.roster2 || null;
        let currentQuarter = m.currentQuarter || m.current_quarter || detailsObj?.quarter || 'Quarter 1';

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
          ...detailsObj,
          ...m,
          details: detailsObj,
          sportId: m.sportId,
          sportName: (m.sportId || '').replace(/-/g, ' ').toUpperCase(),
          liveTimer: m.time || '14:32',
          quarter: currentQuarter,
          half: detailsObj.half || (detailsObj.completedHalf1 ? 2 : 1),
          youtubeVideoId: videoId,
          streamUrl: rawStream,
          isLiveStreaming: isStreaming,
          setsHistory: Array.isArray(parsedSetsHistory) ? parsedSetsHistory : null,
          currentSet: m.currentSet || detailsObj.currentSet || 1,
          setsWon1: m.setsWon1 !== undefined ? m.setsWon1 : (detailsObj.setsWon1 || 0),
          setsWon2: m.setsWon2 !== undefined ? m.setsWon2 : (detailsObj.setsWon2 || 0),
          roster1,
          roster2,
          // Forward Cricket specific fields
          striker: detailsObj.striker || null,
          nonStriker: detailsObj.nonStriker || null,
          bowler: detailsObj.bowler || null,
          recentBalls: detailsObj.recentBalls || [],
          commentaryLog: detailsObj.commentaryLog || [],
          battingCard1: detailsObj.battingCard1 || [],
          bowlingCard1: detailsObj.bowlingCard1 || [],
          battingCard2: detailsObj.battingCard2 || [],
          bowlingCard2: detailsObj.bowlingCard2 || [],
          currentInnings: detailsObj.currentInnings || 1,
          battingTeam: detailsObj.battingTeam || m.team1,
          bowlingTeam: detailsObj.bowlingTeam || m.team2,
          wickets1: detailsObj.wickets1 !== undefined ? detailsObj.wickets1 : 0,
          overs1: detailsObj.overs1 || '0.0',
          wickets2: detailsObj.wickets2 !== undefined ? detailsObj.wickets2 : 0,
          overs2: detailsObj.overs2 || '0.0',
          targetRuns: detailsObj.targetRuns || null,
          firstInningsScore: detailsObj.firstInningsScore || null,
          extras: detailsObj.extras || null,
          // Forward Kabaddi specific fields
          half1Score1: detailsObj.half1Score1 !== undefined ? detailsObj.half1Score1 : null,
          half1Score2: detailsObj.half1Score2 !== undefined ? detailsObj.half1Score2 : null,
          half2Score1: detailsObj.half2Score1 !== undefined ? detailsObj.half2Score1 : null,
          half2Score2: detailsObj.half2Score2 !== undefined ? detailsObj.half2Score2 : null,
          kabaddiStats1: detailsObj.kabaddiStats1 || null,
          kabaddiStats2: detailsObj.kabaddiStats2 || null,
          // Forward Tug of War specific fields
          roundsWon1: detailsObj.roundsWon1 !== undefined ? detailsObj.roundsWon1 : null,
          roundsWon2: detailsObj.roundsWon2 !== undefined ? detailsObj.roundsWon2 : null,
          currentRound: detailsObj.currentRound || null,
          roundsHistory: detailsObj.roundsHistory || null,
          // Forward Athletics & Chess fields
          activeSubEvent: detailsObj.activeSubEvent || null,
          medals: detailsObj.medals || null,
          scoreSummary: detailsObj.scoreSummary || null,
          scoreText: detailsObj.scoreText || null,
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

// GET /api/results - Spectator completed match results endpoint from Supabase
router.get('/results', async (req, res) => {
  try {
    const dbRes = await queryDb(
      `SELECT id, sport_id AS "sportId", format, status, team1, team2, 
              match_title AS "matchTitle", table_number AS "tableNumber", 
              time, score1, score2, winner,
              details, sets_history AS "setsHistory",
              updated_at AS "updatedAt"
       FROM live_matches 
       WHERE LOWER(status) IN ('completed', 'finished') 
       ORDER BY updated_at DESC`
    );

    if (dbRes && dbRes.rows) {
      const formatted = dbRes.rows.map((m) => {
        const sportId = m.sportId || 'badminton';
        const sportName = (m.sportId || '').replace(/-/g, ' ').toUpperCase();

        let detailsObj = {};
        if (m.details) {
          try {
            detailsObj = typeof m.details === 'object' ? m.details : JSON.parse(m.details);
          } catch (e) {}
        }

        let formattedSetsStr = '';
        const setsArr = (detailsObj && Array.isArray(detailsObj.setsHistory)) ? detailsObj.setsHistory : null;
        if (setsArr && setsArr.length > 0) {
          formattedSetsStr = setsArr
            .map((s, idx) => `Set ${idx + 1}: ${s.score1 || s.team1Score || 0}-${s.score2 || s.team2Score || 0}`)
            .join(', ');
        } else if (m.setsHistory) {
          try {
            const parsed = typeof m.setsHistory === 'string' ? JSON.parse(m.setsHistory) : m.setsHistory;
            if (Array.isArray(parsed)) {
              formattedSetsStr = parsed.map((s, idx) => `Set ${idx + 1}: ${s.score1 || 0}-${s.score2 || 0}`).join(', ');
            }
          } catch (e) {}
        }

        const winnerStr = m.winner || (m.score1 >= m.score2 ? m.team1 : m.team2) || 'Winner';
        const scoreSummary = formattedSetsStr
          ? `Sets (${formattedSetsStr}) | Winner: ${winnerStr}`
          : (m.score1 !== undefined && m.score2 !== undefined
              ? `${m.team1}: ${m.score1} | ${m.team2}: ${m.score2} (Winner: ${winnerStr})`
              : `Winner: ${winnerStr}`);

        return {
          id: m.id,
          sport: sportName,
          sportId: sportId,
          event: m.matchTitle || `${m.team1} vs ${m.team2}`,
          winner: winnerStr,
          scoreSummary,
          setsDetail: formattedSetsStr,
          date: m.updatedAt ? new Date(m.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          completedAt: m.updatedAt,
          score1: m.score1,
          score2: m.score2,
          team1: m.team1,
          team2: m.team2,
          mvp: winnerStr,
          rawMatch: m
        };
      });
      return res.json(formatted);
    }
  } catch (err) {
    console.error('Error fetching public results from DB:', err);
  }
  return res.json([]);
});

// GET /api/schedules - Spectator match schedules endpoint from Supabase
router.get('/schedules', async (req, res) => {
  try {
    const dbRes = await queryDb(
      `SELECT id, sport_id AS "sportId", format, status, team1, team2, 
              match_title AS "matchTitle", table_number AS "tableNumber", 
              time, score1, score2, details, updated_at AS "updatedAt", created_at AS "createdAt"
       FROM live_matches 
       WHERE LOWER(status) IN ('scheduled', 'upcoming', 'draft')
       ORDER BY created_at DESC`
    );

    if (dbRes && dbRes.rows) {
      const formatted = dbRes.rows.map((m) => {
        const sportId = (m.sportId || 'badminton').toLowerCase();
        const rawSportName = (sportId.charAt(0).toUpperCase() + sportId.slice(1).replace('-', ' '));

        let detailsObj = {};
        if (m.details) {
          try {
            detailsObj = typeof m.details === 'object' ? m.details : JSON.parse(m.details);
          } catch (e) {}
        }

        const t1 = m.team1 || detailsObj.team1Name || 'TBD';
        const t2 = m.team2 || detailsObj.team2Name || 'TBD';
        const matchTitle = m.matchTitle || detailsObj.eventTitle || `${t1} vs ${t2}`;
        const matchDate = detailsObj.date || (m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        const matchCategory = detailsObj.category || 'Open';
        const matchVenue = m.tableNumber || detailsObj.venue || 'Arena 1';

        return {
          id: m.id,
          event: matchTitle,
          matchTitle: matchTitle,
          sport: rawSportName,
          sportId: sportId,
          gender: matchCategory,
          category: matchCategory,
          team1: t1,
          team2: t2,
          venue: matchVenue,
          tableNumber: matchVenue,
          date: matchDate,
          time: m.time || '10:00 AM',
          format: m.format || 'STANDARD',
          status: m.status || 'SCHEDULED',
          details: detailsObj
        };
      });
      return res.json(formatted);
    }
  } catch (err) {
    console.error('Error fetching public schedules from DB:', err);
  }
  return res.json([]);
});

// GET /api/public/events - Public event catalog
router.get('/public/events', async (req, res) => {
  const publishedEvents = [];
  const currentDate = new Date();

  // 1. Raw SQL QueryDb from PostgreSQL
  try {
    const dbRes = await queryDb(
      `SELECT 
        id, sport_id AS "sportId", sport_name AS "sportName", title, 
        cover_image AS "coverImage", description, reg_start_date AS "regStartDate", 
        reg_end_date AS "regEndDate", tourn_start_date AS "tournStartDate", 
        tourn_end_date AS "tournEndDate", entry_fee AS "entryFee", 
        singles_fee AS "singlesFee", doubles_fee AS "doublesFee", 
        team_size AS "teamSize", max_registrations AS "maxRegistrations", 
        registered_count AS "registeredCount", venue, category, status, 
        rules, required_documents AS "requiredDocuments", contact_info AS "contactInfo"
       FROM coordinator_event_items
       ORDER BY created_at DESC`
    );

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      dbRes.rows.forEach((e) => {
        const rawStatus = (e.status || 'Published').toLowerCase();
        // DRAFT events are ONLY shown to the coordinator, NOT to public users
        if (rawStatus === 'draft') {
          return;
        }

        let currentStatus = e.status || 'Published';
        if (rawStatus === 'upcoming') {
          currentStatus = 'Upcoming';
        } else if (rawStatus === 'closed' || (e.regEndDate && new Date(e.regEndDate + 'T23:59:59') < currentDate) || ((Number(e.registeredCount) || 0) >= (Number(e.maxRegistrations) || 64))) {
          currentStatus = 'Closed';
        } else if (rawStatus === 'public' || rawStatus === 'published') {
          currentStatus = 'Published';
        }

        let contact = e.contactInfo;
        if (typeof contact === 'string') {
          try { contact = JSON.parse(contact); } catch (err) {}
        }
        let rulesObj = e.rules;
        if (typeof rulesObj === 'string') {
          try { rulesObj = JSON.parse(rulesObj); } catch (err) {}
        }

        publishedEvents.push({
          ...e,
          entryFee: Number(e.entryFee || 0),
          teamFee: Number(e.entryFee || 0),
          singlesFee: Number(e.singlesFee || 0),
          doublesFee: Number(e.doublesFee || 0),
          maxRegistrations: Number(e.maxRegistrations || 64),
          registeredCount: Number(e.registeredCount || 0),
          status: currentStatus,
          rules: rulesObj || [],
          contactInfo: contact,
          availableSlots: Math.max(0, (Number(e.maxRegistrations) || 64) - (Number(e.registeredCount) || 0))
        });
      });
      return res.json(publishedEvents);
    }
  } catch (err) {
    console.error('Error fetching public events via queryDb:', err.message);
  }

  // 2. Prisma fallback
  try {
    const dbEvents = await prisma.coordinatorEventItem.findMany({
      where: {
        NOT: { status: { equals: 'Draft', mode: 'insensitive' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (dbEvents && dbEvents.length > 0) {
      dbEvents.forEach((e) => {
        const rawStatus = (e.status || 'Published').toLowerCase();
        if (rawStatus === 'draft') return;

        let currentStatus = e.status || 'Published';
        if (rawStatus === 'upcoming') {
          currentStatus = 'Upcoming';
        } else if (rawStatus === 'closed' || (e.regEndDate && new Date(e.regEndDate + 'T23:59:59') < currentDate) || ((e.registeredCount || 0) >= (e.maxRegistrations || 64))) {
          currentStatus = 'Closed';
        } else if (rawStatus === 'public' || rawStatus === 'published') {
          currentStatus = 'Published';
        }

        publishedEvents.push({
          ...e,
          entryFee: Number(e.entryFee || 0),
          teamFee: Number(e.entryFee || 0),
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

// GET /api/leaderboard - Spectator college standings endpoint from Supabase college_leaderboards table
router.get('/leaderboard', async (req, res) => {
  try {
    const standings = await getLeaderboardStandings();
    return res.json(standings || []);
  } catch (err) {
    console.error('Error fetching leaderboard standings from DB:', err);
    return res.json([]);
  }
});

// GET /api/announcements - Spectator public announcements endpoint from Supabase
router.get('/announcements', async (req, res) => {
  try {
    const list = await prisma.announcement.findMany({
      where: { isPublished: true },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(list || []);
  } catch (err) {
    console.error('Error fetching public announcements from DB:', err);
    return res.json([]);
  }
});

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
