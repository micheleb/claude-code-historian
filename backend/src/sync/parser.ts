import { LogEntrySchema } from '../types/log';
import type { LogEntry } from '../types/log';

export class JSONLParser {
  /**
   * Parse a JSONL file and return an array of log entries
   */
  static async parseFile(filePath: string): Promise<LogEntry[]> {
    const file = Bun.file(filePath);
    const text = await file.text();
    const lines = text.trim().split('\n');
    
    const entries: LogEntry[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const json = JSON.parse(line);
        const parsed = LogEntrySchema.safeParse(json);
        
        if (parsed.success) {
          entries.push(parsed.data);
        } else {
          console.warn(`Failed to parse log entry: ${parsed.error.message}`);
        }
      } catch (error) {
        console.warn(`Failed to parse JSON line: ${error}`);
      }
    }
    
    return entries;
  }
  
  /**
   * Extract project name from file path
   */
  static extractProjectInfo(filePath: string): { projectPath: string, projectName: string } {
    // Example: /home/michele/.claude/projects/-second-git-pr-times/session-id.jsonl
    const match = filePath.match(/\.claude\/projects\/(.+?)\/[^\/]+\.jsonl$/);
    
    if (!match) {
      throw new Error(`Invalid log file path: ${filePath}`);
    }
    
    const projectPath = match[1];
    // Convert path to readable name (e.g., "-second-git-pr-times" -> "second/git/pr-times")
    const projectName = projectPath.replace(/^-/, '').replace(/-/g, '/');
    
    return { projectPath, projectName };
  }
  
  /**
   * Extract session ID from file path
   */
  static extractSessionId(filePath: string): string {
    const match = filePath.match(/\/([^\/]+)\.jsonl$/);
    
    if (!match) {
      throw new Error(`Invalid log file path: ${filePath}`);
    }
    
    return match[1];
  }
}