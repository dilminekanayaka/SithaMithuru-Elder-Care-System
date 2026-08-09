import { Request, Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseWrapper";

// Helper: get session label from time (24-hour clinical cycle starting at 04:00 AM)
const getSession = (timeStr: string): string => {
  const hour = parseInt(timeStr.split(":")[0], 10);
  if (hour >= 4 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  return "Night";
};

// GET /api/medications/dictionary — Standard clinical auto-suggest dictionary
export const getMedicationDictionary = async (_req: Request, res: Response) => {
  const dictionary = [
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
  return sendSuccess(res, dictionary);
};

// GET /api/medications/elder/:elderId
export const getMedicationsByElder = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;

    const medsResult = await pool.query(
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
         ON ml.medication_id = m.id
         AND ml.elder_id = $1
         AND ml.logged_date = CURRENT_DATE
       WHERE m.elder_id = $1
         AND COALESCE(m.is_active, TRUE) = TRUE
       ORDER BY m.time_schedule ASC`,
      [elderId]
    );

    // Group by session
    const sessionMap: Record<string, any> = {
      Morning: { id: "morning", title: "Morning", icon: "weather-sunny", color: "#FFB800", bgColor: "#FFFBE6", timeRange: "4:00 AM - 12:00 PM", medicines: [] },
      Afternoon: { id: "afternoon", title: "Afternoon", icon: "weather-partly-cloudy", color: "#2D8CFF", bgColor: "#E6F0FF", timeRange: "12:00 PM - 5:00 PM", medicines: [] },
      Night: { id: "night", title: "Night", icon: "weather-night", color: "#6C63FF", bgColor: "#F2E6FF", timeRange: "5:00 PM - 3:59 AM", medicines: [] },
    };

    medsResult.rows.forEach((med) => {
      const session = getSession(med.time_schedule);
      sessionMap[session].medicines.push({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        time: med.time_schedule,
        taken: med.taken,
        form: med.form,
        strength: med.strength,
        instructions: med.instructions,
        schedule_type: med.schedule_type,
        schedule_values: med.schedule_values,
        times: med.times && Array.isArray(med.times) && med.times.length > 0 ? med.times : [med.time_schedule],
        start_date: med.start_date,
        end_date: med.end_date,
        category: med.category,
        is_active: med.is_active,
        icon: med.form === "LIQUID" ? "bottle-tonic-plus" : med.form === "INJECTION" ? "needle" : med.form === "DROPS" ? "eyedropper" : "pill",
      });
    });

    const sessions = Object.values(sessionMap).filter((s) => s.medicines.length > 0);
    const totalMeds = medsResult.rows.length;
    const takenMeds = medsResult.rows.filter((m) => m.taken).length;

    return sendSuccess(res, { sessions, totalMeds, takenMeds, rawMedications: medsResult.rows });
  } catch (error) {
    logger.error("Get Medications Error:", error);
    return sendError(res, "Server error fetching medications", 500);
  }
};

// POST /api/medications — Create medication
export const createMedication = async (req: AuthRequest, res: Response) => {
  try {
    const {
      elder_id,
      name,
      dosage,
      time_schedule,
      form = "PILL",
      strength = "",
      instructions = "",
      schedule_type = "DAILY",
      schedule_values = [],
      times = [],
      start_date = new Date().toISOString().split("T")[0],
      end_date = null,
      category = "General",
    } = req.body;

    if (!elder_id || !name || !time_schedule) {
      return sendError(res, "elder_id, name, and time_schedule are required", 400);
    }

    const timesArray = Array.isArray(times) && times.length > 0 ? times : [time_schedule];

    const result = await pool.query(
      `INSERT INTO medications (
         elder_id, name, dosage, time_schedule, created_by,
         form, strength, instructions, schedule_type, schedule_values, times, start_date, end_date, category, is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE)
       RETURNING id, name, dosage, TO_CHAR(time_schedule, 'HH24:MI') as time_schedule,
                 form, strength, instructions, schedule_type, schedule_values, times,
                 TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, category, is_active`,
      [
        elder_id,
        name,
        dosage || null,
        time_schedule,
        req.user?.id || elder_id,
        form,
        strength,
        instructions,
        schedule_type,
        JSON.stringify(schedule_values),
        JSON.stringify(timesArray),
        start_date,
        end_date || null,
        category,
      ]
    );

    return sendSuccess(res, result.rows[0], undefined, 201);
  } catch (error) {
    logger.error("Create Medication Error:", error);
    return sendError(res, "Server error creating medication", 500);
  }
};

// PUT /api/medications/:id — Update medication
export const updateMedication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      dosage,
      time_schedule,
      form = "PILL",
      strength = "",
      instructions = "",
      schedule_type = "DAILY",
      schedule_values = [],
      times = [],
      start_date = null,
      end_date = null,
      category = "General",
    } = req.body;

    const timesArray = Array.isArray(times) && times.length > 0 ? times : time_schedule ? [time_schedule] : [];

    const result = await pool.query(
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
       RETURNING id, name, dosage, TO_CHAR(time_schedule, 'HH24:MI') as time_schedule,
                 form, strength, instructions, schedule_type, schedule_values, times,
                 TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, category, is_active`,
      [
        name,
        dosage,
        time_schedule,
        form,
        strength,
        instructions,
        schedule_type,
        JSON.stringify(schedule_values),
        JSON.stringify(timesArray),
        start_date,
        end_date || null,
        category,
        id,
      ]
    );

    if (result.rows.length === 0) return sendError(res, "Medication not found or inactive", 404);
    
    const userId = req.user?.id;
    if (userId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_state) 
         VALUES ($1, 'UPDATE_MEDICATION', 'medications', $2, $3)`,
        [userId, id, JSON.stringify(result.rows[0])]
      );
    }
    
    return sendSuccess(res, result.rows[0]);
  } catch (error) {
    logger.error("Update Medication Error:", error);
    return sendError(res, "Server error updating medication", 500);
  }
};

// DELETE /api/medications/:id — Soft-delete to preserve adherence history (Finding 3)
export const deleteMedication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE medications SET is_active = FALSE WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) return sendError(res, "Medication not found", 404);

    const userId = req.user?.id;
    if (userId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_state) 
         VALUES ($1, 'DELETE_MEDICATION', 'medications', $2, $3)`,
        [userId, id, JSON.stringify({ is_active: false })]
      );
    }

    return sendSuccess(res, { message: "Medication archived safely" });
  } catch (error) {
    logger.error("Delete Medication Error:", error);
    return sendError(res, "Server error deleting medication", 500);
  }
};

