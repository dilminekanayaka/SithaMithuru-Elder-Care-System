import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("sithamithuru.db");
  return db;
};

export const initDB = async () => {
  try {
    const database = await getDB();

    // Enable Write-Ahead Logging for better performance
    await database.execAsync(`PRAGMA journal_mode = WAL;`);

    // Create Users table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT
      );
    `);

    // Create Medications table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS Medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        time TEXT NOT NULL,
        taken BOOLEAN DEFAULT 0
      );
    `);

    // Create Tasks table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS Tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create MoodLogs table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS MoodLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Sync Errors Table (Dead Letter Queue)
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        original_id TEXT NOT NULL,
        payload TEXT NOT NULL, -- Will store AES encrypted payload
        error_reason TEXT NOT NULL,
        failed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Guardian Dashboard Cache — stores full API snapshot for offline use
    await database.execAsync(`
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
    `);

    // Guardian Notifications Cache — for offline notification feed
    await database.execAsync(`
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
    `);

    console.log('✅ Offline SQLite Database Initialized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return false;
  }
};


import { encryptData, decryptData } from "../utils/crypto";

/**
 * Phase 14 Security & Compliance: Application-Level Encryption Wrappers
 * Encrypts a payload before inserting it into SQLite.
 */
export const runEncryptedAsync = async (
  query: string,
  params: any[],
  payloadIndex: number
): Promise<any> => {
  const dbInstance = await getDB();
  const newParams = [...params];
  
  if (payloadIndex >= 0 && payloadIndex < params.length) {
    const rawPayload = typeof params[payloadIndex] === 'string' 
      ? params[payloadIndex] 
      : JSON.stringify(params[payloadIndex]);
      
    newParams[payloadIndex] = await encryptData(rawPayload);
  }
  
  return dbInstance.runAsync(query, newParams);
};

/**
 * Phase 14 Security & Compliance: Application-Level Encryption Wrappers
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
          row[payloadColumnName] = decrypted.startsWith('{') || decrypted.startsWith('[') 
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

