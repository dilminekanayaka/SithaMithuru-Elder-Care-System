import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseWrapper";

/**
 * Generate 8-digit Single-Use Invitation Code (Expires in 15 mins)
 * POST /api/connection/invite
 */
export const generateInvite = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  try {
    // Rate Limiting Check (Max 5 codes per day)
    const rateCheck = await pool.query(
      `SELECT COUNT(*) FROM invitations 
       WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
      [userId]
    );
    if (parseInt(rateCheck.rows[0].count) >= 5) {
      return sendError(res, "Daily invitation limit reached (Max 5 per day).", 429);
    }

    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let token = "SM-";
    for (let i = 0; i < 4; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    token += "-";
    for (let i = 0; i < 4; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO invitations (token, created_by, role, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, token, expires_at`,
      [token, userId, userRole, expiresAt]
    );

    // Log action
    await pool.query(
      "INSERT INTO connection_logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "INVITATION_CREATED", `Token ${token} generated.`]
    );

    return sendSuccess(res, {
      success: true,
      token: result.rows[0].token,
      expiresAt: result.rows[0].expires_at,
    }, undefined, 201);
  } catch (error: any) {
    logger.error("Invite code generation error:", error);
    return sendError(res, "Server error generating invite code.", 500);
  }
};

/**
 * Validate Invitation Token & Create Intermediate Pending Connection Request
 * POST /api/connection/validate
 */
export const validateInvite = async (req: AuthRequest, res: Response) => {
  const { token, relationship, permissionLevel } = req.body;
  const callerId = req.user?.id;
  const callerRole = req.user?.role;

  if (!callerId) {
    return sendError(res, "Unauthorized", 401);
  }

  if (!token) {
    return sendError(res, "Invitation token is required.", 400);
  }

  try {
    const inviteRes = await pool.query(
      `SELECT * FROM invitations WHERE token = $1`,
      [token.trim()]
    );

    if (inviteRes.rows.length === 0) {
      return sendError(res, "Invitation code not found.", 404);
    }

    const invite = inviteRes.rows[0];

    if (invite.used) {
      return sendError(res, "This invitation code has already been used.", 400);
    }

    if (new Date(invite.expires_at) < new Date()) {
      return sendError(res, "Invitation code has expired.", 400);
    }

    if (invite.role === callerRole) {
      return sendError(res, "Cannot connect users with the same roles.", 400);
    }

    const targetUserId = invite.created_by;

    // Check if duplicate pending request exists
    const duplicateCheck = await pool.query(
      `SELECT * FROM pending_connections 
       WHERE from_user = $1 AND to_user = $2 AND status = 'PENDING'`,
      [callerId, targetUserId]
    );

    if (duplicateCheck.rows.length > 0) {
      return sendError(res, "A connection request is already pending for this user.", 400);
    }

    // Insert intermediate pending request
    await pool.query(
      `INSERT INTO pending_connections (from_user, to_user, relationship_type, permission_level)
       VALUES ($1, $2, $3, $4)`,
      [callerId, targetUserId, relationship || "Other", permissionLevel || "Primary"]
    );

    // Mark invitation token as used
    await pool.query(
      `UPDATE invitations SET used = TRUE, status = 'ACCEPTED' WHERE id = $1`,
      [invite.id]
    );

    // Log connection request
    await pool.query(
      "INSERT INTO connection_logs (user_id, action, details) VALUES ($1, $2, $3)",
      [callerId, "CONNECTION_REQUEST_SENT", `Request sent to user ${targetUserId}.`]
    );

    return sendSuccess(res, {
      success: true,
      message: "Connection request sent. Waiting for approval.",
    }, undefined, 200);
  } catch (error: any) {
    logger.error("Invite validation error:", error);
    return sendError(res, "Server error processing invite code.", 500);
  }
};

