import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.js';
import { queryDb, prisma } from '../config/db.js';
import { syncCollegeLeaderboards } from '../services/leaderboardService.js';
import { deleteCloudinaryAsset, deleteCloudinaryBatch } from '../services/cloudinaryService.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { inMemoryCoordinatorEvents } from './coordinatorController.js';

export const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const normalizedUser = username.trim().toLowerCase();

  // 1. Database check (pr_users or coordinators with super/admin role)
  const dbResult = await queryDb('SELECT * FROM pr_users WHERE LOWER(username) = $1', [normalizedUser]);
  if (dbResult && dbResult.rows.length > 0) {
    const user = dbResult.rows[0];
    if (user.status && user.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
    }
    let isValid = false;
    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    }
    if (isValid && (user.role === 'ADMIN' || user.role === 'admin')) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: 'ADMIN' },
        envConfig.jwtSecret,
        { expiresIn: '24h' }
      );
      logAuditEvent({
        userId: user.id,
        actorName: user.username,
        role: 'ADMIN',
        action: 'Admin Login',
        entity: 'System Admin Console',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, role: 'ADMIN', name: 'System Administrator' }
      });
    }
  }

  // 2. Admin credential check strictly via hashed or env config
  const validAdminUser = (envConfig.adminUsername || 'admin').trim().toLowerCase();
  let isValidAdmin = false;

  if (normalizedUser === validAdminUser) {
    if (envConfig.adminPasswordHash) {
      isValidAdmin = await bcrypt.compare(password, envConfig.adminPasswordHash);
    } else {
      isValidAdmin = Boolean(envConfig.passAdmin && password === envConfig.passAdmin);
    }
  }

  if (isValidAdmin) {
    const token = jwt.sign(
      { username: normalizedUser, role: 'ADMIN' },
      envConfig.jwtSecret,
      { expiresIn: '24h' }
    );
    logAuditEvent({
      actorName: normalizedUser,
      role: 'ADMIN',
      action: 'Admin Login',
      entity: 'System Admin Console',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });
    return res.json({
      success: true,
      token,
      user: {
        id: 'ADM-1001',
        name: 'System Administrator',
        username: normalizedUser,
        role: 'ADMIN',
        email: 'admin.sports@mpec.ac.in'
      }
    });
  }

  return res.status(401).json({ message: 'Invalid Admin username or password. Access denied.' });
};

export const superCoordinatorLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const normalizedUser = username.trim().toLowerCase();

  // Strictly check PostgreSQL pr_users table for Super Coordinator accounts managed by Admin
  try {
    const dbResult = await queryDb(
      `SELECT * FROM pr_users WHERE LOWER(username) = $1 AND (role = 'super_coordinator' OR role = 'Super Coordinator')`,
      [normalizedUser]
    );

    if (dbResult && dbResult.rows.length > 0) {
      const user = dbResult.rows[0];

      // Check account status
      if (user.status && user.status.toLowerCase() === 'inactive') {
        return res.status(403).json({ message: 'Super Coordinator account is deactivated. Access denied.' });
      }

      // Check hashed password
      let isValidPass = false;
      if (user.password_hash) {
        isValidPass = await bcrypt.compare(password, user.password_hash);
      }

      if (isValidPass) {
        const token = jwt.sign(
          { id: user.id, username: user.username, role: 'super_coordinator' },
          envConfig.jwtSecret,
          { expiresIn: '24h' }
        );

        logAuditEvent({
          userId: user.id,
          actorName: user.username,
          role: 'SUPER_COORDINATOR',
          action: 'Super Coordinator Login',
          entity: 'Super Coordinator Portal',
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        });

        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name || 'Super Coordinator (President)',
            role: 'super_coordinator'
          }
        });
      }
    }
  } catch (e) {
    console.error('Error during super coordinator DB login check:', e);
  }

  return res.status(401).json({ message: 'Invalid Super Coordinator username or password. Access denied.' });
};

export const getAdminProfile = async (req, res) => {
  return res.json({
    id: 'ADM-1001',
    name: 'System Administrator',
    username: req.user?.username || 'admin',
    email: 'admin.sports@mpec.ac.in',
    role: 'ADMIN',
    status: 'ACTIVE'
  });
};

