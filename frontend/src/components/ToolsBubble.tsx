import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { extractToolIcon, cn } from '../lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { ToolUse } from '../lib/api';

interface ToolsBubbleProps {
  tools: ToolUse[];
}

interface ToolItemProps {
  tool: ToolUse;
  isUserMessage?: boolean;
  forceExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

function ToolItem({ tool, isUserMessage = false, forceExpanded, onToggle }: ToolItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [resultExpanded, setResultExpanded] = useState(false);

  // Sync with parent's expand all state
  useEffect(() => {
    if (forceExpanded !== undefined) {
      setExpanded(forceExpanded);
    }
  }, [forceExpanded]);

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
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="text-lg">{extractToolIcon(tool.tool_name)}</span>
        <span className="font-medium">{tool.tool_name}</span>
        <span className="text-xs opacity-70 ml-auto">
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {/* Tool Content - Collapsible */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Tool Input Section - Always Visible */}
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
  const [allExpanded, setAllExpanded] = useState(false);

  if (!tools || tools.length === 0) {
    return null;
  }

  const handleToggleAll = () => {
    setAllExpanded(!allExpanded);
  };

  const handleToolToggle = (expanded: boolean) => {
    // If user manually collapses any tool while "all expanded" is active, 
    // reset the "expand all" state
    if (allExpanded && !expanded) {
      setAllExpanded(false);
    }
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
          <button
            onClick={handleToggleAll}
            className="text-xs opacity-80 hover:opacity-100 transition-opacity"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Tools List */}
        <div className="space-y-1">
          {tools.map((tool) => (
            <ToolItem 
              key={tool.id} 
              tool={tool} 
              isUserMessage={false} // Tools bubble always has dark background
              forceExpanded={allExpanded}
              onToggle={handleToolToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}