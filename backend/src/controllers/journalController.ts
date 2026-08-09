import { Request, Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseWrapper";

// GET /api/journal/elder/:elderId — All journal entries
export const getJournalEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT id, title, content, mood_ref,
              TO_CHAR(created_at, 'Mon DD, YYYY') as date,
              created_at
       FROM journal_entries
       WHERE elder_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [elderId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM journal_entries WHERE elder_id = $1`,
      [elderId]
    );

    const totalCount = parseInt(countResult.rows[0].total);
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
    logger.error("Get Journal Entries Error:", error);
    return sendError(res, "Server error fetching journal entries", 500);
  }
};

// POST /api/journal — Create new journal entry
export const createJournalEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { elder_id, title, content, mood_ref } = req.body;

    if (!elder_id || !title || !content) {
      return sendError(res, "elder_id, title, and content are required", 400);
    }

    const result = await pool.query(
      `INSERT INTO journal_entries (elder_id, title, content, mood_ref, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, title, content, mood_ref, TO_CHAR(created_at, 'Mon DD, YYYY') as date, created_at`,
      [elder_id, title.trim(), content.trim(), mood_ref || null]
    );

    return sendSuccess(res, result.rows[0], undefined, 201);
  } catch (error) {
    logger.error("Create Journal Entry Error:", error);
    return sendError(res, "Server error saving journal entry", 500);
  }
};

// DELETE /api/journal/:id — Delete journal entry
export const deleteJournalEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { elder_id } = req.body;

    // Ensure elder can only delete their own entries
    const result = await pool.query(
      `DELETE FROM journal_entries WHERE id=$1 AND elder_id=$2 RETURNING id`,
      [id, elder_id]
    );

    if (result.rows.length === 0) {
      return sendError(res, "Entry not found or unauthorized", 404);
    }

    return sendSuccess(res, { message: "Journal entry deleted" });
  } catch (error) {
    logger.error("Delete Journal Entry Error:", error);
    return sendError(res, "Server error deleting journal entry", 500);
  }
};
