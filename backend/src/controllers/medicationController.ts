import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import { AppError } from "../utils/AppError";
import * as medicationService from "../services/medicationService";

// GET /api/v1/medications/dictionary
export const getMedicationDictionary = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, medicationService.getDictionary());
});

// GET /api/v1/medications/elder/:elderId
export const getMedicationsByElder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const result = await medicationService.getMedicationsByElder(elderId, req.user);
  return sendSuccess(res, result);
});

// POST /api/v1/medications — Create medication
export const createMedication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elder_id, name, time_schedule } = req.body;
  if (!elder_id || !name || !time_schedule) {
    throw AppError.badRequest("elder_id, name, and time_schedule are required");
  }

  const created = await medicationService.createMedication(req.body, req.user);
  return sendSuccess(res, created, undefined, 201);
});

// PUT /api/v1/medications/:id — Update medication
export const updateMedication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updated = await medicationService.updateMedication(id, req.body, req.user);
  return sendSuccess(res, updated);
});

// DELETE /api/v1/medications/:id — Soft-delete
export const deleteMedication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await medicationService.deleteMedication(id, req.user);
  return sendSuccess(res, result);
});

// POST /api/v1/medications/log — Toggle taken status
export const logMedication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { medication_id, elder_id, taken_status, status, scheduled_time, client_updated_at } = req.body;
  if (!medication_id || !elder_id) {
    throw AppError.badRequest("medication_id and elder_id are required");
  }

  const logged = await medicationService.logMedication(
    {
      medicationId: medication_id,
      elderId: elder_id,
      takenStatus: taken_status || status === "TAKEN",
      status: status || (taken_status ? "TAKEN" : "PENDING"),
      scheduledTime: scheduled_time,
      clientUpdatedAt: client_updated_at ? new Date(client_updated_at) : undefined,
    },
    req.user
  );
  return sendSuccess(res, logged);
});

// GET /api/v1/medications/upcoming/:elderId
export const getUpcomingMedications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const upcoming = await medicationService.getUpcomingMedications(elderId, req.user);
  return sendSuccess(res, upcoming);
});
