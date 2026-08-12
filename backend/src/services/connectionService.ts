import crypto from "crypto";
import { PoolClient } from "pg";
import * as connectionRepository from "../repositories/connectionRepository";
import * as authRepository from "../repositories/authRepository";
import { withTransaction } from "../config/transaction";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

type RequestUser = { id: string; role: string };

const INVITE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
const ELDER_INVITE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomFromCharset = (charset: string, length: number): string => {
  let out = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += charset.charAt(bytes[i] % charset.length);
  }
  return out;
};

/**
 * Single canonical write path for "guardian X is now actively linked to
 * elder Y" — every caller that establishes a link (accepting a generic
 * invite, accepting an elder-initiated link request, or redeeming a QR
 * invite code) goes through this instead of each maintaining its own INSERT.
 * Previously these were three separate implementations that had drifted:
 * one never set primary_guardian_id, one used ON CONFLICT DO NOTHING and so
 * silently failed to reactivate a previously-unlinked pair. Always call
 * inside withTransaction so the relationship write and the caller's own
 * status update (pending_connections / elder_invitations) commit atomically.
 */
const linkGuardianAndElder = async (
  client: PoolClient,
  guardianId: string | number,
  elderId: string | number,
  relationshipType: string,
  permissionLevel: string
) => {
  await connectionRepository.upsertActiveRelationship(guardianId, elderId, relationshipType, permissionLevel, client);
  await connectionRepository.setPrimaryGuardian(elderId, guardianId, client);
};

// ─── Generic invite-token flow (ConnectScreen) ─────────────────────────────

