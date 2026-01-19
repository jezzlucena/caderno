import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEntriesStore } from '../stores';
import { EntryList } from '../components/entries';
import { Button, Input, Select } from '../components/ui';

export function EntriesPage() {
  const { t } = useTranslation();
  const { filters, setFilters, isSearching, setIsSearching } = useEntriesStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search - triggers 1 second after user stops typing
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only debounce if the input differs from current filter
    if (searchInput !== filters.search && searchInput.length >= 3) {
      // Set searching state immediately when user starts typing
      setIsSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        setFilters({ search: searchInput });
      }, 1000);
    } else if (searchInput !== filters.search && searchInput.length < 3 && filters.search) {
      // Clear search if input is less than 3 chars but there was a previous search
      setIsSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        setFilters({ search: '' });
      }, 1000);
    }

    // Cleanup on unmount or when searchInput changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput, filters.search, setFilters, setIsSearching]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear debounce timer for immediate search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsSearching(true);
    setFilters({ search: searchInput });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('entries.title')}
        </h1>
        <Link to="/entries/new">
          <Button>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('entries.newEntry')}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Input
              placeholder={t('entries.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              </div>
            )}
          </div>
          <Button type="submit" variant="secondary" disabled={isSearching}>
            {t('common.search')}
          </Button>
        </form>

        <Select
          value={filters.sortBy}
          onChange={(e) => setFilters({ sortBy: e.target.value as 'createdAt' | 'updatedAt' | 'title' })}
          options={[
            { value: 'createdAt', label: t('entries.sortByDate') },
            { value: 'updatedAt', label: t('entries.sortByUpdated') },
            { value: 'title', label: t('entries.sortByTitle') },
          ]}
        />

        <Select
          value={filters.sortOrder}
          onChange={(e) => setFilters({ sortOrder: e.target.value as 'asc' | 'desc' })}
          options={[
            { value: 'desc', label: t('entries.sortDesc') },
            { value: 'asc', label: t('entries.sortAsc') },
          ]}
        />
      </div>

      <EntryList />
    </div>
  );
}
