import { getDB } from "../database/db";
import { apiFetch } from "./api";

interface OfflineMedRow {
  id: string;
  medication_id: string;
  status: string;
  logged_date: string;
  action_timestamp?: string;
  retry_count?: number;
}

interface OfflineTaskRow {
  id: string;
  taskId: string;
  status: string;
  logged_date: string;
  action_timestamp?: string;
  retry_count?: number;
}

interface OfflineMoodRow {
  id: string;
  mood_type: string;
  logged_date: string;
  action_timestamp?: string;
  retry_count?: number;
}

/**
 * SyncService (Phase 11 Production Architecture)
 * Replaces naive sequential HTTP requests with:
 * 1. Transactional Batched API calls (/api/sync/batch)
 * 2. Exact clinical timestamps (action_timestamp) for Last-Write-Wins (LWW) resolution
 * 3. Dead Letter Queue / Poison Pill Queue (sync_errors) after 3 client failures
 * 4. Exponential Backoff retry timing on server/network downtime
 */
export class SyncService {
  private isSyncing: boolean = false;
  private currentAttempt: number = 0;
  private readonly MAX_RETRIES = 5;
  private readonly BASE_DELAY_MS = 2000;
  private readonly MAX_DELAY_MS = 300000; // 5 minutes max backoff

  /**
   * Calculates exponential backoff delay: min(maxDelay, baseDelay * 2^attempt)
   */
  public getBackoffDelay(attempt: number): number {
    return Math.min(
      this.MAX_DELAY_MS,
      this.BASE_DELAY_MS * Math.pow(2, attempt)
    );
  }

