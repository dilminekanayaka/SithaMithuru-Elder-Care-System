import pool from "../config/db";
import { Queryable } from "../config/transaction";

export interface MedicationInput {
  elder_id: string | number;
  name: string;
  dosage?: string | null;
  time_schedule: string;
  form?: string;
  strength?: string;
  instructions?: string;
  schedule_type?: string;
  schedule_values?: any[];
  times?: string[];
  start_date?: string;
  end_date?: string | null;
  category?: string;
  createdBy?: string | number;
}

const MED_RETURNING = `id, name, dosage, TO_CHAR(time_schedule, 'HH24:MI') as time_schedule,
  form, strength, instructions, schedule_type, schedule_values, times,
  TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, category, is_active`;

export const findMedicationsByElder = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT m.id, m.name, m.dosage,
            TO_CHAR(m.time_schedule, 'HH24:MI') as time_schedule,
            m.created_at,
            COALESCE(ml.taken_status, FALSE) as taken,
            COALESCE(m.form, 'PILL') as form,
            COALESCE(m.strength, '') as strength,
            COALESCE(m.instructions, '') as instructions,
            COALESCE(m.schedule_type, 'DAILY') as schedule_type,
            COALESCE(m.schedule_values, '[]'::jsonb) as schedule_values,
            COALESCE(m.times, '[]'::jsonb) as times,
            TO_CHAR(m.start_date, 'YYYY-MM-DD') as start_date,
            TO_CHAR(m.end_date, 'YYYY-MM-DD') as end_date,
            COALESCE(m.category, 'General') as category,
            COALESCE(m.is_active, TRUE) as is_active
     FROM medications m
     LEFT JOIN medication_logs ml
       ON ml.medication_id = m.id AND ml.elder_id = $1 AND ml.logged_date = CURRENT_DATE
     WHERE m.elder_id = $1 AND COALESCE(m.is_active, TRUE) = TRUE
     ORDER BY m.time_schedule ASC`,
    [elderId]
  );
  return result.rows;
};

// Same shape as findMedicationsByElder plus who created each medication —
// used by the Guardian management view.
export const findMedicationsByElderWithCreator = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT m.id, m.name, m.dosage,
            TO_CHAR(m.time_schedule, 'HH24:MI') as time_schedule,
            m.created_at,
            creator.name as created_by_name,
            COALESCE(ml.taken_status, FALSE) as taken_today,
            COALESCE(m.form, 'PILL') as form,
            COALESCE(m.strength, '') as strength,
            COALESCE(m.instructions, '') as instructions,
            COALESCE(m.schedule_type, 'DAILY') as schedule_type,
            COALESCE(m.schedule_values, '[]'::jsonb) as schedule_values,
            COALESCE(m.times, '[]'::jsonb) as times,
            TO_CHAR(m.start_date, 'YYYY-MM-DD') as start_date,
            TO_CHAR(m.end_date, 'YYYY-MM-DD') as end_date,
            COALESCE(m.category, 'General') as category,
            COALESCE(m.is_active, TRUE) as is_active
     FROM medications m
     LEFT JOIN users creator ON creator.id = m.created_by
     LEFT JOIN medication_logs ml
       ON ml.medication_id = m.id AND ml.elder_id = $1 AND ml.logged_date = CURRENT_DATE
     WHERE m.elder_id = $1 AND COALESCE(m.is_active, TRUE) = TRUE
     ORDER BY m.time_schedule ASC`,
    [elderId]
  );
  return result.rows;
};

export const findMedicationElderId = async (id: string | number, db: Queryable = pool) => {
  const result = await db.query("SELECT elder_id FROM medications WHERE id = $1", [id]);
  return result.rows[0]?.elder_id as string | number | undefined;
};

