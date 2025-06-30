import { z } from 'zod';

// Base message schema
export const BaseMessageSchema = z.object({
  parentUuid: z.string().nullable(),
  isSidechain: z.boolean(),
  userType: z.string(),
  cwd: z.string(),
  sessionId: z.string(),
  version: z.string(),
  uuid: z.string(),
  timestamp: z.string(),
});

// User message schema
export const UserMessageSchema = BaseMessageSchema.extend({
  type: z.literal('user'),
  message: z.object({
    role: z.literal('user'),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.string(),
        text: z.string().optional(),
        tool_use_id: z.string().optional(),
        tool_result: z.any().optional(),
      }))
    ])
  }),
  isMeta: z.boolean().optional(),
  toolUseResult: z.any().optional(),
});

// Assistant message schema
export const AssistantMessageSchema = BaseMessageSchema.extend({
  type: z.literal('assistant'),
  message: z.object({
    id: z.string(),
    type: z.literal('message'),
    role: z.literal('assistant'),
    model: z.string(),
    content: z.array(z.union([
      z.object({
        type: z.literal('text'),
        text: z.string()
      }),
      z.object({
        type: z.literal('tool_use'),
        id: z.string(),
        name: z.string(),
        input: z.any()
      }),
      z.object({
        type: z.literal('thinking'),
        thinking: z.string()
      })
    ])),
    stop_reason: z.string().nullable(),
    stop_sequence: z.string().nullable(),
    usage: z.object({
      input_tokens: z.number(),
      cache_creation_input_tokens: z.number(),
      cache_read_input_tokens: z.number(),
      output_tokens: z.number(),
      service_tier: z.string()
    })
  }),
  requestId: z.string(),
});

// Summary schema
export const SummarySchema = z.object({
  type: z.literal('summary'),
  summary: z.string(),
  leafUuid: z.string()
});

// Union of all log entry types
export const LogEntrySchema = z.union([
  UserMessageSchema,
  AssistantMessageSchema,
  SummarySchema
]);

export type BaseMessage = z.infer<typeof BaseMessageSchema>;
export type UserMessage = z.infer<typeof UserMessageSchema>;
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;
export type Summary = z.infer<typeof SummarySchema>;
export type LogEntry = z.infer<typeof LogEntrySchema>;