/**
 * Get Incoming Pending Connection Requests
 * GET /api/connection/pending
 */
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  try {
    const result = await pool.query(
      `SELECT pc.id, pc.relationship_type, pc.permission_level, pc.created_at,
              u.id as user_id, u.name, u.email, u.phone, u.role
       FROM pending_connections pc
       JOIN users u ON pc.from_user = u.id
       WHERE pc.to_user = $1 AND pc.status = 'PENDING'`,
      [userId]
    );
    return sendSuccess(res, { success: true, requests: result.rows }, undefined, 200);
  } catch (error: any) {
    logger.error("Fetch pending requests error:", error);
    return sendError(res, "Server error fetching connection requests.", 500);
  }
};

/**
 * Accept or Reject Connection Request
 * PUT /api/connection/respond/:requestId
 */
export const respondToRequest = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { requestId } = req.params;
  const { action } = req.body; // 'ACCEPT' or 'REJECT'

  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  try {
    const requestRes = await pool.query(
      `SELECT * FROM pending_connections WHERE id = $1 AND to_user = $2`,
      [requestId, userId]
    );

    if (requestRes.rows.length === 0) {
      return sendError(res, "Connection request not found.", 404);
    }

    const request = requestRes.rows[0];

    if (action === "ACCEPT") {
      // Create Relationship
      const guardianId = req.user?.role === "Guardian" ? userId : request.from_user;
      const elderId = req.user?.role === "Elder" ? userId : request.from_user;

      await pool.query(
        `INSERT INTO guardian_elder_relationships (guardian_id, elder_id, relationship_type, permission_level)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (guardian_id, elder_id) DO NOTHING`,
        [guardianId, elderId, request.relationship_type, request.permission_level]
      );

      await pool.query(
        `UPDATE pending_connections SET status = 'ACCEPTED' WHERE id = $1`,
        [requestId]
      );

      // Log accepted request
      await pool.query(
        "INSERT INTO connection_logs (user_id, action, details) VALUES ($1, $2, $3)",
        [userId, "REQUEST_ACCEPTED", `Connected with user ${request.from_user}.`]
      );

      return sendSuccess(res, { success: true, message: "Connection request approved." }, undefined, 200);
    } else {
      await pool.query(
        `UPDATE pending_connections SET status = 'REJECTED' WHERE id = $1`,
        [requestId]
      );

      // Log rejected request
      await pool.query(
        "INSERT INTO connection_logs (user_id, action, details) VALUES ($1, $2, $3)",
        [userId, "REQUEST_REJECTED", `Rejected request from user ${request.from_user}.`]
      );

      return sendSuccess(res, { success: true, message: "Connection request declined." }, undefined, 200);
    }
  } catch (error: any) {
    logger.error("Respond connection request error:", error);
    return sendError(res, "Server error responding to connection request.", 500);
  }
};

/**
 * Unlink Guardian from Elder
 * DELETE /api/v1/connection/unlink
 */
export const unlinkConnection = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  const { targetId } = req.body;

  if (!userId || !targetId) {
    return sendError(res, "Unauthorized or missing targetId", 400);
  }

  try {
    let guardianId, elderId;
    if (role === "Guardian") {
      guardianId = userId;
      elderId = targetId;
    } else if (role === "Elder") {
      guardianId = targetId;
      elderId = userId;
    } else {
      return sendError(res, "Invalid role", 403);
    }

    const result = await pool.query(
      `UPDATE guardian_elder_relationships SET status = 'INACTIVE'
       WHERE guardian_id = $1 AND elder_id = $2 AND status = 'ACTIVE' RETURNING *`,
      [guardianId, elderId]
    );

    if (result.rows.length === 0) {
      return sendError(res, "Active connection not found", 404);
    }

    // Log the unlink
    await pool.query(
      "INSERT INTO connection_logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "UNLINK", `Unlinked from user ${targetId}.`]
    );

    return sendSuccess(res, { success: true, message: "Connection unlinked successfully." });
  } catch (error: any) {
    logger.error("Unlink connection error:", error);
    return sendError(res, "Server error unlinking connection.", 500);
  }
};

