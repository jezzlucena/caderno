import { z } from 'zod';

// Lexical serialized node (simplified schema for validation)
export const LexicalNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    type: z.string(),
    version: z.number().optional(),
    children: z.array(LexicalNodeSchema).optional(),
  }).passthrough()
);

export const LexicalContentSchema = z.object({
  root: LexicalNodeSchema,
});

export const EntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().max(500),
  content: LexicalContentSchema,
  plainText: z.string(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  includeInSafetyTimer: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

export const CreateEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  content: LexicalContentSchema,
  plainText: z.string(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  includeInSafetyTimer: z.boolean().optional(),
});

export const UpdateEntrySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: LexicalContentSchema.optional(),
  plainText: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  includeInSafetyTimer: z.boolean().optional(),
});

export const EntryFilterSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeDeleted: z.boolean().optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type Entry = z.infer<typeof EntrySchema>;
export type LexicalContent = z.infer<typeof LexicalContentSchema>;
export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;
export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;
export type EntryFilter = z.infer<typeof EntryFilterSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
