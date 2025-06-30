import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'PPp');
}

export function formatRelativeDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatShortDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, HH:mm');
}

export function extractToolIcon(toolName: string): string {
  const iconMap: Record<string, string> = {
    'Read': '📖',
    'Write': '✏️',
    'Edit': '📝',
    'MultiEdit': '📝',
    'Bash': '💻',
    'TodoWrite': '✅',
    'TodoRead': '📋',
    'Task': '🤖',
    'Grep': '🔍',
    'Glob': '🔍',
    'LS': '📁',
    'WebFetch': '🌐',
    'WebSearch': '🔎',
  };
  
  return iconMap[toolName] || '🔧';
}