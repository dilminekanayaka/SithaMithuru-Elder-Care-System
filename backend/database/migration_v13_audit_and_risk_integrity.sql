-- ─── Migration V13: Audit Log Table & Risk Profile Integrity ────────────────
-- Purpose:
-- 1. `audit_logs` did not exist at all in the live database (two incompatible
--    shapes were defined across migration_v8/migration_v9, neither ever
--    applied here). emergencyController.ts's INSERTs into it were silently
--    swallowed by their own try/catch, but userController.deleteAccount and
--    medicationController.updateMedication/deleteMedication were NOT wrapped
--    — every call to those three endpoints threw an uncaught
--    "relation audit_logs does not exist" error and returned a 500 to the
--    client, even though the account/medication mutation had already
--    committed successfully. This creates the table using the shape
--    emergencyController.ts already expects (actor_id/entity_id/entity_type/
--    old_data/new_data); the other three call sites are updated in code to
--    match this same shape.
-- 2. risk_profiles had no unique constraint on elder_id, so riskEngine.ts's
--    `ON CONFLICT (elder_id) DO UPDATE` threw on every call, and risk-score
--    history was silently never persisted (swallowed by its own try/catch).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    entity_type VARCHAR(50),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_risk_profiles_elder'
  ) THEN
    ALTER TABLE risk_profiles ADD CONSTRAINT uq_risk_profiles_elder UNIQUE (elder_id);
  END IF;
END $$;
