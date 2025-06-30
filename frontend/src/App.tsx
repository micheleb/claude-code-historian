import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectList } from './components/ProjectList';
import { ConversationList } from './components/ConversationList';
import { ConversationView } from './components/ConversationView';
import { SearchBar } from './components/SearchBar';
import { MessageSquare } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={24} className="text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Claude Code Historian
              </h1>
            </div>
            <div className="w-96">
              <SearchBar onSearch={(query) => console.log('Search:', query)} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <ProjectList
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
            />
          </div>

          {/* Conversations List */}
          {selectedProjectId && (
            <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <ConversationList
                projectId={selectedProjectId}
                selectedConversationId={selectedConversationId}
                onSelectConversation={setSelectedConversationId}
              />
            </div>
          )}

          {/* Conversation View */}
          <div className="flex-1 bg-white dark:bg-gray-800">
            {selectedConversationId ? (
              <ConversationView
                conversationId={selectedConversationId}
                onBack={() => setSelectedConversationId(null)}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">
                <MessageSquare size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {selectedProjectId 
                    ? "Select a conversation to view"
                    : "Select a project to get started"
                  }
                </p>
                <p className="text-sm opacity-70 mt-1">
                  {selectedProjectId 
                    ? "Choose from the conversation list to see your chat history"
                    : "Browse through your Claude Code projects"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;