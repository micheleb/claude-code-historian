import { formatShortDate, cn } from '../lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '../lib/api';

interface MessageBubbleProps {
  message: Message;
}

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  
  // Detect command messages
  const isCommandMessage = 
    message.content.startsWith('<command-name>') && 
    message.content.includes('<command-message>');
  
  // Detect TodoWrite messages (JSON with todos array)
  const isTodoWriteMessage = message.content.includes('"todos"') && 
    message.content.includes('[') && 
    message.content.includes(']');
  
  // Extract command info if it's a command message
  const getCommandInfo = () => {
    if (!isCommandMessage) return null;
    
    const commandMessageMatch = message.content.match(/<command-message>(.*?)<\/command-message>/);
    const commandNameMatch = message.content.match(/<command-name>(.*?)<\/command-name>/);
    
    return {
      commandMessage: commandMessageMatch?.[1] || '',
      commandName: commandNameMatch?.[1] || ''
    };
  };

  // Parse todo data from TodoWrite JSON
  const parseTodoData = (): TodoItem[] | null => {
    if (!isTodoWriteMessage) return null;
    
    try {
      // Try to extract JSON from the message content
      const jsonMatch = message.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const jsonData = JSON.parse(jsonMatch[0]);
      if (jsonData.todos && Array.isArray(jsonData.todos)) {
        return jsonData.todos as TodoItem[];
      }
    } catch (error) {
      console.warn('Failed to parse TodoWrite JSON:', error);
    }
    return null;
  };

  const handleTimestampClick = () => {
    // Update URL hash to this message
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = `message-${message.uuid}`;
    window.history.replaceState({}, '', currentUrl.toString());
    
    // Optionally, copy link to clipboard
    navigator.clipboard.writeText(currentUrl.toString());
  };

  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
        isUser 
          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm" 
          : "bg-blue-500 dark:bg-blue-600 text-white rounded-br-sm"
      )}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-medium opacity-75">
            {isUser ? 'You' : `Claude`}
          </span>
          <button 
            onClick={handleTimestampClick}
            className="text-xs opacity-60 hover:opacity-100 hover:underline cursor-pointer transition-opacity"
            title="Click to copy link to this message"
          >
            {formatShortDate(message.timestamp)}
          </button>
        </div>
        
{isTodoWriteMessage ? (
          <div>
            <div className="font-semibold mb-2 text-inherit">
              Todo List
            </div>
            <div className="space-y-1">
              {parseTodoData()?.map((todo: TodoItem) => (
                <div key={todo.id} className="flex items-start gap-2 text-sm">
                  <span className="text-inherit mt-0.5">
                    {todo.status === 'completed' ? '☑' : 
                     todo.status === 'in_progress' ? '◐' : '☐'}
                  </span>
                  <span className={cn(
                    "text-inherit flex-1",
                    todo.status === 'completed' && "line-through opacity-75",
                    todo.status === 'in_progress' && "font-semibold"
                  )}>
                    {todo.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : isCommandMessage ? (
          <div>
            {getCommandInfo()?.commandName === 'clear' ? (
              <div className="font-semibold">
                Clear context
              </div>
            ) : (
              <>
                <div className="font-semibold mb-1">
                  Run {getCommandInfo()?.commandName}
                </div>
                <div className="text-inherit">
                  {getCommandInfo()?.commandMessage}
                </div>
              </>
            )}
          </div>
        ) : (
          <MarkdownRenderer 
            content={message.content}
            isUserMessage={isUser}
            className="text-inherit"
          />
        )}
      </div>
    </div>
  );
}