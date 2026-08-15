import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig, coordinatorPasswords } from '../config/env.js';
import { queryDb, prisma } from '../config/db.js';

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
    } else {
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
  const memoryList = inMemoryCoordinatorMatches[sportId] || [];
  try {
    const dbMatches = await prisma.liveMatch.findMany({
      where: { sportId: { equals: sportId, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' }
    });
    if (dbMatches && dbMatches.length > 0) {
      const dbIds = new Set(dbMatches.map((m) => m.id));
      const memOnly = memoryList.filter((m) => m && m.id && !dbIds.has(m.id));
      const merged = [...dbMatches, ...memOnly];
      inMemoryCoordinatorMatches[sportId] = merged;
      return res.json(merged);
    }
  } catch (err) {
    console.error('Error fetching coordinator matches from DB:', err.message);
  }
  return res.json(memoryList);
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
    `INSERT INTO live_matches (id, sport_id, format, status, team1, team2, match_title, table_number, time, score1, score2, winner, youtube_video_id, stream_url, is_live_streaming, details, sets_history, current_set, sets_won1, sets_won2)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
       sets_won2 = EXCLUDED.sets_won2`,
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

  return res.status(201).json({ success: true, match: newMatch });
};

export const batchSaveMatches = async (req, res) => {
  const sportId = (req.user?.assignedSport || req.body.sportId || 'badminton').toLowerCase();
  const matches = req.body.matches;

  if (!Array.isArray(matches)) {
    return res.status(400).json({ message: 'matches must be an array' });
  }

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
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS current_quarter TEXT;
      ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
  } catch (e) {}

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
           status = EXCLUDED.status,
           team1 = EXCLUDED.team1,
           team2 = EXCLUDED.team2,
           match_title = EXCLUDED.match_title,
           table_number = EXCLUDED.table_number,
           time = EXCLUDED.time,
           score1 = EXCLUDED.score1,
           score2 = EXCLUDED.score2,
           winner = COALESCE(EXCLUDED.winner, live_matches.winner),
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
      savedMatches.push({ ...m, id: matchId, sportId: mSportId });
    } catch (err) {
      console.error('Error batch saving match ID:', matchId, err.message);
    }
  }

  if (!inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = [];
  }
  savedMatches.forEach(sm => {
    const idx = inMemoryCoordinatorMatches[sportId].findIndex(x => x.id === sm.id);
    if (idx !== -1) {
      inMemoryCoordinatorMatches[sportId][idx] = sm;
    } else {
      inMemoryCoordinatorMatches[sportId].push(sm);
    }
  });

  return res.json({ success: true, count: savedMatches.length, matches: savedMatches });
};

