import pg from 'pg';
import fs from 'fs';

// Read .env
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach((line) => {
    const idx = line.indexOf('=');
    if (idx > 0 && !line.startsWith('#')) {
      const k = line.substring(0, idx).trim();
      const v = line.substring(idx + 1).trim();
      process.env[k] = v;
    }
  });
}

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
const isLocal = !databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: isLocal ? false : { rejectUnauthorized: false },
      }
    : {
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: parseInt(process.env.PGPORT || '5432', 10),
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
      }
);

async function main() {
  try {
    console.log(`Connecting to PostgreSQL database '${process.env.PGDATABASE || 'mydb'}'...`);
    const sql = fs.readFileSync('scripts/cleanup_dummy_data.sql', 'utf8');
    
    await pool.query(sql);
    console.log('✅ Safe Database Cleanup Executed Successfully!\n');

    const regCount = await pool.query('SELECT count(*) FROM college_registrations');
    const prCount = await pool.query('SELECT count(*) FROM pr_users');
    const headCount = await pool.query('SELECT count(*) FROM college_head_users');
    const coordCount = await pool.query('SELECT count(*) FROM sport_coordinators');

    console.log('📊 Master Data & User Account Counts in mydb:');
    console.log(`   • Student Registrations (college_registrations): ${regCount.rows[0].count} (CLEAN)`);
    console.log(`   • PR Admins (pr_users): ${prCount.rows[0].count} (SAFE)`);
    console.log(`   • College Heads (college_head_users): ${headCount.rows[0].count} (SAFE)`);
    console.log(`   • Sport Coordinators (sport_coordinators): ${coordCount.rows[0].count} (SAFE)`);

  } catch (err) {
    console.error('❌ Error executing cleanup:', err.message);
  } finally {
    await pool.end();
  }
}

main();