export const getMasterParticipants = async (req, res) => {
  try {
    // 1. Primary DB query: Every athlete row from registration_members
    const membersDb = await queryDb(`
      SELECT 
        m.id,
        m.id AS "memberId",
        r.id AS "registrationId",
        cr.id AS "receiptId",
        TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', m."createdAt")), 'HH12:MI AM') AS time,
        TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', m."createdAt")), 'YYYY-MM-DD') AS date,
        m."createdAt" AS "createdAt",
        r."registrationType" AS "participationType",
        COALESCE(cr.sport_id, r."sportId", s.slug, s.name, 'sport') AS "sportId",
        COALESCE(s.name, cr.sport_id, r."sportId", 'Sport') AS "sportName",
        COALESCE(cr.team_name, r."teamName", m."fullName") AS "teamName",
        COALESCE(cr.college, c.code, c.name, 'MPEC') AS college,
        COALESCE(cei.title, cr.participant_data->>'eventTitle', cr.participant_data->>'selectedEvent', cr.participant_data->>'subEvent', cr.participant_data->>'category', cr.participant_data->>'eventType', cr.participant_data->>'eventName', NULL) AS "eventTitleFromDb",
        cr.participant_data AS "participantData",
        m."fullName" AS name,
        m."rollNo" AS "rollNo",
        m.mobile,
        m.email,
        m.gender,
        m.course,
        m.year_semester AS "yearSemester",
        m."isCaptain",
        COALESCE(cr.status, r.status::text, 'VERIFIED') AS status,
        COALESCE(cr.fee_paid, r.amount, 0) AS "feePaid"
      FROM registration_members m
      JOIN registrations r ON m."registrationId" = r.id
      JOIN college_registrations cr ON (cr.registration_id = r.id OR cr.id::text = r.id::text OR cr.id::text = m."registrationId"::text)
      LEFT JOIN coordinator_event_items cei ON (cei.id::text = cr.event_id::text OR cei.id::text = r."eventId"::text)
      LEFT JOIN sports s ON s.slug = r."sportId" OR s.slug = cr.sport_id OR s.name = r."sportId"
      LEFT JOIN colleges c ON c.id = r."collegeId"
      WHERE cr.id IS NOT NULL
      ORDER BY m."createdAt" DESC
    `).catch((err) => {
      console.warn('Registration members join query error:', err.message);
      return null;
    });

    // Load coordinator created events to match event titles exactly
    const coordEventsRes = await queryDb('SELECT id, sport_id, title FROM coordinator_event_items').catch(() => null);
    const coordEventMap = new Map();
    if (coordEventsRes && coordEventsRes.rows) {
      coordEventsRes.rows.forEach(e => {
        if (e.sport_id && e.title) {
          coordEventMap.set(e.sport_id.toLowerCase().replace(/[^a-z0-9]/g, '-'), e.title);
          coordEventMap.set(e.sport_id.toLowerCase().trim(), e.title);
          coordEventMap.set(e.id.toString(), e.title);
        }
      });
    }

    const participantList = [];
    const seenMemberIds = new Set();
    const coveredRegIds = new Set();

    if (membersDb && membersDb.rows && membersDb.rows.length > 0) {
      // Group members by registrationId to accurately determine team vs duo vs individual count
      const regMemberCounts = new Map();
      membersDb.rows.forEach(r => {
        if (r.registrationId) {
          regMemberCounts.set(r.registrationId, (regMemberCounts.get(r.registrationId) || 0) + 1);
        }
      });

      membersDb.rows.forEach((row) => {
        seenMemberIds.add(row.id);
        if (row.registrationId) coveredRegIds.add(row.registrationId);
        if (row.receiptId) coveredRegIds.add(row.receiptId);

        const mCount = regMemberCounts.get(row.registrationId) || 1;
        let resolvedPartType = String(row.participationType || '').trim().toUpperCase();
        if (!resolvedPartType || resolvedPartType === 'UNDEFINED') {
          const sKey = (row.sportId || '').toLowerCase();
          if (['cricket', 'football', 'basketball', 'volleyball', 'kabaddi', 'kho-kho', 'tug-of-war'].some(ts => sKey.includes(ts))) {
            resolvedPartType = 'TEAM';
          } else if (sKey.includes('chess')) {
            resolvedPartType = 'INDIVIDUAL';
          } else if (mCount === 2) {
            resolvedPartType = 'DUO';
          } else if (mCount > 2) {
            resolvedPartType = 'TEAM';
          } else {
            resolvedPartType = 'INDIVIDUAL';
          }
        }

        const sportKey = (row.sportId || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const sportDisplayName = (row.sportName || 'Sport').replace(/-/g, ' ').toUpperCase();
        
        // Priority for eventTitle: Exact coordinator created event title -> DB eventTitle -> APEX 2026 title
        const matchedCoordTitle = coordEventMap.get(sportKey) || coordEventMap.get((row.sportId || '').toLowerCase());
        let displayEventTitle = row.eventTitleFromDb;
        if (!displayEventTitle || displayEventTitle.toLowerCase().endsWith('championship')) {
          displayEventTitle = matchedCoordTitle || `APEX ${sportDisplayName} 2026`;
        }

        participantList.push({
          id: row.id,
          memberId: row.memberId,
          registrationId: row.registrationId,
          receiptId: row.receiptId,
          time: row.time || '10:00 AM',
          date: row.date || new Date().toISOString().split('T')[0],
          createdAt: row.createdAt,
          sportId: sportKey,
          sportName: sportDisplayName,
          eventTitle: displayEventTitle,
          participationType: resolvedPartType,
          teamName: row.teamName || row.name || 'Participant',
          college: row.college || 'MPEC',
          name: row.name || 'Student',
          mobile: row.mobile || 'N/A',
          email: row.email || 'N/A',
          gender: row.gender || 'Boys',
          rollNo: row.rollNo || 'N/A',
          course: row.course || 'N/A',
          yearSemester: row.yearSemester || 'N/A',
          isCaptain: (row.isCaptain === true || row.isCaptain === 1 || row.isCaptain === 'true' || row.isCaptain === '1'),
          status: row.status || 'VERIFIED',
          feePaid: Number(row.feePaid || 0)
        });
      });
    }

    // 2. Include any standalone registrations from college_registrations not already covered
    const crDb = await queryDb(`
      SELECT 
        cr.id,
        cr.registration_id AS "registrationId",
        TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', cr.created_at)), 'HH12:MI AM') AS time,
        TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', cr.created_at)), 'YYYY-MM-DD') AS date,
        cr.created_at AS "createdAt",
        cr.sport_id AS "sportId",
        cr.student_name AS "name",
        cr.team_name AS "teamName",
        cr.college,
        cr.department,
        cr.email,
        cr.phone AS mobile,
        cr.gender,
        cr.status,
        cr.fee_paid AS "feePaid",
        cr.members_count AS "membersCount",
        cr.participant_data AS "participantData",
        COALESCE(cei.title, cr.participant_data->>'eventTitle', cr.participant_data->>'selectedEvent', cr.participant_data->>'subEvent', cr.participant_data->>'category', cr.participant_data->>'eventType', cr.participant_data->>'eventName', NULL) AS "eventTitleFromDb"
      FROM college_registrations cr
      LEFT JOIN coordinator_event_items cei ON cei.id::text = cr.event_id::text
      ORDER BY cr.created_at DESC
    `).catch(() => null);

    if (crDb && crDb.rows) {
      crDb.rows.forEach((row) => {
        if (!coveredRegIds.has(row.id) && !coveredRegIds.has(row.registrationId)) {
          const mCount = Number(row.membersCount || 1);
          let resolvedPartType = (row.participantData?.participationType || row.participantData?.registrationType || '').trim().toUpperCase();
          if (!resolvedPartType) {
            const sKey = (row.sportId || '').toLowerCase();
            if (['cricket', 'football', 'basketball', 'volleyball', 'kabaddi', 'kho-kho', 'tug-of-war'].some(ts => sKey.includes(ts))) {
              resolvedPartType = 'TEAM';
            } else if (sKey.includes('chess')) {
              resolvedPartType = 'INDIVIDUAL';
            } else if (mCount === 2) {
              resolvedPartType = 'DUO';
            } else if (mCount > 2) {
              resolvedPartType = 'TEAM';
            } else {
              resolvedPartType = 'INDIVIDUAL';
            }
          }

          const sportKey = (row.sportId || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-');
          const sportDisplayName = (row.sportId || 'Sport').replace(/-/g, ' ').toUpperCase();
          
          const matchedCoordTitle = coordEventMap.get(sportKey) || coordEventMap.get((row.sportId || '').toLowerCase());
          let displayEventTitle = row.eventTitleFromDb;
          if (!displayEventTitle || displayEventTitle.toLowerCase().endsWith('championship')) {
            displayEventTitle = matchedCoordTitle || `APEX ${sportDisplayName} 2026`;
          }

          participantList.push({
            id: row.id,
            memberId: row.id,
            registrationId: row.registrationId || row.id,
            receiptId: row.id,
            time: row.time || '10:00 AM',
            date: row.date || new Date().toISOString().split('T')[0],
            createdAt: row.createdAt,
            sportId: sportKey,
            sportName: sportDisplayName,
            eventTitle: displayEventTitle,
            participationType: resolvedPartType,
            teamName: row.teamName || row.name || 'Participant',
            college: row.college || 'MPEC',
            name: row.name || 'Student',
            mobile: row.mobile || 'N/A',
            email: row.email || 'N/A',
            gender: row.gender || 'Boys',
            rollNo: 'N/A',
            course: row.department || 'N/A',
            yearSemester: 'N/A',
            isCaptain: true,
            status: row.status || 'VERIFIED',
            feePaid: Number(row.feePaid || 0)
          });
        }
      });
    }

    return res.json(participantList);
  } catch (err) {
    console.error('Error fetching master participants from DB:', err.message);
    return res.json([]);
  }
};

export const getSuperCoordinatorEvents = async (req, res) => {
  const eventsMap = new Map();

  try {
    const dbRes = await queryDb(`
      SELECT 
        id,
        sport_id AS "sportId",
        sport_name AS "sportName",
        title AS "eventTitle",
        venue,
        entry_fee AS "teamFee",
        singles_fee AS "singlesFee",
        doubles_fee AS "doublesFee",
        team_size AS "teamSize",
        max_registrations AS "maxRegistrations",
        registered_count AS "registeredCount",
        status,
        reg_start_date AS "regStartDate",
        reg_end_date AS "regEndDate",
        tourn_start_date AS "tournStartDate",
        tourn_end_date AS "tournEndDate",
        category,
        contact_info AS "contactInfo",
        created_at AS "createdAt",
        created_by AS "createdBy"
      FROM coordinator_event_items
      ORDER BY created_at DESC
    `);

    if (dbRes && dbRes.rows) {
      dbRes.rows.forEach((e) => {
        let contact = e.contactInfo;
        if (typeof contact === 'string') {
          try { contact = JSON.parse(contact); } catch (err) {}
        }
        eventsMap.set(e.id, {
          id: e.id,
          sportId: e.sportId,
          sportName: e.sportName || (e.sportId || 'Sport').replace(/-/g, ' ').toUpperCase(),
          eventTitle: e.eventTitle || 'Tournament Event',
          coordinatorName: (contact && contact.name) || e.createdBy || 'Coordinator',
          coordinatorEmail: (contact && contact.email) || '',
          createdDate: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : (e.regStartDate || ''),
          regStartDate: e.regStartDate || '',
          regEndDate: e.regEndDate || '',
          tournStartDate: e.tournStartDate || '',
          tournEndDate: e.tournEndDate || '',
          venue: e.venue || 'Main Stadium',
          teamFee: Number(e.teamFee || 0),
          minPlayers: 1,
          maxPlayers: 1,
          category: e.category || 'Open',
          status: e.status || 'Published',
          registeredCount: Number(e.registeredCount || 0),
          maxRegistrations: Number(e.maxRegistrations || 64)
        });
      });
    }
  } catch (err) {
    console.error('Error fetching coordinator events for SuperCoordinator/Admin:', err.message);
  }

  // Also include any in-memory coordinator events
  if (inMemoryCoordinatorEvents) {
    Object.values(inMemoryCoordinatorEvents).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((e) => {
          if (e && e.id && !eventsMap.has(e.id)) {
            let contact = e.contactInfo;
            if (typeof contact === 'string') {
              try { contact = JSON.parse(contact); } catch (err) {}
            }
            eventsMap.set(e.id, {
              id: e.id,
              sportId: e.sportId,
              sportName: e.sportName || (e.sportId || 'Sport').replace(/-/g, ' ').toUpperCase(),
              eventTitle: e.title || e.eventTitle || 'Tournament Event',
              coordinatorName: (contact && contact.name) || e.createdBy || 'Coordinator',
              coordinatorEmail: (contact && contact.email) || '',
              createdDate: e.regStartDate || new Date().toLocaleDateString(),
              regStartDate: e.regStartDate || '',
              regEndDate: e.regEndDate || '',
              tournStartDate: e.tournStartDate || '',
              tournEndDate: e.tournEndDate || '',
              venue: e.venue || 'Main Stadium',
              teamFee: Number(e.entryFee || e.teamFee || 0),
              minPlayers: 1,
              maxPlayers: 1,
              category: e.category || 'Open',
              status: e.status || 'Published',
              registeredCount: Number(e.registeredCount || 0),
              maxRegistrations: Number(e.maxRegistrations || 64)
            });
          }
        });
      }
    });
  }

  return res.json(Array.from(eventsMap.values()));
};

export const deleteCoordinatorEventDB = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  try {
    const dbRes = await queryDb('DELETE FROM coordinator_event_items WHERE id = $1 RETURNING id', [id]);
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      logAuditEvent({
        actorName: req.user?.username || 'Super Coordinator',
        role: req.user?.role === 'ADMIN' ? 'ADMIN' : 'SUPER_COORDINATOR',
        action: 'Event Deleted',
        entity: `Deleted event: ${id}`,
        entityId: id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({ success: true, message: 'Coordinator event deleted from database successfully.' });
    }

    const prismaRes = await prisma.coordinatorEventItem.deleteMany({ where: { id } }).catch(() => ({ count: 0 }));
    if (prismaRes.count > 0) {
      logAuditEvent({
        actorName: req.user?.username || 'Super Coordinator',
        role: req.user?.role === 'ADMIN' ? 'ADMIN' : 'SUPER_COORDINATOR',
        action: 'Event Deleted',
        entity: `Deleted event: ${id}`,
        entityId: id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({ success: true, message: 'Coordinator event deleted from database successfully.' });
    }

    return res.status(404).json({ message: 'Event not found or already deleted.' });
  } catch (err) {
    console.error('Error deleting coordinator event from DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete coordinator event from database' });
  }
};

export const getSuperCoordinatorCoordinators = async (req, res) => {
  try {
    const dbRes = await queryDb(`
      SELECT 
        assigned_sport AS "id",
        sport_name AS "name",
        coordinator_name AS "coordinator",
        email AS "coordinatorEmail",
        status
      FROM sport_coordinators
      ORDER BY sport_name ASC
    `);

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      return res.json(dbRes.rows);
    }
  } catch (err) {
    console.error('Error fetching sport coordinators:', err.message);
  }

  return res.json([]);
};

