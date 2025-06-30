import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { ProjectList } from './components/ProjectList';
import { ConversationList } from './components/ConversationList';
import { ConversationView } from './components/ConversationView';
import { SearchBar } from './components/SearchBar';
import { MessageSquare } from 'lucide-react';
import { decodePath, isValidPath, isValidSessionId } from './lib/urlUtils';

const queryClient = new QueryClient();

// Home page component (project list only)
function HomePage() {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <ProjectList />
      </div>

      {/* Empty state */}
      <div className="flex-1 bg-white dark:bg-gray-800">
        <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">
          <MessageSquare size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a project to get started</p>
          <p className="text-sm opacity-70 mt-1">Browse through your Claude Code projects</p>
        </div>
      </div>
    </div>
  );
}

// Project page component (project + conversations list)
function ProjectPage() {
  const { projectPath: encodedProjectPath } = useParams<{ projectPath: string }>();
  
  if (!encodedProjectPath) {
    return <div className="flex-1 flex items-center justify-center text-red-500">Invalid project</div>;
  }

  const projectPath = decodePath(encodedProjectPath);
  
  if (!isValidPath(projectPath)) {
    return <div className="flex-1 flex items-center justify-center text-red-500">Invalid project path</div>;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <ProjectList />
      </div>

      {/* Conversations List */}
      <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <ConversationList projectPath={projectPath} />
      </div>

      {/* Empty state */}
      <div className="flex-1 bg-white dark:bg-gray-800">
        <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">
          <MessageSquare size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a conversation to view</p>
          <p className="text-sm opacity-70 mt-1">Choose from the conversation list to see your chat history</p>
        </div>
      </div>
    </div>
  );
}

// Conversation page component (full three-pane layout)
function ConversationPage() {
  const { projectPath: encodedProjectPath, sessionId } = useParams<{ projectPath: string; sessionId: string }>();
  
  if (!encodedProjectPath) {
    return <div className="flex-1 flex items-center justify-center text-red-500">Invalid project</div>;
  }

  const projectPath = decodePath(encodedProjectPath);
  
  if (!isValidPath(projectPath)) {
    return <div className="flex-1 flex items-center justify-center text-red-500">Invalid project path</div>;
  }
  
  if (!sessionId || !isValidSessionId(sessionId)) {
    return <div className="flex-1 flex items-center justify-center text-red-500">Invalid session</div>;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <ProjectList />
      </div>

      {/* Conversations List */}
      <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <ConversationList projectPath={projectPath} selectedSessionId={sessionId} />
      </div>

      {/* Conversation View */}
      <div className="flex-1 bg-white dark:bg-gray-800">
        <ConversationView sessionId={sessionId} />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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

          {/* Main Content with Routes */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects/:projectPath" element={<ProjectPage />} />
            <Route path="/projects/:projectPath/conversations/:sessionId" element={<ConversationPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;