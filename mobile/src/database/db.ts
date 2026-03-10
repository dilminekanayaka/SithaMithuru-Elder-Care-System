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

    console.log("✅ Offline SQLite Database Initialized successfully.");
    return true;
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    return false;
  }
};
