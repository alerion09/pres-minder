-- migration: create_gift_ideas_schema
-- purpose: create complete database schema for PresMinder MVP including:
--   - dictionary tables (relations, occasions)
--   - main ideas table
--   - custom enum type (idea_source)
--   - performance indexes
--   - row level security policies
--   - triggers for automatic timestamp updates
--   - initial seed data for dictionaries
-- affected tables: relations, occasions, ideas
-- notes:
--   - enables RLS on all tables for security
--   - uses auth.users from supabase auth for user management
--   - implements cascade delete for user data and set null for dictionary references

-- ============================================================================
-- 1. custom types
-- ============================================================================

-- enum type for tracking the origin of gift ideas
-- values:
--   - 'manual': user-created idea from scratch
--   - 'ai': ai-generated idea accepted without modifications
--   - 'edited-ai': ai-generated idea that was subsequently modified by user
create type idea_source as enum ('manual', 'ai', 'edited-ai');

-- ============================================================================
-- 2. dictionary tables
-- ============================================================================

-- relations table: predefined relationship types between user and gift recipient
-- this is a dictionary table with common relationship categories
-- examples: friend, parent, sibling, partner, colleague, child, grandparent
create table relations (
  id bigserial primary key,
  name text not null unique
);

-- enable row level security on relations table
-- even though this is a read-only dictionary, rls must be enabled per security requirements
alter table relations enable row level security;

-- occasions table: predefined occasions for gift-giving
-- this is a dictionary table with common occasion categories
-- examples: birthday, anniversary, wedding, christmas, graduation
create table occasions (
  id bigserial primary key,
  name text not null unique
);

-- enable row level security on occasions table
-- even though this is a read-only dictionary, rls must be enabled per security requirements
alter table occasions enable row level security;

-- ============================================================================
-- 3. main tables
-- ============================================================================

-- ideas table: stores all gift ideas created by users
-- this is the core table of the application
-- each idea is owned by a user and may reference dictionary tables for categorization
create table ideas (
  -- primary key and ownership
  id bigserial primary key,
  user_id uuid not null,

  -- core idea information
  name text not null check (length(name) > 1),  -- minimum 2 characters required
  content text not null,  -- main description of the gift idea

  -- recipient information (all optional)
  age integer check (age > 0 and age <= 500),  -- valid age range: 1-500 years
  interests text,
  person_description text,

  -- budget constraints (optional)
  -- both values must be non-negative
  -- budget_max must be >= budget_min when both are specified
  budget_min numeric check (budget_min >= 0),
  budget_max numeric check (budget_max >= 0 and (budget_min is null or budget_max >= budget_min)),

  -- categorization via foreign keys
  -- set null on delete: removing a dictionary entry doesn't delete ideas
  relation_id bigint,
  occasion_id bigint,

  -- metadata
  source idea_source not null default 'manual',  -- tracks origin of the idea
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- foreign key constraints
  constraint fk_ideas_user
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,  -- deleting user removes all their ideas

  constraint fk_ideas_relation
    foreign key (relation_id)
    references relations(id)
    on delete set null,  -- removing relation category preserves ideas

  constraint fk_ideas_occasion
    foreign key (occasion_id)
    references occasions(id)
    on delete set null  -- removing occasion category preserves ideas
);

-- enable row level security on ideas table
-- this ensures users can only access their own ideas
alter table ideas enable row level security;

-- ============================================================================
-- 4. performance indexes
-- ============================================================================

-- composite index for user's chronological idea list
-- optimizes the most common query: fetching all ideas for a user sorted by creation date
-- supports efficient pagination and index-only scans
create index idx_ideas_user_created on ideas(user_id, created_at desc);

-- partial index for relation filtering
-- only indexes rows where relation_id is not null to save space
-- optimizes queries filtering by relationship type
create index idx_ideas_relation on ideas(relation_id) where relation_id is not null;

-- partial index for occasion filtering
-- only indexes rows where occasion_id is not null to save space
-- optimizes queries filtering by occasion type
create index idx_ideas_occasion on ideas(occasion_id) where occasion_id is not null;

-- index for source filtering
-- optimizes queries filtering by idea origin (manual, ai, edited-ai)
-- useful for analytics and filtering by creation method
create index idx_ideas_source on ideas(source);

-- ============================================================================
-- 5. row level security policies
-- ============================================================================

-- rls policies for relations table (dictionary)
-- allow all authenticated users to read relation types
-- no insert/update/delete allowed (managed by administrators only)

-- policy: authenticated users can select all relations
-- rationale: relations are a shared dictionary needed by all users
create policy "authenticated users can view relations"
  on relations
  for select
  to authenticated
  using (true);

-- rls policies for occasions table (dictionary)
-- allow all authenticated users to read occasion types
-- no insert/update/delete allowed (managed by administrators only)

-- policy: authenticated users can select all occasions
-- rationale: occasions are a shared dictionary needed by all users
create policy "authenticated users can view occasions"
  on occasions
  for select
  to authenticated
  using (true);

-- rls policies for ideas table (user data)
-- users can perform all crud operations only on their own ideas
-- each policy checks that auth.uid() matches the idea's user_id

-- policy: users can select only their own ideas
-- rationale: gift ideas contain personal information and should be private
-- note: (select auth.uid()) is used instead of auth.uid() for better performance
--       this prevents re-evaluation of the function for each row
create policy "users can view their own ideas"
  on ideas
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- policy: users can insert ideas only for themselves
-- rationale: prevents users from creating ideas attributed to other users
-- note: (select auth.uid()) is used instead of auth.uid() for better performance
create policy "users can insert their own ideas"
  on ideas
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- policy: users can update only their own ideas
-- rationale: prevents unauthorized modification of other users' data
-- both using and with check clauses ensure user_id cannot be changed to another user
-- note: (select auth.uid()) is used instead of auth.uid() for better performance
create policy "users can update their own ideas"
  on ideas
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- policy: users can delete only their own ideas
-- rationale: prevents unauthorized deletion of other users' data
-- note: (select auth.uid()) is used instead of auth.uid() for better performance
create policy "users can delete their own ideas"
  on ideas
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- 6. triggers
-- ============================================================================

-- function: automatically update the updated_at timestamp
-- this function is called by trigger before any update operation
-- ensures updated_at always reflects the last modification time
create or replace function update_updated_at_column()
returns trigger
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- trigger: auto-update updated_at on ideas table
-- fires before every update operation on the ideas table
-- maintains accurate modification timestamps without application-level logic
create trigger update_ideas_updated_at
  before update on ideas
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 7. initial seed data
-- ============================================================================

-- seed data for relations dictionary
-- common relationship types between user and gift recipient
-- these provide default options in the application ui
insert into relations (name) values
  ('friend'),
  ('parent'),
  ('sibling'),
  ('partner'),
  ('colleague'),
  ('child'),
  ('grandparent'),
  ('other');

-- seed data for occasions dictionary
-- common gift-giving occasions
-- these provide default options in the application ui
insert into occasions (name) values
  ('birthday'),
  ('anniversary'),
  ('wedding'),
  ('christmas'),
  ('valentines_day'),
  ('graduation'),
  ('baby_shower'),
  ('housewarming'),
  ('other');