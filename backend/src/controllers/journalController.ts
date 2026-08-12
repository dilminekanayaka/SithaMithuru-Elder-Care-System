import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import { AppError } from "../utils/AppError";
import * as journalService from "../services/journalService";

// GET /api/v1/journal/elder/:elderId — All journal entries
export const getJournalEntries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await journalService.getJournalEntries(elderId, limit, offset, req.user);
  return sendSuccess(res, result.entries, result.pagination);
});

// POST /api/v1/journal — Create new journal entry
export const createJournalEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elder_id, title, content, mood_tag } = req.body;
  if (!elder_id || !title || !content) {
    throw AppError.badRequest("elder_id, title, and content are required");
  }

  const created = await journalService.createJournalEntry({ elder_id, title, content, mood_tag }, req.user);
  return sendSuccess(res, created, undefined, 201);
});

// DELETE /api/v1/journal/:id — Delete journal entry
export const deleteJournalEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await journalService.deleteJournalEntry(id, req.user);
  return sendSuccess(res, result);
});
