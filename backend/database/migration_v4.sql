-- ─── Migration V4: Add UNIQUE constraints to log tables ─────────────────────
-- This migration fixes the race condition in the delete-then-insert upsert
-- pattern. With these constraints, the controller can use a single atomic
-- INSERT ... ON CONFLICT DO UPDATE instead of two separate queries.
--
-- Run this ONCE on your database. It is safe to re-run (uses IF NOT EXISTS pattern).

-- ─── medication_logs ─────────────────────────────────────────────────────────
-- Ensure a medication can only be logged once per elder per day.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_med_log_per_day'
  ) THEN
    ALTER TABLE medication_logs
      ADD CONSTRAINT uq_med_log_per_day
      UNIQUE (medication_id, elder_id, logged_date);

    RAISE NOTICE 'Created constraint uq_med_log_per_day on medication_logs';
  ELSE
    RAISE NOTICE 'Constraint uq_med_log_per_day already exists, skipping.';
  END IF;
END $$;

-- ─── task_logs ───────────────────────────────────────────────────────────────
-- Ensure a task can only be logged once per elder per day.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_task_log_per_day'
  ) THEN
    ALTER TABLE task_logs
      ADD CONSTRAINT uq_task_log_per_day
      UNIQUE (task_id, elder_id, logged_date);

    RAISE NOTICE 'Created constraint uq_task_log_per_day on task_logs';
  ELSE
    RAISE NOTICE 'Constraint uq_task_log_per_day already exists, skipping.';
  END IF;
END $$;
