import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import { AppError } from "../utils/AppError";
import * as connectionService from "../services/connectionService";
import * as medicationService from "../services/medicationService";
import * as taskService from "../services/taskService";
import * as riskService from "../services/riskService";
import * as emergencyService from "../services/emergencyService";
import * as notificationService from "../services/notificationService";
import * as guardianService from "../services/guardianService";

// GET /api/v1/guardian/elders
export const getLinkedElders = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw AppError.unauthorized();
  const elders = await connectionService.getEldersForGuardian(req.user.id);
  return sendSuccess(res, elders);
});

// GET /api/v1/guardian/dashboard
export const getGuardianDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw AppError.unauthorized();
  const dashboard = await guardianService.getGuardianDashboardData(req.user.id);
  return sendSuccess(res, dashboard);
});

// GET /api/v1/guardian/elders/:elderId
export const getElderDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const elder = await guardianService.getElderDetail(elderId, req.user);
  return sendSuccess(res, elder);
});

// GET /api/v1/guardian/elders/:elderId/activity
export const getElderActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const limit = parseInt(req.query.limit as string) || 30;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await guardianService.getElderActivity(elderId, limit, offset, req.user);
  return sendSuccess(res, result.rows, result.pagination);
});

// GET /api/v1/guardian/medications/:elderId
export const getGuardianMedications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  if (!req.user?.id) throw AppError.unauthorized();
  const meds = await medicationService.getMedicationsForGuardianView(elderId, req.user.id);
  return sendSuccess(res, meds);
});

// GET /api/v1/guardian/medications/:elderId/dashboard
export const getGuardianMedicationDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const dashboard = await guardianService.getGuardianMedicationDashboard(elderId, req.user);
  return sendSuccess(res, dashboard);
});

// GET /api/v1/guardian/medications/:elderId/history
export const getGuardianMedicationHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const days = Math.min(parseInt(req.query.days as string) || 30, 365);
  const result = await medicationService.getMedicationHistory(elderId, days, req.user);
  return sendSuccess(res, result);
});

// POST /api/v1/guardian/medications/:medicationId/remind
export const sendMedicationReminder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { medicationId } = req.params;
  const result = await guardianService.sendMedicationReminder(medicationId, req.user);
  return sendSuccess(res, result);
});

// GET /api/v1/guardian/tasks/:elderId/history
export const getGuardianTaskHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const days = Math.min(parseInt(req.query.days as string) || 30, 365);
  const result = await taskService.getTaskHistory(elderId, days, req.user);
  return sendSuccess(res, result);
});

// POST /api/v1/guardian/tasks/:taskId/remind
export const sendTaskReminder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { taskId } = req.params;
  const result = await guardianService.sendTaskReminder(taskId, req.user);
  return sendSuccess(res, result);
});

// POST /api/v1/guardian/medications
export const addGuardianMedication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elder_id, name, time_schedule } = req.body;
  if (!elder_id || !name || !time_schedule) {
    throw AppError.badRequest("elder_id, name, and time_schedule are required");
  }
  const created = await medicationService.createMedication(req.body, req.user);
  return sendSuccess(res, { message: "Medication added successfully", medication: created }, undefined, 201);
});

// PUT /api/v1/guardian/medications/:id
export const updateGuardianMedication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updated = await medicationService.updateMedication(id, req.body, req.user);
  return sendSuccess(res, { message: "Medication updated", medication: updated });
});

// DELETE /api/v1/guardian/medications/:id
export const deleteGuardianMedication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await medicationService.deleteMedication(id, req.user);
  return sendSuccess(res, result);
});

// GET /api/v1/guardian/emergency-alerts
export const getAllGuardianEmergencyAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw AppError.unauthorized();
  const elderIdQuery = req.query.elderId as string | undefined;
  const alerts = await emergencyService.getAllGuardianEmergencyAlerts(req.user.id, elderIdQuery);
  return sendSuccess(res, alerts);
});

// GET /api/v1/guardian/emergency-logs/:elderId
export const getEmergencyLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const logs = await emergencyService.getEmergencyLogsForElder(elderId, req.user);
  return sendSuccess(res, logs);
});

// GET /api/v1/guardian/notifications
export const getGuardianNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const result = await notificationService.getNotificationsForUser(req.user, 50, 0);
  return sendSuccess(res, result.notifications);
});

// PUT /api/v1/guardian/notifications/:id/read
export const markGuardianNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { id } = req.params;
  const result = await notificationService.markNotificationRead(id, req.user);
  return sendSuccess(res, result);
});

// POST /api/v1/guardian/link-request
export const requestLink = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { guardian_email } = req.body;
  const elderId = req.user?.id;
  if (!guardian_email) throw AppError.badRequest("Guardian email is required");
  if (!elderId) throw AppError.unauthorized("Unauthorized: No user session");

  const result = await connectionService.requestLink(String(elderId), guardian_email);
  return sendSuccess(res, { success: true, ...result }, undefined, 201);
});

// PUT /api/v1/guardian/link/:elderId/respond
export const respondToLinkRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const { action } = req.body;
  const guardianId = req.user?.id;
  if (!action || !["Accept", "Decline"].includes(action)) {
    throw AppError.badRequest("Action must be either 'Accept' or 'Decline'");
  }
  if (!guardianId) throw AppError.unauthorized("Unauthorized: No user session");

  const result = await connectionService.respondToLinkRequest(String(guardianId), elderId, action as any);
  return sendSuccess(res, { success: true, ...result });
});

// GET /api/v1/guardian/pending-requests
export const getPendingLinkRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const guardianId = req.user?.id;
  if (!guardianId) throw AppError.unauthorized("Unauthorized: No user session");

  const requests = await connectionService.getPendingRequests(String(guardianId));
  return sendSuccess(res, requests);
});

// GET /api/v1/guardian/risk-profile/:elderId
export const getElderRiskProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  if (!elderId) throw AppError.badRequest("elderId is required");

  const riskProfile = await riskService.getElderRiskProfile(elderId, req.user);
  return sendSuccess(res, riskProfile);
});

// GET /api/v1/guardian/export-pdf/:elderId
export const exportElderPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  if (!elderId) throw AppError.badRequest("elderId is required");

  await guardianService.exportElderPDF(elderId, res, req.user);
});

// POST /api/v1/guardian/elders/generate-invite
export const generateElderInviteCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const guardianId = req.user?.id;
  if (!guardianId) throw AppError.unauthorized();

  const result = await connectionService.generateElderInviteCode(String(guardianId));
  return sendSuccess(res, result);
});

// POST /api/v1/guardian/elders/connect-code
export const connectElderByCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { invite_code } = req.body;
  if (!invite_code) throw AppError.badRequest("Invite code is required");
  if (!userId) throw AppError.unauthorized();

  const result = await connectionService.connectElderByCode(String(userId), invite_code);
  return sendSuccess(res, result);
});

// GET /api/v1/guardian/live-monitoring/:elderId
export const getElderLiveMonitoring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { elderId } = req.params;
  const telemetry = await guardianService.getElderLiveTelemetry(elderId, req.user);
  return sendSuccess(res, telemetry);
});
