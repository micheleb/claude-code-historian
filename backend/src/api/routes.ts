import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getDatabase } from '../db/database';

const app = new Hono();

// Enable CORS for frontend
app.use('*', cors());

// Get all projects
app.get('/api/projects', (c) => {
  const db = getDatabase();
  const projects = db.prepare(
    `SELECT id, path, name, created_at, updated_at,
     (SELECT COUNT(*) FROM conversations WHERE project_id = projects.id) as conversation_count
     FROM projects
     ORDER BY updated_at DESC`
  ).all();
  
  return c.json(projects);
});

// Get conversations for a project
app.get('/api/projects/:projectId/conversations', (c) => {
  const projectId = c.req.param('projectId');
  const db = getDatabase();
  
  const conversations = db.prepare(
    `SELECT c.*, 
     (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
     FROM conversations c
     WHERE c.project_id = ?
     ORDER BY c.started_at DESC`
  ).all(projectId);
  
  return c.json(conversations);
});

// Get messages for a conversation
app.get('/api/conversations/:conversationId/messages', (c) => {
  const conversationId = c.req.param('conversationId');
  const db = getDatabase();
  
  const messages = db.prepare(
    `SELECT m.*,
     (SELECT json_group_array(json_object(
       'id', id,
       'tool_id', tool_id,
       'tool_name', tool_name,
       'input', input,
       'result', result
     )) FROM tool_uses WHERE message_id = m.id) as tool_uses
     FROM messages m
     WHERE m.conversation_id = ?
     ORDER BY m.timestamp ASC`
  ).all(conversationId);
  
  // Parse tool_uses JSON
  const parsedMessages = messages.map(msg => ({
    ...msg,
    tool_uses: msg.tool_uses ? JSON.parse(msg.tool_uses as string) : []
  }));
  
  return c.json(parsedMessages);
});

// Get conversation details with messages
app.get('/api/conversations/:conversationId', (c) => {
  const conversationId = c.req.param('conversationId');
  const db = getDatabase();
  
  const conversation = db.prepare(
    `SELECT c.*, p.name as project_name, p.path as project_path
     FROM conversations c
     JOIN projects p ON c.project_id = p.id
     WHERE c.id = ?`
  ).get(conversationId);
  
  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }
  
  const messages = db.prepare(
    `SELECT m.*,
     (SELECT json_group_array(json_object(
       'id', id,
       'tool_id', tool_id,
       'tool_name', tool_name,
       'input', input,
       'result', result
     )) FROM tool_uses WHERE message_id = m.id) as tool_uses
     FROM messages m
     WHERE m.conversation_id = ?
     ORDER BY m.timestamp ASC`
  ).all(conversationId);
  
  // Parse tool_uses JSON
  const parsedMessages = messages.map(msg => ({
    ...msg,
    tool_uses: msg.tool_uses ? JSON.parse(msg.tool_uses as string) : []
  }));
  
  return c.json({
    ...conversation,
    messages: parsedMessages
  });
});

// Search messages
app.get('/api/search', (c) => {
  const query = c.req.query('q');
  const projectId = c.req.query('projectId');
  
  if (!query) {
    return c.json({ error: 'Query parameter required' }, 400);
  }
  
  const db = getDatabase();
  
  let sql = `
    SELECT m.*, c.session_id, p.name as project_name, p.id as project_id,
    snippet(messages_fts, -1, '<mark>', '</mark>', '...', 32) as snippet
    FROM messages_fts
    JOIN messages m ON messages_fts.rowid = m.id
    JOIN conversations c ON m.conversation_id = c.id
    JOIN projects p ON c.project_id = p.id
    WHERE messages_fts MATCH ?
  `;
  
  const params: any[] = [query];
  
  if (projectId) {
    sql += ' AND p.id = ?';
    params.push(projectId);
  }
  
  sql += ' ORDER BY rank LIMIT 100';
  
  const results = db.prepare(sql).all(...params);
  
  return c.json(results);
});

// Get todos for a session
app.get('/api/todos/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId');
  const db = getDatabase();
  
  const todos = db.prepare(
    'SELECT * FROM todos WHERE session_id = ? ORDER BY priority DESC, created_at ASC'
  ).all(sessionId);
  
  return c.json(todos);
});

// Get conversations by date range
app.get('/api/conversations/by-date', (c) => {
  const startDate = c.req.query('start');
  const endDate = c.req.query('end');
  const projectId = c.req.query('projectId');
  
  const db = getDatabase();
  
  let sql = `
    SELECT c.*, p.name as project_name,
    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
    FROM conversations c
    JOIN projects p ON c.project_id = p.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (startDate) {
    sql += ' AND c.started_at >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND c.started_at <= ?';
    params.push(endDate);
  }
  
  if (projectId) {
    sql += ' AND c.project_id = ?';
    params.push(projectId);
  }
  
  sql += ' ORDER BY c.started_at DESC';
  
  const conversations = db.prepare(sql).all(...params);
  
  return c.json(conversations);
});

// Get project by path (for URL routing)
app.get('/api/projects/by-path', (c) => {
  const path = c.req.query('path');
  
  if (!path) {
    return c.json({ error: 'Path parameter required' }, 400);
  }
  
  const db = getDatabase();
  
  const project = db.prepare(
    `SELECT id, path, name, created_at, updated_at,
     (SELECT COUNT(*) FROM conversations WHERE project_id = projects.id) as conversation_count
     FROM projects
     WHERE path = ?`
  ).get(path);
  
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  
  return c.json(project);
});

// Get conversations for a project by path (for URL routing)
app.get('/api/projects/by-path/conversations', (c) => {
  const path = c.req.query('path');
  
  if (!path) {
    return c.json({ error: 'Path parameter required' }, 400);
  }
  
  const db = getDatabase();
  
  const conversations = db.prepare(
    `SELECT c.*, 
     (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
     FROM conversations c
     JOIN projects p ON c.project_id = p.id
     WHERE p.path = ?
     ORDER BY c.started_at DESC`
  ).all(path);
  
  return c.json(conversations);
});

// Get conversation by session_id (for URL routing)
app.get('/api/conversations/by-session/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId');
  const db = getDatabase();
  
  const conversation = db.prepare(
    `SELECT c.*, p.name as project_name, p.path as project_path
     FROM conversations c
     JOIN projects p ON c.project_id = p.id
     WHERE c.session_id = ?`
  ).get(sessionId);
  
  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }
  
  const messages = db.prepare(
    `SELECT m.*,
     (SELECT json_group_array(json_object(
       'id', id,
       'tool_id', tool_id,
       'tool_name', tool_name,
       'input', input,
       'result', result
     )) FROM tool_uses WHERE message_id = m.id) as tool_uses
     FROM messages m
     WHERE m.conversation_id = ?
     ORDER BY m.timestamp ASC`
  ).all(conversation.id);
  
  // Parse tool_uses JSON
  const parsedMessages = messages.map(msg => ({
    ...msg,
    tool_uses: msg.tool_uses ? JSON.parse(msg.tool_uses as string) : []
  }));
  
  return c.json({
    ...conversation,
    messages: parsedMessages
  });
});

export default app;