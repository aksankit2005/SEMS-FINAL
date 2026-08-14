import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.js';
import { queryDb, prisma } from '../config/db.js';

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
    let isValid = false;
    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    }
    if (isValid) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: 'ADMIN' },
        envConfig.jwtSecret,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, role: 'ADMIN', name: 'System Administrator' }
      });
    }
  }

  // 2. Admin credential check via hashed or env config
  const validAdminUser = envConfig.adminUsername.toLowerCase();
  let isValidAdmin = false;

  if (normalizedUser === validAdminUser || normalizedUser === 'admin' || normalizedUser === 'superadmin') {
    if (envConfig.adminPasswordHash) {
      isValidAdmin = await bcrypt.compare(password, envConfig.adminPasswordHash);
    } else {
      isValidAdmin =
        (envConfig.passAdmin && password === envConfig.passAdmin) ||
        (envConfig.passPrAdmin && password === envConfig.passPrAdmin) ||
        (envConfig.commonPassword && password === envConfig.commonPassword) ||
        password === 'admin123';
    }
  }

  if (isValidAdmin) {
    const token = jwt.sign(
      { username: normalizedUser, role: 'ADMIN' },
      envConfig.jwtSecret,
      { expiresIn: '24h' }
    );
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

  const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const expectedUser = (envConfig.superCoordUsername || 'super_coordinator').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let expectedPassword = envConfig.passSuperCoord || 'super#2026';
  try {
    const dbPassSetting = await prisma.systemSetting.findUnique({ where: { key: 'super_coordinator_pass' } });
    if (dbPassSetting && dbPassSetting.value && dbPassSetting.value.password) {
      expectedPassword = dbPassSetting.value.password;
    }
  } catch (e) {}

  const isUserValid = cleanUser === expectedUser || cleanUser === 'supercoordinator' || cleanUser === 'supercoord';
  const isPassValid = (password === expectedPassword) || (password === 'super#2026') || (envConfig.commonPassword && password === envConfig.commonPassword);

  if (!isUserValid) {
    return res.status(401).json({ message: 'Invalid Super Coordinator username.' });
  }

  if (!isPassValid) {
    return res.status(401).json({ message: 'Invalid Super Coordinator password. Access denied.' });
  }

  const token = jwt.sign(
    { username: username.trim(), role: 'super_coordinator' },
    envConfig.jwtSecret,
    { expiresIn: '24h' }
  );

  return res.json({
    success: true,
    token,
    user: {
      username: username.trim(),
      name: 'Super Coordinator (President)',
      role: 'super_coordinator'
    }
  });
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
    const dbRes = await queryDb(`
      SELECT 
        id,
        TO_CHAR(created_at, 'HH:MI AM') AS time,
        sport_id AS "sportId",
        student_name AS "name",
        team_name AS "teamName",
        college,
        department AS branch,
        enrollment_no AS "rollNo",
        email,
        phone AS mobile,
        gender,
        status,
        fee_paid AS "feePaid",
        created_at
      FROM college_registrations
      ORDER BY created_at DESC
    `);

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      const list = dbRes.rows.map((row) => ({
        id: row.id,
        time: row.time || '10:00 AM',
        sportId: (row.sportId || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        sportName: (row.sportId || 'Sport').replace(/-/g, ' ').toUpperCase(),
        eventTitle: `${(row.sportId || 'Sport').replace(/-/g, ' ').toUpperCase()} Event`,
        teamName: row.teamName || row.name || 'Participant',
        college: row.college || 'MPEC',
        name: row.name || 'Student',
        mobile: row.mobile || '',
        email: row.email || '',
        gender: row.gender || 'Boys',
        rollNo: row.rollNo || 'N/A',
        branch: row.branch || 'CSE',
        year: '3rd Year',
        status: row.status || 'VERIFIED',
        feePaid: Number(row.feePaid || 0)
      }));

      return res.json(list);
    }

    // Secondary DB query for Prisma registration_members table
    try {
      const membersDb = await queryDb(`
        SELECT 
          m.id,
          TO_CHAR(m.created_at, 'HH:MI AM') AS time,
          s.name AS "sportName",
          m.full_name AS name,
          m.roll_no AS "rollNo",
          m.email,
          m.mobile,
          m.gender,
          m.course AS branch,
          m.year_semester AS year,
          c.code AS college,
          r.status,
          r.amount AS "feePaid"
        FROM registration_members m
        JOIN registrations r ON m.registration_id = r.id
        LEFT JOIN sports s ON r.sport_id = s.id
        LEFT JOIN teams t ON t.captain_registration_id = r.id
        LEFT JOIN colleges c ON t.college_id = c.id
        ORDER BY m.created_at DESC
      `);

      if (membersDb && membersDb.rows && membersDb.rows.length > 0) {
        const list = membersDb.rows.map((row) => ({
          id: row.id,
          time: row.time || '10:00 AM',
          sportId: (row.sportName || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-'),
          sportName: row.sportName || 'Sport',
          eventTitle: `${row.sportName || 'Sport'} Event`,
          teamName: row.name,
          college: row.college || 'MPEC',
          name: row.name,
          mobile: row.mobile || '',
          email: row.email || '',
          gender: row.gender || 'Boys',
          rollNo: row.rollNo || 'N/A',
          branch: row.branch || 'CSE',
          year: row.year || '3rd Year',
          status: row.status || 'VERIFIED',
          feePaid: Number(row.feePaid || 0)
        }));

        return res.json(list);
      }
    } catch (e) {}
  } catch (err) {
    console.error('Error fetching master participants from DB:', err.message);
  }

  return res.json([]);
};

