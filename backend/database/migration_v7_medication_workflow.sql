-- ─── Migration V7: Medication Workflow Clinical Enhancements ────────────────
-- Adds clinical schema columns to medications and medication_logs for:
-- • Structured dosage form, strength, instructions, and categories
-- • Clinical repeating schedules, multiple daily reminder times, start/end dates
-- • Soft-delete (is_active) to preserve adherence history
-- • Detailed medication log status enum (TAKEN, SKIPPED, MISSED, PENDING) and timestamps

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS form VARCHAR(50) DEFAULT 'PILL',
  ADD COLUMN IF NOT EXISTS strength VARCHAR(100),
  ADD COLUMN IF NOT EXISTS instructions VARCHAR(255),
  ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(50) DEFAULT 'DAILY',
  ADD COLUMN IF NOT EXISTS schedule_values JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS times JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE medication_logs
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS action_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS scheduled_time VARCHAR(10);

RAISE NOTICE 'Medication workflow schema migration v7 completed successfully.';
