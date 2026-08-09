import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseWrapper";

// GET /api/notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, "Unauthorized", 401);

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1`,
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = offset + limit < totalCount;
    const page = Math.floor(offset / limit) + 1;

    return sendSuccess(res, result.rows, {
      page,
      limit,
      total: totalCount,
      total_pages: totalPages,
      has_more: hasMore
    });
  } catch (error) {
    logger.error("Get Notifications Error:", error);
    return sendError(res, "Server error fetching notifications", 500);
  }
};

// DELETE /api/notifications/:id
export const clearNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return sendError(res, "Unauthorized", 401);

    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return sendError(res, "Notification not found or unauthorized", 404);
    }

    return sendSuccess(res, { message: "Notification cleared successfully" });
  } catch (error) {
    logger.error("Clear Notification Error:", error);
    return sendError(res, "Server error clearing notification", 500);
  }
};
