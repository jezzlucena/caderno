import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { ArrowDownTrayIcon, LockClosedIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { useCryptoStore } from '../stores/cryptoStore'
import { useEntriesStore } from '../stores/entriesStore'
import { exportEntries } from '../lib/exportImport'

export function Export() {
  const { isKeyReady } = useCryptoStore()
  const { entries, fetchEntries, isLoading: entriesLoading } = useEntriesStore()

  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [useEncryption, setUseEncryption] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [entriesFetched, setEntriesFetched] = useState(false)

  // Fetch entries when component mounts
  useEffect(() => {
    if (isKeyReady && !entriesFetched) {
      fetchEntries().then(() => setEntriesFetched(true))
    }
  }, [isKeyReady, entriesFetched, fetchEntries])

  const handleExport = async () => {
    if (useEncryption) {
      if (!passphrase) {
        toast.error('Please enter a passphrase')
        return
      }
      if (passphrase !== confirmPassphrase) {
        toast.error('Passphrases do not match')
        return
      }
      if (passphrase.length < 8) {
        toast.error('Passphrase must be at least 8 characters')
        return
      }
    }

    if (entries.length === 0) {
      toast.error('No entries to export')
      return
    }

    setIsExporting(true)
    try {
      const blob = await exportEntries(entries, useEncryption ? passphrase : undefined)

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().split('T')[0]
      a.download = `caderno-export-${timestamp}.journal`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${entries.length} entries successfully!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isKeyReady) {
    return <UnlockPrompt />
  }

  return (
    <div className="min-h-screen bg-base-200 animate-fade-in flex flex-col">
      <Navbar currentPage="export" />

      <main id="main-content" className="container mx-auto p-4 sm:p-6 max-w-2xl flex-1">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-2">
              <ArrowDownTrayIcon className="h-7 w-7" />
              Export Journal
            </h1>
            <p className="text-base-content/70 mb-6">
              Download all your journal entries as a backup file.
            </p>

            {/* Entry count */}
            <div className="alert alert-info mb-6">
              <DocumentTextIcon className="h-5 w-5" />
              <span>
                {entriesLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  `${entries.length} entries will be exported`
                )}
              </span>
            </div>

            {/* Encryption option */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={useEncryption}
                  onChange={(e) => setUseEncryption(e.target.checked)}
                />
                <div>
                  <span className="label-text font-medium flex items-center gap-2">
                    <LockClosedIcon className="h-4 w-4" />
                    Encrypt export file
                  </span>
                  <p className="text-sm text-base-content/60">
                    Protect your export with an additional passphrase
                  </p>
                </div>
              </label>
            </div>

            {/* Passphrase inputs */}
            {useEncryption && (
              <div className="space-y-4 mt-4 p-4 bg-base-200 rounded-lg">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Passphrase</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter passphrase (min 8 characters)"
                    minLength={8}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Confirm Passphrase</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    placeholder="Confirm passphrase"
                  />
                  {passphrase && confirmPassphrase && passphrase !== confirmPassphrase && (
                    <label className="label">
                      <span className="label-text-alt text-error">Passphrases do not match</span>
                    </label>
                  )}
                </div>

                <div className="alert alert-warning">
                  <span className="text-sm">
                    Remember this passphrase! Without it, you cannot import your entries.
                  </span>
                </div>
              </div>
            )}

            {/* Export button */}
            <div className="card-actions justify-end mt-6">
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={isExporting || entriesLoading || entries.length === 0}
              >
                {isExporting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Export {entries.length} Entries
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
