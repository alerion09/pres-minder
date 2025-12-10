-- migration: initial_schema
-- purpose: create complete database schema for PresMinder
-- affected tables: relations, occasions, ideas
-- notes:
--   - creates dictionary tables with code and name columns from the start
--   - includes all relations with proper gender distinctions
--   - includes all occasions including Polish-specific ones
--   - enables RLS on all tables but disables for development
--   - uses auth.users from supabase auth for user management

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
create table relations (
  id bigserial primary key,
  code varchar(50) not null unique,
  name text not null unique
);

-- occasions table: predefined occasions for gift-giving
create table occasions (
  id bigserial primary key,
  code varchar(50) not null unique,
  name text not null unique
);

-- enable row level security on dictionary tables
alter table relations enable row level security;
alter table occasions enable row level security;

-- ============================================================================
-- 3. main tables
-- ============================================================================

-- ideas table: stores all gift ideas created by users
create table ideas (
  -- primary key and ownership
  id bigserial primary key,
  user_id uuid not null,

  -- core idea information
  name text not null check (length(name) > 1),
  content text not null,

  -- recipient information (all optional)
  age integer check (age > 0 and age <= 500),
  interests text,
  person_description text,

  -- budget constraints (optional)
  budget_min numeric check (budget_min >= 0),
  budget_max numeric check (budget_max >= 0 and (budget_min is null or budget_max >= budget_min)),

  -- categorization via foreign keys
  relation_id bigint,
  occasion_id bigint,

  -- metadata
  source idea_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- foreign key constraints
  constraint fk_ideas_user
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,

  constraint fk_ideas_relation
    foreign key (relation_id)
    references relations(id)
    on delete set null,

  constraint fk_ideas_occasion
    foreign key (occasion_id)
    references occasions(id)
    on delete set null
);

-- enable row level security on ideas table
alter table ideas enable row level security;

-- ============================================================================
-- 4. performance indexes
-- ============================================================================

-- composite index for user's chronological idea list
create index idx_ideas_user_created on ideas(user_id, created_at desc);

-- partial indexes for filtering
create index idx_ideas_relation on ideas(relation_id) where relation_id is not null;
create index idx_ideas_occasion on ideas(occasion_id) where occasion_id is not null;
create index idx_ideas_source on ideas(source);

-- ============================================================================
-- 5. row level security policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 rls policies for relations table (dictionary)
-- ----------------------------------------------------------------------------

-- select policy for anonymous users
-- rationale: dictionary data should be publicly readable for form dropdowns
create policy "anon_select_relations"
  on relations
  for select
  to anon
  using (true);

-- select policy for authenticated users
-- rationale: authenticated users also need full read access to relation types
create policy "authenticated_select_relations"
  on relations
  for select
  to authenticated
  using (true);

-- insert policy for authenticated users
-- rationale: regular users should not modify dictionary data
-- this policy blocks all user inserts (only backend can modify)
create policy "authenticated_insert_relations"
  on relations
  for insert
  to authenticated
  with check (false);

-- update policy for authenticated users
-- rationale: regular users should not modify dictionary data
create policy "authenticated_update_relations"
  on relations
  for update
  to authenticated
  using (false)
  with check (false);

-- delete policy for authenticated users
-- rationale: regular users should not delete dictionary data
create policy "authenticated_delete_relations"
  on relations
  for delete
  to authenticated
  using (false);

-- ----------------------------------------------------------------------------
-- 5.2 rls policies for occasions table (dictionary)
-- ----------------------------------------------------------------------------

-- select policy for anonymous users
-- rationale: dictionary data should be publicly readable for form dropdowns
create policy "anon_select_occasions"
  on occasions
  for select
  to anon
  using (true);

-- select policy for authenticated users
-- rationale: authenticated users also need full read access to occasion types
create policy "authenticated_select_occasions"
  on occasions
  for select
  to authenticated
  using (true);

-- insert policy for authenticated users
-- rationale: regular users should not modify dictionary data
-- this policy blocks all user inserts (only backend can modify)
create policy "authenticated_insert_occasions"
  on occasions
  for insert
  to authenticated
  with check (false);

-- update policy for authenticated users
-- rationale: regular users should not modify dictionary data
create policy "authenticated_update_occasions"
  on occasions
  for update
  to authenticated
  using (false)
  with check (false);

-- delete policy for authenticated users
-- rationale: regular users should not delete dictionary data
create policy "authenticated_delete_occasions"
  on occasions
  for delete
  to authenticated
  using (false);

-- ----------------------------------------------------------------------------
-- 5.3 rls policies for ideas table (user data)
-- ----------------------------------------------------------------------------

-- note: no select policy for anon role - ideas contain personal user data

-- select policy for authenticated users
-- rationale: users should only see their own gift ideas
-- optimization: (select auth.uid()) is evaluated once per query, not per row
create policy "authenticated_select_ideas"
  on ideas
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- insert policy for authenticated users
-- rationale: users can only create ideas for themselves
create policy "authenticated_insert_ideas"
  on ideas
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- update policy for authenticated users
-- rationale: users can only update their own ideas
create policy "authenticated_update_ideas"
  on ideas
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- delete policy for authenticated users
-- rationale: users can only delete their own ideas
create policy "authenticated_delete_ideas"
  on ideas
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- 6. triggers
-- ============================================================================

-- function: automatically update the updated_at timestamp
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
create trigger update_ideas_updated_at
  before update on ideas
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 7. seed data - relations
-- ============================================================================

insert into relations (code, name) values
  -- immediate family
  ('parent', 'Rodzic'),
  ('child', 'Dziecko'),
  ('sibling', 'Rodzeństwo'),

  -- partners (gender-specific)
  ('partner_male', 'Partner'),
  ('partner_female', 'Partnerka'),

  -- grandparents (gender-specific)
  ('grandfather', 'Dziadek'),
  ('grandmother', 'Babcia'),

  -- extended family
  ('aunt', 'Ciocia'),
  ('uncle', 'Wujek'),
  ('cousin_male', 'Kuzyn'),
  ('cousin_female', 'Kuzynka'),

  -- friends and colleagues (gender-specific)
  ('friend', 'Przyjaciel'),
  ('colleague_male', 'Kolega'),
  ('colleague_female', 'Koleżanka'),

  -- other
  ('other', 'Inna relacja');

-- ============================================================================
-- 8. seed data - occasions
-- ============================================================================

insert into occasions (code, name) values
  -- birthdays and celebrations
  ('birthday', 'Urodziny'),
  ('name_day', 'Imieniny'),

  -- family occasions
  ('mothers_day', 'Dzień Matki'),
  ('fathers_day', 'Dzień Ojca'),

  -- romantic occasions
  ('valentines_day', 'Walentynki'),
  ('anniversary', 'Rocznica'),
  ('wedding', 'Ślub'),

  -- holidays
  ('christmas', 'Święta (Boże Narodzenie)'),

  -- life events
  ('graduation', 'Ukończenie szkoły'),
  ('baby_shower', 'Baby shower'),
  ('housewarming', 'Parapetówka'),

  -- other
  ('other', 'Inna okazja');
