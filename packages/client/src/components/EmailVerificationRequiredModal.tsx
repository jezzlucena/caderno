import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface EmailVerificationRequiredModalProps {
  onClose: () => void
}

export function EmailVerificationRequiredModal({ onClose }: EmailVerificationRequiredModalProps) {
  return (
    <div className="modal modal-open">
      <div className="modal-backdrop modal-backdrop-enter" onClick={onClose} />
      <div className="modal-box modal-content-enter">
        <div className="flex flex-col items-center text-center">
          <div className="bg-warning/20 p-4 rounded-full mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-warning" />
          </div>
          <h3 className="font-bold text-lg mb-2">Email Verification Required</h3>
          <p className="text-base-content/70 mb-4">
            Please verify your email address before creating new content.
            Check your inbox for a verification link.
          </p>
          <p className="text-xs text-base-content/50 mb-6">
            If you didn't receive the email, check your spam folder or contact support.
          </p>
        </div>
        <div className="modal-action justify-center">
          <button className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
