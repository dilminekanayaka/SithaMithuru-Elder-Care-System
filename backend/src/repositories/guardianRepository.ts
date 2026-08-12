import pool from "../config/db";
import { Queryable } from "../config/transaction";

export const findPrimaryActiveElderForGuardian = async (guardianId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.age, u.blood_type, u.weight, u.phone_number, u.avatar_url
     FROM users u
     JOIN guardian_elder_relationships ge ON ge.elder_id = u.id
     WHERE ge.guardian_id = $1 AND ge.status = 'ACTIVE'
     ORDER BY ge.connected_at DESC
     LIMIT 1`,
    [guardianId]
  );
  return result.rows[0];
};

export const findElderTodayMedStats = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT
       COUNT(m.id) as total_meds,
       SUM(CASE WHEN COALESCE(ml.taken_status, FALSE) THEN 1 ELSE 0 END) as taken_meds
     FROM medications m
     LEFT JOIN medication_logs ml
       ON ml.medication_id = m.id AND ml.elder_id = $1 AND ml.logged_date = CURRENT_DATE
     WHERE m.elder_id = $1 AND COALESCE(m.is_active, TRUE) = TRUE`,
    [elderId]
  );
  return result.rows[0];
};

export const findElderTodayTaskStats = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT
       COUNT(t.id) as total_tasks,
       SUM(CASE WHEN COALESCE(tl.completed, FALSE) THEN 1 ELSE 0 END) as completed_tasks
     FROM daily_tasks t
     LEFT JOIN task_logs tl
       ON tl.task_id = t.id AND tl.elder_id = $1 AND tl.logged_date = CURRENT_DATE
     WHERE t.elder_id = $1 AND t.deleted_at IS NULL`,
    [elderId]
  );
  return result.rows[0];
};

export const findElderTodayMood = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT mood_type, notes, created_at
     FROM mood_logs
     WHERE elder_id = $1 AND DATE(created_at) = CURRENT_DATE
     ORDER BY created_at DESC LIMIT 1`,
    [elderId]
  );
  return result.rows[0] || null;
};

export const findElderMissedMedsToday = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
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
  return result.rows;
};

export const findElderActiveEmergency = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT id, triggered_phrase as trigger_type, latitude as location_lat, longitude as location_lng, created_at, status
     FROM emergency_logs
     WHERE elder_id = $1
       AND (status = 'Active' OR status = 'Pending')
       AND created_at >= NOW() - INTERVAL '24 hours'
     ORDER BY created_at DESC
     LIMIT 1`,
    [elderId]
  );
  return result.rows[0] || null;
};

export const findElderNextMedication = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
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
  return result.rows[0] || null;
};

export const findElderRecentActivity = async (elderId: string | number, limit: number = 6, db: Queryable = pool) => {
  const result = await db.query(
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
     LIMIT $2`,
    [elderId, limit]
  );
  return result.rows;
};

export const findElderTelemetryData = async (elderId: string | number, db: Queryable = pool) => {
  const [userRes, lastLocRes, lastLogRes] = await Promise.all([
    db.query(`SELECT id, name, phone_number, created_at, fcm_token FROM users WHERE id = $1`, [elderId]),
    db.query(
      `SELECT latitude, longitude, device_location, created_at
       FROM emergency_logs
       WHERE elder_id = $1 AND latitude IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [elderId]
    ),
    db.query(
      `SELECT GREATEST(
         (SELECT MAX(created_at) FROM mood_logs WHERE elder_id = $1),
         (SELECT MAX(taken_at) FROM medication_logs WHERE elder_id = $1),
         (SELECT MAX(completed_at) FROM task_logs WHERE elder_id = $1),
         (SELECT MAX(created_at) FROM emergency_logs WHERE elder_id = $1)
       ) as last_active`,
      [elderId]
    ),
  ]);

  return {
    elder: userRes.rows[0] || null,
    lastLocation: lastLocRes.rows[0] || null,
    lastActive: lastLogRes.rows[0]?.last_active || null,
  };
};

export const findElderDetail = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT id, name, email, phone_number, age, blood_type, weight, avatar_url, created_at
     FROM users WHERE id = $1 AND role = 'Elder'`,
    [elderId]
  );
  return result.rows[0] || null;
};

export const findElderActivityFeed = async (
  elderId: string | number,
  limit: number = 30,
  offset: number = 0,
  db: Queryable = pool
) => {
  const result = await db.query(
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
  return result.rows;
};

export const findElderReportData = async (elderId: string | number, db: Queryable = pool) => {
  const [elderRes, medRes, emergencyRes] = await Promise.all([
    db.query(`SELECT name, age, blood_type FROM users WHERE id = $1 AND role = 'Elder'`, [elderId]),
    db.query(
      `SELECT COUNT(*) FILTER (WHERE taken_status = TRUE) as taken,
              COUNT(*) as total
       FROM medication_logs
       WHERE elder_id = $1 AND logged_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [elderId]
    ),
    db.query(
      `SELECT triggered_phrase, status, created_at
       FROM emergency_logs
       WHERE elder_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [elderId]
    ),
  ]);

  return {
    elder: elderRes.rows[0] || null,
    medStats: medRes.rows[0] || { taken: "0", total: "0" },
    emergencyLogs: emergencyRes.rows,
  };
};

