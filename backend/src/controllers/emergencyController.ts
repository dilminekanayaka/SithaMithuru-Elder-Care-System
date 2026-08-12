import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import { AppError } from "../utils/AppError";
import * as emergencyService from "../services/emergencyService";

export { notifyGuardiansOfEmergency } from "../services/emergencyService";

// POST /api/v1/emergency/trigger
export const triggerSOS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const createdLog = await emergencyService.triggerSOS(req.body, req.user);
  return sendSuccess(res, {
    success: true,
    message: "SOS alert triggered successfully",
    log: createdLog,
  }, undefined, 201);
});

// PUT /api/v1/emergency/:id/resolve
export const resolveEmergency = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  if (!req.user) throw AppError.unauthorized();

  const updatedLog = await emergencyService.resolveEmergency(id, status, reason, req.user);
  return sendSuccess(res, {
    success: true,
    message: `Emergency marked as ${status}`,
    log: updatedLog,
  });
});

// PUT /api/v1/emergency/:id/cancel
export const cancelSOS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!req.user) throw AppError.unauthorized();

  const updatedLog = await emergencyService.cancelSOS(id, req.user);
  return sendSuccess(res, {
    success: true,
    message: "Emergency SOS cancelled successfully",
    log: updatedLog,
  });
});

// GET /api/v1/emergency/elder/:elderId
export const getElderEmergencyLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const logs = await emergencyService.getEmergencyLogsForElder(elderId, req.user);
  return sendSuccess(res, { logs });
});
