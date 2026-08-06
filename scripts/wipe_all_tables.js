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
    console.log("🔍 Fetching list of all tables in PostgreSQL schema 'public'...\n");

    // Get list of all public tables excluding _prisma_migrations
    const tablesRes = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma_migrations' ORDER BY tablename"
    );

    const tableNames = tablesRes.rows.map((r) => r.tablename);
    console.log(`📋 Found ${tableNames.length} tables in database '${process.env.PGDATABASE || 'mydb'}'.`);

    // Get initial row counts
    const initialCounts = {};
    for (const tbl of tableNames) {
      const res = await pool.query(`SELECT count(*)::int AS count FROM public.${quoteIdent(tbl)}`);
      initialCounts[tbl] = res.rows[0].count;
    }

    console.log("🧹 Truncating all data and resetting identity sequences...\n");

    // Execute safe TRUNCATE ... RESTART IDENTITY CASCADE on all tables
    const truncateQuery = `
      DO $$
      DECLARE
          tbl RECORD;
      BEGIN
          FOR tbl IN (
              SELECT tablename 
              FROM pg_tables 
              WHERE schemaname = 'public' 
                AND tablename NOT LIKE '_prisma_migrations'
          ) LOOP
              EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl.tablename) || ' RESTART IDENTITY CASCADE;';
          END LOOP;
      END $$;
    `;

    await pool.query(truncateQuery);

    // Get verification row counts
    const finalCounts = {};
    for (const tbl of tableNames) {
      const res = await pool.query(`SELECT count(*)::int AS count FROM public.${quoteIdent(tbl)}`);
      finalCounts[tbl] = res.rows[0].count;
    }

    console.log("=========================================================================================");
    console.log("                          COMPLETE DATABASE CLEANUP REPORT                               ");
    console.log("=========================================================================================");
    console.log(pad("Table Name", 30) + " | " + pad("Initial Rows", 15) + " | " + pad("Verification Count", 20));
    console.log("-----------------------------------------------------------------------------------------");

    let totalDeleted = 0;
    let allZero = true;

    for (const tbl of tableNames) {
      const init = initialCounts[tbl];
      const final = finalCounts[tbl];
      totalDeleted += init;
      if (final !== 0) allZero = false;

      console.log(pad(tbl, 30) + " | " + pad(String(init), 15) + " | " + pad(`${final} (EMPTY ✅)`, 20));
    }

    console.log("-----------------------------------------------------------------------------------------");
    console.log(`Total Tables Processed: ${tableNames.length}`);
    console.log(`Total Rows Deleted:     ${totalDeleted}`);
    console.log(`Verification Status:    ${allZero ? "ALL TABLES 100% EMPTY ✅" : "WARNING: Some tables are not empty ❌"}`);
    console.log("=========================================================================================\n");

  } catch (err) {
    console.error("❌ Cleanup Error:", err.message);
  } finally {
    await pool.end();
  }
}

function quoteIdent(name) {
  return '"' + name.replace(/"/g, '""') + '"';
}

function pad(str, len) {
  return str.padEnd(len, ' ');
}

main();
