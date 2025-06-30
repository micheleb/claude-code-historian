import { Database } from "bun:sqlite";
import { SCHEMA } from "../src/db/schema";
import { SyncService } from "../src/sync/sync-service";

export class TestSyncService extends SyncService {
  constructor(testDatabase: Database) {
    super();
    // Override the database with our test instance
    (this as any).db = testDatabase;
  }
}

export function createTestDatabase(): Database {
  // Create in-memory test database for isolation and speed
  const testDb = new Database(":memory:");
  testDb.exec(SCHEMA);
  return testDb;
}

export function createTestSyncService(testDb: Database): TestSyncService {
  return new TestSyncService(testDb);
}