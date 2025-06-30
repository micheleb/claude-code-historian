import { useEffect, useRef, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageBubble } from './MessageBubble';
import { ToolsBubble } from './ToolsBubble';
import { ScrollToTopButton } from './ScrollToTopButton';
import { getConversationBySessionId } from '../lib/api';
import { formatDate } from '../lib/utils';
import { MessageCircle, Clock, ChevronLeft } from 'lucide-react';

interface ConversationViewProps {
  sessionId: string;
}

export function ConversationView({ sessionId }: ConversationViewProps) {
  const navigate = useNavigate();
  const { projectPath: encodedProjectPath } = useParams<{ projectPath: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: conversation, isLoading, error } = useQuery({
    queryKey: ['conversation', sessionId],
    queryFn: () => getConversationBySessionId(sessionId),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

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

  return (
    <div className="flex flex-col h-full">
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
              <Fragment key={message.id}>
                {!isToolOnlyMessage && <MessageBubble message={message} />}
                {/* Show tools bubble after assistant messages that have tools */}
                {message.type === 'assistant' && message.tool_uses && message.tool_uses.length > 0 && (
                  <ToolsBubble tools={message.tool_uses} />
                )}
              </Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <ScrollToTopButton scrollContainerRef={messagesContainerRef} />
      </div>
    </div>
  );
}