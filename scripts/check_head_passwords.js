import pg from 'pg';
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
console.log('College Head Users in DB:');
r.rows.forEach(u => {
  console.log(`  username: ${u.username} | college: ${u.college} | password_hash: "${u.password_hash}"`);
});
await pool.end();
