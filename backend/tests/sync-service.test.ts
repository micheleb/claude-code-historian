import { test, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { JSONLParser } from "../src/sync/parser";
import { join } from "node:path";
import type { LogEntry } from "../src/types/log";
import { createTestDatabase, createTestSyncService, TestSyncService } from "./test-utils";

// Test database setup
let testDb: Database;
let syncService: TestSyncService;

beforeEach(() => {
  // Create dedicated in-memory test database for complete isolation
  // This ensures tests don't affect the main claude-logs.db database
  testDb = createTestDatabase();
  syncService = createTestSyncService(testDb);
});

afterEach(() => {
  // Clean up test database
  testDb.close();
});

// Helper function to sync test data
async function syncTestFile(filePath: string, sessionId: string, projectName: string) {
  const entries = await JSONLParser.parseFile(filePath);
  const firstEntry = entries.find((e): e is LogEntry & { timestamp: string } => 'timestamp' in e);
  const lastEntry = [...entries].reverse().find((e): e is LogEntry & { timestamp: string } => 'timestamp' in e);
  
  if (!firstEntry || !lastEntry) {
    throw new Error('No entries with timestamps found');
  }
  
  const projectId = await (syncService as any).getOrCreateProject(projectName, projectName);
  const conversationId = await (syncService as any).getOrCreateConversation(
    sessionId, 
    projectId, 
    firstEntry.timestamp, 
    lastEntry.timestamp,
    null
  );
  
  const processedEntries = (syncService as any).groupConsecutiveToolMessages(entries);
  for (const entry of processedEntries) {
    if (entry.type === 'user' || entry.type === 'assistant') {
      await (syncService as any).insertMessage(entry, conversationId);
    }
  }
  return { entries, processedEntries };
}


test("should merge consecutive tool-only messages", async () => {
  const testFile = join(import.meta.dir, "fixtures", "consecutive-tools.jsonl");
  await syncTestFile(testFile, "test-session-1", "test-project-1");
  
  // Check that consecutive tool messages were merged
  const messages = testDb.prepare(`
    SELECT m.id, m.type, COUNT(tu.id) as tool_count 
    FROM messages m 
    LEFT JOIN tool_uses tu ON m.id = tu.message_id 
    WHERE m.type = 'assistant' 
    GROUP BY m.id 
    ORDER BY m.timestamp
  `).all();
  
  // Should have one merged message with 3 tools
  const toolMessages = messages.filter((m: any) => (m as any).tool_count > 0);
  expect(toolMessages).toHaveLength(1);
  expect((toolMessages[0] as any).tool_count).toBe(3);
});

test("should merge tool messages separated by thinking", async () => {
  const testFile = join(import.meta.dir, "fixtures", "tools-with-thinking.jsonl");
  await syncTestFile(testFile, "test-session-2", "test-project-2");
  
  const messages = testDb.prepare(`
    SELECT m.id, m.type, COUNT(tu.id) as tool_count 
    FROM messages m 
    LEFT JOIN tool_uses tu ON m.id = tu.message_id 
    WHERE m.type = 'assistant' 
    GROUP BY m.id 
    ORDER BY m.timestamp
  `).all();
  
  // Should have one merged message with 3 tools (thinking messages should be skipped)
  const toolMessages = messages.filter((m: any) => (m as any).tool_count > 0);
  expect(toolMessages).toHaveLength(1);
  expect((toolMessages[0] as any).tool_count).toBe(3);
});

test("should break grouping on text content", async () => {
  const testFile = join(import.meta.dir, "fixtures", "mixed-content.jsonl");
  await syncTestFile(testFile, "test-session-3", "test-project-3");
  
  const messages = testDb.prepare(`
    SELECT m.id, m.type, LENGTH(m.content) as content_length, COUNT(tu.id) as tool_count 
    FROM messages m 
    LEFT JOIN tool_uses tu ON m.id = tu.message_id 
    WHERE m.type = 'assistant' 
    GROUP BY m.id 
    ORDER BY m.timestamp
  `).all();
  
  // Should have: 1 tool message, 1 text message, 1 merged tool message (2 tools)
  const toolMessages = messages.filter((m: any) => (m as any).tool_count > 0);
  const textMessages = messages.filter((m: any) => (m as any).content_length > 0 && (m as any).tool_count === 0);
  
  expect(toolMessages).toHaveLength(2); // 2 tool messages (1 single, 1 merged)
  expect(textMessages).toHaveLength(1); // 1 text message breaking grouping
  
  // First tool message should have 1 tool, second should have 2 tools
  expect((toolMessages[0] as any).tool_count).toBe(1);
  expect((toolMessages[1] as any).tool_count).toBe(2);
});

test("should handle complex scenario with multiple thinking messages", async () => {
  const testFile = join(import.meta.dir, "fixtures", "complex-scenario.jsonl");
  await syncTestFile(testFile, "test-session-4", "test-project-4");
  
  const messages = testDb.prepare(`
    SELECT m.id, m.type, LENGTH(m.content) as content_length, COUNT(tu.id) as tool_count 
    FROM messages m 
    LEFT JOIN tool_uses tu ON m.id = tu.message_id 
    WHERE m.type = 'assistant' 
    GROUP BY m.id 
    ORDER BY m.timestamp
  `).all();
  
  // Should merge the 5 tool messages (2 Write, 1 Read, 1 Bash, 1 mkdir) into one
  // Plus one text message at the end
  const toolMessages = messages.filter((m: any) => (m as any).tool_count > 0);
  const textMessages = messages.filter((m: any) => (m as any).content_length > 0 && (m as any).tool_count === 0);
  
  expect(toolMessages).toHaveLength(1); // All 5 tools merged into 1 message
  expect((toolMessages[0] as any).tool_count).toBe(5);
  expect(textMessages).toHaveLength(1); // Final text message
});

test("should skip thinking-only messages", async () => {
  const testFile = join(import.meta.dir, "fixtures", "tools-with-thinking.jsonl");
  await syncTestFile(testFile, "test-session-5", "test-project-5");
  
  // Check that no thinking-only messages were stored
  const allMessages = testDb.prepare(`
    SELECT m.id, m.content 
    FROM messages m 
    WHERE m.type = 'assistant'
  `).all();
  
  // Should only have the merged tool message, no thinking-only messages
  expect(allMessages).toHaveLength(1);
});

test("should skip tool result user messages", async () => {
  const testFile = join(import.meta.dir, "fixtures", "consecutive-tools.jsonl");
  await syncTestFile(testFile, "test-session-6", "test-project-6");
  
  // Check user messages
  const userMessages = testDb.prepare(`
    SELECT m.id, m.content 
    FROM messages m 
    WHERE m.type = 'user'
  `).all();
  
  // Should only have the initial user message and final thank you message
  // Tool result messages should be filtered out
  expect(userMessages).toHaveLength(2);
});

test("should preserve tool order in merged messages", async () => {
  const testFile = join(import.meta.dir, "fixtures", "consecutive-tools.jsonl");
  await syncTestFile(testFile, "test-session-7", "test-project-7");
  
  // Check tool order
  const tools = testDb.prepare(`
    SELECT tu.tool_name, tu.input, tu.timestamp 
    FROM tool_uses tu
    JOIN messages m ON tu.message_id = m.id
    ORDER BY tu.timestamp
  `).all();
  
  expect(tools).toHaveLength(3);
  expect((tools[0] as any).tool_name).toBe("Bash");
  expect((tools[1] as any).tool_name).toBe("Bash");
  expect((tools[2] as any).tool_name).toBe("Bash");
  
  // Verify input content shows different commands
  const inputs = tools.map((t: any) => JSON.parse((t as any).input));
  expect(inputs[0].command).toBe("ls -la");
  expect(inputs[1].command).toBe("pwd");
  expect(inputs[2].command).toBe("echo 'hello'");
});