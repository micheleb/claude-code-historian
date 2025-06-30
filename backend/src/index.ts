import app from './api/routes';

const port = process.env.PORT || 3001;

console.log(`Claude Log Historian API Server`);
console.log(`==============================`);
console.log(`Starting server on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};

console.log(`Server running at http://localhost:${port}`);
console.log(`\\nAvailable endpoints:`);
console.log(`  GET /api/projects`);
console.log(`  GET /api/projects/:projectId/conversations`);
console.log(`  GET /api/conversations/:conversationId`);
console.log(`  GET /api/conversations/:conversationId/messages`);
console.log(`  GET /api/conversations/by-date`);
console.log(`  GET /api/search?q=<query>`);
console.log(`  GET /api/todos/:sessionId`);