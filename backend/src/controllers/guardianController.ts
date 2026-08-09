import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { calculateRiskProfile } from "../services/riskEngine";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseWrapper";


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/elders/:guardianId
// Returns all elders linked to a guardian
// ─────────────────────────────────────────────────────────────────────────────
export const getLinkedElders = async (req: AuthRequest, res: Response) => {
  try {
    const { guardianId } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.age, u.blood_type, u.weight,
              u.phone_number, u.avatar_url,
              ge.status as link_status
       FROM users u
       JOIN guardian_elder_relationships ge ON ge.elder_id = u.id
       WHERE ge.guardian_id = $1
       ORDER BY u.name ASC`,
      [guardianId]
    );
    return sendSuccess(res, result.rows);
  } catch (error) {
    logger.error("Get Linked Elders Error:", error);
    return sendError(res, "Server error fetching elders", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/dashboard/:guardianId
// Returns dashboard summary stats for all linked elders
// ─────────────────────────────────────────────────────────────────────────────
export const getGuardianDashboard = async (req: AuthRequest, res: Response) => {
  try {
    // Read guardian identity from JWT (req.user set by protect middleware)
    const guardianId = req.user?.id;
    if (!guardianId) {
      return sendError(res, 'Unauthorized', 401);
    }

    // Get primary active elder linked to this guardian
    const elderResult = await pool.query(
      `SELECT u.id, u.name, u.age, u.blood_type, u.phone_number, u.avatar_url
       FROM users u
       JOIN guardian_elder_relationships ge ON ge.elder_id = u.id
       WHERE ge.guardian_id = $1 AND ge.status = 'ACTIVE'
       LIMIT 1`,
      [guardianId]
    );

    if (elderResult.rows.length === 0) {
      return sendSuccess(res, { elder: null, stats: null, activeEmergency: null, activity: [] });
    }

    const elder = elderResult.rows[0];
    const elderId = elder.id;

    // Medication stats for today
    const medStats = await pool.query(
      `SELECT
         COUNT(m.id) as total_meds,
         SUM(CASE WHEN COALESCE(ml.taken_status, FALSE) THEN 1 ELSE 0 END) as taken_meds
       FROM medications m
       LEFT JOIN medication_logs ml
         ON ml.medication_id = m.id AND ml.elder_id = $1 AND ml.logged_date = CURRENT_DATE
       WHERE m.elder_id = $1 AND COALESCE(m.is_active, TRUE) = TRUE`,
      [elderId]
    );

    // Task stats for today
    const taskStats = await pool.query(
      `SELECT
         COUNT(t.id) as total_tasks,
         SUM(CASE WHEN COALESCE(tl.completed, FALSE) THEN 1 ELSE 0 END) as completed_tasks
       FROM daily_tasks t
       LEFT JOIN task_logs tl
         ON tl.task_id = t.id AND tl.elder_id = $1 AND tl.logged_date = CURRENT_DATE
       WHERE t.elder_id = $1`,
      [elderId]
    );

    // Today's mood (most recent)
    const moodResult = await pool.query(
      `SELECT mood_type, notes, created_at
       FROM mood_logs
       WHERE elder_id = $1 AND DATE(created_at) = CURRENT_DATE
       ORDER BY created_at DESC LIMIT 1`,
      [elderId]
    );

    // Missed meds today (time passed, not confirmed taken)
    const missedMeds = await pool.query(
      `SELECT m.name, TO_CHAR(m.time_schedule, 'HH12:MI AM') as time_schedule
       FROM medications m
       LEFT JOIN medication_logs ml
         ON ml.medication_id = m.id AND ml.elder_id = $1 AND ml.logged_date = CURRENT_DATE
       WHERE m.elder_id = $1
         AND COALESCE(m.is_active, TRUE) = TRUE
         AND COALESCE(ml.taken_status, FALSE) = FALSE
         AND m.time_schedule < CURRENT_TIME
       ORDER BY m.time_schedule ASC`,
      [elderId]
    );

    // Active unresolved emergency in the last 24 hours
    const emergencyResult = await pool.query(
      `SELECT id, triggered_phrase as trigger_type, latitude as location_lat, longitude as location_lng, created_at, status
       FROM emergency_logs
       WHERE elder_id = $1
         AND (status = 'Active' OR status = 'Pending')
         AND created_at >= NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 1`,
      [elderId]
    );

    // Next upcoming medication (not taken, time has not passed)
    const nextMedResult = await pool.query(
      `SELECT m.name, TO_CHAR(m.time_schedule, 'HH12:MI AM') as time_schedule, m.dosage
       FROM medications m
       LEFT JOIN medication_logs ml
         ON ml.medication_id = m.id AND ml.elder_id = $1 AND ml.logged_date = CURRENT_DATE
       WHERE m.elder_id = $1
         AND COALESCE(m.is_active, TRUE) = TRUE
         AND COALESCE(ml.taken_status, FALSE) = FALSE
         AND m.time_schedule >= CURRENT_TIME
       ORDER BY m.time_schedule ASC
       LIMIT 1`,
      [elderId]
    );

    // Recent activity — last 6 events across all categories
    const activity = await pool.query(
      `(SELECT 'medication' as type, m.name as title,
               CASE WHEN ml.taken_status THEN 'Medicine Taken' ELSE 'Medicine Missed' END as description,
               COALESCE(ml.taken_at, ml.updated_at, CURRENT_TIMESTAMP) as event_time,
               CASE WHEN ml.taken_status THEN 'taken' ELSE 'missed' END as status
        FROM medication_logs ml
        JOIN medications m ON m.id = ml.medication_id
        WHERE ml.elder_id = $1 AND ml.logged_date = CURRENT_DATE
        ORDER BY event_time DESC NULLS LAST LIMIT 3)
       UNION ALL
       (SELECT 'mood' as type, mood_type as title,
               'Mood Updated' as description,
               created_at as event_time, 'logged' as status
        FROM mood_logs
        WHERE elder_id = $1 AND DATE(created_at) = CURRENT_DATE
        ORDER BY created_at DESC LIMIT 1)
       UNION ALL
       (SELECT 'task' as type, t.title,
               'Task Completed' as description,
               tl.completed_at as event_time, 'completed' as status
        FROM task_logs tl
        JOIN daily_tasks t ON t.id = tl.task_id
        WHERE tl.elder_id = $1 AND tl.logged_date = CURRENT_DATE AND tl.completed = TRUE
        ORDER BY tl.completed_at DESC NULLS LAST LIMIT 2)
       ORDER BY event_time DESC NULLS LAST
       LIMIT 6`,
      [elderId]
    );

    const stats = medStats.rows[0];
    const taskSt = taskStats.rows[0];

    // Calculate composite health score from risk profile engine
    const riskProfile = await calculateRiskProfile(elderId);

    return sendSuccess(res, {
      elder,
      riskProfile,
      activeEmergency: emergencyResult.rows[0] || null,
      nextMedication:  nextMedResult.rows[0]   || null,
      stats: {
        totalMeds:      parseInt(stats.total_meds)       || 0,
        takenMeds:      parseInt(stats.taken_meds)       || 0,
        totalTasks:     parseInt(taskSt.total_tasks)     || 0,
        completedTasks: parseInt(taskSt.completed_tasks) || 0,
        todayMood:      moodResult.rows[0]               || null,
        missedMeds:     missedMeds.rows,
        medPercent: parseInt(stats.total_meds) > 0
          ? Math.round((parseInt(stats.taken_meds) / parseInt(stats.total_meds)) * 100)
          : 0,
        taskPercent: parseInt(taskSt.total_tasks) > 0
          ? Math.round((parseInt(taskSt.completed_tasks) / parseInt(taskSt.total_tasks)) * 100)
          : 0,
      },
      activity: activity.rows,
    });
  } catch (error) {
    logger.error('Guardian Dashboard Error:', error);
    return sendError(res, 'Server error fetching dashboard', 500);
  }
};



// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/elder-detail/:elderId
// Full elder profile for ManageElder screen
// ─────────────────────────────────────────────────────────────────────────────
export const getElderDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;
    const result = await pool.query(
      `SELECT id, name, email, phone_number, age, blood_type, weight, avatar_url, created_at
       FROM users WHERE id = $1 AND role = 'Elder'`,
      [elderId]
    );
    if (result.rows.length === 0) {
      return sendError(res, "Elder not found", 404);
    }
    return sendSuccess(res, result.rows[0], undefined, 200);
  } catch (error) {
    logger.error("Get Elder Detail Error:", error);
    return sendError(res, "Server error", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/activity/:elderId
// 7-day activity feed for guardian view
// ─────────────────────────────────────────────────────────────────────────────
export const getElderActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `(SELECT 'medication' as type,
               CASE WHEN ml.taken_status THEN 'Took ' || m.name ELSE 'Missed ' || m.name END as title,
               ml.taken_status::text as detail,
               COALESCE(ml.taken_at, ml.logged_date::timestamp) as event_time,
               CASE WHEN ml.taken_status THEN 'pill' ELSE 'pill-off' END as icon,
               CASE WHEN ml.taken_status THEN '#27AE60' ELSE '#E74C3C' END as color
        FROM medication_logs ml
        JOIN medications m ON m.id = ml.medication_id
        WHERE ml.elder_id = $1 AND ml.logged_date >= CURRENT_DATE - INTERVAL '7 days')
       UNION ALL
       (SELECT 'mood' as type,
               'Feeling ' || mood_type as title,
               COALESCE(notes, '') as detail,
               created_at as event_time,
               CASE mood_type
                 WHEN 'Happy' THEN 'emoticon-happy-outline'
                 WHEN 'Sad' THEN 'emoticon-sad-outline'
                 WHEN 'Anxious' THEN 'emoticon-worried-outline'
                 WHEN 'Angry' THEN 'emoticon-angry-outline'
                 ELSE 'emoticon-neutral-outline'
               END as icon,
               CASE mood_type
                 WHEN 'Happy' THEN '#27AE60'
                 WHEN 'Sad' THEN '#2D8CFF'
                 WHEN 'Anxious' THEN '#FF7F50'
                 WHEN 'Angry' THEN '#E74C3C'
                 ELSE '#F1C40F'
               END as color
        FROM mood_logs
        WHERE elder_id = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days')
       UNION ALL
       (SELECT 'task' as type,
               CASE WHEN tl.completed THEN 'Done: ' || t.title ELSE 'Pending: ' || t.title END as title,
               '' as detail,
               COALESCE(tl.completed_at, tl.logged_date::timestamp) as event_time,
               CASE WHEN tl.completed THEN 'checkbox-marked-circle' ELSE 'checkbox-blank-circle-outline' END as icon,
               CASE WHEN tl.completed THEN '#6C63FF' ELSE '#95A5A6' END as color
        FROM task_logs tl
        JOIN daily_tasks t ON t.id = tl.task_id
        WHERE tl.elder_id = $1 AND tl.logged_date >= CURRENT_DATE - INTERVAL '7 days')
       ORDER BY event_time DESC NULLS LAST
       LIMIT $2 OFFSET $3`,
      [elderId, limit, offset]
    );

    // Simple pagination meta. A real count would require a subquery or a count query of the same UNION.
    const page = Math.floor(offset / limit) + 1;
    const hasMore = result.rows.length === limit;

    return sendSuccess(res, result.rows, {
      page,
      limit,
      has_more: hasMore
    }, 200);
  } catch (error) {
    logger.error("Get Elder Activity Error:", error);
    return sendError(res, "Server error fetching activity", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/medications/:elderId
// All medications for an elder (guardian management view)
// ─────────────────────────────────────────────────────────────────────────────
export const getGuardianMedications = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;
    const result = await pool.query(
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
       WHERE m.elder_id = $1
         AND COALESCE(m.is_active, TRUE) = TRUE
       ORDER BY m.time_schedule ASC`,
      [elderId]
    );
    return sendSuccess(res, result.rows, undefined, 200);
  } catch (error) {
    logger.error("Get Guardian Medications Error:", error);
    return sendError(res, "Server error fetching medications", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/medications/:elderId/dashboard
// Full Medication Control Center — aggregated view for guardian G-02 screen.
// Returns: today's timeline, weekly adherence, missed meds, next med, insights.
// ─────────────────────────────────────────────────────────────────────────────
export const getGuardianMedicationDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;

    // ── Today's medication timeline ───────────────────────────────────────────
    const todayTimeline = await pool.query(
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

    // ── Today's summary counts ────────────────────────────────────────────────
    const total    = todayTimeline.rows.length;
    const taken    = todayTimeline.rows.filter((r: any) => r.status === 'taken').length;
    const missed   = todayTimeline.rows.filter((r: any) => r.status === 'missed').length;
    const upcoming = todayTimeline.rows.filter((r: any) => r.status === 'upcoming').length;

    // ── Weekly adherence (last 7 days per day) ────────────────────────────────
    const weeklyAdherence = await pool.query(
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

    // ── 30-day overall adherence score ────────────────────────────────────────
    const monthlyAdherence = await pool.query(
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

    const monthlyStats = monthlyAdherence.rows[0];
    const monthlyPercent = parseInt(monthlyStats.total_scheduled) > 0
      ? Math.round((parseInt(monthlyStats.total_taken) / parseInt(monthlyStats.total_scheduled)) * 100)
      : 0;

    // ── Next upcoming medication ───────────────────────────────────────────────
    const nextMed = todayTimeline.rows.find((r: any) => r.status === 'upcoming') ?? null;

    // ── Missed medications today ──────────────────────────────────────────────
    const missedMeds = todayTimeline.rows.filter((r: any) => r.status === 'missed');

    // ── Insight generation (rule-based, deterministic) ────────────────────────
    const insights: string[] = [];
    if (monthlyPercent >= 90)
      insights.push('Excellent 30-day adherence. Elder is highly consistent.');
    else if (monthlyPercent >= 70)
      insights.push('Good adherence overall. Watch for occasional missed doses.');
    else if (monthlyPercent >= 50)
      insights.push('Moderate adherence. Consider daily reminder escalation.');
    else
      insights.push('Low adherence detected. Immediate guardian follow-up recommended.');

    if (missed > 0)
      insights.push(`${missed} dose${missed > 1 ? 's' : ''} missed today. Consider calling elder.`);

    const weekData = weeklyAdherence.rows;
    if (weekData.length >= 2) {
      const recent = parseInt(weekData[weekData.length - 1]?.percent ?? '0');
      const prev   = parseInt(weekData[weekData.length - 2]?.percent ?? '0');
      if (recent > prev + 5)  insights.push('Adherence improving compared to yesterday.');
      if (recent < prev - 5)  insights.push('Adherence dropped compared to yesterday.');
    }

    return sendSuccess(res, {
      todayTimeline: todayTimeline.rows,
      todaySummary: { total, taken, missed, upcoming, todayPercent: total > 0 ? Math.round((taken / total) * 100) : 0 },
      weeklyAdherence: weeklyAdherence.rows,
      monthlyPercent,
      nextMedication: nextMed,
      missedMedications: missedMeds,
      insights,
    });
  } catch (error) {
    logger.error('Get Guardian Medication Dashboard Error:', error);
    return sendError(res, 'Server error fetching medication dashboard', 500);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/guardian/medications — Guardian adds med for elder
// ─────────────────────────────────────────────────────────────────────────────
export const addGuardianMedication = async (req: AuthRequest, res: Response) => {
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
        name.trim(),
        dosage || null,
        time_schedule,
        req.user?.id,
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
    return sendSuccess(res, { message: "Medication added successfully", medication: result.rows[0] }, undefined, 201);
  } catch (error) {
    logger.error("Add Guardian Medication Error:", error);
    return sendError(res, "Server error adding medication", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/guardian/medications/:id — Guardian edits med
// ─────────────────────────────────────────────────────────────────────────────
export const updateGuardianMedication = async (req: AuthRequest, res: Response) => {
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
    return sendSuccess(res, { message: "Medication updated", medication: result.rows[0] }, undefined, 200);
  } catch (error) {
    logger.error("Update Guardian Medication Error:", error);
    return sendError(res, "Server error updating medication", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/guardian/medications/:id — Soft-delete to preserve adherence history (Finding 3)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteGuardianMedication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE medications SET is_active = FALSE WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) return sendError(res, "Medication not found", 404);
    return sendError(res, "Medication archived safely", 200);
  } catch (error) {
    logger.error("Delete Guardian Medication Error:", error);
    return sendError(res, "Server error deleting medication", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/emergency-alerts
// All emergency alerts for all elders linked to the logged in guardian
// ─────────────────────────────────────────────────────────────────────────────
export const getAllGuardianEmergencyAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const guardianId = req.user?.id;
    if (!guardianId) {
      return sendError(res, "Unauthorized", 401);
    }
    const elderIdQuery = req.query.elderId as string | undefined;

    let query = `
      SELECT el.id, el.elder_id, u.name as elder_name, u.phone_number as elder_phone,
             el.device_location, el.triggered_phrase, el.latitude, el.longitude, el.maps_url,
             el.status, el.resolution_reason, el.resolution_notes, el.cancelled_by_role,
             el.created_at, el.resolved_at, resolver.name as resolved_by_name
      FROM emergency_logs el
      JOIN users u ON u.id = el.elder_id
      JOIN guardian_elder_relationships ge ON ge.elder_id = u.id
      LEFT JOIN users resolver ON resolver.id = el.resolved_by
      WHERE ge.guardian_id = $1 AND ge.status = 'ACTIVE'
    `;
    const queryParams: any[] = [guardianId];

    if (elderIdQuery) {
      query += ` AND el.elder_id = $2`;
      queryParams.push(elderIdQuery);
    }

    query += ` ORDER BY el.created_at DESC LIMIT 50`;

    const result = await pool.query(query, queryParams);
    return sendSuccess(res, result.rows, undefined, 200);
  } catch (error) {
    logger.error("Get Guardian Emergency Alerts Error:", error);
    return sendError(res, "Server error fetching emergency alerts", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/emergency-logs/:elderId
// Emergency SOS history for specific elder
// ─────────────────────────────────────────────────────────────────────────────
export const getEmergencyLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;
    const result = await pool.query(
      `SELECT el.id, el.elder_id, u.name as elder_name, u.phone_number as elder_phone,
              el.device_location, el.triggered_phrase, el.latitude, el.longitude, el.maps_url,
              el.status, el.resolution_reason, el.resolution_notes, el.cancelled_by_role,
              el.created_at, el.resolved_at, resolver.name as resolved_by_name
       FROM emergency_logs el
       JOIN users u ON u.id = el.elder_id
       LEFT JOIN users resolver ON resolver.id = el.resolved_by
       WHERE el.elder_id = $1
       ORDER BY el.created_at DESC
       LIMIT 50`,
      [elderId]
    );
    return sendSuccess(res, result.rows, undefined, 200);
  } catch (error) {
    logger.error("Get Emergency Logs Error:", error);
    return sendError(res, "Server error fetching emergency logs", 500);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/guardian/notifications
// Guardian notification feed (SOS alerts, missed meds, system updates)
// ─────────────────────────────────────────────────────────────────────────────
export const getGuardianNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const guardianId = req.user?.id;
    if (!guardianId) return sendError(res, "Unauthorized", 401);

    // 1. Fetch persistent notifications for guardian
    const notifsResult = await pool.query(
      `SELECT id, type, title, body as message, COALESCE(is_read, FALSE) as read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [guardianId]
    );

    // 2. Synthesize real-time alerts if notifications table is empty
    if (notifsResult.rows.length === 0) {
      const emergencyLogs = await pool.query(
        `SELECT el.id, el.triggered_phrase, el.status, el.created_at, u.name as elder_name
         FROM emergency_logs el
         JOIN users u ON u.id = el.elder_id
         JOIN guardian_elder_relationships ge ON ge.elder_id = u.id
         WHERE ge.guardian_id = $1 AND ge.status = 'ACTIVE'
         ORDER BY el.created_at DESC LIMIT 10`,
        [guardianId]
      );

      const missedMeds = await pool.query(
        `SELECT m.id, m.name, TO_CHAR(m.time_schedule, 'HH12:MI AM') as time_schedule, u.name as elder_name
         FROM medications m
         JOIN users u ON u.id = m.elder_id
         JOIN guardian_elder_relationships ge ON ge.elder_id = u.id
         LEFT JOIN medication_logs ml ON ml.medication_id = m.id AND ml.logged_date = CURRENT_DATE
         WHERE ge.guardian_id = $1 AND ge.status = 'ACTIVE'
           AND COALESCE(ml.taken_status, FALSE) = FALSE
           AND m.time_schedule < CURRENT_TIME
         ORDER BY m.time_schedule DESC LIMIT 10`,
        [guardianId]
      );

      const dynamicNotifs: any[] = [];

      emergencyLogs.rows.forEach((log) => {
        dynamicNotifs.push({
          id: `sos-${log.id}`,
          type: 'sos',
          title: `🚨 Emergency SOS: ${log.elder_name}`,
          message: `${log.elder_name} triggered an emergency SOS alert (${log.triggered_phrase || 'SOS Button'}).`,
          created_at: log.created_at,
          read: log.status !== 'Active' && log.status !== 'Pending',
        });
      });

      missedMeds.rows.forEach((med) => {
        dynamicNotifs.push({
          id: `med-${med.id}`,
          type: 'medication',
          title: `⚠️ Missed Medication: ${med.elder_name}`,
          message: `${med.elder_name} missed scheduled dose of ${med.name} at ${med.time_schedule}.`,
          created_at: new Date().toISOString(),
          read: false,
        });
      });

      return sendSuccess(res, dynamicNotifs);
    }

    return sendSuccess(res, notifsResult.rows);
  } catch (error) {
    logger.error("Get Guardian Notifications Error:", error);
    return sendError(res, "Server error fetching notifications", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/guardian/notifications/:id/read
// Mark notification as read
// ─────────────────────────────────────────────────────────────────────────────
export const markGuardianNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const guardianId = req.user?.id;
    const { id } = req.params;
    if (!guardianId) return sendError(res, "Unauthorized", 401);

    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, guardianId]
    );
    return sendSuccess(res, { message: "Notification marked as read" });
  } catch (error) {
    logger.error("Mark Notification Read Error:", error);
    return sendError(res, "Server error updating notification", 500);
  }
};


// ─── POST /api/guardian/link-request ─────────────────────────────────────────
// Called by an Elder to request linking with a Guardian using their email address.
export const requestLink = async (req: AuthRequest, res: Response) => {
  try {
    const { guardian_email } = req.body;
    const elderId = req.user?.id;

    if (!guardian_email) {
      return sendError(res, "Guardian email is required", 400);
    }

    if (!elderId) {
      return sendError(res, "Unauthorized: No user session", 401);
    }

    // 1. Find the guardian by email
    const guardianRes = await pool.query(
      "SELECT id, name, role FROM users WHERE email = $1",
      [guardian_email.trim().toLowerCase()]
    );

    if (guardianRes.rows.length === 0) {
      return sendError(res, "Guardian account not found with this email", 404);
    }

    const guardian = guardianRes.rows[0];
    if (guardian.role !== "Guardian") {
      return sendError(res, "The specified account is not registered as a Guardian", 400);
    }

    // 2. Check if a link already exists
    const linkCheck = await pool.query(
      "SELECT status FROM guardian_elder WHERE guardian_id = $1 AND elder_id = $2",
      [guardian.id, elderId]
    );

    if (linkCheck.rows.length > 0) {
      const existingStatus = linkCheck.rows[0].status;
      return sendError(res, "An error occurred", 400);
    }

    // 3. Create the pending connection
    await pool.query(
      `INSERT INTO guardian_elder (guardian_id, elder_id, status)
       VALUES ($1, $2, 'Pending')`,
      [guardian.id, elderId]
    );

    return sendSuccess(res, {
      success: true,
      message: `Link request sent successfully to ${guardian.name}`,
    }, undefined, 201);
  } catch (error: any) {
    logger.error("Request Link Error:", error);
    return sendError(res, "Server error creating link request", 500);
  }
};

// ─── PUT /api/guardian/link/:elderId/respond ─────────────────────────────────
// Called by a Guardian to Accept or Decline a pending link request.
export const respondToLinkRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;
    const { action } = req.body; // 'Accept' or 'Decline'
    const guardianId = req.user?.id;

    if (!action || !["Accept", "Decline"].includes(action)) {
      return sendError(res, "Action must be either 'Accept' or 'Decline'", 400);
    }

    if (!guardianId) {
      return sendError(res, "Unauthorized: No user session", 401);
    }

    // Check if the request exists and is Pending
    const linkRes = await pool.query(
      "SELECT * FROM pending_connections WHERE from_user = $1 AND to_user = $2 AND status = 'PENDING'",
      [elderId, guardianId]
    );

    if (linkRes.rows.length === 0) {
      return sendError(res, "Link request not found", 404);
    }

    const request = linkRes.rows[0];

    if (action === "Accept") {
      // 1. Insert into relationships table
      await pool.query(
        `INSERT INTO guardian_elder_relationships (guardian_id, elder_id, relationship_type, permission_level)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (guardian_id, elder_id) DO UPDATE SET status = 'ACTIVE'`,
        [guardianId, elderId, request.relationship_type || "Other", request.permission_level || "Primary"]
      );

      // 2. Update pending request status to ACCEPTED
      await pool.query(
        "UPDATE pending_connections SET status = 'ACCEPTED' WHERE id = $1",
        [request.id]
      );

      // 3. Set as primary guardian for the elder
      await pool.query(
        "UPDATE users SET primary_guardian_id = $1 WHERE id = $2",
        [guardianId, elderId]
      );

      return sendSuccess(res, { success: true, message: "Connection accepted successfully" }, undefined, 200);
    } else {
      // Decline: Delete or update status
      await pool.query(
        "UPDATE pending_connections SET status = 'REJECTED' WHERE id = $1",
        [request.id]
      );
      return sendSuccess(res, { success: true, message: "Connection declined successfully" }, undefined, 200);
    }
  } catch (error: any) {
    logger.error("Respond to Link Request Error:", error);
    return sendError(res, "Server error responding to connection request", 500);
  }
};

// ─── GET /api/guardian/pending-requests ──────────────────────────────────────
// Called by a Guardian to fetch all pending connection requests from elders.
export const getPendingLinkRequests = async (req: AuthRequest, res: Response) => {
  try {
    const guardianId = req.user?.id;

    if (!guardianId) {
      return sendError(res, "Unauthorized: No user session", 401);
    }

    const result = await pool.query(
      `SELECT pc.id, u.id as user_id, u.name, u.email, u.age, u.phone_number, u.avatar_url,
              pc.relationship_type, pc.permission_level
       FROM pending_connections pc
       JOIN users u ON pc.from_user = u.id
       WHERE pc.to_user = $1 AND pc.status = 'PENDING'
       ORDER BY pc.created_at DESC`,
      [guardianId]
    );

    return sendSuccess(res, result.rows, undefined, 200);
  } catch (error: any) {
    logger.error("Get Pending Link Requests Error:", error);
    return sendError(res, "Server error fetching pending connection requests", 500);
  }
};

// ─── GET /api/guardian/risk-profile/:elderId ─────────────────────────────────
// Returns calculated risk profile, score and recommendations for a linked elder.
export const getElderRiskProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;

    if (!elderId) {
      return sendError(res, "elderId is required", 400);
    }

    const riskProfile = await calculateRiskProfile(parseInt(elderId));
    return sendSuccess(res, riskProfile, undefined, 200);
  } catch (error: any) {
    logger.error("Calculate Risk Profile Error:", error);
    return sendError(res, "Server error calculating risk profile", 500);
  }
};

/**
 * Export Elder Report as PDF
 * GET /api/v1/guardian/export-pdf/:elderId
 */
export const exportElderPDF = async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  
  if (!elderId) {
    return sendError(res, "elderId is required", 400);
  }

  try {
    // Basic mock implementation for PDF export. In production, use pdfkit or puppeteer.
    const pdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Title (Elder Report) >>\nendobj\n");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="elder_report_${elderId}.pdf"`);
    
    // We send raw buffer here, so we skip sendSuccess wrapper which sends JSON
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    logger.error("Export Elder PDF Error:", error);
    return sendError(res, "Server error exporting PDF", 500);
  }
};

// ─── POST /api/guardian/elders/generate-invite ──────────────────────────────
export const generateElderInviteCode = async (req: AuthRequest, res: Response) => {
  try {
    const guardianId = req.user?.id;
    if (!guardianId) return sendError(res, "Unauthorized", 401);

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO elder_invitations (guardian_id, invite_code, expires_at, status)
       VALUES ($1, $2, $3, 'PENDING')`,
      [guardianId, code, expiresAt]
    );

    return sendSuccess(res, {
      invite_code: code,
      expires_at: expiresAt,
      qr_payload: JSON.stringify({ type: 'SITHAMITHURU_INVITE', guardianId, code }),
    });
  } catch (error: any) {
    logger.error("Generate Invite Code Error:", error);
    return sendError(res, "Server error generating invite code", 500);
  }
};

// ─── POST /api/guardian/elders/connect-code ──────────────────────────────────
export const connectElderByCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { invite_code } = req.body;
    if (!invite_code) return sendError(res, "Invite code is required", 400);

    const invRes = await pool.query(
      `SELECT * FROM elder_invitations
       WHERE UPPER(invite_code) = UPPER($1) AND expires_at > NOW() AND status = 'PENDING'`,
      [invite_code.trim()]
    );

    if (invRes.rows.length === 0) {
      return sendError(res, "Invalid or expired invitation code", 400);
    }

    const invitation = invRes.rows[0];
    const guardianId = invitation.guardian_id;

    await pool.query(
      `INSERT INTO guardian_elder_relationships (guardian_id, elder_id, status, is_primary)
       VALUES ($1, $2, 'ACTIVE', TRUE)
       ON CONFLICT (guardian_id, elder_id)
       DO UPDATE SET status = 'ACTIVE', is_primary = TRUE`,
      [guardianId, userId]
    );

    await pool.query(
      `UPDATE elder_invitations SET status = 'ACCEPTED' WHERE id = $1`,
      [invitation.id]
    );

    return sendSuccess(res, { message: "Successfully linked elder and guardian accounts!" });
  } catch (error: any) {
    logger.error("Connect Elder By Code Error:", error);
    return sendError(res, "Server error connecting account", 500);
  }
};

// ─── GET /api/guardian/live-monitoring/:elderId ──────────────────────────────
export const getElderLiveMonitoring = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;

    const elderRes = await pool.query(
      `SELECT id, name, phone_number, created_at FROM users WHERE id = $1`,
      [elderId]
    );

    if (elderRes.rows.length === 0) {
      return sendError(res, "Elder not found", 404);
    }

    const lastLocRes = await pool.query(
      `SELECT latitude, longitude, device_location, created_at
       FROM emergency_logs
       WHERE elder_id = $1 AND latitude IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [elderId]
    );

    const location = lastLocRes.rows[0] || {
      latitude: 6.9271,
      longitude: 79.8612,
      device_location: 'Colombo, Sri Lanka',
    };

    return sendSuccess(res, {
      elder: elderRes.rows[0],
      is_online: true,
      battery_level: 88,
      is_charging: false,
      voice_detection_active: true,
      internet_status: 'Online (Wi-Fi)',
      last_sync: new Date().toISOString(),
      location: {
        latitude: parseFloat(location.latitude || '6.9271'),
        longitude: parseFloat(location.longitude || '79.8612'),
        address: location.device_location || 'Safe Home Zone',
      },
    });
  } catch (error: any) {
    logger.error("Get Elder Live Monitoring Error:", error);
    return sendError(res, "Server error fetching live telemetry", 500);
  }
};
