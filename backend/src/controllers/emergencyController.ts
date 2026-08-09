import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { getIo } from "../utils/ioProvider";
import { sendPushNotification } from "../config/firebase";
import { logger } from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseWrapper";

// ─── POST /api/emergency/trigger ─────────────────────────────────────────────
// Called by the elder app when SOS is triggered (or voice keyword detected).
// Creates a new log entry with exact GPS coordinates and notifies guardians in real-time.
export const triggerSOS = async (req: AuthRequest, res: Response) => {
  try {
    const {
      elder_id,
      device_location,
      triggered_phrase,
      latitude,
      longitude,
      maps_url,
      triggered_by_model,
      audio_snr_db,
      confidence_score,
    } = req.body;

    if (!elder_id) {
      return sendError(res, "elder_id is required to trigger SOS", 400);
    }

    // SECURITY: Ensure the logged-in user is either the elder themselves or their assigned guardian.
    if (req.user?.role === "Elder" && req.user.id !== elder_id) {
      return sendError(res, "Forbidden: You cannot trigger SOS for another user", 403);
    }

    // Fetch Elder name and Guardian associations (relationships table)
    const guardianInfo = await pool.query(
      `SELECT u.name as elder_name, u.primary_guardian_id, ger.guardian_id as linked_guardian_id
       FROM users u
       LEFT JOIN guardian_elder_relationships ger ON ger.elder_id = u.id AND ger.status = 'ACTIVE'
       WHERE u.id = $1`,
      [elder_id]
    );

    const elderName = guardianInfo.rows[0]?.elder_name || "Your Elder";

    // Collect all unique guardian IDs linked to this elder
    const guardianIdsSet = new Set<number>();
    guardianInfo.rows.forEach((row) => {
      if (row.primary_guardian_id) guardianIdsSet.add(row.primary_guardian_id);
      if (row.linked_guardian_id) guardianIdsSet.add(row.linked_guardian_id);
    });
    const guardianIds = Array.from(guardianIdsSet);

    // Build Maps URL if latitude and longitude are present
    let formattedMapsUrl = maps_url || null;
    if (!formattedMapsUrl && latitude !== undefined && longitude !== undefined) {
      formattedMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    }

    // Insert the emergency log with GPS coordinates, maps link, and AI telemetry
    const result = await pool.query(
      `INSERT INTO emergency_logs (
         elder_id, device_location, triggered_phrase, latitude, longitude, maps_url,
         triggered_by_model, audio_snr_db, confidence_score, status, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', CURRENT_TIMESTAMP)
       RETURNING id, elder_id, device_location, triggered_phrase, latitude, longitude, maps_url,
                 triggered_by_model, audio_snr_db, confidence_score, status, created_at`,
      [
        elder_id,
        device_location || "Unknown Location",
        triggered_phrase || "SOS Button Pressed",
        latitude || null,
        longitude || null,
        formattedMapsUrl,
        triggered_by_model || null,
        audio_snr_db !== undefined ? audio_snr_db : null,
        confidence_score !== undefined ? confidence_score : null,
      ]
    );

    const createdLog = result.rows[0];

    // Emit live Socket.io alert to each linked guardian room AND the elder's own room
    const io = getIo();
    guardianIds.forEach((guardianId) => {
      io.to(guardianId.toString()).emit("sos:triggered", {
        elder_name: elderName,
        log: createdLog,
      });
      logger.info(
        `[SOS] Emitted sos:triggered to room ${guardianId} for elder ${elderName}`
      );
    });

    // Send push notification to all linked guardians
    if (guardianIds.length > 0) {
      const guardiansResult = await pool.query(
        `SELECT id, fcm_token FROM users WHERE id = ANY($1) AND fcm_token IS NOT NULL`,
        [guardianIds]
      );

      guardiansResult.rows.forEach((guardian) => {
        sendPushNotification(
          guardian.fcm_token,
          "🚨 EMERGENCY SOS ALERT 🚨",
          `${elderName} triggered an emergency SOS! Tap to check GPS location.`,
          {
            elderId: elder_id.toString(),
            logId: createdLog.id.toString(),
            mapsUrl: formattedMapsUrl || "",
            screen: "emergencyDetails",
          }
        );
      });
    }

    return sendSuccess(res, {
      success: true,
      message: "SOS alert triggered successfully",
      log: createdLog,
    }, undefined, 201);
  } catch (error: any) {
    logger.error("Trigger SOS Error:", error);
    return sendError(res, "Server error triggering SOS alert", 500);
  }
};

