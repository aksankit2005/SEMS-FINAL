import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

// Read .env manually
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach((line) => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    const k = line.substring(0, idx).trim();
    const v = line.substring(idx + 1).trim();
    process.env[k] = v;
  }
});

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'mydb',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function run() {
  try {
    const sql = fs.readFileSync('server/schema.sql', 'utf8');
    console.log(`Connecting to PostgreSQL database '${process.env.PGDATABASE}'...`);
    await pool.query(sql);
    console.log('✅ Schema & Seed Data populated successfully!');

    const tablesRes = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log(
      '📋 Tables now present in database:',
      tablesRes.rows.map((r) => r.table_name)
    );

    const counts = await pool.query(`
      SELECT 
        (SELECT count(*) FROM college_head_users) as college_heads,
        (SELECT count(*) FROM sport_coordinators) as sport_coordinators,
        (SELECT count(*) FROM events) as events,
        (SELECT count(*) FROM pr_users) as pr_users
    `);
    console.log('📊 Row Counts in mydb:', counts.rows[0]);
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  } finally {
    await pool.end();
  }
}

run();