export const getLeaderboardEntries = async (req, res) => {
  try {
    const dbRes = await queryDb(`
      SELECT 
        id,
        sport_id AS "sportId",
        match_format AS "matchFormat",
        gender,
        sub_event AS "subEvent",
        winner_name AS "winnerName",
        winner_team AS "winnerTeam",
        winner_college AS "winnerCollege",
        runner_up_name AS "runnerUpName",
        runner_up_team AS "runnerUpTeam",
        runner_up_college AS "runnerUpCollege",
        points,
        declared_at AS "declaredAt"
      FROM leaderboard_entries
      ORDER BY declared_at DESC
    `);

    if (dbRes && dbRes.rows) {
      const formatted = dbRes.rows.map((row) => ({
        id: row.id,
        sportId: row.sportId,
        sportName: (row.sportId || 'Sport').replace(/-/g, ' ').toUpperCase(),
        matchFormat: row.matchFormat || 'Team',
        gender: row.gender || 'Boys',
        subEvent: row.subEvent,
        athleticsSubEvent: row.subEvent,
        winnerName: row.winnerName || '',
        winnerTeamName: row.winnerTeam || row.winnerName || '',
        winnerCollege: row.winnerCollege || 'MPEC',
        winnerCollegeName: row.winnerCollege || 'MPEC',
        winnerPoints: 5,
        runnerUpName: row.runnerUpName || '',
        runnerUpTeamName: row.runnerUpTeam || row.runnerUpName || '',
        runnerUpCollege: row.runnerUpCollege || 'MIPS',
        runnerUpCollegeName: row.runnerUpCollege || 'MIPS',
        runnerUpPoints: 3,
        points: Number(row.points || 10),
        date: row.declaredAt ? new Date(row.declaredAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString()
      }));
      return res.json(formatted);
    }
  } catch (err) {
    console.error('Error fetching leaderboard entries from DB:', err.message);
  }

  return res.json([]);
};

export const saveLeaderboardEntry = async (req, res) => {
  const {
    id,
    sportId,
    matchFormat,
    gender,
    subEvent,
    athleticsSubEvent,
    winnerName,
    winnerTeamName,
    winnerCollege,
    winnerCollegeId,
    runnerUpName,
    runnerUpTeamName,
    runnerUpCollege,
    runnerUpCollegeId,
    points
  } = req.body;

  const finalSubEvent = athleticsSubEvent || subEvent || null;
  const wCollege = winnerCollege || winnerCollegeId || 'MPEC';
  const rCollege = runnerUpCollege || runnerUpCollegeId || 'MIPS';

  try {
    const dbRes = await queryDb(
      `INSERT INTO leaderboard_entries 
        (sport_id, match_format, gender, sub_event, winner_name, winner_team, winner_college, runner_up_name, runner_up_team, runner_up_college, points, declared_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        sportId || 'general',
        matchFormat || 'Team',
        gender || 'Boys',
        finalSubEvent,
        winnerName || '',
        winnerTeamName || winnerName || '',
        wCollege,
        runnerUpName || '',
        runnerUpTeamName || runnerUpName || '',
        rCollege,
        Number(points || 10)
      ]
    );

    await syncCollegeLeaderboards();

    if (dbRes && dbRes.rows.length > 0) {
      const row = dbRes.rows[0];
      const entry = {
        id: row.id,
        sportId: row.sport_id,
        sportName: (row.sport_id || 'Sport').replace(/-/g, ' ').toUpperCase(),
        matchFormat: row.match_format,
        gender: row.gender,
        subEvent: row.sub_event,
        athleticsSubEvent: row.sub_event,
        winnerName: row.winner_name,
        winnerTeamName: row.winner_team,
        winnerCollege: row.winner_college,
        winnerCollegeName: row.winner_college,
        winnerPoints: 5,
        runnerUpName: row.runner_up_name,
        runnerUpTeamName: row.runner_up_team,
        runnerUpCollege: row.runner_up_college,
        runnerUpCollegeName: row.runner_up_college,
        runnerUpPoints: 3,
        points: Number(row.points || 10),
        date: new Date(row.declared_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
      };
      logAuditEvent({
        actorName: req.user?.username || 'Super Coordinator',
        role: 'SUPER_COORDINATOR',
        action: 'Leaderboard Updated',
        entity: `Declared winners for ${sportName}: 1st ${winnerCollege} (${winnerName}), 2nd ${runnerUpCollege}`,
        details: { sportName, winnerCollege, runnerUpCollege },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.status(201).json({ success: true, entry });
    }
  } catch (err) {
    console.error('Error saving leaderboard entry to DB:', err.message);
    return res.status(500).json({ message: 'Failed to save leaderboard entry to database' });
  }

  return res.json({ success: true });
};

export const deleteLeaderboardEntry = async (req, res) => {
  const { id } = req.params;

  try {
    await queryDb('DELETE FROM leaderboard_entries WHERE id = $1', [id]);
    await syncCollegeLeaderboards();
    logAuditEvent({
      actorName: req.user?.username || 'Super Coordinator',
      role: 'SUPER_COORDINATOR',
      action: 'Leaderboard Entry Deleted',
      entity: `Deleted leaderboard entry ${id}`,
      entityId: id,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });
    return res.json({ success: true, message: 'Leaderboard result deleted successfully' });
  } catch (err) {
    console.error('Error deleting leaderboard entry:', err.message);
    return res.status(500).json({ message: 'Failed to delete leaderboard entry' });
  }
};

export const getHeroSlidesDB = async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'hero_slides' } });
    if (setting && Array.isArray(setting.value) && setting.value.length > 0) {
      return res.json(setting.value);
    }

    // Direct database query fallback
    const rawRes = await queryDb("SELECT value FROM system_settings WHERE key = 'hero_slides'");
    if (rawRes && rawRes.rows && rawRes.rows.length > 0) {
      const val = rawRes.rows[0].value;
      if (Array.isArray(val) && val.length > 0) return res.json(val);
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) return res.json(parsed);
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('Error fetching hero slides from DB:', err.message);
  }
  return res.json([]);
};

export const saveHeroSlidesDB = async (req, res) => {
  const slides = req.body;
  if (!Array.isArray(slides)) {
    return res.status(400).json({ message: 'Slides must be an array.' });
  }

  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key: 'hero_slides' },
      update: { value: slides, updatedAt: new Date() },
      create: { key: 'hero_slides', value: slides }
    });
    logAuditEvent({
      actorName: req.user?.username || 'Super Coordinator',
      role: 'SUPER_COORDINATOR',
      action: 'Hero Slides Updated',
      entity: `Saved ${slides.length} hero slides to database`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });
    return res.json({ success: true, slides: updated.value });
  } catch (err) {
    console.error('Error saving hero slides via Prisma, attempting raw query fallback:', err.message);
    try {
      await queryDb(`
        INSERT INTO system_settings (key, value, "updatedAt")
        VALUES ('hero_slides', $1::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, "updatedAt" = NOW()
      `, [JSON.stringify(slides)]);
      logAuditEvent({
        actorName: req.user?.username || 'Super Coordinator',
        role: 'SUPER_COORDINATOR',
        action: 'Hero Slides Updated',
        entity: `Saved ${slides.length} hero slides via raw query fallback`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({ success: true, slides });
    } catch (rawErr) {
      console.error('Error saving hero slides via raw query:', rawErr.message);
      return res.status(500).json({ message: 'Failed to save hero slides to database' });
    }
  }
};

export const getCoordinatorsDB = async (req, res) => {
  try {
    const list = [];

    // 1. Fetch Sports Coordinators
    const sportsRes = await queryDb(`
      SELECT 
        id,
        username,
        coordinator_name AS name,
        email,
        phone,
        'Coordinator' AS role,
        assigned_sport AS "assignedSport",
        sport_name AS "sportName",
        status,
        created_at AS "createdAt"
      FROM sport_coordinators
      ORDER BY created_at DESC
    `);
    if (sportsRes && sportsRes.rows) {
      sportsRes.rows.forEach(r => list.push({
        ...r,
        id: `sc_${r.id}`,
        dbId: r.id,
        role: 'Coordinator',
        status: r.status ? (r.status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') : 'Active',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }));
    }

    // 2. Fetch College Heads
    const collegeRes = await queryDb(`
      SELECT 
        id,
        username,
        faculty_name AS name,
        email,
        phone,
        'Head Coordinator' AS role,
        college,
        status,
        created_at AS "createdAt"
      FROM college_head_users
      ORDER BY created_at DESC
    `);
    if (collegeRes && collegeRes.rows) {
      collegeRes.rows.forEach(r => list.push({
        ...r,
        id: `ch_${r.id}`,
        dbId: r.id,
        role: 'Head Coordinator',
        assignedSport: 'all',
        sportName: `College Head (${r.college})`,
        status: r.status ? (r.status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') : 'Active',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }));
    }

    // 3. Fetch PR & Super Coordinator Users
    const prRes = await queryDb(`
      SELECT 
        id,
        username,
        COALESCE(name, username) AS name,
        email,
        role,
        status,
        created_at AS "createdAt"
      FROM pr_users
      ORDER BY created_at DESC
    `);
    if (prRes && prRes.rows) {
      prRes.rows.forEach(r => {
        const isSuper = r.role === 'super_coordinator' || r.role === 'Super Coordinator';
        list.push({
          ...r,
          id: `pr_${r.id}`,
          dbId: r.id,
          role: isSuper ? 'Super Coordinator' : 'PR Member',
          assignedSport: isSuper ? 'all' : 'media',
          sportName: isSuper ? 'All Sports (Fest President)' : 'Media / PR Team',
          status: r.status ? (r.status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') : 'Active',
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
        });
      });
    }

    return res.json(list);
  } catch (err) {
    console.error('Error fetching coordinators from DB:', err.message);
    return res.status(500).json({ message: 'Failed to fetch coordinators list' });
  }
};

export const saveCoordinatorDB = async (req, res) => {
  const {
    id,
    name,
    username,
    email,
    phone,
    role,
    assignedSport,
    sportName,
    college,
    password,
    status
  } = req.body;

  if (!username || !name) {
    return res.status(400).json({ message: 'Name and Username are required.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const accStatus = (status && status.toLowerCase() === 'inactive') ? 'inactive' : 'active';
  let passHash = null;

  if (password && password.trim()) {
    passHash = await bcrypt.hash(password.trim(), 10);
  }

  const cleanId = (id && typeof id === 'string') ? id.replace(/^(pr_|ch_|sc_)/, '') : id;
  const numId = (cleanId && !isNaN(Number(cleanId))) ? Number(cleanId) : null;

  try {
    const isSuperCoord = role === 'Super Coordinator' || role === 'super_coordinator' || (role && role.toLowerCase().includes('super coordinator'));
    const isCollegeHead = role === 'Head Coordinator' || role === 'college_head';
    const isPR = role === 'PR Member' || role === 'pr_coordinator';

    if (isSuperCoord) {
      if (cleanId || cleanUser) {
        let updateQuery = `UPDATE pr_users SET name = $1, username = $2, email = $3, role = 'super_coordinator', status = $4, updated_at = CURRENT_TIMESTAMP`;
        const params = [name, cleanUser, email || '', accStatus];
        if (passHash) {
          updateQuery += `, password_hash = $5 WHERE `;
          params.push(passHash);
        } else {
          updateQuery += ` WHERE `;
        }
        updateQuery += `id = $${params.length + 1} OR LOWER(username) = LOWER($${params.length + 1})`;
        params.push(cleanId || cleanUser);

        const updated = await queryDb(updateQuery, params);
        if (updated && updated.rowCount > 0) {
          return res.json({ success: true, message: 'Coordinator saved to database successfully.' });
        }
      }
      
      const initialPass = passHash || await bcrypt.hash('Super@2026', 10);
      await queryDb(
        `INSERT INTO pr_users (id, username, password_hash, role, name, email, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'super_coordinator', $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [cleanUser, initialPass, name, email || '', accStatus]
      );
    } else if (isCollegeHead) {
      if (cleanId || cleanUser) {
        let updateQuery = `UPDATE college_head_users SET faculty_name = $1, username = $2, email = $3, phone = $4, college = $5, status = $6, updated_at = CURRENT_TIMESTAMP`;
        const params = [name, cleanUser, email || '', phone || '', college || 'MPEC', accStatus];
        if (passHash) {
          updateQuery += `, password_hash = $7 WHERE `;
          params.push(passHash);
        } else {
          updateQuery += ` WHERE `;
        }
        updateQuery += `id = $${params.length + 1} OR LOWER(username) = LOWER($${params.length + 1})`;
        params.push(cleanId || cleanUser);

        const updated = await queryDb(updateQuery, params);
        if (updated && updated.rowCount > 0) {
          return res.json({ success: true, message: 'Coordinator saved to database successfully.' });
        }
      }
      
      const initialPass = passHash || await bcrypt.hash('Head@2026', 10);
      await queryDb(
        `INSERT INTO college_head_users (id, username, password_hash, college, faculty_name, email, phone, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [cleanUser, initialPass, college || 'MPEC', name, email || '', phone || '', accStatus]
      );
    } else if (isPR) {
      if (cleanId || cleanUser) {
        let updateQuery = `UPDATE pr_users SET name = $1, username = $2, email = $3, status = $4, updated_at = CURRENT_TIMESTAMP`;
        const params = [name, cleanUser, email || '', accStatus];
        if (passHash) {
          updateQuery += `, password_hash = $5 WHERE `;
          params.push(passHash);
        } else {
          updateQuery += ` WHERE `;
        }
        updateQuery += `id = $${params.length + 1} OR LOWER(username) = LOWER($${params.length + 1})`;
        params.push(cleanId || cleanUser);

        const updated = await queryDb(updateQuery, params);
        if (updated && updated.rowCount > 0) {
          return res.json({ success: true, message: 'Coordinator saved to database successfully.' });
        }
      }
      
      const initialPass = passHash || await bcrypt.hash('PRPass@2026', 10);
      await queryDb(
        `INSERT INTO pr_users (id, username, password_hash, role, name, email, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'pr_coordinator', $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [cleanUser, initialPass, name, email || '', accStatus]
      );
    } else {
      const sportSlug = (assignedSport || 'cricket').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const sportTitle = sportName || (assignedSport || 'Cricket').replace(/-/g, ' ').toUpperCase();

      if (cleanId || cleanUser) {
        let updateQuery = `UPDATE sport_coordinators SET coordinator_name = $1, username = $2, email = $3, phone = $4, assigned_sport = $5, sport_name = $6, status = $7, updated_at = CURRENT_TIMESTAMP`;
        const params = [name, cleanUser, email || '', phone || '', sportSlug, sportTitle, accStatus];
        if (passHash) {
          updateQuery += `, password_hash = $8 WHERE `;
          params.push(passHash);
        } else {
          updateQuery += ` WHERE `;
        }
        updateQuery += `id = $${params.length + 1} OR LOWER(username) = LOWER($${params.length + 1}) OR assigned_sport = LOWER($${params.length + 1})`;
        params.push(cleanId || cleanUser);

        const updated = await queryDb(updateQuery, params);
        if (updated && updated.rowCount > 0) {
          logAuditEvent({
            actorName: req.user?.username || 'Admin',
            role: 'ADMIN',
            action: 'Coordinator Updated',
            entity: `${role || 'Coordinator'}: ${name} (${cleanUser})`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
          });
          return res.json({ success: true, message: 'Coordinator saved to database successfully.' });
        }
      }
      
      const initialPass = passHash || await bcrypt.hash('Coord@2026', 10);
      await queryDb(
        `INSERT INTO sport_coordinators (id, username, password_hash, assigned_sport, sport_name, coordinator_name, email, phone, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [cleanUser, initialPass, sportSlug, sportTitle, name, email || '', phone || '', accStatus]
      );
    }

    logAuditEvent({
      actorName: req.user?.username || 'Admin',
      role: 'ADMIN',
      action: cleanId ? 'Coordinator Updated' : 'Coordinator Created',
      entity: `${role || 'Coordinator'}: ${name} (${cleanUser})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });
    return res.json({ success: true, message: 'Coordinator saved to database successfully.' });
  } catch (err) {
    console.error('Error saving coordinator to DB:', err.message);
    return res.status(500).json({ message: 'Failed to save coordinator to database' });
  }
};

export const toggleCoordinatorStatusDB = async (req, res) => {
  const { id } = req.params;
  const { status, username } = req.body;

  try {
    const newStatus = (status && status.toLowerCase() === 'inactive') ? 'inactive' : 'active';
    const cleanUser = (username || '').trim().toLowerCase();
    const rawId = typeof id === 'string' ? id.replace(/^(pr_|ch_|sc_)/, '') : id;

    // 1. Check table prefix first
    if (typeof id === 'string' && id.startsWith('pr_')) {
      const pr = await queryDb(`UPDATE pr_users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [newStatus, rawId]);
      if (pr && pr.rows && pr.rows.length > 0) {
        logAuditEvent({
          actorName: req.user?.username || 'Admin',
          role: 'ADMIN',
          action: 'Coordinator Status Toggled',
          entity: `Toggled ${rawId} status to ${newStatus}`,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        });
        return res.json({ success: true, status: newStatus === 'active' ? 'Active' : 'Inactive' });
      }
    }
    if (typeof id === 'string' && id.startsWith('ch_')) {
      const ch = await queryDb(`UPDATE college_head_users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [newStatus, rawId]);
      if (ch && ch.rows && ch.rows.length > 0) {
        logAuditEvent({
          actorName: req.user?.username || 'Admin',
          role: 'ADMIN',
          action: 'Coordinator Status Toggled',
          entity: `Toggled ${rawId} status to ${newStatus}`,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        });
        return res.json({ success: true, status: newStatus === 'active' ? 'Active' : 'Inactive' });
      }
    }
    if (typeof id === 'string' && id.startsWith('sc_')) {
      const sc = await queryDb(`UPDATE sport_coordinators SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [newStatus, rawId]);
      if (sc && sc.rows && sc.rows.length > 0) {
        logAuditEvent({
          actorName: req.user?.username || 'Admin',
          role: 'ADMIN',
          action: 'Coordinator Status Toggled',
          entity: `Toggled ${rawId} status to ${newStatus}`,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        });
        return res.json({ success: true, status: newStatus === 'active' ? 'Active' : 'Inactive' });
      }
    }

    // 2. Fallback check across tables by rawId or username
    const searchVal = rawId || cleanUser;
    if (searchVal) {
      const pr = await queryDb(`UPDATE pr_users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [newStatus, searchVal]);
      if (pr && pr.rows && pr.rows.length > 0) {
        return res.json({ success: true, status: newStatus === 'active' ? 'Active' : 'Inactive' });
      }

      const ch = await queryDb(`UPDATE college_head_users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [newStatus, searchVal]);
      if (ch && ch.rows && ch.rows.length > 0) {
        return res.json({ success: true, status: newStatus === 'active' ? 'Active' : 'Inactive' });
      }

      const sc = await queryDb(`UPDATE sport_coordinators SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [newStatus, searchVal]);
      if (sc && sc.rows && sc.rows.length > 0) {
        return res.json({ success: true, status: newStatus === 'active' ? 'Active' : 'Inactive' });
      }
    }

    return res.status(404).json({ message: 'Coordinator account not found in database.' });
  } catch (err) {
    console.error('Error toggling coordinator status in DB:', err.message);
    return res.status(500).json({ message: 'Failed to update status in database' });
  }
};

export const resetCoordinatorPasswordDB = async (req, res) => {
  const { id } = req.params;
  const { newPassword, username } = req.body;

  const passToSet = newPassword && newPassword.trim().length >= 6 ? newPassword.trim() : 'Password@123';
  const hashed = await bcrypt.hash(passToSet, 10);
  const cleanUser = (username || '').trim().toLowerCase();
  const rawId = typeof id === 'string' ? id.replace(/^(pr_|ch_|sc_)/, '') : id;

  try {
    if (typeof id === 'string' && id.startsWith('pr_')) {
      const pr = await queryDb(`UPDATE pr_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [hashed, rawId]);
      if (pr && pr.rows && pr.rows.length > 0) return res.json({ success: true, message: 'Password reset successfully.' });
    }
    if (typeof id === 'string' && id.startsWith('ch_')) {
      const ch = await queryDb(`UPDATE college_head_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [hashed, rawId]);
      if (ch && ch.rows && ch.rows.length > 0) return res.json({ success: true, message: 'Password reset successfully.' });
    }
    if (typeof id === 'string' && id.startsWith('sc_')) {
      const sc = await queryDb(`UPDATE sport_coordinators SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [hashed, rawId]);
      if (sc && sc.rows && sc.rows.length > 0) return res.json({ success: true, message: 'Password reset successfully.' });
    }

    const searchVal = rawId || cleanUser;
    if (searchVal) {
      const pr = await queryDb(`UPDATE pr_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [hashed, searchVal]);
      if (pr && pr.rows && pr.rows.length > 0) return res.json({ success: true, message: 'Password reset successfully.' });

      const ch = await queryDb(`UPDATE college_head_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [hashed, searchVal]);
      if (ch && ch.rows && ch.rows.length > 0) return res.json({ success: true, message: 'Password reset successfully.' });

      const sc = await queryDb(`UPDATE sport_coordinators SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR LOWER(username) = LOWER($2) RETURNING id`, [hashed, searchVal]);
      if (sc && sc.rows && sc.rows.length > 0) return res.json({ success: true, message: 'Password reset successfully.' });
    }

    return res.status(404).json({ message: 'Coordinator account not found in database.' });
  } catch (err) {
    console.error('Error resetting coordinator password in DB:', err.message);
    return res.status(500).json({ message: 'Failed to reset password in database' });
  }
};

export const deleteCoordinatorDB = async (req, res) => {
  const { id } = req.params;
  const rawId = typeof id === 'string' ? id.replace(/^(pr_|ch_|sc_)/, '') : id;

  try {
    if (typeof id === 'string' && id.startsWith('pr_')) {
      await queryDb('DELETE FROM pr_users WHERE id = $1 OR LOWER(username) = LOWER($1)', [rawId]);
      logAuditEvent({
        actorName: req.user?.username || 'Admin',
        role: 'ADMIN',
        action: 'Coordinator Deleted',
        entity: `Deleted coordinator id: ${id}`,
        entityId: id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({ success: true, message: 'Coordinator deleted from database successfully.' });
    }
    if (typeof id === 'string' && id.startsWith('ch_')) {
      await queryDb('DELETE FROM college_head_users WHERE id = $1 OR LOWER(username) = LOWER($1)', [rawId]);
      logAuditEvent({
        actorName: req.user?.username || 'Admin',
        role: 'ADMIN',
        action: 'Coordinator Deleted',
        entity: `Deleted coordinator id: ${id}`,
        entityId: id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({ success: true, message: 'Coordinator deleted from database successfully.' });
    }
    if (typeof id === 'string' && id.startsWith('sc_')) {
      await queryDb('DELETE FROM sport_coordinators WHERE id = $1 OR LOWER(username) = LOWER($1)', [rawId]);
      logAuditEvent({
        actorName: req.user?.username || 'Admin',
        role: 'ADMIN',
        action: 'Coordinator Deleted',
        entity: `Deleted coordinator id: ${id}`,
        entityId: id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
      return res.json({ success: true, message: 'Coordinator deleted from database successfully.' });
    }

    if (rawId) {
      await queryDb('DELETE FROM pr_users WHERE id = $1 OR LOWER(username) = LOWER($1)', [rawId]);
      await queryDb('DELETE FROM college_head_users WHERE id = $1 OR LOWER(username) = LOWER($1)', [rawId]);
      await queryDb('DELETE FROM sport_coordinators WHERE id = $1 OR LOWER(username) = LOWER($1)', [rawId]);
    }

    logAuditEvent({
      actorName: req.user?.username || 'Admin',
      role: 'ADMIN',
      action: 'Coordinator Deleted',
      entity: `Deleted coordinator id: ${id}`,
      entityId: id,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });
    return res.json({ success: true, message: 'Coordinator deleted from database successfully.' });
  } catch (err) {
    console.error('Error deleting coordinator from DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete coordinator from database' });
  }
};

export const changeSuperCoordinatorPasswordDB = async (req, res) => {
  const { newPass, username } = req.body;
  const targetUser = (username || req.user?.username || 'super_coordinator').trim().toLowerCase();

  if (!newPass || newPass.trim().length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const hashed = await bcrypt.hash(newPass.trim(), 10);
    
    await queryDb(
      `UPDATE pr_users 
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE LOWER(username) = LOWER($2) OR role = 'super_coordinator' OR role = 'Super Coordinator'`,
      [hashed, targetUser]
    );

    try {
      await prisma.systemSetting.upsert({
        where: { key: 'super_coordinator_pass' },
        update: { value: { password: newPass.trim() } },
        create: { key: 'super_coordinator_pass', value: { password: newPass.trim() } }
      });
    } catch (e) {}

    return res.json({ success: true, message: 'Super Coordinator password updated successfully in database.' });
  } catch (err) {
    console.error('Error changing super coordinator password:', err.message);
    return res.status(500).json({ message: 'Failed to change password in database.' });
  }
};

// ── Admin Central Dashboard Stats ──────────────────────────────────────────
export const getDashboardStatsDB = async (req, res) => {
  try {
    const [
      regRes,
      coordEventsRes,
      activeCoordsRes,
      inactiveCoordsRes,
      prMediaRes,
      participantsRes,
      sportsRes,
      completedResultsRes,
      pendingResultsRes,
      announcementsRes
    ] = await Promise.all([
      queryDb('SELECT COUNT(*) FROM college_registrations'),
      queryDb('SELECT COUNT(*) FROM coordinator_event_items'),
      queryDb(`
        SELECT (
          (SELECT COUNT(*) FROM sport_coordinators WHERE LOWER(status) = 'active') +
          (SELECT COUNT(*) FROM college_head_users WHERE LOWER(status) = 'active') +
          (SELECT COUNT(*) FROM pr_users WHERE LOWER(status) = 'active')
        ) AS total
      `),
      queryDb(`
        SELECT (
          (SELECT COUNT(*) FROM sport_coordinators WHERE LOWER(status) = 'inactive') +
          (SELECT COUNT(*) FROM college_head_users WHERE LOWER(status) = 'inactive') +
          (SELECT COUNT(*) FROM pr_users WHERE LOWER(status) = 'inactive')
        ) AS total
      `),
      queryDb('SELECT COUNT(*) FROM media'),
      queryDb('SELECT COALESCE(SUM(members_count), COUNT(*)) FROM college_registrations'),
      queryDb('SELECT COUNT(*) FROM sports WHERE "isActive" = true'),
      queryDb('SELECT COUNT(*) FROM leaderboard_entries'),
      queryDb('SELECT COUNT(*) FROM live_matches WHERE LOWER(status) IN (\'scheduled\', \'live\', \'running\')'),
      queryDb('SELECT COUNT(*) FROM announcements WHERE "isPublished" = true')
    ]);

    const stats = {
      totalRegistrations: Number(regRes?.rows[0]?.count || 0),
      totalCoordinatorEvents: Number(coordEventsRes?.rows[0]?.count || 0),
      activeCoordinators: Number(activeCoordsRes?.rows[0]?.total || 0),
      inactiveCoordinators: Number(inactiveCoordsRes?.rows[0]?.total || 0),
      totalPRUploads: Number(prMediaRes?.rows[0]?.count || 0),
      totalParticipants: Number(participantsRes?.rows[0]?.coalesce || participantsRes?.rows[0]?.count || 0),
      totalGames: Number(sportsRes?.rows[0]?.count || 12),
      completedResults: Number(completedResultsRes?.rows[0]?.count || 0),
      pendingResults: Number(pendingResultsRes?.rows[0]?.count || 0),
      activeAnnouncements: Number(announcementsRes?.rows[0]?.count || 0)
    };

    return res.json(stats);
  } catch (err) {
    console.error('Error fetching admin dashboard stats from DB:', err.message);
    return res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// ── Admin Audit Logs ───────────────────────────────────────────────────────
export const getAuditLogsDB = async (req, res) => {
  try {
    const { role } = req.query;
    let query = `
      SELECT 
        id,
        actor_name AS "user",
        role,
        action,
        entity AS target,
        details,
        ip_address AS ip,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
        TO_CHAR(created_at, 'HH:MI AM') AS time,
        created_at AS timestamp
      FROM audit_logs
    `;
    const params = [];
    if (role && role !== 'ALL') {
      params.push(role);
      query += ` WHERE UPPER(role) = UPPER($1) `;
    }
    query += ` ORDER BY created_at DESC LIMIT 250`;

    const dbRes = await queryDb(query, params);

    if (dbRes && dbRes.rows) {
      return res.json(dbRes.rows);
    }
  } catch (err) {
    console.error('Error fetching audit logs from DB:', err.message);
  }
  return res.json([]);
};

export const createAuditLogDB = async (req, res) => {
  const { user, role, action, target, details } = req.body;
  try {
    const actor = user || req.user?.username || 'System Administrator';
    const actorRole = role || req.user?.role || 'ADMIN';
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    await queryDb(
      `INSERT INTO audit_logs (id, actor_name, role, action, entity, details, ip_address, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, $6, CURRENT_TIMESTAMP)`,
      [actor, actorRole, action || 'System Event', target || '', JSON.stringify(details || {}), clientIp]
    );

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error creating audit log in DB:', err.message);
    return res.status(500).json({ message: 'Failed to record audit log' });
  }
};

// ── Admin Registrations Management ────────────────────────────────────────
export const getAdminRegistrationsDB = async (req, res) => {
  try {
    const dbRes = await queryDb(`
      SELECT 
        cr.id,
        cr.registration_id AS "registrationId",
        cr.event_id AS "eventId",
        cr.sport_id AS "sportId",
        cr.student_name AS "participantName",
        cr.team_name AS "teamName",
        cr.college,
        cr.department AS branch,
        '' AS "rollNumber",
        cr.email,
        cr.phone AS mobile,
        cr.gender,
        cr.emergency_contact AS "emergencyContact",
        cr.status AS "registrationStatus",
        cr.fee_paid AS "feePaid",
        cr.payment_id AS "paymentId",
        cr.payment_status AS "paymentStatus",
        cr.members_count AS "membersCount",
        cr.participant_data AS "participantData",
        COALESCE(cei.title, cr.participant_data->>'eventTitle', cr.participant_data->>'selectedEvent', cr.participant_data->>'subEvent', cr.participant_data->>'category', cr.participant_data->>'eventType', cr.participant_data->>'eventName', NULL) AS "eventTitleFromDb",
        TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', cr.created_at)), 'YYYY-MM-DD') AS "registrationDate",
        TO_CHAR(timezone('Asia/Kolkata', timezone('UTC', cr.created_at)), 'HH12:MI AM') AS "registrationTime",
        cr.created_at AS "createdAt"
      FROM college_registrations cr
      LEFT JOIN coordinator_event_items cei ON cei.id::text = cr.event_id::text
      ORDER BY cr.created_at DESC
    `);

    if (dbRes && dbRes.rows) {
      const list = dbRes.rows.map(r => {
        const sportName = (r.sportId || 'Sport').replace(/-/g, ' ').toUpperCase();
        let displayEvent = r.eventTitleFromDb;
        if (!displayEvent) {
          const isFemale = String(r.gender || '').toLowerCase().includes('female');
          const genderLabel = isFemale ? "Women's" : "Men's";
          if (sportName.includes('BADMINTON') || sportName.includes('TABLE TENNIS')) {
            displayEvent = `${sportName} (${Number(r.membersCount) === 2 ? 'Doubles' : genderLabel + ' Singles'})`;
          } else {
            displayEvent = `${sportName} Championship`;
          }
        }
        return {
          ...r,
          participantName: r.participantName || r.teamName || 'Participant',
          gameSport: sportName,
          eventTitle: displayEvent,
          category: r.membersCount > 1 ? (Number(r.membersCount) === 2 ? 'Duo' : 'Team') : 'Single',
          feePaid: Number(r.feePaid || 0),
          membersCount: Number(r.membersCount || 1)
        };
      });
      return res.json(list);
    }
  } catch (err) {
    console.error('Error fetching admin registrations from DB:', err.message);
  }
  return res.json([]);
};

export const deleteRegistrationDB = async (req, res) => {
  const { id } = req.params;
  try {
    const targetId = String(id).trim();

    // 1. Resolve associated registration_id UUIDs from college_registrations or registration_members
    const crRes = await queryDb(
      'SELECT id, registration_id FROM college_registrations WHERE id::text = $1 OR registration_id::text = $1',
      [targetId]
    ).catch(() => null);

    const regIds = new Set([targetId]);
    if (crRes && crRes.rows) {
      crRes.rows.forEach(r => {
        if (r.id) regIds.add(String(r.id));
        if (r.registration_id) regIds.add(String(r.registration_id));
      });
    }

    const memRes = await queryDb(
      'SELECT id, "registrationId" FROM registration_members WHERE id::text = $1 OR "registrationId"::text = $1',
      [targetId]
    ).catch(() => null);

    if (memRes && memRes.rows) {
      memRes.rows.forEach(m => {
        if (m.id) regIds.add(String(m.id));
        if (m.registrationId) regIds.add(String(m.registrationId));
      });
    }

    for (const rid of regIds) {
      await queryDb('DELETE FROM registration_members WHERE "registrationId"::text = $1 OR id::text = $1', [rid]);
      await queryDb('DELETE FROM college_registrations WHERE id::text = $1 OR registration_id::text = $1', [rid]);
      await queryDb('DELETE FROM registrations WHERE id::text = $1', [rid]);
    }

    logAuditEvent({
      actorName: req.user?.username || 'Admin',
      role: 'ADMIN',
      action: 'Registration Deleted',
      entity: `Deleted registration ID: ${targetId}`,
      entityId: targetId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    return res.json({ success: true, message: 'Registration and associated member records deleted from database successfully.' });
  } catch (err) {
    console.error('Error deleting registration from DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete registration from database' });
  }
};

/**
 * Single Master Data Deletion Endpoint
 * DELETE /api/admin/master-data/:id
 */
export const deleteMasterDataDB = async (req, res) => {
  const { id } = req.params;
  try {
    const targetId = String(id).trim();
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Invalid or missing participant ID' });
    }

    const regIds = new Set([targetId]);

    const crRes = await queryDb(
      'SELECT id, registration_id FROM college_registrations WHERE id::text = $1 OR registration_id::text = $1',
      [targetId]
    ).catch(() => null);

    if (crRes && crRes.rows) {
      crRes.rows.forEach(r => {
        if (r.id) regIds.add(String(r.id));
        if (r.registration_id) regIds.add(String(r.registration_id));
      });
    }

    const memRes = await queryDb(
      'SELECT id, "registrationId" FROM registration_members WHERE id::text = $1 OR "registrationId"::text = $1',
      [targetId]
    ).catch(() => null);

    if (memRes && memRes.rows) {
      memRes.rows.forEach(m => {
        if (m.id) regIds.add(String(m.id));
        if (m.registrationId) regIds.add(String(m.registrationId));
      });
    }

    for (const rid of regIds) {
      await queryDb('DELETE FROM registration_members WHERE "registrationId"::text = $1 OR id::text = $1', [rid]);
      await queryDb('DELETE FROM college_registrations WHERE id::text = $1 OR registration_id::text = $1', [rid]);
      await queryDb('DELETE FROM registrations WHERE id::text = $1', [rid]);
    }

    logAuditEvent({
      actorName: req.user?.username || 'Admin',
      role: req.user?.role || 'ADMIN',
      action: 'Master Data Participant Deleted',
      entity: `Deleted participant ID: ${targetId}`,
      entityId: targetId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    return res.json({
      success: true,
      message: 'Participant record deleted from Master Data successfully.',
      targetId
    });
  } catch (err) {
    console.error('Error deleting master data participant from DB:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete participant from Master Data', error: err.message });
  }
};

/**
 * Bulk Master Data Deletion Endpoint
 * DELETE /api/admin/master-data/bulk
 * Request body: { ids: ["id1", "id2", "id3"] }
 */
export const bulkDeleteMasterDataDB = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No participant IDs provided for bulk deletion.' });
  }

  try {
    const cleanIds = ids.map(i => String(i).trim()).filter(Boolean);
    const allTargetRegIds = new Set(cleanIds);

    for (const tid of cleanIds) {
      const crRes = await queryDb(
        'SELECT id, registration_id FROM college_registrations WHERE id::text = $1 OR registration_id::text = $1',
        [tid]
      ).catch(() => null);

      if (crRes && crRes.rows) {
        crRes.rows.forEach(r => {
          if (r.id) allTargetRegIds.add(String(r.id));
          if (r.registration_id) allTargetRegIds.add(String(r.registration_id));
        });
      }

      const memRes = await queryDb(
        'SELECT id, "registrationId" FROM registration_members WHERE id::text = $1 OR "registrationId"::text = $1',
        [tid]
      ).catch(() => null);

      if (memRes && memRes.rows) {
        memRes.rows.forEach(m => {
          if (m.id) allTargetRegIds.add(String(m.id));
          if (m.registrationId) allTargetRegIds.add(String(m.registrationId));
        });
      }
    }

    const regIdArray = Array.from(allTargetRegIds);
    for (const rid of regIdArray) {
      await queryDb('DELETE FROM registration_members WHERE "registrationId"::text = $1 OR id::text = $1', [rid]);
      await queryDb('DELETE FROM college_registrations WHERE id::text = $1 OR registration_id::text = $1', [rid]);
      await queryDb('DELETE FROM registrations WHERE id::text = $1', [rid]);
    }

    logAuditEvent({
      actorName: req.user?.username || 'Admin',
      role: req.user?.role || 'ADMIN',
      action: 'Bulk Master Data Participants Deleted',
      entity: `Bulk deleted ${cleanIds.length} participant records`,
      entityId: cleanIds.join(','),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    return res.json({
      success: true,
      message: `Successfully deleted ${cleanIds.length} records from Master Data database.`,
      requestedCount: cleanIds.length,
      deletedCount: cleanIds.length
    });
  } catch (err) {
    console.error('Error executing bulk delete in DB:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete bulk deletion in database.',
      error: err.message
    });
  }
};

export const updateRegistrationStatusDB = async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;
  try {
    if (status) {
      await queryDb('UPDATE college_registrations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id::text = $2', [status, String(id)]);
    }
    if (paymentStatus) {
      await queryDb('UPDATE college_registrations SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id::text = $2', [paymentStatus, String(id)]);
    }
    logAuditEvent({
      actorName: req.user?.username || 'Admin',
      role: 'ADMIN',
      action: 'Registration Status Updated',
      entity: `Updated registration ${id}: Status=${status || 'unchanged'}, Payment=${paymentStatus || 'unchanged'}`,
      entityId: String(id),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });
    return res.json({ success: true, message: 'Registration status updated in database successfully.' });
  } catch (err) {
    console.error('Error updating registration status in DB:', err.message);
    return res.status(500).json({ message: 'Failed to update registration status in database' });
  }
};

// ── Admin Announcements Management ───────────────────────────────────────
export const getAnnouncementsDB = async (req, res) => {
  try {
    const dbRes = await queryDb(`
      SELECT 
        id,
        title,
        description,
        COALESCE(category, 'Schedule') AS category,
        audience,
        "sportSlug" AS "sportSlug",
        TO_CHAR("publishDate", 'YYYY-MM-DD') AS "publishDate",
        TO_CHAR("expiryDate", 'YYYY-MM-DD') AS "expiryDate",
        "isPublished" AS "isPublished",
        TO_CHAR("createdAt", 'YYYY-MM-DD') AS "createdAt"
      FROM announcements
      ORDER BY "createdAt" DESC
    `);

    if (dbRes && dbRes.rows) {
      const announcements = [];
      for (const ann of dbRes.rows) {
        const attRes = await queryDb(
          `SELECT id, name, url, "mimeType" AS "mimeType", "sizeBytes" AS "sizeBytes" 
           FROM announcement_attachments WHERE "announcementId"::text = $1`,
          [String(ann.id)]
        );
        announcements.push({
          ...ann,
          date: ann.publishDate || (ann.createdAt ? new Date(ann.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          status: ann.isPublished ? 'Published' : 'Draft',
          attachments: (attRes && attRes.rows) ? attRes.rows.map(att => ({
            ...att,
            size: att.sizeBytes ? `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB'
          })) : []
        });
      }
      return res.json(announcements);
    }
  } catch (err) {
    console.error('Error fetching announcements from DB:', err.message);
  }
  return res.json([]);
};

