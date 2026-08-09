import { Request, Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseWrapper";

// GET /api/mood/elder/:elderId — Last 7 days of mood history
export const getMoodHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;

    const result = await pool.query(
      `SELECT id, mood_type, notes,
              TO_CHAR(created_at, 'YYYY-MM-DD') as date,
              TO_CHAR(created_at, 'Day') as day_name,
              created_at
       FROM mood_logs
       WHERE elder_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC`,
      [elderId]
    );

    // Today's mood (most recent entry today)
    const todayMood = result.rows.find(
      (r) => r.date === new Date().toISOString().split("T")[0]
    ) || null;

    return sendSuccess(res, { history: result.rows, todayMood });
  } catch (error) {
    logger.error("Get Mood History Error:", error);
    return sendError(res, "Server error fetching mood history", 500);
  }
};

// POST /api/mood — Save today's mood
export const saveMood = async (req: AuthRequest, res: Response) => {
  try {
    const { elder_id, mood_type, notes, created_at } = req.body;

    if (!elder_id || !mood_type) {
      return sendError(res, "elder_id and mood_type are required", 400);
    }

    const validMoods = ["Happy", "Sad", "Neutral", "Angry", "Anxious"];
    if (!validMoods.includes(mood_type)) {
      return sendError(res, `Invalid mood. Must be one of: ${validMoods.join(", ")}`, 400);
    }

    const result = await pool.query(
      `INSERT INTO mood_logs (elder_id, mood_type, notes, created_at)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP))
       RETURNING id, mood_type, notes, TO_CHAR(created_at, 'YYYY-MM-DD') as date, created_at`,
      [elder_id, mood_type, notes || null, created_at || null]
    );

    return sendSuccess(res, result.rows[0], undefined, 201);
  } catch (error) {
    logger.error("Save Mood Error:", error);
    return sendError(res, "Server error saving mood", 500);
  }
};

