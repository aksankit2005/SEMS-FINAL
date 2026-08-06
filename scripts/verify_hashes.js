import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'ritik@123',
  database: process.env.PGDATABASE || 'mydb',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

const r = await pool.query('SELECT username, password_hash, college FROM college_head_users ORDER BY id');
console.log('Checking College Head passwords...\n');
for (const u of r.rows) {
  const plainPwd = u.username.split('_').slice(1).join('_') + '#2026'; // e.g., "mpec#2026"
  const match = await bcrypt.compare(plainPwd, u.password_hash);
  console.log(`  ${u.username} (${u.college}): testing "${plainPwd}" → ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
}
await pool.end();
