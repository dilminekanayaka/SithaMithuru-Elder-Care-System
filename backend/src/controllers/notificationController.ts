import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import { AppError } from "../utils/AppError";
import * as notificationService from "../services/notificationService";

// GET /api/v1/notifications
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await notificationService.getNotificationsForUser(req.user, limit, offset);
  return sendSuccess(res, result.notifications, result.pagination);
});

// PUT /api/v1/notifications/:id/read
export const markNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { id } = req.params;
  const result = await notificationService.markNotificationRead(id, req.user);
  return sendSuccess(res, result);
});

// DELETE /api/v1/notifications/:id
export const clearNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { id } = req.params;
  const result = await notificationService.clearNotification(id, req.user);
  return sendSuccess(res, result);
});
