import { Request, Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseWrapper";

// ─── PUT /api/users/:id ──────────────────────────────────────────────────────
// SECURITY FIX #7: Added ownership check (req.user.id === req.params.id).
// SECURITY FIX #7: Removed `primary_guardian_id` from mass update — guardian
//   assignment must go through the dedicated connection/invite flow only.
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // OWNERSHIP CHECK: Users can only update their own profile
    if (!req.user || req.user.id !== id) {
      return sendError(res, "Forbidden: You can only update your own profile", 403);
    }

    // ALLOWLIST: Only permit safe fields. primary_guardian_id is intentionally
    // excluded — use the invitation/connection flow to change guardian associations.
    const { name, age, blood_type, weight, phone_number, avatar_url } = req.body;

    const query = `
      UPDATE users 
      SET name = $1, age = $2, blood_type = $3, weight = $4, phone_number = $5, avatar_url = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, email, role, avatar_url, age, blood_type, weight, phone_number, primary_guardian_id
    `;

    const result = await pool.query(query, [
      name,
      age ? parseInt(age) : null,
      blood_type || null,
      weight ? parseFloat(weight) : null,
      phone_number || null,
      avatar_url || null,
      id,
    ]);

    if (result.rows.length === 0) {
      return sendError(res, "User not found", 404);
    }

    // Fetch the updated user with joined guardian info
    const fullUserQuery = `
      SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.age, u.blood_type, u.weight, u.phone_number, u.primary_guardian_id,
             pg.name as guardian_name, pg.role as guardian_role
      FROM users u
      LEFT JOIN users pg ON u.primary_guardian_id = pg.id
      WHERE u.id = $1
    `;
    const finalResult = await pool.query(fullUserQuery, [id]);

    return sendSuccess(res, {
      message: "Profile updated successfully",
      user: finalResult.rows[0],
    }, undefined, 200);
  } catch (error) {
    logger.error("Update Profile Error:", error);
    return sendError(res, "Server error during profile update", 500);
  }
};

// ─── GET /api/users/:id ──────────────────────────────────────────────────────
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.age, u.blood_type, u.weight, u.phone_number, u.primary_guardian_id,
             pg.name as guardian_name, pg.role as guardian_role
      FROM users u
      LEFT JOIN users pg ON u.primary_guardian_id = pg.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, result.rows[0], undefined, 200);
  } catch (error) {
    logger.error("Get User Error:", error);
    return sendError(res, "Server error retrieving user data", 500);
  }
};

// ─── GET /api/users/guardians/all ───────────────────────────────────────────
// SECURITY FIX #22: Restricted to Guardian role only (Elders cannot enumerate
// all guardians in the system). Route ordering fix is in userRoutes.ts.
export const getAllGuardians = async (req: AuthRequest, res: Response) => {
  try {
    // Only allow Guardians to query the guardian list (e.g., for profile reference)
    // Elders should not be able to enumerate all guardians in the system.
    if (req.user?.role !== "Guardian") {
      return sendError(res, "Forbidden: Only Guardian accounts can access this endpoint", 403);
    }

    const result = await pool.query(
      "SELECT id, name FROM users WHERE role = 'Guardian'"
    );
    return sendSuccess(res, result.rows, undefined, 200);
  } catch (error) {
    logger.error("Get Guardians Error:", error);
    return sendError(res, "Server error retrieving guardians", 500);
  }
};

// ─── POST /api/users/fcm-token ───────────────────────────────────────────────
// Registers or updates the FCM registration token for push notifications
export const registerFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const { fcm_token } = req.body;
    const userId = req.user?.id;

    if (!fcm_token) {
      return sendError(res, "fcm_token is required", 400);
    }

    if (!userId) {
      return sendError(res, "Unauthorized: No user session", 401);
    }

    const result = await pool.query(
      `UPDATE users SET fcm_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id`,
      [fcm_token, userId]
    );

    if (result.rows.length === 0) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, { success: true, message: "FCM token registered successfully" }, undefined, 200);
  } catch (error: any) {
    logger.error("Register FCM Token Error:", error);
    return sendError(res, "Server error registering FCM token", 500);
  }
};

// ─── DELETE /api/v1/users/:id ────────────────────────────────────────────────
// Soft deletes a user account for GDPR compliance (Right to Erasure)
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // OWNERSHIP CHECK: Users can only delete their own account
    if (!req.user || req.user.id !== id) {
      return sendError(res, "Forbidden: You can only delete your own account", 403);
    }

    // Soft delete the user
    const result = await pool.query(
      `UPDATE users 
       SET deleted_at = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP,
           fcm_token = NULL
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, "User not found or already deleted", 404);
    }

    // Insert into audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_state) 
       VALUES ($1, 'DELETE_USER', 'users', $2, $3)`,
      [id, id, JSON.stringify({ deleted_at: new Date().toISOString() })]
    );

    // Also soft delete active tokens
    await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [id]);

    return sendSuccess(res, { message: "Account deleted successfully" }, undefined, 200);
  } catch (error) {
    logger.error("Delete Account Error:", error);
    return sendError(res, "Server error during account deletion", 500);
  }
};