export const updateMatch = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;
  const list = inMemoryCoordinatorMatches[sportId] || [];

  const rawStreamUrl = req.body.streamUrl || req.body.stream_url || req.body.liveStreamUrl || '';
  let extractedVideoId = req.body.youtubeVideoId || req.body.youtube_video_id || '';

  if (!extractedVideoId && rawStreamUrl) {
    const match = rawStreamUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([\w-]{11})/);
    if (match && match[1]) extractedVideoId = match[1];
  }

  const payloadWithStream = {
    ...req.body,
    youtubeVideoId: extractedVideoId || req.body.youtubeVideoId || null,
    streamUrl: rawStreamUrl || req.body.streamUrl || null,
    isLiveStreaming: Boolean(req.body.isLiveStreaming || extractedVideoId || rawStreamUrl)
  };

  const index = list.findIndex((m) => m.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...payloadWithStream };
  } else {
    if (!inMemoryCoordinatorMatches[sportId]) inMemoryCoordinatorMatches[sportId] = [];
    inMemoryCoordinatorMatches[sportId].unshift({ id, sportId, ...payloadWithStream });
  }

  const updatedMatch = index !== -1 ? list[index] : { id, sportId, ...payloadWithStream };

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
  try {
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS current_quarter TEXT;`);
  } catch (e) {}

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
       winner = COALESCE(EXCLUDED.winner, live_matches.winner),
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
  return res.json({ success: true, message: 'Match deleted successfully' });
};

export const deleteAllMatches = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();

  inMemoryCoordinatorMatches[sportId] = [];

  try {
    await queryDb('DELETE FROM live_matches WHERE LOWER(sport_id) = $1', [sportId]);
  } catch (e) {
    console.warn('Backend deleteAllMatches query error:', e);
  }

  return res.json({ success: true, message: `All matches cleared for ${sportId}` });
};

export const updateMatchScore = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  if (!inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = [];
  }
  const list = inMemoryCoordinatorMatches[sportId];

  let match = list.find((m) => m.id === id);
  if (!match) {
    match = {
      id,
      format: req.body.format || 'SINGLES',
      status: req.body.status || 'running',
      team1: req.body.team1 || 'Team A',
      team2: req.body.team2 || 'Team B',
      matchTitle: req.body.matchTitle || `${req.body.team1} vs ${req.body.team2}`,
      tableNumber: req.body.venue || req.body.tableNumber || 'Table 1',
      score1: req.body.score1 || 0,
      score2: req.body.score2 || 0,
      createdAt: new Date().toISOString(),
    };
    list.unshift(match);
  }

  if (req.body.score1 !== undefined) match.score1 = Number(req.body.score1);
  if (req.body.score2 !== undefined) match.score2 = Number(req.body.score2);
  if (req.body.status !== undefined) match.status = req.body.status;
  if (req.body.venue !== undefined) match.tableNumber = req.body.venue;
  if (req.body.tableNumber !== undefined) match.tableNumber = req.body.tableNumber;
  if (req.body.team1 !== undefined) match.team1 = req.body.team1;
  if (req.body.team2 !== undefined) match.team2 = req.body.team2;
  if (req.body.matchTitle !== undefined) match.matchTitle = req.body.matchTitle;

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

  return res.json({ success: true, match });
};

export const completeMatch = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;

  if (!inMemoryCoordinatorMatches[sportId]) {
    inMemoryCoordinatorMatches[sportId] = [];
  }
  const list = inMemoryCoordinatorMatches[sportId];

  let match = list.find((m) => m.id === id);
  if (!match) {
    match = {
      id,
      format: req.body.format || 'SINGLES',
      team1: req.body.team1 || 'Team A',
      team2: req.body.team2 || 'Team B',
      matchTitle: req.body.matchTitle || `${req.body.team1} vs ${req.body.team2}`,
    };
    list.unshift(match);
  }

  match.status = 'COMPLETED';
  match.tableNumber = null;
  match.isLiveStreaming = false;
  match.winner = req.body.winner || (match.score1 >= match.score2 ? match.team1 : match.team2);
  match.completedAt = new Date().toISOString();

  const rawSetsHistory = req.body.setsHistory || match.setsHistory;
  const setsHistoryArr = Array.isArray(rawSetsHistory)
    ? rawSetsHistory
    : (typeof rawSetsHistory === 'string' ? JSON.parse(rawSetsHistory) : null);

  const detailsObj = {
    setsHistory: setsHistoryArr,
    currentSet: match.currentSet || 1,
    setsWon1: match.setsWon1 || 0,
    setsWon2: match.setsWon2 || 0
  };

  try {
    await queryDb(
      `UPDATE live_matches 
       SET status = 'COMPLETED', table_number = NULL, is_live_streaming = FALSE, winner = $1,
           details = COALESCE($2, details), sets_history = COALESCE($3, sets_history), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [
        match.winner,
        setsHistoryArr ? JSON.stringify(detailsObj) : null,
        setsHistoryArr ? JSON.stringify(setsHistoryArr) : null,
        id
      ]
    );
  } catch (e) {
    console.warn('completeMatch DB update error:', e.message);
  }

  return res.json({ success: true, match });
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

    const sportMatches = inMemoryCoordinatorMatches[sportId] || [];
    const runningMatches = sportMatches.filter((m) => m.status === 'running' || m.status === 'live').length;
    const completedMatches = sportMatches.filter((m) => m.status === 'COMPLETED' || m.status === 'FINISHED').length;
    const upcomingMatches = sportMatches.filter((m) => m.status === 'SCHEDULED').length;

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
      totalMatches: sportMatches.length,
    });
  } catch (err) {
    console.error('Error fetching coordinator dashboard stats:', err);
    return res.status(500).json({ message: 'Error loading stats' });
  }
};

