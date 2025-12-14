import { useEffect } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useEntriesStore, type DecryptedEntry } from '../stores/entriesStore'

interface JournalListProps {
  onSelect: (entry: DecryptedEntry) => void
  onNew: () => void
  selectedId?: number | null
}

export function JournalList({ onSelect, onNew, selectedId }: JournalListProps) {
  const { entries, isLoading, error, fetchEntries, deleteEntry } = useEntriesStore()

  useEffect(() => {
    fetchEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
      await deleteEntry(id)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  if (error) {
    return (
      <div className="alert alert-error" role="alert">
        <span>{error}</span>
        <button className="btn btn-sm" onClick={() => fetchEntries()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <button className="btn btn-primary w-full" onClick={onNew}>
          + New Entry
        </button>
      </div>

      {isLoading && entries.length === 0 ? (
        <div className="flex justify-center items-center flex-1" role="status" aria-label="Loading entries">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="sr-only">Loading entries...</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center text-base-content/60 py-8" role="status">
          <p className="text-lg mb-2">No entries yet</p>
          <p className="text-sm">Create your first encrypted journal entry</p>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto space-y-2 ios-scroll"
          role="listbox"
          aria-label="Journal entries"
          tabIndex={0}
        >
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              role="option"
              aria-selected={selectedId === entry.id}
              tabIndex={0}
              className={`m-1 card bg-base-200 cursor-pointer ios-card focus:outline-none focus:ring-2 focus:ring-primary animate-list-item ${
                selectedId === entry.id ? 'ring-2 ring-primary' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onSelect(entry)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(entry)
                }
              }}
            >
              <div className="card-body p-4">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="card-title text-base line-clamp-1">{entry.title}</h3>
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={(e) => handleDelete(e, entry.id)}
                    aria-label={`Delete entry: ${entry.title}`}
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-sm text-base-content/70 line-clamp-2">
                  {truncateContent(entry.content)}
                </p>
                <time className="text-xs text-base-content/50 mt-2" dateTime={entry.updatedAt}>
                  {formatDate(entry.updatedAt)}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
