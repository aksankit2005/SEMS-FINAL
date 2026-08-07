-- ============================================================
-- SAFE FULL DATABASE DATA WIPE SCRIPT FOR POSTGRESQL & PRISMA
-- ============================================================
-- Objective: Truncate ALL data from ALL tables in schema 'public',
-- reset all auto-increment/identity sequences back to 1, and
-- preserve all table structures, foreign keys, constraints, and indexes.

DO $$
DECLARE
    tbl RECORD;
BEGIN
    -- Loop through all tables in public schema (excluding migration metadata if any)
    FOR tbl IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename NOT LIKE '_prisma_migrations'
    ) LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl.tablename) || ' RESTART IDENTITY CASCADE;';
    END LOOP;
END $$;

-- VERIFICATION REPORT QUERY
SELECT 
    schemaname,
    relname AS table_name,
    n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
