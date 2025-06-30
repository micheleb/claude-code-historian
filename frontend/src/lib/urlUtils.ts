// Utility functions for URL encoding/decoding of Claude project paths

/**
 * Encode a Claude path for use in URLs
 * Claude paths are already URL-safe (e.g., "-second-git-claude-code-historian")
 * but we still encode to handle any special characters
 */
export function encodePath(path: string): string {
  return encodeURIComponent(path);
}

/**
 * Decode a URL-encoded Claude path
 */
export function decodePath(encodedPath: string): string {
  return decodeURIComponent(encodedPath);
}

/**
 * Validate if a path looks like a valid Claude path
 * Claude paths start with a dash (e.g., "-second-git-project")
 */
export function isValidPath(path: string): boolean {
  return typeof path === 'string' && path.length > 0 && path.startsWith('-');
}

/**
 * Validate if a session ID looks like a UUID
 */
export function isValidSessionId(sessionId: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(sessionId);
}