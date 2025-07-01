import { format } from 'date-fns';
import type { ConversationWithMessages } from './api';
import { decodePath } from './urlUtils';

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export async function shareConversation(
  conversation: ConversationWithMessages, 
  encodedProjectPath: string
): Promise<void> {
  // Format the filename using project path from URL (more consistent with backend)
  let projectPath = 'conversation';
  if (encodedProjectPath) {
    try {
      const decodedPath = decodePath(encodedProjectPath);
      // Remove leading dash and use path directly
      projectPath = decodedPath.startsWith('-') ? decodedPath.slice(1) : decodedPath;
    } catch {
      // Fallback to project name if URL decoding fails
      projectPath = conversation.project_name?.toLowerCase().replace(/\s+/g, '-') || 'conversation';
    }
  } else {
    // Fallback to project name
    projectPath = conversation.project_name?.toLowerCase().replace(/\s+/g, '-') || 'conversation';
  }
  
  const timestamp = format(new Date(conversation.started_at), 'yyyyMMdd-HHmm');
  const filename = `${projectPath}-${timestamp}.html`;
  
  // Generate the HTML content
  const htmlContent = generateHTML(conversation);
  
  // Create a blob and download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateHTML(conversation: ConversationWithMessages): string {
  const messages = conversation.messages.map(message => {
    const isUser = message.type === 'user';
    const hasTools = message.tool_uses && message.tool_uses.length > 0;
    const isToolOnly = message.type === 'assistant' && message.content.trim() === '' && hasTools;
    const isTodoMessage = detectTodoMessage(message.content);
    
    let messageHTML = '';
    
    // Skip rendering message bubble for tool-only messages
    if (!isToolOnly && message.content.trim()) {
      // Special handling for todo messages
      if (isTodoMessage) {
        const todos = parseTodoDataFromMessage(message.content);
        messageHTML += `
          <div class="message ${isUser ? 'message-user' : 'message-assistant'}">
            <div class="message-header">
              <span class="message-role">${isUser ? 'User' : 'Assistant'}</span>
              <span class="message-time">${format(new Date(message.timestamp), 'h:mm a')}</span>
            </div>
            <div class="message-content">
              ${todos ? renderTodoList(todos) : formatContent(message.content)}
            </div>
          </div>
        `;
      } else {
        messageHTML += `
          <div class="message ${isUser ? 'message-user' : 'message-assistant'}">
            <div class="message-header">
              <span class="message-role">${isUser ? 'User' : 'Assistant'}</span>
              <span class="message-time">${format(new Date(message.timestamp), 'h:mm a')}</span>
            </div>
            <div class="message-content">
              ${formatContent(message.content)}
            </div>
          </div>
        `;
      }
    }
    
    // Add tools if present
    if (hasTools) {
      messageHTML += `
        <div class="tools-container">
          ${message.tool_uses.map(tool => {
            const isTodoTool = tool.tool_name === 'TodoWrite';
            const todos = isTodoTool ? parseTodoDataFromTool(tool) : null;
            
            return `
              <details class="tool-details">
                <summary class="tool-summary">
                  <span class="tool-icon">${getToolIcon(tool.tool_name)}</span>
                  <span class="tool-name">${formatToolName(tool.tool_name)}</span>
                </summary>
                <div class="tool-content">
                  ${isTodoTool && todos ? `
                    <div class="tool-section">
                      <h4>Todo List</h4>
                      ${renderTodoList(todos)}
                    </div>
                  ` : `
                    ${tool.input ? `
                      <div class="tool-section">
                        <h4>Input</h4>
                        <pre><code>${escapeHtml(tool.input)}</code></pre>
                      </div>
                    ` : ''}
                    ${tool.result ? `
                      <div class="tool-section">
                        <h4>Output</h4>
                        <pre><code>${escapeHtml(tool.result)}</code></pre>
                      </div>
                    ` : ''}
                  `}
                </div>
              </details>
            `;
          }).join('')}
        </div>
      `;
    }
    
    return messageHTML;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${conversation.project_name} - ${format(new Date(conversation.started_at), 'MMM d, yyyy')}</title>
  <style>
    ${getInlineStyles()}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(conversation.project_name || 'Conversation')}</h1>
      <div class="header-info">
        <span>${format(new Date(conversation.started_at), 'MMMM d, yyyy h:mm a')}</span>
        <span>${conversation.messages.length} messages</span>
      </div>
      ${conversation.summary ? `<p class="summary">${escapeHtml(conversation.summary)}</p>` : ''}
    </header>
    
    <main>
      ${messages}
    </main>
    
    <footer>
      <p>Exported from Claude Code Historian on ${format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
    </footer>
  </div>
</body>
</html>`;
}

function getInlineStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a202c;
      background-color: #f7fafc;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background-color: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    header h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .header-info {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #718096;
    }
    
    .summary {
      margin-top: 12px;
      font-style: italic;
      color: #718096;
    }
    
    .message {
      margin-bottom: 16px;
      padding: 16px;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .message-user {
      background-color: #ebf8ff;
      margin-left: 40px;
    }
    
    .message-assistant {
      background-color: #f0fff4;
      margin-right: 40px;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .message-role {
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .message-user .message-role {
      color: #2b6cb0;
    }
    
    .message-assistant .message-role {
      color: #276749;
    }
    
    .message-time {
      color: #a0aec0;
    }
    
    .message-content {
      color: #2d3748;
    }
    
    .message-content p {
      margin-bottom: 8px;
    }
    
    .message-content p:last-child {
      margin-bottom: 0;
    }
    
    .message-content pre {
      background-color: #1e1e1e;
      color: #d4d4d4;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 8px 0;
    }
    
    .message-content code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
      font-size: 13px;
    }
    
    .message-content pre code {
      background: none;
      padding: 0;
    }
    
    .message-content :not(pre) > code {
      background-color: #e2e8f0;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    
    .message-content blockquote {
      border-left: 4px solid #e2e8f0;
      padding-left: 16px;
      margin: 8px 0;
      color: #718096;
    }
    
    .message-content ul, .message-content ol {
      margin: 8px 0;
      padding-left: 24px;
    }
    
    .message-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 8px 0;
    }
    
    .message-content th, .message-content td {
      border: 1px solid #e2e8f0;
      padding: 8px;
      text-align: left;
    }
    
    .message-content th {
      background-color: #f7fafc;
      font-weight: 600;
    }
    
    .tools-container {
      margin-bottom: 16px;
      margin-left: 40px;
      margin-right: 40px;
    }
    
    .tool-details {
      background-color: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 8px;
      overflow: hidden;
    }
    
    .tool-summary {
      padding: 12px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #f7fafc;
      user-select: none;
    }
    
    .tool-summary:hover {
      background-color: #edf2f7;
    }
    
    .tool-icon {
      font-size: 16px;
    }
    
    .tool-name {
      font-weight: 500;
      color: #2d3748;
    }
    
    .tool-content {
      padding: 16px;
      border-top: 1px solid #e2e8f0;
    }
    
    .tool-section {
      margin-bottom: 16px;
    }
    
    .tool-section:last-child {
      margin-bottom: 0;
    }
    
    .tool-section h4 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #718096;
      margin-bottom: 8px;
    }
    
    .tool-section pre {
      background-color: #f7fafc;
      border: 1px solid #e2e8f0;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
    
    .tool-section code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
      font-size: 13px;
      color: #2d3748;
    }
    
    .todo-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .todo-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 14px;
    }
    
    .todo-icon {
      margin-top: 2px;
      font-size: 16px;
    }
    
    .todo-content {
      flex: 1;
    }
    
    .todo-completed {
      text-decoration: line-through;
      opacity: 0.75;
    }
    
    .todo-in-progress {
      font-weight: 600;
    }
    
    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #a0aec0;
      font-size: 14px;
    }
    
    @media print {
      body {
        background-color: white;
      }
      
      .container {
        max-width: 100%;
        padding: 0;
      }
      
      .message, header {
        box-shadow: none;
        border: 1px solid #e2e8f0;
      }
      
      .message-user, .message-assistant {
        margin: 0 0 16px 0;
      }
      
      .tools-container {
        margin: 0 0 16px 0;
      }
    }
    
    @media (max-width: 640px) {
      .container {
        padding: 12px;
      }
      
      .message-user, .message-assistant {
        margin-left: 0;
        margin-right: 0;
      }
      
      .tools-container {
        margin-left: 0;
        margin-right: 0;
      }
    }
  `;
}

function formatContent(content: string): string {
  // Basic markdown parsing
  let html = escapeHtml(content);
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (para.startsWith('<') || para.trim() === '') return para;
    return `<p>${para}</p>`;
  }).join('\n');
  
  return html;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getToolIcon(toolName: string): string {
  const icons: Record<string, string> = {
    Bash: '🔧',
    Edit: '✏️',
    Read: '📖',
    Write: '📝',
    WebSearch: '🔍',
    WebFetch: '🌐',
    TodoRead: '📋',
    TodoWrite: '✓',
    Task: '🤖',
    MultiEdit: '✏️',
    NotebookRead: '📔',
    NotebookEdit: '📝',
    Grep: '🔍',
    Glob: '🗂️',
    LS: '📁',
    exit_plan_mode: '🎯',
    Ask: '❓',
  };
  
  return icons[toolName] || '🔧';
}

function formatToolName(name: string): string {
  // Add spaces before capitals and handle special cases
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^_/, '')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function detectTodoMessage(content: string): boolean {
  return content.includes('"todos"') && 
         content.includes('[') && 
         content.includes(']');
}

function parseTodoDataFromTool(tool: { input: string }): TodoItem[] | null {
  try {
    const parsed = JSON.parse(tool.input);
    if (parsed.todos && Array.isArray(parsed.todos)) {
      return parsed.todos as TodoItem[];
    }
  } catch (error) {
    console.warn('Failed to parse todo data from tool:', error);
  }
  return null;
}

function parseTodoDataFromMessage(content: string): TodoItem[] | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.todos && Array.isArray(parsed.todos)) {
        return parsed.todos as TodoItem[];
      }
    }
  } catch (error) {
    console.warn('Failed to parse todo data from message:', error);
  }
  return null;
}

function renderTodoList(todos: TodoItem[]): string {
  return `
    <div class="todo-list">
      ${todos.map(todo => `
        <div class="todo-item">
          <span class="todo-icon">
            ${todo.status === 'completed' ? '☑' : 
              todo.status === 'in_progress' ? '◐' : '☐'}
          </span>
          <span class="todo-content ${
            todo.status === 'completed' ? 'todo-completed' : 
            todo.status === 'in_progress' ? 'todo-in-progress' : ''
          }">
            ${escapeHtml(todo.content)}
          </span>
        </div>
      `).join('')}
    </div>
  `;
}