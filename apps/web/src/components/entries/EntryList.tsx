import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEntriesStore } from '../../stores';
import { EntryCard } from './EntryCard';
import { Button } from '../ui';

export function EntryList() {
  const { t } = useTranslation();
  const {
    entries,
    pagination,
    isLoading,
    error,
    filters,
    fetchEntries,
  } = useEntriesStore();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, filters]);

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300 transition-colors">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    const hasSearchFilter = !!filters.search?.trim();

    return (
      <div className="py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {hasSearchFilter ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          )}
        </svg>
        <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100 transition-colors">
          {hasSearchFilter ? t('entries.noEntriesFound') : t('entries.noEntries')}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 transition-colors">
          {hasSearchFilter ? t('entries.tryDifferentSearch') : t('entries.startWriting')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchEntries(pagination.page - 1)}
            disabled={!pagination.hasPrev}
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
            {t('common.pageOf', {
              page: pagination.page,
              total: pagination.totalPages,
            })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchEntries(pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