  /**
   * Moves a permanently failed offline action to the Dead Letter Queue (sync_errors)
   * and deletes it from the active queue to prevent infinite retry loops.
   */
  private async moveToDeadLetterQueue(
    tableName: string,
    rowId: string,
    payload: any,
    reason: string
  ): Promise<void> {
    try {
      const { getDB, runEncryptedAsync } = require('../database/db');
      const db = await getDB();
      // Phase 14: Encrypt the payload before storing it in the dead letter queue
      await runEncryptedAsync(
        `INSERT INTO sync_errors (table_name, original_id, payload, error_reason, failed_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [tableName, rowId, JSON.stringify(payload), reason],
        2 // The index of the payload parameter to encrypt
      );
      await db.runAsync(`DELETE FROM ${tableName} WHERE id = ?`, [rowId]);
      console.warn(`☠️ Moved item ID ${rowId} from ${tableName} to Dead Letter Queue (sync_errors): ${reason}`);
    } catch (e: any) {
      console.error("Failed to move item to DLQ:", e.message);
    }
  }

  /**
   * Increments retry_count for a row. If retry_count >= 3, moves it to Dead Letter Queue.
   */
  private async handleRowError(
    tableName: string,
    row: { id: string; retry_count?: number },
    reason: string
  ): Promise<void> {
    const nextRetry = (row.retry_count || 0) + 1;
    const db = await getDB();

    if (nextRetry >= 3) {
      await this.moveToDeadLetterQueue(tableName, row.id, row, `Exceeded 3 retry attempts: ${reason}`);
    } else {
      try {
        await db.runAsync(`UPDATE ${tableName} SET retry_count = ? WHERE id = ?`, [
          nextRetry,
          row.id,
        ]);
      } catch (e) {
        // Ignore update failure
      }
    }
  }

  /**
   * Executes batched synchronization with SQLite transaction safety.
   */
  public async syncOfflineQueue(elderId: string, token: string): Promise<boolean> {
    if (!elderId || !token) return false;
    if (this.isSyncing) {
      console.log("🔄 Background sync already in progress, skipping duplicate invocation.");
      return false;
    }

    this.isSyncing = true;
    try {
      const db = await getDB();
      console.log("🔄 Starting Transactional Batched LWW Sync...");

      // 1. Fetch up to 50 rows per queue
      const medsRows = await db.getAllAsync<OfflineMedRow>(
        "SELECT * FROM medication_logs_offline WHERE synced = 0 LIMIT 50"
      );
      const tasksRows = await db.getAllAsync<OfflineTaskRow>(
        "SELECT * FROM task_logs_offline WHERE synced = 0 LIMIT 50"
      );
      const moodRows = await db.getAllAsync<OfflineMoodRow>(
        "SELECT * FROM mood_logs_offline WHERE synced = 0 LIMIT 50"
      );

      if (medsRows.length === 0 && tasksRows.length === 0 && moodRows.length === 0) {
        console.log("✅ Offline sync queues are empty.");
        this.currentAttempt = 0;
        return true;
      }

      // 2. Build batched payload with exact LWW action_timestamp
      const payload = {
        elderId: elderId,
        medication_logs: medsRows.map((r) => ({
          client_id: r.id,
          medication_id: r.medication_id,
          status: r.status,
          logged_date: r.logged_date,
          action_timestamp: r.action_timestamp || new Date().toISOString(),
        })),
        task_logs: tasksRows.map((r) => ({
          client_id: r.id,
          taskId: r.taskId,
          status: r.status,
          logged_date: r.logged_date,
          action_timestamp: r.action_timestamp || new Date().toISOString(),
        })),
        mood_logs: moodRows.map((r) => ({
          client_id: r.id,
          mood_type: r.mood_type,
          logged_date: r.logged_date,
          action_timestamp: r.action_timestamp || new Date().toISOString(),
        })),
      };

      // 3. Send batched payload to /api/sync/batch
      const response = await apiFetch("/sync/batch", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // 4. Reset exponential backoff on HTTP success
      this.currentAttempt = 0;

      const { success, processed, errors } = response || {};
      if (!success || !processed) {
        throw new Error("Invalid batch response from server");
      }

      // 5. Transactional deletion of successfully processed rows
      await db.withTransactionAsync(async () => {
        for (const id of processed.medication_ids || []) {
          await db.runAsync("DELETE FROM medication_logs_offline WHERE id = ?", [id]);
        }
        for (const id of processed.task_ids || []) {
          await db.runAsync("DELETE FROM task_logs_offline WHERE id = ?", [id]);
        }
        for (const id of processed.mood_ids || []) {
          await db.runAsync("DELETE FROM mood_logs_offline WHERE id = ?", [id]);
        }
      });

      console.log(
        `✅ Batched Sync Success: ${processed.medication_ids?.length || 0} meds, ${
          processed.task_ids?.length || 0
        } tasks, ${processed.mood_ids?.length || 0} moods synced.`
      );

      // 6. Handle server-side rejected items (HTTP 4xx / Poison pill check)
      if (Array.isArray(errors) && errors.length > 0) {
        for (const errItem of errors) {
          if (errItem.table === "medication_logs") {
            const row = medsRows.find((r) => r.id === errItem.client_id);
            if (row) await this.handleRowError("medication_logs_offline", row, errItem.reason);
          } else if (errItem.table === "task_logs") {
            const row = tasksRows.find((r) => r.id === errItem.client_id);
            if (row) await this.handleRowError("task_logs_offline", row, errItem.reason);
          } else if (errItem.table === "mood_logs") {
            const row = moodRows.find((r) => r.id === errItem.client_id);
            if (row) await this.handleRowError("mood_logs_offline", row, errItem.reason);
          }
        }
      }

      return true;
    } catch (error: any) {
      this.currentAttempt++;
      const delay = this.getBackoffDelay(this.currentAttempt);
      console.warn(
        `⚠️ Sync error on attempt #${this.currentAttempt}: ${error.message}. Next backoff delay: ${
          delay / 1000
        }s`
      );
      return false;
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
export const syncOfflineQueue = (elderId: string, token: string) =>
  syncService.syncOfflineQueue(elderId, token);
