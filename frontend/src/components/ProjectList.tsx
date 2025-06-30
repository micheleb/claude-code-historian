import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjects, type Project } from '../lib/api';
import { FolderOpen, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { encodePath, decodePath } from '../lib/urlUtils';

export function ProjectList() {
  const navigate = useNavigate();
  const { projectPath: encodedProjectPath } = useParams<{ projectPath: string }>();
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const selectedProjectPath = encodedProjectPath ? decodePath(encodedProjectPath) : null;

  const handleProjectClick = (project: Project) => {
    // Use Claude path directly, just URL encode it
    const encodedPath = encodePath(project.path);
    navigate(`/projects/${encodedPath}`);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
        <FolderOpen size={20} />
        Projects
      </h2>
      
      <div className="space-y-1">
        {projects?.map((project) => (
          <button
            key={project.id}
            onClick={() => handleProjectClick(project)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              selectedProjectPath === project.path
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-gray-900 dark:text-gray-100"
            )}
          >
            <div className="font-medium">{project.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <MessageSquare size={12} />
              {project.conversation_count} conversations
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}