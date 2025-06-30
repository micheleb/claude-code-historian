import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchMessages, type SearchResult } from '../lib/api';
import { formatRelativeDate, cn } from '../lib/utils';
import { MessageCircle, Clock, Search } from 'lucide-react';
import { encodePath } from '../lib/urlUtils';

export function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const projectId = searchParams.get('projectId');
  
  const { data: results, isLoading, error } = useQuery({
    queryKey: ['search', query, projectId],
    queryFn: () => searchMessages(query, projectId ? Number(projectId) : undefined),
    enabled: !!query.trim(),
  });

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the specific conversation with message targeting
    const encodedProjectPath = encodePath(result.project_path || '');
    navigate(`/projects/${encodedProjectPath}/conversations/${result.session_id}#message-${result.uuid}`);
  };

  if (!query.trim()) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-800">
        <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">
          <Search size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Enter a search query to get started</p>
          <p className="text-sm opacity-70 mt-1">Search across all your conversations</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-800 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Searching for "{query}"...
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-800">
        <div className="h-full flex flex-col items-center justify-center text-red-500">
          <Search size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Search failed</p>
          <p className="text-sm opacity-70 mt-1">Please try again</p>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-800">
        <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">
          <Search size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm opacity-70 mt-1">Try different keywords or check your spelling</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Search Results for "{query}"
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={`${result.id}-${result.conversation_id}`}
              onClick={() => handleResultClick(result)}
              className={cn(
                "border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer",
                "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              )}
            >
              {/* Header with project and conversation info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MessageCircle size={14} />
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {result.project_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{formatRelativeDate(result.timestamp)}</span>
                </div>
              </div>

              {/* Message type and role */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  result.type === 'user' 
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : result.type === 'assistant'
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                )}>
                  {result.role || result.type}
                </span>
              </div>

              {/* Search snippet with highlighting */}
              <div 
                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: result.snippet.replace(
                    /<mark>/g, 
                    '<mark class="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">'
                  )
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}