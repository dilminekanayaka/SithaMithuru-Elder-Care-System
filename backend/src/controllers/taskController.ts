import { Request, Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseWrapper";

// GET /api/tasks/elder/:elderId — Today's tasks with completion status
export const getTasksByElder = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;

    const result = await pool.query(
      `SELECT t.id, t.title, t.description,
              TO_CHAR(t.due_time, 'HH24:MI') as due_time,
              t.created_at,
              COALESCE(tl.completed, FALSE) as completed,
              tl.completed_at
       FROM daily_tasks t
       LEFT JOIN task_logs tl
         ON tl.task_id = t.id
         AND tl.elder_id = $1
         AND tl.logged_date = CURRENT_DATE
       WHERE t.elder_id = $1
       ORDER BY t.due_time ASC NULLS LAST, t.created_at ASC`,
      [elderId]
    );

    const tasks = result.rows;
    const completedCount = tasks.filter((t) => t.completed).length;

    return sendSuccess(res, { tasks, completedCount, totalCount: tasks.length });
  } catch (error) {
    logger.error("Get Tasks Error:", error);
    return sendError(res, "Server error fetching tasks", 500);
  }
};

// POST /api/tasks — Create a new daily task
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { elder_id, title, description, due_time } = req.body;
    if (!elder_id || !title) {
      return sendError(res, "elder_id and title are required", 400);
    }

    const result = await pool.query(
      `INSERT INTO daily_tasks (elder_id, title, description, due_time, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, TO_CHAR(due_time, 'HH24:MI') as due_time, created_at`,
      [elder_id, title.trim(), description || null, due_time || null, req.user?.id || elder_id]
    );

    return sendSuccess(res, result.rows[0], undefined, 201);
  } catch (error) {
    logger.error("Create Task Error:", error);
    return sendError(res, "Server error creating task", 500);
  }
};

// PUT /api/tasks/:id — Edit a task
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, due_time } = req.body;

    const result = await pool.query(
      `UPDATE daily_tasks SET title=$1, description=$2, due_time=$3
       WHERE id=$4
       RETURNING id, title, description, TO_CHAR(due_time, 'HH24:MI') as due_time`,
      [title, description || null, due_time || null, id]
    );

    if (result.rows.length === 0) return sendError(res, "Task not found", 404);
    return sendSuccess(res, result.rows[0]);
  } catch (error) {
    logger.error("Update Task Error:", error);
    return sendError(res, "Server error updating task", 500);
  }
};

// DELETE /api/tasks/:id — Delete a task
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM daily_tasks WHERE id=$1 RETURNING id", [id]);
    if (result.rows.length === 0) return sendError(res, "Task not found", 404);
    return sendSuccess(res, { message: "Task deleted successfully" });
  } catch (error) {
    logger.error("Delete Task Error:", error);
    return sendError(res, "Server error deleting task", 500);
  }
};

// POST /api/tasks/log — Toggle task complete/incomplete for today
export const logTask = async (req: AuthRequest, res: Response) => {
  try {
    const { task_id, elder_id, completed } = req.body;
    if (!task_id || !elder_id) {
      return sendError(res, "task_id and elder_id are required", 400);
    }

    // Atomic upsert — safe even with concurrent requests.
    // Requires the uq_task_log_per_day constraint (migration_v4.sql).
    const result = await pool.query(
      `INSERT INTO task_logs (task_id, elder_id, completed, completed_at, logged_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       ON CONFLICT ON CONSTRAINT uq_task_log_per_day
       DO UPDATE SET completed = $3, completed_at = $4
       RETURNING *`,
      [task_id, elder_id, completed, completed ? new Date() : null]
    );

    return sendSuccess(res, result.rows[0]);
  } catch (error) {
    logger.error("Log Task Error:", error);
    return sendError(res, "Server error logging task", 500);
  }
};


// GET /api/tasks/upcoming/:elderId — For dashboard reminders
export const getUpcomingTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;

    const result = await pool.query(
      `SELECT t.id, t.title, TO_CHAR(t.due_time, 'HH24:MI') as due_time
       FROM daily_tasks t
       LEFT JOIN task_logs tl
         ON tl.task_id = t.id AND tl.elder_id = $1 AND tl.logged_date = CURRENT_DATE
       WHERE t.elder_id = $1
         AND COALESCE(tl.completed, FALSE) = FALSE
         AND (t.due_time IS NULL OR t.due_time >= (CURRENT_TIME - INTERVAL '30 minutes'))
       ORDER BY t.due_time ASC NULLS LAST
       LIMIT 3`,
      [elderId]
    );

    return sendSuccess(res, result.rows);
  } catch (error) {
    logger.error("Get Upcoming Tasks Error:", error);
    return sendError(res, "Server error", 500);
  }
};
