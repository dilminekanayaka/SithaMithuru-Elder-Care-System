import pool from "../config/db";
import * as syncRepository from "../repositories/syncRepository";
import { notifyGuardiansOfEmergency } from "./emergencyService";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

export interface BatchSyncData {
  elder_id: string | number;
  medication_logs?: any[];
  task_logs?: any[];
  mood_logs?: any[];
  emergency_logs?: any[];
  journal_entries?: any[];
}

export const processBatchSync = async (data: BatchSyncData) => {
  if (!data.elder_id) {
    throw AppError.badRequest("elder_id is required for batch sync");
  }

  const elderId = data.elder_id;
  const medication_logs = data.medication_logs || [];
  const task_logs = data.task_logs || [];
  const mood_logs = data.mood_logs || [];
  const emergency_logs = data.emergency_logs || [];
  const journal_entries = data.journal_entries || [];

  const processed = {
    medication_ids: [] as string[],
    task_ids: [] as string[],
    mood_ids: [] as string[],
    emergency_ids: [] as string[],
    journal_ids: [] as string[],
  };

  const errors: Array<{ table: string; client_id: string; reason: string }> = [];
  const newEmergencyLogs: any[] = [];

  const client = await pool.connect();

  try {
    if (client && client.query) {
      await client.query("BEGIN");
    }
    logger.info(`[SyncBatch] Starting transactional batch sync for elder_id=${elderId}`);

    for (const item of medication_logs) {
      try {
        await syncRepository.syncMedicationItem(client, elderId, item);
        processed.medication_ids.push(item.client_id);
      } catch (err: any) {
        logger.warn(`[SyncBatch] Medication sync failed for client_id=${item.client_id}: ${err.message}`);
        errors.push({ table: "medication_logs", client_id: item.client_id, reason: err.message || "SQL error" });
      }
    }

    for (const item of task_logs) {
      try {
        await syncRepository.syncTaskItem(client, elderId, item);
        processed.task_ids.push(item.client_id);
      } catch (err: any) {
        logger.warn(`[SyncBatch] Task sync failed for client_id=${item.client_id}: ${err.message}`);
        errors.push({ table: "task_logs", client_id: item.client_id, reason: err.message || "SQL error" });
      }
    }

    for (const item of mood_logs) {
      try {
        await syncRepository.syncMoodItem(client, elderId, item);
        processed.mood_ids.push(item.client_id);
      } catch (err: any) {
        logger.warn(`[SyncBatch] Mood sync failed for client_id=${item.client_id}: ${err.message}`);
        errors.push({ table: "mood_logs", client_id: item.client_id, reason: err.message || "SQL error" });
      }
    }

    for (const item of emergency_logs) {
      try {
        const created = await syncRepository.syncEmergencyItem(client, elderId, item);
        if (created) newEmergencyLogs.push(created);
        processed.emergency_ids.push(item.client_id);
      } catch (err: any) {
        logger.warn(`[SyncBatch] Emergency sync failed for client_id=${item.client_id}: ${err.message}`);
        errors.push({ table: "emergency_logs", client_id: item.client_id, reason: err.message || "SQL error" });
      }
    }

    for (const item of journal_entries) {
      try {
        await syncRepository.syncJournalItem(client, elderId, item);
        processed.journal_ids.push(item.client_id);
      } catch (err: any) {
        logger.warn(`[SyncBatch] Journal sync failed for client_id=${item.client_id}: ${err.message}`);
        errors.push({ table: "journal_entries", client_id: item.client_id, reason: err.message || "SQL error" });
      }
    }

    if (client && client.query) {
      await client.query("COMMIT");
    }
    logger.info(`✅ [SyncBatch] Transaction committed successfully for elder_id=${elderId}`);

    for (const log of newEmergencyLogs) {
      try {
        await notifyGuardiansOfEmergency(elderId, log);
      } catch (notifyErr: any) {
        logger.error(`[SyncBatch] Failed to notify guardians for synced emergency log ${log.id}: ${notifyErr.message}`);
      }
    }

    return { processed, errors, timestamp: new Date().toISOString() };
  } catch (error: any) {
    if (client && client.query) {
      await client.query("ROLLBACK");
    }
    logger.error("❌ [SyncBatch] Transaction failed and rolled back:", error);
    throw error;
  } finally {
    if (client && typeof client.release === "function") {
      client.release();
    }
  }
};