// ─── PUT /api/emergency/:id/resolve ──────────────────────────────────────────
// Called by the guardian to resolve an active SOS alert with a required reason.
export const resolveEmergency = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: 'Resolved' | 'False Alarm', reason: 'False Alarm' | 'Medical Help Provided' | 'Ambulance Dispatched'
    const resolverId = req.user?.id;

    if (!status || !["Resolved", "False Alarm"].includes(status)) {
      return sendError(res, "Valid status ('Resolved' or 'False Alarm') is required", 400);
    }

    const validReasons = [
      "False Alarm",
      "Medical Help Provided",
      "Ambulance Dispatched",
      "Elder Cancelled",
    ];
    const resolutionReason = validReasons.includes(reason)
      ? reason
      : status === "False Alarm"
      ? "False Alarm"
      : "Medical Help Provided";

    const checkLog = await pool.query(
      `SELECT * FROM emergency_logs WHERE id = $1`,
      [id]
    );

    if (checkLog.rows.length === 0) {
      return sendError(res, "Emergency log not found", 404);
    }

    const logRow = checkLog.rows[0];
    const elderId = logRow.elder_id;

    // Resolve the log and fetch resolver's name in one query
    const result = await pool.query(
      `WITH updated AS (
         UPDATE emergency_logs
         SET status = $1,
             resolved_by = $2,
             resolved_at = CURRENT_TIMESTAMP,
             resolution_reason = $3,
             resolved_by_name = COALESCE((SELECT name FROM users WHERE id = $2), 'Guardian'),
             cancelled_by_role = 'Guardian',
             resolution_notes = $3
         WHERE id = $4
         RETURNING *
       )
       SELECT u.id, u.elder_id, u.device_location, u.latitude, u.longitude, u.maps_url,
              u.triggered_phrase, u.status, u.resolution_reason, u.resolved_by_name,
              u.cancelled_by_role, u.resolution_notes,
              u.created_at, u.resolved_at
       FROM updated u`,
      [status, resolverId, resolutionReason, id]
    );

    const updatedLog = result.rows[0];

    // Record change in immutable audit_logs table (Phase 12 Audit Compliance)
    try {
      await pool.query(
        `INSERT INTO audit_logs (actor_id, action, entity_id, entity_type, old_data, new_data)
         VALUES ($1, 'RESOLVED_EMERGENCY', $2, 'emergency_logs', $3, $4)`,
        [
          resolverId,
          id,
          JSON.stringify({ status: logRow.status }),
          JSON.stringify({ status, resolution_reason: resolutionReason, cancelled_by_role: 'Guardian' }),
        ]
      );
    } catch (auditErr: any) {
      logger.warn(`[AuditLog] Failed to record RESOLVED_EMERGENCY for SOS #${id}: ${auditErr.message}`);
    }

    // Emit live Socket.io alert to Elder room AND Guardian rooms so both screens sync
    const io = getIo();
    io.to(elderId.toString()).emit("sos:resolved", {
      log: updatedLog,
      message: `Guardian resolved alert: ${resolutionReason}`,
    });

    // Notify all linked guardians of resolution
    const guardianInfo = await pool.query(
      `SELECT primary_guardian_id, ger.guardian_id as linked_guardian_id
       FROM users u
       LEFT JOIN guardian_elder_relationships ger ON ger.elder_id = u.id AND ger.status = 'ACTIVE'
       WHERE u.id = $1`,
      [elderId]
    );

    const guardianIdsSet = new Set<number>();
    guardianInfo.rows.forEach((row) => {
      if (row.primary_guardian_id) guardianIdsSet.add(row.primary_guardian_id);
      if (row.linked_guardian_id) guardianIdsSet.add(row.linked_guardian_id);
    });

    Array.from(guardianIdsSet).forEach((gId) => {
      io.to(gId.toString()).emit("sos:resolved", {
        log: updatedLog,
        message: `Emergency resolved: ${resolutionReason}`,
      });
    });

    return sendSuccess(res, {
      success: true,
      message: `Emergency marked as ${status}`,
      log: updatedLog,
    }, undefined, 200);
  } catch (error: any) {
    logger.error("Resolve Emergency Error:", error);
    return sendError(res, "Server error resolving emergency", 500);
  }
};

