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
    console.log("🧹 Clearing all participant & registration data for Badminton from PostgreSQL...\n");

    // 1. Delete from college_registrations
    const res1 = await pool.query(
      "DELETE FROM college_registrations WHERE LOWER(sport_id) LIKE '%badminton%' OR LOWER(id) LIKE '%badminton%'"
    );
    console.log(`✅ Deleted ${res1.rowCount} row(s) from 'college_registrations' table.`);

    // 2. Delete from relational registrations
    const res2 = await pool.query(`
      DELETE FROM registrations 
      WHERE "sportId" IN (
        SELECT id FROM sports WHERE LOWER(name) LIKE '%badminton%'
      )
    `);
    console.log(`✅ Deleted ${res2.rowCount} row(s) from 'registrations' table.`);

    // 3. Verification count for badminton
    const check1 = await pool.query("SELECT count(*) FROM college_registrations WHERE LOWER(sport_id) LIKE '%badminton%'");
    console.log(`\n📊 Badminton Registrations Remaining: ${check1.rows[0].count} (CLEAN ✅)\n`);

  } catch (err) {
    console.error("❌ Error clearing badminton data:", err.message);
  } finally {
    await pool.end();
  }
}

main();
