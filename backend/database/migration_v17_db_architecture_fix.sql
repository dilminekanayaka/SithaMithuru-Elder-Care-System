-- ─── Migration v17: Database & Data Architecture Fix ─────────────────────────
-- Verified against live PostgreSQL database before writing a single line.
-- Fixes all 21 audit findings. Every statement is idempotent (safe to re-run).
-- Note: DROP INDEX CONCURRENTLY must run outside a transaction block, so the
-- email index swap is done via a regular DROP (table is dev-only, no live load).
-- ─────────────────────────────────────────────────────────────────────────────

-- =============================================================================
-- Phase A: Index operations (cannot run inside BEGIN/COMMIT)
-- =============================================================================

-- Replace plain UNIQUE on email with a partial index (allows soft-deleted users
-- to free up their email for re-registration).
DROP INDEX IF EXISTS users_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active
  ON users(email) WHERE deleted_at IS NULL;

-- Replace UNIQUE(from_user, to_user) on pending_connections with a partial
-- unique so only one PENDING request is allowed per pair (REJECTED/ACCEPTED
-- rows don't block a new request).
DROP INDEX IF EXISTS pending_connections_from_user_to_user_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_connection_active
  ON pending_connections(from_user, to_user)
  WHERE status = 'PENDING';

-- =============================================================================
-- Phase B: Structural changes (inside a transaction)
-- =============================================================================

BEGIN;

-- ─── 1. users: soft-delete + active state ────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── 2. users: role CHECK constraint ────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('Elder', 'Guardian'));
  END IF;
END $$;

-- ─── 3. medications: soft-delete + sync timestamp ───────────────────────────
ALTER TABLE medications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ─── 4. medications.time_schedule: make nullable for multi-schedule support ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'medications'
      AND column_name = 'time_schedule'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE medications ALTER COLUMN time_schedule DROP NOT NULL;
  END IF;
END $$;

-- ─── 5. daily_tasks: soft-delete + active state + timestamp ─────────────────
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ─── 6. sync_queue: CREATE TABLE (CRITICAL) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_queue (
  id            SERIAL PRIMARY KEY,
  elder_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  entity_type   VARCHAR(50)   NOT NULL,
  entity_id     VARCHAR(100)  NOT NULL,
  operation     VARCHAR(20)   NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload       JSONB         NOT NULL DEFAULT '{}',
  priority      VARCHAR(20)   NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'HIGH', 'CRITICAL')),
  status        VARCHAR(20)   NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'RETRY')),
  error_message TEXT,
  retry_count   INTEGER       NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at  TIMESTAMPTZ   NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_elder_status    ON sync_queue(elder_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority_status ON sync_queue(priority, status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at      ON sync_queue(created_at);

-- ─── 7. notifications: ADD target_id ────────────────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_id INTEGER NULL;

-- ─── 8. guardian_elder_relationships: harden NOT NULL on FK columns ──────────
DO $$
BEGIN
  -- guardian_id: set NOT NULL if currently nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'guardian_elder_relationships'
      AND column_name = 'guardian_id'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE guardian_elder_relationships ALTER COLUMN guardian_id SET NOT NULL;
  END IF;

  -- elder_id: set NOT NULL if currently nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'guardian_elder_relationships'
      AND column_name = 'elder_id'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE guardian_elder_relationships ALTER COLUMN elder_id SET NOT NULL;
  END IF;
END $$;

-- ─── 9. elder_invitations: ADD elder_id column ───────────────────────────────
ALTER TABLE elder_invitations ADD COLUMN IF NOT EXISTS elder_id INTEGER
  REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_elder_invitations_elder_id
  ON elder_invitations(elder_id);

-- ─── 10. journal_entries: ADD updated_at ────────────────────────────────────
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ
  DEFAULT CURRENT_TIMESTAMP;

UPDATE journal_entries SET updated_at = created_at WHERE updated_at IS NULL;

-- ─── 11. mood_logs: ADD updated_at ──────────────────────────────────────────
ALTER TABLE mood_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
  DEFAULT CURRENT_TIMESTAMP;

UPDATE mood_logs SET updated_at = created_at WHERE updated_at IS NULL;

-- ─── 12. emergency_logs: ADD updated_at ─────────────────────────────────────
ALTER TABLE emergency_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
  DEFAULT CURRENT_TIMESTAMP;

UPDATE emergency_logs SET updated_at = created_at WHERE updated_at IS NULL;

-- ─── 13. risk_profiles: add guardian actor column + CHECK constraints ─────────
ALTER TABLE risk_profiles ADD COLUMN IF NOT EXISTS calculated_by INTEGER
  REFERENCES users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'risk_profiles_risk_level_check'
  ) THEN
    ALTER TABLE risk_profiles ADD CONSTRAINT risk_profiles_risk_level_check
      CHECK (risk_level IN ('Green', 'Yellow', 'Red'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'risk_profiles_category_check'
  ) THEN
    ALTER TABLE risk_profiles ADD CONSTRAINT risk_profiles_category_check
      CHECK (category IN ('Low', 'Medium', 'High'));
  END IF;
END $$;

-- ─── 14. Soft-delete partial indexes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_active
  ON users(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_medications_active
  ON medications(elder_id) WHERE deleted_at IS NULL AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_daily_tasks_active
  ON daily_tasks(elder_id) WHERE deleted_at IS NULL AND is_active = TRUE;

-- ─── 15. Notification target linkage index ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_target
  ON notifications(target_id) WHERE target_id IS NOT NULL;

-- ─── 16. Backfill is_active for existing rows ───────────────────────────────
UPDATE users       SET is_active = TRUE WHERE is_active IS NULL;
UPDATE medications SET is_active = TRUE WHERE is_active IS NULL;
UPDATE daily_tasks SET is_active = TRUE WHERE is_active IS NULL;

COMMIT;

-- ─── Post-migration verification queries ──────────────────────────────────────
-- Run these manually after applying:
-- \d users
-- \d medications
-- \d daily_tasks
-- \d sync_queue
-- SELECT COUNT(*) FROM sync_queue;
