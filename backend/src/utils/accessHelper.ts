import { verifyGuardianElderLink } from "../services/connectionService";
import { AppError } from "./AppError";

export type UserContext = { id: string | number; role: string };

/**
 * Unified service-layer authorization gate:
 * - Elder role: Verified against their own ID (IDOR / BOLA protection)
 * - Guardian role: Verified for an active link to the target Elder
 */
export const verifyUserElderAccess = async (user: UserContext | undefined, elderId: string | number): Promise<void> => {
  if (!user) {
    throw AppError.unauthorized("Unauthorized: User context required");
  }

  if (user.role === "Elder") {
    if (String(user.id) !== String(elderId)) {
      throw AppError.forbidden("Forbidden: You can only access your own data");
    }
    return;
  }

  if (user.role === "Guardian") {
    await verifyGuardianElderLink(user.id, elderId);
    return;
  }

  throw AppError.forbidden("Forbidden: Invalid user role");
};
