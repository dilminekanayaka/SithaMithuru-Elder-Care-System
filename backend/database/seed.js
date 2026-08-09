// Script to generate bcrypt hash for seed data and insert sample users
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sithamithuru',
  password: '8822',
  port: 5432,
});

async function seed() {
  try {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);

    // Insert Elder
    const elderResult = await pool.query(
      `INSERT INTO users (name, email, phone_number, password_hash, role, age, blood_type, weight)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, name, email, role`,
      ['Sanath Jayasuriya', 'sanath@gmail.com', '+94771234567', hash, 'Elder', 72, 'O+', 68.5]
    );
    const elder = elderResult.rows[0];
    console.log('Elder created:', elder);

    // Insert Guardian
    const guardianResult = await pool.query(
      `INSERT INTO users (name, email, phone_number, password_hash, role, age, blood_type, weight)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, name, email, role`,
      ['Kumari Perera', 'kumari@gmail.com', '+94779876543', hash, 'Guardian', 45, 'A+', 58.0]
    );
    const guardian = guardianResult.rows[0];
    console.log('Guardian created:', guardian);

    // Link Guardian → Elder
    await pool.query(
      `INSERT INTO guardian_elder (guardian_id, elder_id, status)
       VALUES ($1, $2, 'Active') ON CONFLICT DO NOTHING`,
      [guardian.id, elder.id]
    );

    // Set primary guardian
    await pool.query(
      `UPDATE users SET primary_guardian_id = $1 WHERE id = $2`,
      [guardian.id, elder.id]
    );

    // Insert Medications
    const meds = [
      ['Blood Pressure Pill (Amlodipine)', '1 Pill', '08:00'],
      ['Vitamin D Capsule', '1 Capsule', '08:30'],
      ['Diabetes Tablet (Metformin)', '1 Tablet', '12:00'],
      ['Cholesterol Pill (Atorvastatin)', '1 Pill', '20:00'],
      ['Sleep Aid (Melatonin)', '1/2 Tablet', '21:00'],
    ];
    for (const [name, dosage, time] of meds) {
      await pool.query(
        `INSERT INTO medications (elder_id, name, dosage, time_schedule, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [elder.id, name, dosage, time, guardian.id]
      );
    }
    console.log('Medications inserted.');

    // Insert Daily Tasks
    const tasks = [
      ['Drink Water (8 glasses)', 'Stay hydrated throughout the day', '09:00'],
      ['Morning Walk (20 mins)', 'Light walk around the garden or street', '07:30'],
      ['Call Family Member', 'Check in with Kumari or another family member', '11:00'],
      ['Water the Plants', 'Water the plants in the garden and balcony', '16:00'],
      ['Read a Book', 'Read for at least 30 minutes before bed', '19:00'],
    ];
    for (const [title, description, time] of tasks) {
      await pool.query(
        `INSERT INTO daily_tasks (elder_id, title, description, due_time, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [elder.id, title, description, time, elder.id]
      );
    }
    console.log('Tasks inserted.');

    // Insert Mood Logs (last 7 days)
    const moods = [
      ['Happy', 'Had a lovely morning with my daughter. Feeling great today!', 0],
      ['Neutral', 'Normal day. Took all my medicines on time.', 1],
      ['Happy', 'The garden flowers are blooming. Very peaceful.', 2],
      ['Sad', 'Feeling a bit lonely. Miss old friends.', 3],
      ['Anxious', 'Worried about upcoming doctor appointment.', 4],
      ['Neutral', 'Routine day. Watched some TV.', 5],
      ['Happy', 'Grandchildren visited today. Best day in a while!', 6],
    ];
    for (const [mood, notes, daysAgo] of moods) {
      await pool.query(
        `INSERT INTO mood_logs (elder_id, mood_type, notes, created_at)
         VALUES ($1, $2, $3, NOW() - ($4 || ' days')::INTERVAL)`,
        [elder.id, mood, notes, daysAgo]
      );
    }
    console.log('Mood logs inserted.');

    // Insert Journal Entries
    const journals = [
      ['A Beautiful Morning', 'Today I woke up feeling very energetic. The birds were singing outside my window and the sun was shining bright. I had a cup of tea with my daughter Kumari and we talked about old memories. It felt like the good old days.', 'Happy', 0],
      ['Garden Diary', 'Spent some time in the garden this afternoon. The roses are blooming beautifully this year — especially the red ones near the gate. I watered all the plants and trimmed some dry leaves. Felt very calm and at peace.', 'Neutral', 3],
      ['Thinking of Old Friends', 'Today I was going through some old photos and found pictures from my teaching days. I miss my colleagues and students. The world has changed so much. I hope they are all doing well wherever they are.', 'Sad', 5],
    ];
    for (const [title, content, mood, daysAgo] of journals) {
      await pool.query(
        `INSERT INTO journal_entries (elder_id, title, content, mood_ref, created_at)
         VALUES ($1, $2, $3, $4, NOW() - ($5 || ' days')::INTERVAL)`,
        [elder.id, title, content, mood, daysAgo]
      );
    }
    console.log('Journal entries inserted.');

    // Insert today's med logs (morning meds taken)
    const medResult = await pool.query(`SELECT id, time_schedule FROM medications WHERE elder_id = $1`, [elder.id]);
    for (const med of medResult.rows) {
      const hour = parseInt(med.time_schedule.split(':')[0]);
      const taken = hour < 12;
      await pool.query(
        `INSERT INTO medication_logs (medication_id, elder_id, taken_status, taken_at, logged_date)
         VALUES ($1, $2, $3, $4, CURRENT_DATE) ON CONFLICT DO NOTHING`,
        [med.id, elder.id, taken, taken ? new Date() : null]
      );
    }

    // Insert today's task logs (first 2 completed)
    const taskResult = await pool.query(`SELECT id FROM daily_tasks WHERE elder_id = $1 ORDER BY id LIMIT 5`, [elder.id]);
    for (let i = 0; i < taskResult.rows.length; i++) {
      const completed = i < 2;
      await pool.query(
        `INSERT INTO task_logs (task_id, elder_id, completed, completed_at, logged_date)
         VALUES ($1, $2, $3, $4, CURRENT_DATE) ON CONFLICT DO NOTHING`,
        [taskResult.rows[i].id, elder.id, completed, completed ? new Date() : null]
      );
    }

    console.log('\n✅ Seed data inserted successfully!');
    console.log(`\nLogin credentials:\n  Elder:    sanath@gmail.com / password123\n  Guardian: kumari@gmail.com / password123`);
    await pool.end();
  } catch (err) {
    console.error('Seed Error:', err);
    await pool.end();
    process.exit(1);
  }
}

seed();
