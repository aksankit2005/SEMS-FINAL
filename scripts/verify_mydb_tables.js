import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'ritik@123',
  database: 'mydb',
  port: 5432,
});

async function main() {
  try {
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log(`✅ Total Tables in database 'mydb': ${res.rows.length}\n`);
    console.log('📋 Table List:');
    res.rows.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.table_name}`);
    });

    const heads = await pool.query('SELECT count(*) FROM college_head_users');
    const coords = await pool.query('SELECT count(*) FROM sport_coordinators');
    const prs = await pool.query('SELECT count(*) FROM pr_users');
    const colleges = await pool.query('SELECT count(*) FROM colleges');

    console.log('\n📊 Authentication & User Data Counts:');
    console.log(`   • College Heads (college_head_users): ${heads.rows[0].count}`);
    console.log(`   • Sport Coordinators (sport_coordinators): ${coords.rows[0].count}`);
    console.log(`   • PR Admins (pr_users): ${prs.rows[0].count}`);
    console.log(`   • Colleges (colleges): ${colleges.rows[0].count}`);
  } catch (err) {
    console.error('Error verifying tables:', err.message);
  } finally {
    await pool.end();
  }
}

main();
