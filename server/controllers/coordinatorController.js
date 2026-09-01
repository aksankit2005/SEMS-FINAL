import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig, coordinatorPasswords } from '../config/env.js';
import { queryDb, prisma } from '../config/db.js';
import { computeEffectiveRegistrationStatus, parseRegistrationDeadline } from '../utils/registrationLifecycle.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const extractYouTubeVideoIdBackend = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If it does not contain http / slashes / dots, check for raw 11-char video ID
  if (!trimmed.includes('/') && !trimmed.includes('.') && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Check standard YouTube patterns
  const ytMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return ytMatch[1];
  }

  // URL object parsing with strict domain check
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();
    const isYouTubeHost = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be' || host === 'youtube-nocookie.com';
    if (!isYouTubeHost) return null;

    const vParam = parsed.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && /^[a-zA-Z0-9_-]{11}$/.test(lastSegment)) {
      return lastSegment;
    }
  } catch (e) {}

  return null;
};

const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

let inMemoryCoordinatorMatches = {};
export let inMemoryCoordinatorEvents = {};
let inMemoryRegistrationSettings = {};

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

export const coordinatorLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const userKey = username.toLowerCase().replace(/-/g, '_');

  const dbResult = await queryDb('SELECT * FROM sport_coordinators WHERE LOWER(username) = $1', [userKey]);
  if (dbResult && dbResult.rows.length > 0) {
    const user = dbResult.rows[0];
    if (user.status && user.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
    }
    let isValid = false;
    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    }
    if (!isValid) {
      const expectedPassword = coordinatorPasswords[userKey] || `${userKey.replace('coord_', '')}#2026`;
      isValid = Boolean(expectedPassword && password === expectedPassword);
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
        envConfig.jwtSecret,
        { expiresIn: '24h' }
      );
      logAuditEvent({
        userId: user.id,
        actorName: user.username,
        role: 'SPORTS_COORDINATOR',
        action: 'Coordinator Login',
        entity: `Sport Coordinator: ${user.username} (${user.assigned_sport || user.sport_name})`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
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

  const coord = inMemorySportCoordinators.find(
    (c) => c.username.toLowerCase() === userKey || c.assignedSport.toLowerCase() === userKey
  );

  if (coord) {
    if (coord.status && coord.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
    }
    const expectedPassword = coordinatorPasswords[userKey];
    const isValidPassword = expectedPassword && password === expectedPassword;

    if (isValidPassword) {
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
        envConfig.jwtSecret,
        { expiresIn: '24h' }
      );
      logAuditEvent({
        userId: coord.id,
        actorName: coord.username,
        role: 'SPORTS_COORDINATOR',
        action: 'Coordinator Login',
        entity: `Sport Coordinator: ${coord.username} (${coord.assignedSport || coord.sportName})`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
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
  }

  return res.status(401).json({ message: 'Invalid Sport Coordinator credentials. Access denied.' });
};

export const getProfile = (req, res) => {
  return res.json(req.user);
};

export const getMatches = async (req, res) => {
  const sportId = (req.user?.assignedSport || '').toLowerCase().replace(/_/g, '-');

  try {
    const isGully = sportId.includes('gully');
    const isStandardCricket = sportId === 'cricket' || (sportId.includes('cricket') && !isGully);

    let dbMatches;
    if (isStandardCricket) {
      dbMatches = await prisma.liveMatch.findMany({
        where: {
          sportId: { equals: 'cricket', mode: 'insensitive' }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else if (isGully) {
      dbMatches = await prisma.liveMatch.findMany({
        where: {
          sportId: { in: ['gully-cricket', 'gully_cricket', 'gully cricket'], mode: 'insensitive' }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      dbMatches = await prisma.liveMatch.findMany({
        where: {
          sportId: {
            equals: sportId,
            mode: 'insensitive',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return res.json(dbMatches || []);
  } catch (err) {
    console.error(
      'Error fetching coordinator matches from DB:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
    });
  }
};

const syncMatchToMatchesTable = async (m) => {
  if (!m || !m.id) return;
  const statusLower = String(m.status || '').toLowerCase();
  const isScheduled = statusLower === 'scheduled' || statusLower === 'upcoming' || statusLower === 'draft';

  if (!isScheduled) {
    // Keep ONLY scheduled matches in matches table; purge live/completed/cancelled
    try {
      await queryDb('DELETE FROM matches WHERE id = $1', [String(m.id)]);
    } catch (e) {}
    return;
  }

  const matchId = String(m.id);
  const mSportId = (m.sportId || m.sport || 'badminton').toLowerCase();
  const t1 = typeof m.team1 === 'object' ? (m.team1?.name || '') : String(m.team1 || '').trim();
  const t2 = typeof m.team2 === 'object' ? (m.team2?.name || '') : String(m.team2 || '').trim();
  const team1Val = t1 || m.team1Name || m.subEvent || m.eventTitle || 'TBD';
  const team2Val = t2 || m.team2Name || (m.subEvent ? '' : 'TBD');
  const matchTitleVal = m.eventTitle || m.matchTitle || m.title || `${team1Val} vs ${team2Val}`;
  const tableNumberVal = m.tableNumber || m.venue || 'Table 1';
  const timeVal = m.time || m.scheduledTime || '05:30 PM';
  const statusVal = (m.status || 'SCHEDULED').toUpperCase();
  const formatVal = (m.format || 'SINGLES').toUpperCase();
  const eventIdVal = m.eventId || m.event_id || null;
  const eventTitleVal = m.eventTitle || m.event_title || matchTitleVal;
  const team1IdVal = m.team1Id || m.team1_id || null;
  const team2IdVal = m.team2Id || m.team2_id || null;

  const detailsObj = {
    category: m.category || m.gender || 'Open',
    date: m.date || new Date().toISOString().split('T')[0],
    eventTitle: matchTitleVal,
    eventId: eventIdVal,
    team1Id: team1IdVal,
    team2Id: team2IdVal,
    format: formatVal,
    team1Name: team1Val,
    team2Name: team2Val,
    ...(m.details && typeof m.details === 'object' ? m.details : {})
  };

  try {
    await queryDb(
  `INSERT INTO matches (
     id,
     sport_id,
     format,
     status,
     team1,
     team2,
     match_title,
     table_number,
     time,
     score1,
     score2,
     winner,
     details,
     event_id,
     "createdAt",
     "updatedAt"
   )
   VALUES (
     $1, $2, $3, $4, $5, $6, $7, $8, $9,
     $10, $11, $12, $13, $14,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
   )
   ON CONFLICT (id) DO UPDATE SET
     sport_id = EXCLUDED.sport_id,
     format = EXCLUDED.format,
     status = EXCLUDED.status,
     team1 = EXCLUDED.team1,
     team2 = EXCLUDED.team2,
     match_title = EXCLUDED.match_title,
     table_number = EXCLUDED.table_number,
     time = EXCLUDED.time,
     score1 = EXCLUDED.score1,
     score2 = EXCLUDED.score2,
     winner = EXCLUDED.winner,
     details = EXCLUDED.details,
     event_id = COALESCE(EXCLUDED.event_id, matches.event_id),
     "updatedAt" = CURRENT_TIMESTAMP`,
  [
    matchId,
    mSportId,
    formatVal,
    statusVal,
    team1Val,
    team2Val,
    matchTitleVal,
    tableNumberVal,
    timeVal,
    Number(m.score1 || 0),
    Number(m.score2 || 0),
    m.winner || null,
    JSON.stringify(detailsObj),
    eventIdVal
  ]
);
  } catch (err) {
    console.warn('Sync to matches table warning:', err.message);
  }
};

export const createMatch = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const matchId = req.body.id || `M${Math.floor(100000 + Math.random() * 900000)}`;
  const eventId = req.body.eventId || req.body.event_id || null;
  let eventTitle = req.body.eventTitle || req.body.event_title || null;
  const team1Id = req.body.team1Id || req.body.team1_id || null;
  const team2Id = req.body.team2Id || req.body.team2_id || null;

  // 1. Authoritative Event & Effective Registration-Closed Gate Check
  if (eventId && eventId !== 'DEFAULT') {
    try {
      const evRes = await queryDb(
        `SELECT id, sport_id AS "sportId", title, status, registration_open AS "registrationOpen", reg_start_date AS "regStartDate", reg_end_date AS "regEndDate"
         FROM coordinator_event_items WHERE id = $1`,
        [eventId]
      );
      if (evRes && evRes.rows && evRes.rows.length > 0) {
        const ev = evRes.rows[0];
        eventTitle = ev.title || eventTitle;
        const regStatus = computeEffectiveRegistrationStatus(ev);

        if (!regStatus.canScheduleFixtures) {
          if (regStatus.effectiveRegistrationOpen) {
            return res.status(400).json({ 
              success: false, 
              message: 'Cannot schedule matches while registration is still open. Registration for this event must be closed before fixtures can be scheduled.',
              code: 'REGISTRATION_STILL_OPEN'
            });
          }
          return res.status(400).json({ 
            success: false, 
            message: regStatus.reason || 'Cannot schedule matches for this event in its current state.',
            code: regStatus.code
          });
        }
      }
    } catch (e) {
      console.warn('Event validation error in createMatch:', e.message);
    }
  }

  const rawStreamUrl = req.body.streamUrl || req.body.stream_url || req.body.liveStreamUrl || '';
  const videoId = req.body.youtubeVideoId || req.body.youtube_video_id || extractYouTubeVideoIdBackend(rawStreamUrl) || null;
  const isStreaming = Boolean(req.body.isLiveStreaming || videoId || rawStreamUrl);

  const newMatch = {
    id: matchId,
    sportId: sportId,
    eventId: eventId,
    eventTitle: eventTitle || req.body.eventTitle || `${req.user.sportName} Championship 2026`,
    team1Id: team1Id,
    team2Id: team2Id,
    format: (req.body.format || 'SINGLES').toUpperCase(),
    status: req.body.status || 'SCHEDULED',
    team1: req.body.team1,
    team2: req.body.team2,
    matchTitle: req.body.matchTitle || `${req.body.team1} vs ${req.body.team2}`,
    tableNumber: req.body.tableNumber || 'Table 1',
    time: req.body.time || '05:30 PM',
    score1: Number(req.body.score1 || 0),
    score2: Number(req.body.score2 || 0),
    winner: req.body.winner || null,
    youtubeVideoId: videoId,
    streamUrl: rawStreamUrl || null,
    isLiveStreaming: isStreaming,
  };

  if (!inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = [];
  }
  inMemoryCoordinatorMatches[sportId].unshift(newMatch);

  // Ensure table columns exist
  try {
    await queryDb(`
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS event_id TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS event_title TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS team1_id TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS team2_id TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS stream_url TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS is_live_streaming BOOLEAN DEFAULT FALSE;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS details JSONB;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS sets_history TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS current_set INT DEFAULT 1;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS sets_won1 INT DEFAULT 0;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS sets_won2 INT DEFAULT 0;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS current_quarter TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
  } catch (e) {}

  const defaultSetsHistory = newMatch.setsHistory || [
    { set: 1, score1: 0, score2: 0, isLocked: false, winner: null },
    { set: 2, score1: 0, score2: 0, isLocked: false, winner: null },
    { set: 3, score1: 0, score2: 0, isLocked: false, winner: null },
    { set: 4, score1: 0, score2: 0, isLocked: false, winner: null },
    { set: 5, score1: 0, score2: 0, isLocked: false, winner: null }
  ];

  const detailsObj = {
    eventId: eventId,
    eventTitle: newMatch.eventTitle,
    team1Id: team1Id,
    team2Id: team2Id,
    setsHistory: defaultSetsHistory,
    currentSet: newMatch.currentSet || 1,
    setsWon1: newMatch.setsWon1 || 0,
    setsWon2: newMatch.setsWon2 || 0,
    youtubeVideoId: videoId,
    streamUrl: rawStreamUrl || null,
    isLiveStreaming: isStreaming,
    ...(req.body.details && typeof req.body.details === 'object' ? req.body.details : {})
  };

  await queryDb(
    `INSERT INTO live_matches (
       id, sport_id, format, status, team1, team2, match_title, table_number,
       time, score1, score2, winner, youtube_video_id, stream_url, is_live_streaming,
       details, sets_history, current_set, sets_won1, sets_won2, event_id, event_title,
       team1_id, team2_id, updated_at, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE SET
       format = EXCLUDED.format, status = EXCLUDED.status, team1 = EXCLUDED.team1, team2 = EXCLUDED.team2,
       match_title = EXCLUDED.match_title, table_number = EXCLUDED.table_number, time = EXCLUDED.time,
       score1 = EXCLUDED.score1, score2 = EXCLUDED.score2, winner = EXCLUDED.winner,
       youtube_video_id = EXCLUDED.youtube_video_id,
       stream_url = EXCLUDED.stream_url,
       is_live_streaming = EXCLUDED.is_live_streaming,
       details = EXCLUDED.details,
       sets_history = EXCLUDED.sets_history,
       current_set = EXCLUDED.current_set,
       sets_won1 = EXCLUDED.sets_won1,
       sets_won2 = EXCLUDED.sets_won2,
       event_id = COALESCE(EXCLUDED.event_id, live_matches.event_id),
       event_title = COALESCE(EXCLUDED.event_title, live_matches.event_title),
       team1_id = COALESCE(EXCLUDED.team1_id, live_matches.team1_id),
       team2_id = COALESCE(EXCLUDED.team2_id, live_matches.team2_id),
       updated_at = CURRENT_TIMESTAMP`,
    [
      newMatch.id,
      newMatch.sportId,
      newMatch.format,
      newMatch.status,
      newMatch.team1,
      newMatch.team2,
      newMatch.matchTitle,
      newMatch.tableNumber,
      newMatch.time,
      newMatch.score1,
      newMatch.score2,
      newMatch.winner,
      videoId,
      rawStreamUrl || null,
      isStreaming,
      JSON.stringify(detailsObj),
      JSON.stringify(defaultSetsHistory),
      newMatch.currentSet || 1,
      newMatch.setsWon1 || 0,
      newMatch.setsWon2 || 0,
      eventId,
      newMatch.eventTitle,
      team1Id,
      team2Id
    ]
  );

  await syncMatchToMatchesTable(newMatch);

  logAuditEvent({
    actorName: req.user?.coordinatorName || req.user?.username || 'Sport Coordinator',
    role: 'SPORTS_COORDINATOR',
    action: 'Match Scheduled',
    entity: `Scheduled ${sportId} fixture: ${newMatch.matchTitle} (ID: ${newMatch.id})`,
    details: { matchId: newMatch.id, sportId, eventId },
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
  });

  return res.status(201).json({ success: true, match: newMatch });
};

export const batchSaveMatches = async (req, res) => {
  const sportId = (req.user?.assignedSport || req.body.sportId || 'badminton').toLowerCase();
  const matches = req.body.matches;

  if (!Array.isArray(matches)) {
    return res.status(400).json({ message: 'matches must be an array' });
  }

  // 1. Authoritative Event & Effective Registration-Closed Gate Check for batch matches
  for (const m of matches) {
    const eventId = m.eventId || m.event_id;
    if (eventId && eventId !== 'DEFAULT') {
      try {
        const evRes = await queryDb(
          `SELECT id, title, status, registration_open AS "registrationOpen", reg_start_date AS "regStartDate", reg_end_date AS "regEndDate"
           FROM coordinator_event_items WHERE id = $1`,
          [eventId]
        );
        if (evRes && evRes.rows && evRes.rows.length > 0) {
          const ev = evRes.rows[0];
          const regStatus = computeEffectiveRegistrationStatus(ev);

          if (!regStatus.canScheduleFixtures) {
            if (regStatus.effectiveRegistrationOpen) {
              return res.status(400).json({ 
                success: false, 
                message: 'Cannot schedule matches while registration is still open. Registration for this event must be closed before fixtures can be scheduled.',
                code: 'REGISTRATION_STILL_OPEN'
              });
            }
            return res.status(400).json({ 
              success: false, 
              message: regStatus.reason || 'Cannot schedule matches for this event in its current state.',
              code: regStatus.code
            });
          }
        }
      } catch (e) {}
    }
  }

  const savedMatches = [];

  for (const m of matches) {
    if (!m) continue;
    const matchId = String(m.id || `M${Math.floor(100000 + Math.random() * 900000)}`);
    const mSportId = (m.sportId || m.sport || sportId).toLowerCase();

    const t1 = typeof m.team1 === 'object' ? (m.team1?.name || '') : String(m.team1 || '').trim();
    const t2 = typeof m.team2 === 'object' ? (m.team2?.name || '') : String(m.team2 || '').trim();

    const team1Val = t1 || m.team1Name || m.subEvent || m.eventTitle || 'TBD';
    const team2Val = t2 || m.team2Name || (m.subEvent ? '' : 'TBD');

    const matchTitleVal = m.eventTitle || m.matchTitle || m.title || `${team1Val} vs ${team2Val}`;
    const tableNumberVal = m.tableNumber || m.venue || 'Table 1';
    const timeVal = m.time || m.scheduledTime || '05:30 PM';
    const statusVal = m.status || 'SCHEDULED';
    const formatVal = (m.format || 'SINGLES').toUpperCase();
    const score1Val = Number(m.score1 || 0);
    const score2Val = Number(m.score2 || 0);
    const winnerVal = m.winner || null;

    const rawStream = m.streamUrl || m.stream_url || m.liveStreamUrl || '';
    const videoId = m.youtubeVideoId || m.youtube_video_id || extractYouTubeVideoIdBackend(rawStream) || null;
    const isStreaming = Boolean(m.isLiveStreaming || videoId || rawStream);

    const detailsObj = {
      eventId: m.eventId || m.event_id || null,
      eventTitle: m.eventTitle || m.title || `${sportId.toUpperCase()} Match`,
      team1Id: m.team1Id || m.team1_id || null,
      team2Id: m.team2Id || m.team2_id || null,
      setsHistory: m.setsHistory || null,
      currentSet: m.currentSet || 1,
      setsWon1: m.setsWon1 || 0,
      setsWon2: m.setsWon2 || 0,
      youtubeVideoId: videoId,
      streamUrl: rawStream || null,
      isLiveStreaming: isStreaming,
      ...(m.details && typeof m.details === 'object' ? m.details : {})
    };

    try {
      await queryDb(
        `INSERT INTO live_matches (
           id, sport_id, format, status, team1, team2, match_title, table_number,
           time, score1, score2, winner, youtube_video_id, stream_url, is_live_streaming,
           details, sets_history, current_set, sets_won1, sets_won2, updated_at, created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           format = EXCLUDED.format,
           status = CASE
  WHEN LOWER(live_matches.status) IN ('running', 'live', 'in_progress', 'active')
    THEN live_matches.status
  ELSE EXCLUDED.status
END,
           team1 = EXCLUDED.team1,
           team2 = EXCLUDED.team2,
           match_title = EXCLUDED.match_title,
           table_number = EXCLUDED.table_number,
           time = EXCLUDED.time,

           score1 = CASE
           WHEN LOWER(live_matches.status) IN ('running', 'live', 'in_progress', 'active')
           THEN live_matches.score1
           ELSE EXCLUDED.score1
           END,

           score2 = CASE
           WHEN LOWER(live_matches.status) IN ('running', 'live', 'in_progress', 'active')
           THEN live_matches.score2
           ELSE EXCLUDED.score2
           END,

           winner = COALESCE(live_matches.winner, EXCLUDED.winner),
           youtube_video_id = CASE WHEN EXCLUDED.youtube_video_id IS NOT NULL AND EXCLUDED.youtube_video_id != '' THEN EXCLUDED.youtube_video_id ELSE live_matches.youtube_video_id END,
           stream_url = CASE WHEN EXCLUDED.stream_url IS NOT NULL AND EXCLUDED.stream_url != '' THEN EXCLUDED.stream_url ELSE live_matches.stream_url END,
           is_live_streaming = COALESCE(EXCLUDED.is_live_streaming, live_matches.is_live_streaming),
            details = EXCLUDED.details,
            updated_at = CURRENT_TIMESTAMP`,
        [
          matchId,
          mSportId,
          formatVal,
          statusVal,
          team1Val,
          team2Val,
          matchTitleVal,
          tableNumberVal,
          timeVal,
          score1Val,
          score2Val,
          winnerVal,
          videoId,
          rawStream || null,
          isStreaming,
          JSON.stringify(detailsObj),
          m.setsHistory ? (typeof m.setsHistory === 'string' ? m.setsHistory : JSON.stringify(m.setsHistory)) : null,
          m.currentSet || 1,
          m.setsWon1 || 0,
          m.setsWon2 || 0
        ]
      );

      await syncMatchToMatchesTable({
        ...m,
        id: matchId,
        sportId: mSportId,
        team1: team1Val,
        team2: team2Val,
        matchTitle: matchTitleVal,
        tableNumber: tableNumberVal,
        time: timeVal,
        status: statusVal,
        format: formatVal,
        score1: score1Val,
        score2: score2Val,
        winner: winnerVal,
        details: detailsObj
      });

      savedMatches.push({ ...m, id: matchId, sportId: mSportId });
    } catch (err) {
      console.error('Error batch saving match ID:', matchId, err.message);
    }
  }

  if (savedMatches.length > 0) {
    logAuditEvent({
      actorName: req.user?.coordinatorName || req.user?.username || 'Sport Coordinator',
      role: 'SPORTS_COORDINATOR',
      action: 'Matches Batch Scheduled',
      entity: `Saved ${savedMatches.length} fixtures for ${sportId}`,
      details: { count: savedMatches.length, sportId },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });
  }

  return res.json({ success: true, count: savedMatches.length, matches: savedMatches });
};

export const updateMatch = async (req, res) => {
  const sportId = (req.user?.assignedSport || req.body.sportId || 'badminton').toLowerCase();
  const { id } = req.params;

  let existing = null;
  try {
    const dbRes = await queryDb('SELECT * FROM live_matches WHERE id = $1', [id]);
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      existing = dbRes.rows[0];
      if (existing.sport_id && existing.sport_id.toLowerCase() !== sportId) {
        return res.status(403).json({ message: 'Access denied. You cannot modify matches belonging to another sport.' });
      }
    }
  } catch (e) {}

  const rawStreamUrl =
    req.body.streamUrl !== undefined
      ? req.body.streamUrl
      : req.body.liveStreamUrl !== undefined
      ? req.body.liveStreamUrl
      : req.body.stream_url !== undefined
      ? req.body.stream_url
      : (existing ? existing.stream_url : '');

  let extractedVideoId =
    req.body.youtubeVideoId !== undefined
      ? req.body.youtubeVideoId
      : req.body.youtube_video_id !== undefined
      ? req.body.youtube_video_id
      : extractYouTubeVideoIdBackend(rawStreamUrl);

  if (req.body.streamUrl === '' || req.body.liveStreamUrl === '' || req.body.youtubeVideoId === '') {
    extractedVideoId = null;
  }

  const isStreaming = Boolean(
    req.body.isLiveStreaming ||
    (extractedVideoId && req.body.streamUrl !== '' && req.body.liveStreamUrl !== '')
  );

  const payloadWithStream = {
    ...req.body,
    youtubeVideoId: extractedVideoId || null,
    streamUrl: rawStreamUrl || null,
    isLiveStreaming: isStreaming
  };

  const updatedMatch = {
    id,
    sportId,
    ...payloadWithStream
  };

  const rawSetsHistory = req.body.setsHistory || updatedMatch.setsHistory || existing?.sets_history;
  const setsHistoryArr = Array.isArray(rawSetsHistory) 
    ? rawSetsHistory 
    : (typeof rawSetsHistory === 'string' && rawSetsHistory.trim() ? JSON.parse(rawSetsHistory) : null);

  const setsHistoryStr = setsHistoryArr ? JSON.stringify(setsHistoryArr) : null;
  const currentSetVal = req.body.currentSet || req.body.currentSetIndex || updatedMatch.currentSet || existing?.current_set || 1;
  const setsWon1Val = req.body.setsWon1 !== undefined ? Number(req.body.setsWon1) : (updatedMatch.setsWon1 || existing?.sets_won1 || 0);
  const setsWon2Val = req.body.setsWon2 !== undefined ? Number(req.body.setsWon2) : (updatedMatch.setsWon2 || existing?.sets_won2 || 0);

  const currentQuarterVal = req.body.quarter || req.body.currentQuarter || updatedMatch.quarter || existing?.current_quarter || 'Quarter 1';

  let existingDetails = {};
  if (existing?.details) {
    try {
      existingDetails = typeof existing.details === 'string' ? JSON.parse(existing.details) : existing.details;
    } catch (e) {}
  }

  const detailsObj = {
    ...existingDetails,
    setsHistory: setsHistoryArr,
    currentSet: currentSetVal,
    setsWon1: setsWon1Val,
    setsWon2: setsWon2Val,
    quarter: currentQuarterVal,
    roster1: req.body.roster1 || updatedMatch.roster1 || existingDetails.roster1 || null,
    roster2: req.body.roster2 || updatedMatch.roster2 || existingDetails.roster2 || null,
    playerStats1: req.body.playerStats1 || updatedMatch.playerStats1 || existingDetails.playerStats1 || null,
    playerStats2: req.body.playerStats2 || updatedMatch.playerStats2 || existingDetails.playerStats2 || null,
    youtubeVideoId: extractedVideoId || null,
    streamUrl: rawStreamUrl || null,
    isLiveStreaming: isStreaming,
    ...(req.body.details && typeof req.body.details === 'object' ? req.body.details : {})
  };

  const t1Name = req.body.team1 || updatedMatch.team1 || existing?.team1 || 'Team 1';
  const t2Name = req.body.team2 || updatedMatch.team2 || existing?.team2 || 'Team 2';

  const r1List = req.body.roster1 || updatedMatch.roster1;
  if (Array.isArray(r1List)) {
    for (const p of r1List) {
      if (!p) continue;
      const jNo = String(p.jersey || p.jerseyNo || p.id || '0');
      const pName = p.name || p.playerName || `Player #${jNo}`;
      const onPitch = p.onCourt !== false && p.isOnPitch !== false;
      const pts = Number(p.points || 0);
      const fls = Number(p.fouls || 0);

      try {
        await queryDb(
          `INSERT INTO basketball_player_stats (id, match_id, team_name, jersey_no, player_name, is_on_pitch, points, fouls, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (match_id, team_name, jersey_no) DO UPDATE SET
             player_name = EXCLUDED.player_name,
             is_on_pitch = EXCLUDED.is_on_pitch,
             points = EXCLUDED.points,
             fouls = EXCLUDED.fouls,
             updated_at = CURRENT_TIMESTAMP`,
          [id, t1Name, jNo, pName, onPitch, pts, fls]
        );
      } catch (err) {}
    }
  }

  const r2List = req.body.roster2 || updatedMatch.roster2;
  if (Array.isArray(r2List)) {
    for (const p of r2List) {
      if (!p) continue;
      const jNo = String(p.jersey || p.jerseyNo || p.id || '0');
      const pName = p.name || p.playerName || `Player #${jNo}`;
      const onPitch = p.onCourt !== false && p.isOnPitch !== false;
      const pts = Number(p.points || 0);
      const fls = Number(p.fouls || 0);

      try {
        await queryDb(
          `INSERT INTO basketball_player_stats (id, match_id, team_name, jersey_no, player_name, is_on_pitch, points, fouls, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (match_id, team_name, jersey_no) DO UPDATE SET
             player_name = EXCLUDED.player_name,
             is_on_pitch = EXCLUDED.is_on_pitch,
             points = EXCLUDED.points,
             fouls = EXCLUDED.fouls,
             updated_at = CURRENT_TIMESTAMP`,
          [id, t2Name, jNo, pName, onPitch, pts, fls]
        );
      } catch (err) {}
    }
  }

  await queryDb(
    `INSERT INTO live_matches (id, sport_id, format, status, team1, team2, match_title, table_number, time, score1, score2, winner, youtube_video_id, stream_url, is_live_streaming, details, sets_history, current_set, sets_won1, sets_won2, current_quarter, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE SET
       status = COALESCE(EXCLUDED.status, live_matches.status),
       team1 = COALESCE(EXCLUDED.team1, live_matches.team1),
       team2 = COALESCE(EXCLUDED.team2, live_matches.team2),
       match_title = COALESCE(EXCLUDED.match_title, live_matches.match_title),
       table_number = COALESCE(EXCLUDED.table_number, live_matches.table_number),
       time = COALESCE(EXCLUDED.time, live_matches.time),
       score1 = EXCLUDED.score1,
       score2 = EXCLUDED.score2,
       winner = COALESCE(live_matches.winner, EXCLUDED.winner),
       youtube_video_id = EXCLUDED.youtube_video_id,
       stream_url = EXCLUDED.stream_url,
       is_live_streaming = EXCLUDED.is_live_streaming,
       details = EXCLUDED.details,
       sets_history = CASE WHEN EXCLUDED.sets_history IS NOT NULL AND EXCLUDED.sets_history != '' THEN EXCLUDED.sets_history ELSE live_matches.sets_history END,
       current_set = COALESCE(EXCLUDED.current_set, live_matches.current_set),
       sets_won1 = COALESCE(EXCLUDED.sets_won1, live_matches.sets_won1),
       sets_won2 = COALESCE(EXCLUDED.sets_won2, live_matches.sets_won2),
       current_quarter = COALESCE(EXCLUDED.current_quarter, live_matches.current_quarter),
       updated_at = CURRENT_TIMESTAMP`,
    [
      id,
      sportId,
      (req.body.format || updatedMatch.format || existing?.format || 'SINGLES').toUpperCase(),
      req.body.status || updatedMatch.status || existing?.status || 'SCHEDULED',
      t1Name,
      t2Name,
      req.body.matchTitle || updatedMatch.matchTitle || existing?.match_title || `${t1Name} vs ${t2Name}`,
      req.body.tableNumber || updatedMatch.tableNumber || existing?.table_number || 'Table 1',
      req.body.time || updatedMatch.time || existing?.time || '05:30 PM',
      req.body.score1 !== undefined ? Number(req.body.score1) : Number(existing?.score1 || 0),
      req.body.score2 !== undefined ? Number(req.body.score2) : Number(existing?.score2 || 0),
      req.body.winner || updatedMatch.winner || existing?.winner || null,
      extractedVideoId || null,
      rawStreamUrl || null,
      isStreaming,
      JSON.stringify(detailsObj),
      setsHistoryStr,
      currentSetVal,
      setsWon1Val,
      setsWon2Val,
      currentQuarterVal
    ]
  );

  await syncMatchToMatchesTable(updatedMatch);

  return res.json({ success: true, match: { ...updatedMatch, details: detailsObj } });
};

export const getBasketballMatchPlayersDB = async (req, res) => {
  const { id } = req.params;
  try {
    const dbRes = await queryDb(
      `SELECT id, match_id AS "matchId", team_name AS "teamName", 
              jersey_no AS "jerseyNo", player_name AS "playerName", 
              is_on_pitch AS "isOnPitch", points, fouls, 
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM basketball_player_stats 
       WHERE match_id = $1 
       ORDER BY team_name, jersey_no ASC`,
      [id]
    );

    return res.json(dbRes ? dbRes.rows : []);
  } catch (err) {
    console.error('Error fetching basketball player stats from DB:', err.message);
    return res.status(500).json({ message: 'Failed to fetch player statistics' });
  }
};

export const deleteMatch = async (req, res) => {
  const sportId = (req.user?.assignedSport || '').toLowerCase();
  const { id } = req.params;

  if (!sportId) {
    return res.status(403).json({ message: 'Sport coordinator authorization missing.' });
  }

  if (inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = inMemoryCoordinatorMatches[sportId].filter((m) => m.id !== id);
  }

  const result = await queryDb('DELETE FROM live_matches WHERE id = $1 AND LOWER(sport_id) = $2 RETURNING id', [id, sportId]);
  try { await queryDb('DELETE FROM matches WHERE id = $1 AND LOWER(sport_id) = $2', [id, sportId]); } catch(e){}

  if (result && result.rows && result.rows.length > 0) {
    logAuditEvent({
      actorName: req.user?.coordinatorName || req.user?.username || 'Sport Coordinator',
      role: 'SPORTS_COORDINATOR',
      action: 'Match Deleted',
      entity: `Deleted ${sportId} match: ${id}`,
      entityId: id,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });
    return res.json({ success: true, message: 'Match deleted successfully' });
  }
  return res.status(404).json({ success: false, message: 'Match not found or unauthorized for this sport' });
};

export const deleteAllMatches = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();

  inMemoryCoordinatorMatches[sportId] = [];

  try {
    await queryDb('DELETE FROM live_matches WHERE LOWER(sport_id) = $1', [sportId]);
    await queryDb('DELETE FROM matches WHERE LOWER(sport_id) = $1', [sportId]);
  } catch (e) {
    console.warn('Backend deleteAllMatches query error:', e);
  }

  return res.json({ success: true, message: `All matches cleared for ${sportId}` });
};

export const updateMatchScore = async (req, res) => {
  const sportId = (req.user?.assignedSport || req.body.sportId || 'badminton').toLowerCase();
  const { id } = req.params;

  let existing = null;
  try {
    const dbRes = await queryDb('SELECT * FROM live_matches WHERE id = $1', [id]);
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      existing = dbRes.rows[0];
      if (existing.sport_id && existing.sport_id.toLowerCase() !== sportId) {
        return res.status(403).json({ message: 'Access denied. You cannot modify matches belonging to another sport.' });
      }
    }
  } catch (e) {
    console.warn('updateMatchScore DB select error:', e.message);
  }

  const rawStreamUrl =
    req.body.streamUrl !== undefined
      ? req.body.streamUrl
      : req.body.liveStreamUrl !== undefined
      ? req.body.liveStreamUrl
      : req.body.stream_url !== undefined
      ? req.body.stream_url
      : (existing ? existing.stream_url : '');

  let extractedVideoId =
    req.body.youtubeVideoId !== undefined
      ? req.body.youtubeVideoId
      : req.body.youtube_video_id !== undefined
      ? req.body.youtube_video_id
      : extractYouTubeVideoIdBackend(rawStreamUrl);

  if (req.body.streamUrl === '' || req.body.liveStreamUrl === '' || req.body.youtubeVideoId === '') {
    extractedVideoId = null;
  }

  const isStreaming = Boolean(
    req.body.isLiveStreaming !== undefined
      ? req.body.isLiveStreaming
      : (extractedVideoId && rawStreamUrl)
  );

  let match = existing ? {
    id: existing.id,
    sportId: existing.sport_id || sportId,
    format: existing.format || 'SINGLES',
    status: req.body.status || existing.status || 'running',
    team1: existing.team1,
    team2: existing.team2,
    matchTitle: existing.match_title,
    tableNumber: req.body.venue || req.body.tableNumber || existing.table_number || 'Table 1',
    score1: req.body.score1 !== undefined ? Number(req.body.score1) : Number(existing.score1 || 0),
    score2: req.body.score2 !== undefined ? Number(req.body.score2) : Number(existing.score2 || 0),
    winner: req.body.winner || existing.winner || null,
    youtubeVideoId: extractedVideoId || existing.youtube_video_id || null,
    streamUrl: rawStreamUrl || existing.stream_url || null,
    isLiveStreaming: isStreaming,
    setsHistory: existing.sets_history,
    currentSet: existing.current_set || 1,
    setsWon1: existing.sets_won1 || 0,
    setsWon2: existing.sets_won2 || 0,
  } : {
    id,
    sportId,
    format: req.body.format || 'SINGLES',
    status: req.body.status || 'running',
    team1: req.body.team1 || 'Team A',
    team2: req.body.team2 || 'Team B',
    matchTitle: req.body.matchTitle || `${req.body.team1 || 'Team A'} vs ${req.body.team2 || 'Team B'}`,
    tableNumber: req.body.venue || req.body.tableNumber || 'Table 1',
    score1: Number(req.body.score1 || 0),
    score2: Number(req.body.score2 || 0),
    winner: req.body.winner || null,
    youtubeVideoId: extractedVideoId || null,
    streamUrl: rawStreamUrl || null,
    isLiveStreaming: isStreaming,
  };

  if (req.body.team1 !== undefined) match.team1 = req.body.team1;
  if (req.body.team2 !== undefined) match.team2 = req.body.team2;
  if (req.body.matchTitle !== undefined) match.matchTitle = req.body.matchTitle;
  if (req.body.score1 !== undefined) match.score1 = Number(req.body.score1);
  if (req.body.score2 !== undefined) match.score2 = Number(req.body.score2);
  if (req.body.status !== undefined) match.status = req.body.status;
  if (req.body.venue !== undefined) match.tableNumber = req.body.venue;
  if (req.body.tableNumber !== undefined) match.tableNumber = req.body.tableNumber;
  if (req.body.winner !== undefined) match.winner = req.body.winner;

  const rawSetsHistory = req.body.setsHistory || match.setsHistory;
  const setsHistoryArr = Array.isArray(rawSetsHistory)
    ? rawSetsHistory
    : (typeof rawSetsHistory === 'string' && rawSetsHistory.trim() ? JSON.parse(rawSetsHistory) : [
        { set: 1, score1: match.score1, score2: match.score2, isLocked: false, winner: null },
        { set: 2, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 3, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 4, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 5, score1: 0, score2: 0, isLocked: false, winner: null }
      ]);

  const currentSetVal = req.body.currentSet || req.body.currentSetIndex || match.currentSet || 1;
  const setsWon1Val = req.body.setsWon1 !== undefined ? Number(req.body.setsWon1) : (match.setsWon1 || 0);
  const setsWon2Val = req.body.setsWon2 !== undefined ? Number(req.body.setsWon2) : (match.setsWon2 || 0);

  let existingDetails = {};
  if (existing?.details) {
    try {
      existingDetails = typeof existing.details === 'string' ? JSON.parse(existing.details) : existing.details;
    } catch (e) {}
  }

  const detailsObj = {
    ...existingDetails,
    ...(req.body.details && typeof req.body.details === 'object' ? req.body.details : {}),
    // Preserve sport-specific top-level properties sent by coordinator scorers
    ...(req.body.striker !== undefined ? { striker: req.body.striker } : {}),
    ...(req.body.nonStriker !== undefined ? { nonStriker: req.body.nonStriker } : {}),
    ...(req.body.bowler !== undefined ? { bowler: req.body.bowler } : {}),
    ...(req.body.recentBalls !== undefined ? { recentBalls: req.body.recentBalls } : {}),
    ...(req.body.commentaryLog !== undefined ? { commentaryLog: req.body.commentaryLog } : {}),
    ...(req.body.battingCard1 !== undefined ? { battingCard1: req.body.battingCard1 } : {}),
    ...(req.body.bowlingCard1 !== undefined ? { bowlingCard1: req.body.bowlingCard1 } : {}),
    ...(req.body.battingCard2 !== undefined ? { battingCard2: req.body.battingCard2 } : {}),
    ...(req.body.bowlingCard2 !== undefined ? { bowlingCard2: req.body.bowlingCard2 } : {}),
    ...(req.body.currentInnings !== undefined ? { currentInnings: req.body.currentInnings } : {}),
    ...(req.body.battingTeam !== undefined ? { battingTeam: req.body.battingTeam } : {}),
    ...(req.body.bowlingTeam !== undefined ? { bowlingTeam: req.body.bowlingTeam } : {}),
    ...(req.body.wickets1 !== undefined ? { wickets1: req.body.wickets1 } : {}),
    ...(req.body.overs1 !== undefined ? { overs1: req.body.overs1 } : {}),
    ...(req.body.wickets2 !== undefined ? { wickets2: req.body.wickets2 } : {}),
    ...(req.body.overs2 !== undefined ? { overs2: req.body.overs2 } : {}),
    ...(req.body.targetRuns !== undefined ? { targetRuns: req.body.targetRuns } : {}),
    ...(req.body.firstInningsScore !== undefined ? { firstInningsScore: req.body.firstInningsScore } : {}),
    ...(req.body.extras !== undefined ? { extras: req.body.extras } : {}),
    ...(req.body.quarter !== undefined ? { quarter: req.body.quarter } : {}),
    ...(req.body.half !== undefined ? { half: req.body.half } : {}),
    ...(req.body.completedHalf1 !== undefined ? { completedHalf1: req.body.completedHalf1 } : {}),
    ...(req.body.half1Score1 !== undefined ? { half1Score1: req.body.half1Score1 } : {}),
    ...(req.body.half1Score2 !== undefined ? { half1Score2: req.body.half1Score2 } : {}),
    ...(req.body.half1Stats1 !== undefined ? { half1Stats1: req.body.half1Stats1 } : {}),
    ...(req.body.half1Stats2 !== undefined ? { half1Stats2: req.body.half1Stats2 } : {}),
    ...(req.body.half2Score1 !== undefined ? { half2Score1: req.body.half2Score1 } : {}),
    ...(req.body.half2Score2 !== undefined ? { half2Score2: req.body.half2Score2 } : {}),
    ...(req.body.half2Stats1 !== undefined ? { half2Stats1: req.body.half2Stats1 } : {}),
    ...(req.body.half2Stats2 !== undefined ? { half2Stats2: req.body.half2Stats2 } : {}),
    ...(req.body.kabaddiStats1 !== undefined ? { kabaddiStats1: req.body.kabaddiStats1 } : {}),
    ...(req.body.kabaddiStats2 !== undefined ? { kabaddiStats2: req.body.kabaddiStats2 } : {}),
    ...(req.body.roster1 !== undefined ? { roster1: req.body.roster1 } : {}),
    ...(req.body.roster2 !== undefined ? { roster2: req.body.roster2 } : {}),
    ...(req.body.playerStats1 !== undefined ? { playerStats1: req.body.playerStats1 } : {}),
    ...(req.body.playerStats2 !== undefined ? { playerStats2: req.body.playerStats2 } : {}),
    ...(req.body.roundsWon1 !== undefined ? { roundsWon1: req.body.roundsWon1 } : {}),
    ...(req.body.roundsWon2 !== undefined ? { roundsWon2: req.body.roundsWon2 } : {}),
    ...(req.body.currentRound !== undefined ? { currentRound: req.body.currentRound } : {}),
    ...(req.body.roundsHistory !== undefined ? { roundsHistory: req.body.roundsHistory } : {}),
    ...(req.body.activeSubEvent !== undefined ? { activeSubEvent: req.body.activeSubEvent } : {}),
    ...(req.body.medals !== undefined ? { medals: req.body.medals } : {}),
    ...(req.body.scoreSummary !== undefined ? { scoreSummary: req.body.scoreSummary } : {}),
    ...(req.body.scoreText !== undefined ? { scoreText: req.body.scoreText } : {}),
    setsHistory: setsHistoryArr,
    currentSet: currentSetVal,
    setsWon1: setsWon1Val,
    setsWon2: setsWon2Val,
    youtubeVideoId: extractedVideoId || existing?.youtube_video_id || null,
    streamUrl: rawStreamUrl || existing?.stream_url || null,
    isLiveStreaming: isStreaming
  };

  try {
    await queryDb(
      `INSERT INTO live_matches (
         id, sport_id, format, status, team1, team2, match_title, table_number, time,
         score1, score2, winner, youtube_video_id, stream_url, is_live_streaming,
         details, sets_history, current_set, sets_won1, sets_won2, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10, $11, $12, $13, $14, $15,
         $16, $17, $18, $19, $20, CURRENT_TIMESTAMP
       )
       ON CONFLICT (id) DO UPDATE SET
         score1 = EXCLUDED.score1,
         score2 = EXCLUDED.score2,
         status = EXCLUDED.status,
         table_number = EXCLUDED.table_number,
         details = EXCLUDED.details,
         sets_history = EXCLUDED.sets_history,
         current_set = EXCLUDED.current_set,
         sets_won1 = EXCLUDED.sets_won1,
         sets_won2 = EXCLUDED.sets_won2,
         youtube_video_id = EXCLUDED.youtube_video_id,
         stream_url = EXCLUDED.stream_url,
         is_live_streaming = EXCLUDED.is_live_streaming,
         winner = EXCLUDED.winner,
         updated_at = CURRENT_TIMESTAMP`,
      [
        id,
        match.sportId || sportId,
        match.format || 'SINGLES',
        match.status || 'running',
        match.team1 || 'Team 1',
        match.team2 || 'Team 2',
        match.matchTitle || `${match.team1} vs ${match.team2}`,
        match.tableNumber || 'Table 1',
        match.time || '10:00 AM',
        match.score1,
        match.score2,
        match.winner || null,
        extractedVideoId || existing?.youtube_video_id || null,
        rawStreamUrl || existing?.stream_url || null,
        isStreaming,
        JSON.stringify(detailsObj),
        JSON.stringify(setsHistoryArr),
        currentSetVal,
        setsWon1Val,
        setsWon2Val
      ]
    );
  } catch (e) {
    console.warn('updateMatchScore DB update error:', e.message);
  }

  const completeUpdatedMatch = {
    ...match,
    youtubeVideoId: extractedVideoId || existing?.youtube_video_id || null,
    streamUrl: rawStreamUrl || existing?.stream_url || null,
    isLiveStreaming: isStreaming,
    details: detailsObj,
    setsHistory: setsHistoryArr,
    currentSet: currentSetVal,
    setsWon1: setsWon1Val,
    setsWon2: setsWon2Val,
  };

  if (inMemoryCoordinatorMatches[sportId]) {
    const idx = inMemoryCoordinatorMatches[sportId].findIndex(m => m.id === id);
    if (idx >= 0) {
      inMemoryCoordinatorMatches[sportId][idx] = { ...inMemoryCoordinatorMatches[sportId][idx], ...completeUpdatedMatch };
    }
  }

  await syncMatchToMatchesTable(completeUpdatedMatch);

  return res.json({ success: true, match: completeUpdatedMatch });
};

export const completeMatch = async (req, res) => {
  const sportId = (req.user?.assignedSport || req.body.sportId || req.body.sport || '').toLowerCase().replace(/_/g, '-');
  const { id } = req.params;
  const isGully = sportId.includes('gully');

  try {
    let existing = null;
    try {
      const existingResult = await queryDb(
        `SELECT id, sport_id, format, status, team1, team2, match_title, time, score1, score2, winner, sets_history, current_set, sets_won1, sets_won2, details
         FROM live_matches
         WHERE id = $1
         LIMIT 1`,
        [id]
      );
      if (existingResult && existingResult.rows.length > 0) {
        existing = existingResult.rows[0];
      }
    } catch (e) {}

    if (!existing) {
      try {
        const matchesResult = await queryDb(
          `SELECT id, sport_id, format, status, team1, team2, match_title, time, score1, score2, winner, details
           FROM matches
           WHERE id = $1
           LIMIT 1`,
          [id]
        );
        if (matchesResult && matchesResult.rows.length > 0) {
          existing = matchesResult.rows[0];
        }
      } catch (e) {}
    }

    const t1 = req.body.team1 || existing?.team1 || 'Team 1';
    const t2 = req.body.team2 || existing?.team2 || 'Team 2';
    const mFormat = req.body.format || existing?.format || (isGully ? '6-Overs Fast Box' : 'Team');
    const mTitle = req.body.matchTitle || existing?.match_title || `${t1} vs ${t2}`;
    const mTime = req.body.time || existing?.time || '10:00 AM';

    const score1 = req.body.score1 !== undefined ? Number(req.body.score1) : Number(existing?.score1 || 0);
    const score2 = req.body.score2 !== undefined ? Number(req.body.score2) : Number(existing?.score2 || 0);

    const winner =
      req.body.winner ||
      existing?.winner ||
      (score1 > score2 ? t1 : score2 > score1 ? t2 : 'Completed');

    let existingDetails = {};
    if (existing?.details) {
      try {
        existingDetails = typeof existing.details === 'string' ? JSON.parse(existing.details) : existing.details;
      } catch (e) {}
    }

    let setsHistory = [];
    if (Array.isArray(req.body.setsHistory)) {
      setsHistory = req.body.setsHistory;
    } else if (typeof req.body.setsHistory === 'string' && req.body.setsHistory.trim()) {
      try { setsHistory = JSON.parse(req.body.setsHistory); } catch (e) {}
    } else if (Array.isArray(existing?.sets_history)) {
      setsHistory = existing.sets_history;
    } else if (typeof existing?.sets_history === 'string' && existing?.sets_history.trim()) {
      try { setsHistory = JSON.parse(existing.sets_history); } catch (e) {}
    }

    const details = {
      ...existingDetails,
      ...(req.body.details && typeof req.body.details === 'object' ? req.body.details : {}),
      ...(req.body.striker !== undefined ? { striker: req.body.striker } : {}),
      ...(req.body.nonStriker !== undefined ? { nonStriker: req.body.nonStriker } : {}),
      ...(req.body.bowler !== undefined ? { bowler: req.body.bowler } : {}),
      ...(req.body.recentBalls !== undefined ? { recentBalls: req.body.recentBalls } : {}),
      ...(req.body.commentaryLog !== undefined ? { commentaryLog: req.body.commentaryLog } : {}),
      ...(req.body.battingCard1 !== undefined ? { battingCard1: req.body.battingCard1 } : {}),
      ...(req.body.bowlingCard1 !== undefined ? { bowlingCard1: req.body.bowlingCard1 } : {}),
      ...(req.body.battingCard2 !== undefined ? { battingCard2: req.body.battingCard2 } : {}),
      ...(req.body.bowlingCard2 !== undefined ? { bowlingCard2: req.body.bowlingCard2 } : {}),
      ...(req.body.currentInnings !== undefined ? { currentInnings: req.body.currentInnings } : {}),
      ...(req.body.battingTeam !== undefined ? { battingTeam: req.body.battingTeam } : {}),
      ...(req.body.bowlingTeam !== undefined ? { bowlingTeam: req.body.bowlingTeam } : {}),
      ...(req.body.wickets1 !== undefined ? { wickets1: req.body.wickets1 } : {}),
      ...(req.body.overs1 !== undefined ? { overs1: req.body.overs1 } : {}),
      ...(req.body.wickets2 !== undefined ? { wickets2: req.body.wickets2 } : {}),
      ...(req.body.overs2 !== undefined ? { overs2: req.body.overs2 } : {}),
      ...(req.body.targetRuns !== undefined ? { targetRuns: req.body.targetRuns } : {}),
      ...(req.body.firstInningsScore !== undefined ? { firstInningsScore: req.body.firstInningsScore } : {}),
      ...(req.body.resultString !== undefined ? { resultString: req.body.resultString } : {}),
      winner,
      completedAt: new Date().toISOString(),
      setsHistory,
      currentSet: Number(req.body.currentSet || existing?.current_set || 1),
      setsWon1: Number(req.body.setsWon1 !== undefined ? req.body.setsWon1 : (existing?.sets_won1 || 0)),
      setsWon2: Number(req.body.setsWon2 !== undefined ? req.body.setsWon2 : (existing?.sets_won2 || 0)),
    };

    const mSportId = (existing?.sport_id || sportId || 'gully-cricket').toLowerCase();

    const result = await queryDb(
      `
      INSERT INTO live_matches (
        id,
        sport_id,
        format,
        status,
        team1,
        team2,
        match_title,
        table_number,
        time,
        score1,
        score2,
        winner,
        sets_history,
        details,
        is_live_streaming,
        updated_at
      )
      VALUES (
        $1, $2, $3, 'COMPLETED', $4, $5, $6, NULL, $7, $8, $9, $10, $11, $12, FALSE, CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        status = 'COMPLETED',
        table_number = NULL,
        is_live_streaming = FALSE,
        team1 = COALESCE(EXCLUDED.team1, live_matches.team1),
        team2 = COALESCE(EXCLUDED.team2, live_matches.team2),
        match_title = COALESCE(EXCLUDED.match_title, live_matches.match_title),
        format = COALESCE(EXCLUDED.format, live_matches.format),
        winner = EXCLUDED.winner,
        score1 = EXCLUDED.score1,
        score2 = EXCLUDED.score2,
        sets_history = EXCLUDED.sets_history,
        details = EXCLUDED.details,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        id,
        sport_id AS "sportId",
        format,
        status,
        team1,
        team2,
        score1,
        score2,
        winner,
        sets_history AS "setsHistory",
        current_set AS "currentSet",
        sets_won1 AS "setsWon1",
        sets_won2 AS "setsWon2",
        table_number AS "tableNumber",
        is_live_streaming AS "isLiveStreaming",
        details,
        updated_at AS "updatedAt"
      `,
      [
        id,
        mSportId,
        mFormat,
        t1,
        t2,
        mTitle,
        mTime,
        score1,
        score2,
        winner,
        JSON.stringify(setsHistory),
        JSON.stringify(details)
      ]
    );

    // Purge from matches table so completed matches are not in scheduled table
    try {
      await queryDb('DELETE FROM matches WHERE id = $1', [id]);
    } catch (e) {}

    // Update in-memory coordinator matches if present
    if (inMemoryCoordinatorMatches[sportId]) {
      const idx = inMemoryCoordinatorMatches[sportId].findIndex(m => m.id === id);
      if (idx >= 0) {
        inMemoryCoordinatorMatches[sportId][idx] = {
          ...inMemoryCoordinatorMatches[sportId][idx],
          ...result.rows[0],
          status: 'COMPLETED'
        };
      }
    }

    logAuditEvent({
      actorName: req.user?.coordinatorName || req.user?.username || 'Sport Coordinator',
      role: 'SPORTS_COORDINATOR',
      action: 'Match Completed',
      entity: `Completed ${mSportId} match: ${mTitle} • Winner: ${winner || 'Declared'} (Score: ${score1} - ${score2})`,
      details: { matchId: id, sportId: mSportId, winner, score1, score2 },
      entityId: id,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    return res.json({
      success: true,
      match: result.rows[0] || { id, sportId: mSportId, status: 'COMPLETED', winner, score1, score2 },
    });
  } catch (err) {
    console.error(`Failed to complete match ${id}:`, err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete match',
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const sportId = (req.user.assignedSport || '').toLowerCase();

    const registeredTeams = await prisma.collegeRegistration.count({
      where: { sportId: { contains: sportId, mode: 'insensitive' } }
    });

    const approvedTeams = await prisma.collegeRegistration.count({
      where: {
        sportId: { contains: sportId, mode: 'insensitive' },
        status: { in: ['Approved', 'Confirmed', 'VERIFIED'] }
      }
    });

    const pendingRegistrations = await prisma.collegeRegistration.count({
      where: {
        sportId: { contains: sportId, mode: 'insensitive' },
        status: 'Pending'
      }
    });

    let runningMatches = 0;
    let completedMatches = 0;
    let upcomingMatches = 0;
    let totalMatches = 0;

    try {
      const matchCountsRes = await queryDb(
        `SELECT LOWER(status) as status, COUNT(*) as count FROM live_matches WHERE LOWER(sport_id) = $1 GROUP BY LOWER(status)`,
        [sportId]
      );
      if (matchCountsRes && matchCountsRes.rows) {
        matchCountsRes.rows.forEach(r => {
          const s = r.status;
          const count = parseInt(r.count, 10) || 0;
          totalMatches += count;
          if (s === 'running' || s === 'live' || s === 'in_progress' || s === 'active') {
            runningMatches += count;
          } else if (s === 'completed' || s === 'finished') {
            completedMatches += count;
          } else if (s === 'scheduled' || s === 'upcoming' || s === 'draft') {
            upcomingMatches += count;
          }
        });
      }
    } catch (e) {
      console.warn('Error querying match counts for stats:', e.message);
      const sportMatches = inMemoryCoordinatorMatches[sportId] || [];
      runningMatches = sportMatches.filter((m) => m.status === 'running' || m.status === 'live').length;
      completedMatches = sportMatches.filter((m) => m.status === 'COMPLETED' || m.status === 'FINISHED').length;
      upcomingMatches = sportMatches.filter((m) => m.status === 'SCHEDULED').length;
      totalMatches = sportMatches.length;
    }

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
      totalMatches,
    });
  } catch (err) {
    console.error('Error fetching coordinator dashboard stats:', err);
    return res.status(500).json({ message: 'Error loading stats' });
  }
};

export const getRegistrations = async (req, res) => {
  try {
    const sportId = (req.user?.assignedSport || req.user?.sportName || '').toLowerCase();
    const cleanSportId = sportId.replace(/_/g, '-');
    const baseSportId = cleanSportId.split('-')[0].split('_')[0];
    const isGully = cleanSportId.includes('gully');
    const isStandardCricket = cleanSportId === 'cricket' || (cleanSportId.includes('cricket') && !isGully);

    // 1. Direct Raw SQL QueryDb from college_registrations
    try {
      let sql = `SELECT 
          cr.id, cr.registration_id AS "registrationId", cr.event_id AS "eventId",
          cr.sport_id AS "sportId", cr.student_name AS "studentName", cr.team_name AS "teamName",
          cr.college, cr.department, '' AS "enrollmentNo", cr.email, cr.phone, cr.gender,
          cr.emergency_contact AS "emergencyContact", cr.status, cr.fee_paid AS "feePaid",
          cr.payment_id AS "paymentId", cr.payment_status AS "paymentStatus",
          cr.participant_data AS "participantData",
          COALESCE(cei.title, cr.participant_data->>'eventTitle', cr.participant_data->>'eventName', NULL) AS "eventTitleFromDb",
          TO_CHAR(cr.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS "formattedDate",
          TO_CHAR(cr.created_at AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM') AS "formattedTime",
          cr.created_at AS "createdAt"
         FROM college_registrations cr
         LEFT JOIN coordinator_event_items cei ON cei.id::text = cr.event_id::text`;
      let params = [];

      if (sportId && sportId !== 'all') {
        if (isStandardCricket) {
          sql += ` WHERE (LOWER(cr.sport_id) = 'cricket' OR LOWER(cr.sport_id) LIKE '%cricket%') AND LOWER(cr.sport_id) NOT LIKE '%gully%'`;
        } else if (isGully) {
          sql += ` WHERE LOWER(cr.sport_id) LIKE '%gully%' OR LOWER(cr.sport_id) = 'gully-cricket' OR LOWER(cr.sport_id) = 'gully_cricket'`;
        } else {
          sql += ` WHERE LOWER(cr.sport_id) = $1 OR LOWER(cr.sport_id) = $2 OR LOWER(cr.sport_id) LIKE $3`;
          params = [sportId, cleanSportId, `%${cleanSportId}%`];
        }
      }
      sql += ` ORDER BY cr.created_at DESC`;

      const sqlRes = await queryDb(sql, params);

      if (sqlRes && sqlRes.rows && sqlRes.rows.length > 0) {
        const formatted = await Promise.all(
          sqlRes.rows.map(async (r) => {
            let members = [];
            const targetUuid = (r.registrationId && isUuid(r.registrationId))
              ? r.registrationId
              : (isUuid(r.id) ? r.id : null);

            if (targetUuid) {
              try {
                const memRes = await queryDb(
                  `SELECT id, "fullName", "rollNo", "dateOfBirth",
                          mobile, email, course, year_semester AS "yearSemester", gender, "isCaptain"
                   FROM registration_members
                   WHERE "registrationId" = $1::uuid OR id = $1::uuid
                   ORDER BY "isCaptain" DESC, "createdAt" ASC`,
                  [targetUuid]
                );
                if (memRes && memRes.rows) {
                  members = memRes.rows.map((m) => ({
                    ...m,
                    isCaptain: (m.isCaptain === true || m.isCaptain === 1 || m.isCaptain === 'true' || m.isCaptain === '1')
                  }));
                }
              } catch (e) {}
            }

            // Fallback to participantData roster if members table query returned empty
            if (members.length === 0 && r.participantData?.roster && Array.isArray(r.participantData.roster)) {
              members = r.participantData.roster.map((m, idx) => {
                const parsedCap = (m.isCaptain === true || m.isCaptain === 1 || m.isCaptain === 'true' || m.isCaptain === '1')
                  ? true
                  : ((m.isCaptain === false || m.isCaptain === 0 || m.isCaptain === 'false' || m.isCaptain === '0') ? false : null);
                return {
                  id: `${r.id}_mem_${idx}`,
                  fullName: m.name || m.fullName,
                  rollNo: m.rollNo || m.roll || 'N/A',
                  mobile: m.phone || m.mobile || r.phone,
                  email: m.email || r.email,
                  course: m.course || m.branch || r.department || 'N/A',
                  yearSemester: m.semester || m.year || m.yearSemester || 'N/A',
                  gender: m.gender || r.gender,
                  isCaptain: parsedCap !== null ? parsedCap : (idx === 0)
                };
              });
            }

            const player1 = members[0] ? {
              name: members[0].fullName || r.studentName,
              roll: members[0].rollNo || r.enrollmentNo,
              college: r.college,
              year: members[0].yearSemester || r.department,
              phone: members[0].mobile || r.phone,
              email: members[0].email || r.email,
              gender: members[0].gender || r.gender
            } : {
              name: r.studentName,
              roll: r.enrollmentNo,
              college: r.college,
              year: r.department,
              phone: r.phone,
              email: r.email,
              gender: r.gender
            };

            const player2 = members[1] ? {
              name: members[1].fullName,
              roll: members[1].rollNo,
              college: r.college,
              year: members[1].yearSemester || r.department,
              phone: members[1].mobile,
              email: members[1].email,
              gender: members[1].gender
            } : null;

            const participationType = normalizeParticipationType(r, r.sportId || sportId);
            const isDoubles = participationType === 'DUO';

            return {
              id: r.id,
              receiptId: r.id,
              eventId: r.eventId,
              sportId: r.sportId,
              eventTitle: r.eventTitleFromDb || `${(r.sportId || 'Sport').replace(/-/g, ' ').toUpperCase()} Championship`,
              participationType,
              category: isDoubles ? 'DOUBLES' : (participationType === 'TEAM' ? 'TEAM' : 'SINGLES'),
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
              feePaid: Number(r.feePaid || 0),
              paymentId: r.paymentId,
              paymentStatus: r.paymentStatus,
              createdAt: r.createdAt,
              date: r.formattedDate || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
              time: r.formattedTime || '10:00 AM',
              registrationDate: r.formattedDate || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
              registrationTime: r.formattedTime || '10:00 AM',
              registeredDate: r.formattedDate || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
              player1,
              player2,
              members: members || []
            };
          })
        );
        return res.json(formatted);
      }
    } catch (e) {
      console.error('queryDb getRegistrations fallback error:', e.message);
    }

    // 2. Prisma fallback
    const registrations = await prisma.collegeRegistration.findMany({
      where: {
        OR: [
          { sportId: { contains: sportId, mode: 'insensitive' } },
          { sportId: { contains: cleanSportId, mode: 'insensitive' } },
          { sportId: { contains: baseSportId, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const detailedRegistrations = await Promise.all(
      registrations.map(async (r) => {
        let members = [];
        try {
          members = await prisma.registrationMember.findMany({
            where: {
              OR: [
                { registrationId: r.registrationId || r.id },
                { registration: { id: r.id } }
              ]
            },
            orderBy: [
              { isCaptain: 'desc' },
              { createdAt: 'asc' }
            ]
          });
          if (members && members.length > 0) {
            members = members.map((m) => ({
              ...m,
              isCaptain: (m.isCaptain === true || m.isCaptain === 1 || m.isCaptain === 'true' || m.isCaptain === '1')
            }));
          }
        } catch (e) { }

        const player1 = members[0] ? {
          name: members[0].fullName || r.studentName,
          roll: members[0].rollNo || r.enrollmentNo,
          college: r.college,
          year: members[0].yearSemester || r.department,
          phone: members[0].mobile || r.phone,
          email: members[0].email || r.email,
          gender: members[0].gender || r.gender
        } : {
          name: r.studentName,
          roll: r.enrollmentNo,
          college: r.college,
          year: r.department,
          phone: r.phone,
          email: r.email,
          gender: r.gender
        };

        const player2 = members[1] ? {
          name: members[1].fullName,
          roll: members[1].rollNo,
          college: r.college,
          year: members[1].yearSemester || r.department,
          phone: members[1].mobile,
          email: members[1].email,
          gender: members[1].gender
        } : null;

        const isDoubles = !!player2 || (r.sportId && r.sportId.toLowerCase().includes('doubles')) || (r.teamName && r.teamName.trim().length > 0);

        return {
          id: r.id,
          receiptId: r.id,
          eventId: r.eventId,
          sportId: r.sportId,
          category: isDoubles ? 'DOUBLES' : 'SINGLES',
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
          feePaid: Number(r.feePaid || 0),
          paymentId: r.paymentId,
          paymentStatus: r.paymentStatus,
          createdAt: r.createdAt,
          registeredDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          player1,
          player2,
          members: members || []
        };
      })
    );

    return res.json(detailedRegistrations);
  } catch (err) {
    console.error('Error fetching coordinator registrations:', err);
    return res.status(500).json({ message: 'Error loading registrations from database' });
  }
};

export const deleteRegistration = async (req, res) => {
  const sportId = (req.user?.assignedSport || '').toLowerCase();
  const cleanSportId = sportId.replace(/_/g, '-');
  const baseSportId = cleanSportId.split('-')[0].split('_')[0];
  const { id } = req.params;

  try {
    // Verify that the registration actually belongs to this coordinator's assigned sport
    const checkSql = `SELECT id, sport_id FROM college_registrations 
      WHERE (id::text = $1 OR registration_id::text = $1)
        AND (LOWER(sport_id) LIKE $2 OR LOWER(sport_id) LIKE $3 OR LOWER(sport_id) LIKE $4)`;
    const checkRes = await queryDb(checkSql, [String(id), `%${sportId}%`, `%${cleanSportId}%`, `%${baseSportId}%`]);

    if (!checkRes || checkRes.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied. You cannot delete registrations for other sports.' });
    }

    await queryDb('DELETE FROM registration_members WHERE "registrationId"::text = $1 OR id::text = $1', [String(id)]);
    await queryDb(
      'DELETE FROM college_registrations WHERE id::text = $1 OR registration_id::text = $1',
      [String(id)]
    );
    if (isUuid(id)) {
      try {
        await queryDb('DELETE FROM registrations WHERE id = $1::uuid', [id]);
      } catch (e) {}
    }

    try {
      await prisma.collegeRegistration.deleteMany({ where: { id } });
    } catch (e) {}

    return res.json({ success: true, message: 'Registration deleted successfully from database' });
  } catch (err) {
    console.error('Error deleting registration from DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete registration from database' });
  }
};


export const toggleRegistrationStatus = (req, res) => {
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
};

export const getEvents = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const normalizedSportId = sportId.replace(/_/g, '-');
  const underscoreSportId = sportId.replace(/-/g, '_');

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
        registration_open AS "registrationOpen", rules, required_documents AS "requiredDocuments",
        contact_info AS "contactInfo", created_by AS "createdBy",
        created_at AS "createdAt", updated_at AS "updatedAt"
       FROM coordinator_event_items
       WHERE LOWER(sport_id) IN ($1, $2, $3)
       ORDER BY created_at DESC`,
      [sportId, normalizedSportId, underscoreSportId]
    );

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      const parsedEvents = dbRes.rows.map((row) => {
        let contact = row.contactInfo;
        if (typeof contact === 'string') {
          try { contact = JSON.parse(contact); } catch (e) {}
        }
        let rulesObj = row.rules;
        if (typeof rulesObj === 'string') {
          try { rulesObj = JSON.parse(rulesObj); } catch (e) {}
        }
        let reqDocs = row.requiredDocuments;
        if (typeof reqDocs === 'string') {
          try { reqDocs = JSON.parse(reqDocs); } catch (e) {}
        }

        const isRegOpen = row.registrationOpen !== false && row.registrationOpen !== 'false' && row.registrationOpen !== 0;
        const regStatus = computeEffectiveRegistrationStatus({
          ...row,
          registrationOpen: isRegOpen
        });

        // Optional non-blocking idempotent DB flag sync when deadline passed
        if (isRegOpen && regStatus.isDeadlinePassed) {
          queryDb(
            'UPDATE coordinator_event_items SET registration_open = false WHERE id = $1 AND registration_open = true',
            [row.id]
          ).catch(() => {});
        }

        return {
          id: row.id,
          sportId: row.sportId,
          sportName: row.sportName,
          title: row.title,
          coverImage: row.coverImage,
          description: row.description,
          regStartDate: row.regStartDate,
          regEndDate: row.regEndDate,
          tournStartDate: row.tournStartDate,
          tournEndDate: row.tournEndDate,
          entryFee: Number(row.entryFee || 0),
          teamFee: Number(row.entryFee || 0),
          singlesFee: Number(row.singlesFee || 0),
          doublesFee: Number(row.doublesFee || 0),
          teamSize: row.teamSize,
          maxRegistrations: Number(row.maxRegistrations || 64),
          registeredCount: Number(row.registeredCount || 0),
          venue: row.venue,
          category: row.category,
          status: row.status,
          registrationOpen: isRegOpen,
          effectiveStatus: regStatus.code,
          effectiveStatusLabel: regStatus.label,
          effectiveRegistrationOpen: regStatus.effectiveRegistrationOpen,
          effectiveRegistrationClosed: regStatus.effectiveRegistrationClosed,
          isDeadlinePassed: regStatus.isDeadlinePassed,
          canReopen: regStatus.canReopen,
          canScheduleFixtures: regStatus.canScheduleFixtures,
          closureReason: regStatus.reason,
          rules: rulesObj || [],
          requiredDocuments: reqDocs || [],
          contactInfo: contact,
          createdBy: row.createdBy
        };
      });

      inMemoryCoordinatorEvents[sportId] = parsedEvents;
      return res.json(parsedEvents);
    }
  } catch (err) {
    console.error('Error fetching coordinator events from DB:', err.message);
  }

  const eventsMap = new Map();
  [sportId, normalizedSportId, underscoreSportId].forEach((k) => {
    const list = inMemoryCoordinatorEvents[k] || [];
    list.forEach((e) => {
      if (e && e.id) eventsMap.set(e.id, e);
    });
  });

  return res.json(Array.from(eventsMap.values()));
};

export const createEvent = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const eventId = req.body.id || `EVT-${sportId.toUpperCase()}-${Date.now()}`;

  const title = req.body.title || req.body.eventName || `${req.user.sportName} Championship 2026`;
  const coverImage = req.body.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80';
  const description = req.body.description || '';
  const regStartDate = req.body.regStartDate || new Date().toISOString().split('T')[0];
  const regEndDate = req.body.regEndDate || '2026-08-30';
  const tournStartDate = req.body.tournStartDate || '2026-09-01';
  const tournEndDate = req.body.tournEndDate || '2026-09-05';
  const entryFee = Number(req.body.entryFee !== undefined ? req.body.entryFee : (req.body.teamFee !== undefined ? req.body.teamFee : 0));
  const singlesFee = req.body.singlesFee !== undefined ? Number(req.body.singlesFee) : Number(entryFee || 300);
  const doublesFee = req.body.doublesFee !== undefined ? Number(req.body.doublesFee) : (req.body.singlesFee !== undefined ? Number(req.body.singlesFee) * 2 : 600);
  const teamSize = req.body.teamSize || '1 Player';
  const maxRegistrations = Number(req.body.maxRegistrations || 64);
  const registeredCount = Number(req.body.registeredCount || 0);
  const venue = req.body.venue || 'Central Sports Arena';
  const category = req.body.category || 'Open';
  const status = req.body.status || 'Draft';
  const registrationOpen = req.body.registrationOpen !== undefined ? Boolean(req.body.registrationOpen) : true;
  const rules = req.body.rules || [];
  const requiredDocuments = req.body.requiredDocuments || ['College ID Card', 'Student Aadhaar/Govt ID'];
  const contactInfo = req.body.contactInfo || {
    name: req.user.coordinatorName,
    email: req.user.email || `${sportId}.coord@sems.edu`,
    phone: '+91 98765 43210'
  };

  const newEvent = {
    id: eventId,
    sportId,
    sportName: req.user.sportName,
    title,
    coverImage,
    description,
    regStartDate,
    regEndDate,
    tournStartDate,
    tournEndDate,
    entryFee,
    singlesFee,
    doublesFee,
    teamSize,
    maxRegistrations,
    registeredCount,
    venue,
    category,
    status,
    registrationOpen,
    rules,
    requiredDocuments,
    contactInfo,
    createdBy: req.user.username || req.user.coordinatorName
  };

  if (!inMemoryCoordinatorEvents[sportId]) {
    inMemoryCoordinatorEvents[sportId] = [];
  }
  inMemoryCoordinatorEvents[sportId].unshift(newEvent);

  try {
    await queryDb(
      `INSERT INTO coordinator_event_items (
        id, sport_id, sport_name, title, cover_image, description,
        reg_start_date, reg_end_date, tourn_start_date, tourn_end_date,
        entry_fee, singles_fee, doubles_fee, team_size, max_registrations,
        registered_count, venue, category, status, registration_open, rules, required_documents,
        contact_info, created_by, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        sport_id = EXCLUDED.sport_id,
        sport_name = COALESCE(EXCLUDED.sport_name, coordinator_event_items.sport_name),
        title = EXCLUDED.title,
        cover_image = EXCLUDED.cover_image,
        description = EXCLUDED.description,
        reg_start_date = EXCLUDED.reg_start_date,
        reg_end_date = EXCLUDED.reg_end_date,
        tourn_start_date = EXCLUDED.tourn_start_date,
        tourn_end_date = EXCLUDED.tourn_end_date,
        entry_fee = EXCLUDED.entry_fee,
        singles_fee = EXCLUDED.singles_fee,
        doubles_fee = EXCLUDED.doubles_fee,
        team_size = EXCLUDED.team_size,
        max_registrations = EXCLUDED.max_registrations,
        registered_count = EXCLUDED.registered_count,
        venue = EXCLUDED.venue,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        registration_open = EXCLUDED.registration_open,
        rules = EXCLUDED.rules,
        required_documents = EXCLUDED.required_documents,
        contact_info = EXCLUDED.contact_info,
        updated_at = CURRENT_TIMESTAMP`,
      [
        eventId, sportId, req.user.sportName, title, coverImage, description,
        regStartDate, regEndDate, tournStartDate, tournEndDate,
        entryFee, singlesFee, doublesFee, teamSize, maxRegistrations,
        registeredCount, venue, category, status, registrationOpen, JSON.stringify(rules), JSON.stringify(requiredDocuments),
        JSON.stringify(contactInfo), req.user.username || req.user.coordinatorName
      ]
    );
  } catch (err) {
    console.error('Error persisting coordinator event via queryDb:', err.message);
  }

  try {
    const dbEvent = await prisma.coordinatorEventItem.upsert({
      where: { id: eventId },
      update: newEvent,
      create: newEvent
    });
    logAuditEvent({
      actorName: req.user?.coordinatorName || req.user?.username || 'Sport Coordinator',
      role: 'SPORTS_COORDINATOR',
      action: 'Event Created',
      entity: `Created ${sportId} event: ${title} (ID: ${eventId})`,
      details: { eventId, sportId, title, status, registrationOpen },
      entityId: eventId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });
    return res.status(201).json({ success: true, event: dbEvent });
  } catch (err) {
    console.error('Prisma upsert fallback error:', err.message);
  }

  logAuditEvent({
    actorName: req.user?.coordinatorName || req.user?.username || 'Sport Coordinator',
    role: 'SPORTS_COORDINATOR',
    action: 'Event Created',
    entity: `Created ${sportId} event: ${title} (ID: ${eventId})`,
    details: { eventId, sportId, title, status, registrationOpen },
    entityId: eventId,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
  });

  return res.status(201).json({ success: true, event: newEvent });
};

export const updateEvent = async (req, res) => {
  const sportId = (req.user?.assignedSport || '').toLowerCase();
  const { id } = req.params;

  if (!sportId) {
    return res.status(403).json({ message: 'Sport coordinator authorization missing.' });
  }
  // Ensure coordinator can only update events belonging to their assigned sport
  let existingDbRow = null;
  try {
    const existingDb = await queryDb('SELECT * FROM coordinator_event_items WHERE id = $1', [id]);
    if (existingDb && existingDb.rows.length > 0) {
      existingDbRow = existingDb.rows[0];
      if (existingDbRow.sport_id && existingDbRow.sport_id.toLowerCase() !== sportId) {
        return res.status(403).json({ message: 'Access denied. You cannot modify events belonging to another sport.' });
      }
    }
  } catch (e) {}

  const list = inMemoryCoordinatorEvents[sportId] || [];
  const index = list.findIndex((e) => e.id === id);
  const existing = {
    ...(existingDbRow ? {
      id: existingDbRow.id,
      sportId: existingDbRow.sport_id,
      sportName: existingDbRow.sport_name,
      title: existingDbRow.title,
      coverImage: existingDbRow.cover_image,
      description: existingDbRow.description,
      regStartDate: existingDbRow.reg_start_date,
      regEndDate: existingDbRow.reg_end_date,
      tournStartDate: existingDbRow.tourn_start_date,
      tournEndDate: existingDbRow.tourn_end_date,
      entryFee: Number(existingDbRow.entry_fee || 0),
      singlesFee: Number(existingDbRow.singles_fee || existingDbRow.entry_fee || 0),
      doublesFee: Number(existingDbRow.doubles_fee || (existingDbRow.entry_fee ? existingDbRow.entry_fee * 2 : 0)),
      teamSize: existingDbRow.team_size,
      maxRegistrations: Number(existingDbRow.max_registrations || 64),
      registeredCount: Number(existingDbRow.registered_count || 0),
      venue: existingDbRow.venue,
      category: existingDbRow.category,
      status: existingDbRow.status,
      registrationOpen: existingDbRow.registration_open !== false,
      rules: existingDbRow.rules,
      requiredDocuments: existingDbRow.required_documents,
      contactInfo: existingDbRow.contact_info,
      createdBy: existingDbRow.created_by
    } : {}),
    ...(index !== -1 ? list[index] : {})
  };

  const title = req.body.title || req.body.eventName || existing.title || `${req.user.sportName} Event`;
  const coverImage = req.body.coverImage || existing.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80';
  const description = req.body.description !== undefined ? req.body.description : (existing.description || '');
  const regStartDate = req.body.regStartDate || existing.regStartDate || new Date().toISOString().split('T')[0];
  const regEndDate = req.body.regEndDate || existing.regEndDate || '2026-08-30';
  const tournStartDate = req.body.tournStartDate || existing.tournStartDate || '2026-09-01';
  const tournEndDate = req.body.tournEndDate || existing.tournEndDate || '2026-09-05';
  const entryFee = Number(req.body.entryFee !== undefined ? req.body.entryFee : (req.body.teamFee !== undefined ? req.body.teamFee : (existing.entryFee || 0)));
  const singlesFee = Number(req.body.singlesFee !== undefined ? req.body.singlesFee : (existing.singlesFee || entryFee));
  const doublesFee = Number(req.body.doublesFee !== undefined ? req.body.doublesFee : (existing.doublesFee || entryFee * 2));
  const teamSize = req.body.teamSize || existing.teamSize || '1 Player';
  const maxRegistrations = Number(req.body.maxRegistrations !== undefined ? req.body.maxRegistrations : (existing.maxRegistrations || 64));
  const registeredCount = Number(req.body.registeredCount !== undefined ? req.body.registeredCount : (existing.registeredCount || 0));
  const venue = req.body.venue || existing.venue || 'Main Venue';
  const category = req.body.category || existing.category || 'Open';
  let status = req.body.status !== undefined ? req.body.status : (existing.status || 'Draft');

  // Only auto-reopen if regEndDate was specifically modified in this payload and status was not explicitly specified
  if (req.body.regEndDate && req.body.status === undefined && existing.status === 'Closed' && registeredCount < maxRegistrations) {
    const parsedEnd = Date.parse(`${regEndDate}T23:59:59.999+05:30`);
    if (!isNaN(parsedEnd) && parsedEnd >= Date.now()) {
      status = 'Published';
    }
  }

  if (registeredCount >= maxRegistrations && req.body.status === undefined) {
    status = 'Closed';
  }
  let registrationOpen = req.body.registrationOpen !== undefined ? Boolean(req.body.registrationOpen) : (status !== 'Closed' && status !== 'Draft' && status !== 'Completed');
  const rules = req.body.rules || existing.rules || [];
  const requiredDocuments = req.body.requiredDocuments || existing.requiredDocuments || ['College ID Card', 'Student Aadhaar/Govt ID'];
  const contactInfo = req.body.contactInfo || existing.contactInfo || {
    name: req.user.coordinatorName,
    email: req.user.email || `${sportId}.coord@sems.edu`,
    phone: '+91 98765 43210'
  };

  const cleanEvent = {
    id,
    sportId,
    sportName: req.user.sportName,
    title,
    coverImage,
    description,
    regStartDate,
    regEndDate,
    tournStartDate,
    tournEndDate,
    entryFee,
    singlesFee,
    doublesFee,
    teamSize,
    maxRegistrations,
    registeredCount,
    venue,
    category,
    status,
    registrationOpen,
    rules,
    requiredDocuments,
    contactInfo,
    createdBy: req.user.username || req.user.coordinatorName,
    updatedAt: new Date().toISOString()
  };

  // If explicitly attempting to open/reopen registration, check if deadline has passed
  if (req.body.registrationOpen === true && cleanEvent.registrationOpen === true) {
    const checkStatus = computeEffectiveRegistrationStatus(cleanEvent);
    if (checkStatus.isDeadlinePassed) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed. Extend the registration end date before reopening registration.',
        code: 'CLOSED_DEADLINE_PASSED',
        effectiveStatus: checkStatus
      });
    }
  }

  if (index !== -1) {
    list[index] = cleanEvent;
  } else {
    list.push(cleanEvent);
  }
  inMemoryCoordinatorEvents[sportId] = list;

  try {
    await queryDb(
      `INSERT INTO coordinator_event_items (
        id, sport_id, sport_name, title, cover_image, description,
        reg_start_date, reg_end_date, tourn_start_date, tourn_end_date,
        entry_fee, singles_fee, doubles_fee, team_size, max_registrations,
        registered_count, venue, category, status, registration_open, rules, required_documents,
        contact_info, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        cover_image = EXCLUDED.cover_image,
        description = EXCLUDED.description,
        reg_start_date = EXCLUDED.reg_start_date,
        reg_end_date = EXCLUDED.reg_end_date,
        tourn_start_date = EXCLUDED.tourn_start_date,
        tourn_end_date = EXCLUDED.tourn_end_date,
        entry_fee = EXCLUDED.entry_fee,
        singles_fee = EXCLUDED.singles_fee,
        doubles_fee = EXCLUDED.doubles_fee,
        team_size = EXCLUDED.team_size,
        max_registrations = EXCLUDED.max_registrations,
        registered_count = EXCLUDED.registered_count,
        venue = EXCLUDED.venue,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        registration_open = EXCLUDED.registration_open,
        rules = EXCLUDED.rules,
        required_documents = EXCLUDED.required_documents,
        contact_info = EXCLUDED.contact_info,
        updated_at = CURRENT_TIMESTAMP`,
      [
        id, sportId, req.user.sportName, title, coverImage, description,
        regStartDate, regEndDate, tournStartDate, tournEndDate,
        entryFee, singlesFee, doublesFee, teamSize, maxRegistrations,
        registeredCount, venue, category, status, registrationOpen,
        JSON.stringify(rules), JSON.stringify(requiredDocuments),
        JSON.stringify(contactInfo)
      ]
    );
  } catch (err) {
    console.error('Direct SQL event upsert error:', err.message);
  }

  logAuditEvent({
    actorName: req.user?.coordinatorName || req.user?.username || 'Sport Coordinator',
    role: 'SPORTS_COORDINATOR',
    action: 'Event Updated',
    entity: `Updated ${sportId} event: ${title} (ID: ${id}) - Status: ${status}, RegOpen: ${registrationOpen}`,
    details: { eventId: id, sportId, title, status, registrationOpen },
    entityId: id,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
  });

  try {
    const updated = await prisma.coordinatorEventItem.update({
      where: { id },
      data: cleanEvent
    });
    const regStatus = computeEffectiveRegistrationStatus(updated);
    return res.json({ 
      success: true, 
      event: {
        ...updated,
        effectiveStatus: regStatus.code,
        effectiveStatusLabel: regStatus.label,
        effectiveRegistrationOpen: regStatus.effectiveRegistrationOpen,
        effectiveRegistrationClosed: regStatus.effectiveRegistrationClosed,
        isDeadlinePassed: regStatus.isDeadlinePassed,
        canReopen: regStatus.canReopen,
        canScheduleFixtures: regStatus.canScheduleFixtures,
        closureReason: regStatus.reason
      }
    });
  } catch (err) {
    console.error('Prisma update error fallback:', err.message);
  }

  const fallbackStatus = computeEffectiveRegistrationStatus(cleanEvent);
  return res.json({ 
    success: true, 
    event: {
      ...cleanEvent,
      effectiveStatus: fallbackStatus.code,
      effectiveStatusLabel: fallbackStatus.label,
      effectiveRegistrationOpen: fallbackStatus.effectiveRegistrationOpen,
      effectiveRegistrationClosed: fallbackStatus.effectiveRegistrationClosed,
      isDeadlinePassed: fallbackStatus.isDeadlinePassed,
      canReopen: fallbackStatus.canReopen,
      canScheduleFixtures: fallbackStatus.canScheduleFixtures,
      closureReason: fallbackStatus.reason
    }
  });
};

export const deleteEvent = async (req, res) => {
  const sportId = (req.user?.assignedSport || '').toLowerCase();
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  Object.keys(inMemoryCoordinatorEvents).forEach((sKey) => {
    if (inMemoryCoordinatorEvents[sKey]) {
      inMemoryCoordinatorEvents[sKey] = inMemoryCoordinatorEvents[sKey].filter((e) => e && e.id !== id);
    }
  });

  try {
    const dbRes = await queryDb(
      'DELETE FROM coordinator_event_items WHERE id = $1 AND LOWER(sport_id) = $2 RETURNING id',
      [id, sportId]
    );
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      logAuditEvent({
        actorName: req.user?.coordinatorName || req.user?.username || 'Sport Coordinator',
        role: 'SPORTS_COORDINATOR',
        action: 'Event Deleted',
        entity: `Deleted ${sportId} event: ${id}`,
        entityId: id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({ success: true, message: 'Event deleted successfully' });
    }

    const prismaRes = await prisma.coordinatorEventItem.deleteMany({
      where: { id, sportId: { equals: sportId, mode: 'insensitive' } }
    }).catch(() => ({ count: 0 }));
    if (prismaRes.count > 0) {
      logAuditEvent({
        actorName: req.user?.coordinatorName || req.user?.username || 'Sport Coordinator',
        role: 'SPORTS_COORDINATOR',
        action: 'Event Deleted',
        entity: `Deleted ${sportId} event: ${id}`,
        entityId: id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({ success: true, message: 'Event deleted successfully' });
    }

    return res.status(404).json({ message: 'Event not found or unauthorized for this sport.' });
  } catch (err) {
    console.error('Error deleting event from SQL DB:', err.message);
    return res.status(500).json({ message: 'Error deleting event from database' });
  }
};

export const normalizeParticipationType = (record, explicitSportId = null) => {
  if (!record) return 'INDIVIDUAL';

  // 1. Explicit participationType or registrationType
  const rawType = String(
    record.participationType ||
    record.registrationType ||
    record.registration_type ||
    record.category ||
    record.eventType ||
    record.participantData?.participationType ||
    record.participantData?.registrationType ||
    record.participantData?.eventType ||
    record.participantData?.category ||
    ''
  ).trim().toUpperCase();

  if (rawType === 'DUO' || rawType === 'DOUBLES' || rawType === 'PAIR') {
    return 'DUO';
  }
  if (rawType === 'INDIVIDUAL' || rawType === 'SINGLES' || rawType === 'SOLO') {
    return 'INDIVIDUAL';
  }
  if (rawType === 'TEAM' || rawType === 'SQUAD' || rawType === 'GROUP') {
    return 'TEAM';
  }

  // 2. Sport-Specific Classification
  const sportKey = String(
    explicitSportId ||
    record.sportId ||
    record.sport_id ||
    record.sport ||
    record.sportName ||
    ''
  ).toLowerCase().trim();

  // Team-only sports:
  const teamSports = ['volleyball', 'basketball', 'football', 'cricket', 'gully-cricket', 'gully_cricket', 'kabaddi', 'kho-kho', 'kho_kho', 'tug-of-war', 'tug_of_war'];
  if (teamSports.some((ts) => sportKey.includes(ts))) {
    return 'TEAM';
  }

  // Individual-only sports:
  if (sportKey.includes('chess')) {
    return 'INDIVIDUAL';
  }

  // Athletics: individual unless explicitly a relay/team event
  if (sportKey.includes('athletics')) {
    const subEvent = String(
      record.selectedEvent ||
      record.subEvent ||
      record.event ||
      record.participantData?.selectedEvent ||
      record.participantData?.subEvent ||
      ''
    ).toLowerCase();
    if (subEvent.includes('relay')) {
      return 'TEAM';
    }
    return 'INDIVIDUAL';
  }

  // Racket sports (Badminton, Table Tennis):
  if (sportKey.includes('badminton') || sportKey.includes('table-tennis') || sportKey.includes('table_tennis')) {
    const eventType = String(
      record.eventType ||
      record.participantData?.eventType ||
      record.category ||
      record.participantData?.category ||
      ''
    ).toLowerCase();
    if (eventType.includes('double') || eventType.includes('duo') || eventType.includes('pair')) {
      return 'DUO';
    }
    if (eventType.includes('single') || eventType.includes('solo') || eventType.includes('individual')) {
      return 'INDIVIDUAL';
    }
    // Check if player2 structure is present
    if (record.player2 || (record.player1 && record.player2)) {
      return 'DUO';
    }
    const teamName = String(record.teamName || record.team_name || '').toLowerCase();
    if (teamName.includes('duo') || teamName.includes('pair') || teamName.includes('doubles')) {
      return 'DUO';
    }
    // Roster count check as last resort for racket sports
    const roster = Array.isArray(record.members) ? record.members
      : Array.isArray(record.roster) ? record.roster
      : Array.isArray(record.participantData?.roster) ? record.participantData.roster
      : null;
    const mCount = roster ? roster.length : Number(record.membersCount || record.members_count || 0);
    if (mCount === 2) {
      return 'DUO';
    }
    if (mCount > 2) {
      return 'TEAM';
    }
    return 'INDIVIDUAL';
  }

  // Last-resort fallback:
  const roster = Array.isArray(record.members) ? record.members
    : Array.isArray(record.roster) ? record.roster
    : Array.isArray(record.participantData?.roster) ? record.participantData.roster
    : null;
  const mCount = roster ? roster.length : Number(record.membersCount || record.members_count || 0);
  if (mCount > 2) return 'TEAM';
  if (mCount === 2) return 'DUO';
  return 'INDIVIDUAL';
};

// ── Eligible Competitors for Match Scheduling ─────────────────────────────────
export const getEligibleCompetitors = async (req, res) => {
  const sportId = (req.user?.assignedSport || req.query.sportId || '').toLowerCase();
  const eventId = req.params.eventId || req.query.eventId;

  if (!eventId) {
    return res.status(400).json({ success: false, message: 'Event ID is required.' });
  }

  try {
    // 1. Authoritative Event Verification
    const evRes = await queryDb(
      `SELECT id, sport_id AS "sportId", title, status, registration_open AS "registrationOpen", reg_start_date AS "regStartDate", reg_end_date AS "regEndDate"
       FROM coordinator_event_items WHERE id = $1`,
      [eventId]
    );
    if (!evRes || evRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found in coordinator events.' });
    }
    const event = evRes.rows[0];
    const regStatus = computeEffectiveRegistrationStatus(event);

    // 2. Fetch registrations for this event & sport
    const normalizedSport = sportId.replace(/_/g, '-');
    const underscoreSport = sportId.replace(/-/g, '_');

    let rows = [];

    const regSql = `
      SELECT 
        cr.id, cr.registration_id AS "registrationId", cr.event_id AS "eventId",
        cr.sport_id AS "sportId", cr.student_name AS "studentName", cr.team_name AS "teamName",
        cr.college, cr.department, cr.gender, cr.status, cr.participant_data AS "participantData",
        cr.members_count AS "membersCount",
        COALESCE(
          json_agg(
            json_build_object(
              'id', rm.id,
              'name', rm."fullName",
              'rollNo', COALESCE(rm."rollNo", 'N/A'),
              'mobile', rm.mobile,
              'email', rm.email,
              'course', rm.course,
              'yearSemester', rm.year_semester,
              'gender', rm.gender,
              'isCaptain', rm."isCaptain"
            )
          ) FILTER (WHERE rm.id IS NOT NULL), '[]'
        ) AS members
      FROM college_registrations cr
      LEFT JOIN registration_members rm ON rm."registrationId"::text = cr.registration_id::text OR rm."registrationId"::text = cr.id::text
      WHERE (
        cr.event_id = $1 
        OR cr.event_id = 'DEFAULT' 
        OR cr.event_id = '' 
        OR cr.event_id IS NULL
        OR LOWER(TRIM(cr.event_id)) = LOWER(TRIM($2))
        OR LOWER(TRIM(cr.event_id)) = LOWER(TRIM($3))
        OR LOWER(TRIM(cr.event_id)) = LOWER(TRIM($4))
        OR ($1 = 'DEFAULT' AND LOWER(cr.sport_id) IN ($2, $3, $4))
      )
        AND LOWER(cr.sport_id) IN ($2, $3, $4)
        AND (cr.status IS NULL OR LOWER(TRIM(cr.status)) NOT IN ('rejected', 'cancelled', 'pending_payment'))
      GROUP BY cr.id, cr.registration_id, cr.event_id, cr.sport_id, cr.student_name, cr.team_name, cr.college, cr.department, cr.gender, cr.status, cr.participant_data, cr.members_count
      ORDER BY cr.created_at ASC
    `;

    try {
      const regRes = await queryDb(regSql, [eventId, sportId, normalizedSport, underscoreSport]);
      if (regRes && Array.isArray(regRes.rows)) {
        rows = regRes.rows;
      }
    } catch (sqlErr) {
      console.warn('getEligibleCompetitors SQL warning, falling back to Prisma:', sqlErr?.message);
    }

    if (rows.length === 0) {
      try {
        const pRows = await prisma.collegeRegistration.findMany({
          where: {
            OR: [
              { eventId: eventId },
              { eventId: 'DEFAULT' },
              { eventId: { in: [sportId, normalizedSport, underscoreSport], mode: 'insensitive' } }
            ],
            sportId: { in: [sportId, normalizedSport, underscoreSport], mode: 'insensitive' },
            status: { notIn: ['rejected', 'cancelled', 'REJECTED', 'CANCELLED', 'pending_payment'] }
          },
          orderBy: { createdAt: 'asc' }
        });
        if (pRows && pRows.length > 0) {
          rows = pRows;
        }
      } catch (pErr) {
        console.warn('Prisma fallback error:', pErr?.message);
      }
    }

    const requestedFormat = String(req.query.format || req.query.participationType || '').trim().toUpperCase();
    const isRacketSport = sportId.includes('badminton') || sportId.includes('table-tennis') || sportId.includes('table_tennis');
    const isTeamOnlySport = ['volleyball', 'basketball', 'football', 'cricket', 'gully-cricket', 'gully_cricket', 'kabaddi', 'kho-kho', 'kho_kho', 'tug-of-war', 'tug_of_war'].some((ts) => sportId.includes(ts));
    const isIndividualOnlySport = sportId.includes('chess');

    const singles = [];
    const doubles = [];
    const teamSquads = [];

    rows.forEach((row) => {
      let members = row.members;
      if (typeof members === 'string') {
        try { members = JSON.parse(members); } catch (e) { members = []; }
      }
      if (!Array.isArray(members) || members.length === 0) {
        if (row.participantData && Array.isArray(row.participantData.roster)) {
          members = row.participantData.roster.map((m, idx) => ({
            id: `mem-${row.id}-${idx}`,
            name: m.name || m.fullName || `Player ${idx + 1}`,
            rollNo: m.rollNo || 'N/A',
            mobile: m.phone || m.mobile || 'N/A',
            course: m.course || row.department || 'N/A',
            isCaptain: m.isCaptain || (idx === 0)
          }));
        } else {
          members = [{
            id: `mem-${row.id}-0`,
            name: row.studentName || 'Athlete',
            rollNo: row.department || 'N/A',
            mobile: row.phone || '',
            course: row.department || 'N/A',
            isCaptain: true
          }];
        }
      }

      const participationType = normalizeParticipationType(row, sportId);

      if (participationType === 'INDIVIDUAL') {
        const pName = members[0]?.name || row.studentName || 'Athlete';
        const pCourse = members[0]?.course || row.department || 'Student';
        const pRole = members[0]?.isCaptain ? ' • Captain' : '';
        const athleteObj = {
          id: members[0]?.id || row.id,
          registrationId: row.registrationId || row.id,
          teamName: null,
          name: pName,
          displayName: `${pName} (${row.college} • ${pCourse}${pRole})`,
          rollNo: members[0]?.rollNo || 'N/A',
          mobile: members[0]?.mobile || '',
          college: row.college,
          course: pCourse,
          isCaptain: !!members[0]?.isCaptain,
          gender: members[0]?.gender || row.gender,
          participationType: 'INDIVIDUAL'
        };
        singles.push(athleteObj);
      } else if (participationType === 'DUO') {
        const pairNames = members.length >= 2 ? `${members[0].name} & ${members[1].name}` : (row.teamName || row.studentName);
        const duoDisplayName = row.teamName
          ? `${row.teamName} (${pairNames} • ${row.college})`
          : `${pairNames} (${row.college})`;

        const duoObj = {
          id: row.id,
          registrationId: row.registrationId || row.id,
          teamName: row.teamName || pairNames,
          displayName: duoDisplayName,
          college: row.college,
          department: row.department,
          gender: row.gender,
          membersCount: members.length,
          members: members,
          participationType: 'DUO'
        };
        doubles.push(duoObj);
      } else if (participationType === 'TEAM') {
        const teamDisplayName = row.teamName ? `${row.teamName} (${row.college})` : `${row.studentName} (${row.college})`;
        const teamObj = {
          id: row.id,
          registrationId: row.registrationId || row.id,
          teamName: row.teamName || row.studentName,
          displayName: teamDisplayName,
          college: row.college,
          department: row.department,
          gender: row.gender,
          membersCount: members.length,
          members: members,
          participationType: 'TEAM'
        };
        teamSquads.push(teamObj);
      }
    });

    let finalTeams = [];
    let finalParticipants = [];

    if (isTeamOnlySport) {
      finalTeams = teamSquads;
      finalParticipants = teamSquads.flatMap((t) => (t.members || []).map((m) => ({
        id: m.id,
        teamId: t.id,
        teamName: t.teamName,
        name: m.name,
        displayName: `${m.name} (${t.college} • ${m.course || 'Player'})`,
        rollNo: m.rollNo,
        mobile: m.mobile,
        college: t.college,
        course: m.course,
        isCaptain: !!m.isCaptain,
        gender: m.gender || t.gender,
        participationType: 'TEAM'
      })));
    } else if (isIndividualOnlySport) {
      finalParticipants = singles;
      finalTeams = [];
    } else if (isRacketSport) {
      if (requestedFormat === 'SINGLES' || requestedFormat === 'INDIVIDUAL') {
        finalParticipants = singles;
        finalTeams = [];
      } else if (requestedFormat === 'DOUBLES' || requestedFormat === 'DUO') {
        finalTeams = doubles;
        finalParticipants = [];
      } else {
        // Default general payload: keep singles in participants, doubles in teams
        finalParticipants = singles;
        finalTeams = doubles;
      }
    } else {
      // Athletics or other sports
      finalParticipants = singles;
      finalTeams = teamSquads;
    }

    return res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
        registrationOpen: event.registrationOpen !== false,
        effectiveStatus: regStatus.code,
        effectiveStatusLabel: regStatus.label,
        effectiveRegistrationOpen: regStatus.effectiveRegistrationOpen,
        effectiveRegistrationClosed: regStatus.effectiveRegistrationClosed,
        isDeadlinePassed: regStatus.isDeadlinePassed,
        canReopen: regStatus.canReopen,
        isSchedulingReady: regStatus.canScheduleFixtures,
        closureReason: regStatus.reason
      },
      teams: finalTeams,
      participants: finalParticipants,
      singles,
      doubles,
      teamSquads
    });
  } catch (err) {
    console.error('Error fetching eligible competitors:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch eligible competitors', error: err.message });
  }
};
