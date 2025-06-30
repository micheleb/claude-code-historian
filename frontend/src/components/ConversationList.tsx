import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjectConversations } from '../lib/api';
import { formatRelativeDate, cn } from '../lib/utils';
import { MessageCircle, Clock } from 'lucide-react';

interface ConversationListProps {
  projectId: number;
  selectedConversationId: number | null;
  onSelectConversation: (conversationId: number) => void;
}

export function ConversationList({ 
  projectId, 
  selectedConversationId, 
  onSelectConversation 
}: ConversationListProps) {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => getProjectConversations(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No conversations found
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
        Conversations
      </h3>
      
      <div className="space-y-1">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              selectedConversationId === conversation.id
                ? "bg-gray-100 dark:bg-gray-800 border-l-2 border-blue-500"
                : ""
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {conversation.summary ? (
                  <div className="font-medium text-sm truncate">
                    {conversation.summary}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No summary
                  </div>
                )}
                
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>{formatRelativeDate(conversation.started_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={10} />
                    <span>{conversation.message_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}