export const saveAnnouncementDB = async (req, res) => {
  const { id, title, description, category, audience, publishDate, expiryDate, isPublished, attachments } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  try {
    let annId = id;
    const published = isPublished ?? true;
    const pDate = publishDate ? new Date(publishDate) : new Date();
    const eDate = expiryDate ? new Date(expiryDate) : null;
    const selectedCategory = category || 'Schedule';

    if (annId) {
      await queryDb(
        `UPDATE announcements 
         SET title = $1, description = $2, category = $3, audience = $4, "publishDate" = $5, "expiryDate" = $6, "isPublished" = $7, "updatedAt" = CURRENT_TIMESTAMP 
         WHERE id::text = $8`,
        [title, description, selectedCategory, audience || 'PUBLIC', pDate, eDate, published, String(annId)]
      );
    } else {
      const newAnn = await queryDb(
        `INSERT INTO announcements (id, title, description, category, audience, "publishDate", "expiryDate", "isPublished", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [title, description, selectedCategory, audience || 'PUBLIC', pDate, eDate, published]
      );
      if (newAnn && newAnn.rows && newAnn.rows.length > 0) {
        annId = newAnn.rows[0].id;
      }
    }

    if (annId && Array.isArray(attachments)) {
      await queryDb('DELETE FROM announcement_attachments WHERE "announcementId"::text = $1', [String(annId)]);
      for (const att of attachments) {
        await queryDb(
          `INSERT INTO announcement_attachments (id, "announcementId", name, url, "mimeType", "sizeBytes", "createdAt")
           VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
          [String(annId), att.name || 'Attachment.pdf', att.url || '#', att.mimeType || 'application/pdf', att.sizeBytes || 1024 * 1024]
        );
      }
    }

    return res.json({ success: true, id: annId, message: 'Announcement saved to database successfully.' });
  } catch (err) {
    console.error('Error saving announcement to DB:', err.message);
    return res.status(500).json({ message: 'Failed to save announcement to database' });
  }
};

