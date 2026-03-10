-- Database: sithamithuru
-- Run this script in your pgAdmin or via psql command line tool.

-- 1. Create Users table (for Elders and Guardians)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Elder', 'Guardian')),
    avatar_url TEXT,
    age INTEGER,
    blood_type VARCHAR(10),
    weight DECIMAL(5,2),
    primary_guardian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create table to link Guardian and Elder
CREATE TABLE IF NOT EXISTS guardian_elder (
    guardian_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guardian_id, elder_id)
);

-- 3. Create Emergency Logs table (Critical for real-time safety)
CREATE TABLE IF NOT EXISTS emergency_logs (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_location VARCHAR(255),
    triggered_phrase VARCHAR(255), -- "Help me", etc.
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Resolved', 'False Alarm')),
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Guardian who resolved it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 4. Create Medication Prescriptions / Reminders table (Synced to mobile SQLite)
CREATE TABLE IF NOT EXISTS medications (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100), -- "2 pills"
    time_schedule TIME NOT NULL, -- e.g. "08:00"
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Guardian who created it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Medication Adherence Log (For Guardian to monitor whether Elder took it)
CREATE TABLE IF NOT EXISTS medication_logs (
    id SERIAL PRIMARY KEY,
    medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    taken_status BOOLEAN DEFAULT FALSE,
    taken_at TIMESTAMP,
    logged_date DATE DEFAULT CURRENT_DATE
);

-- 6. Create Daily Tasks table (e.g., "Drink water", "Call doctor")
CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_time TIME,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Task Completion Log
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES daily_tasks(id) ON DELETE CASCADE,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    logged_date DATE DEFAULT CURRENT_DATE
);

-- 8. Create Mood Tracking / Behavior Logs
CREATE TABLE IF NOT EXISTS mood_logs (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mood_type VARCHAR(50) NOT NULL CHECK (mood_type IN ('Happy', 'Sad', 'Neutral', 'Angry', 'Anxious')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create Analytics / Risk Profile Logs (For AI/Algorithm context monitoring)
CREATE TABLE IF NOT EXISTS risk_profiles (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    risk_level VARCHAR(20) DEFAULT 'Green' CHECK (risk_level IN ('Green', 'Yellow', 'Red')),
    reason TEXT, -- "Missed meds 3 days in a row"
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
