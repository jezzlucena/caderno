import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, KeyIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { getStoredApiKey, setStoredApiKey, removeStoredApiKey } from '../services/aiCompletion';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      setStoredApiKey(apiKey.trim());
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      removeStoredApiKey();
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleRemove = () => {
    setApiKey('');
    removeStoredApiKey();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* AI Autocomplete Section */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon width={20} className="text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-800">{t('settings.aiAutocomplete')}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {t('settings.aiDescription')}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>{t('settings.howToGetKey')}</strong>
              </p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>{t('settings.step1')}</li>
                <li>{t('settings.step2')}</li>
                <li>{t('settings.step3')}</li>
              </ol>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {t('settings.getKeyLink')} →
              </a>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <KeyIcon width={16} />
                  {t('settings.apiKey')}
                </div>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={t('settings.apiKeyPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  {showKey ? t('settings.hide') : t('settings.show')}
                </button>
              </div>

              {apiKey && (
                <button
                  onClick={handleRemove}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {t('settings.removeKey')}
                </button>
              )}

              <p className="text-xs text-gray-500">
                {t('settings.keyStorageNote')}
              </p>
            </div>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">{t('settings.saved')}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
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
    </div>
  );
}
