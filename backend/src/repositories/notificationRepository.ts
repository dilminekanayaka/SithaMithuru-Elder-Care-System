import pool from "../config/db";
import { Queryable } from "../config/transaction";

export interface NotificationInput {
  user_id: string | number;
  type: string;
  title: string;
  message: string;
  target_id?: string | number | null;
}

export const findNotificationsByUser = async (
  userId: string | number,
  limit: number = 20,
  offset: number = 0,
  db: Queryable = pool
) => {
  const result = await db.query(
    `SELECT id, type, title, message, COALESCE(is_read, FALSE) as is_read, COALESCE(is_read, FALSE) as read, created_at, target_id
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

export const countNotificationsByUser = async (userId: string | number, db: Queryable = pool) => {
  const result = await db.query("SELECT COUNT(*) FROM notifications WHERE user_id = $1", [userId]);
  return parseInt(result.rows[0]?.count || "0", 10);
};

export const insertNotification = async (data: NotificationInput, db: Queryable = pool) => {
  const result = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, target_id, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
     RETURNING id, type, title, message, is_read, created_at`,
    [data.user_id, data.type, data.title, data.message, data.target_id || null]
  );
  return result.rows[0];
};

export const markNotificationRead = async (id: string | number, userId: string | number, db: Queryable = pool) => {
  await db.query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`, [id, userId]);
};

export const deleteNotification = async (id: string | number, userId: string | number, db: Queryable = pool) => {
  const result = await db.query(`DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`, [id, userId]);
  return result.rows[0];
};

export const synthesizeElderNotifications = async (elderId: string | number, db: Queryable = pool) => {
  const [emergencyLogs, missedMeds, dueTasks] = await Promise.all([
    db.query(
      `SELECT id, triggered_phrase, status, created_at FROM emergency_logs WHERE elder_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [elderId]
    ),
    db.query(
      `SELECT m.id, m.name, TO_CHAR(m.time_schedule, 'HH12:MI AM') as time_schedule
       FROM medications m
       LEFT JOIN medication_logs ml ON ml.medication_id = m.id AND ml.logged_date = CURRENT_DATE
       WHERE m.elder_id = $1 AND COALESCE(ml.taken_status, FALSE) = FALSE AND m.time_schedule < CURRENT_TIME
       ORDER BY m.time_schedule DESC LIMIT 10`,
      [elderId]
    ),
    db.query(
      `SELECT t.id, t.title, TO_CHAR(t.due_time, 'HH12:MI AM') as due_time
       FROM daily_tasks t
       LEFT JOIN task_logs tl ON tl.task_id = t.id AND tl.elder_id = $1 AND tl.logged_date = CURRENT_DATE
       WHERE t.elder_id = $1 AND COALESCE(tl.completed, FALSE) = FALSE AND t.due_time IS NOT NULL AND t.due_time < CURRENT_TIME
       ORDER BY t.due_time DESC LIMIT 10`,
      [elderId]
    ),
  ]);

  const dynamicNotifs: any[] = [];

  emergencyLogs.rows.forEach((log) => {
    dynamicNotifs.push({
      id: `sos-${log.id}`,
      type: "EMERGENCY",
      title: "Emergency Alert",
      message: `Your ${log.triggered_phrase || "SOS"} alert was recorded and your Guardian was notified.`,
      created_at: log.created_at,
      is_read: log.status !== "Active" && log.status !== "Pending",
      read: log.status !== "Active" && log.status !== "Pending",
      target_id: log.id,
    });
  });

  missedMeds.rows.forEach((med) => {
    dynamicNotifs.push({
      id: `med-${med.id}`,
      type: "MEDICATION",
      title: "Missed Medication",
      message: `You missed your scheduled dose of ${med.name} at ${med.time_schedule}.`,
      created_at: new Date().toISOString(),
      is_read: false,
      read: false,
    });
  });

  dueTasks.rows.forEach((task) => {
    dynamicNotifs.push({
      id: `task-${task.id}`,
      type: "TASK",
      title: "Task Reminder",
      message: `"${task.title}" was due at ${task.due_time} and hasn't been marked complete yet.`,
      created_at: new Date().toISOString(),
      is_read: false,
      read: false,
    });
  });

  dynamicNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return dynamicNotifs;
};

export const synthesizeGuardianNotifications = async (guardianId: string | number, db: Queryable = pool) => {
  const [emergencyLogs, missedMeds] = await Promise.all([
    db.query(
      `SELECT el.id, el.triggered_phrase, el.status, el.created_at, u.name as elder_name
       FROM emergency_logs el
       JOIN users u ON u.id = el.elder_id
       JOIN guardian_elder_relationships ge ON ge.elder_id = u.id
       WHERE ge.guardian_id = $1 AND ge.status = 'ACTIVE'
       ORDER BY el.created_at DESC LIMIT 10`,
      [guardianId]
    ),
    db.query(
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
    ),
  ]);

  const dynamicNotifs: any[] = [];

  emergencyLogs.rows.forEach((log) => {
    dynamicNotifs.push({
      id: `sos-${log.id}`,
      type: "sos",
      title: `🚨 Emergency SOS: ${log.elder_name}`,
      message: `${log.elder_name} triggered an emergency SOS alert (${log.triggered_phrase || "SOS Button"}).`,
      created_at: log.created_at,
      is_read: log.status !== "Active" && log.status !== "Pending",
      read: log.status !== "Active" && log.status !== "Pending",
    });
  });

  missedMeds.rows.forEach((med) => {
    dynamicNotifs.push({
      id: `med-${med.id}`,
      type: "medication",
      title: `⚠️ Missed Medication: ${med.elder_name}`,
      message: `${med.elder_name} missed scheduled dose of ${med.name} at ${med.time_schedule}.`,
      created_at: new Date().toISOString(),
      is_read: false,
      read: false,
    });
  });

  dynamicNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return dynamicNotifs;
};
