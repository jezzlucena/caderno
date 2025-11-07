import { useState } from 'react';
import { toast } from 'react-toastify';
import { XMarkIcon, ArrowUpTrayIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useJournalStore, type JournalEntry } from '../../store/useStore';
import CryptoJS from 'crypto-js';

interface ImportModalProps {
  onClose: () => void;
}

export default function ImportModal({ onClose }: ImportModalProps) {
  const { t } = useTranslation();
  const { importEntries } = useJournalStore();
  const [isClosing, setIsClosing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setNeedsPassphrase(false);
      setPassphrase('');

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
        if (!passphrase) {
          toast.error(t('modal.import.passphraseRequired'));
          return;
        }

        try {
          const decrypted = CryptoJS.AES.decrypt(fileData.data, passphrase).toString(CryptoJS.enc.Utf8);

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
      toast.success(t('modal.import.success', { count: dataToImport.entries.length }));
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
        className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${
          isClosing ? 'animate-slideDown' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('modal.import.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          {t('modal.import.description')}
        </p>

        {/* File input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('modal.import.selectFile')}
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('modal.import.passphrase')}
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={t('modal.import.passphrasePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Merge option */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
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

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('modal.import.cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={!file}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpTrayIcon width={18} />
            <span>{t('modal.import.import')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
