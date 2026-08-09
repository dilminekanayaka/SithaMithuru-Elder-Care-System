-- ─── Migration V8: Phase 12 Production Database Audit Remediation ──────────────
-- Implements:
-- • Soft-Delete & Medical Data Retention (deleted_at, is_active)
-- • B-Tree Indexing across all Foreign Keys & Chronological Search Targets
-- • Compound Unique Constraints (uq_med_log_per_day, uq_task_log_per_day)
-- • Relationship Normalization (is_primary on guardian_elder junction table)
-- • Emergency Audit Trail (cancelled_by_role, resolution_notes)
-- • New Core Tables: user_devices, invitations, audit_logs, notifications

-- 1. Add Soft-Delete & Active State Columns to Core Entities
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE daily_tasks
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Normalize Guardian-Elder Relationship Hierarchy
ALTER TABLE guardian_elder
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- 3. Add Emergency SOS Resolution Audit Columns
ALTER TABLE emergency_logs
  ADD COLUMN IF NOT EXISTS cancelled_by_role VARCHAR(50),
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- 4. Create User Devices Table (1:M Push Notification Device Mapping)
CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    fcm_token VARCHAR(255) UNIQUE NOT NULL,
    device_model VARCHAR(100),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Invitations Table (Secure Guardian Connection Code Tracking)
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Immutable Audit Logs Table (Medical & Safety Change History)
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

-- 7. Create Persistent Mobile Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Enforce Compound Unique Constraints for Idempotency
ALTER TABLE medication_logs DROP CONSTRAINT IF EXISTS uq_med_log_per_day;
ALTER TABLE medication_logs ADD CONSTRAINT uq_med_log_per_day UNIQUE(medication_id, elder_id, logged_date);

ALTER TABLE task_logs DROP CONSTRAINT IF EXISTS uq_task_log_per_day;
ALTER TABLE task_logs ADD CONSTRAINT uq_task_log_per_day UNIQUE(task_id, elder_id, logged_date);

-- 9. Add B-Tree Indexes on Foreign Keys and Chronological Search Columns
CREATE INDEX IF NOT EXISTS idx_medications_elder_id ON medications(elder_id);
CREATE INDEX IF NOT EXISTS idx_med_logs_med_id ON medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_med_logs_elder_id ON medication_logs(elder_id);
CREATE INDEX IF NOT EXISTS idx_med_logs_elder_date ON medication_logs(elder_id, logged_date);

CREATE INDEX IF NOT EXISTS idx_tasks_elder_id ON daily_tasks(elder_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_elder_id ON task_logs(elder_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_elder_date ON task_logs(elder_id, logged_date);

CREATE INDEX IF NOT EXISTS idx_emergency_elder_id ON emergency_logs(elder_id);
CREATE INDEX IF NOT EXISTS idx_emergency_elder_status ON emergency_logs(elder_id, status);

CREATE INDEX IF NOT EXISTS idx_mood_elder_id ON mood_logs(elder_id);
CREATE INDEX IF NOT EXISTS idx_mood_elder_date ON mood_logs(elder_id, created_at);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_elder_id ON invitations(elder_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
