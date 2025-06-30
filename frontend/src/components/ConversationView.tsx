import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageBubble } from './MessageBubble';
import { getConversation } from '../lib/api';
import { formatDate } from '../lib/utils';
import { MessageCircle, Clock, ChevronLeft } from 'lucide-react';

interface ConversationViewProps {
  conversationId: number;
  onBack: () => void;
}

export function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: conversation, isLoading, error } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold flex-1">{conversation.project_name}</h2>
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
      <div className="flex-1 overflow-y-auto p-4">
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}