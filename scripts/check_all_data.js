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
    console.log(`🔍 Checking Master Accounts & Database State in '${process.env.PGDATABASE || 'mydb'}'...\n`);

    const prRes = await pool.query('SELECT username, role FROM pr_users');
    console.log(`👤 PR Coordinator Accounts (${prRes.rows.length}):`);
    prRes.rows.forEach(u => console.log(`   - ${u.username} (${u.role})`));
    console.log('');

    const headRes = await pool.query('SELECT username, college, faculty_name FROM college_head_users');
    console.log(`🏫 College Head Accounts (${headRes.rows.length}):`);
    headRes.rows.forEach(u => console.log(`   - ${u.username} [${u.college}] ${u.faculty_name}`));
    console.log('');

    const coordRes = await pool.query('SELECT username, assigned_sport, coordinator_name FROM sport_coordinators');
    console.log(`🏅 Sport Coordinator Accounts (${coordRes.rows.length}):`);
    coordRes.rows.forEach(u => console.log(`   - ${u.username} [${u.assigned_sport}] ${u.coordinator_name}`));
    console.log('');

    const collegeRes = await pool.query('SELECT code, name FROM colleges');
    console.log(`🏛️  Colleges Configured (${collegeRes.rows.length}):`);
    collegeRes.rows.forEach(c => console.log(`   - [${c.code}] ${c.name}`));
    console.log('');

    const sportsRes = await pool.query('SELECT name FROM sports');
    console.log(`⚽ Sports Configured (${sportsRes.rows.length}):`);
    sportsRes.rows.forEach(s => console.log(`   - ${s.name}`));
    console.log('');

    const eventsRes = await pool.query('SELECT name, year, status FROM events');
    console.log(`🏆 Events Configured (${eventsRes.rows.length}):`);
    eventsRes.rows.forEach(e => console.log(`   - ${e.name} ${e.year} [Status: ${e.status}]`));
    console.log('');

    const regRes = await pool.query('SELECT count(*) FROM college_registrations');
    console.log(`📋 Registrations Table Count: ${regRes.rows[0].count} (Clean & Ready for new registrations)`);

  } catch (err) {
    console.error('❌ Error checking database:', err.message);
  } finally {
    await pool.end();
  }
}

main();