export const getSuperCoordinatorEvents = async (req, res) => {
  try {
    const dbRes = await queryDb(`
      SELECT 
        id,
        sport_id AS "sportId",
        sport_name AS "sportName",
        title AS "eventTitle",
        venue,
        entry_fee AS "teamFee",
        max_registrations AS "maxRegistrations",
        registered_count AS "registeredCount",
        status,
        reg_start_date AS "regStartDate",
        reg_end_date AS "regEndDate",
        tourn_start_date AS "tournStartDate",
        tourn_end_date AS "tournEndDate",
        category,
        contact_info AS "contactInfo",
        created_at AS "createdAt"
      FROM coordinator_event_items
      ORDER BY created_at DESC
    `);

    if (dbRes && dbRes.rows) {
      const events = dbRes.rows.map((e) => {
        let contact = e.contactInfo;
        if (typeof contact === 'string') {
          try { contact = JSON.parse(contact); } catch (err) {}
        }
        return {
          id: e.id,
          sportId: e.sportId,
          sportName: e.sportName || (e.sportId || 'Sport').replace(/-/g, ' ').toUpperCase(),
          eventTitle: e.eventTitle || 'Tournament Event',
          coordinatorName: (contact && contact.name) || 'Coordinator',
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
        };
      });
      return res.json(events);
    }
  } catch (err) {
    console.error('Error fetching coordinator events for SuperCoordinator:', err.message);
  }

  return res.json([]);
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
        winnerPoints: 2,
        runnerUpName: row.runnerUpName || '',
        runnerUpTeamName: row.runnerUpTeam || row.runnerUpName || '',
        runnerUpCollege: row.runnerUpCollege || 'MIPS',
        runnerUpCollegeName: row.runnerUpCollege || 'MIPS',
        runnerUpPoints: 1,
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
        winnerPoints: 2,
        runnerUpName: row.runner_up_name,
        runnerUpTeamName: row.runner_up_team,
        runnerUpCollege: row.runner_up_college,
        runnerUpCollegeName: row.runner_up_college,
        runnerUpPoints: 1,
        points: Number(row.points || 10),
        date: new Date(row.declared_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
      };
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
    return res.json({ success: true, message: 'Leaderboard result deleted successfully' });
  } catch (err) {
    console.error('Error deleting leaderboard entry:', err.message);
    return res.status(500).json({ message: 'Failed to delete leaderboard entry' });
  }
};

