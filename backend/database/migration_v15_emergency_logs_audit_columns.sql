-- Migration v15: Emergency Logs Audit Columns
-- ─────────────────────────────────────────────────────────────────────────────
-- FINDING: migration_v8_phase12_production_audit.sql defines cancelled_by_role
-- and resolution_notes on emergency_logs, but migration_v8 is never executed by
-- src/config/db.ts's connectDB() (only migration_v12/v13/v14 are). As a result
-- the live emergency_logs table never had these columns, and:
--   - emergencyController.resolveEmergency (Guardian resolves an SOS) and
--   - emergencyController.cancelSOS (Elder cancels their own SOS)
-- both UPDATE these columns on every call — meaning every real resolve/cancel
-- of an emergency alert has been throwing "column does not exist" and
-- returning a 500, for what is core SOS/emergency functionality.
-- Also affects reads: guardianController.getEmergencyLogs and
-- emergencyController.getElderEmergencyLogs both SELECT these columns.
--
-- This migration adds them (idempotently, safe to re-run) so emergency
-- resolve/cancel actually persists and both history endpoints work.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE emergency_logs
  ADD COLUMN IF NOT EXISTS cancelled_by_role VARCHAR(50),
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
