-- migration: seed_test_data
-- purpose: add test entries for development and testing
-- affected tables: ideas, auth.users
-- notes:
--   - creates a test user for development
--   - includes examples of different idea sources (manual, ai, edited-ai)
--   - demonstrates various combinations of optional fields

-- ============================================================================
-- create test user for development
-- ============================================================================

-- insert test user into auth.users (for development only)
-- email: test@example.com
-- password: Password123! (8+ chars, 1 special char, 1 uppercase, 1 digit)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  recovery_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  '$2y$10$ed0l2OG4tRVm/y976t7b3OU00l790mZ7k7qSNySh7jSHyg3q885ci',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  '',
  '',
  '',
  false,
  false
)
on conflict (id) do nothing;

-- ============================================================================
-- test data for ideas table
-- ============================================================================

insert into ideas (
  user_id,
  name,
  content,
  age,
  interests,
  person_description,
  budget_min,
  budget_max,
  relation_id,
  occasion_id,
  source
) values
  -- test idea 1: manual entry with full details
  (
    '00000000-0000-0000-0000-000000000000',
    'Smartwatch fitness tracker',
    'A modern fitness smartwatch with heart rate monitoring, GPS, and sleep tracking. Perfect for someone who loves staying active and tracking their health goals.',
    28,
    'fitness, technology, running',
    'Active lifestyle enthusiast who runs marathons and loves gadgets',
    200.00,
    400.00,
    (select id from relations where code = 'friend'),
    (select id from occasions where code = 'birthday'),
    'manual'
  ),

  -- test idea 2: ai-generated idea with minimal details
  (
    '00000000-0000-0000-0000-000000000000',
    'Personalized photo album',
    'A beautifully crafted photo album with custom leather cover and embossed initials. Fill it with memories from their favorite trips and family moments.',
    null,
    null,
    null,
    50.00,
    100.00,
    (select id from relations where code = 'parent'),
    (select id from occasions where code = 'anniversary'),
    'ai'
  ),

  -- test idea 3: edited ai suggestion with moderate details
  (
    '00000000-0000-0000-0000-000000000000',
    'Premium coffee subscription',
    'A 6-month subscription to a specialty coffee roaster. They will receive freshly roasted beans from different regions each month, along with tasting notes and brewing tips.',
    35,
    'coffee, cooking, travel',
    'Coffee enthusiast who enjoys trying new flavors',
    150.00,
    250.00,
    (select id from relations where code = 'colleague_male'),
    (select id from occasions where code = 'christmas'),
    'edited-ai'
  );
