import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig, coordinatorPasswords } from '../config/env.js';
import { queryDb, prisma } from '../config/db.js';

const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

let inMemoryCoordinatorMatches = {};
let inMemoryCoordinatorEvents = {};
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
      const expectedPassword = coordinatorPasswords[userKey];
      isValid = expectedPassword && password === expectedPassword;
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
  const sportId = req.user.assignedSport.toLowerCase();

  try {
    const dbMatches = await prisma.liveMatch.findMany({
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

  const detailsObj = {
    category: m.category || m.gender || 'Open',
    date: m.date || new Date().toISOString().split('T')[0],
    eventTitle: matchTitleVal,
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
     "createdAt",
     "updatedAt"
   )
   VALUES (
     $1, $2, $3, $4, $5, $6, $7, $8, $9,
     $10, $11, $12, $13,
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
    JSON.stringify(detailsObj)
  ]
);
  } catch (err) {
    console.warn('Sync to matches table warning:', err.message);
  }
};

export const createMatch = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const matchId = req.body.id || `M${Math.floor(100000 + Math.random() * 900000)}`;
  const newMatch = {
    id: matchId,
    sportId: sportId,
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
  };

  if (!inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = [];
  }
  inMemoryCoordinatorMatches[sportId].unshift(newMatch);

  // Ensure table columns exist
  try {
    await queryDb(`
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS stream_url TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS is_live_streaming BOOLEAN DEFAULT FALSE;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS details JSONB;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS sets_history TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS current_set INT DEFAULT 1;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS sets_won1 INT DEFAULT 0;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS sets_won2 INT DEFAULT 0;
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
    setsHistory: defaultSetsHistory,
    currentSet: newMatch.currentSet || 1,
    setsWon1: newMatch.setsWon1 || 0,
    setsWon2: newMatch.setsWon2 || 0
  };

  await queryDb(
    `INSERT INTO live_matches (id, sport_id, format, status, team1, team2, match_title, table_number, time, score1, score2, winner, youtube_video_id, stream_url, is_live_streaming, details, sets_history, current_set, sets_won1, sets_won2, updated_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE SET
       format = EXCLUDED.format, status = EXCLUDED.status, team1 = EXCLUDED.team1, team2 = EXCLUDED.team2,
       match_title = EXCLUDED.match_title, table_number = EXCLUDED.table_number, time = EXCLUDED.time,
       score1 = EXCLUDED.score1, score2 = EXCLUDED.score2, winner = EXCLUDED.winner,
       youtube_video_id = COALESCE(EXCLUDED.youtube_video_id, live_matches.youtube_video_id),
       stream_url = COALESCE(EXCLUDED.stream_url, live_matches.stream_url),
       is_live_streaming = COALESCE(EXCLUDED.is_live_streaming, live_matches.is_live_streaming),
       details = EXCLUDED.details,
       sets_history = EXCLUDED.sets_history,
       current_set = EXCLUDED.current_set,
       sets_won1 = EXCLUDED.sets_won1,
       sets_won2 = EXCLUDED.sets_won2,
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
      newMatch.youtubeVideoId || newMatch.youtube_video_id || null,
      newMatch.streamUrl || newMatch.stream_url || null,
      Boolean(newMatch.isLiveStreaming || newMatch.youtubeVideoId || newMatch.streamUrl),
      JSON.stringify(detailsObj),
      JSON.stringify(defaultSetsHistory),
      newMatch.currentSet || 1,
      newMatch.setsWon1 || 0,
      newMatch.setsWon2 || 0
    ]
  );

  await syncMatchToMatchesTable(newMatch);

  return res.status(201).json({ success: true, match: newMatch });
};

