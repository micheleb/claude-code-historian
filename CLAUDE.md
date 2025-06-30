# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Code Historian is a full-stack web application for visualizing and exploring Claude's conversation logs. It provides a chat-like dashboard interface for browsing historical conversations.

**Architecture**: TypeScript-based full-stack with Bun runtime, SQLite database, Hono API server, and React frontend.

## Development Commands

### Backend (Bun + Hono + SQLite)
- `cd backend && bun run dev` - Development server with watch mode
- `cd backend && bun run start` - Production server  
- `cd backend && bun run sync` - Sync Claude logs from ~/.claude/ to database
- `cd backend && bun run wipe-db` - Clear database files

### Frontend (React + Vite + TailwindCSS)
- `cd frontend && bun run dev` - Development server (Vite)
- `cd frontend && bun run build` - Production build
- `cd frontend && bun run lint` - ESLint linting
- `cd frontend && bun run preview` - Preview production build

## Code Architecture

### Backend Structure
- **API Layer**: `src/api/routes.ts` - Hono-based REST endpoints
- **Database**: `src/db/` - SQLite with FTS5 full-text search, normalized schema (Projects → Conversations → Messages → Tool Uses + Todos)
- **Sync System**: `src/sync/` - Parses Claude log files and populates database
- **Types**: `src/types/log.ts` - Shared TypeScript definitions

### Frontend Structure  
- **Three-Pane Layout**: Projects sidebar → Conversations list → Conversation view
- **Components**: `src/components/` - React components for chat UI, markdown rendering, tool visualization
- **API Client**: `src/lib/api.ts` - Axios-based API functions with React Query integration
- **Routing**: React Router with project path IDs taken from the backend's `path` field for deep linking

### Database Schema
- SQLite with FTS5 for message search
- Normalized: projects → conversations → messages → tool_uses + todos
- Indexed on conversation_id, project_id, timestamp for performance

### Key API Endpoints
- `GET /api/projects` - List all projects
- `GET /api/projects/:projectId/conversations` - Project conversations
- `GET /api/conversations/:conversationId/messages` - Conversation messages
- `GET /api/search?q=<query>` - Full-text search across messages
- `GET /api/todos/:sessionId` - Session todos

## Important Patterns

### URL Encoding
Project paths are base64-encoded for URL safety. Use utilities in `src/lib/urlUtils.ts` for encoding/decoding project paths.

### Message Structure
Messages contain tool uses (with inputs/outputs) and todos. Tool uses are rendered as collapsible sections in the UI.

### Search Implementation
Full-text search uses SQLite FTS5 with snippet generation and result highlighting. Search queries are passed directly to FTS.