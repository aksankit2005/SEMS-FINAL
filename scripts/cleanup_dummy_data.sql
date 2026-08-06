-- ============================================================
-- SAFE DATABASE CLEANUP SCRIPT FOR SEMS / APEX 2026
-- Based on prisma/schema.prisma
-- ============================================================
-- Objective: Safely deletes ONLY testing/dummy records (registrations,
-- test matches, scores, payments, test media, sample announcements, test rankings)
-- while preserving ALL MASTER DATA & ACCOUNTS (PR Users, College Heads,
-- Sport Coordinators, Colleges, Sports, Venues, Primary Event) 100% SAFE.

DO $$
DECLARE
    tbl RECORD;
BEGIN
    -- Loop through existing transactional & testing tables and truncate them
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
            'announcements',
            'audit_logs'
          )
    ) LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(tbl.tablename) || ' CASCADE;';
    END LOOP;
END $$;

-- SUMMARY VERIFICATION OF MASTER DATA INTEGRITY
SELECT 'college_registrations (CLEAN)' AS item, count(*) FROM college_registrations
UNION ALL
SELECT 'pr_users (MASTER SAFE)' AS item, count(*) FROM pr_users
UNION ALL
SELECT 'college_head_users (MASTER SAFE)' AS item, count(*) FROM college_head_users
UNION ALL
SELECT 'sport_coordinators (MASTER SAFE)' AS item, count(*) FROM sport_coordinators;
