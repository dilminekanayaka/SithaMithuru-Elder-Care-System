import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import { AppError } from "../utils/AppError";
import * as connectionService from "../services/connectionService";

/** POST /api/connection/invite — generate an 8-char single-use invite token. */
export const generateInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const invite = await connectionService.generateInvite(req.user.id, req.user.role);
  return sendSuccess(res, { success: true, token: invite.token, expiresAt: invite.expires_at }, undefined, 201);
});

/** POST /api/connection/validate — redeem an invite token, creating a pending request. */
export const validateInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { token, relationship, permissionLevel } = req.body;
  if (!token) throw AppError.badRequest("Invitation token is required.");

  await connectionService.validateInvite(req.user, token, relationship, permissionLevel);
  return sendSuccess(res, { success: true, message: "Connection request sent. Waiting for approval." }, undefined, 200);
});

/** GET /api/connection/pending — incoming connection requests for the caller. */
export const getPendingRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const requests = await connectionService.getPendingRequests(req.user.id);
  return sendSuccess(res, { success: true, requests }, undefined, 200);
});

/** PUT /api/connection/respond/:requestId — accept or reject a pending request. */
export const respondToRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { action } = req.body;
  if (action !== "ACCEPT" && action !== "REJECT") {
    throw AppError.badRequest("action must be 'ACCEPT' or 'REJECT'");
  }

  const result = await connectionService.respondToRequest(req.user, req.params.requestId, action);
  return sendSuccess(res, { success: true, ...result }, undefined, 200);
});

/** DELETE /api/connection/unlink — deactivate an active guardian-elder link. */
export const unlinkConnection = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { targetId } = req.body;
  if (!targetId) throw AppError.badRequest("targetId is required");

  await connectionService.unlinkConnection(req.user.id, req.user.role, targetId);
  return sendSuccess(res, { success: true, message: "Connection unlinked successfully." }, undefined, 200);
});

/** GET /api/connection/my-guardians — guardians actively linked to the calling elder. */
export const getMyGuardians = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const guardians = await connectionService.getMyGuardians(req.user.id, req.user.role);
  return sendSuccess(res, { guardians }, undefined, 200);
});
