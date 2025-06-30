import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import { ProjectList } from './components/ProjectList';
import { ConversationList } from './components/ConversationList';
import { ConversationView } from './components/ConversationView';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { decodePath, isValidPath, isValidSessionId } from './lib/urlUtils';
import { syncLogs } from './lib/api';
import { useState } from 'react';

const queryClient = new QueryClient();

// Refresh button component
function RefreshButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSync = async () => {
    setIsLoading(true);
    setStatus('idle');
    
    try {
      await syncLogs();
      setStatus('success');
      queryClient.invalidateQueries();
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      console.error('Sync failed:', error);
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        status === 'success'
          ? 'text-green-700 bg-green-50 border border-green-200'
          : status === 'error'
          ? 'text-red-700 bg-red-50 border border-red-200'
          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Sync Claude logs from ~/.claude/ directory"
    >
      <RefreshCw 
        size={16} 
        className={`${isLoading ? 'animate-spin' : ''} ${
          status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : ''
        }`} 
      />
      {isLoading ? 'Syncing...' : status === 'success' ? 'Synced!' : status === 'error' ? 'Failed' : 'Refresh'}
    </button>
  );
}

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
              <Link 
                to="/" 
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
              >
                <MessageSquare 
                  size={24} 
                  className="text-blue-600 group-hover:text-blue-700 transition-colors" 
                />
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                  Claude Code Historian
                </h1>
              </Link>
              <div className="flex items-center gap-4">
                <RefreshButton />
                <div className="w-96">
                  <SearchBar />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content with Routes */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/projects/:projectPath" element={<ProjectPage />} />
            <Route path="/projects/:projectPath/conversations/:sessionId" element={<ConversationPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;