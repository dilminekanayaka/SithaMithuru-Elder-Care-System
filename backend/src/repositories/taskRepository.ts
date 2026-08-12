import pool from "../config/db";
import { Queryable } from "../config/transaction";

export interface TaskInput {
  elder_id: string | number;
  title: string;
  description?: string | null;
  due_time?: string | null;
  createdBy?: string | number;
}

export const findTasksByElder = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT t.id, t.title, t.description,
            TO_CHAR(t.due_time, 'HH24:MI') as due_time,
            t.created_at,
            COALESCE(tl.completed, FALSE) as completed,
            tl.completed_at
     FROM daily_tasks t
     LEFT JOIN task_logs tl
       ON tl.task_id = t.id AND tl.elder_id = $1 AND tl.logged_date = CURRENT_DATE
     WHERE t.elder_id = $1 AND t.deleted_at IS NULL
     ORDER BY t.due_time ASC NULLS LAST, t.created_at ASC`,
    [elderId]
  );
  return result.rows;
};

export const findTaskElderId = async (id: string | number, db: Queryable = pool) => {
  const result = await db.query("SELECT elder_id FROM daily_tasks WHERE id = $1 AND deleted_at IS NULL", [id]);
  return result.rows[0]?.elder_id as string | number | undefined;
};

export const createTask = async (data: TaskInput, db: Queryable = pool) => {
  const result = await db.query(
    `INSERT INTO daily_tasks (elder_id, title, description, due_time, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, description, TO_CHAR(due_time, 'HH24:MI') as due_time, created_at`,
    [data.elder_id, data.title.trim(), data.description || null, data.due_time || null, data.createdBy ?? data.elder_id]
  );
  return result.rows[0];
};

export const updateTask = async (id: string | number, updates: Partial<TaskInput>, db: Queryable = pool) => {
  const result = await db.query(
    `UPDATE daily_tasks
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         due_time = COALESCE($3, due_time)
     WHERE id = $4 AND deleted_at IS NULL
     RETURNING id, title, description, TO_CHAR(due_time, 'HH24:MI') as due_time`,
    [updates.title || null, updates.description || null, updates.due_time || null, id]
  );
  return result.rows[0];
};

export const deleteTask = async (id: string | number, db: Queryable = pool) => {
  const result = await db.query(
    "UPDATE daily_tasks SET deleted_at = NOW(), is_active = FALSE WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0];
};

export const upsertTaskLog = async (
  data: {
    taskId: string | number;
    elderId: string | number;
    completed: boolean;
    completedAt?: Date | null;
  },
  db: Queryable = pool
) => {
  const result = await db.query(
    `INSERT INTO task_logs (task_id, elder_id, completed, completed_at, logged_date)
     VALUES ($1, $2, $3, $4, CURRENT_DATE)
     ON CONFLICT ON CONSTRAINT uq_task_log_per_day
     DO UPDATE SET completed = EXCLUDED.completed, completed_at = EXCLUDED.completed_at
     RETURNING *`,
    [data.taskId, data.elderId, data.completed, data.completed ? data.completedAt || new Date() : null]
  );
  return result.rows[0];
};

export const findUpcomingTasks = async (elderId: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT t.id, t.title, TO_CHAR(t.due_time, 'HH24:MI') as due_time
     FROM daily_tasks t
     LEFT JOIN task_logs tl
       ON tl.task_id = t.id AND tl.elder_id = $1 AND tl.logged_date = CURRENT_DATE
     WHERE t.elder_id = $1
       AND t.deleted_at IS NULL
       AND COALESCE(tl.completed, FALSE) = FALSE
       AND (t.due_time IS NULL OR t.due_time >= (CURRENT_TIME - INTERVAL '30 minutes'))
     ORDER BY t.due_time ASC NULLS LAST
     LIMIT 3`,
    [elderId]
  );
  return result.rows;
};

export const findTaskForReminder = async (id: string | number, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT t.id, t.title, t.elder_id, u.fcm_token
     FROM daily_tasks t
     JOIN users u ON u.id = t.elder_id
     WHERE t.id = $1 AND t.deleted_at IS NULL`,
    [id]
  );
  return result.rows[0];
};

export const findTaskHistory = async (elderId: string | number, days: number = 30, db: Queryable = pool) => {
  const result = await db.query(
    `SELECT t.id as task_id, t.title, t.description,
            TO_CHAR(t.due_time, 'HH12:MI AM') as due_time,
            d.log_date::date::text as date,
            COALESCE(tl.completed, FALSE) as completed,
            TO_CHAR(tl.completed_at, 'HH12:MI AM') as completed_at,
            CASE
              WHEN COALESCE(tl.completed, FALSE) = TRUE THEN 'COMPLETED'
              WHEN d.log_date::date < CURRENT_DATE THEN 'MISSED'
              WHEN d.log_date::date = CURRENT_DATE AND t.due_time IS NOT NULL AND t.due_time < CURRENT_TIME THEN 'MISSED'
              ELSE 'UPCOMING'
            END as status
     FROM daily_tasks t
     CROSS JOIN generate_series(CURRENT_DATE - ($2::int - 1), CURRENT_DATE, '1 day'::interval) AS d(log_date)
     LEFT JOIN task_logs tl
       ON tl.task_id = t.id AND tl.elder_id = $1 AND tl.logged_date = d.log_date::date
     WHERE t.elder_id = $1 AND t.deleted_at IS NULL
       AND d.log_date::date >= t.created_at::date
     ORDER BY d.log_date DESC, t.due_time ASC NULLS LAST`,
    [elderId, days]
  );
  return result.rows;
};
