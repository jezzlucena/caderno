import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '../../../store/useStore';
import { toast } from 'react-toastify';
import CommandBox from '../../CommandBox';

interface SettingsCloudSyncProps {
  onBack: () => void;
  onSave: () => void;
}

export default function SettingsCloudSync({ onBack, onSave }: SettingsCloudSyncProps) {
  const { t } = useTranslation();
  const { cloudSync, setSyncPassphrase, setAutoSync, clearCloudSyncSettings } = useSettingsStore();
  
  const [syncPassphrase, setSyncPassphraseLocal] = useState(cloudSync.syncPassphrase);
  const [autoSync, setAutoSyncLocal] = useState(cloudSync.autoSync);
  const [showSyncPassphrase, setShowSyncPassphrase] = useState(false);

  const handleSave = () => {
    setSyncPassphrase(syncPassphrase.trim());
    setAutoSync(autoSync);
    toast.success(t('settings.saved'));
    onSave();
  };

  const handleClear = () => {
    setSyncPassphraseLocal('');
    setAutoSyncLocal(false);
    clearCloudSyncSettings();
    toast.success('Cloud sync settings cleared');
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
      >
        <ArrowLeftIcon width={20} />
        <span>{t('settings.title')}</span>
      </button>

      <p className="text-sm text-gray-600 mb-4">
        {t('settings.cloudSync.description')}
      </p>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-indigo-800 mb-2">
          <strong>📘 Setup Instructions</strong>
        </p>
        <ol className="text-sm text-indigo-700 space-y-2 list-decimal list-inside">
          <li>
            <span>Start your Caderno Server:</span>
            <div className="mt-1">
              <CommandBox command="cd caderno/server && npm run dev" />
            </div>
          </li>
          <li>Set a secure passphrase to encrypt your journal entries</li>
          <li>Use the Cloud Sync button to backup your entries to IPFS</li>
        </ol>
        <p className="text-sm text-indigo-700 mt-2">
          Your data is encrypted locally before upload. No API keys needed!
        </p>
      </div>

      <div className="space-y-4">
        {/* Sync Passphrase */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.cloudSync.passphrase')}
          </label>
          <div className="relative">
            <input
              type={showSyncPassphrase ? 'text' : 'password'}
              value={syncPassphrase}
              onChange={(e) => setSyncPassphraseLocal(e.target.value)}
              placeholder={t('settings.cloudSync.passphrasePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24"
            />
            <button
              type="button"
              onClick={() => setShowSyncPassphrase(!showSyncPassphrase)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              {showSyncPassphrase ? t('settings.hide') : t('settings.show')}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('settings.cloudSync.passphraseNote')}
          </p>
        </div>

        {/* Auto Sync Toggle */}
        <div className="flex items-center gap-3 mt-4">
          <input
            type="checkbox"
            id="autoSync"
            checked={autoSync}
            onChange={(e) => setAutoSyncLocal(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <label htmlFor="autoSync" className="text-sm font-medium text-gray-700 cursor-pointer">
            {t('settings.cloudSync.autoSync')}
          </label>
        </div>
        <p className="text-xs text-gray-500 ml-7">
          {t('settings.cloudSync.autoSyncDescription')}
        </p>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <div className="flex-1">
          {syncPassphrase && (
            <button
              onClick={handleClear}
              className="text-xs text-red-600 hover:text-red-700"
            >
              {t('settings.cloudSync.clearSettings')}
            </button>
          )}

          <p className="text-xs text-gray-500">
            {t('settings.cloudSync.storageNote')}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {t('settings.cancel')}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          {t('settings.save')}
        </button>
      </div>
    </div>
  );
}
