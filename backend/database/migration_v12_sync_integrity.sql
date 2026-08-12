-- ─── Migration V12: Sync Integrity & Journal Column Fix ─────────────────────
-- Purpose:
-- 1. Fix journal_entries column mismatch: the live table was created with
--    `mood_ref`, but journalRepository.ts / syncController.ts / migration_v10
--    all read and write `mood_tag`, and the table is missing `audio_url` and
--    `deleted_at` entirely. This made every journal write (both the direct
--    POST /journal endpoint and the offline sync batch endpoint) fail with
--    "column mood_tag does not exist".
-- 2. Add a client-supplied idempotency key (client_id) + partial unique index
--    to emergency_logs, mood_logs, and journal_entries so that a retried
--    /api/sync/batch call (exponential backoff retry, dead-letter requeue,
--    duplicate network delivery) cannot insert the same offline record twice.
--    medication_logs / task_logs already have this via uq_med_log_per_day /
--    uq_task_log_per_day; these three tables had no equivalent protection.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal_entries' AND column_name='mood_ref')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal_entries' AND column_name='mood_tag') THEN
    ALTER TABLE journal_entries RENAME COLUMN mood_ref TO mood_tag;
  END IF;
END $$;

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS mood_tag VARCHAR(50);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS audio_url VARCHAR(512);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

ALTER TABLE emergency_logs ADD COLUMN IF NOT EXISTS client_id VARCHAR(100);
ALTER TABLE mood_logs ADD COLUMN IF NOT EXISTS client_id VARCHAR(100);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS client_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS uq_emergency_log_client ON emergency_logs(elder_id, client_id) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_mood_log_client ON mood_logs(elder_id, client_id) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_journal_entry_client ON journal_entries(elder_id, client_id) WHERE client_id IS NOT NULL;
