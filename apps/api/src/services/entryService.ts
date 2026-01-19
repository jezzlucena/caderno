import { Types } from 'mongoose';
import { Entry, IEntry } from '../models/Entry.js';
import { AppError } from '../middleware/errorHandler.js';
import type {
  CreateEntryInput,
  UpdateEntryInput,
  EntryFilter,
  Pagination,
  PaginatedResponse,
} from '@caderno/shared';

export interface EntryResponse {
  id: string;
  title: string;
  content: Record<string, unknown>;
  plainText: string;
  tags: string[];
  includeInSafetyTimer: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

function toEntryResponse(entry: IEntry): EntryResponse {
  return {
    id: entry._id.toString(),
    title: entry.title,
    content: entry.content,
    plainText: entry.plainText,
    tags: entry.tags,
    includeInSafetyTimer: entry.includeInSafetyTimer,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    deletedAt: entry.deletedAt,
  };
}

export async function createEntry(
  userId: string,
  input: CreateEntryInput
): Promise<EntryResponse> {
  const entry = await Entry.create({
    userId,
    title: input.title,
    content: input.content,
    plainText: input.plainText,
    tags: input.tags || [],
    includeInSafetyTimer: input.includeInSafetyTimer ?? true,
  });

  return toEntryResponse(entry);
}

export async function getEntryById(
  userId: string,
  entryId: string
): Promise<EntryResponse> {
  const entry = await Entry.findOne({ _id: entryId, userId, deletedAt: null });

  if (!entry) {
    throw new AppError(404, 'ENTRY_NOT_FOUND', 'Entry not found');
  }

  return toEntryResponse(entry);
}

export async function updateEntry(
  userId: string,
  entryId: string,
  input: UpdateEntryInput
): Promise<EntryResponse> {
  const entry = await Entry.findOneAndUpdate(
    { _id: entryId, userId, deletedAt: null },
    { $set: input },
    { new: true }
  );

  if (!entry) {
    throw new AppError(404, 'ENTRY_NOT_FOUND', 'Entry not found');
  }

  return toEntryResponse(entry);
}

export async function deleteEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const entry = await Entry.findOneAndUpdate(
    { _id: entryId, userId, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );

  if (!entry) {
    throw new AppError(404, 'ENTRY_NOT_FOUND', 'Entry not found');
  }
}

export async function listEntries(
  userId: string,
  filter: EntryFilter,
  pagination: Pagination
): Promise<PaginatedResponse<EntryResponse>> {
  const query: Record<string, unknown> = { userId };

  // Only include non-deleted entries by default
  if (!filter.includeDeleted) {
    query.deletedAt = null;
  }

  // Search filter - searches in title, plainText, and tags using regex
  if (filter.search) {
    const searchTerm = filter.search.trim();
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    query.$or = [
      { title: searchRegex },
      { plainText: searchRegex },
      { tags: searchRegex },
    ];
  }

  // Tags filter
  if (filter.tags && filter.tags.length > 0) {
    query.tags = { $in: filter.tags };
  }

  // Date range filter
  if (filter.startDate || filter.endDate) {
    query.createdAt = {};
    if (filter.startDate) {
      (query.createdAt as Record<string, unknown>).$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      (query.createdAt as Record<string, unknown>).$lte = new Date(filter.endDate);
    }
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const sortDirection = pagination.sortOrder === 'asc' ? 1 : -1;

  const [entries, total] = await Promise.all([
    Entry.find(query)
      .sort({ [pagination.sortBy]: sortDirection })
      .skip(skip)
      .limit(pagination.limit),
    Entry.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / pagination.limit);

  return {
    items: entries.map(toEntryResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };
}

export async function getAllTags(userId: string): Promise<string[]> {
  const result = await Entry.aggregate([
    { $match: { userId: new Types.ObjectId(userId), deletedAt: null } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags' } },
    { $sort: { _id: 1 } },
  ]);

  return result.map((r) => r._id as string);
}

export async function getEntriesForExport(
  userId: string,
  options: {
    includeDeleted?: boolean;
    tags?: string[];
    startDate?: string;
    endDate?: string;
  }
): Promise<IEntry[]> {
  const query: Record<string, unknown> = { userId };

  if (!options.includeDeleted) {
    query.deletedAt = null;
  }

  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }

  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) {
      (query.createdAt as Record<string, unknown>).$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      (query.createdAt as Record<string, unknown>).$lte = new Date(options.endDate);
    }
  }

  return Entry.find(query).sort({ createdAt: -1 });
}

export async function getEntriesForSafetyTimer(
  userId: string,
  filter: 'all' | 'tagged',
  filterTags?: string[]
): Promise<IEntry[]> {
  const query: Record<string, unknown> = {
    userId,
    deletedAt: null,
    includeInSafetyTimer: true,
  };

  if (filter === 'tagged' && filterTags && filterTags.length > 0) {
    query.tags = { $in: filterTags };
  }

  return Entry.find(query).sort({ createdAt: -1 });
}
