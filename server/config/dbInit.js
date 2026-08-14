import { queryDb } from './db.js';

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

    // 2. Ensure media table exists for PR media uploads
    await queryDb(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        url TEXT,
        type VARCHAR(50),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

  } catch (err) {
    console.warn('Database schema auto-init error:', err.message);
  }
};
