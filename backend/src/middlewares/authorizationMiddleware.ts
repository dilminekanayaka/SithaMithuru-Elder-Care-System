import { Response, NextFunction } from "express";
import pool from "../config/db";
import { AuthRequest } from "./authMiddleware";
import { sendError } from "../utils/responseWrapper";
import { logger } from "../utils/logger";

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

    // Elders can only access their own data
    if (req.user.role === "Elder") {
      if (req.user.id !== elderId) {
        logger.warn(`[SECURITY] IDOR attempt: Elder ${req.user.id} tried to access Elder ${elderId}`);
        return sendError(res, "Forbidden: You can only access your own data", 403);
      }
      return next();
    }

    // Guardians must be actively linked to the elder
    if (req.user.role === "Guardian") {
      const checkLink = await pool.query(
        `SELECT status FROM guardian_elder_relationships WHERE guardian_id = $1 AND elder_id = $2 AND status = 'ACTIVE'`,
        [req.user.id, elderId]
      );

      if (checkLink.rows.length === 0) {
        logger.warn(`[SECURITY] BOLA attempt: Guardian ${req.user.id} tried to access disconnected Elder ${elderId}`);
        return sendError(res, "Forbidden: You are not authorized to view this elder's data", 403);
      }
      return next();
    }

    return sendError(res, "Forbidden: Invalid role", 403);
  } catch (error) {
    logger.error("Authorization Middleware Error:", error);
    return sendError(res, "Server error validating authorization", 500);
  }
};
