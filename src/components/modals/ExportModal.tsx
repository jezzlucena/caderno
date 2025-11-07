import { useState } from 'react';
import { toast } from 'react-toastify';
import { XMarkIcon, ArrowDownTrayIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useJournalStore } from '../../store/useStore';
import CryptoJS from 'crypto-js';

interface ExportModalProps {
  onClose: () => void;
}

export default function ExportModal({ onClose }: ExportModalProps) {
  const { t } = useTranslation();
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
        toast.error(t('modal.export.passphraseRequired'));
        return;
      }
      if (passphrase !== confirmPassphrase) {
        toast.error(t('modal.export.passphraseMismatch'));
        return;
      }
      if (passphrase.length < 8) {
        toast.error(t('modal.export.passphraseMinLength'));
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

    toast.success(t('modal.export.success'));
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
          <h2 className="text-2xl font-bold text-gray-800">{t('modal.export.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          {t('modal.export.description')}
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
              <span className="font-medium text-gray-700">{t('modal.export.encrypt')}</span>
            </div>
          </label>
        </div>

        {/* Passphrase inputs - only show if encryption is enabled */}
        {encrypt && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.export.passphrase')}
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={t('modal.export.passphrasePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.export.confirmPassphrase')}
              </label>
              <input
                type="password"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder={t('modal.export.confirmPassphrasePlaceholder')}
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
            {t('modal.export.cancel')}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon width={18} />
            <span>{t('modal.export.export')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
