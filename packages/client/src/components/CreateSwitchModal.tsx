import { useState, useEffect } from 'react'
import { useEntriesStore } from '../stores/entriesStore'
import { generateJournalPDF } from '../lib/pdfGenerator'
import { generatePayloadKey, encryptBlob } from '../lib/crypto'

export interface CreateSwitchData {
  name: string
  timerMs: number
  triggerMessage?: string
  recipients: { email: string; name?: string }[]
  encryptedPayload?: string
  payloadIv?: string
  payloadKey?: string
}

// Constants for logarithmic scale
const MIN_TIMER_MS = 60000 // 1 minute
const MAX_TIMER_MS = 2592000000 // 30 days
const DEFAULT_TIMER_MS = 604800000 // 7 days

// Convert slider position (0-100) to milliseconds using logarithmic scale
function sliderToMs(position: number): number {
  const minLog = Math.log(MIN_TIMER_MS)
  const maxLog = Math.log(MAX_TIMER_MS)
  const scale = (maxLog - minLog) / 100
  return Math.round(Math.exp(minLog + scale * position))
}

// Convert milliseconds to slider position (0-100)
function msToSlider(ms: number): number {
  const minLog = Math.log(MIN_TIMER_MS)
  const maxLog = Math.log(MAX_TIMER_MS)
  const scale = (maxLog - minLog) / 100
  return Math.round((Math.log(ms) - minLog) / scale)
}

// Format milliseconds to human-readable string
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const years = Math.floor(days / 365)

  if (years > 0) {
    const remainingDays = days % 365
    if (remainingDays > 0) {
      return `${years}y, ${remainingDays}d`
    }
    return `${years}y`
  }
  if (days > 0) {
    const remainingHours = hours % 24
    const remainingMinutes = minutes % 60
    if (remainingHours > 0 || remainingMinutes > 0) {
      return `${days}d, ${remainingHours}h, ${remainingMinutes}min`
    }
    return `${days}d`
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60
    const remainingSeconds = seconds % 60
    if (remainingMinutes > 0 || remainingSeconds > 0) {
      return `${hours}h, ${remainingMinutes}min, ${remainingSeconds}s`
    }
    return `${hours}h`
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    if (remainingSeconds > 0) {
      return `${minutes}min, ${remainingSeconds}s`
    }
    return `${minutes}min`
  }
  return `${seconds}s`
}

interface CreateSwitchModalProps {
  onClose: () => void
  onCreate: (data: CreateSwitchData) => Promise<void>
}

