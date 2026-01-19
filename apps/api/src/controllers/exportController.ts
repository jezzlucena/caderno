import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { getEntriesForExport, createEntry } from '../services/entryService.js';
import { generateJournalPdf } from '../services/pdfService.js';
import { Entry } from '../models/Entry.js';

export async function exportJson(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const options = {
      includeDeleted: req.query.includeDeleted === 'true',
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };

    const entries = await getEntriesForExport(req.userId!, options);

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      entries: entries.map((e) => ({
        title: e.title,
        content: e.content,
        plainText: e.plainText,
        tags: e.tags,
        includeInSafetyTimer: e.includeInSafetyTimer,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        deletedAt: e.deletedAt,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=caderno-export-${new Date().toISOString().split('T')[0]}.json`
    );
    res.json(exportData);
  } catch (error) {
    next(error);
  }
}

export async function exportPdf(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const options = {
      includeDeleted: req.query.includeDeleted === 'true',
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };

    const entries = await getEntriesForExport(req.userId!, options);

    const pdfBuffer = await generateJournalPdf(entries, {
      title: 'Caderno Journal Export',
      includeMetadata: true,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=caderno-export-${new Date().toISOString().split('T')[0]}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

export async function importJson(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      res.status(400).json({
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid import format: entries must be an array',
        },
      });
      return;
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as { index: number; error: string }[],
    };

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      try {
        // Validate required fields
        if (!entry.title || !entry.content || !entry.plainText) {
          results.errors.push({
            index: i,
            error: 'Missing required fields (title, content, or plainText)',
          });
          results.skipped++;
          continue;
        }

        await Entry.create({
          userId: req.userId,
          title: entry.title,
          content: entry.content,
          plainText: entry.plainText,
          tags: entry.tags || [],
          includeInSafetyTimer: entry.includeInSafetyTimer ?? true,
          createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
          deletedAt: entry.deletedAt ? new Date(entry.deletedAt) : undefined,
        });

        results.imported++;
      } catch (error) {
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.skipped++;
      }
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
}