export const generateInvite = async (userId: string, userRole: string) => {
  const recentCount = await connectionRepository.countRecentInvitesByUser(userId);
  if (recentCount >= 5) {
    throw AppError.tooManyRequests("Daily invitation limit reached (Max 5 per day).");
  }

  const token = `SM-${randomFromCharset(INVITE_CHARSET, 4)}-${randomFromCharset(INVITE_CHARSET, 4)}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const invite = await connectionRepository.insertInvitation(token, userId, userRole, expiresAt);
  await connectionRepository.insertConnectionLog(userId, "INVITATION_CREATED", `Token ${token} generated.`);

  return invite;
};

export const validateInvite = async (
  caller: RequestUser,
  token: string,
  relationship: string | undefined,
  permissionLevel: string | undefined
) => {
  const invite = await connectionRepository.findInvitationByToken(token.trim());
  if (!invite) throw AppError.notFound("Invitation code not found.");
  if (invite.used) throw AppError.badRequest("This invitation code has already been used.");
  if (new Date(invite.expires_at) < new Date()) throw AppError.badRequest("Invitation code has expired.");
  if (invite.role === caller.role) throw AppError.badRequest("Cannot connect users with the same roles.");

  const targetUserId = invite.created_by;

  const duplicate = await connectionRepository.findPendingConnectionBetween(caller.id, targetUserId);
  if (duplicate) throw AppError.badRequest("A connection request is already pending for this user.");

  await connectionRepository.insertPendingConnection(caller.id, targetUserId, relationship || "Other", permissionLevel || "Primary");
  await connectionRepository.markInvitationUsed(invite.id);
  await connectionRepository.insertConnectionLog(caller.id, "CONNECTION_REQUEST_SENT", `Request sent to user ${targetUserId}.`);
};

export const getPendingRequests = async (userId: string) => {
  return connectionRepository.findIncomingPendingConnections(userId);
};

export const respondToRequest = async (caller: RequestUser, requestId: string, action: "ACCEPT" | "REJECT") => {
  const request = await connectionRepository.findPendingConnectionById(requestId, caller.id);
  if (!request) throw AppError.notFound("Connection request not found.");

  if (action === "ACCEPT") {
    const guardianId = caller.role === "Guardian" ? caller.id : request.from_user;
    const elderId = caller.role === "Elder" ? caller.id : request.from_user;

    await withTransaction(async (client) => {
      await linkGuardianAndElder(client, guardianId, elderId, request.relationship_type, request.permission_level);
      await connectionRepository.updatePendingConnectionStatus(requestId, "ACCEPTED", client);
      await connectionRepository.insertConnectionLog(caller.id, "REQUEST_ACCEPTED", `Connected with user ${request.from_user}.`, client);
    });
    return { message: "Connection request approved." };
  }

  await connectionRepository.updatePendingConnectionStatus(requestId, "REJECTED");
  await connectionRepository.insertConnectionLog(caller.id, "REQUEST_REJECTED", `Rejected request from user ${request.from_user}.`);
  return { message: "Connection request declined." };
};

export const unlinkConnection = async (userId: string, role: string, targetId: string) => {
  let guardianId: string, elderId: string;
  if (role === "Guardian") {
    guardianId = userId;
    elderId = targetId;
  } else if (role === "Elder") {
    guardianId = targetId;
    elderId = userId;
  } else {
    throw AppError.forbidden("Invalid role");
  }

  const deactivated = await connectionRepository.deactivateRelationship(guardianId, elderId);
  if (!deactivated) throw AppError.notFound("Active connection not found");

  await connectionRepository.insertConnectionLog(userId, "UNLINK", `Unlinked from user ${targetId}.`);
};

export const getEldersForGuardian = async (guardianId: string) => {
  return connectionRepository.findEldersForGuardian(guardianId);
};

export const getMyGuardians = async (elderId: string, role: string) => {
  if (role !== "Elder") {
    throw AppError.forbidden("Forbidden: This endpoint is for Elder accounts only");
  }
  return connectionRepository.findGuardiansForElder(elderId);
};

// ─── Elder-initiated link-request-by-email flow ────────────────────────────

export const requestLink = async (elderId: string, guardianEmail: string) => {
  const guardian = await authRepository.findUserByEmail(guardianEmail.trim().toLowerCase());
  if (!guardian) throw AppError.notFound("Guardian account not found with this email");
  if (guardian.role !== "Guardian") {
    throw AppError.badRequest("The specified account is not registered as a Guardian");
  }

  const activeLink = await connectionRepository.findActiveRelationship(guardian.id, elderId);
  if (activeLink) throw AppError.badRequest("You are already linked with this guardian");

  const pending = await connectionRepository.findPendingConnectionByParticipants(elderId, guardian.id);
  if (pending) throw AppError.badRequest("A link request is already pending with this guardian");

  await connectionRepository.insertPendingConnection(elderId, guardian.id, "Other", "Primary");

  return { message: `Link request sent successfully to ${guardian.name}` };
};

export const respondToLinkRequest = async (guardianId: string, elderId: string, action: "Accept" | "Decline") => {
  const request = await connectionRepository.findPendingConnectionByParticipants(elderId, guardianId);
  if (!request) throw AppError.notFound("Link request not found");

  if (action === "Accept") {
    await withTransaction(async (client) => {
      await linkGuardianAndElder(client, guardianId, elderId, request.relationship_type || "Other", request.permission_level || "Primary");
      await connectionRepository.updatePendingConnectionStatus(request.id, "ACCEPTED", client);
    });
    return { message: "Connection accepted successfully" };
  }

  await connectionRepository.updatePendingConnectionStatus(request.id, "REJECTED");
  return { message: "Connection declined successfully" };
};

// ─── QR / 6-char-code invite flow ───────────────────────────────────────────

export const generateElderInviteCode = async (guardianId: string) => {
  const code = randomFromCharset(ELDER_INVITE_CHARSET, 6);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await connectionRepository.insertElderInvitation(guardianId, code, expiresAt);

  return {
    invite_code: code,
    expires_at: expiresAt,
    qr_payload: JSON.stringify({ type: "SITHAMITHURU_INVITE", guardianId, code }),
  };
};

export const connectElderByCode = async (elderUserId: string, inviteCode: string) => {
  const invitation = await connectionRepository.findValidElderInvitation(inviteCode);
  if (!invitation) throw AppError.badRequest("Invalid or expired invitation code");

  const guardianId = invitation.guardian_id;

  await withTransaction(async (client) => {
    // No QR-flow input sources relationship_type/permission_level, so default
    // the same way the email-based flows do.
    await linkGuardianAndElder(client, guardianId, elderUserId, "Other", "Primary");
    await connectionRepository.markElderInvitationAccepted(invitation.id, client);
  });

  logger.info(`[Connection] Elder ${elderUserId} linked to Guardian ${guardianId} via invite code`);
  return { message: "Successfully linked elder and guardian accounts!" };
};

export const isGuardianLinkedToElder = async (guardianId: string | number, elderId: string | number): Promise<boolean> => {
  const link = await connectionRepository.findActiveRelationship(guardianId, elderId);
  return !!link;
};

export const verifyGuardianElderLink = async (guardianId: string | number, elderId: string | number): Promise<void> => {
  const isLinked = await isGuardianLinkedToElder(guardianId, elderId);
  if (!isLinked) {
    throw AppError.forbidden("Forbidden: You are not authorized for this elder");
  }
};

