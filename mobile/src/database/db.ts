import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { encryptData, decryptData } from "../utils/crypto";

export interface DBClient {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

let db: DBClient | null = null;
let dbPromise: Promise<DBClient> | null = null;

const createWebDbMock = (): DBClient => {
  const store: Record<string, any[]> = {
    medications_local: [],
    daily_tasks_local: [],
  };

  return {
    execAsync: async () => {},
    runAsync: async (sql: string, params: any[] = []) => { return { lastInsertRowId: 1, changes: 1 }; },
    getFirstAsync: async <T = any>(sql: string, params: any[] = []): Promise<T | null> => {
      if (sql.includes("medications_local")) return store.medications_local[0] as unknown as T;
      if (sql.includes("daily_tasks_local")) return store.daily_tasks_local[0] as unknown as T;
      if (sql.includes("user_version")) return { user_version: SCHEMA_VERSION } as unknown as T;
      if (sql.includes("COUNT") && sql.includes("medications_local")) return ({ count: store.medications_local.length } as unknown) as T;
      if (sql.includes("COUNT") && sql.includes("daily_tasks_local")) return ({ count: store.daily_tasks_local.length } as unknown) as T;
      if (sql.includes("COUNT")) return ({ count: 0 } as unknown) as T;
      return null;
    },
    getAllAsync: async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
      if (sql.includes("medications_local")) return store.medications_local as unknown as T[];
      if (sql.includes("daily_tasks_local")) return store.daily_tasks_local as unknown as T[];
      return [] as T[];
    },
    withTransactionAsync: async (task: () => Promise<void>) => { await task(); },
  };
};

export const getDB = async (): Promise<DBClient> => {
  if (db) return db;
  // Cache the in-flight promise, not just the resolved value — otherwise
  // concurrent callers during app boot (main init + backgroundSyncService)
  // both see `db === null` and race to open the same SQLite file, which
  // manifests as a native NullPointerException on prepareAsync/execAsync.
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    if (Platform.OS === "web") {
      db = createWebDbMock();
      return db;
    }
    db = (await SQLite.openDatabaseAsync("sithamithuru.db")) as unknown as DBClient;
    return db;
  })();

  try {
    return await dbPromise;
  } finally {
    dbPromise = null;
  }
};

// ─── Schema Version Control ────────────────────────────────────────────────
// Increment this number when adding new migrations
const SCHEMA_VERSION = 6;

