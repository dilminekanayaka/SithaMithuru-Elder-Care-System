-- Migration Script: Update existing database schema to support Profile and other features
-- Run this in your pgAdmin Query Tool or via psql.

--------------------------------------------------------
-- 1. Update USERS table with new profile columns
--------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_guardian_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

--------------------------------------------------------
-- 2. Update GUARDIAN_ELDER table (if needed)
--------------------------------------------------------
ALTER TABLE guardian_elder ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Inactive'));
ALTER TABLE guardian_elder ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

--------------------------------------------------------
-- 3. Update EMERGENCY_LOGS table
--------------------------------------------------------
ALTER TABLE emergency_logs ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE emergency_logs ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
-- Ensure status has right constraints
ALTER TABLE emergency_logs DROP CONSTRAINT IF EXISTS emergency_logs_status_check;
ALTER TABLE emergency_logs ADD CONSTRAINT emergency_logs_status_check CHECK (status IN ('Pending', 'Resolved', 'False Alarm'));

--------------------------------------------------------
-- 4. Create NEW tables for Reminders and Tasks
--------------------------------------------------------

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    time_schedule TIME NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medication Adherence Log
CREATE TABLE IF NOT EXISTS medication_logs (
    id SERIAL PRIMARY KEY,
    medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    taken_status BOOLEAN DEFAULT FALSE,
    taken_at TIMESTAMP,
    logged_date DATE DEFAULT CURRENT_DATE
);

-- Daily Tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_time TIME,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task Completion Log
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES daily_tasks(id) ON DELETE CASCADE,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    logged_date DATE DEFAULT CURRENT_DATE
);

-- Mood Tracking
CREATE TABLE IF NOT EXISTS mood_logs (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mood_type VARCHAR(50) NOT NULL CHECK (mood_type IN ('Happy', 'Sad', 'Neutral', 'Angry', 'Anxious')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk Profile
CREATE TABLE IF NOT EXISTS risk_profiles (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    risk_level VARCHAR(20) DEFAULT 'Green' CHECK (risk_level IN ('Green', 'Yellow', 'Red')),
    reason TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