export const toggleAnnouncementPublishDB = async (req, res) => {
  const { id } = req.params;
  try {
    await queryDb(
      `UPDATE announcements SET "isPublished" = NOT "isPublished", "updatedAt" = CURRENT_TIMESTAMP WHERE id::text = $1`,
      [String(id)]
    );
    return res.json({ success: true, message: 'Announcement publish status toggled.' });
  } catch (err) {
    console.error('Error toggling announcement publish in DB:', err.message);
    return res.status(500).json({ message: 'Failed to toggle announcement publish status' });
  }
};

export const deleteAnnouncementDB = async (req, res) => {
  const { id } = req.params;
  try {
    await queryDb('DELETE FROM announcement_attachments WHERE "announcementId"::text = $1', [String(id)]);
    await queryDb('DELETE FROM announcements WHERE id::text = $1', [String(id)]);

    return res.json({ success: true, message: 'Announcement deleted from database successfully.' });
  } catch (err) {
    console.error('Error deleting announcement from DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete announcement from database' });
  }
};

// ── Admin PR Media & Folders Management ────────────────────────────────────
export const getPRMediaFoldersDB = async (req, res) => {
  try {
    const dbRes = await queryDb(`
      SELECT 
        e.id,
        e.event_name AS title,
        e.event_name AS sport,
        TO_CHAR(e.event_date, 'YYYY-MM-DD') AS date,
        COUNT(m.id) AS "itemCount"
      FROM events e
      LEFT JOIN media m ON m.event_id = e.id
      GROUP BY e.id, e.event_name, e.event_date
      ORDER BY e.event_date DESC
    `);

    if (dbRes && dbRes.rows) {
      const folders = dbRes.rows.map(r => ({
        id: String(r.id),
        title: r.title,
        sport: r.sport || 'Sports Media',
        date: r.date || new Date().toISOString().split('T')[0],
        prMember: 'PR Desk',
        itemCount: Number(r.itemCount || 0)
      }));
      return res.json(folders);
    }
  } catch (err) {
    console.error('Error fetching PR media folders from DB:', err.message);
  }
  return res.json([]);
};

