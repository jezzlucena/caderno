import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { ArrowUpTrayIcon, LockClosedIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { useCryptoStore } from '../stores/cryptoStore'
import { useEntriesStore } from '../stores/entriesStore'
import { importEntries, hashContent, isFileEncrypted, type ExportPayload } from '../lib/exportImport'

type ImportMode = 'import_all' | 'merge_new' | 'replace_all'

export function Import() {
  const { isKeyReady } = useCryptoStore()
  const { entries, fetchEntries, importEntry, deleteEntry } = useEntriesStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [importMode, setImportMode] = useState<ImportMode>('merge_new')
  const [isImporting, setIsImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<ExportPayload | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [needsPassphrase, setNeedsPassphrase] = useState(false)
  const [entriesFetched, setEntriesFetched] = useState(false)

  // Fetch entries when component mounts (needed for merge comparison)
  useEffect(() => {
    if (isKeyReady && !entriesFetched) {
      fetchEntries().then(() => setEntriesFetched(true))
    }
  }, [isKeyReady, entriesFetched, fetchEntries])

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setImportPreview(null)
    setPreviewError(null)
    setPassphrase('')
    setNeedsPassphrase(false)

    // Check if file is encrypted
    const encrypted = await isFileEncrypted(file)
    if (encrypted) {
      setNeedsPassphrase(true)
      setPreviewError('This file is encrypted. Enter the passphrase to preview.')
      return
    }

    // Try to preview the file
    try {
      const result = await importEntries(file)
      setImportPreview(result.payload)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to read file')
    }
  }

  // Re-try preview when passphrase changes
  const handleDecrypt = async () => {
    if (!selectedFile || !passphrase) return

    setPreviewError(null)
    try {
      const result = await importEntries(selectedFile, passphrase)
      setImportPreview(result.payload)
      setNeedsPassphrase(false)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Decryption failed')
      setImportPreview(null)
    }
  }

  // Perform import
  const handleImport = async () => {
    if (!importPreview) return

    const entriesToImport = importPreview.entries

    if (entriesToImport.length === 0) {
      toast.error('No entries to import')
      return
    }

    setIsImporting(true)
    setProgress({ current: 0, total: entriesToImport.length })

    try {
      // If replace_all, delete all existing entries first
      if (importMode === 'replace_all') {
        const confirmDelete = window.confirm(
          `This will DELETE all ${entries.length} existing entries before importing. Are you sure?`
        )
        if (!confirmDelete) {
          setIsImporting(false)
          return
        }

        for (const entry of entries) {
          await deleteEntry(entry.id)
        }
      }

      // Build hash set of existing entries for merge_new mode
      const existingHashes = new Set<string>()
      if (importMode === 'merge_new') {
        for (const entry of entries) {
          const hash = await hashContent(entry.title, entry.content)
          existingHashes.add(hash)
        }
      }

      // Import entries
      let imported = 0
      let skipped = 0

      for (let i = 0; i < entriesToImport.length; i++) {
        const entry = entriesToImport[i]
        setProgress({ current: i + 1, total: entriesToImport.length })

        // Skip if merge_new and entry already exists
        if (importMode === 'merge_new' && existingHashes.has(entry.contentHash)) {
          skipped++
          continue
        }

        // Import the entry with original timestamps
        await importEntry(entry.title, entry.content, entry.createdAt, entry.updatedAt)
        imported++
      }

      // Refresh entries list
      await fetchEntries()

      // Show success message
      if (skipped > 0) {
        toast.success(`Imported ${imported} entries (${skipped} duplicates skipped)`)
      } else {
        toast.success(`Imported ${imported} entries successfully!`)
      }

      // Reset form
      setSelectedFile(null)
      setImportPreview(null)
      setPassphrase('')
      setNeedsPassphrase(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  if (!isKeyReady) {
    return <UnlockPrompt />
  }

  return (
    <div className="min-h-screen bg-base-200 animate-fade-in flex flex-col">
      <Navbar currentPage="import" />

      <main id="main-content" className="container mx-auto p-4 sm:p-6 max-w-2xl flex-1">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-2">
              <ArrowUpTrayIcon className="h-7 w-7" />
              Import Journal
            </h1>
            <p className="text-base-content/70 mb-6">
              Restore journal entries from a Caderno export file.
            </p>

            {/* File upload */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Select Export File</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                className="file-input file-input-bordered w-full"
                accept=".journal"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
            </div>

            {/* Passphrase input for encrypted files */}
            {needsPassphrase && (
              <div className="mt-4 p-4 bg-base-200 rounded-lg space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2">
                      <LockClosedIcon className="h-4 w-4" />
                      Passphrase
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      className="input input-bordered flex-1"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter the export file passphrase"
                      disabled={isImporting}
                      onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleDecrypt}
                      disabled={!passphrase || isImporting}
                    >
                      Decrypt
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preview error */}
            {previewError && !needsPassphrase && (
              <div className="alert alert-error mt-4">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>{previewError}</span>
              </div>
            )}

            {/* Encrypted file notice */}
            {needsPassphrase && !importPreview && (
              <div className="alert alert-info mt-4">
                <LockClosedIcon className="h-5 w-5" />
                <span>This file is encrypted. Enter the passphrase to preview and import.</span>
              </div>
            )}

            {/* Decryption error */}
            {previewError && needsPassphrase && passphrase && (
              <div className="alert alert-error mt-4">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>{previewError}</span>
              </div>
            )}

            {/* Import preview */}
            {importPreview && (
              <div className="mt-6 space-y-4">
                <div className="alert alert-info">
                  <DocumentTextIcon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{importPreview.entries.length} entries found</p>
                    <p className="text-sm">
                      Exported on {new Date(importPreview.metadata.exportDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Import mode selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Import Mode</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300">
                      <input
                        type="radio"
                        name="importMode"
                        className="radio radio-primary mt-1"
                        checked={importMode === 'merge_new'}
                        onChange={() => setImportMode('merge_new')}
                        disabled={isImporting}
                      />
                      <div>
                        <p className="font-medium">Merge New Only</p>
                        <p className="text-sm text-base-content/60">
                          Skip entries that already exist (based on content hash)
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300">
                      <input
                        type="radio"
                        name="importMode"
                        className="radio radio-primary mt-1"
                        checked={importMode === 'import_all'}
                        onChange={() => setImportMode('import_all')}
                        disabled={isImporting}
                      />
                      <div>
                        <p className="font-medium">Import All</p>
                        <p className="text-sm text-base-content/60">
                          Import all entries (may create duplicates)
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 border border-error/30">
                      <input
                        type="radio"
                        name="importMode"
                        className="radio radio-error mt-1"
                        checked={importMode === 'replace_all'}
                        onChange={() => setImportMode('replace_all')}
                        disabled={isImporting}
                      />
                      <div>
                        <p className="font-medium text-error">Replace All</p>
                        <p className="text-sm text-base-content/60">
                          Delete all existing entries first, then import
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Replace all warning */}
                {importMode === 'replace_all' && (
                  <div className="alert alert-warning">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span>
                      This will permanently delete all {entries.length} existing entries!
                    </span>
                  </div>
                )}

                {/* Progress bar */}
                {isImporting && progress.total > 0 && (
                  <div className="space-y-2">
                    <progress
                      className="progress progress-primary w-full"
                      value={progress.current}
                      max={progress.total}
                    />
                    <p className="text-sm text-center text-base-content/70">
                      Importing {progress.current} of {progress.total}...
                    </p>
                  </div>
                )}

                {/* Import button */}
                <div className="card-actions justify-end">
                  <button
                    className={`btn ${importMode === 'replace_all' ? 'btn-error' : 'btn-primary'}`}
                    onClick={handleImport}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Importing...
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        Import {importPreview.entries.length} Entries
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
