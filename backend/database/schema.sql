-- ============================================================
-- SithaMithuru Elder Care System — Canonical PostgreSQL Schema
-- Reflects LIVE database state as of migration v17.
-- Run: psql -U postgres -d sithamithuru -f schema.sql
-- (Only for fresh installs — migrations handle live upgrades)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  phone_number        VARCHAR(20)  UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  role                VARCHAR(50)  NOT NULL CHECK (role IN ('Elder', 'Guardian')),
  avatar_url          TEXT,
  age                 INTEGER,
  blood_type          VARCHAR(10),
  weight              DECIMAL(5,2),
  primary_guardian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  fcm_token           TEXT,
  reset_token         VARCHAR(255),
  reset_token_expires TIMESTAMP,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at          TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active
  ON users(email) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_primary_guardian ON users(primary_guardian_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE deleted_at IS NULL;

-- ─── 2. guardian_elder_relationships ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS guardian_elder_relationships (
  id                SERIAL PRIMARY KEY,
  guardian_id       INTEGER NOT NULL REFERENCES users(id),
  elder_id          INTEGER NOT NULL REFERENCES users(id),
  relationship_type VARCHAR(100) NOT NULL,
  permission_level  VARCHAR(50)  NOT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  connected_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (guardian_id, elder_id)
);

CREATE INDEX IF NOT EXISTS idx_guardian_elder_relationships_elder_id
  ON guardian_elder_relationships(elder_id);

-- ─── 3. pending_connections ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_connections (
  id                SERIAL PRIMARY KEY,
  from_user         INTEGER REFERENCES users(id),
  to_user           INTEGER REFERENCES users(id),
  relationship_type VARCHAR(100) NOT NULL,
  permission_level  VARCHAR(50)  NOT NULL,
  status            VARCHAR(20)  DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Only one PENDING request allowed between a pair; accepted/rejected rows
-- don't block a new request after the previous one was resolved.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_connection_active
  ON pending_connections(from_user, to_user)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_pending_connections_to_user ON pending_connections(to_user);

-- ─── 4. invitations (token-based, ConnectScreen flow) ──────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id         SERIAL PRIMARY KEY,
  token      VARCHAR(255) NOT NULL UNIQUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  role       VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP   NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  status     VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitations_token    ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_created_by ON invitations(created_by);

-- ─── 5. elder_invitations (QR/6-char-code-based, AddElderScreen flow) ──────
CREATE TABLE IF NOT EXISTS elder_invitations (
  id          SERIAL PRIMARY KEY,
  guardian_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  elder_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  invite_code VARCHAR(10) NOT NULL,
  status      VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_elder_invitations_guardian_id ON elder_invitations(guardian_id);
CREATE INDEX IF NOT EXISTS idx_elder_invitations_elder_id    ON elder_invitations(elder_id);

-- ─── 6. connection_logs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connection_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,
  details    TEXT,
  ip_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_connection_logs_user_id ON connection_logs(user_id);

-- ─── 7. refresh_tokens ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  device_id  VARCHAR(255) NOT NULL DEFAULT 'unknown_device',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_device UNIQUE (user_id, device_id)
);

-- ─── 8. user_devices ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_devices (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_id       VARCHAR(100) NOT NULL,
  device_name     VARCHAR(100),
  android_version VARCHAR(50),
  fcm_token       TEXT,
  last_login      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);

-- ─── 9. medications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
  id              SERIAL PRIMARY KEY,
  elder_id        INTEGER REFERENCES users(id),
  name            VARCHAR(255) NOT NULL,
  dosage          VARCHAR(100),
  time_schedule   TIME,                          -- nullable: multi-schedule meds use times JSONB
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  form            VARCHAR(50)   DEFAULT 'PILL',
  strength        VARCHAR(100),
  instructions    VARCHAR(255),
  schedule_type   VARCHAR(50)   DEFAULT 'DAILY',
  schedule_values JSONB         DEFAULT '[]',
  times           JSONB         DEFAULT '[]',    -- array of "HH:MM" strings
  start_date      DATE          DEFAULT CURRENT_DATE,
  end_date        DATE,
  category        VARCHAR(100)  DEFAULT 'General',
  is_active       BOOLEAN       DEFAULT TRUE,
  deleted_at      TIMESTAMP     NULL,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medications_elder_id ON medications(elder_id);
CREATE INDEX IF NOT EXISTS idx_medications_active
  ON medications(elder_id) WHERE deleted_at IS NULL AND is_active = TRUE;

-- ─── 10. medication_logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medication_logs (
  id             SERIAL PRIMARY KEY,
  medication_id  INTEGER REFERENCES medications(id),
  elder_id       INTEGER REFERENCES users(id),
  taken_status   BOOLEAN DEFAULT FALSE,
  status         VARCHAR(50) DEFAULT 'PENDING',
  taken_at       TIMESTAMP,
  action_time    TIMESTAMP,
  scheduled_time VARCHAR(10),
  logged_date    DATE DEFAULT CURRENT_DATE,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_med_log_per_day UNIQUE (medication_id, elder_id, logged_date)
);

CREATE INDEX IF NOT EXISTS idx_medication_logs_elder_date ON medication_logs(elder_id, logged_date);

-- ─── 11. daily_tasks ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_tasks (
  id          SERIAL PRIMARY KEY,
  elder_id    INTEGER REFERENCES users(id),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  due_time    TIME,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_active   BOOLEAN   NOT NULL DEFAULT TRUE,
  deleted_at  TIMESTAMP NULL,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_elder_id ON daily_tasks(elder_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_active
  ON daily_tasks(elder_id) WHERE deleted_at IS NULL AND is_active = TRUE;

-- ─── 12. task_logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_logs (
  id           SERIAL PRIMARY KEY,
  task_id      INTEGER REFERENCES daily_tasks(id),
  elder_id     INTEGER REFERENCES users(id),
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  logged_date  DATE DEFAULT CURRENT_DATE,
  CONSTRAINT uq_task_log_per_day UNIQUE (task_id, elder_id, logged_date)
);

CREATE INDEX IF NOT EXISTS idx_task_logs_elder_date ON task_logs(elder_id, logged_date);

-- ─── 13. mood_logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_logs (
  id         SERIAL PRIMARY KEY,
  elder_id   INTEGER REFERENCES users(id),
  mood_type  VARCHAR(50) NOT NULL CHECK (mood_type IN ('Happy', 'Sad', 'Neutral', 'Angry', 'Anxious')),
  notes      TEXT,
  client_id  VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mood_log_client
  ON mood_logs(elder_id, client_id) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mood_logs_elder_id ON mood_logs(elder_id);

-- ─── 14. journal_entries ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id         SERIAL PRIMARY KEY,
  elder_id   INTEGER REFERENCES users(id),
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  mood_tag   VARCHAR(50),
  audio_url  VARCHAR(512),
  client_id  VARCHAR(100),
  deleted_at TIMESTAMP NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_journal_entry_client
  ON journal_entries(elder_id, client_id) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_journal_elder_id    ON journal_entries(elder_id);
CREATE INDEX IF NOT EXISTS idx_journal_created_at  ON journal_entries(created_at DESC);

-- ─── 15. emergency_logs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_logs (
  id                  SERIAL PRIMARY KEY,
  elder_id            INTEGER REFERENCES users(id),
  device_location     VARCHAR(255),
  triggered_phrase    VARCHAR(255),
  status              VARCHAR(50) DEFAULT 'Pending'
                      CHECK (status IN ('Pending', 'Resolved', 'False Alarm')),
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  maps_url            VARCHAR(500),
  resolution_reason   VARCHAR(255),
  resolved_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolved_by_name    VARCHAR(255),
  cancelled_by_role   VARCHAR(50),
  resolution_notes    TEXT,
  triggered_by_model  VARCHAR(100),
  audio_snr_db        DOUBLE PRECISION,
  confidence_score    DOUBLE PRECISION,
  client_id           VARCHAR(100),
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at         TIMESTAMP,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_emergency_log_client
  ON emergency_logs(elder_id, client_id) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_emergency_logs_elder_id ON emergency_logs(elder_id);

-- ─── 16. emergency_contacts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id            SERIAL PRIMARY KEY,
  elder_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  phone_number  VARCHAR(20)  NOT NULL,
  relationship  VARCHAR(100),
  is_primary    BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_elder_id ON emergency_contacts(elder_id);

-- ─── 17. notifications ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  message      TEXT NOT NULL,
  type         VARCHAR(50) DEFAULT 'GENERAL',
  is_read      BOOLEAN DEFAULT FALSE,
  related_type VARCHAR(50),
  related_id   INTEGER,
  target_id    INTEGER,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_target
  ON notifications(target_id) WHERE target_id IS NOT NULL;

-- ─── 18. risk_profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risk_profiles (
  id            SERIAL PRIMARY KEY,
  elder_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  risk_level    VARCHAR(20) DEFAULT 'Green' CHECK (risk_level IN ('Green', 'Yellow', 'Red')),
  category      VARCHAR(20) DEFAULT 'Low'   CHECK (category IN ('Low', 'Medium', 'High')),
  score         INTEGER DEFAULT 0,
  reason        TEXT,
  factors       JSONB,
  calculated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_risk_profiles_elder UNIQUE (elder_id)
);

-- ─── 19. sync_queue ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_queue (
  id            SERIAL PRIMARY KEY,
  elder_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  entity_type   VARCHAR(50)  NOT NULL,
  entity_id     VARCHAR(100) NOT NULL,
  operation     VARCHAR(20)  NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload       JSONB        NOT NULL DEFAULT '{}',
  priority      VARCHAR(20)  NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'HIGH', 'CRITICAL')),
  status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'RETRY')),
  error_message TEXT,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at  TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_elder_status     ON sync_queue(elder_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority_status  ON sync_queue(priority, status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at       ON sync_queue(created_at);

-- ─── 20. audit_logs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  actor_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_id   INTEGER,
  entity_type VARCHAR(50),
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor  ON audit_logs(actor_id);