// ─── PUT /api/emergency/:id/cancel ───────────────────────────────────────────
// Called by the elder when they tap "I am safe now / Cancel" to resolve their own alert.
export const cancelSOS = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const checkLog = await pool.query(
      `SELECT * FROM emergency_logs WHERE id = $1`,
      [id]
    );

    if (checkLog.rows.length === 0) {
      return sendError(res, "Emergency log not found", 404);
    }

    const logRow = checkLog.rows[0];
    const elderId = logRow.elder_id;

    const result = await pool.query(
      `UPDATE emergency_logs
       SET status = 'False Alarm',
           resolved_by = $1,
           resolved_at = CURRENT_TIMESTAMP,
           resolution_reason = 'Elder cancelled - I am safe now',
           resolved_by_name = COALESCE((SELECT name FROM users WHERE id = $1), 'Elder'),
           cancelled_by_role = 'Elder',
           resolution_notes = 'Elder cancelled - I am safe now'
       WHERE id = $2
       RETURNING *`,
      [userId, id]
    );

    const updatedLog = result.rows[0];

    // Record change in immutable audit_logs table (Phase 12 Audit Compliance)
    try {
      await pool.query(
        `INSERT INTO audit_logs (actor_id, action, entity_id, entity_type, old_data, new_data)
         VALUES ($1, 'CANCELLED_EMERGENCY', $2, 'emergency_logs', $3, $4)`,
        [
          userId,
          id,
          JSON.stringify({ status: logRow.status }),
          JSON.stringify({ status: 'False Alarm', cancelled_by_role: 'Elder', resolution_notes: 'Elder cancelled - I am safe now' }),
        ]
      );
    } catch (auditErr: any) {
      logger.warn(`[AuditLog] Failed to record CANCELLED_EMERGENCY for SOS #${id}: ${auditErr.message}`);
    }

    // Emit sos:cancelled and sos:resolved to all linked Guardian rooms and Elder room
    const io = getIo();
    io.to(elderId.toString()).emit("sos:cancelled", {
      log: updatedLog,
      message: "Elder cancelled the SOS alert - safe now.",
    });
    io.to(elderId.toString()).emit("sos:resolved", {
      log: updatedLog,
      message: "Elder cancelled SOS - safe now.",
    });

    const guardianInfo = await pool.query(
      `SELECT primary_guardian_id, ger.guardian_id as linked_guardian_id
       FROM users u
       LEFT JOIN guardian_elder_relationships ger ON ger.elder_id = u.id AND ger.status = 'ACTIVE'
       WHERE u.id = $1`,
      [elderId]
    );

    const guardianIdsSet = new Set<number>();
    guardianInfo.rows.forEach((row) => {
      if (row.primary_guardian_id) guardianIdsSet.add(row.primary_guardian_id);
      if (row.linked_guardian_id) guardianIdsSet.add(row.linked_guardian_id);
    });

    Array.from(guardianIdsSet).forEach((gId) => {
      io.to(gId.toString()).emit("sos:cancelled", {
        log: updatedLog,
        message: "Elder cancelled SOS - safe now.",
      });
      io.to(gId.toString()).emit("sos:resolved", {
        log: updatedLog,
        message: "Elder cancelled SOS - safe now.",
      });
    });

    return sendSuccess(res, {
      success: true,
      message: "Emergency SOS cancelled successfully",
      log: updatedLog,
    }, undefined, 200);
  } catch (error: any) {
    logger.error("Cancel SOS Error:", error);
    return sendError(res, "Server error cancelling SOS", 500);
  }
};
