import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  createEntry,
  getEntryById,
  updateEntry,
  deleteEntry,
  listEntries,
  getAllTags,
} from '../services/entryService.js';

export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const entry = await createEntry(req.userId!, req.body);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const entry = await getEntryById(req.userId!, req.params.id as string);
    res.json(entry);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const entry = await updateEntry(req.userId!, req.params.id as string, req.body);
    res.json(entry);
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteEntry(req.userId!, req.params.id as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function list(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filter = {
      search: req.query.search as string | undefined,
      tags: req.query.tags
        ? (req.query.tags as string).split(',')
        : undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      includeDeleted: req.query.includeDeleted === 'true',
    };

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as 'createdAt' | 'updatedAt' | 'title') || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await listEntries(req.userId!, filter, pagination);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function tags(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tagList = await getAllTags(req.userId!);
    res.json({ tags: tagList });
  } catch (error) {
    next(error);
  }
}
