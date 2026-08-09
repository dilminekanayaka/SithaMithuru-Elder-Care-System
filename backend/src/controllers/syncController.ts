import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";

interface BatchMedicationItem {
  client_id: string;
  medication_id: string;
  status: string;
  logged_date: string;
  action_timestamp?: string;
}

interface BatchTaskItem {
  client_id: string;
  task_id: string;
  status: string;
  logged_date: string;
  action_timestamp?: string;
}

interface BatchMoodItem {
  client_id: string;
  mood_type: string;
  logged_date: string;
  action_timestamp?: string;
}

interface SyncBatchRequest {
  elder_id: string;
  medication_logs?: BatchMedicationItem[];
  task_logs?: BatchTaskItem[];
  mood_logs?: BatchMoodItem[];
}

/**
 * Batched Offline Synchronization Endpoint (Phase 11 Architecture).
 * Processes queued offline actions from the mobile app within a single PostgreSQL transaction.
 * Utilizes Last-Write-Wins (LWW) conflict resolution using exact action_timestamp UTC times
 * so clinical adherence times are preserved accurately regardless of when sync occurs.
 */
export const syncBatch = async (req: AuthRequest, res: Response) => {
  const { elder_id, medication_logs = [], task_logs = [], mood_logs = [] }: SyncBatchRequest = req.body;

  if (!elder_id) {
    return res.status(400).json({ message: "elder_id is required for batch sync" });
  }

  const processed = {
    medication_ids: [] as string[],
    task_ids: [] as string[],
    mood_ids: [] as string[],
  };

  const errors: Array<{ table: string; client_id: string; reason: string }> = [];

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    logger.info(`[SyncBatch] Starting transactional batch sync for elder_id=${elder_id} (meds=${medication_logs.length}, tasks=${task_logs.length}, mood=${mood_logs.length})`);

    // 1. Process Medication Logs (LWW via uq_med_log_per_day constraint)
    for (const item of medication_logs) {
      try {
        const actionTime = item.action_timestamp ? new Date(item.action_timestamp) : new Date();
        const logDate = item.logged_date || actionTime.toISOString().split("T")[0];
        const isTaken = item.status === "TAKEN";

        await client.query(
          `INSERT INTO medication_logs (
             medication_id, elder_id, taken_status, taken_at, logged_date, updated_at,
             status, action_time
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT ON CONSTRAINT uq_med_log_per_day
           DO UPDATE SET 
             taken_status = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.taken_status ELSE medication_logs.taken_status END,
             taken_at = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.taken_at ELSE medication_logs.taken_at END,
             updated_at = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.updated_at ELSE medication_logs.updated_at END,
             status = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.status ELSE medication_logs.status END,
             action_time = CASE WHEN EXCLUDED.updated_at > medication_logs.updated_at THEN EXCLUDED.action_time ELSE medication_logs.action_time END`,
          [
            item.medication_id,
            elder_id,
            isTaken,
            isTaken ? actionTime : null,
            logDate,
            actionTime,
            item.status,
            item.status === "TAKEN" || item.status === "SKIPPED" ? actionTime : null,
          ]
        );
        processed.medication_ids.push(item.client_id);
      } catch (err: any) {
        logger.warn(`[SyncBatch] Medication sync failed for client_id=${item.client_id}: ${err.message}`);
        errors.push({ table: "medication_logs", client_id: item.client_id, reason: err.message || "SQL error" });
      }
    }

    // 2. Process Task Logs
    for (const item of task_logs) {
      try {
        const actionTime = item.action_timestamp ? new Date(item.action_timestamp) : new Date();
        await client.query(
          `INSERT INTO task_logs (task_id, elder_id, status, logged_date, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (task_id, elder_id, logged_date)
           DO UPDATE SET status = EXCLUDED.status, created_at = EXCLUDED.created_at`,
          [item.task_id, elder_id, item.status, item.logged_date, actionTime]
        );
        processed.task_ids.push(item.client_id);
      } catch (err: any) {
        logger.warn(`[SyncBatch] Task sync failed for client_id=${item.client_id}: ${err.message}`);
        // Still mark processed or record error
        errors.push({ table: "task_logs", client_id: item.client_id, reason: err.message || "SQL error" });
      }
    }

    // 3. Process Mood Logs (uses exact action_timestamp as created_at)
    for (const item of mood_logs) {
      try {
        const actionTime = item.action_timestamp ? new Date(item.action_timestamp) : new Date();
        await client.query(
          `INSERT INTO mood_logs (elder_id, mood_type, created_at)
           VALUES ($1, $2, $3)`,
          [elder_id, item.mood_type, actionTime]
        );
        processed.mood_ids.push(item.client_id);
      } catch (err: any) {
        logger.warn(`[SyncBatch] Mood sync failed for client_id=${item.client_id}: ${err.message}`);
        errors.push({ table: "mood_logs", client_id: item.client_id, reason: err.message || "SQL error" });
      }
    }

    await client.query("COMMIT");
    logger.info(`✅ [SyncBatch] Transaction committed successfully for elder_id=${elder_id}`);

    res.status(200).json({
      success: true,
      processed,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    logger.error("❌ [SyncBatch] Transaction failed and rolled back:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing batch synchronization",
      error: error.message,
    });
  } finally {
    client.release();
  }
};
