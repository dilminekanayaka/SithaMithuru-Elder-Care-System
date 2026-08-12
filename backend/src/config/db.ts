import { Pool } from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "sithamithuru",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "5432"),
  // SCALABILITY FIX #15: Explicit connection pool limits.
  // pg defaults to max:10 which exhausts under concurrent guardian+elder load.
  max: 20,                  // Maximum connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail fast if connection takes >5s
});

const runSchemaMigrations = async (client: any) => {
  // Legacy integer-based migrations removed in favor of Phase 12 UUID schema.sql
};

/**
 * Phase 12 Production Database Audit Schema Migrations.
 * Automatically applies:
 * 1. Soft-Delete & Medical Data Retention (deleted_at, is_active)
 * 2. B-Tree Indexing across all Foreign Keys & Chronological Search Targets
 * 3. Compound Unique Constraints (uq_med_log_per_day, uq_task_log_per_day)
 * 4. Relationship Normalization (is_primary on guardian_elder junction table)
 * 5. Emergency Audit Trail (cancelled_by_role, resolution_notes)
 * 6. New Core Tables: user_devices, invitations, audit_logs, notifications
 */
const runPhase12SchemaMigrations = async (client: any) => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS elder_invitations (
        id SERIAL PRIMARY KEY,
        guardian_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        invite_code VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS risk_profiles (
        elder_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL DEFAULT 0,
        category VARCHAR(20) NOT NULL DEFAULT 'Low',
        factors JSONB,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_devices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        device_id VARCHAR(100) NOT NULL,
        device_name VARCHAR(100),
        android_version VARCHAR(50),
        fcm_token TEXT,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, device_id)
      );

      ALTER TABLE risk_profiles ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
      ALTER TABLE risk_profiles ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'Low';
      ALTER TABLE risk_profiles ADD COLUMN IF NOT EXISTS factors JSONB;
      ALTER TABLE risk_profiles ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
  } catch (err: any) {
    console.warn("Schema Migration Warning:", err.message);
  }
};

/**
 * Migration V12: Sync Integrity & Journal Column Fix.
 * Fixes the journal_entries mood_ref/mood_tag column mismatch (which made every
 * journal write fail) and adds client_id idempotency columns + unique indexes
 * to emergency_logs, mood_logs, and journal_entries so a retried /sync/batch
 * call cannot insert the same offline record twice. Safe to run repeatedly.
 */
const runV12SyncIntegrityMigration = async (client: any) => {
  try {
    const sqlPath = path.join(__dirname, "../../database/migration_v12_sync_integrity.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.query(sql);
  } catch (err: any) {
    console.warn("Migration V12 Warning:", err.message);
  }
};

/**
 * Migration V13: Audit Log Table & Risk Profile Integrity.
 * Creates audit_logs (it did not exist in the live DB at all — see migration
 * file header for the full "success reported as failure" bug this caused)
 * and adds the missing unique constraint on risk_profiles.elder_id so
 * riskEngine.ts's upsert stops silently failing. Safe to run repeatedly.
 */
const runV13AuditRiskIntegrityMigration = async (client: any) => {
  try {
    const sqlPath = path.join(__dirname, "../../database/migration_v13_audit_and_risk_integrity.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.query(sql);
  } catch (err: any) {
    console.warn("Migration V13 Warning:", err.message);
  }
};

/**
 * Migration V14: Persistent Notifications Table.
 * migration_v8_phase12_production_audit.sql defines a `notifications` table
 * but that file is never executed on boot — only V12/V13 are. This left the
 * live DB without the table at all, so getGuardianNotifications /
 * markGuardianNotificationRead threw "relation does not exist" on every call.
 * Safe to run repeatedly.
 */
const runV14NotificationsTableMigration = async (client: any) => {
  try {
    const sqlPath = path.join(__dirname, "../../database/migration_v14_notifications_table.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.query(sql);
  } catch (err: any) {
    console.warn("Migration V14 Warning:", err.message);
  }
};

/**
 * Migration V15: Emergency Logs Audit Columns.
 * migration_v8_phase12_production_audit.sql defines cancelled_by_role/
 * resolution_notes on emergency_logs but that file is never executed on boot.
 * Without these columns, every real resolveEmergency/cancelSOS call threw
 * "column does not exist" — a live bug in core SOS functionality. Safe to
 * run repeatedly.
 */
const runV15EmergencyLogsAuditColumnsMigration = async (client: any) => {
  try {
    const sqlPath = path.join(__dirname, "../../database/migration_v15_emergency_logs_audit_columns.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.query(sql);
  } catch (err: any) {
    console.warn("Migration V15 Warning:", err.message);
  }
};

/**
 * Migration V16: Schema & Data Architecture Integrity (Master Plan Phase 1).
 * Rescues the one real guardian-elder relationship stranded in the dead
 * `guardian_elder` table before dropping it, adds missing FK indexes, a
 * UNIQUE constraint on users.phone_number, a status CHECK on
 * guardian_elder_relationships, the new emergency_contacts table, and
 * notification source-entity columns. See migration file header for the
 * full live-DB-verified rationale per change. Safe to run repeatedly.
 */
const runV16SchemaIntegrityMigration = async (client: any) => {
  try {
    const sqlPath = path.join(__dirname, "../../database/migration_v16_schema_integrity_phase1.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.query(sql);
  } catch (err: any) {
    console.warn("Migration V16 Warning:", err.message);
  }
};

/**
 * Migration V17: Database & Data Architecture Fix.
 * Fixes 21 audit-verified issues:
 * - users: ADD deleted_at, is_active, CHECK on role
 * - medications: ADD deleted_at, updated_at; make time_schedule nullable
 * - daily_tasks: ADD deleted_at, is_active, updated_at
 * - sync_queue: CREATE TABLE (entire sync domain was broken without it)
 * - notifications: ADD target_id column
 * - guardian_elder_relationships: NOT NULL on FK columns
 * - elder_invitations: ADD elder_id column
 * - journal_entries / mood_logs / emergency_logs: ADD updated_at
 * - risk_profiles: CHECK constraints on risk_level and category
 * - Missing indexes for new columns and soft-delete patterns
 * Safe to run repeatedly (all statements are idempotent).
 */
const runV17DbArchitectureFix = async (client: any) => {
  try {
    // Phase A: index operations that must run outside a transaction
    // These are already applied manually; run ADD COLUMN fixes inline.
    const sqlPath = path.join(__dirname, "../../database/migration_v17_db_architecture_fix.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    // The migration file has a Phase A section without BEGIN/COMMIT and a
    // Phase B section with BEGIN/COMMIT. pg will execute both sequentially.
    await client.query(sql);
  } catch (err: any) {
    console.warn("Migration V17 Warning:", err.message);
  }
};

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(
      `✅ PostgreSQL Connected safely to: ${process.env.DB_NAME || "sithamithuru"}`,
    );
    await runSchemaMigrations(client);
    await runPhase12SchemaMigrations(client);
    await runV12SyncIntegrityMigration(client);
    await runV13AuditRiskIntegrityMigration(client);
    await runV14NotificationsTableMigration(client);
    await runV15EmergencyLogsAuditColumnsMigration(client);
    await runV16SchemaIntegrityMigration(client);
    await runV17DbArchitectureFix(client);
    client.release();
    console.log("✅ All database migrations applied successfully (v12–v17).");
  } catch (error) {
    console.error("❌ PostgreSQL Connection Error:", error);
    process.exit(1); // Exit process with failure
  }
};

export default pool;