export const findMedicationForReminder = async (id: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT m.id, m.name, m.elder_id, u.fcm_token FROM medications m JOIN users u ON u.id = m.elder_id WHERE m.id = $1`,
    [id]
  );
  return result.rows[0];
};

export const createMedication = async (data: MedicationInput, db: Queryable = pool) => {
  const timesArray = data.times && data.times.length > 0 ? data.times : [data.time_schedule];
  const result = await db.query(
    `INSERT INTO medications (
       elder_id, name, dosage, time_schedule, created_by,
       form, strength, instructions, schedule_type, schedule_values, times, start_date, end_date, category, is_active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE)
     RETURNING ${MED_RETURNING}`,
    [
      data.elder_id,
      data.name.trim(),
      data.dosage || null,
      data.time_schedule,
      data.createdBy ?? data.elder_id,
      data.form || "PILL",
      data.strength || "",
      data.instructions || "",
      data.schedule_type || "DAILY",
      JSON.stringify(data.schedule_values || []),
      JSON.stringify(timesArray),
      data.start_date || new Date().toISOString().split("T")[0],
      data.end_date || null,
      data.category || "General",
    ]
  );
  return result.rows[0];
};

export const updateMedication = async (id: string | number, data: Partial<MedicationInput>, db: Queryable = pool) => {
  const timesArray =
    data.times && data.times.length > 0 ? data.times : data.time_schedule ? [data.time_schedule] : [];

  const result = await db.query(
    `UPDATE medications
     SET name = COALESCE($1, name),
         dosage = COALESCE($2, dosage),
         time_schedule = COALESCE($3, time_schedule),
         form = COALESCE($4, form),
         strength = COALESCE($5, strength),
         instructions = COALESCE($6, instructions),
         schedule_type = COALESCE($7, schedule_type),
         schedule_values = COALESCE($8, schedule_values),
         times = CASE WHEN $9::jsonb <> '[]'::jsonb THEN $9::jsonb ELSE times END,
         start_date = COALESCE($10, start_date),
         end_date = $11,
         category = COALESCE($12, category)
     WHERE id = $13 AND COALESCE(is_active, TRUE) = TRUE
     RETURNING ${MED_RETURNING}`,
    [
      data.name,
      data.dosage,
      data.time_schedule,
      data.form || "PILL",
      data.strength || "",
      data.instructions || "",
      data.schedule_type || "DAILY",
      JSON.stringify(data.schedule_values || []),
      JSON.stringify(timesArray),
      data.start_date || null,
      data.end_date || null,
      data.category || "General",
      id,
    ]
  );
  return result.rows[0];
};

export const archiveMedication = async (id: string | number, db: Queryable = pool) => {
  const result = await db.query("UPDATE medications SET is_active = FALSE WHERE id = $1 RETURNING id", [id]);
  return result.rows[0];
};

export const upsertMedicationLog = async (
  data: {
    medicationId: string | number;
    elderId: string | number;
    takenStatus: boolean;
    status: string;
    scheduledTime?: string | null;
    clientUpdatedAt?: Date;
  },
  db: Queryable = pool
) => {
  const clientTimestamp = data.clientUpdatedAt || new Date();
  const result = await db.query(
    `INSERT INTO medication_logs (
       medication_id, elder_id, taken_status, taken_at, logged_date, updated_at,
       status, action_time, scheduled_time
     )
     VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8)
     ON CONFLICT ON CONSTRAINT uq_med_log_per_day
     DO UPDATE SET
       taken_status = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.taken_status ELSE medication_logs.taken_status END,
       taken_at = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.taken_at ELSE medication_logs.taken_at END,
       updated_at = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.updated_at ELSE medication_logs.updated_at END,
       status = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.status ELSE medication_logs.status END,
       action_time = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.action_time ELSE medication_logs.action_time END,
       scheduled_time = COALESCE(EXCLUDED.scheduled_time, medication_logs.scheduled_time)
     RETURNING *`,
    [
      data.medicationId,
      data.elderId,
      data.takenStatus,
      data.takenStatus ? new Date() : null,
      clientTimestamp,
      data.status,
      data.status === "TAKEN" || data.status === "SKIPPED" ? new Date() : null,
      data.scheduledTime || null,
    ]
  );
  return result.rows[0];
};

export const findUpcomingMedications = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT m.id, m.name, m.dosage,
            TO_CHAR(m.time_schedule, 'HH24:MI') as time_schedule,
            COALESCE(ml.taken_status, FALSE) as taken,
            COALESCE(m.form, 'PILL') as form,
            COALESCE(m.strength, '') as strength,
            COALESCE(m.instructions, '') as instructions
     FROM medications m
     LEFT JOIN medication_logs ml
       ON ml.medication_id = m.id AND ml.elder_id = $1 AND ml.logged_date = CURRENT_DATE
     WHERE m.elder_id = $1
       AND COALESCE(m.is_active, TRUE) = TRUE
       AND COALESCE(ml.taken_status, FALSE) = FALSE
       AND m.time_schedule >= (CURRENT_TIME - INTERVAL '1 hour')
     ORDER BY m.time_schedule ASC
     LIMIT 5`,
    [elderId]
  );
  return result.rows;
};

export const findTodayMedicationTimeline = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT
       m.id, m.name, m.dosage, m.form,
       TO_CHAR(m.time_schedule, 'HH12:MI AM') as time_schedule,
       m.instructions, m.category,
       COALESCE(ml.taken_status, FALSE) as taken_status,
       ml.taken_at,
       CASE
         WHEN COALESCE(ml.taken_status, FALSE) = TRUE THEN 'taken'
         WHEN m.time_schedule < CURRENT_TIME THEN 'missed'
         ELSE 'upcoming'
       END as status
     FROM medications m
     LEFT JOIN medication_logs ml
       ON ml.medication_id = m.id AND ml.elder_id = $1 AND ml.logged_date = CURRENT_DATE
     WHERE m.elder_id = $1 AND m.is_active = TRUE
     ORDER BY m.time_schedule ASC`,
    [elderId]
  );
  return result.rows;
};

export const findWeeklyMedicationAdherence = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT
       ml.logged_date::text as date,
       TO_CHAR(ml.logged_date, 'Dy') as day_label,
       COUNT(m.id) as total,
       SUM(CASE WHEN COALESCE(ml.taken_status, FALSE) THEN 1 ELSE 0 END) as taken,
       CASE WHEN COUNT(m.id) > 0
         THEN ROUND(SUM(CASE WHEN COALESCE(ml.taken_status, FALSE) THEN 1 ELSE 0 END) * 100.0 / COUNT(m.id))
         ELSE 0
       END as percent
     FROM medications m
     LEFT JOIN medication_logs ml
       ON ml.medication_id = m.id AND ml.elder_id = $1
       AND ml.logged_date >= CURRENT_DATE - INTERVAL '6 days'
     WHERE m.elder_id = $1 AND m.is_active = TRUE
     GROUP BY ml.logged_date
     ORDER BY ml.logged_date ASC`,
    [elderId]
  );
  return result.rows;
};

