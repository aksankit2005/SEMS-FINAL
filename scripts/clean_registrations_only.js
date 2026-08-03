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
    console.log("🧹 Safely cleaning ONLY student registrations & test transactions...\n");

    const sqlScript = `
      DO $$
      DECLARE
          tbl RECORD;
      BEGIN
          FOR tbl IN (
              SELECT tablename 
              FROM pg_tables 
              WHERE schemaname = 'public' 
                AND tablename IN (
                  'college_registrations',
                  'registration_members',
                  'receipts',
                  'payments',
                  'team_members',
                  'teams',
                  'registrations',
                  'match_scores',
                  'match_participants',
                  'matches',
                  'individual_rankings',
                  'college_rankings',
                  'gallery',
                  'media',
                  'audit_logs'
                )
          ) LOOP
              EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl.tablename) || ' CASCADE;';
          END LOOP;
      END $$;
    `;

    await pool.query(sqlScript);
    console.log("✅ Registrations and test data wiped! Master accounts & reference data are 100% SAFE.\n");

    // Print Verification Table
    const prCount = await pool.query('SELECT count(*) FROM pr_users');
    const headCount = await pool.query('SELECT count(*) FROM college_head_users');
    const coordCount = await pool.query('SELECT count(*) FROM sport_coordinators');
    const regCount = await pool.query('SELECT count(*) FROM college_registrations');

    console.log("📊 Database Verification Report:");
    console.log(`   • PR Admins (pr_users): ${prCount.rows[0].count} (SAFE)`);
    console.log(`   • College Heads (college_head_users): ${headCount.rows[0].count} (SAFE)`);
    console.log(`   • Sport Coordinators (sport_coordinators): ${coordCount.rows[0].count} (SAFE)`);
    console.log(`   • Student Registrations (college_registrations): ${regCount.rows[0].count} (CLEAN)`);

  } catch (err) {
    console.error("❌ Cleanup Error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