export const addColumnIfMissing = async (database: DBClient, tableName: string, columnName: string, columnDefinition: string) => {
  const columns = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  if (!columns.some((column) => column.name === columnName)) {
    await database.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`);
  }
};

// ─── Migration Runner ──────────────────────────────────────────────────────
const runMigrations = async (database: DBClient) => {
  // Get current schema version
  const versionResult = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion >= SCHEMA_VERSION) return;

  // ── Migration v1: Baseline tables ──────────────────────────────────────
  if (currentVersion < 1) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT
      );

      CREATE TABLE IF NOT EXISTS Medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        time TEXT NOT NULL,
        taken BOOLEAN DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS Tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS MoodLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sync_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        original_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        error_reason TEXT NOT NULL,
        failed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS guardian_dashboard_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guardian_id TEXT NOT NULL UNIQUE,
        elder_id TEXT,
        elder_name TEXT,
        health_score INTEGER,
        risk_level TEXT,
        med_percent INTEGER,
        task_percent INTEGER,
        mood_type TEXT,
        active_emergency INTEGER DEFAULT 0,
        next_med_name TEXT,
        next_med_time TEXT,
        missed_meds_count INTEGER DEFAULT 0,
        activity_json TEXT,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS guardian_notifications_cache (
        id TEXT PRIMARY KEY,
        guardian_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        data_json TEXT,
        read_at TEXT,
        created_at TEXT NOT NULL
      );

      PRAGMA user_version = 1;
    `);
  }

  // ── Migration v2: Offline sync queues ──────────────────────────────────
  if (currentVersion < 2) {
    await database.execAsync(`
      -- Medication offline queue (synced to PostgreSQL medication_logs)
      CREATE TABLE IF NOT EXISTS medication_logs_offline (
        id TEXT PRIMARY KEY,
        medication_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'TAKEN',
        logged_date TEXT NOT NULL,
        action_timestamp TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0
      );

      -- Task offline queue (synced to PostgreSQL task_logs)
      CREATE TABLE IF NOT EXISTS task_logs_offline (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        logged_date TEXT NOT NULL,
        action_timestamp TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0
      );

      -- Mood offline queue (synced to PostgreSQL mood_logs)
      CREATE TABLE IF NOT EXISTS mood_logs_offline (
        id TEXT PRIMARY KEY,
        mood_type TEXT NOT NULL,
        notes TEXT,
        logged_date TEXT NOT NULL,
        action_timestamp TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0
      );

      -- Emergency offline queue — CRITICAL priority, never discard
      CREATE TABLE IF NOT EXISTS emergency_logs_offline (
        id TEXT PRIMARY KEY,
        elder_id TEXT,
        triggered_phrase TEXT,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TEXT NOT NULL,
        action_timestamp TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0,
        sync_priority INTEGER DEFAULT 1
      );

      -- Sync metadata (last sync timestamps, cursors)
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      PRAGMA user_version = 2;
    `);
  }

  // ── Migration v3: Local feature tables ─────────────────────────────────
  if (currentVersion < 3) {
    await database.execAsync(`
      -- Local medication schedules (available offline)
      CREATE TABLE IF NOT EXISTS medications_local (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        elder_id TEXT,
        name TEXT NOT NULL,
        dosage TEXT,
        form TEXT DEFAULT 'PILL',
        strength TEXT,
        instructions TEXT,
        schedule_type TEXT DEFAULT 'DAILY',
        schedule_values TEXT DEFAULT '[]',
        start_date TEXT,
        end_date TEXT,
        category TEXT DEFAULT 'General',
        is_active INTEGER DEFAULT 1,
        sync_status TEXT DEFAULT 'synced',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Local daily tasks (available offline)
      CREATE TABLE IF NOT EXISTS daily_tasks_local (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        elder_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        due_time TEXT,
        is_active INTEGER DEFAULT 1,
        sync_status TEXT DEFAULT 'synced',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Local journal entries (immutable append — never overwrite)
      CREATE TABLE IF NOT EXISTS journal_entries_local (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        elder_id TEXT,
        content TEXT NOT NULL,
        mood_type TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Local memories
      CREATE TABLE IF NOT EXISTS memories_local (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        elder_id TEXT,
        title TEXT,
        description TEXT,
        image_uri TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      PRAGMA user_version = 3;
    `);
  }

  if (currentVersion < 4) {
    await addColumnIfMissing(database, "medication_logs_offline", "elder_id", "TEXT");
    await addColumnIfMissing(database, "task_logs_offline", "elder_id", "TEXT");
    await addColumnIfMissing(database, "mood_logs_offline", "elder_id", "TEXT");
    await addColumnIfMissing(database, "mood_logs_offline", "notes", "TEXT");
    await addColumnIfMissing(database, "emergency_logs_offline", "device_location", "TEXT");
    await addColumnIfMissing(database, "emergency_logs_offline", "latitude", "REAL");
    await addColumnIfMissing(database, "emergency_logs_offline", "longitude", "REAL");
    await addColumnIfMissing(database, "emergency_logs_offline", "maps_url", "TEXT");
    await addColumnIfMissing(database, "journal_entries_local", "title", "TEXT");
    await addColumnIfMissing(database, "journal_entries_local", "mood_tag", "TEXT");
    await addColumnIfMissing(database, "journal_entries_local", "audio_url", "TEXT");
    await addColumnIfMissing(database, "journal_entries_local", "synced", "INTEGER DEFAULT 0");

    await database.execAsync("PRAGMA user_version = 4;");
  }
  if (currentVersion < 5) {
    await addColumnIfMissing(database, "medications_local", "taken", "INTEGER DEFAULT 0");
    await addColumnIfMissing(database, "daily_tasks_local", "completed", "INTEGER DEFAULT 0");

    await database.execAsync("PRAGMA user_version = 5;");
  }

  // ── Migration v6: Emergency contacts local + misc column fixes ────────────
  if (currentVersion < 6) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS emergency_contacts_local (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        elder_id TEXT,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        relationship TEXT,
        is_primary INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // daily_tasks_local: is_active column (tasks with is_active=0 are archived)
    await addColumnIfMissing(database, "daily_tasks_local", "is_active", "INTEGER DEFAULT 1");

    // journal_entries_local: updated_at for sync conflict resolution
    await addColumnIfMissing(database, "journal_entries_local", "updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");
    // mood_tag matches PostgreSQL column name (mood_type kept for backwards compat)
    await addColumnIfMissing(database, "journal_entries_local", "mood_tag", "TEXT");

    // emergency_logs_offline: ML model fields captured during voice detection
    await addColumnIfMissing(database, "emergency_logs_offline", "triggered_by_model", "TEXT");
    await addColumnIfMissing(database, "emergency_logs_offline", "audio_snr_db", "REAL");
    await addColumnIfMissing(database, "emergency_logs_offline", "confidence_score", "REAL");

    // sync_metadata: sequence cursor for incremental pull sync
    await addColumnIfMissing(database, "sync_metadata", "sync_sequence", "INTEGER DEFAULT 0");

    await database.execAsync("PRAGMA user_version = 6;");
  }
  console.log(`SQLite migrations complete. Schema version: ${SCHEMA_VERSION}`);
};

