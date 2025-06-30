import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatShortDate, extractToolIcon, cn } from '../lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '../lib/api';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const isUser = message.type === 'user';
  const hasTools = message.tool_uses && message.tool_uses.length > 0;

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

        {hasTools && (
          <div className="mt-3 border-t border-white border-opacity-20 pt-3">
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="flex items-center gap-2 text-xs opacity-80 hover:opacity-100 transition-opacity"
            >
              {toolsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="font-medium">
                {message.tool_uses.length} tool{message.tool_uses.length !== 1 ? 's' : ''} used
              </span>
            </button>
            
            {toolsExpanded && (
              <div className="mt-3 space-y-2">
                {message.tool_uses.map((tool) => (
                  <div 
                    key={tool.id} 
                    className={cn(
                      "rounded-lg p-3 text-xs border",
                      isUser 
                        ? "bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500" 
                        : "bg-blue-400 bg-opacity-30 border-white border-opacity-20"
                    )}
                  >
                    <div className="flex items-center gap-2 font-semibold mb-2">
                      <span className="text-sm">{extractToolIcon(tool.tool_name)}</span>
                      <span>{tool.tool_name}</span>
                    </div>
                    <div className="font-mono text-xs opacity-80 overflow-x-auto">
                      <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded p-2">
                        {JSON.stringify(JSON.parse(tool.input), null, 2)}
                      </pre>
                    </div>
                    {tool.result && (
                      <div className="mt-2 pt-2 border-t border-opacity-20">
                        <div className="text-xs opacity-70 mb-1 font-medium">Result:</div>
                        <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded p-2">
                          <MarkdownRenderer 
                            content={tool.result} 
                            isUserMessage={isUser}
                            className="text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}