export const getPRMediaFilesDB = async (req, res) => {
  try {
    const dbRes = await queryDb(`
      SELECT 
        m.id,
        m.event_id AS "folderId",
        m.title,
        m.media_url AS url,
        m.media_type AS "mediaType",
        m.uploaded_by AS "uploaderName",
        TO_CHAR(m.uploaded_at, 'YYYY-MM-DD HH:MI AM') AS "uploadDate",
        e.event_name AS "eventTitle"
      FROM media m
      LEFT JOIN events e ON m.event_id = e.id
      ORDER BY m.uploaded_at DESC
    `);

    if (dbRes && dbRes.rows) {
      const files = dbRes.rows.map(r => ({
        id: String(r.id),
        folderId: String(r.folderId || 'general'),
        eventTitle: r.eventTitle || r.title || 'PR Media',
        sportName: r.eventTitle || 'PR Media',
        title: r.title || 'PR Photo',
        url: r.url,
        mediaType: r.mediaType ? r.mediaType.toLowerCase() : 'image',
        uploaderName: r.uploaderName || 'PR Team Member',
        uploadDate: r.uploadDate || new Date().toLocaleString()
      }));
      return res.json(files);
    }
  } catch (err) {
    console.error('Error fetching PR media files from DB:', err.message);
  }
  return res.json([]);
};

