import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUserMessage?: boolean;
}

export function MarkdownRenderer({ content, className, isUserMessage = false }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none text-inherit", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <SyntaxHighlighter
                  style={isUserMessage ? oneLight : oneDark}
                  language={language}
                  PreTag="div"
                  className="rounded-md !mt-2 !mb-2"
                  customStyle={{
                    margin: 0,
                    fontSize: '0.75rem',
                    lineHeight: '1.25rem',
                    backgroundColor: 'transparent',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            
            return (
              <code
                className={cn(
                  "px-1.5 py-0.5 rounded text-xs font-mono",
                  isUserMessage
                    ? "bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                    : "bg-white bg-opacity-20 text-inherit"
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // Headers
          h1: ({ children, ...props }) => (
            <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0 text-inherit" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-base font-bold mt-3 mb-2 first:mt-0 text-inherit" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-sm font-bold mt-3 mb-1 first:mt-0 text-inherit" {...props}>
              {children}
            </h3>
          ),
          
          // Paragraphs
          p: ({ children, ...props }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-inherit" {...props}>
              {children}
            </p>
          ),
          
          // Lists
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 text-inherit" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 text-inherit" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed text-inherit" {...props}>
              {children}
            </li>
          ),
          
          // Blockquotes
          blockquote: ({ children, ...props }) => (
            <blockquote
              className={cn(
                "border-l-4 pl-4 my-2 italic text-inherit",
                isUserMessage
                  ? "border-gray-300 dark:border-gray-500"
                  : "border-white border-opacity-30"
              )}
              {...props}
            >
              {children}
            </blockquote>
          ),
          
          // Links
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className={cn(
                "underline hover:no-underline",
                isUserMessage
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-blue-200 hover:text-white"
              )}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          
          // Strong/Bold
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-inherit" {...props}>
              {children}
            </strong>
          ),
          
          // Emphasis/Italic
          em: ({ children, ...props }) => (
            <em className="italic text-inherit" {...props}>
              {children}
            </em>
          ),
          
          // Tables
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-2">
              <table
                className={cn(
                  "min-w-full text-xs border-collapse",
                  isUserMessage
                    ? "border border-gray-300 dark:border-gray-600"
                    : "border border-white border-opacity-30"
                )}
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              className={cn(
                "border px-2 py-1 text-left font-semibold text-inherit",
                isUserMessage
                  ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                  : "border-white border-opacity-30 bg-white bg-opacity-10"
              )}
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className={cn(
                "border px-2 py-1 text-inherit",
                isUserMessage
                  ? "border-gray-300 dark:border-gray-600"
                  : "border-white border-opacity-30"
              )}
              {...props}
            >
              {children}
            </td>
          ),
          
          // Horizontal rule
          hr: ({ ...props }) => (
            <hr
              className={cn(
                "my-4 border-0 h-px",
                isUserMessage
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-white bg-opacity-30"
              )}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}