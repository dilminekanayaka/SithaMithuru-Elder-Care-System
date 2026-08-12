import { Response, NextFunction } from "express";
import pool from "../config/db";
import { AuthRequest } from "./authMiddleware";
import { sendError } from "../utils/responseWrapper";
import { logger } from "../utils/logger";

/**
 * Single source of truth for "may `user` act on data belonging to elderId?"
 * — an Elder may only act on their own data; a Guardian must have either an
 * ACTIVE row in guardian_elder_relationships or be the elder's
 * primary_guardian_id (kept as a defensive fallback in case the two ever
 * drift, per the guardian_elder migration-integrity fix in migration_v16).
 *
 * Used both directly (by controllers that only learn elderId after fetching
 * a resource — e.g. "whose medication is #42?") and internally by
 * authorizeElderAccess (the route-level middleware, for endpoints where
 * elderId is already known from req.params/req.body). Previously these were
 * two separate implementations with subtly different logic — the route-level
 * one didn't check primary_guardian_id — which meant a guardian could be
 * authorized by one code path and rejected by the other for the same elder.
 */
export const isAuthorizedForElder = async (
  user: { id: string; role: string } | undefined,
  elderId: string | number
): Promise<boolean> => {
  if (!user) return false;

  if (user.role === "Elder") {
    return String(user.id) === String(elderId);
  }

  if (user.role === "Guardian") {
    const linkCheck = await pool.query(
      `SELECT 1 FROM users u
       LEFT JOIN guardian_elder_relationships ger ON ger.elder_id = u.id AND ger.guardian_id = $1 AND ger.status = 'ACTIVE'
       WHERE u.id = $2 AND (u.primary_guardian_id = $1 OR ger.guardian_id IS NOT NULL)`,
      [user.id, elderId]
    );
    return linkCheck.rows.length > 0;
  }

  return false;
};

/**
 * Phase 13 Security Audit: Broken Object Level Authorization (BOLA) Fix.
 * Ensures the authenticated user has explicit permission to view the requested elderId's data.
 * Protects against URL parameter scraping.
 */
export const authorizeElderAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const elderId = req.params.elderId || req.body.elderId || req.body.elder_id;

    if (!elderId) {
      return sendError(res, "elderId is required for authorization validation", 400);
    }

    if (!req.user) {
      return sendError(res, "Unauthorized", 401);
    }

    const authorized = await isAuthorizedForElder(req.user, elderId);

    if (!authorized) {
      if (req.user.role === "Elder") {
        logger.warn(`[SECURITY] IDOR attempt: Elder ${req.user.id} tried to access Elder ${elderId}`);
        return sendError(res, "Forbidden: You can only access your own data", 403);
      }
      if (req.user.role === "Guardian") {
        logger.warn(`[SECURITY] BOLA attempt: Guardian ${req.user.id} tried to access disconnected Elder ${elderId}`);
        return sendError(res, "Forbidden: You are not authorized to view this elder's data", 403);
      }
      return sendError(res, "Forbidden: Invalid role", 403);
    }

    return next();
  } catch (error) {
    logger.error("Authorization Middleware Error:", error);
    return sendError(res, "Server error validating authorization", 500);
  }
};