export const deletePRMediaFileDB = async (req, res) => {
  const { id } = req.params;
  try {
    const numId = Number(id) || 0;
    const existing = await queryDb('SELECT public_id, media_type FROM media WHERE id = $1', [numId]);
    if (existing && existing.rows.length > 0 && existing.rows[0].public_id) {
      deleteCloudinaryAsset(existing.rows[0].public_id, existing.rows[0].media_type || 'image').catch(() => {});
    }

    await queryDb('DELETE FROM media WHERE id = $1', [numId]);
    return res.json({ success: true, message: 'PR media file deleted from database successfully.' });
  } catch (err) {
    console.error('Error deleting PR media file from DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete PR media file from database' });
  }
};

export const deletePRFolderDB = async (req, res) => {
  const { id } = req.params;
  try {
    const numId = Number(id) || 0;

    // Purge associated Cloudinary assets
    const mediaRes = await queryDb('SELECT public_id, media_type FROM media WHERE event_id = $1', [numId]);
    const eventRes = await queryDb('SELECT public_id FROM events WHERE id = $1', [numId]);

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
      deleteCloudinaryBatch(itemsToDelete).catch(() => {});
    }

    await queryDb('DELETE FROM media WHERE event_id = $1', [numId]);
    await queryDb('DELETE FROM events WHERE id = $1', [numId]);
    return res.json({ success: true, message: 'PR folder deleted from database successfully.' });
  } catch (err) {
    console.error('Error deleting PR folder from DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete PR folder from database' });
  }
};

// ── Admin System Settings ──────────────────────────────────────────────────
export const getSettingsDB = async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'admin_portal_settings' } });
    if (setting && setting.value) {
      return res.json(setting.value);
    }
  } catch (err) {
    console.error('Error fetching system settings from DB:', err.message);
  }
  return res.json({
    maintenanceMode: false,
    allowRegistrations: true,
    currentFestYear: 2026,
    collegeName: 'Maharana Pratap Engineering College (MPEC)',
    adminEmail: 'admin.sports@mpec.ac.in',
    contactPhone: '+91 98765 00000',
    maxPdfSizeMB: 10
  });
};

