-- ─── Migration V6: Add columns for password reset tokens ────────────────────
-- Adds reset_token and reset_token_expires columns to the users table
-- to manage secure password recovery request limits and token verification.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

RAISE NOTICE 'Added password reset token columns to users table';
DO $$
BEGIN
  -- We just log in plain SQL blocks without raising in direct queries,
  -- but since this is inside a PL/pgSQL block, this notice works.
  RAISE NOTICE 'Migration v6 completed.';
END $$;