export const batchSaveMatches = async (req, res) => {
  const sportId = (req.user?.assignedSport || req.body.sportId || 'badminton').toLowerCase();
  const matches = req.body.matches;

  if (!Array.isArray(matches)) {
    return res.status(400).json({ message: 'matches must be an array' });
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

    const detailsObj = {
      category: m.category || m.gender || 'Open',
      date: m.date || new Date().toISOString().split('T')[0],
      eventTitle: matchTitleVal,
      format: formatVal,
      team1Name: team1Val,
      team2Name: team2Val,
      team1Player1: m.team1Player1 || null,
      team1Player2: m.team1Player2 || null,
      team2Player1: m.team2Player1 || null,
      team2Player2: m.team2Player2 || null,
      ...(m.details && typeof m.details === 'object' ? m.details : {})
    };

    try {
      await queryDb(
        `INSERT INTO live_matches (id, sport_id, format, status, team1, team2, match_title, table_number, time, score1, score2, winner, youtube_video_id, stream_url, is_live_streaming, details, sets_history, current_set, sets_won1, sets_won2, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           sport_id = EXCLUDED.sport_id,
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
          m.youtubeVideoId || m.youtube_video_id || null,
          m.streamUrl || m.stream_url || null,
          Boolean(m.isLiveStreaming || m.youtubeVideoId || m.streamUrl),
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

  return res.json({ success: true, count: savedMatches.length, matches: savedMatches });
};
export const updateMatch = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  const rawStreamUrl =
    req.body.streamUrl ||
    req.body.stream_url ||
    req.body.liveStreamUrl ||
    '';

  let extractedVideoId =
    req.body.youtubeVideoId ||
    req.body.youtube_video_id ||
    '';

  if (!extractedVideoId && rawStreamUrl) {
    const match = rawStreamUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([\w-]{11})/
    );

    if (match && match[1]) {
      extractedVideoId = match[1];
    }
  }

  const payloadWithStream = {
    ...req.body,
    youtubeVideoId:
      extractedVideoId ||
      req.body.youtubeVideoId ||
      null,
    streamUrl:
      rawStreamUrl ||
      req.body.streamUrl ||
      null,
    isLiveStreaming: Boolean(
      req.body.isLiveStreaming ||
      extractedVideoId ||
      rawStreamUrl
    )
  };

  const updatedMatch = {
    id,
    sportId,
    ...payloadWithStream
  };


  // Ensure table columns exist
 

  const rawSetsHistory = req.body.setsHistory || updatedMatch.setsHistory;
  const setsHistoryArr = Array.isArray(rawSetsHistory) 
    ? rawSetsHistory 
    : (typeof rawSetsHistory === 'string' ? JSON.parse(rawSetsHistory) : null);

  const setsHistoryStr = setsHistoryArr ? JSON.stringify(setsHistoryArr) : null;
  const currentSetVal = req.body.currentSet || req.body.currentSetIndex || updatedMatch.currentSet || 1;
  const setsWon1Val = req.body.setsWon1 !== undefined ? Number(req.body.setsWon1) : (updatedMatch.setsWon1 || 0);
  const setsWon2Val = req.body.setsWon2 !== undefined ? Number(req.body.setsWon2) : (updatedMatch.setsWon2 || 0);

  const currentQuarterVal = req.body.quarter || req.body.currentQuarter || updatedMatch.quarter || 'Quarter 1';

  const detailsObj = {
    setsHistory: setsHistoryArr,
    currentSet: currentSetVal,
    setsWon1: setsWon1Val,
    setsWon2: setsWon2Val,
    quarter: currentQuarterVal,
    roster1: req.body.roster1 || updatedMatch.roster1 || null,
    roster2: req.body.roster2 || updatedMatch.roster2 || null,
    playerStats1: req.body.playerStats1 || updatedMatch.playerStats1 || null,
    playerStats2: req.body.playerStats2 || updatedMatch.playerStats2 || null
  };

  // Upsert Basketball Player Stats into basketball_player_stats table in Supabase
  const t1Name = req.body.team1 || updatedMatch.team1 || 'Team 1';
  const t2Name = req.body.team2 || updatedMatch.team2 || 'Team 2';

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
      } catch (err) {
        console.error('Error upserting basketball_player_stats for team 1:', err.message);
      }
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
      } catch (err) {
        console.error('Error upserting basketball_player_stats for team 2:', err.message);
      }
    }
  }

  // Ensure current_quarter column exists on live_matches

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
       details = CASE WHEN EXCLUDED.details IS NOT NULL THEN EXCLUDED.details ELSE live_matches.details END,
       sets_history = CASE WHEN EXCLUDED.sets_history IS NOT NULL AND EXCLUDED.sets_history != '' THEN EXCLUDED.sets_history ELSE live_matches.sets_history END,
       current_set = COALESCE(EXCLUDED.current_set, live_matches.current_set),
       sets_won1 = COALESCE(EXCLUDED.sets_won1, live_matches.sets_won1),
       sets_won2 = COALESCE(EXCLUDED.sets_won2, live_matches.sets_won2),
       current_quarter = COALESCE(EXCLUDED.current_quarter, live_matches.current_quarter),
       updated_at = CURRENT_TIMESTAMP`,
    [
      id,
      sportId,
      (req.body.format || updatedMatch.format || 'SINGLES').toUpperCase(),
      req.body.status || updatedMatch.status || 'SCHEDULED',
      t1Name,
      t2Name,
      req.body.matchTitle || updatedMatch.matchTitle || `${t1Name} vs ${t2Name}`,
      req.body.tableNumber || updatedMatch.tableNumber || 'Table 1',
      req.body.time || updatedMatch.time || '05:30 PM',
      req.body.score1 !== undefined ? Number(req.body.score1) : (updatedMatch.score1 || 0),
      req.body.score2 !== undefined ? Number(req.body.score2) : (updatedMatch.score2 || 0),
      req.body.winner || updatedMatch.winner || null,
      updatedMatch.youtubeVideoId || null,
      updatedMatch.streamUrl || null,
      Boolean(updatedMatch.isLiveStreaming || updatedMatch.youtubeVideoId || updatedMatch.streamUrl),
      JSON.stringify(detailsObj),
      setsHistoryStr,
      currentSetVal,
      setsWon1Val,
      setsWon2Val,
      currentQuarterVal
    ]
  );

  await syncMatchToMatchesTable(updatedMatch);

  return res.json({ success: true, match: { ...updatedMatch, quarter: currentQuarterVal } });
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
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  if (inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = inMemoryCoordinatorMatches[sportId].filter((m) => m.id !== id);
  }

  await queryDb('DELETE FROM live_matches WHERE id = $1', [id]);
  try { await queryDb('DELETE FROM matches WHERE id = $1', [id]); } catch(e){}
  return res.json({ success: true, message: 'Match deleted successfully' });
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
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  let existing = null;
  try {
    const dbRes = await queryDb('SELECT * FROM live_matches WHERE id = $1', [id]);
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      existing = dbRes.rows[0];
    }
  } catch (e) {
    console.warn('updateMatchScore DB select error:', e.message);
  }

  let match = existing ? {
    id: existing.id,
    sportId: existing.sport_id,
    format: existing.format || 'SINGLES',
    status: req.body.status || existing.status || 'running',
    team1: existing.team1,
    team2: existing.team2,
    matchTitle: existing.match_title,
    tableNumber: req.body.venue || req.body.tableNumber || existing.table_number || 'Table 1',
    score1: req.body.score1 !== undefined ? Number(req.body.score1) : Number(existing.score1 || 0),
    score2: req.body.score2 !== undefined ? Number(req.body.score2) : Number(existing.score2 || 0),
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
  };

  if (req.body.team1 !== undefined) match.team1 = req.body.team1;
  if (req.body.team2 !== undefined) match.team2 = req.body.team2;
  if (req.body.matchTitle !== undefined) match.matchTitle = req.body.matchTitle;
  if (req.body.score1 !== undefined) match.score1 = Number(req.body.score1);
  if (req.body.score2 !== undefined) match.score2 = Number(req.body.score2);
  if (req.body.status !== undefined) match.status = req.body.status;
  if (req.body.venue !== undefined) match.tableNumber = req.body.venue;
  if (req.body.tableNumber !== undefined) match.tableNumber = req.body.tableNumber;

  const rawSetsHistory = req.body.setsHistory || match.setsHistory;
  const setsHistoryArr = Array.isArray(rawSetsHistory)
    ? rawSetsHistory
    : (typeof rawSetsHistory === 'string' ? JSON.parse(rawSetsHistory) : [
        { set: 1, score1: match.score1, score2: match.score2, isLocked: false, winner: null },
        { set: 2, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 3, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 4, score1: 0, score2: 0, isLocked: false, winner: null },
        { set: 5, score1: 0, score2: 0, isLocked: false, winner: null }
      ]);

  const currentSetVal = req.body.currentSet || req.body.currentSetIndex || match.currentSet || 1;
  const setsWon1Val = req.body.setsWon1 !== undefined ? Number(req.body.setsWon1) : (match.setsWon1 || 0);
  const setsWon2Val = req.body.setsWon2 !== undefined ? Number(req.body.setsWon2) : (match.setsWon2 || 0);

  const detailsObj = {
    ...(existing?.details && typeof existing.details === 'object' ? existing.details : {}),
    setsHistory: setsHistoryArr,
    currentSet: currentSetVal,
    setsWon1: setsWon1Val,
    setsWon2: setsWon2Val
  };

  try {
    await queryDb(
      `UPDATE live_matches 
       SET score1 = $1, score2 = $2, status = $3, table_number = $4,
           details = $5, sets_history = $6, current_set = $7, sets_won1 = $8, sets_won2 = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10`,
      [
        match.score1,
        match.score2,
        match.status,
        match.tableNumber || 'Table 1',
        JSON.stringify(detailsObj),
        JSON.stringify(setsHistoryArr),
        currentSetVal,
        setsWon1Val,
        setsWon2Val,
        id
      ]
    );
  } catch (e) {
    console.warn('updateMatchScore DB update error:', e.message);
  }

  if (inMemoryCoordinatorMatches[sportId]) {
    const idx = inMemoryCoordinatorMatches[sportId].findIndex(m => m.id === id);
    if (idx >= 0) {
      inMemoryCoordinatorMatches[sportId][idx] = { ...inMemoryCoordinatorMatches[sportId][idx], ...match };
    }
  }

  await syncMatchToMatchesTable(match);

  return res.json({ success: true, match });
};

export const completeMatch = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  try {
    const existingResult = await queryDb(
      `
      SELECT
        id,
        sport_id,
        format,
        status,
        team1,
        team2,
        score1,
        score2,
        winner,
        sets_history,
        current_set,
        sets_won1,
        sets_won2,
        details
      FROM live_matches
      WHERE id = $1
        AND LOWER(sport_id) = $2
      LIMIT 1
      `,
      [id, sportId]
    );

    if (!existingResult || existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Match ${id} not found`,
      });
    }

    const existing = existingResult.rows[0];

    let setsHistory = [];

    if (Array.isArray(req.body.setsHistory)) {
      setsHistory = req.body.setsHistory;
    } else if (
      typeof req.body.setsHistory === 'string' &&
      req.body.setsHistory.trim()
    ) {
      setsHistory = JSON.parse(req.body.setsHistory);
    } else if (Array.isArray(existing.sets_history)) {
      setsHistory = existing.sets_history;
    } else if (
      typeof existing.sets_history === 'string' &&
      existing.sets_history.trim()
    ) {
      setsHistory = JSON.parse(existing.sets_history);
    }

    const score1 = Number(existing.score1 || 0);
    const score2 = Number(existing.score2 || 0);

    const winner =
      req.body.winner ||
      existing.winner ||
      (score1 > score2
        ? existing.team1
        : score2 > score1
          ? existing.team2
          : null);

    if (!winner) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a tied match without a winner',
      });
    }

    const details = {
      ...(existing.details &&
      typeof existing.details === 'object'
        ? existing.details
        : {}),
      setsHistory,
      currentSet: Number(existing.current_set || 1),
      setsWon1: Number(existing.sets_won1 || 0),
      setsWon2: Number(existing.sets_won2 || 0),
    };

    const result = await queryDb(
      `
      UPDATE live_matches
      SET
        status = 'COMPLETED',
        table_number = NULL,
        is_live_streaming = FALSE,
        winner = $1,
        sets_history = $2,
        details = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
        AND LOWER(sport_id) = $5
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
        updated_at AS "updatedAt"
      `,
      [
        winner,
        JSON.stringify(setsHistory),
        JSON.stringify(details),
        id,
        sportId,
      ]
    );

    return res.json({
      success: true,
      match: result.rows[0],
    });
  } catch (err) {
    console.error(
      `Failed to complete match ${id}:`,
      err
    );

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
    const sportId = (req.user.assignedSport || '').toLowerCase();
    const cleanSportId = sportId.replace(/_/g, '-');
    const baseSportId = sportId.split('-')[0].split('_')[0]; // e.g. "badminton"

    // 1. Direct Raw SQL QueryDb from college_registrations
    try {
      const sqlRes = await queryDb(
        `SELECT 
          id, registration_id AS "registrationId", event_id AS "eventId",
          sport_id AS "sportId", student_name AS "studentName", team_name AS "teamName",
          college, department, '' AS "enrollmentNo", email, phone, gender,
          emergency_contact AS "emergencyContact", status, fee_paid AS "feePaid",
          payment_id AS "paymentId", payment_status AS "paymentStatus",
          participant_data AS "participantData",
          created_at AS "createdAt"
         FROM college_registrations
         WHERE LOWER(sport_id) LIKE $1 OR LOWER(sport_id) LIKE $2 OR LOWER(sport_id) LIKE $3
         ORDER BY created_at DESC`,
        [`%${sportId}%`, `%${cleanSportId}%`, `%${baseSportId}%`]
      );

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
            where: { registration: { id: r.id } }
          });
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
  const { id } = req.params;
  try {
    await queryDb('DELETE FROM registration_members WHERE "registrationId"::text = $1 OR id::text = $1', [String(id)]);
    await queryDb(
  'DELETE FROM college_registrations WHERE id::text = $1 OR registration_id::text = $1',
  [String(id)]
);    if (isUuid(id)) {
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
    const dbEvents = await prisma.coordinatorEventItem.findMany({
      where: {
        OR: [
          { sportId: { equals: sportId, mode: 'insensitive' } },
          { sportId: { equals: normalizedSportId, mode: 'insensitive' } },
          { sportId: { equals: underscoreSportId, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    if (dbEvents && dbEvents.length > 0) {
      inMemoryCoordinatorEvents[sportId] = dbEvents;
      return res.json(dbEvents);
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
        registered_count, venue, category, status, rules, required_documents,
        contact_info, created_by, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, CURRENT_TIMESTAMP)
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
        rules = EXCLUDED.rules,
        required_documents = EXCLUDED.required_documents,
        contact_info = EXCLUDED.contact_info,
        updated_at = CURRENT_TIMESTAMP`,
      [
        eventId, sportId, req.user.sportName, title, coverImage, description,
        regStartDate, regEndDate, tournStartDate, tournEndDate,
        entryFee, singlesFee, doublesFee, teamSize, maxRegistrations,
        registeredCount, venue, category, status, JSON.stringify(rules), JSON.stringify(requiredDocuments),
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
    return res.status(201).json({ success: true, event: dbEvent });
  } catch (err) {
    console.error('Prisma upsert fallback error:', err.message);
  }

  return res.status(201).json({ success: true, event: newEvent });
};

export const updateEvent = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;
  const list = inMemoryCoordinatorEvents[sportId] || [];
  const index = list.findIndex((e) => e.id === id);
  const existing = index !== -1 ? list[index] : {};

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
  if (registeredCount >= maxRegistrations) {
    status = 'Closed';
  }
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
    rules,
    requiredDocuments,
    contactInfo,
    createdBy: req.user.username || req.user.coordinatorName
  };

  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...cleanEvent,
      updatedAt: new Date().toISOString()
    };
  } else {
    list.unshift(cleanEvent);
  }
  inMemoryCoordinatorEvents[sportId] = list;

  try {
    const sqlRes = await queryDb(
      `INSERT INTO coordinator_event_items (
        id, sport_id, sport_name, title, cover_image, description,
        reg_start_date, reg_end_date, tourn_start_date, tourn_end_date,
        entry_fee, singles_fee, doubles_fee, team_size, max_registrations,
        registered_count, venue, category, status, rules, required_documents,
        contact_info, created_by, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, CURRENT_TIMESTAMP)
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
        rules = EXCLUDED.rules,
        required_documents = EXCLUDED.required_documents,
        contact_info = EXCLUDED.contact_info,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        id, sportId, req.user.sportName, title, coverImage, description,
        regStartDate, regEndDate, tournStartDate, tournEndDate,
        entryFee, singlesFee, doublesFee, teamSize, maxRegistrations,
        registeredCount, venue, category, status, JSON.stringify(rules), JSON.stringify(requiredDocuments),
        JSON.stringify(contactInfo), req.user.username || req.user.coordinatorName
      ]
    );

    if (sqlRes && sqlRes.rows && sqlRes.rows.length > 0) {
      const row = sqlRes.rows[0];
      const resEvent = {
        id: row.id,
        sportId: row.sport_id,
        sportName: row.sport_name,
        title: row.title,
        coverImage: row.cover_image,
        description: row.description,
        regStartDate: row.reg_start_date,
        regEndDate: row.reg_end_date,
        tournStartDate: row.tourn_start_date,
        tournEndDate: row.tourn_end_date,
        entryFee: Number(row.entry_fee || 0),
        singlesFee: Number(row.singles_fee || 0),
        doublesFee: Number(row.doubles_fee || 0),
        teamFee: Number(row.entry_fee || 0),
        teamSize: row.team_size,
        maxRegistrations: Number(row.max_registrations || 64),
        registeredCount: Number(row.registered_count || 0),
        venue: row.venue,
        category: row.category,
        status: row.status,
        rules: row.rules,
        requiredDocuments: row.required_documents,
        contactInfo: row.contact_info
      };
      return res.json({ success: true, event: resEvent });
    }
  } catch (err) {
    console.error('Error updating event in DB via queryDb:', err.message);
  }

  try {
    const updated = await prisma.coordinatorEventItem.upsert({
      where: { id },
      update: cleanEvent,
      create: cleanEvent
    });
    return res.json({ success: true, event: updated });
  } catch (err) {
    console.error('Prisma update error fallback:', err.message);
  }

  return res.json({ success: true, event: cleanEvent });
};

export const deleteEvent = async (req, res) => {
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
    const dbRes = await queryDb('DELETE FROM coordinator_event_items WHERE id = $1 RETURNING id', [id]);
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      return res.json({ success: true, message: 'Event deleted successfully' });
    }

    const prismaRes = await prisma.coordinatorEventItem.deleteMany({ where: { id } }).catch(() => ({ count: 0 }));
    if (prismaRes.count > 0) {
      return res.json({ success: true, message: 'Event deleted successfully' });
    }

    return res.status(404).json({ message: 'Event not found or already deleted.' });
  } catch (err) {
    console.error('Error deleting event from SQL DB:', err.message);
    return res.status(500).json({ message: 'Error deleting event from database' });
  }
};
