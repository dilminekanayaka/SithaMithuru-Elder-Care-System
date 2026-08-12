-- ─── Migration V10: Journal Sync Schema ───────────────────────────────────────
-- Purpose: Add journal_entries table to support offline journal recording & backend synchronization.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    mood_tag VARCHAR(50),
    audio_url VARCHAR(512),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_elder_id ON journal_entries(elder_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(elder_id, created_at);
