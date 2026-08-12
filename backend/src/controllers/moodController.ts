import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import { AppError } from "../utils/AppError";
import * as moodService from "../services/moodService";

// GET /api/v1/mood/elder/:elderId — Last 7 days of mood history
export const getMoodHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const result = await moodService.getMoodHistory(elderId, 7, req.user);
  return sendSuccess(res, result);
});

// POST /api/v1/mood — Save today's mood
export const saveMood = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elder_id, mood_type, notes, created_at } = req.body;
  if (!elder_id || !mood_type) {
    throw AppError.badRequest("elder_id and mood_type are required");
  }

  const saved = await moodService.saveMood({ elder_id, mood_type, notes, created_at }, req.user);
  return sendSuccess(res, saved, undefined, 201);
});
