import { useState } from 'react'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { authApi, ApiError } from '../lib/api'

interface EmailVerificationRequiredModalProps {
  onClose: () => void
}

export function EmailVerificationRequiredModal({ onClose }: EmailVerificationRequiredModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResend = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await authApi.resendVerificationEmail()
      setSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : 'Failed to send verification email. Please try again later.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-backdrop modal-backdrop-enter" onClick={onClose} />
      <div className="modal-box modal-content-enter">
        <div className="flex flex-col items-center text-center">
          {success ? (
            <>
              <div className="bg-success/20 p-4 rounded-full mb-4">
                <CheckCircleIcon className="h-12 w-12 text-success" />
              </div>
              <h3 className="font-bold text-lg mb-2">Verification Email Sent</h3>
              <p className="text-base-content/70 mb-4">
                We've sent a new verification link to your email address.
                Please check your inbox and spam folder.
              </p>
            </>
          ) : (
            <>
              <div className="bg-warning/20 p-4 rounded-full mb-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-warning" />
              </div>
              <h3 className="font-bold text-lg mb-2">Email Verification Required</h3>
              <p className="text-base-content/70 mb-4">
                Please verify your email address before creating new content.
                Check your inbox for a verification link.
              </p>
              <p className="text-xs text-base-content/50 mb-4">
                If you didn't receive the email, check your spam folder or click below to resend.
              </p>
            </>
          )}

          {error && (
            <div className="alert alert-error text-sm mb-4 w-full">
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="modal-action justify-center gap-2">
          {!success && (
            <button
              className="btn btn-outline"
              onClick={handleResend}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Resend verification email'
              )}
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            {success ? 'Close' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  )
}
