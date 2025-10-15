-- migration: seed_test_ideas
-- purpose: add 3 test entries to the ideas table for development and testing
-- affected tables: ideas
-- notes:
--   - uses a test user_id that should be replaced with actual auth user id in production
--   - includes examples of different idea sources (manual, ai, edited-ai)
--   - demonstrates various combinations of optional fields
--   - references existing relations and occasions from seed data

-- ============================================================================
-- test data for ideas table
-- ============================================================================

-- note: replace '00000000-0000-0000-0000-000000000000' with actual user_id from auth.users
-- you can get a real user_id by running: select id from auth.users limit 1;

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
    (select id from relations where name = 'friend'),
    (select id from occasions where name = 'birthday'),
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
    (select id from relations where name = 'parent'),
    (select id from occasions where name = 'anniversary'),
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
    (select id from relations where name = 'colleague'),
    (select id from occasions where name = 'christmas'),
    'edited-ai'
  );
