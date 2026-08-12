import { PoolClient } from "pg";

export interface SyncBatchItems {
  elderId: string | number;
  medicationLogs?: any[];
  taskLogs?: any[];
  moodLogs?: any[];
  emergencyLogs?: any[];
  journalEntries?: any[];
}

export const syncMedicationItem = async (client: PoolClient, elderId: string | number, item: any) => {
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
      elderId,
      isTaken,
      isTaken ? actionTime : null,
      logDate,
      actionTime,
      item.status,
      item.status === "TAKEN" || item.status === "SKIPPED" ? actionTime : null,
    ]
  );
};

export const syncTaskItem = async (client: PoolClient, elderId: string | number, item: any) => {
  const actionTime = item.action_timestamp ? new Date(item.action_timestamp) : new Date();
  const isCompleted = item.status !== "PENDING" && item.status !== "UPCOMING";
  await client.query(
    `INSERT INTO task_logs (task_id, elder_id, completed, completed_at, logged_date)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ON CONSTRAINT uq_task_log_per_day
     DO UPDATE SET completed = EXCLUDED.completed, completed_at = EXCLUDED.completed_at`,
    [item.task_id, elderId, isCompleted, isCompleted ? actionTime : null, item.logged_date]
  );
};

export const syncMoodItem = async (client: PoolClient, elderId: string | number, item: any) => {
  const actionTime = item.action_timestamp ? new Date(item.action_timestamp) : new Date();
  await client.query(
    `INSERT INTO mood_logs (elder_id, mood_type, created_at, client_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (elder_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
    [elderId, item.mood_type, actionTime, item.client_id || null]
  );
};

export const syncEmergencyItem = async (client: PoolClient, elderId: string | number, item: any) => {
  const actionTime = item.action_timestamp ? new Date(item.action_timestamp) : new Date();
  const result = await client.query(
    `INSERT INTO emergency_logs (elder_id, triggered_phrase, device_location, latitude, longitude, status, created_at, client_id)
     VALUES ($1, $2, $3, $4, $5, 'Pending', $6, $7)
     ON CONFLICT (elder_id, client_id) WHERE client_id IS NOT NULL DO NOTHING
     RETURNING *`,
    [
      elderId,
      item.triggered_phrase || "Voice SOS Keyword",
      item.device_location || null,
      item.latitude || null,
      item.longitude || null,
      actionTime,
      item.client_id || null,
    ]
  );
  return result.rows[0];
};

export const syncJournalItem = async (client: PoolClient, elderId: string | number, item: any) => {
  const actionTime = item.action_timestamp ? new Date(item.action_timestamp) : new Date();
  await client.query(
    `INSERT INTO journal_entries (elder_id, title, content, mood_tag, audio_url, created_at, updated_at, client_id)
     VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
     ON CONFLICT (elder_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
    [elderId, item.title, item.content, item.mood_tag || null, item.audio_url || null, actionTime, item.client_id || null]
  );
};