export const getRegistrations = async (req, res) => {
  try {
    const sportId = (req.user.assignedSport || '').toLowerCase();

    const registrations = await prisma.collegeRegistration.findMany({
      where: { sportId: { contains: sportId, mode: 'insensitive' } },
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

        return {
          id: r.id,
          receiptId: r.id,
          eventId: r.eventId,
          sportId: r.sportId,
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
          feePaid: r.feePaid,
          paymentId: r.paymentId,
          paymentStatus: r.paymentStatus,
          createdAt: r.createdAt,
          registeredDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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
  const newEvent = {
    id: eventId,
    title: req.body.title || req.body.eventName || `${req.user.sportName} Championship 2026`,
    sportId: sportId,
    sportName: req.user.sportName,
    coverImage: req.body.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    description: req.body.description || '',
    regStartDate: req.body.regStartDate || new Date().toISOString().split('T')[0],
    regEndDate: req.body.regEndDate || '2026-08-30',
    tournStartDate: req.body.tournStartDate || '2026-09-01',
    tournEndDate: req.body.tournEndDate || '2026-09-05',
    entryFee: Number(req.body.entryFee || 0),
    singlesFee: req.body.singlesFee !== undefined ? Number(req.body.singlesFee) : Number(req.body.entryFee || 300),
    doublesFee: req.body.doublesFee !== undefined ? Number(req.body.doublesFee) : (req.body.singlesFee !== undefined ? Number(req.body.singlesFee) * 2 : 600),
    teamSize: req.body.teamSize || '1 Player',
    maxRegistrations: Number(req.body.maxRegistrations || 64),
    registeredCount: Number(req.body.registeredCount || 0),
    venue: req.body.venue || 'Central Sports Arena',
    category: req.body.category || 'Open',
    status: req.body.status || 'Draft',
    rules: req.body.rules || [],
    requiredDocuments: req.body.requiredDocuments || ['College ID Card', 'Student Aadhaar/Govt ID'],
    contactInfo: req.body.contactInfo || {
      name: req.user.coordinatorName,
      email: req.user.email || `${sportId}.coord@sems.edu`,
      phone: '+91 98765 43210'
    },
  };

  if (!inMemoryCoordinatorEvents[sportId]) {
    inMemoryCoordinatorEvents[sportId] = [];
  }
  inMemoryCoordinatorEvents[sportId].unshift(newEvent);

  try {
    await prisma.coordinatorEventItem.upsert({
      where: { id: eventId },
      update: newEvent,
      create: newEvent
    });
  } catch (err) {
    console.error('Error persisting coordinator event to DB:', err.message);
  }

  return res.status(201).json({ success: true, event: newEvent });
};

export const updateEvent = async (req, res) => {
  const sportId = req.user.assignedSport.toLowerCase();
  const { id } = req.params;
  const list = inMemoryCoordinatorEvents[sportId] || [];

  const index = list.findIndex((e) => e.id === id);
  let newStatus = req.body.status !== undefined ? req.body.status : (index !== -1 ? list[index].status : 'Draft');
  if (req.body.registeredCount !== undefined && req.body.registeredCount >= (req.body.maxRegistrations || (index !== -1 ? list[index].maxRegistrations : 64))) {
    newStatus = 'Closed';
  }

  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...req.body,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
  }

  try {
    const updated = await prisma.coordinatorEventItem.upsert({
      where: { id },
      update: {
        ...req.body,
        status: newStatus,
      },
      create: {
        id,
        sportId,
        sportName: req.user.sportName,
        title: req.body.title || req.body.eventName || 'Event',
        status: newStatus,
        ...req.body
      }
    });
    return res.json({ success: true, event: updated });
  } catch (err) {
    console.error('Error updating event in DB:', err.message);
  }

  return res.json({ success: true, event: index !== -1 ? list[index] : req.body });
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  Object.keys(inMemoryCoordinatorEvents).forEach((sKey) => {
    if (inMemoryCoordinatorEvents[sKey]) {
      inMemoryCoordinatorEvents[sKey] = inMemoryCoordinatorEvents[sKey].filter((e) => e && e.id !== id);
    }
  });

  try {
    await prisma.coordinatorEventItem.deleteMany({ where: { id } });
  } catch (err) {
    console.error('Error deleting event from DB:', err.message);
  }

  return res.json({ success: true, message: 'Event deleted successfully' });
};
