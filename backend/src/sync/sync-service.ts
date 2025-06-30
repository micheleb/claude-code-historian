import { Database } from 'bun:sqlite';
import { getDatabase } from '../db/database';
import { JSONLParser } from './parser';
import type { LogEntry, UserMessage, AssistantMessage } from '../types/log';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export class SyncService {
  private db: Database;
  
  constructor() {
    this.db = getDatabase();
  }
  
  async syncAll(claudeDir: string = `${process.env.HOME}/.claude`) {
    console.log(`Starting sync from ${claudeDir}`);
    
    // Sync projects
    const projectsDir = join(claudeDir, 'projects');
    const projects = await readdir(projectsDir, { withFileTypes: true });
    
    for (const project of projects) {
      if (project.isDirectory()) {
        await this.syncProject(join(projectsDir, project.name));
      }
    }
    
    // Sync todos
    const todosDir = join(claudeDir, 'todos');
    await this.syncTodos(todosDir);
    
    console.log('Sync completed');
  }
  
  private async syncProject(projectDir: string) {
    const files = await readdir(projectDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
    
    for (const file of jsonlFiles) {
      const filePath = join(projectDir, file);
      await this.syncConversation(filePath);
    }
  }
  
  private async syncConversation(filePath: string) {
    try {
      console.log(`Syncing ${filePath}`);
      
      // Extract project and session info
      const { projectPath, projectName } = JSONLParser.extractProjectInfo(filePath);
      const sessionId = JSONLParser.extractSessionId(filePath);
      
      // Get or create project
      const projectId = await this.getOrCreateProject(projectPath, projectName);
      
      // Parse log entries
      const entries = await JSONLParser.parseFile(filePath);
      
      if (entries.length === 0) {
        console.warn(`No valid entries found in ${filePath}`);
        return;
      }
      
      // Get conversation metadata
      const firstEntry = entries.find(e => 'timestamp' in e);
      const lastEntry = [...entries].reverse().find(e => 'timestamp' in e);
      const summaryEntry = entries.find(e => e.type === 'summary');
      
      // Create or update conversation
      const conversationId = await this.getOrCreateConversation(
        sessionId,
        projectId,
        firstEntry?.timestamp || new Date().toISOString(),
        lastEntry?.timestamp || new Date().toISOString(),
        summaryEntry?.summary || null
      );
      
      // Process messages
      for (const entry of entries) {
        if (entry.type === 'user' || entry.type === 'assistant') {
          await this.insertMessage(entry, conversationId);
        }
      }
      
    } catch (error) {
      console.error(`Error syncing ${filePath}:`, error);
    }
  }
  
  private async getOrCreateProject(path: string, name: string): Promise<number> {
    const existing = this.db.prepare(
      'SELECT id FROM projects WHERE path = ?'
    ).get(path) as { id: number } | undefined;
    
    if (existing) {
      return existing.id;
    }
    
    const result = this.db.prepare(
      'INSERT INTO projects (path, name) VALUES (?, ?)'
    ).run(path, name);
    
    return result.lastInsertRowid as number;
  }
  
  private async getOrCreateConversation(
    sessionId: string,
    projectId: number,
    startedAt: string,
    endedAt: string,
    summary: string | null
  ): Promise<number> {
    const existing = this.db.prepare(
      'SELECT id FROM conversations WHERE session_id = ?'
    ).get(sessionId) as { id: number } | undefined;
    
    if (existing) {
      // Update ended_at and summary if newer
      this.db.prepare(
        'UPDATE conversations SET ended_at = ?, summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(endedAt, summary, existing.id);
      
      return existing.id;
    }
    
    const result = this.db.prepare(
      'INSERT INTO conversations (session_id, project_id, started_at, ended_at, summary) VALUES (?, ?, ?, ?, ?)'
    ).run(sessionId, projectId, startedAt, endedAt, summary);
    
    return result.lastInsertRowid as number;
  }
  
  private async insertMessage(entry: UserMessage | AssistantMessage, conversationId: number) {
    // Check if message already exists
    const existing = this.db.prepare(
      'SELECT id FROM messages WHERE uuid = ?'
    ).get(entry.uuid);
    
    if (existing) {
      return;
    }
    
    // Extract content
    let content = '';
    let model = null;
    
    if (entry.type === 'user') {
      if (typeof entry.message.content === 'string') {
        content = entry.message.content;
      } else if (Array.isArray(entry.message.content)) {
        content = entry.message.content
          .map(c => c.text || JSON.stringify(c))
          .join('\\n');
      }
    } else if (entry.type === 'assistant') {
      model = entry.message.model;
      content = entry.message.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\\n');
    }
    
    // Insert message
    const result = this.db.prepare(
      `INSERT INTO messages 
       (uuid, conversation_id, parent_uuid, type, role, content, model, timestamp, is_sidechain, is_meta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      entry.uuid,
      conversationId,
      entry.parentUuid,
      entry.type,
      entry.message.role,
      content,
      model,
      entry.timestamp,
      entry.isSidechain ? 1 : 0,
      (entry as UserMessage).isMeta ? 1 : 0
    );
    
    const messageId = result.lastInsertRowid as number;
    
    // Process tool uses for assistant messages
    if (entry.type === 'assistant') {
      for (const contentItem of entry.message.content) {
        if (contentItem.type === 'tool_use') {
          await this.insertToolUse(
            messageId,
            contentItem.id,
            contentItem.name,
            JSON.stringify(contentItem.input),
            entry.timestamp
          );
        }
      }
    }
  }
  
  private async insertToolUse(
    messageId: number,
    toolId: string,
    toolName: string,
    input: string,
    timestamp: string
  ) {
    this.db.prepare(
      `INSERT INTO tool_uses (message_id, tool_id, tool_name, input, timestamp)
       VALUES (?, ?, ?, ?, ?)`
    ).run(messageId, toolId, toolName, input, timestamp);
  }
  
  private async syncTodos(todosDir: string) {
    try {
      const files = await readdir(todosDir);
      const todoFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of todoFiles) {
        const filePath = join(todosDir, file);
        await this.syncTodoFile(filePath);
      }
    } catch (error) {
      console.error('Error syncing todos:', error);
    }
  }
  
  private async syncTodoFile(filePath: string) {
    try {
      const file = Bun.file(filePath);
      const todos = await file.json();
      
      // Extract session ID from filename
      const match = filePath.match(/([a-f0-9-]+)(?:-agent-[a-f0-9-]+)?\.json$/);
      if (!match) return;
      
      const sessionId = match[1];
      
      if (Array.isArray(todos)) {
        for (const todo of todos) {
          await this.upsertTodo(sessionId, todo);
        }
      }
    } catch (error) {
      console.error(`Error syncing todo file ${filePath}:`, error);
    }
  }
  
  private async upsertTodo(sessionId: string, todo: any) {
    this.db.prepare(
      `INSERT OR REPLACE INTO todos (session_id, todo_id, content, status, priority)
       VALUES (?, ?, ?, ?, ?)`
    ).run(sessionId, todo.id, todo.content, todo.status, todo.priority);
  }
}