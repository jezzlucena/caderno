import { useState } from 'react';
import { toast } from 'react-toastify';
import { XMarkIcon, CloudArrowUpIcon, CloudArrowDownIcon, Cog6ToothIcon, CloudIcon } from '@heroicons/react/24/outline';
import { useJournalStore } from '../store/useStore';
import { useSettingsStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { uploadToIPFS, downloadFromIPFS } from '../services/cloudSync';

interface CloudSyncModalProps {
  onClose: () => void;
  onOpenSettings?: (screen: 'cloudSync') => void;
}

export default function CloudSyncModal({ onClose, onOpenSettings }: CloudSyncModalProps) {
  const { t } = useTranslation();
  const { entries, importEntries, setLastSyncMetadata, lastSyncMetadata } = useJournalStore();
  const { cloudSync, setLastCid } = useSettingsStore();

  const [isClosing, setIsClosing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [mergeOnDownload, setMergeOnDownload] = useState(true);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleUpload = async () => {
    if (!cloudSync.syncPassphrase) {
      toast.error(t('cloudSync.errors.noPassphrase'));
      return;
    }

    if (entries.length === 0) {
      toast.error(t('cloudSync.errors.noEntries'));
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(30);

      const metadata = await uploadToIPFS(
        entries,
        cloudSync.syncPassphrase
      );

      setUploadProgress(90);

      // Save metadata
      setLastSyncMetadata(metadata);
      setLastCid(metadata.cid);

      setUploadProgress(100);
      toast.success(
        t('cloudSync.success.uploaded', {
          count: entries.length,
          cid: metadata.cid.substring(0, 12) + '...',
        })
      );

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500);
    } catch (err) {
      toast.error(
        t('cloudSync.errors.uploadFailed', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      );
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async () => {
    if (!cloudSync.syncPassphrase) {
      toast.error(t('cloudSync.errors.noPassphrase'));
      return;
    }

    const cidToDownload = cloudSync.lastCid || lastSyncMetadata?.cid;

    if (!cidToDownload) {
      toast.error(t('cloudSync.errors.noCid'));
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(10);

    try {
      setDownloadProgress(30);

      const syncData = await downloadFromIPFS(cidToDownload, cloudSync.syncPassphrase);

      setDownloadProgress(70);

      // Import entries
      importEntries(syncData.entries, mergeOnDownload);

      setDownloadProgress(100);
      toast.success(
        t('cloudSync.success.downloaded', {
          count: syncData.entries.length,
        })
      );

      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1500);
    } catch (err) {
      toast.error(
        t('cloudSync.errors.downloadFailed', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      );
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const isConfigured = cloudSync.syncPassphrase;
  const hasBackup = cloudSync.lastCid || lastSyncMetadata?.cid;

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
          <h2 className="text-2xl font-bold text-gray-800">{t('cloudSync.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUploading || isDownloading}
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        {!isConfigured ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <CloudIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Set Up Cloud Sync
              </h3>
              <p className="text-gray-600">
                Securely backup and sync your journal entries across devices using IPFS
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">1</span>
                Start Caderno Server
              </h4>
              <div className="text-sm text-gray-700 ml-8 space-y-2">
                <p>Cloud Sync uses a self-hosted IPFS node. Start the server:</p>
                <div className="bg-gray-900 text-gray-100 p-2 rounded font-mono text-xs">
                  cd caderno/server && npm run dev
                </div>
              </div>

              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">2</span>
                Set Encryption Passphrase
              </h4>
              <p className="text-sm text-gray-700 ml-8">
                Go to <strong>Settings → Cloud Sync</strong> and set a secure passphrase to encrypt your journal entries before uploading to IPFS
              </p>

              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">3</span>
                Enjoy Free Forever Sync
              </h4>
              <p className="text-sm text-gray-700 ml-8">
                No API keys, no subscriptions, no trials. Your data stays on your infrastructure with full IPFS network redundancy!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (onOpenSettings) {
                      onOpenSettings('cloudSync');
                    }
                    handleClose();
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Cog6ToothIcon width={20} />
                  <span>Go to Settings to Configure</span>
                </button>
              
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                I'll Set This Up Later
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                Your data is encrypted locally before upload. Only you can decrypt it with your passphrase.
              </p>
              <a
                href="https://github.com/jezzlucena/caderno/blob/main/CLOUD_SYNC_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-indigo-600 hover:text-indigo-700 underline"
              >
                View Full Setup Guide →
              </a>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              {t('cloudSync.description')}
            </p>

            {/* Upload Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {t('cloudSync.upload.title')}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {t('cloudSync.upload.description', { count: entries.length })}
              </p>

              {!isUploading ? (
                <button
                  onClick={handleUpload}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CloudArrowUpIcon width={20} />
                  <span>{t('cloudSync.upload.button')}</span>
                </button>
              ) : (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{t('cloudSync.upload.uploading')}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {lastSyncMetadata && (
                <div className="mt-3 text-xs text-gray-500">
                  {t('cloudSync.lastSync', {
                    date: new Date(lastSyncMetadata.timestamp).toLocaleString(),
                  })}
                  <br />
                  CID: {lastSyncMetadata.cid.substring(0, 20)}...
                </div>
              )}
            </div>

            {/* Download Section */}
            {hasBackup && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('cloudSync.download.title')}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {t('cloudSync.download.description')}
                </p>

                <div className="mb-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mergeOnDownload}
                      onChange={(e) => setMergeOnDownload(e.target.checked)}
                      disabled={isUploading || isDownloading}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span>{t('cloudSync.download.merge')}</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    {t('cloudSync.download.mergeDescription')}
                  </p>
                </div>

                {!isDownloading ? (
                  <button
                    onClick={handleDownload}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CloudArrowDownIcon width={20} />
                    <span>{t('cloudSync.download.button')}</span>
                  </button>
                ) : (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{t('cloudSync.download.downloading')}</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleClose}
            disabled={isUploading || isDownloading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('cloudSync.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
