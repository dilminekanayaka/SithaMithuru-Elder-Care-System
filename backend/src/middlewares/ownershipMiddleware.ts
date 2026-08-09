import { Response, NextFunction } from "express";
import pool from "../config/db";
import { AuthRequest } from "./authMiddleware";

/**
 * requireElderOwnership
 * ─────────────────────────────────────────────────────────────────────────────
 * SECURITY FIX #3 — IDOR (Insecure Direct Object Reference) protection.
 *
 * Ensures the authenticated Elder can only access their OWN data.
 * Guardian users bypass this check (they legitimately manage elder data).
 *
 * Usage: router.get('/elder/:elderId', protect, requireElderOwnership, handler)
 *
 * How it works:
 *   - If role is 'Guardian' → pass through (guardian has broader access)
 *   - If role is 'Elder' → verify req.params.elderId === req.user.id
 *   - If mismatch → 403 Forbidden
 */
export const requireElderOwnership = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: No user context" });
  }

  // Guardians are allowed to access any elder's data (they manage elders)
  if (req.user.role === "Guardian") {
    return next();
  }

  // For Elders: the elderId in the URL must match the logged-in user's ID
  const elderIdParam = req.params.elderId || req.params.id;
  if (!elderIdParam) {
    return res.status(400).json({ message: "Missing elderId parameter" });
  }

  if (req.user.id !== elderIdParam) {
    return res.status(403).json({
      message: "Forbidden: You can only access your own data",
    });
  }

  next();
};

/**
 * requireElderBodyOwnership
 * ─────────────────────────────────────────────────────────────────────────────
 * Same as requireElderOwnership but checks req.body.elder_id instead of
 * req.params.elderId. Used for POST routes where elderId is in the request body.
 *
 * Usage: router.post('/log', protect, requireElderBodyOwnership, handler)
 */
export const requireElderBodyOwnership = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: No user context" });
  }

  // Guardians can create data for any elder they manage
  if (req.user.role === "Guardian") {
    return next();
  }

  const elderId = req.body.elder_id;
  if (!elderId) {
    return res.status(400).json({ message: "elder_id is required in request body" });
  }

  if (req.user.id !== elderId) {
    return res.status(403).json({
      message: "Forbidden: You can only log data for yourself",
    });
  }

  next();
};

/**
 * requireGuardianElderLink
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies that a Guardian has an ACTIVE link to the elder they are trying to
 * access. Prevents guardians from accessing unlinked elders' data.
 *
 * Usage: router.get('/elder/:elderId', protect, requireRole('Guardian'), requireGuardianElderLink, handler)
 */
export const requireGuardianElderLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: No user context" });
  }

  const guardianId = req.user.id;
  const elderId = req.params.elderId || req.body.elder_id;

  if (!elderId) {
    return next(); // No elderId to check — let controller handle it
  }

  try {
    const linkCheck = await pool.query(
      `SELECT 1 FROM guardian_elder_relationships
       WHERE guardian_id = $1 AND elder_id = $2 AND status = 'ACTIVE'
       LIMIT 1`,
      [guardianId, elderId]
    );

    if (linkCheck.rows.length === 0) {
      return res.status(403).json({
        message: "Forbidden: You do not have an active link with this elder",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error verifying guardian-elder link" });
  }
};
