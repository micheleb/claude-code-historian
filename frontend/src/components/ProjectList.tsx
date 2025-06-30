import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../lib/api';
import { FolderOpen, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProjectListProps {
  selectedProjectId: number | null;
  onSelectProject: (projectId: number) => void;
}

export function ProjectList({ selectedProjectId, onSelectProject }: ProjectListProps) {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

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
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FolderOpen size={20} />
        Projects
      </h2>
      
      <div className="space-y-1">
        {projects?.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              selectedProjectId === project.id
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : ""
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