import { z } from 'zod';
import { EntrySchema } from './entry.js';

export const ExportFormatSchema = z.enum(['json', 'pdf']);

export const ExportOptionsSchema = z.object({
  format: ExportFormatSchema.default('json'),
  includeDeleted: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const ImportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string().datetime(),
  entries: z.array(
    EntrySchema.omit({ id: true, userId: true }).extend({
      id: z.string().optional(),
    })
  ),
});

export const ImportResultSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
  errors: z.array(z.object({
    index: z.number(),
    error: z.string(),
  })),
});

export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
export type ImportData = z.infer<typeof ImportDataSchema>;
export type ImportResult = z.infer<typeof ImportResultSchema>;
