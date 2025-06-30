import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface Project {
  id: number;
  path: string;
  name: string;
  created_at: string;
  updated_at: string;
  conversation_count: number;
}

export interface Conversation {
  id: number;
  session_id: string;
  project_id: number;
  started_at: string;
  ended_at: string;
  summary: string | null;
  message_count?: number;
  project_name?: string;
}

export interface ToolUse {
  id: number;
  tool_id: string;
  tool_name: string;
  input: string;
  result: string | null;
}

export interface Message {
  id: number;
  uuid: string;
  conversation_id: number;
  parent_uuid: string | null;
  type: 'user' | 'assistant' | 'system';
  role: string;
  content: string;
  model: string | null;
  timestamp: string;
  is_sidechain: boolean;
  is_meta: boolean;
  tool_uses: ToolUse[];
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface SearchResult extends Message {
  session_id: string;
  project_name: string;
  project_path: string;
  project_id: number;
  snippet: string;
}

export interface Todo {
  id: number;
  session_id: string;
  todo_id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

// API functions
export const getProjects = () => 
  api.get<Project[]>('/projects').then(res => res.data);

export const getProjectConversations = (projectId: number) =>
  api.get<Conversation[]>(`/projects/${projectId}/conversations`).then(res => res.data);

export const getConversation = (conversationId: number) =>
  api.get<ConversationWithMessages>(`/conversations/${conversationId}`).then(res => res.data);

export const getConversationMessages = (conversationId: number) =>
  api.get<Message[]>(`/conversations/${conversationId}/messages`).then(res => res.data);

export const searchMessages = (query: string, projectId?: number) => {
  const params = { q: query, ...(projectId && { projectId }) };
  return api.get<SearchResult[]>('/search', { params }).then(res => res.data);
};

export const getConversationsByDate = (startDate?: string, endDate?: string, projectId?: number) => {
  const params = { 
    ...(startDate && { start: startDate }), 
    ...(endDate && { end: endDate }),
    ...(projectId && { projectId })
  };
  return api.get<Conversation[]>('/conversations/by-date', { params }).then(res => res.data);
};

export const getTodos = (sessionId: string) =>
  api.get<Todo[]>(`/todos/${sessionId}`).then(res => res.data);

// URL-based API functions for routing
export const getProjectByPath = (path: string) =>
  api.get<Project>('/projects/by-path', { params: { path } }).then(res => res.data);

export const getProjectConversationsByPath = async (path: string) => {
  // Two-step lookup: first get project ID by path, then get conversations by ID
  const project = await getProjectByPath(path);
  return getProjectConversations(project.id);
};

export const getConversationBySessionId = (sessionId: string) =>
  api.get<ConversationWithMessages>(`/conversations/by-session/${sessionId}`).then(res => res.data);

export const syncLogs = () =>
  api.post<{ success: boolean; message: string }>('/sync').then(res => res.data);