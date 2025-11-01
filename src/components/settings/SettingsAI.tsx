import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, KeyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getStoredApiKey, setStoredApiKey, removeStoredApiKey } from '../../services/aiCompletion';
import { toast } from 'react-toastify';

interface SettingsAIProps {
  onBack: () => void;
  onSave: () => void;
}

export default function SettingsAI({ onBack, onSave }: SettingsAIProps) {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState(getStoredApiKey() || '');
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (apiKey.trim()) {
      setStoredApiKey(apiKey.trim());
    } else {
      removeStoredApiKey();
    }
    toast.success(t('settings.saved'));
    onSave();
  };

  const handleRemove = () => {
    setApiKey('');
    removeStoredApiKey();
    toast.success('API key removed successfully');
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

      <div className="flex gap-3 justify-end mt-6">
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