export function CreateSwitchModal({ onClose, onCreate }: CreateSwitchModalProps) {
  const { entries, fetchEntries, isLoading: entriesLoading, error: entriesError } = useEntriesStore()
  const [name, setName] = useState('')
  const [timerMs, setTimerMs] = useState(DEFAULT_TIMER_MS)
  const [sliderPosition, setSliderPosition] = useState(msToSlider(DEFAULT_TIMER_MS))
  const [triggerMessage, setTriggerMessage] = useState('')
  const [recipients, setRecipients] = useState<{ email: string; name: string }[]>([
    { email: '', name: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // PDF payload state
  const [includePdf, setIncludePdf] = useState(false)
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  // Log whenever entries change
  useEffect(() => {
    console.log('[CreateSwitchModal] Entries updated, count:', entries.length, entries)
  }, [entries])

  // Fetch entries when modal opens
  useEffect(() => {
    console.log('[CreateSwitchModal] Modal opened, entries count:', entries.length)
    if (entries.length === 0) {
      console.log('[CreateSwitchModal] Fetching entries...')
      fetchEntries().then(() => {
        console.log('[CreateSwitchModal] Fetch complete')
      }).catch((err) => {
        console.error('[CreateSwitchModal] Fetch failed:', err)
      })
    }
  }, [])

  // Handle select all toggle
  useEffect(() => {
    if (selectAll) {
      setSelectedEntryIds(new Set(entries.map(e => e.id)))
    } else if (selectedEntryIds.size === entries.length && entries.length > 0) {
      // If all were selected and selectAll is now false, clear selection
      setSelectedEntryIds(new Set())
    }
  }, [selectAll, entries])

  const toggleEntrySelection = (id: number) => {
    const newSelection = new Set(selectedEntryIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
      setSelectAll(false)
    } else {
      newSelection.add(id)
      if (newSelection.size === entries.length) {
        setSelectAll(true)
      }
    }
    setSelectedEntryIds(newSelection)
  }

  const addRecipient = () => {
    if (recipients.length < 10) {
      setRecipients([...recipients, { email: '', name: '' }])
    }
  }

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index))
    }
  }

  const updateRecipient = (index: number, field: 'email' | 'name', value: string) => {
    const updated = [...recipients]
    updated[index][field] = value
    setRecipients(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError('Please enter a name for this switch')
      return
    }

    const validRecipients = recipients.filter(r => r.email.trim())
    if (validRecipients.length === 0) {
      setError('Please add at least one recipient')
      return
    }

    if (includePdf && selectedEntryIds.size === 0) {
      setError('Please select at least one entry to include in the PDF')
      return
    }

    setIsSubmitting(true)

    try {
      let payloadData: { encryptedPayload?: string; payloadIv?: string; payloadKey?: string } = {}

      // Generate and encrypt PDF if entries are selected
      if (includePdf && selectedEntryIds.size > 0) {
        setGeneratingPdf(true)

        // Get selected entries in order (newest first)
        const selectedEntries = entries
          .filter(e => selectedEntryIds.has(e.id))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        // Generate PDF
        const pdfBlob = await generateJournalPDF(selectedEntries)

        // Generate encryption key and encrypt the PDF
        const payloadKey = await generatePayloadKey()
        const { encryptedData, iv } = await encryptBlob(payloadKey, pdfBlob)

        payloadData = {
          encryptedPayload: encryptedData,
          payloadIv: iv,
          payloadKey: payloadKey
        }

        setGeneratingPdf(false)
      }

      await onCreate({
        name: name.trim(),
        timerMs,
        triggerMessage: triggerMessage.trim() || undefined,
        recipients: validRecipients.map(r => ({
          email: r.email.trim(),
          name: r.name.trim() || undefined
        })),
        ...payloadData
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create switch')
      setGeneratingPdf(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-backdrop modal-backdrop-enter" onClick={onClose} />
      <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto modal-content-enter ios-scroll">
        <h3 className="font-bold text-lg">Create Dead Man's Switch</h3>

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Switch Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g., Personal Safety Switch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Timer Duration: </span>
              <span className="label-text-alt">{formatDuration(timerMs)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={sliderPosition}
              onChange={(e) => {
                const pos = parseFloat(e.target.value)
                setSliderPosition(pos)
                setTimerMs(sliderToMs(pos))
              }}
              className="range range-primary w-full"
            />
            <div className="flex justify-between text-xs px-2 mt-1">
              <span>1 min</span>
              <span>10 min</span>
              <span>3 hours</span>
              <span>1 day</span>
              <span>30 days</span>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Trigger Message (Optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24 w-full"
              placeholder="This message will be sent to your recipients if the switch triggers..."
              value={triggerMessage}
              onChange={(e) => setTriggerMessage(e.target.value)}
            />
          </div>

          {/* PDF Payload Section */}
          <div className="form-control form-control-compact">
            <label className="label relative cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={includePdf}
                onChange={(e) => setIncludePdf(e.target.checked)}
              />
              <div>
                <span className="label-text font-medium">Include journal entries as PDF</span>
                <p className="text-xs text-base-content/60">
                  Recipients will receive a link to download your selected entries as a formatted PDF
                </p>
              </div>
            </label>
          </div>

          {includePdf && (
            <div className="border border-base-300 rounded-lg p-4 bg-base-200/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">Select Entries to Include</span>
                <div className="label cursor-pointer gap-2">
                  <span className="label-text text-xs">Select all</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={selectAll}
                    onChange={(e) => setSelectAll(e.target.checked)}
                  />
                </div>
              </div>

              {entriesLoading ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span className="ml-2 text-sm">Loading entries...</span>
                </div>
              ) : entriesError ? (
                <p className="text-sm text-error text-center py-4">
                  Error loading entries: {entriesError}
                </p>
              ) : entries.length === 0 ? (
                <p className="text-sm text-base-content/60 text-center py-4">
                  No journal entries found. Create some entries first.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-base-300/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={selectedEntryIds.has(entry.id)}
                        onChange={() => toggleEntrySelection(entry.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.title}</p>
                        <p className="text-xs text-base-content/60">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedEntryIds.size > 0 && (
                <p className="text-xs text-base-content/60 mt-3 pt-3 border-t border-base-300">
                  {selectedEntryIds.size} {selectedEntryIds.size === 1 ? 'entry' : 'entries'} selected
                </p>
              )}
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Recipients</span>
              <span className="label-text-alt">{recipients.length}/10</span>
            </label>
            <div className="space-y-2">
              {recipients.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="email"
                    className="input input-bordered flex-1"
                    placeholder="email@example.com"
                    value={r.email}
                    onChange={(e) => updateRecipient(i, 'email', e.target.value)}
                    required={i === 0}
                  />
                  <input
                    type="text"
                    className="input input-bordered w-[40%]"
                    placeholder="Name"
                    value={r.name}
                    onChange={(e) => updateRecipient(i, 'name', e.target.value)}
                  />
                  {recipients.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-square"
                      onClick={() => removeRecipient(i)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {recipients.length < 10 && (
              <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={addRecipient}>
                + Add Recipient
              </button>
            )}
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || (includePdf && entries.length === 0)}>
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {generatingPdf ? 'Generating PDF...' : 'Creating...'}
                </>
              ) : (
                'Create Switch'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
