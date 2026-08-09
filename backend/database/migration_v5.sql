-- ─── Migration V5: Add fcm_token column for push notifications ─────────────────
-- This column stores the FCM device registration token for users (mostly guardians)
-- so the backend can transmit offline push notifications when an SOS is triggered.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;

RAISE NOTICE 'Added fcm_token column to users table';
