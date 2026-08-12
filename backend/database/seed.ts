/**
 * SithaMithuru — Database Seed Script
 * ------------------------------------
 * Inserts proper development/demo data into the live PostgreSQL database.
 * Uses the ACTUAL column names verified against the live schema (v17).
 *
 * Usage:
 *   cd backend
 *   npx ts-node database/seed.ts
 *
 * Credentials seeded:
 *   Elder:    sanath@gmail.com    / password123
 *   Guardian: kumari@gmail.com    / password123
 *   Elder:    denethmi@gmail.com  / password123   (existing – will skip)
 *   Guardian: malsha@gmail.com    / password123   (existing – will skip)
 */

import bcrypt from "bcrypt";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "sithamithuru",
  password: process.env.DB_PASSWORD || "8822",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🌱 Starting seed...\n");

    const HASH = await bcrypt.hash("password123", 12);

    // ─── 1. Users ───────────────────────────────────────────────────────────
    console.log("→ Seeding users...");

    const elderResult = await client.query(
      `INSERT INTO users (name, email, phone_number, password_hash, role, age, blood_type, weight, is_active)
       VALUES ($1, $2, $3, $4, 'Elder', 72, 'O+', 68.5, TRUE)
       ON CONFLICT DO NOTHING
       RETURNING id, name, email, role`,
      ["Sanath Jayasuriya", "sanath@gmail.com", "+94771234567", HASH]
    );
    let elder = elderResult.rows[0];
    if (!elder) {
      // Already exists — fetch & update password
      await client.query(`UPDATE users SET password_hash=$1, is_active=TRUE WHERE email=$2`, [HASH, "sanath@gmail.com"]);
      const r = await client.query(`SELECT id, name, email, role FROM users WHERE email=$1`, ["sanath@gmail.com"]);
      elder = r.rows[0];
    }
    console.log(`  ✅ Elder: ${elder.name} (id=${elder.id})`);

    const guardianResult = await client.query(
      `INSERT INTO users (name, email, phone_number, password_hash, role, age, blood_type, weight, is_active)
       VALUES ($1, $2, $3, $4, 'Guardian', 45, 'A+', 58.0, TRUE)
       ON CONFLICT DO NOTHING
       RETURNING id, name, email, role`,
      ["Kumari Perera", "kumari@gmail.com", "+94779876543", HASH]
    );
    let guardian = guardianResult.rows[0];
    if (!guardian) {
      await client.query(`UPDATE users SET password_hash=$1, is_active=TRUE WHERE email=$2`, [HASH, "kumari@gmail.com"]);
      const r = await client.query(`SELECT id, name, email, role FROM users WHERE email=$1`, ["kumari@gmail.com"]);
      guardian = r.rows[0];
    }
    console.log(`  ✅ Guardian: ${guardian.name} (id=${guardian.id})`);

    // ─── 2. Guardian-Elder relationship ─────────────────────────────────────
    console.log("→ Linking Guardian → Elder...");
    await client.query(
      `INSERT INTO guardian_elder_relationships
         (guardian_id, elder_id, relationship_type, permission_level, status)
       VALUES ($1, $2, 'Daughter', 'Primary', 'ACTIVE')
       ON CONFLICT (guardian_id, elder_id) DO UPDATE SET status = 'ACTIVE'`,
      [guardian.id, elder.id]
    );

    await client.query(
      `UPDATE users SET primary_guardian_id = $1 WHERE id = $2`,
      [guardian.id, elder.id]
    );
    console.log(`  ✅ ${guardian.name} linked to ${elder.name}`);

    // ─── 3. Medications ──────────────────────────────────────────────────────
    console.log("→ Seeding medications...");
    const meds = [
      { name: "Amlodipine (Blood Pressure)", dosage: "1 Pill", time: "08:00", form: "PILL", strength: "5mg", instructions: "Take in the morning", category: "Blood Pressure" },
      { name: "Vitamin D3", dosage: "1 Capsule", time: "08:30", form: "PILL", strength: "1000 IU", instructions: "Take with food", category: "Supplements" },
      { name: "Metformin (Diabetes)", dosage: "1 Tablet", time: "12:00", form: "PILL", strength: "500mg", instructions: "Take with food", category: "Diabetes" },
      { name: "Atorvastatin (Cholesterol)", dosage: "1 Pill", time: "20:00", form: "PILL", strength: "20mg", instructions: "Take at bedtime", category: "Heart Health" },
      { name: "Melatonin (Sleep Aid)", dosage: "1/2 Tablet", time: "21:00", form: "PILL", strength: "3mg", instructions: "Take 30 mins before sleep", category: "General" },
    ];

    const insertedMeds: Array<{ id: number; time_schedule: string }> = [];
    for (const m of meds) {
      const r = await client.query(
        `INSERT INTO medications
           (elder_id, name, dosage, time_schedule, created_by, form, strength, instructions,
            schedule_type, schedule_values, times, category, is_active)
         VALUES ($1,$2,$3,$4::TIME,$5,$6,$7,$8,'DAILY','[]'::jsonb,$9::jsonb,$10,TRUE)
         ON CONFLICT DO NOTHING
         RETURNING id, time_schedule`,
        [
          elder.id, m.name, m.dosage, m.time,
          guardian.id, m.form, m.strength, m.instructions,
          JSON.stringify([m.time]), m.category,
        ]
      );
      if (r.rows[0]) {
        insertedMeds.push(r.rows[0]);
        console.log(`  ✅ Med: ${m.name} @ ${m.time}`);
      }
    }

    // ─── 4. Daily Tasks ──────────────────────────────────────────────────────
    console.log("→ Seeding daily tasks...");
    const tasks = [
      { title: "Drink Water (8 glasses)", description: "Stay hydrated throughout the day", due_time: "09:00" },
      { title: "Morning Walk (20 mins)", description: "Light walk around the garden or street", due_time: "07:30" },
      { title: "Call Family Member", description: "Check in with Kumari or another family member", due_time: "11:00" },
      { title: "Water the Plants", description: "Water the plants in the garden and balcony", due_time: "16:00" },
      { title: "Read a Book", description: "Read for at least 30 minutes before bed", due_time: "19:00" },
    ];

    const insertedTasks: Array<{ id: number }> = [];
    for (const t of tasks) {
      const r = await client.query(
        `INSERT INTO daily_tasks (elder_id, title, description, due_time, created_by, is_active)
         VALUES ($1, $2, $3, $4::TIME, $5, TRUE)
         RETURNING id`,
        [elder.id, t.title, t.description, t.due_time, elder.id]
      );
      if (r.rows[0]) {
        insertedTasks.push(r.rows[0]);
        console.log(`  ✅ Task: ${t.title}`);
      }
    }

    // ─── 5. Mood Logs — last 7 days ──────────────────────────────────────────
    console.log("→ Seeding mood logs...");
    const moods = [
      { mood: "Happy",   notes: "Had a lovely morning with my daughter. Feeling great today!", daysAgo: 0 },
      { mood: "Neutral", notes: "Normal day. Took all my medicines on time.", daysAgo: 1 },
      { mood: "Happy",   notes: "The garden flowers are blooming. Very peaceful.", daysAgo: 2 },
      { mood: "Sad",     notes: "Feeling a bit lonely. Miss old friends.", daysAgo: 3 },
      { mood: "Anxious", notes: "Worried about upcoming doctor appointment.", daysAgo: 4 },
      { mood: "Neutral", notes: "Routine day. Watched some TV.", daysAgo: 5 },
      { mood: "Happy",   notes: "Grandchildren visited today. Best day in a while!", daysAgo: 6 },
    ];

    for (const m of moods) {
      await client.query(
        `INSERT INTO mood_logs (elder_id, mood_type, notes, created_at)
         VALUES ($1, $2, $3, NOW() - ($4 || ' days')::INTERVAL)`,
        [elder.id, m.mood, m.notes, m.daysAgo]
      );
    }
    console.log(`  ✅ ${moods.length} mood entries inserted`);

    // ─── 6. Journal Entries ──────────────────────────────────────────────────
    console.log("→ Seeding journal entries...");
    const journals = [
      {
        title: "A Beautiful Morning",
        content: "Today I woke up feeling very energetic. The birds were singing outside my window and the sun was shining bright. I had a cup of tea with my daughter Kumari and we talked about old memories. It felt like the good old days.",
        mood_tag: "Happy",
        daysAgo: 0,
      },
      {
        title: "Garden Diary",
        content: "Spent some time in the garden this afternoon. The roses are blooming beautifully this year — especially the red ones near the gate. I watered all the plants and trimmed some dry leaves. Felt very calm and at peace.",
        mood_tag: "Neutral",
        daysAgo: 3,
      },
      {
        title: "Thinking of Old Friends",
        content: "Today I was going through some old photos and found pictures from my teaching days. I miss my colleagues and students. The world has changed so much. I hope they are all doing well wherever they are.",
        mood_tag: "Sad",
        daysAgo: 5,
      },
    ];

    for (const j of journals) {
      await client.query(
        `INSERT INTO journal_entries (elder_id, title, content, mood_tag, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW() - ($5 || ' days')::INTERVAL, NOW() - ($5 || ' days')::INTERVAL)`,
        [elder.id, j.title, j.content, j.mood_tag, j.daysAgo]
      );
    }
    console.log(`  ✅ ${journals.length} journal entries inserted`);

    // ─── 7. Medication Logs (today) ──────────────────────────────────────────
    console.log("→ Seeding today's medication logs...");
    for (const med of insertedMeds) {
      const hour = parseInt(String(med.time_schedule).split(":")[0]);
      const taken = hour < 13; // morning meds marked taken
      if (taken) {
        await client.query(
          `INSERT INTO medication_logs
             (medication_id, elder_id, taken_status, status, taken_at, logged_date, updated_at)
           VALUES ($1, $2, TRUE, 'TAKEN', NOW(), CURRENT_DATE, NOW())
           ON CONFLICT ON CONSTRAINT uq_med_log_per_day DO NOTHING`,
          [med.id, elder.id]
        );
      }
    }
    console.log(`  ✅ Morning medication logs inserted`);

    // ─── 8. Task Logs (today, first 2 completed) ─────────────────────────────
    console.log("→ Seeding today's task logs...");
    for (let i = 0; i < insertedTasks.length; i++) {
      const completed = i < 2;
      if (completed) {
        await client.query(
          `INSERT INTO task_logs (task_id, elder_id, completed, completed_at, logged_date)
           VALUES ($1, $2, TRUE, NOW(), CURRENT_DATE)
           ON CONFLICT ON CONSTRAINT uq_task_log_per_day DO NOTHING`,
          [insertedTasks[i].id, elder.id]
        );
      }
    }
    console.log(`  ✅ First 2 tasks marked complete`);

    // ─── 9. Emergency Contacts ───────────────────────────────────────────────
    console.log("→ Seeding emergency contacts...");
    const contacts = [
      { name: "Kumari Perera", phone: "+94779876543", relationship: "Daughter", is_primary: true, order: 1 },
      { name: "National Ambulance", phone: "1990", relationship: "Emergency Services", is_primary: false, order: 2 },
      { name: "Family Doctor (Dr. Silva)", phone: "+94112345678", relationship: "Doctor", is_primary: false, order: 3 },
    ];

    for (const c of contacts) {
      await client.query(
        `INSERT INTO emergency_contacts
           (elder_id, name, phone_number, relationship, is_primary, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [elder.id, c.name, c.phone, c.relationship, c.is_primary, c.order]
      );
    }
    console.log(`  ✅ ${contacts.length} emergency contacts inserted`);

    // ─── 10. Risk Profile ────────────────────────────────────────────────────
    console.log("→ Seeding risk profile...");
    await client.query(
      `INSERT INTO risk_profiles (elder_id, risk_level, category, score, reason, calculated_by)
       VALUES ($1, 'Green', 'Low', 20, 'Good medication adherence and regular mood logging', $2)
       ON CONFLICT (elder_id) DO UPDATE
         SET risk_level='Green', category='Low', score=20, calculated_at=NOW()`,
      [elder.id, guardian.id]
    );
    console.log(`  ✅ Risk profile seeded (Green/Low)`);

    // ─── Summary ─────────────────────────────────────────────────────────────
    console.log("\n✅ Seed complete!\n");
    console.log("Login credentials:");
    console.log("  Elder:    sanath@gmail.com    / password123");
    console.log("  Guardian: kumari@gmail.com    / password123");

  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
