import { useState, useEffect } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useEntriesStore, type DecryptedEntry } from '../stores/entriesStore'

interface JournalEditorProps {
  entry?: DecryptedEntry | null
  onSave?: (entry: DecryptedEntry) => void
  onCancel?: () => void
}

export function JournalEditor({ entry, onSave, onCancel }: JournalEditorProps) {
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { createEntry, updateEntry } = useEntriesStore()

  // Reset form when entry changes
  useEffect(() => {
    setTitle(entry?.title || '')
    setContent(entry?.content || '')
    setError(null)
  }, [entry])

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (entry) {
        // Update existing entry
        await updateEntry(entry.id, title, content)
        onSave?.({ ...entry, title, content })
      } else {
        // Create new entry
        const newEntry = await createEntry(title, content)
        onSave?.(newEntry)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      className="flex flex-col h-full animate-fade-in"
      data-color-mode="light"
      onSubmit={(e) => {
        e.preventDefault()
        handleSave()
      }}
      aria-label={entry ? 'Edit journal entry' : 'Create new journal entry'}
    >
      {error && (
        <div className="alert alert-error mb-4" role="alert" aria-live="polite">
          <span>{error}</span>
        </div>
      )}

      <div className="form-control mb-4">
        <label htmlFor="entry-title" className="sr-only">Entry title</label>
        <input
          id="entry-title"
          type="text"
          placeholder="Entry title..."
          className="input input-bordered input-lg w-full font-semibold"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-required="true"
          aria-invalid={error && !title.trim() ? 'true' : 'false'}
          aria-describedby={error && !title.trim() ? 'title-error' : undefined}
        />
        {error && !title.trim() && (
          <span id="title-error" className="sr-only">Title is required</span>
        )}
      </div>

      <div className="flex-1 min-h-0 mb-4">
        <label htmlFor="entry-content" className="sr-only">Entry content (Markdown supported)</label>
        <MDEditor
          value={content}
          onChange={(val) => setContent(val || '')}
          height="100%"
          preview="edit"
          hideToolbar={false}
          visibleDragbar={false}
          textareaProps={{
            id: 'entry-content',
            'aria-label': 'Entry content, Markdown supported',
          }}
        />
      </div>

      <div className="flex justify-end gap-2" role="group" aria-label="Entry actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary ios-button"
          disabled={isSaving || !title.trim()}
          aria-busy={isSaving}
        >
          {isSaving ? (
            <>
              <span className="loading loading-spinner loading-sm" aria-hidden="true"></span>
              <span>Encrypting & Saving...</span>
            </>
          ) : entry ? (
            'Update Entry'
          ) : (
            'Create Entry'
          )}
        </button>
      </div>
    </form>
  )
}