// ─── Main DB Initialization ────────────────────────────────────────────────
export const initDB = async () => {
  try {
    const database = await getDB();

    // Enable Write-Ahead Logging for better performance
    await database.execAsync(`PRAGMA journal_mode = WAL;`);

    // Run versioned migrations
    await runMigrations(database);

    console.log("✅ Offline SQLite Database Initialized successfully.");
    return true;
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    return false;
  }
};

// ─── Phase 14 Security & Compliance: Application-Level Encryption Wrappers ─

/**
 * Encrypts a payload parameter before inserting it into SQLite.
 * Note: This is application-level AES (CryptoJS). Not equivalent to SQLCipher.
 * See docs/DECISIONS.md D-005.
 */
export const runEncryptedAsync = async (
  query: string,
  params: any[],
  payloadIndex: number
): Promise<any> => {
  const dbInstance = await getDB();
  const newParams = [...params];

  if (payloadIndex >= 0 && payloadIndex < params.length) {
    const rawPayload =
      typeof params[payloadIndex] === "string"
        ? params[payloadIndex]
        : JSON.stringify(params[payloadIndex]);

    newParams[payloadIndex] = await encryptData(rawPayload);
  }

  return dbInstance.runAsync(query, newParams);
};

/**
 * Decrypts a specific payload column after fetching from SQLite.
 */
export const getAllDecryptedAsync = async <T>(
  query: string,
  payloadColumnName: string = "payload"
): Promise<T[]> => {
  const dbInstance = await getDB();
  const rows = await dbInstance.getAllAsync<any>(query);

  return Promise.all(
    rows.map(async (row) => {
      if (row[payloadColumnName]) {
        try {
          const decrypted = await decryptData(row[payloadColumnName]);
          row[payloadColumnName] =
            decrypted.startsWith("{") || decrypted.startsWith("[")
              ? JSON.parse(decrypted)
              : decrypted;
        } catch (e) {
          console.warn("Failed to decrypt row column", payloadColumnName);
        }
      }
      return row as T;
    })
  );
};
