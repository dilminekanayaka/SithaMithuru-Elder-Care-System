-- Migration v14: Persistent Notifications Table
-- ─────────────────────────────────────────────────────────────────────────────
-- FINDING: migration_v8_phase12_production_audit.sql defines a `notifications`
-- table, but migration_v8 is never executed by src/config/db.ts's connectDB()
-- (only migration_v12/v13 are read from disk and run on boot). As a result the
-- live database has never actually had this table, and
-- guardianController.getGuardianNotifications / markGuardianNotificationRead
-- would throw "relation notifications does not exist" on every call, caught by
-- their try/catch and surfaced to the guardian app as a generic 500 error.
--
-- This migration creates the real table (idempotently, safe to re-run) so the
-- Guardian Notifications screen — wired to these endpoints — actually works.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
