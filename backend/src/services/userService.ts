import * as userRepository from "../repositories/userRepository";
import { recordAuditLog } from "../repositories/auditLogRepository";
import { withTransaction } from "../config/transaction";
import { AppError } from "../utils/AppError";

type RequestUser = { id: string; role: string } | undefined;

const assertSelf = (requestingUser: RequestUser, targetId: string, action: string) => {
  if (!requestingUser || requestingUser.id !== targetId) {
    throw AppError.forbidden(`Forbidden: You can only ${action} your own profile`);
  }
};

export const getProfile = async (requestingUser: RequestUser, targetId: string) => {
  assertSelf(requestingUser, targetId, "view");
  const user = await userRepository.findUserProfileById(targetId);
  if (!user) throw AppError.notFound("User not found");
  return user;
};

export const updateProfile = async (
  requestingUser: RequestUser,
  targetId: string,
  fields: userRepository.ProfileUpdateFields
) => {
  assertSelf(requestingUser, targetId, "update");

  // ALLOWLIST: primary_guardian_id is intentionally excluded from updatable
  // fields — guardian association must go through the connection/invite flow
  // only, never a direct profile edit.
  const updated = await userRepository.updateUserProfile(targetId, fields);
  if (!updated) throw AppError.notFound("User not found");

  return userRepository.findUserProfileById(targetId);
};

export const listGuardians = async (requestingUser: RequestUser) => {
  // Elders must not enumerate every guardian in the system — only Guardian
  // accounts may look up this reference list.
  if (requestingUser?.role !== "Guardian") {
    throw AppError.forbidden("Forbidden: Only Guardian accounts can access this endpoint");
  }
  return userRepository.findAllGuardianNames();
};

export const registerFcmToken = async (userId: string | undefined, fcmToken: string) => {
  if (!userId) throw AppError.unauthorized("Unauthorized: No user session");
  if (!fcmToken) throw AppError.badRequest("fcm_token is required");

  const updated = await userRepository.setFcmToken(userId, fcmToken);
  if (!updated) throw AppError.notFound("User not found");
};

export const deleteAccount = async (requestingUser: RequestUser, targetId: string) => {
  assertSelf(requestingUser, targetId, "delete");

  await withTransaction(async (client) => {
    const deleted = await userRepository.softDeleteUser(targetId, client);
    if (!deleted) throw AppError.notFound("User not found or already deleted");

    await userRepository.deleteRefreshTokensForUser(targetId, client);

    // Audit logging is intentionally best-effort (recordAuditLog swallows its
    // own errors) — it must never roll back an already-legitimate deletion.
    await recordAuditLog(
      {
        actorId: targetId,
        action: "DELETE_USER",
        entityId: targetId,
        entityType: "users",
        newData: { deleted_at: new Date().toISOString() },
      },
      client
    );
  });
};
