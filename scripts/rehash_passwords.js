import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

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

// Passwords from .env
const HEAD_PASSWORDS = {
  head_mpec:   process.env.PASS_HEAD_MPEC   || 'mpec#2026',
  head_mips:   process.env.PASS_HEAD_MIPS   || 'mips#2026',
  head_mpcps:  process.env.PASS_HEAD_MPCPS  || 'mpcps#2026',
  head_mpcp:   process.env.PASS_HEAD_MPCP   || 'mpcp#2026',
  head_mpdc:   process.env.PASS_HEAD_MPDC   || 'mpdc#2026',
  head_mpcnps: process.env.PASS_HEAD_MPCNPS || 'mpcnps#2026',
  head_mpamc:  process.env.PASS_HEAD_MPAMC  || 'mpamc#2026',
  head_mpcams: process.env.PASS_HEAD_MPCAMS || 'mpcams#2026',
};

// Sport Coordinator passwords from .env
const COORD_PASSWORDS = {
  coord_cricket:       process.env.PASS_COORD_CRICKET       || 'cricket#2026',
  coord_table_tennis:  process.env.PASS_COORD_TABLE_TENNIS  || 'table_tennis#2026',
  coord_badminton:     process.env.PASS_COORD_BADMINTON     || 'badminton#2026',
  coord_chess:         process.env.PASS_COORD_CHESS         || 'chess#2026',
  coord_football:      process.env.PASS_COORD_FOOTBALL      || 'football#2026',
  coord_basketball:    process.env.PASS_COORD_BASKETBALL    || 'basketball#2026',
  coord_volleyball:    process.env.PASS_COORD_VOLLEYBALL    || 'volleyball#2026',
  coord_kabaddi:       process.env.PASS_COORD_KABADDI       || 'kabaddi#2026',
  coord_kho_kho:       process.env.PASS_COORD_KHO_KHO       || 'kho_kho#2026',
  coord_athletics:     process.env.PASS_COORD_ATHLETICS     || 'athletics#2026',
  coord_tug_of_war:    process.env.PASS_COORD_TUG_OF_WAR    || 'tug_of_war#2026',
  coord_gully_cricket: process.env.PASS_COORD_GULLY_CRICKET || 'gully_cricket#2026',
};

const SALT_ROUNDS = 10;

async function rehashCollegeHeadPasswords() {
  console.log('\n🔐 Re-hashing College Head passwords in PostgreSQL...\n');
  for (const [username, plainPassword] of Object.entries(HEAD_PASSWORDS)) {
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    const result = await pool.query(
      'UPDATE college_head_users SET password_hash = $1 WHERE LOWER(username) = $2 RETURNING username, college',
      [hash, username]
    );
    if (result.rows.length > 0) {
      const u = result.rows[0];
      console.log(`  ✅ ${u.username} (${u.college}) → hash updated`);
    } else {
      console.log(`  ⚠️  ${username} → not found in DB`);
    }
  }
}

async function rehashCoordinatorPasswords() {
  console.log('\n🔐 Re-hashing Sport Coordinator passwords in PostgreSQL...\n');
  for (const [username, plainPassword] of Object.entries(COORD_PASSWORDS)) {
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    const result = await pool.query(
      'UPDATE sport_coordinators SET password_hash = $1 WHERE LOWER(username) = $2 RETURNING username, assigned_sport',
      [hash, username]
    );
    if (result.rows.length > 0) {
      const u = result.rows[0];
      console.log(`  ✅ ${u.username} (${u.assigned_sport}) → hash updated`);
    } else {
      console.log(`  ⚠️  ${username} → not found in DB`);
    }
  }
}

async function main() {
  await rehashCollegeHeadPasswords();
  await rehashCoordinatorPasswords();
  console.log('\n✅ All password hashes updated successfully!\n');
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  pool.end();
});
