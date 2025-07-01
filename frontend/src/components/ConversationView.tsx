import { useEffect, useRef, useState, useTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { MessageBubble } from './MessageBubble';
import { ToolsBubble } from './ToolsBubble';
import { ScrollToTopButton } from './ScrollToTopButton';
import { getConversationBySessionId } from '../lib/api';
import { formatDate } from '../lib/utils';
import { triggerGlobalExpandAtom, isGlobalLoadingAtom } from '../stores/expandCollapseStore';
import { MessageCircle, Clock, ChevronLeft, ChevronDown, ChevronUp, Loader2, Share } from 'lucide-react';

interface ConversationViewProps {
  sessionId: string;
}

export function ConversationView({ sessionId }: ConversationViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectPath: encodedProjectPath } = useParams<{ projectPath: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Jotai atoms for expand/collapse functionality
  const triggerGlobalExpand = useSetAtom(triggerGlobalExpandAtom);
  const isGlobalLoading = useAtomValue(isGlobalLoadingAtom);
  const [isPending, startTransition] = useTransition();
  const [isSharing, setIsSharing] = useState(false);
  
  // Extract target message from URL hash
  const targetMessageId = location.hash.replace('#message-', '');
  
  const { data: conversation, isLoading, error } = useQuery({
    queryKey: ['conversation', sessionId],
    queryFn: () => getConversationBySessionId(sessionId),
  });

  useEffect(() => {
    if (!conversation?.messages) return;
    
    // If there's a target message, scroll to it
    if (targetMessageId) {
      setTimeout(() => {
        const targetElement = document.getElementById(`message-${targetMessageId}`);
        if (targetElement) {
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Brief highlight animation
          targetElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          setTimeout(() => {
            targetElement.style.backgroundColor = '';
          }, 2000);
        }
      }, 100);
    }
  }, [conversation?.messages, targetMessageId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading conversation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error loading conversation</div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const handleBack = () => {
    if (encodedProjectPath) {
      navigate(`/projects/${encodedProjectPath}`);
    } else {
      navigate('/');
    }
  };

  const handleExpandAll = () => {
    startTransition(() => {
      triggerGlobalExpand('expand');
    });
  };

  const handleCollapseAll = () => {
    startTransition(() => {
      triggerGlobalExpand('collapse');
    });
  };

  const handleShare = async () => {
    if (!conversation) return;
    
    setIsSharing(true);
    try {
      // Import the share function lazily to keep bundle size down
      const { shareConversation } = await import('../lib/shareConversation');
      await shareConversation(conversation, encodedProjectPath || '');
    } catch (error) {
      console.error('Error sharing conversation:', error);
      // Could add a toast notification here
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="conversation-view">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-900 dark:text-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold flex-1 text-gray-900 dark:text-gray-100">{conversation.project_name}</h2>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{formatDate(conversation.started_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle size={14} />
            <span>{conversation.messages.length} messages</span>
          </div>
          
          {/* Expand/Collapse All Buttons */}
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={handleExpandAll}
              disabled={isGlobalLoading || isPending}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGlobalLoading || isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ChevronDown size={12} />
              )}
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              disabled={isGlobalLoading || isPending}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGlobalLoading || isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ChevronUp size={12} />
              )}
              Collapse All
            </button>
            
            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Share size={12} />
              )}
              Share
            </button>
          </div>
        </div>
        
        {conversation.summary && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
            {conversation.summary}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 relative">
        <div className="max-w-4xl mx-auto">
          {conversation.messages.map((message) => {
            // Skip MessageBubble for tool-only assistant messages (empty content but has tools)
            const isToolOnlyMessage = message.type === 'assistant' && 
                                     message.content.trim() === '' && 
                                     message.tool_uses && 
                                     message.tool_uses.length > 0;
            
            return (
              <div key={message.id} id={`message-${message.uuid}`} className="scroll-mt-4">
                {!isToolOnlyMessage && <MessageBubble message={message} />}
                {/* Show tools bubble after assistant messages that have tools */}
                {message.type === 'assistant' && message.tool_uses && message.tool_uses.length > 0 && (
                  <ToolsBubble 
                    key={`tools-${message.uuid}`}
                    tools={message.tool_uses}
                  />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <ScrollToTopButton scrollContainerRef={messagesContainerRef} />
      </div>
    </div>
  );
}