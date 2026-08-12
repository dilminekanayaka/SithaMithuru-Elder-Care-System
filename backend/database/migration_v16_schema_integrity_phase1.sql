-- Migration v16 — Database & Data Architecture (Master Plan Phase 1)
--
-- Verified against the LIVE database (not schema.sql, which is stale and
-- unreconciled — see prior audit findings) via direct information_schema
-- inspection before writing a single line of this file.
--
-- Fixes, in order:
--  1. Data-integrity repair: one real guardian-elder relationship was
--     stranded in the dead `guardian_elder` table (written before the B11
--     requestLink bug was fixed in code) and is invisible to every current
--     query, which all read `guardian_elder_relationships` instead. Migrate
--     it across before the table is dropped, or the relationship is lost.
--  2. Drop `guardian_elder` — confirmed dead: no controller/route references
--     it (grepped), and no boot-time migration recreates it.
--  3. Missing indexes on FK columns that are queried from the non-leading
--     side of an existing composite index (Postgres does not auto-index FK
--     columns; e.g. (guardian_id, elder_id) does not serve an elder_id-only
--     lookup).
--  4. UNIQUE constraint on users.phone_number — the app allows login by
--     phone OR email; nothing currently stops two accounts sharing a phone
--     number, which would make phone-login ambiguous. Verified zero live
--     duplicates before adding. Multiple NULLs remain allowed (Postgres
--     UNIQUE treats NULL <> NULL).
--  5. CHECK constraint on guardian_elder_relationships.status — the only
--     two values any code path ever sets are ACTIVE/INACTIVE (verified by
--     reading connectionController.ts/guardianController.ts).
--  6. New `emergency_contacts` table — Elder/EmergencyContactsScreen
--     currently has nowhere real to persist to (confirmed via audit: the
--     screen is local-state-only with hardcoded placeholder numbers). This
--     migration only builds the table; wiring the screen to it is a
--     separate, later phase (UI depends on schema, not the other way
--     around).
--  7. `notifications.related_type`/`related_id` — additive, nullable
--     columns so a future real notification write can reference its source
--     entity (an emergency log, a medication, etc.), matching the shape the
--     existing on-the-fly synthesis in notificationController.ts already
--     fakes with synthetic ids like `sos-${id}`.

BEGIN;

-- 1. Rescue the orphaned relationship before the table it lives in is dropped.
-- Guarded on to_regclass so this is a no-op once `guardian_elder` no longer
-- exists (an unreached statement inside a PL/pgSQL IF is never planned, so
-- referencing a table that may already be gone is safe here).
DO $$
BEGIN
  IF to_regclass('public.guardian_elder') IS NOT NULL THEN
    INSERT INTO guardian_elder_relationships (guardian_id, elder_id, relationship_type, permission_level, status, connected_at)
    SELECT ge.guardian_id, ge.elder_id, 'Other', 'Primary', 'ACTIVE', ge.created_at
    FROM guardian_elder ge
    WHERE NOT EXISTS (
      SELECT 1 FROM guardian_elder_relationships ger
      WHERE ger.guardian_id = ge.guardian_id AND ger.elder_id = ge.elder_id
    );
  END IF;
END $$;

-- 2. Drop the dead, superseded table (already gone as of this run — see
-- above; kept for anyone applying this migration against an older DB).
DROP TABLE IF EXISTS guardian_elder;

-- 3. Missing indexes.
CREATE INDEX IF NOT EXISTS idx_guardian_elder_relationships_elder_id ON guardian_elder_relationships(elder_id);
CREATE INDEX IF NOT EXISTS idx_pending_connections_to_user ON pending_connections(to_user);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_elder_id ON emergency_logs(elder_id);
CREATE INDEX IF NOT EXISTS idx_elder_invitations_guardian_id ON elder_invitations(guardian_id);
CREATE INDEX IF NOT EXISTS idx_users_primary_guardian_id ON users(primary_guardian_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_user_id ON connection_logs(user_id);

-- 4. Prevent duplicate phone numbers.
-- Plain ADD CONSTRAINT has no IF NOT EXISTS in Postgres, and this file is
-- re-run on every server boot like its siblings — guard idempotently so a
-- second run doesn't abort the whole transaction.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_phone_number'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT uq_users_phone_number UNIQUE (phone_number);
  END IF;
END $$;

-- 5. Constrain relationship status to its two real values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guardian_elder_relationships_status_check'
  ) THEN
    ALTER TABLE guardian_elder_relationships
      ADD CONSTRAINT guardian_elder_relationships_status_check
      CHECK (status IN ('ACTIVE', 'INACTIVE'));
  END IF;
END $$;

-- 6. Emergency contacts — real persistence target for a future UI-wiring phase.
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  elder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  relationship VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_elder_id ON emergency_contacts(elder_id);

-- 7. Notification source-entity linkage (additive, nullable — no backfill needed).
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id INTEGER;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────
-- Deliberately NOT done in this migration (documented, not silently skipped):
--
-- `invitations` (generic token-based, used by ConnectScreen.tsx) and
-- `elder_invitations` (6-char QR-code-based, used by AddElderScreen.tsx /
-- ScanGuardianQrScreen.tsx) are two separate, real, independently-working
-- invite systems (8 and 10 live rows respectively at time of writing) — see
-- Section A/B16 of the master plan. Consolidating them requires controller
-- changes on both ends and risks breaking a working feature; that's a
-- product decision for a dedicated phase, not a schema-only fix.
-- ─────────────────────────────────────────────────────────────────────────
