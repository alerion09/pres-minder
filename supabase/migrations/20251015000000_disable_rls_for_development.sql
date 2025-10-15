-- migration: disable_rls_for_development
-- purpose: disable RLS policies on all tables for easier local development
-- rationale: simplifies testing and development by removing authentication requirements
-- affected tables: relations, occasions, ideas
-- notes:
--   - THIS IS FOR DEVELOPMENT ONLY
--   - re-enable RLS before deploying to production
--   - all existing policies remain but are not enforced when RLS is disabled

-- ============================================================================
-- disable row level security for all tables
-- ============================================================================

-- disable RLS on dictionary tables
alter table relations disable row level security;
alter table occasions disable row level security;

-- disable RLS on main tables
alter table ideas disable row level security;
