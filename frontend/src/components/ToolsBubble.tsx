import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { extractToolIcon, cn } from '../lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { globalExpandActionAtom } from '../stores/expandCollapseStore';
import type { ToolUse } from '../lib/api';

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface ToolsBubbleProps {
  tools: ToolUse[];
}

interface ToolItemProps {
  tool: ToolUse;
  isUserMessage?: boolean;
  forceExpanded?: boolean;
  forceCollapsed?: boolean;
  onToggle?: (expanded: boolean) => void;
}

function ToolItem({ tool, isUserMessage = false, forceExpanded, forceCollapsed, onToggle }: ToolItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [resultExpanded, setResultExpanded] = useState(false);

  // Check if this is a TodoWrite tool
  const isTodoWrite = tool.tool_name === 'TodoWrite';
  
  // Parse TodoWrite input data
  const parseTodoData = (): TodoItem[] | null => {
    if (!isTodoWrite) return null;
    
    try {
      const inputData = JSON.parse(tool.input);
      if (inputData.todos && Array.isArray(inputData.todos)) {
        return inputData.todos as TodoItem[];
      }
    } catch (error) {
      console.warn('Failed to parse TodoWrite input:', error);
    }
    return null;
  };

  // Sync with parent's force expand/collapse state
  useEffect(() => {
    if (forceExpanded === true) {
      setExpanded(true);
    }
  }, [forceExpanded]);

  useEffect(() => {
    if (forceCollapsed === true) {
      setExpanded(false);
    }
  }, [forceCollapsed]);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <div className={cn(
      "border rounded-lg mb-2 last:mb-0",
      isUserMessage 
        ? "border-gray-200 dark:border-gray-600" 
        : "border-white border-opacity-20"
    )}>
      {/* Tool Header - Always Visible */}
      <button
        onClick={handleToggle}
        className={cn(
          "w-full p-3 flex items-center gap-2 text-left rounded-lg transition-colors",
          "hover:bg-black hover:bg-opacity-5",
          isUserMessage 
            ? "hover:bg-gray-200 dark:hover:bg-gray-600" 
            : "hover:bg-white hover:bg-opacity-10"
        )}
        data-testid="tool-toggle-button"
      >
        {expanded ? <ChevronDown size={16} data-testid="chevron-down" /> : <ChevronRight size={16} data-testid="chevron-right" />}
        <span className="text-lg">{extractToolIcon(tool.tool_name)}</span>
        <span className="font-medium">{tool.tool_name}</span>
        <span className="text-xs opacity-70 ml-auto">
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {/* Tool Content - Collapsible */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Special rendering for TodoWrite */}
          {isTodoWrite ? (
            <div>
              <div className="text-xs font-medium opacity-80 mb-2">
                Todo List
              </div>
              <div className="space-y-1">
                {parseTodoData()?.map((todo: TodoItem) => (
                  <div key={todo.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5">
                      {todo.status === 'completed' ? '☑' : 
                       todo.status === 'in_progress' ? '◐' : '☐'}
                    </span>
                    <span className={cn(
                      "flex-1",
                      todo.status === 'completed' && "line-through opacity-75",
                      todo.status === 'in_progress' && "font-semibold"
                    )}>
                      {todo.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Regular tool input for non-TodoWrite tools */
            <div>
              <div className="text-xs font-medium opacity-80 mb-1">
                Input Parameters
              </div>
              <SyntaxHighlighter
                style={isUserMessage ? oneLight : oneDark}
                language="json"
                PreTag="div"
                className="rounded-md overflow-hidden"
                customStyle={{
                  margin: 0,
                  fontSize: '0.75rem',
                  lineHeight: '1.25rem',
                  padding: '0.75rem',
                }}
              >
                {JSON.stringify(JSON.parse(tool.input), null, 2)}
              </SyntaxHighlighter>
            </div>
          )}

          {/* Tool Result Section */}
          {tool.result && (
            <div>
              <button
                onClick={() => setResultExpanded(!resultExpanded)}
                className="flex items-center gap-1 text-xs font-medium opacity-80 hover:opacity-100 mb-1"
              >
                {resultExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Result
              </button>
              
              {resultExpanded && (
                <div className={cn(
                  "rounded p-2",
                  isUserMessage
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    : "bg-black bg-opacity-10"
                )}>
                  <MarkdownRenderer 
                    content={tool.result} 
                    isUserMessage={isUserMessage}
                    className="text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolsBubble({ tools }: ToolsBubbleProps) {
  const [localForceExpanded, setLocalForceExpanded] = useState(false);
  const [localForceCollapsed, setLocalForceCollapsed] = useState(false);
  const [lastGlobalTimestamp, setLastGlobalTimestamp] = useState<number>(0);
  
  // Subscribe to global expand/collapse actions
  const globalAction = useAtomValue(globalExpandActionAtom);

  // React to global expand/collapse actions (only once per timestamp)
  useEffect(() => {
    if (globalAction && globalAction.timestamp > lastGlobalTimestamp) {
      if (globalAction.action === 'expand') {
        setLocalForceExpanded(true);
        setTimeout(() => setLocalForceExpanded(false), 100);
      } else {
        setLocalForceCollapsed(true);
        setTimeout(() => setLocalForceCollapsed(false), 100);
      }
      setLastGlobalTimestamp(globalAction.timestamp);
    }
  }, [globalAction, lastGlobalTimestamp]);

  if (!tools || tools.length === 0) {
    return null;
  }

  // Individual ToolsBubble toggle - uses same pattern as global
  const handleExpandAll = () => {
    setLocalForceExpanded(true);
    setTimeout(() => setLocalForceExpanded(false), 100);
  };

  const handleCollapseAll = () => {
    setLocalForceCollapsed(true);
    setTimeout(() => setLocalForceCollapsed(false), 100);
  };

  return (
    <div className={cn(
      "flex w-full mb-4",
      "justify-end" // Always position like Claude's messages
    )}>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm rounded-br-sm",
        "bg-orange-500 dark:bg-orange-600 text-white"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            <span className="font-medium">Tools Used</span>
            <span className="text-xs opacity-70">({tools.length})</span>
          </div>
          {tools.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExpandAll}
                className="text-xs opacity-80 hover:opacity-100 transition-opacity"
              >
                Expand All
              </button>
              <button
                onClick={handleCollapseAll}
                className="text-xs opacity-80 hover:opacity-100 transition-opacity"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Tools List */}
        <div className="space-y-1">
          {tools.map((tool) => (
            <ToolItem 
              key={tool.id} 
              tool={tool} 
              isUserMessage={false} // Tools bubble always has dark background
              forceExpanded={localForceExpanded}
              forceCollapsed={localForceCollapsed}
            />
          ))}
        </div>
      </div>
    </div>
  );
}