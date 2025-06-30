import { formatShortDate, cn } from '../lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '../lib/api';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';

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
          <span className="text-xs opacity-60">
            {formatShortDate(message.timestamp)}
          </span>
        </div>
        
        <MarkdownRenderer 
          content={message.content} 
          isUserMessage={isUser}
          className="text-inherit"
        />
      </div>
    </div>
  );
}