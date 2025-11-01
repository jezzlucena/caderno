import { useState } from 'react';
import { toast } from 'react-toastify';
import { XMarkIcon, ArrowDownTrayIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useJournalStore } from '../store/useStore';
import CryptoJS from 'crypto-js';

interface ExportModalProps {
  onClose: () => void;
}

export default function ExportModal({ onClose }: ExportModalProps) {
  const { exportEntries } = useJournalStore();
  const [isClosing, setIsClosing] = useState(false);
  const [encrypt, setEncrypt] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleExport = () => {
    // Validate passphrase if encryption is enabled
    if (encrypt) {
      if (!passphrase) {
        toast.error('Please enter a passphrase');
        return;
      }
      if (passphrase !== confirmPassphrase) {
        toast.error('Passphrases do not match');
        return;
      }
      if (passphrase.length < 8) {
        toast.error('Passphrase must be at least 8 characters');
        return;
      }
    }

    // Get entries from store
    const entries = exportEntries();
    const dataToExport = {
      version: '1.0',
      exportDate: Date.now(),
      entries,
    };

    let fileContent: string;
    let fileName: string;

    if (encrypt) {
      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(dataToExport),
        passphrase
      ).toString();

      fileContent = JSON.stringify({
        encrypted: true,
        data: encrypted,
      });
      fileName = `caderno-backup-encrypted-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      fileContent = JSON.stringify(dataToExport, null, 2);
      fileName = `caderno-backup-${new Date().toISOString().split('T')[0]}.json`;
    }

    // Create and download the file
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Journal exported successfully');
    handleClose();
  };

  return (
    <div
      className={`fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${
          isClosing ? 'animate-slideDown' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Export Journal</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Export all your journal entries to a file. You can optionally encrypt the file with a passphrase.
        </p>

        {/* Encryption Toggle */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={encrypt}
              onChange={(e) => setEncrypt(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2">
              <LockClosedIcon width={18} className="text-gray-600" />
              <span className="font-medium text-gray-700">Encrypt file with passphrase</span>
            </div>
          </label>
        </div>

        {/* Passphrase inputs - only show if encryption is enabled */}
        {encrypt && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passphrase
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase (min 8 characters)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Passphrase
              </label>
              <input
                type="password"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Confirm passphrase"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon width={18} />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
