-- ============================================================
-- SithaMithuru — Seed Data (Sample / Demo Data)
-- Run AFTER schema.sql and migration_v3.sql
-- ============================================================

-- NOTE: Passwords are bcrypt hashes of 'password123'
-- You can login with: sanath@gmail.com / password123
--                     kumari@gmail.com / password123

-- ============================================================
-- 1. Users (Elder + Guardian)
-- ============================================================
INSERT INTO users (name, email, phone_number, password_hash, role, age, blood_type, weight)
VALUES
  (
    'Sanath Jayasuriya',
    'sanath@gmail.com',
    '+94771234567',
    '$2b$10$YourHashHere.ReplaceWithActualBcryptHash.Of.password123',
    'Elder',
    72,
    'O+',
    68.5
  ),
  (
    'Kumari Perera',
    'kumari@gmail.com',
    '+94779876543',
    '$2b$10$YourHashHere.ReplaceWithActualBcryptHash.Of.password123',
    'Guardian',
    45,
    'A+',
    58.0
  )
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 2. Link Guardian → Elder
-- ============================================================
INSERT INTO guardian_elder (guardian_id, elder_id, status)
SELECT
  (SELECT id FROM users WHERE email = 'kumari@gmail.com'),
  (SELECT id FROM users WHERE email = 'sanath@gmail.com'),
  'Active'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'kumari@gmail.com')
  AND EXISTS (SELECT 1 FROM users WHERE email = 'sanath@gmail.com')
ON CONFLICT DO NOTHING;

-- Set primary guardian on elder
UPDATE users
SET primary_guardian_id = (SELECT id FROM users WHERE email = 'kumari@gmail.com')
WHERE email = 'sanath@gmail.com';

-- ============================================================
-- 3. Medications (for Elder: Sanath)
-- ============================================================
INSERT INTO medications (elder_id, name, dosage, time_schedule, created_by)
SELECT
  e.id,
  med.name,
  med.dosage,
  med.time_schedule::TIME,
  g.id
FROM (VALUES
  ('Blood Pressure Pill (Amlodipine)', '1 Pill', '08:00'),
  ('Vitamin D Capsule', '1 Capsule', '08:30'),
  ('Diabetes Tablet (Metformin)', '1 Tablet', '12:00'),
  ('Cholesterol Pill (Atorvastatin)', '1 Pill', '20:00'),
  ('Sleep Aid (Melatonin)', '1/2 Tablet', '21:00')
) AS med(name, dosage, time_schedule),
users e,
users g
WHERE e.email = 'sanath@gmail.com'
  AND g.email = 'kumari@gmail.com';

-- ============================================================
-- 4. Daily Tasks (for Elder: Sanath)
-- ============================================================
INSERT INTO daily_tasks (elder_id, title, description, due_time, created_by)
SELECT
  e.id,
  task.title,
  task.description,
  task.due_time::TIME,
  e.id
FROM (VALUES
  ('Drink Water (8 glasses)', 'Stay hydrated throughout the day', '09:00'),
  ('Morning Walk (20 mins)', 'Light walk around the garden or street', '07:30'),
  ('Call Family Member', 'Check in with Kumari or another family member', '11:00'),
  ('Water the Plants', 'Water the plants in the garden and balcony', '16:00'),
  ('Read a Book', 'Read for at least 30 minutes before bed', '19:00')
) AS task(title, description, due_time),
users e
WHERE e.email = 'sanath@gmail.com';

-- ============================================================
-- 5. Mood Logs — Last 7 Days
-- ============================================================
INSERT INTO mood_logs (elder_id, mood_type, notes, created_at)
SELECT
  e.id,
  mood.mood_type,
  mood.notes,
  NOW() - (mood.days_ago || ' days')::INTERVAL
FROM (VALUES
  ('Happy',   'Had a lovely morning with my daughter. Feeling great today!', 0),
  ('Neutral', 'Normal day. Took all my medicines on time.', 1),
  ('Happy',   'The garden flowers are blooming. Very peaceful.', 2),
  ('Sad',     'Feeling a bit lonely. Miss old friends.', 3),
  ('Anxious', 'Worried about upcoming doctor appointment.', 4),
  ('Neutral', 'Routine day. Watched some TV.', 5),
  ('Happy',   'Grandchildren visited today. Best day in a while!', 6)
) AS mood(mood_type, notes, days_ago),
users e
WHERE e.email = 'sanath@gmail.com';

-- ============================================================
-- 6. Journal Entries
-- ============================================================
INSERT INTO journal_entries (elder_id, title, content, mood_ref, created_at)
SELECT
  e.id,
  j.title,
  j.content,
  j.mood_ref,
  NOW() - (j.days_ago || ' days')::INTERVAL
FROM (VALUES
  (
    'A Beautiful Morning',
    'Today I woke up feeling very energetic. The birds were singing outside my window and the sun was shining bright. I had a cup of tea with my daughter Kumari and we talked about old memories. It felt like the good old days.',
    'Happy',
    0
  ),
  (
    'Garden Diary',
    'Spent some time in the garden this afternoon. The roses are blooming beautifully this year — especially the red ones near the gate. I watered all the plants and trimmed some dry leaves. Felt very calm and at peace.',
    'Neutral',
    3
  ),
  (
    'Thinking of Old Friends',
    'Today I was going through some old photos and found pictures from my teaching days. I miss my colleagues and students. The world has changed so much. I hope they are all doing well wherever they are.',
    'Sad',
    5
  )
) AS j(title, content, mood_ref, days_ago),
users e
WHERE e.email = 'sanath@gmail.com';

-- ============================================================
-- 7. Today's Medication Logs (some taken, some not)
-- ============================================================
INSERT INTO medication_logs (medication_id, elder_id, taken_status, taken_at, logged_date)
SELECT
  m.id,
  m.elder_id,
  CASE WHEN m.time_schedule <= '12:00'::TIME THEN TRUE ELSE FALSE END,
  CASE WHEN m.time_schedule <= '12:00'::TIME THEN NOW() ELSE NULL END,
  CURRENT_DATE
FROM medications m
JOIN users e ON m.elder_id = e.id
WHERE e.email = 'sanath@gmail.com'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. Today's Task Logs (first 2 completed)
-- ============================================================
INSERT INTO task_logs (task_id, elder_id, completed, completed_at, logged_date)
SELECT
  t.id,
  t.elder_id,
  ROW_NUMBER() OVER (ORDER BY t.id) <= 2,
  CASE WHEN ROW_NUMBER() OVER (ORDER BY t.id) <= 2 THEN NOW() ELSE NULL END,
  CURRENT_DATE
FROM daily_tasks t
JOIN users e ON t.elder_id = e.id
WHERE e.email = 'sanath@gmail.com'
ON CONFLICT DO NOTHING;
