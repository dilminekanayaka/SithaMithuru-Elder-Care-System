-- ─── Migration V11: Offline Sync Infrastructure ─────────────────────────────
-- Purpose: Add sync_queue table for server-side batch sync processing & offline audit trail.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL, -- 'MEDICATION', 'TASK', 'MOOD', 'EMERGENCY', 'JOURNAL'
    entity_id VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'RETRY')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_elder_status ON sync_queue(elder_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority, status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);
