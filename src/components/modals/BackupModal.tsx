import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { useJournalStore, type JournalEntry } from '../../store/useStore';
import CryptoJS from 'crypto-js';

interface BackupModalProps {
  onClose: () => void;
}

export default function BackupModal({ onClose }: BackupModalProps) {
  const { t } = useTranslation();
  const { exportEntries, importEntries } = useJournalStore();
  const [isClosing, setIsClosing] = useState(false);

  // Export states
  const [encrypt, setEncrypt] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');

  // Import states
  const [file, setFile] = useState<File | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [merge, setMerge] = useState(false);
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const [fileData, setFileData] = useState<{
    entries: JournalEntry[];
    encrypted: boolean;
    data: string;
  } | null>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleExport = () => {
    // Validate passphrase if encryption is enabled
    if (encrypt) {
      if (!exportPassphrase) {
        toast.error(t('modal.export.passphraseRequired'));
        return;
      }
      if (exportPassphrase !== confirmPassphrase) {
        toast.error(t('modal.export.passphraseMismatch'));
        return;
      }
      if (exportPassphrase.length < 8) {
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
        exportPassphrase
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

    toast.success(t('backup.export.success'));
    handleClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setNeedsPassphrase(false);
      setImportPassphrase('');

      // Read file to check if it's encrypted
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);

          setNeedsPassphrase(parsed.encrypted);
          setFileData(parsed);
        } catch (err) {
          toast.error(t('modal.import.invalidFormat'));
          console.error(err);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = () => {
    if (!file || !fileData) {
      toast.error(t('modal.import.fileRequired'));
      return;
    }

    try {
      let dataToImport: {
        entries: JournalEntry[];
      };

      if (fileData.encrypted) {
        if (!importPassphrase) {
          toast.error(t('modal.import.passphraseRequired'));
          return;
        }

        try {
          const decrypted = CryptoJS.AES.decrypt(fileData.data, importPassphrase).toString(CryptoJS.enc.Utf8);

          if (!decrypted) {
            toast.error(t('modal.import.incorrectPassphrase'));
            return;
          }

          dataToImport = JSON.parse(decrypted);
        } catch (err) {
          toast.error(t('modal.import.decryptionFailed'));
          console.error(err);
          return;
        }
      } else {
        dataToImport = fileData;
      }

      // Validate the data structure
      if (!dataToImport.entries || !Array.isArray(dataToImport.entries)) {
        toast.error(t('modal.import.invalidStructure'));
        return;
      }

      // Validate each entry has required fields
      const isValid = dataToImport.entries.every(entry =>
        entry.id && entry.title && entry.content && entry.createdAt && entry.updatedAt
      );

      if (!isValid) {
        toast.error(t('modal.import.invalidEntries'));
        return;
      }

      // Import the entries
      importEntries(dataToImport.entries as JournalEntry[], merge);

      // Show success and close
      toast.success(t('backup.import.success', { count: dataToImport.entries.length }));
      onClose();
    } catch (err) {
      toast.error(t('modal.import.importFailed'));
      console.error(err);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ${
          isClosing ? 'animate-slideDown' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('backup.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          {t('backup.description')}
        </p>

        {/* Export Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {t('backup.export.title')}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {t('backup.export.description')}
          </p>

          {/* Encryption Toggle */}
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
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
            <div className="space-y-2 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.export.passphrase')}
                </label>
                <input
                  type="password"
                  value={exportPassphrase}
                  onChange={(e) => setExportPassphrase(e.target.value)}
                  placeholder={t('modal.export.passphrasePlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon width={20} />
            <span>{t('backup.export.button')}</span>
          </button>
        </div>

        {/* Import Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {t('backup.import.title')}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {t('backup.import.description')}
          </p>

          {/* File input */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('modal.import.selectFile')}
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                {t('modal.import.selected', { filename: file.name })}
                {needsPassphrase && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                    <LockOpenIcon width={14} />
                    <span>{t('modal.import.encrypted')}</span>
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Passphrase input - only show if file is encrypted */}
          {needsPassphrase && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.import.passphrase')}
              </label>
              <input
                type="password"
                value={importPassphrase}
                onChange={(e) => setImportPassphrase(e.target.value)}
                placeholder={t('modal.import.passphrasePlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Merge option */}
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={merge}
                onChange={(e) => setMerge(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-gray-700">{t('modal.import.merge')}</span>
                <p className="text-xs text-gray-500 mt-1">
                  {t('modal.import.mergeDescription')}
                </p>
              </div>
            </label>
          </div>

          <button
            onClick={handleImport}
            disabled={!file}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpTrayIcon width={20} />
            <span>{t('backup.import.button')}</span>
          </button>
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('modal.export.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
