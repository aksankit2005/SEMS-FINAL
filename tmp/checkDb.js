import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    console.log('Tables found:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    await pool.end();
  }
}

main();
