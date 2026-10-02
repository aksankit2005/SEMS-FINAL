import express from 'express';
import {
  registerPublicEvent,
  createPublicRegistrationOrder,
  handleRazorpayWebhook,
  getRegistrationPassPDF,
} from '../controllers/registrationController.js';
import { getCommitteeDB, getPublicMedalists } from '../controllers/adminController.js';
import { getLeaderboardStandings } from '../services/leaderboardService.js';
import { queryDb, pool, prisma } from '../config/db.js';
import { extractYouTubeVideoIdBackend, inMemoryCoordinatorEvents } from '../controllers/coordinatorController.js';
import { publicReadLimiter, apiLimiter } from '../middleware/rateLimiters.js';
import { computeEffectiveRegistrationStatus } from '../utils/registrationLifecycle.js';

const router = express.Router();

router.get('/committee', publicReadLimiter, getCommitteeDB);

// GET /api/live-matches - Spectator endpoint
router.get('/live-matches', publicReadLimiter, async (req, res) => {
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
router.get('/live-matches/:matchId/players', publicReadLimiter, async (req, res) => {
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
router.get('/results', publicReadLimiter, async (req, res) => {
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
        const rawSport = m.sportId || 'badminton';
        const sportId = String(rawSport).toLowerCase().replace(/_/g, '-');
        const sportName = (m.sportId || '').replace(/-/g, ' ').toUpperCase();

        let detailsObj = {};
        if (m.details) {
          try {
            detailsObj = typeof m.details === 'object' ? m.details : JSON.parse(m.details);
          } catch (e) {}
        }

        const team1 = m.team1 || detailsObj.team1 || detailsObj.team1Name || 'Team 1';
        const team2 = m.team2 || detailsObj.team2 || detailsObj.team2Name || 'Team 2';
        const winnerStr = m.winner || detailsObj.winner || (m.score1 >= m.score2 ? team1 : team2) || 'Completed';
        const isChess = sportId.includes('chess');
        const isCricket = sportId.includes('cricket');
        const isGully = sportId.includes('gully');
        const isRacket = sportId.includes('badminton') || sportId.includes('table');
        const isVolley = sportId.includes('volleyball');
        const isBasket = sportId.includes('basketball');
        const isFoot = sportId.includes('football');
        const isKabd = sportId.includes('kabaddi');
        const isKho = sportId.includes('kho');
        const isTug = sportId.includes('tug');
        const isAthletics = sportId.includes('athletics');

        let scoreSummary = '';
        let formattedSetsStr = '';

        if (isCricket) {
          const r1 = m.score1 ?? detailsObj.runs1 ?? detailsObj.score1 ?? 0;
          const w1 = detailsObj.wickets1 !== undefined ? detailsObj.wickets1 : 0;
          const o1 = detailsObj.overs1 || (isGully ? '6.0' : '20.0');
          const r2 = m.score2 ?? detailsObj.runs2 ?? detailsObj.score2 ?? 0;
          const w2 = detailsObj.wickets2 !== undefined ? detailsObj.wickets2 : 0;
          const o2 = detailsObj.overs2 || (isGully ? '6.0' : '20.0');
          const resStr = detailsObj.resultString || (winnerStr ? `${winnerStr} won` : 'Match Completed');
          scoreSummary = `${team1}: ${r1}/${w1} (${o1} ov) vs ${team2}: ${r2}/${w2} (${o2} ov) • ${resStr}`;
        } else if (isRacket || isVolley) {
          const setsArr = (detailsObj && Array.isArray(detailsObj.setsHistory)) ? detailsObj.setsHistory : null;
          let parsedSets = [];
          if (setsArr && setsArr.length > 0) {
            parsedSets = setsArr;
          } else if (m.setsHistory) {
            try {
              const p = typeof m.setsHistory === 'string' ? JSON.parse(m.setsHistory) : m.setsHistory;
              if (Array.isArray(p)) parsedSets = p;
            } catch (e) {}
          }
          const playedSets = parsedSets.filter(s => Number(s.score1 || s.team1Score || 0) > 0 || Number(s.score2 || s.team2Score || 0) > 0);
          if (playedSets.length > 0) {
            formattedSetsStr = playedSets
              .map((s, idx) => `Set ${idx + 1}: ${s.score1 || s.team1Score || 0}-${s.score2 || s.team2Score || 0}`)
              .join(', ');
            scoreSummary = `Sets (${formattedSetsStr}) | Winner: ${winnerStr}`;
          } else {
            const sw1 = detailsObj.setsWon1 ?? (m.score1 > m.score2 ? (isVolley ? 3 : 2) : 0);
            const sw2 = detailsObj.setsWon2 ?? (m.score2 > m.score1 ? (isVolley ? 3 : 2) : 0);
            scoreSummary = `${sw1} - ${sw2} Sets | Winner: ${winnerStr}`;
          }
        } else if (isBasket) {
          const s1 = m.score1 ?? detailsObj.score1 ?? 0;
          const s2 = m.score2 ?? detailsObj.score2 ?? 0;
          const q = detailsObj.quarter || 'FT';
          scoreSummary = `${team1} ${s1} - ${s2} ${team2} PTS (${q}) | Winner: ${winnerStr}`;
        } else if (isFoot) {
          const s1 = m.score1 ?? detailsObj.score1 ?? 0;
          const s2 = m.score2 ?? detailsObj.score2 ?? 0;
          const h = detailsObj.quarter || detailsObj.half || 'FT';
          scoreSummary = `${team1} ${s1} - ${s2} ${team2} Goals (${h}) | Result: ${winnerStr}`;
        } else if (isKabd) {
          const s1 = m.score1 ?? detailsObj.score1 ?? 0;
          const s2 = m.score2 ?? detailsObj.score2 ?? 0;
          scoreSummary = `${team1} ${s1} - ${s2} ${team2} PTS | Winner: ${winnerStr}`;
        } else if (isKho) {
          const s1 = m.score1 ?? detailsObj.score1 ?? 0;
          const s2 = m.score2 ?? detailsObj.score2 ?? 0;
          scoreSummary = `${team1} ${s1} - ${s2} ${team2} Points | Winner: ${winnerStr}`;
        } else if (isTug) {
          const s1 = m.score1 ?? detailsObj.roundsWon1 ?? 0;
          const s2 = m.score2 ?? detailsObj.roundsWon2 ?? 0;
          scoreSummary = `${team1} vs ${team2}: ${s1} - ${s2} Pulls | Winner: ${winnerStr}`;
        } else if (isChess) {
          const s1 = m.score1 ?? 0;
          const s2 = m.score2 ?? 0;
          const verdict = detailsObj.resultNote || (s1 === 1 ? 'White Wins (1-0)' : s2 === 1 ? 'Black Wins (0-1)' : 'Draw (½ - ½)');
          scoreSummary = `Result: ${verdict}`;
        } else if (isAthletics) {
          const medals = detailsObj.medals || {};
          scoreSummary = `🥇 Gold: ${medals.gold || winnerStr || 'TBD'} | 🥈 Silver: ${medals.silver || 'TBD'} | 🥉 Bronze: ${medals.bronze || 'TBD'}`;
        } else {
          scoreSummary = `${team1}: ${m.score1 || 0} | ${team2}: ${m.score2 || 0} (Winner: ${winnerStr})`;
        }

        const realMvp = detailsObj.mvp || detailsObj.playerOfMatch || detailsObj.playerOfTheMatch || null;

        return {
          id: m.id,
          sport: sportName,
          sportId: sportId,
          event: m.matchTitle || `${team1} vs ${team2}`,
          winner: winnerStr,
          scoreSummary,
          setsDetail: formattedSetsStr,
          date: detailsObj.date || (m.updatedAt ? new Date(m.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          completedAt: m.updatedAt,
          score1: m.score1,
          score2: m.score2,
          team1,
          team2,
          mvp: realMvp && realMvp !== winnerStr ? realMvp : null,
          details: detailsObj,
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
router.get('/schedules', publicReadLimiter, async (req, res) => {
  try {
    const dbRes = await queryDb(
      `SELECT id, sport_id AS "sportId", format, status, team1, team2, 
              match_title AS "matchTitle", table_number AS "tableNumber", 
              time, score1, score2, details, updated_at AS "updatedAt"
       FROM live_matches 
       WHERE LOWER(status) IN ('scheduled', 'upcoming', 'draft')
       ORDER BY updated_at DESC`
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

        const t1 = m.team1 || detailsObj.team1 || detailsObj.team1Name || detailsObj.player1 || detailsObj.player1Name || 'Team 1';
        const t2 = m.team2 || detailsObj.team2 || detailsObj.team2Name || detailsObj.player2 || detailsObj.player2Name || 'Team 2';
        const matchTitle = m.matchTitle || detailsObj.eventTitle || `${t1} vs ${t2}`;
        const matchDate = detailsObj.date || (m.updatedAt ? new Date(m.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
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
router.get('/public/events', publicReadLimiter, async (req, res) => {
  const publishedEvents = [];
  const currentDate = new Date();

  // 1. Raw SQL QueryDb from PostgreSQL
  try {
    let allowRegistrationsGlobal = true;
    try {
      const globalSetting = await prisma.systemSetting.findUnique({ where: { key: 'admin_portal_settings' } });
      if (globalSetting && globalSetting.value) {
        const val = globalSetting.value;
        if (val.allowRegistrations === false || val.allowRegistrations === 'false' || val.allowRegistrations === 0) {
          allowRegistrationsGlobal = false;
        }
      }
    } catch (err) {}

    const dbRes = await queryDb(
      `SELECT 
        id, sport_id AS "sportId", sport_name AS "sportName", title, 
        cover_image AS "coverImage", description, reg_start_date AS "regStartDate", 
        reg_end_date AS "regEndDate", tourn_start_date AS "tournStartDate", 
        tourn_end_date AS "tournEndDate", entry_fee AS "entryFee", 
        singles_fee AS "singlesFee", doubles_fee AS "doublesFee", 
        team_size AS "teamSize", max_registrations AS "maxRegistrations", 
        registered_count AS "registeredCount", venue, category, status, 
        registration_open AS "registrationOpen",
        rules, required_documents AS "requiredDocuments", contact_info AS "contactInfo",
        sub_events AS "subEvents", sub_event_fees AS "subEventFees", sub_events_config AS "subEventsConfig"
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

        const isRegOpen = allowRegistrationsGlobal && e.registrationOpen !== false && e.registrationOpen !== 'false' && e.registrationOpen !== 0;
        const regStatus = computeEffectiveRegistrationStatus({
          ...e,
          allowRegistrations: allowRegistrationsGlobal,
          registrationOpen: isRegOpen
        });

        let currentStatus = e.status || 'Published';
        if (rawStatus === 'upcoming' || rawStatus === 'coming soon') {
          currentStatus = 'Upcoming';
        } else if (!regStatus.effectiveRegistrationOpen) {
          currentStatus = 'Closed';
        } else if (rawStatus === 'public' || rawStatus === 'published' || rawStatus === 'active') {
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
        let subEventsList = e.subEvents;
        if (typeof subEventsList === 'string') {
          try { subEventsList = JSON.parse(subEventsList); } catch (err) {}
        }
        let subEventFeesObj = e.subEventFees;
        if (typeof subEventFeesObj === 'string') {
          try { subEventFeesObj = JSON.parse(subEventFeesObj); } catch (err) {}
        }
        let subEventsConfigList = e.subEventsConfig;
        if (typeof subEventsConfigList === 'string') {
          try { subEventsConfigList = JSON.parse(subEventsConfigList); } catch (err) {}
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
          registrationOpen: isRegOpen,
          effectiveStatus: regStatus.code,
          effectiveStatusLabel: regStatus.label,
          effectiveRegistrationOpen: regStatus.effectiveRegistrationOpen,
          effectiveRegistrationClosed: regStatus.effectiveRegistrationClosed,
          isDeadlinePassed: regStatus.isDeadlinePassed,
          canReopen: regStatus.canReopen,
          closureReason: regStatus.reason,
          rules: rulesObj || [],
          subEvents: subEventsList || [],
          subEventFees: subEventFeesObj || {},
          subEventsConfig: subEventsConfigList || [],
          contactInfo: contact,
          availableSlots: Math.max(0, (Number(e.maxRegistrations) || 64) - (Number(e.registeredCount) || 0))
        });
      });
    }
  } catch (err) {
    console.error('Error fetching public events via queryDb:', err.message);
  }

  // 2. Merge in-memory coordinator events
  if (inMemoryCoordinatorEvents) {
    const existingIds = new Set(publishedEvents.map((e) => e.id));
    Object.values(inMemoryCoordinatorEvents).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((e) => {
          if (!e || !e.id || existingIds.has(e.id)) return;
          const rawStatus = (e.status || 'Published').toLowerCase();
          if (rawStatus === 'draft') return;

          const isRegOpen = allowRegistrationsGlobal && e.registrationOpen !== false && e.registrationOpen !== 'false' && e.registrationOpen !== 0;
          const regStatus = computeEffectiveRegistrationStatus({
            ...e,
            allowRegistrations: allowRegistrationsGlobal,
            registrationOpen: isRegOpen
          });

          let currentStatus = e.status || 'Published';
          if (rawStatus === 'upcoming' || rawStatus === 'coming soon') {
            currentStatus = 'Upcoming';
          } else if (!regStatus.effectiveRegistrationOpen) {
            currentStatus = 'Closed';
          } else if (rawStatus === 'public' || rawStatus === 'published' || rawStatus === 'active') {
            currentStatus = 'Published';
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
            registrationOpen: isRegOpen,
            effectiveStatus: regStatus.code,
            effectiveStatusLabel: regStatus.label,
            effectiveRegistrationOpen: regStatus.effectiveRegistrationOpen,
            effectiveRegistrationClosed: regStatus.effectiveRegistrationClosed,
            isDeadlinePassed: regStatus.isDeadlinePassed,
            canReopen: regStatus.canReopen,
            closureReason: regStatus.reason,
            rules: e.rules || [],
            subEvents: e.subEvents || [],
            subEventFees: e.subEventFees || {},
            subEventsConfig: e.subEventsConfig || [],
            contactInfo: e.contactInfo || null,
            availableSlots: Math.max(0, (Number(e.maxRegistrations) || 64) - (Number(e.registeredCount) || 0))
          });
          existingIds.add(e.id);
        });
      }
    });
  }

  return res.json(publishedEvents);
});

// POST /api/public/create-order - Create authoritative Razorpay order with auto-capture
router.post('/public/create-order', apiLimiter, createPublicRegistrationOrder);
router.post('/public/create-razorpay-order', apiLimiter, createPublicRegistrationOrder);

// POST /api/public/register-event - Event registration endpoint
router.post('/public/register-event', apiLimiter, registerPublicEvent);
router.post('/public/register', apiLimiter, registerPublicEvent);

// POST /api/public/razorpay-webhook - Razorpay lifecycle webhooks
router.post('/public/razorpay-webhook', handleRazorpayWebhook);
router.post('/razorpay/webhook', handleRazorpayWebhook);
router.post('/razorpay-webhook', handleRazorpayWebhook);

// GET /api/public/registration-pass/:id - Direct vector PDF pass stream / download
router.get('/public/registration-pass/:id', publicReadLimiter, getRegistrationPassPDF);
router.get('/public/pass/:id', publicReadLimiter, getRegistrationPassPDF);
router.get('/pass/:id', publicReadLimiter, getRegistrationPassPDF);
router.get('/registration-pass/:id', publicReadLimiter, getRegistrationPassPDF);

// GET /api/leaderboard - Spectator college standings endpoint from Supabase college_leaderboards table
router.get('/leaderboard', publicReadLimiter, async (req, res) => {
  try {
    const standings = await getLeaderboardStandings();
    return res.json(standings || []);
  } catch (err) {
    console.error('Error fetching leaderboard standings from DB:', err);
    return res.json([]);
  }
});

// GET /api/leaderboard/medalists - Spectator public declared student medalists endpoint
router.get('/leaderboard/medalists', publicReadLimiter, getPublicMedalists);

// GET /api/announcements - Spectator public announcements endpoint from Supabase / Postgres
router.get('/announcements', publicReadLimiter, async (req, res) => {
  try {
    if (prisma?.announcement) {
      const list = await prisma.announcement.findMany({
        where: { isPublished: true },
        include: { attachments: true },
        orderBy: { createdAt: 'desc' }
      });
      if (list && Array.isArray(list)) {
        return res.json(list.map(a => ({
          ...a,
          category: a.category || 'Schedule',
          date: a.publishDate ? new Date(a.publishDate).toISOString().split('T')[0] : (a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          attachments: (a.attachments || []).map(att => ({
            ...att,
            size: att.size || (att.sizeBytes ? `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB')
          }))
        })));
      }
    }
  } catch (err) {
    console.warn('Prisma fetching announcements notice, trying pool query:', err.message);
  }

  try {
    const rawRes = await pool.query(`
      SELECT 
        a.id, 
        a.title, 
        a.description, 
        COALESCE(a.category, 'Schedule') AS category, 
        a.audience,
        TO_CHAR(a."publishDate", 'YYYY-MM-DD') AS "publishDate", 
        TO_CHAR(a."expiryDate", 'YYYY-MM-DD') AS "expiryDate", 
        a."isPublished", 
        TO_CHAR(a."createdAt", 'YYYY-MM-DD') AS "createdAt"
      FROM announcements a
      WHERE a."isPublished" = true
      ORDER BY a."createdAt" DESC
    `);

    if (rawRes && rawRes.rows) {
      const announcements = [];
      for (const ann of rawRes.rows) {
        const attRes = await queryDb(
          `SELECT id, name, url, "mimeType" AS "mimeType", "sizeBytes" AS "sizeBytes" 
           FROM announcement_attachments WHERE "announcementId"::text = $1`,
          [String(ann.id)]
        );
        announcements.push({
          ...ann,
          date: ann.publishDate || ann.createdAt || new Date().toISOString().split('T')[0],
          status: 'Published',
          attachments: (attRes && attRes.rows) ? attRes.rows.map(att => ({
            ...att,
            size: att.size || (att.sizeBytes ? `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB')
          })) : []
        });
      }
      return res.json(announcements);
    }
    return res.json([]);
  } catch (err2) {
    console.error('Error fetching public announcements from DB fallback:', err2.message);
    return res.json([]);
  }
});

// Health check
router.get('/health', publicReadLimiter, async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'SEMS API Server', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'SEMS API Server', db: 'disconnected' });
  }
});

export default router;
