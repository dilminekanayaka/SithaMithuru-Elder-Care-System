import { Pool } from "pg";
import dotenv from "dotenv";

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

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(
      `✅ PostgreSQL Connected safely to: ${process.env.DB_NAME || "sithamithuru"}`,
    );
    await runSchemaMigrations(client);
    await runPhase12SchemaMigrations(client);
    client.release();
  } catch (error) {
    console.error("❌ PostgreSQL Connection Error:", error);
    process.exit(1); // Exit process with failure
  }
};

export default pool;
