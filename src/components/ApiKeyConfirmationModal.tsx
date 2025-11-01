interface ApiKeyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ApiKeyConfirmationModal({ isOpen, onClose, onConfirm }: ApiKeyConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-3">⚠️ Generate New API Key?</h3>
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-700">
            Generating a new API key will create a fresh authentication token for this server connection.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 font-semibold mb-2">Important:</p>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Current scheduled exports will become <strong>unavailable</strong> for management</li>
              <li>You won't be able to view, edit, or delete existing schedules with the new API key</li>
              <li>However, active scheduled exports will <strong>still execute</strong> at their set times</li>
              <li>They remain in the server's memory until they complete</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            Only proceed if you understand these implications or if you've lost access to your current API key.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