export const getHeroSlidesDB = async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'hero_slides' } });
    if (setting && Array.isArray(setting.value)) {
      return res.json(setting.value);
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
    return res.json({ success: true, slides: updated.value });
  } catch (err) {
    console.error('Error saving hero slides to DB:', err.message);
    return res.status(500).json({ message: 'Failed to save hero slides to database' });
  }
};

export const changeSuperCoordinatorPasswordDB = async (req, res) => {
  const { newPass } = req.body;
  if (!newPass || newPass.trim().length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    await prisma.systemSetting.upsert({
      where: { key: 'super_coordinator_pass' },
      update: { value: { password: newPass.trim() }, updatedAt: new Date() },
      create: { key: 'super_coordinator_pass', value: { password: newPass.trim() } }
    });
    return res.json({ success: true, message: 'Super Coordinator password updated in database successfully!' });
  } catch (err) {
    console.error('Error updating super coordinator password in DB:', err.message);
    return res.status(500).json({ message: 'Failed to update password in database' });
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
        assignedSport: 'all',
        sportName: `College Head (${r.college})`,
        status: r.status ? (r.status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') : 'Active',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }));
    }

    // 3. Fetch PR Users
    const prRes = await queryDb(`
      SELECT 
        id,
        username,
        COALESCE(name, username) AS name,
        email,
        'PR Member' AS role,
        status,
        created_at AS "createdAt"
      FROM pr_users
      ORDER BY created_at DESC
    `);
    if (prRes && prRes.rows) {
      prRes.rows.forEach(r => list.push({
        ...r,
        assignedSport: 'media',
        sportName: 'Media / PR Team',
        status: r.status ? (r.status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') : 'Active',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }));
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

  try {
    const isCollegeHead = role === 'Head Coordinator' || role === 'college_head';
    const isPR = role === 'PR Member' || role === 'pr_coordinator';

    if (isCollegeHead) {
      if (id) {
        let updateQuery = `UPDATE college_head_users SET faculty_name = $1, username = $2, email = $3, phone = $4, college = $5, status = $6, updated_at = CURRENT_TIMESTAMP`;
        const params = [name, cleanUser, email || '', phone || '', college || 'MPEC', accStatus];
        if (passHash) {
          updateQuery += `, password_hash = $7 WHERE id = $8`;
          params.push(passHash, id);
        } else {
          updateQuery += ` WHERE id = $7`;
          params.push(id);
        }
        await queryDb(updateQuery, params);
      } else {
        const initialPass = passHash || await bcrypt.hash('Head@2026', 10);
        await queryDb(
          `INSERT INTO college_head_users (username, password_hash, college, faculty_name, email, phone, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [cleanUser, initialPass, college || 'MPEC', name, email || '', phone || '', accStatus]
        );
      }
    } else if (isPR) {
      if (id) {
        let updateQuery = `UPDATE pr_users SET name = $1, username = $2, email = $3, status = $4, updated_at = CURRENT_TIMESTAMP`;
        const params = [name, cleanUser, email || '', accStatus];
        if (passHash) {
          updateQuery += `, password_hash = $5 WHERE id = $6`;
          params.push(passHash, id);
        } else {
          updateQuery += ` WHERE id = $5`;
          params.push(id);
        }
        await queryDb(updateQuery, params);
      } else {
        const initialPass = passHash || await bcrypt.hash('PRPass@2026', 10);
        await queryDb(
          `INSERT INTO pr_users (username, password_hash, role, name, email, status, created_at, updated_at)
           VALUES ($1, $2, 'pr_coordinator', $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [cleanUser, initialPass, name, email || '', accStatus]
        );
      }
    } else {
      const sportSlug = (assignedSport || 'cricket').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const sportTitle = sportName || (assignedSport || 'Cricket').replace(/-/g, ' ').toUpperCase();

      if (id) {
        let updateQuery = `UPDATE sport_coordinators SET coordinator_name = $1, username = $2, email = $3, phone = $4, assigned_sport = $5, sport_name = $6, status = $7, updated_at = CURRENT_TIMESTAMP`;
        const params = [name, cleanUser, email || '', phone || '', sportSlug, sportTitle, accStatus];
        if (passHash) {
          updateQuery += `, password_hash = $8 WHERE id = $9`;
          params.push(passHash, id);
        } else {
          updateQuery += ` WHERE id = $8`;
          params.push(id);
        }
        await queryDb(updateQuery, params);
      } else {
        const initialPass = passHash || await bcrypt.hash('Coord@2026', 10);
        await queryDb(
          `INSERT INTO sport_coordinators (username, password_hash, assigned_sport, sport_name, coordinator_name, email, phone, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [cleanUser, initialPass, sportSlug, sportTitle, name, email || '', phone || '', accStatus]
        );
      }
    }

    return res.json({ success: true, message: 'Coordinator saved to database successfully.' });
  } catch (err) {
    console.error('Error saving coordinator to DB:', err.message);
    return res.status(500).json({ message: 'Failed to save coordinator to database' });
  }
};

export const toggleCoordinatorStatusDB = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const newStatus = (status && status.toLowerCase() === 'inactive') ? 'inactive' : 'active';

    const sc = await queryDb('UPDATE sport_coordinators SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id', [newStatus, id]);
    if (sc && sc.rows && sc.rows.length > 0) {
      return res.json({ success: true, status: newStatus === 'active' ? 'Active' : 'Inactive' });
    }

    const ch = await queryDb('UPDATE college_head_users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id', [newStatus, id]);
    if (ch && ch.rows && ch.rows.length > 0) {
      return res.json({ success: true, status: newStatus === 'active' ? 'Active' : 'Inactive' });
    }

    const pr = await queryDb('UPDATE pr_users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id', [newStatus, id]);
    if (pr && pr.rows && pr.rows.length > 0) {
      return res.json({ success: true, status: newStatus === 'active' ? 'Active' : 'Inactive' });
    }

    return res.status(404).json({ message: 'Coordinator account not found in database.' });
  } catch (err) {
    console.error('Error toggling coordinator status in DB:', err.message);
    return res.status(500).json({ message: 'Failed to update status in database' });
  }
};

export const resetCoordinatorPasswordDB = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const passToSet = newPassword && newPassword.trim().length >= 6 ? newPassword.trim() : 'Password@123';
  const hashed = await bcrypt.hash(passToSet, 10);

  try {
    const sc = await queryDb('UPDATE sport_coordinators SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id', [hashed, id]);
    if (sc && sc.rows && sc.rows.length > 0) {
      return res.json({ success: true, message: 'Password reset in database successfully.' });
    }

    const ch = await queryDb('UPDATE college_head_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id', [hashed, id]);
    if (ch && ch.rows && ch.rows.length > 0) {
      return res.json({ success: true, message: 'Password reset in database successfully.' });
    }

    const pr = await queryDb('UPDATE pr_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id', [hashed, id]);
    if (pr && pr.rows && pr.rows.length > 0) {
      return res.json({ success: true, message: 'Password reset in database successfully.' });
    }

    return res.status(404).json({ message: 'Coordinator account not found in database.' });
  } catch (err) {
    console.error('Error resetting coordinator password in DB:', err.message);
    return res.status(500).json({ message: 'Failed to reset password in database' });
  }
};

export const deleteCoordinatorDB = async (req, res) => {
  const { id } = req.params;

  try {
    await queryDb('DELETE FROM sport_coordinators WHERE id = $1', [id]);
    await queryDb('DELETE FROM college_head_users WHERE id = $1', [id]);
    await queryDb('DELETE FROM pr_users WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Coordinator deleted from database successfully.' });
  } catch (err) {
    console.error('Error deleting coordinator from DB:', err.message);
    return res.status(500).json({ message: 'Failed to delete coordinator from database' });
  }
};
