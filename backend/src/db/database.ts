import { Database } from 'bun:sqlite';
import { SCHEMA } from './schema';

let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    db = new Database('claude-logs.db');
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  if (!db) return;
  
  // Execute the schema
  db.exec(SCHEMA);
  
  console.log('Database initialized successfully');
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}