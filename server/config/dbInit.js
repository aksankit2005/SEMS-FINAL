import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { queryDb } from './db.js';
import { envConfig, coordinatorPasswords, headPasswords } from './env.js';

export const seedInitialAccountHashes = async () => {
  try {
    // 1. Ensure sport_coordinators table exists and has required columns
    await queryDb(`
      CREATE TABLE IF NOT EXISTS sport_coordinators (
        id TEXT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        assigned_sport VARCHAR(50) NOT NULL,
        sport_name VARCHAR(100) NOT NULL,
        coordinator_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        role VARCHAR(50) DEFAULT 'sport_coordinator',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryDb(`ALTER TABLE sport_coordinators ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '';`);
    await queryDb(`ALTER TABLE sport_coordinators ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';`);
    await queryDb(`ALTER TABLE sport_coordinators ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);

    // 2. Ensure college_head_users table exists and has required columns
    await queryDb(`
      CREATE TABLE IF NOT EXISTS college_head_users (
        id TEXT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        college VARCHAR(100) NOT NULL,
        faculty_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        role VARCHAR(50) DEFAULT 'college_head',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryDb(`ALTER TABLE college_head_users ADD COLUMN IF NOT EXISTS email VARCHAR(150) DEFAULT '';`);
    await queryDb(`ALTER TABLE college_head_users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '';`);
    await queryDb(`ALTER TABLE college_head_users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';`);
    await queryDb(`ALTER TABLE college_head_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);

    // 3. Ensure pr_users table exists and has required columns
    await queryDb(`
      CREATE TABLE IF NOT EXISTS pr_users (
        id TEXT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(150),
        email VARCHAR(150),
        role VARCHAR(50) DEFAULT 'pr_coordinator',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryDb(`ALTER TABLE pr_users ADD COLUMN IF NOT EXISTS name VARCHAR(150);`);
    await queryDb(`ALTER TABLE pr_users ADD COLUMN IF NOT EXISTS email VARCHAR(150);`);
    await queryDb(`ALTER TABLE pr_users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';`);
    await queryDb(`ALTER TABLE pr_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);



    // 5. Seed Initial Sport Coordinators if not present
    const defaultSports = [
      { username: 'coord_cricket', assignedSport: 'cricket', sportName: 'Cricket', coordinatorName: 'Vikramaditya Sharma', email: 'cricket.coord@sems.edu', pass: coordinatorPasswords['coord_cricket'] || 'cricket#2026' },
      { username: 'coord_table_tennis', assignedSport: 'table-tennis', sportName: 'Table Tennis', coordinatorName: 'Rohan Mehta', email: 'tt.coord@sems.edu', pass: coordinatorPasswords['coord_table_tennis'] || 'table_tennis#2026' },
      { username: 'coord_badminton', assignedSport: 'badminton', sportName: 'Badminton', coordinatorName: 'Pooja Deshmukh', email: 'badminton.coord@sems.edu', pass: coordinatorPasswords['coord_badminton'] || 'badminton#2026' },
      { username: 'coord_chess', assignedSport: 'chess', sportName: 'Chess', coordinatorName: 'Grandmaster Anand Verma', email: 'chess.coord@sems.edu', pass: coordinatorPasswords['coord_chess'] || 'chess#2026' },
      { username: 'coord_football', assignedSport: 'football', sportName: 'Football', coordinatorName: 'Carlos Rodriguez', email: 'football.coord@sems.edu', pass: coordinatorPasswords['coord_football'] || 'football#2026' },
      { username: 'coord_basketball', assignedSport: 'basketball', sportName: 'Basketball', coordinatorName: 'Michael Jordan Singh', email: 'basketball.coord@sems.edu', pass: coordinatorPasswords['coord_basketball'] || 'basketball#2026' },
      { username: 'coord_volleyball', assignedSport: 'volleyball', sportName: 'Volleyball', coordinatorName: 'Siddharth Rao', email: 'volleyball.coord@sems.edu', pass: coordinatorPasswords['coord_volleyball'] || 'volleyball#2026' },
      { username: 'coord_kabaddi', assignedSport: 'kabaddi', sportName: 'Kabaddi', coordinatorName: 'Pradeep Narwal Kumar', email: 'kabaddi.coord@sems.edu', pass: coordinatorPasswords['coord_kabaddi'] || 'kabaddi#2026' },
      { username: 'coord_kho_kho', assignedSport: 'kho-kho', sportName: 'Kho-Kho', coordinatorName: 'Sunita Jadhav', email: 'khokho.coord@sems.edu', pass: coordinatorPasswords['coord_kho_kho'] || 'kho_kho#2026' },
      { username: 'coord_athletics', assignedSport: 'athletics', sportName: 'Athletics', coordinatorName: 'PT Usha Pillai', email: 'athletics.coord@sems.edu', pass: coordinatorPasswords['coord_athletics'] || 'athletics#2026' },
      { username: 'coord_tug_of_war', assignedSport: 'tug-of-war', sportName: 'Tug of War', coordinatorName: 'Bheem Singh Power', email: 'tugofwar.coord@sems.edu', pass: coordinatorPasswords['coord_tug_of_war'] || 'tug_of_war#2026' },
      { username: 'coord_gully_cricket', assignedSport: 'gully-cricket', sportName: 'Gully Cricket', coordinatorName: 'Chiku Bhai', email: 'gullycricket.coord@sems.edu', pass: coordinatorPasswords['coord_gully_cricket'] || 'gully_cricket#2026' },
    ];

    for (const sc of defaultSports) {
      const existing = await queryDb('SELECT id, password_hash FROM sport_coordinators WHERE username = $1', [sc.username]);
      if (!existing || existing.rows.length === 0) {
        const hash = await bcrypt.hash(sc.pass, 10);
        const newId = crypto.randomUUID();
        await queryDb(
          `INSERT INTO sport_coordinators (id, username, password_hash, assigned_sport, sport_name, coordinator_name, email, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())`,
          [newId, sc.username, hash, sc.assignedSport, sc.sportName, sc.coordinatorName, sc.email]
        );
      } else if (existing.rows[0].password_hash) {
        const match = await bcrypt.compare(sc.pass, existing.rows[0].password_hash);
        if (!match) {
          const hash = await bcrypt.hash(sc.pass, 10);
          await queryDb('UPDATE sport_coordinators SET password_hash = $1, status = \'active\' WHERE username = $2', [hash, sc.username]);
        }
      }
    }

    // 6. Seed Initial College Heads if not present
    const defaultHeads = [
      { username: 'head_mpec', college: 'MPEC', faculty_name: 'Dr. Rajesh Sharma', pass: headPasswords['head_mpec'] || 'mpec#2026' },
      { username: 'head_mips', college: 'MIPS', faculty_name: 'Prof. Anita Verma', pass: headPasswords['head_mips'] || 'mips#2026' },
      { username: 'head_mpcps', college: 'MPCPS (KN142)', faculty_name: 'Dr. Vikram Singh', pass: headPasswords['head_mpcps'] || 'mpcps#2026' },
      { username: 'head_mpcps_bpharm', college: 'MPCPS (BPharmacy)', faculty_name: 'Dr. Sunil Kumar', pass: headPasswords['head_mpcps_bpharm'] || 'bpharmacy#2026' },
      { username: 'head_mpcp', college: 'MPCP', faculty_name: 'Prof. Sunita Gupta', pass: headPasswords['head_mpcp'] || 'mpcp#2026' },
      { username: 'head_mpdc', college: 'MPDC', faculty_name: 'Dr. Rakesh Trivedi', pass: headPasswords['head_mpdc'] || 'mpdc#2026' },
      { username: 'head_mpcnps', college: 'MPCN&PS', faculty_name: 'Prof. Meenakshi Joshi', pass: headPasswords['head_mpcnps'] || 'mpcnps#2026' },
      { username: 'head_mpamc', college: 'MPAMC', faculty_name: 'Dr. Alok Pandey', pass: headPasswords['head_mpamc'] || 'mpamc#2026' },
      { username: 'head_mpcams', college: 'MPCAMS', faculty_name: 'Prof. Sanjay Saxena', pass: headPasswords['head_mpcams'] || 'mpcams#2026' },
    ];

    for (const ch of defaultHeads) {
      const colRes = await queryDb('SELECT id FROM colleges WHERE code = $1', [ch.college]);
      const colId = (colRes && colRes.rows && colRes.rows.length > 0) ? colRes.rows[0].id : null;

      const existing = await queryDb('SELECT id FROM college_head_users WHERE username = $1', [ch.username]);
      if (!existing || existing.rows.length === 0) {
        const hash = await bcrypt.hash(ch.pass, 10);
        const newId = crypto.randomUUID();
        await queryDb(
          `INSERT INTO college_head_users (id, username, password_hash, college, college_id, faculty_name, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())`,
          [newId, ch.username, hash, ch.college, colId, ch.faculty_name]
        );
      } else if (colId) {
        await queryDb('UPDATE college_head_users SET college_id = $1 WHERE username = $2 AND college_id IS NULL', [colId, ch.username]);
      }
    }

    // 7. Seed Initial PR User if not present
    const prUserPass = envConfig.passPrAdmin || 'password123';
    const existingPR = await queryDb('SELECT id FROM pr_users WHERE username = $1', ['pr_admin']);
    if (!existingPR || existingPR.rows.length === 0) {
      const hash = await bcrypt.hash(prUserPass, 10);
      const newId = crypto.randomUUID();
      await queryDb(
        `INSERT INTO pr_users (id, username, password_hash, role, name, email, status, created_at, updated_at)
         VALUES ($1, 'pr_admin', $2, 'pr_coordinator', 'PR Administrator', 'pr.admin@sems.edu', 'active', NOW(), NOW())`,
        [newId, hash]
      );
    }

    // 8. Seed Initial Super Coordinator User if not present
    const superCoordPass = envConfig.passSuperCoord || 'super#2026';
    const existingSuper = await queryDb('SELECT id FROM pr_users WHERE username = $1', ['super_coordinator']);
    if (!existingSuper || existingSuper.rows.length === 0) {
      const hash = await bcrypt.hash(superCoordPass, 10);
      const newId = crypto.randomUUID();
      await queryDb(
        `INSERT INTO pr_users (id, username, password_hash, role, name, email, status, created_at, updated_at)
         VALUES ($1, 'super_coordinator', $2, 'super_coordinator', 'Super Coordinator (President)', 'president.sports@mpec.ac.in', 'active', NOW(), NOW())`,
        [newId, hash]
      );
    }

    console.log('✅ [Database Seed] Account checks and seeding executed safely without touching existing records.');
  } catch (err) {
    console.warn('⚠️ [Database Seed Warning] Initial account setup notice:', err.message);
  }
};

export const initDatabaseSchema = async () => {
  try {
    // 1. Ensure live_matches table and video stream columns exist
    await queryDb(`
      CREATE TABLE IF NOT EXISTS live_matches (
        id VARCHAR(100) PRIMARY KEY,
        sport_id VARCHAR(50),
        format VARCHAR(50),
        status VARCHAR(50),
        team1 VARCHAR(255),
        team2 VARCHAR(255),
        match_title VARCHAR(255),
        table_number VARCHAR(100),
        time VARCHAR(50),
        score1 INT DEFAULT 0,
        score2 INT DEFAULT 0,
        winner VARCHAR(255),
        youtube_video_id TEXT,
        stream_url TEXT,
        is_live_streaming BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist on pre-existing live_matches table
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;`);
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS stream_url TEXT;`);
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS is_live_streaming BOOLEAN DEFAULT FALSE;`);
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS details JSONB;`);
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS sets_history TEXT;`);
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS current_set INT DEFAULT 1;`);
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS sets_won1 INT DEFAULT 0;`);
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS sets_won2 INT DEFAULT 0;`);
    await queryDb(`ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await queryDb(`ALTER TABLE live_matches ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;`);
    await queryDb(`ALTER TABLE live_matches ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;`);

    // Backfill details JSONB for pre-existing rows where details IS NULL
    await queryDb(`
      UPDATE live_matches 
      SET details = jsonb_build_object(
        'setsHistory', jsonb_build_array(
          jsonb_build_object('set', 1, 'score1', COALESCE(score1, 0), 'score2', COALESCE(score2, 0), 'isLocked', false, 'winner', null),
          jsonb_build_object('set', 2, 'score1', 0, 'score2', 0, 'isLocked', false, 'winner', null),
          jsonb_build_object('set', 3, 'score1', 0, 'score2', 0, 'isLocked', false, 'winner', null),
          jsonb_build_object('set', 4, 'score1', 0, 'score2', 0, 'isLocked', false, 'winner', null),
          jsonb_build_object('set', 5, 'score1', 0, 'score2', 0, 'isLocked', false, 'winner', null)
        ),
        'currentSet', COALESCE(current_set, 1),
        'setsWon1', COALESCE(sets_won1, 0),
        'setsWon2', COALESCE(sets_won2, 0)
      ),
      sets_history = jsonb_build_array(
        jsonb_build_object('set', 1, 'score1', COALESCE(score1, 0), 'score2', COALESCE(score2, 0), 'isLocked', false, 'winner', null),
        jsonb_build_object('set', 2, 'score1', 0, 'score2', 0, 'isLocked', false, 'winner', null),
        jsonb_build_object('set', 3, 'score1', 0, 'score2', 0, 'isLocked', false, 'winner', null),
        jsonb_build_object('set', 4, 'score1', 0, 'score2', 0, 'isLocked', false, 'winner', null),
        jsonb_build_object('set', 5, 'score1', 0, 'score2', 0, 'isLocked', false, 'winner', null)
      )::text
      WHERE details IS NULL OR details = 'null'::jsonb;
    `);

    // 2. Ensure basketball_player_stats table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS basketball_player_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id TEXT NOT NULL,
        team_name TEXT NOT NULL,
        jersey_no TEXT NOT NULL,
        player_name TEXT NOT NULL,
        is_on_pitch BOOLEAN DEFAULT TRUE,
        points INT DEFAULT 0,
        fouls INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_match_team_jersey'
        ) THEN 
          ALTER TABLE basketball_player_stats 
          ADD CONSTRAINT unique_match_team_jersey UNIQUE (match_id, team_name, jersey_no);
        END IF;
      END $$;
    `);

    // 3. Ensure events and media tables exist for PR event albums & media uploads
    await queryDb(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        cover_image TEXT NOT NULL,
        public_id VARCHAR(255),
        description TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryDb(`ALTER TABLE events ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);`);
    await queryDb(`ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);
    await queryDb(`ALTER TABLE events ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;`);
    await queryDb(`ALTER TABLE events ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;`);

    await queryDb(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        media_type VARCHAR(20) NOT NULL DEFAULT 'image',
        title VARCHAR(255) NOT NULL,
        media_url TEXT NOT NULL,
        public_id VARCHAR(255),
        uploaded_by VARCHAR(255) DEFAULT 'PR Coordinator',
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryDb(`ALTER TABLE media ADD COLUMN IF NOT EXISTS event_id INTEGER;`);
    await queryDb(`ALTER TABLE media ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';`);
    await queryDb(`ALTER TABLE media ADD COLUMN IF NOT EXISTS media_url TEXT;`);
    await queryDb(`ALTER TABLE media ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);`);
    await queryDb(`ALTER TABLE media ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255) DEFAULT 'PR Coordinator';`);
    await queryDb(`ALTER TABLE media ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);

    // 4. Ensure leaderboard_entries table exists for SuperCoordinator declared points
    await queryDb(`
      CREATE TABLE IF NOT EXISTS leaderboard_entries (
        id SERIAL PRIMARY KEY,
        sport_id VARCHAR(50),
        match_format VARCHAR(50),
        gender VARCHAR(20),
        sub_event VARCHAR(100),
        winner_name VARCHAR(255),
        winner_team VARCHAR(255),
        winner_college VARCHAR(100),
        runner_up_name VARCHAR(255),
        runner_up_team VARCHAR(255),
        runner_up_college VARCHAR(100),
        points INT DEFAULT 10,
        declared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Ensure college_leaderboards table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS college_leaderboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID,
        college_id UUID,
        college_code VARCHAR(50) UNIQUE NOT NULL,
        college_name VARCHAR(255) NOT NULL,
        gold_count INT DEFAULT 0,
        silver_count INT DEFAULT 0,
        bronze_count INT DEFAULT 0,
        total_points INT DEFAULT 0,
        rank INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Ensure committee_sessions and committee_members tables exist
    await queryDb(`
      CREATE TABLE IF NOT EXISTS committee_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryDb(`
      CREATE TABLE IF NOT EXISTS committee_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES committee_sessions(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL DEFAULT 'EXECUTIVE',
        name VARCHAR(150) NOT NULL,
        role VARCHAR(150) NOT NULL,
        photo_url TEXT,
        public_id VARCHAR(255),
        email VARCHAR(150),
        phone VARCHAR(50),
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryDb(`ALTER TABLE committee_members ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);`);

    // 5. Seed user account tables and password hashes
    await seedInitialAccountHashes();

  } catch (err) {
    console.warn('Database schema auto-init error:', err.message);
  }
};
