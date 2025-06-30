import { LogEntrySchema } from '../types/log';
import type { LogEntry } from '../types/log';

export class JSONLParser {
  private static parseErrors = 0;

  /**
   * Parse a JSONL file and return an array of log entries
   */
  static async parseFile(filePath: string): Promise<LogEntry[]> {
    this.parseErrors = 0;
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
          // Only log detailed errors for debugging, not for every failure
          if (process.env.DEBUG_PARSING) {
            console.warn(`Failed to parse log entry:`, JSON.stringify(parsed.error.format(), null, 2));
            console.warn(`Raw entry:`, JSON.stringify(json, null, 2));
          }
          // For normal operation, just count the failures
          if (!this.parseErrors) this.parseErrors = 0;
          this.parseErrors++;
        }
      } catch (error) {
        console.warn(`Failed to parse JSON line: ${error}`);
      }
    }
    
    // Log summary if there were any parse errors
    if (this.parseErrors > 0) {
      console.log(`Parsed ${entries.length} valid entries, skipped ${this.parseErrors} invalid entries from ${filePath}`);
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