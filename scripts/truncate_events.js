import pg from 'pg';
import fs from 'fs';

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

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'ritik@123',
  database: process.env.PGDATABASE || 'mydb',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function main() {
  try {
    console.log("🧹 Truncating 'events' table in PostgreSQL ('mydb')...\n");

    await pool.query("TRUNCATE TABLE public.events CASCADE;");
    console.log("✅ 'events' table data cleared successfully!");

    const eventCount = await pool.query("SELECT count(*) FROM public.events;");
    console.log(`📊 Verification Count for 'events' table: ${eventCount.rows[0].count} (EMPTY ✅)\n`);

  } catch (err) {
    console.error("❌ Error clearing events table:", err.message);
  } finally {
    await pool.end();
  }
}

main();
