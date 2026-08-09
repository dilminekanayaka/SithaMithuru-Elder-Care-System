-- ─── Migration V9: Phase 14 Security & Compliance Audit ───────────────────
-- Purpose: Support multi-device sessions, implement soft deletes, 
-- create audit logs, and remove hazardous ON DELETE CASCADE constraints.
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Refresh Tokens (Multi-Device Support)
-- Drop existing refresh_tokens (which had a UNIQUE constraint on user_id)
-- Note: This logs all users out, which is required for a security update.
DROP TABLE IF EXISTS refresh_tokens;

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL DEFAULT 'unknown_device',
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_device UNIQUE (user_id, device_id)
);

-- 2. Soft Deletes (Right to Erasure & Data Retention)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE mood_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE task_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 3. Audit Logs (Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id), -- the actor
    action VARCHAR(50) NOT NULL, -- 'UPDATE_MEDICATION', 'DELETE_USER', etc.
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Remove ON DELETE CASCADE from existing tables
-- We drop the foreign keys and recreate them without CASCADE
ALTER TABLE guardian_elder_relationships DROP CONSTRAINT IF EXISTS guardian_elder_relationships_guardian_id_fkey;
ALTER TABLE guardian_elder_relationships ADD CONSTRAINT guardian_elder_relationships_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES users(id);

ALTER TABLE guardian_elder_relationships DROP CONSTRAINT IF EXISTS guardian_elder_relationships_elder_id_fkey;
ALTER TABLE guardian_elder_relationships ADD CONSTRAINT guardian_elder_relationships_elder_id_fkey FOREIGN KEY (elder_id) REFERENCES users(id);

ALTER TABLE medication_logs DROP CONSTRAINT IF EXISTS medication_logs_medication_id_fkey;
ALTER TABLE medication_logs ADD CONSTRAINT medication_logs_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES medications(id);

ALTER TABLE user_devices DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;
ALTER TABLE user_devices ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE _sync_queues DROP CONSTRAINT IF EXISTS _sync_queues_elder_id_fkey;
ALTER TABLE _sync_queues ADD CONSTRAINT _sync_queues_elder_id_fkey FOREIGN KEY (elder_id) REFERENCES users(id);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
