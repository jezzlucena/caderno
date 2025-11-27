import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { decryptToBlob } from '../lib/crypto'
import { downloadPdf } from '../lib/pdfGenerator'

interface PayloadResponse {
  encryptedPayload: string
  payloadIv: string
  switchName: string
  triggeredAt: string
}

export function Unlock() {
  const { switchId } = useParams<{ switchId: string }>()
  const [status, setStatus] = useState<'loading' | 'ready' | 'downloading' | 'error' | 'success'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [payloadData, setPayloadData] = useState<PayloadResponse | null>(null)
  const [decryptionKey, setDecryptionKey] = useState<string | null>(null)

  useEffect(() => {
    // Extract decryption key from URL hash
    const hash = window.location.hash.slice(1) // Remove the '#'
    if (!hash) {
      setError('Missing decryption key. Please use the complete link from your email.')
      setStatus('error')
      return
    }
    setDecryptionKey(hash)

    // Fetch the encrypted payload
    fetchPayload()
  }, [switchId])

  const fetchPayload = async () => {
    try {
      const response = await fetch(`/api/switches/${switchId}/payload`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch payload')
      }

      const data: PayloadResponse = await response.json()
      setPayloadData(data)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the payload')
      setStatus('error')
    }
  }

  const handleDownload = async () => {
    if (!payloadData || !decryptionKey) return

    setStatus('downloading')
    try {
      // Decrypt the payload
      const pdfBlob = await decryptToBlob(
        decryptionKey,
        payloadData.encryptedPayload,
        payloadData.payloadIv,
        'application/pdf'
      )

      // Generate filename
      const date = new Date(payloadData.triggeredAt).toISOString().split('T')[0]
      const filename = `journal-entries-${date}.pdf`

      // Trigger download
      downloadPdf(pdfBlob, filename)
      setStatus('success')
    } catch (err) {
      console.error('Decryption error:', err)
      setError('Failed to decrypt the PDF. The link may be invalid or corrupted.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl max-w-lg w-full">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Caderno</h1>
            <p className="text-base-content/60">Secure Journal Delivery</p>
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4 text-base-content/70">Loading encrypted content...</p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-error mb-2">Unable to Load</h2>
              <p className="text-base-content/70 mb-4">{error}</p>
              <p className="text-sm text-base-content/50">
                If you believe this is an error, please contact the person who shared this link with you.
              </p>
            </div>
          )}

          {/* Ready State */}
          {status === 'ready' && payloadData && (
            <div className="text-center py-4">
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-xl font-bold mb-2">Journal Entries Available</h2>
              <p className="text-base-content/70 mb-2">
                From: <strong>{payloadData.switchName}</strong>
              </p>
              <p className="text-sm text-base-content/50 mb-6">
                Triggered on {new Date(payloadData.triggeredAt).toLocaleString()}
              </p>

              <div className="bg-base-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-base-content/70">
                  This PDF contains private journal entries that were encrypted and prepared for you.
                  Click below to decrypt and download.
                </p>
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleDownload}
              >
                Decrypt & Download PDF
              </button>
            </div>
          )}

          {/* Downloading State */}
          {status === 'downloading' && (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4 text-base-content/70">Decrypting and preparing your download...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-success mb-2">Download Complete</h2>
              <p className="text-base-content/70 mb-6">
                The PDF has been decrypted and downloaded to your device.
              </p>
              <button
                className="btn btn-outline"
                onClick={handleDownload}
              >
                Download Again
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="divider"></div>
          <p className="text-xs text-center text-base-content/50">
            This content is end-to-end encrypted. The decryption key in your link never leaves your browser.
          </p>
        </div>
      </div>
    </div>
  )
}
