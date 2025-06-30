import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatShortDate, extractToolIcon, cn } from '../lib/utils';
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
      "flex w-full",
      isUser ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "max-w-[70%] rounded-lg p-4 mb-2",
        isUser 
          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
          : "bg-blue-500 text-white"
      )}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs opacity-70">
            {isUser ? 'You' : `Claude ${message.model ? `(${message.model})` : ''}`}
          </span>
          <span className="text-xs opacity-70">
            {formatShortDate(message.timestamp)}
          </span>
        </div>
        
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {hasTools && (
          <div className="mt-3 border-t border-opacity-20 pt-2">
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100"
            >
              {toolsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {message.tool_uses.length} tool{message.tool_uses.length !== 1 ? 's' : ''} used
            </button>
            
            {toolsExpanded && (
              <div className="mt-2 space-y-2">
                {message.tool_uses.map((tool) => (
                  <div 
                    key={tool.id} 
                    className="bg-black bg-opacity-10 rounded p-2 text-xs"
                  >
                    <div className="flex items-center gap-1 font-semibold mb-1">
                      <span>{extractToolIcon(tool.tool_name)}</span>
                      <span>{tool.tool_name}</span>
                    </div>
                    <div className="font-mono text-xs opacity-80 overflow-x-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(JSON.parse(tool.input), null, 2)}
                      </pre>
                    </div>
                    {tool.result && (
                      <div className="mt-2 pt-2 border-t border-opacity-20">
                        <div className="text-xs opacity-70 mb-1">Result:</div>
                        <pre className="whitespace-pre-wrap text-xs opacity-80">
                          {tool.result}
                        </pre>
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