export const findMonthlyMedicationAdherence = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT
       COUNT(m.id) as total_scheduled,
       SUM(CASE WHEN COALESCE(ml.taken_status, FALSE) THEN 1 ELSE 0 END) as total_taken
     FROM medications m
     LEFT JOIN medication_logs ml
       ON ml.medication_id = m.id AND ml.elder_id = $1
       AND ml.logged_date >= CURRENT_DATE - INTERVAL '29 days'
     WHERE m.elder_id = $1 AND m.is_active = TRUE`,
    [elderId]
  );
  return result.rows[0];
};

export const findMedicationHistory = async (elderId: string | number, days: number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT m.id as medication_id, m.name, m.dosage, m.form,
            TO_CHAR(m.time_schedule, 'HH12:MI AM') as scheduled_time,
            d.log_date::date::text as date,
            COALESCE(ml.taken_status, FALSE) as taken,
            TO_CHAR(ml.taken_at, 'HH12:MI AM') as taken_at,
            CASE
              WHEN COALESCE(ml.taken_status, FALSE) = TRUE THEN 'TAKEN'
              WHEN d.log_date::date < CURRENT_DATE THEN 'MISSED'
              WHEN d.log_date::date = CURRENT_DATE AND m.time_schedule < CURRENT_TIME THEN 'MISSED'
              ELSE 'UPCOMING'
            END as status
     FROM medications m
     CROSS JOIN generate_series(CURRENT_DATE - ($2::int - 1), CURRENT_DATE, '1 day'::interval) AS d(log_date)
     LEFT JOIN medication_logs ml
       ON ml.medication_id = m.id AND ml.elder_id = $1 AND ml.logged_date = d.log_date::date
     WHERE m.elder_id = $1 AND m.is_active = TRUE
       AND d.log_date::date >= m.start_date
       AND (m.end_date IS NULL OR d.log_date::date <= m.end_date)
     ORDER BY d.log_date DESC, m.time_schedule ASC`,
    [elderId, days]
  );
  return result.rows;
};

export const getMedicationDictionary = () => [
  { name: "Paracetamol", form: "PILL", defaultStrength: "500mg", category: "Pain Relief", instructions: "Take after meals" },
  { name: "Metformin", form: "PILL", defaultStrength: "500mg", category: "Diabetes", instructions: "Take with food" },
  { name: "Atorvastatin", form: "PILL", defaultStrength: "20mg", category: "Heart Health", instructions: "Take at bedtime" },
  { name: "Amlodipine", form: "PILL", defaultStrength: "5mg", category: "Blood Pressure", instructions: "Take in the morning" },
  { name: "Omeprazole", form: "PILL", defaultStrength: "20mg", category: "General", instructions: "Take before breakfast" },
  { name: "Aspirin", form: "PILL", defaultStrength: "75mg", category: "Heart Health", instructions: "Take with food" },
  { name: "Losartan", form: "PILL", defaultStrength: "50mg", category: "Blood Pressure", instructions: "Take daily" },
  { name: "Metoprolol", form: "PILL", defaultStrength: "25mg", category: "Blood Pressure", instructions: "Take with meals" },
  { name: "Gabapentin", form: "PILL", defaultStrength: "300mg", category: "Pain Relief", instructions: "Take as directed" },
  { name: "Furosemide", form: "PILL", defaultStrength: "40mg", category: "Heart Health", instructions: "Take in morning to avoid nocturia" },
  { name: "Levothyroxine", form: "PILL", defaultStrength: "50mcg", category: "General", instructions: "Take on empty stomach" },
  { name: "Vitamin D3", form: "PILL", defaultStrength: "1000 IU", category: "Supplements", instructions: "Take with food" },
  { name: "Insulin Glargine", form: "INJECTION", defaultStrength: "10 units", category: "Diabetes", instructions: "Subcutaneous injection at same time daily" },
  { name: "Cough Syrup", form: "LIQUID", defaultStrength: "10ml", category: "General", instructions: "Take every 6 hours as needed" },
  { name: "Eye Drops (Lubricant)", form: "DROPS", defaultStrength: "2 drops", category: "General", instructions: "Instill into affected eye" },
];
