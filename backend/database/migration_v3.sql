-- Migration v3: Add journal_entries table
-- Run this in pgAdmin Query Tool or via psql

CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    elder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    mood_ref VARCHAR(50),   -- Optional: link to a mood (Happy, Sad, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries by elder
CREATE INDEX IF NOT EXISTS idx_journal_elder_id ON journal_entries(elder_id);
CREATE INDEX IF NOT EXISTS idx_journal_created_at ON journal_entries(created_at DESC);

-- Add description column to daily_tasks (in case it's missing)
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS description TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_medications_elder_id ON medications(elder_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_elder_id ON daily_tasks(elder_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_elder_id ON mood_logs(elder_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_elder_date ON medication_logs(elder_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_task_logs_elder_date ON task_logs(elder_id, logged_date);