// POST /api/medications/log — Toggle taken status with Last-Write-Wins resolution
export const logMedication = async (req: AuthRequest, res: Response) => {
  try {
    const {
      medication_id,
      elder_id,
      taken_status,
      status = taken_status ? "TAKEN" : "PENDING",
      scheduled_time = null,
      client_updated_at,
    } = req.body;

    if (!medication_id || !elder_id) {
      return sendError(res, "medication_id and elder_id are required", 400);
    }

    // Atomic upsert with Last-Write-Wins conflict resolution
    const clientTimestamp = client_updated_at ? new Date(client_updated_at) : new Date();

    const result = await pool.query(
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
        medication_id,
        elder_id,
        taken_status || status === "TAKEN",
        taken_status || status === "TAKEN" ? new Date() : null,
        clientTimestamp,
        status,
        status === "TAKEN" || status === "SKIPPED" ? new Date() : null,
        scheduled_time,
      ]
    );

    return sendSuccess(res, result.rows[0]);
  } catch (error) {
    logger.error("Log Medication Error:", error);
    return sendError(res, "Server error logging medication", 500);
  }
};

// GET /api/medications/upcoming/:elderId — For dashboard reminders
export const getUpcomingMedications = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;

    const result = await pool.query(
      `SELECT m.id, m.name, m.dosage,
              TO_CHAR(m.time_schedule, 'HH24:MI') as time_schedule,
              COALESCE(ml.taken_status, FALSE) as taken,
              COALESCE(m.form, 'PILL') as form,
              COALESCE(m.strength, '') as strength,
              COALESCE(m.instructions, '') as instructions
       FROM medications m
       LEFT JOIN medication_logs ml
         ON ml.medication_id = m.id
         AND ml.elder_id = $1
         AND ml.logged_date = CURRENT_DATE
       WHERE m.elder_id = $1
         AND COALESCE(m.is_active, TRUE) = TRUE
         AND COALESCE(ml.taken_status, FALSE) = FALSE
         AND m.time_schedule >= (CURRENT_TIME - INTERVAL '1 hour')
       ORDER BY m.time_schedule ASC
       LIMIT 5`,
      [elderId]
    );

    return sendSuccess(res, result.rows);
  } catch (error) {
    logger.error("Get Upcoming Medications Error:", error);
    return sendError(res, "Server error", 500);
  }
};

