import { useState } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { useJournalStore, type JournalEntry } from '../store/useStore';
import CryptoJS from 'crypto-js';

interface ImportModalProps {
  onClose: () => void;
}

export default function ImportModal({ onClose }: ImportModalProps) {
  const { importEntries } = useJournalStore();
  const [isClosing, setIsClosing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [merge, setMerge] = useState(false);
  const [error, setError] = useState('');
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
      setError('');
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
          setError('Invalid file format. Please select a valid Agenda backup file.');
          console.error(err);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = () => {
    setError('');

    if (!file || !fileData) {
      setError('Please select a file to import');
      return;
    }

    try {
      let dataToImport: {
        entries: JournalEntry[];
      };

      if (fileData.encrypted) {
        if (!passphrase) {
          setError('Please enter the passphrase for this encrypted file');
          return;
        }

        try {
          const decrypted = CryptoJS.AES.decrypt(fileData.data, passphrase).toString(CryptoJS.enc.Utf8);

          if (!decrypted) {
            setError('Incorrect passphrase. Please try again.');
            return;
          }

          dataToImport = JSON.parse(decrypted);
        } catch (err) {
          setError('Failed to decrypt file. Please check your passphrase.');
          console.error(err);
          return;
        }
      } else {
        dataToImport = fileData;
      }

      // Validate the data structure
      if (!dataToImport.entries || !Array.isArray(dataToImport.entries)) {
        setError('Invalid backup file structure');
        return;
      }

      // Validate each entry has required fields
      const isValid = dataToImport.entries.every(entry =>
        entry.id && entry.title && entry.content && entry.createdAt && entry.updatedAt
      );

      if (!isValid) {
        setError('Backup file contains invalid entries');
        return;
      }

      // Import the entries
      importEntries(dataToImport.entries as JournalEntry[], merge);

      // Show success and close
      onClose();
    } catch (err) {
      setError('Failed to import file. Please check the file format.');
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
        className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-md ${
          isClosing ? 'animate-slideDown' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Import Journal</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Import journal entries from a previously exported backup file.
        </p>

        {/* File input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select backup file
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name}
              {needsPassphrase && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                  <LockOpenIcon width={14} />
                  <span>Encrypted</span>
                </span>
              )}
            </p>
          )}
        </div>

        {/* Passphrase input - only show if file is encrypted */}
        {needsPassphrase && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passphrase
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase to decrypt"
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
              <span className="font-medium text-gray-700">Merge with existing entries</span>
              <p className="text-xs text-gray-500 mt-1">
                If unchecked, your current entries will be replaced
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
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
            onClick={handleImport}
            disabled={!file}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpTrayIcon width={18} />
            <span>Import</span>
          </button>
        </div>
      </div>
    </div>
  );
}
