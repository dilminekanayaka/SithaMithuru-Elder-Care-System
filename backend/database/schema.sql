-- Database: sithamithuru
-- SithaMithuru Elder Care System — Production PostgreSQL Schema (Phase 12 UUID Architecture)
-- Run this script in your pgAdmin or via psql command line tool.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Users table (for Elders and Guardians)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Elder', 'Guardian')),
    avatar_url TEXT,
    age INTEGER,
    blood_type VARCHAR(10),
    weight DECIMAL(5,2),
    primary_guardian_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create table to link Guardian and Elder (Normalized with is_primary flag)
CREATE TABLE IF NOT EXISTS guardian_elder (
    guardian_id UUID REFERENCES users(id) ON DELETE CASCADE,
    elder_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guardian_id, elder_id)
);

-- 3. Create Emergency Logs table (Critical for real-time safety & Audit Trail)
CREATE TABLE IF NOT EXISTS emergency_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES users(id), -- Soft delete compliance: NO CASCADE
    device_location VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    maps_url VARCHAR(500),
    triggered_phrase VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Resolved', 'False Alarm')),
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    cancelled_by_role VARCHAR(50), -- "Elder" or "Guardian"
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 4. Create Medication Prescriptions (Synced to mobile SQLite)
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES users(id), -- NO CASCADE
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    form VARCHAR(50) DEFAULT 'PILL',
    strength VARCHAR(100),
    instructions VARCHAR(255),
    schedule_type VARCHAR(50) DEFAULT 'DAILY',
    schedule_values JSONB DEFAULT '[]'::jsonb,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    category VARCHAR(100) DEFAULT 'General',
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4a. Create Medication Schedules (1:M Relationship for PRN and Intervals)
CREATE TABLE IF NOT EXISTS medication_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_time TIME NOT NULL
);

-- 5. Create Medication Adherence Log (Idempotent Compound Constraint)
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID REFERENCES medications(id), -- NO CASCADE
    elder_id UUID REFERENCES users(id), -- NO CASCADE
    taken_status BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'PENDING',
    taken_at TIMESTAMP,
    action_time TIMESTAMP,
    scheduled_time VARCHAR(10),
    logged_date DATE DEFAULT CURRENT_DATE,
    CONSTRAINT uq_med_log_per_day UNIQUE(medication_id, elder_id, logged_date, scheduled_time)
);

-- 6. Create Daily Tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES users(id), -- NO CASCADE
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Task Completion Log (Idempotent Compound Constraint)
CREATE TABLE IF NOT EXISTS task_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES daily_tasks(id), -- NO CASCADE
    elder_id UUID REFERENCES users(id), -- NO CASCADE
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    logged_date DATE DEFAULT CURRENT_DATE,
    CONSTRAINT uq_task_log_per_day UNIQUE(task_id, elder_id, logged_date)
);

-- 8. Create Mood Tracking / Behavior Logs
CREATE TABLE IF NOT EXISTS mood_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES users(id), -- NO CASCADE
    mood_type VARCHAR(50) NOT NULL CHECK (mood_type IN ('Happy', 'Sad', 'Neutral', 'Angry', 'Anxious')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create Analytics / Risk Profile Logs
CREATE TABLE IF NOT EXISTS risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES users(id), -- NO CASCADE
    risk_level VARCHAR(20) DEFAULT 'Green' CHECK (risk_level IN ('Green', 'Yellow', 'Red')),
    reason TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create User Devices Table (1:M Push Notification Device Mapping)
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fcm_token VARCHAR(255) UNIQUE NOT NULL,
    device_model VARCHAR(100),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create Invitations Table (Secure Guardian Connection Code Tracking)
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Create Immutable Audit Logs Table (Medical & Safety Change History)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_id UUID,
    entity_type VARCHAR(50),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Create Persistent Mobile Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. B-Tree Indexes on Foreign Keys and Chronological Search Targets
CREATE INDEX IF NOT EXISTS idx_medications_elder_id ON medications(elder_id);
CREATE INDEX IF NOT EXISTS idx_med_schedules_med_id ON medication_schedules(medication_id);
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