export const updateSettingsDB = async (req, res) => {
  const newSettings = req.body;
  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key: 'admin_portal_settings' },
      update: { value: newSettings, updatedAt: new Date() },
      create: { key: 'admin_portal_settings', value: newSettings }
    });
    return res.json({ success: true, settings: updated.value });
  } catch (err) {
    console.error('Error updating system settings in DB:', err.message);
    return res.status(500).json({ message: 'Failed to update system settings in database' });
  }
};

// ── Admin Committee Management ────────────────────────────────────────────
export const getCommitteeDB = async (req, res) => {
  try {
    let sessions = await prisma.committeeSession.findMany({
      include: { members: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isActive: 'desc' }, { label: 'asc' }]
    });

    // Auto-seed default session if DB is empty
    if (sessions.length === 0) {
      const defaultAdvisors = [
        { name: 'Mr. Susil Kushwaha', role: 'Faculty Advisor', photoUrl: '/team/faculty_susil.jpg', type: 'ADVISOR', sortOrder: 1 },
        { name: 'Mr. Kaushal Maurya', role: 'Co-Faculty Advisor', photoUrl: '/team/faculty_kaushal.jpg', type: 'ADVISOR', sortOrder: 2 },
        { name: 'Mr. Rahul Kumar', role: 'Co-Faculty Advisor', photoUrl: '/team/faculty_rahul.jpg', type: 'ADVISOR', sortOrder: 3 },
        { name: 'Mr. Amit kr Verma', role: 'Co-Faculty Advisor', photoUrl: '/team/faculty_amit.jpg', type: 'ADVISOR', sortOrder: 4 },
        { name: 'Dr. Ajay kr Singh', role: 'Sports Coach', photoUrl: '/team/faculty_ajay.jpg', type: 'ADVISOR', sortOrder: 5 }
      ];

      const defaultExec = [
        { role: 'President', name: 'Praveen Rai', photoUrl: '/team/praveen.jpg', type: 'EXECUTIVE', sortOrder: 1 },
        { role: 'Vice President', name: 'Harsh Singh', photoUrl: '/team/harsh.jpg', type: 'EXECUTIVE', sortOrder: 2 },
        { role: 'Technical Head', name: 'Ankit Kumar Singh', photoUrl: '/team/ankit.jpg', type: 'EXECUTIVE', sortOrder: 3 },
        { role: 'Secretary', name: 'Aditya Singh', photoUrl: '/team/aditya.jpg', type: 'EXECUTIVE', sortOrder: 4 },
        { role: 'Treasurer', name: 'Shubham Tiwari', photoUrl: '/team/shubham.jpg', type: 'EXECUTIVE', sortOrder: 5 },
        { role: 'Coordinator', name: 'Gunjan Gupta', photoUrl: '/team/gunjan.jpg', type: 'EXECUTIVE', sortOrder: 6 },
        { role: 'PR Head', name: 'Vishesh Panday', photoUrl: '/team/vishesh.jpg', type: 'EXECUTIVE', sortOrder: 7 }
      ];

      const seededSession = await prisma.committeeSession.create({
        data: {
          label: '2025-26',
          isActive: true,
          members: {
            create: [...defaultAdvisors, ...defaultExec]
          }
        },
        include: { members: { orderBy: { sortOrder: 'asc' } } }
      });

      await prisma.committeeSession.create({ data: { label: '2026-27', isActive: false } }).catch(() => {});
      await prisma.committeeSession.create({ data: { label: '2027-28', isActive: false } }).catch(() => {});

      sessions = [seededSession];
    }

    const formatted = sessions.map(s => ({
      id: s.id,
      label: s.label,
      isActive: s.isActive,
      advisors: (s.members || []).filter(m => m.type === 'ADVISOR').map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        image: m.photoUrl,
        publicId: m.publicId,
        email: m.email,
        phone: m.phone,
        sortOrder: m.sortOrder
      })),
      executiveCommittee: (s.members || []).filter(m => m.type === 'EXECUTIVE').map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        image: m.photoUrl,
        publicId: m.publicId,
        email: m.email,
        phone: m.phone,
        sortOrder: m.sortOrder
      }))
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Error fetching committee from DB:', err.message);
    return res.json([]);
  }
};

export const saveSessionDB = async (req, res) => {
  const { id, label, isActive } = req.body;
  try {
    if (isActive) {
      await prisma.committeeSession.updateMany({ data: { isActive: false } });
    }

    if (id) {
      const updated = await prisma.committeeSession.update({
        where: { id },
        data: { label, isActive: Boolean(isActive) }
      });
      return res.json({ success: true, session: updated });
    }

    const created = await prisma.committeeSession.create({
      data: { label: label || 'New Session', isActive: Boolean(isActive) }
    });
    return res.status(201).json({ success: true, session: created });
  } catch (err) {
    console.error('Error saving committee session in DB:', err.message);
    return res.status(500).json({ message: 'Failed to save session to database' });
  }
};

export const deleteSessionDB = async (req, res) => {
  const { id } = req.params;
  try {
    const members = await prisma.committeeMember.findMany({ where: { sessionId: id } });
    const deleteItems = members.filter(m => m.publicId).map(m => ({ publicId: m.publicId, resourceType: 'image' }));
    if (deleteItems.length > 0) {
      deleteCloudinaryBatch(deleteItems).catch(() => {});
    }

    await prisma.committeeSession.delete({ where: { id } });
    return res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (err) {
    console.error('Error deleting committee session in DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete session from database' });
  }
};

export const saveCommitteeMemberDB = async (req, res) => {
  const { id, sessionId, type, name, role, photoUrl, image, publicId, email, phone, sortOrder } = req.body;
  try {
    const finalPhoto = photoUrl || image || null;
    const normalizedType = (type === 'advisors' || type === 'ADVISOR') ? 'ADVISOR' : 'EXECUTIVE';

    let targetSessionId = null;
    const isSessionUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId || '');
    if (isSessionUuid) {
      const found = await prisma.committeeSession.findUnique({ where: { id: sessionId } });
      if (found) targetSessionId = found.id;
    }
    if (!targetSessionId && sessionId) {
      const cleanLabel = String(sessionId).replace(/^session-/, '');
      const found = await prisma.committeeSession.findFirst({
        where: {
          OR: [
            { label: String(sessionId) },
            { label: cleanLabel }
          ]
        }
      });
      if (found) targetSessionId = found.id;
    }
    if (!targetSessionId) {
      let defaultSession = await prisma.committeeSession.findFirst({ where: { isActive: true } });
      if (!defaultSession) {
        defaultSession = await prisma.committeeSession.findFirst();
      }
      if (!defaultSession) {
        defaultSession = await prisma.committeeSession.create({
          data: { label: '2025-26', isActive: true }
        });
      }
      targetSessionId = defaultSession.id;
    }

    const isMemberUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
    if (isMemberUuid) {
      const existing = await prisma.committeeMember.findUnique({ where: { id } });
      if (existing) {
        if (existing.publicId && publicId && existing.publicId !== publicId) {
          deleteCloudinaryAsset(existing.publicId, 'image').catch(() => {});
        }

        const updated = await prisma.committeeMember.update({
          where: { id },
          data: {
            name,
            role,
            type: normalizedType,
            photoUrl: finalPhoto,
            publicId: publicId || existing.publicId || null,
            email: email || '',
            phone: phone || '',
            sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined
          }
        });
        return res.json({ success: true, member: updated });
      }
    }

    const created = await prisma.committeeMember.create({
      data: {
        sessionId: targetSessionId,
        type: normalizedType,
        name,
        role,
        photoUrl: finalPhoto,
        publicId: publicId || null,
        email: email || '',
        phone: phone || '',
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0
      }
    });
    return res.status(201).json({ success: true, member: created });
  } catch (err) {
    console.error('Error saving committee member in DB:', err.message);
    return res.status(500).json({ message: 'Failed to save committee member to database' });
  }
};

export const deleteCommitteeMemberDB = async (req, res) => {
  const { id } = req.params;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
    if (isUuid) {
      const existing = await prisma.committeeMember.findUnique({ where: { id } });
      if (existing && existing.publicId) {
        deleteCloudinaryAsset(existing.publicId, 'image').catch(() => {});
      }
      await prisma.committeeMember.delete({ where: { id } });
    }
    return res.json({ success: true, message: 'Committee member deleted successfully.' });
  } catch (err) {
    console.error('Error deleting committee member in DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete committee member from database' });
  }
};

// ── Admin Results Management ──────────────────────────────────────────────
export const getAdminResultsDB = async (req, res) => {
  try {
    const entries = await prisma.leaderboardEntry.findMany({
      orderBy: { declaredAt: 'desc' }
    });
    const results = entries.map(row => ({
      id: String(row.id),
      sportId: row.sportId,
      sportName: (row.sportId || 'Sport').replace(/-/g, ' ').toUpperCase(),
      eventTitle: row.subEvent || `${(row.sportId || 'Sport').replace(/-/g, ' ').toUpperCase()} Championship`,
      matchFormat: row.matchFormat || 'Team',
      gender: row.gender || 'Boys',
      winnerName: row.winnerName || '',
      winnerTeamName: row.winnerTeam || row.winnerName || '',
      winnerCollege: row.winnerCollege || 'MPEC',
      runnerUpName: row.runnerUpName || '',
      runnerUpTeamName: row.runnerUpTeam || row.runnerUpName || '',
      runnerUpCollege: row.runnerUpCollege || 'MIPS',
      points: Number(row.points || 10),
      status: 'COMPLETED',
      uploadedBy: 'Admin',
      uploadedDate: new Date(row.declaredAt).toISOString().split('T')[0]
    }));
    return res.json(results);
  } catch (err) {
    console.error('Error fetching admin results from DB:', err.message);
    return res.json([]);
  }
};

