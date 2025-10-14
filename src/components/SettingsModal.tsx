import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, KeyIcon, SparklesIcon, CloudIcon, LanguageIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getStoredApiKey, setStoredApiKey, removeStoredApiKey } from '../services/aiCompletion';
import { useSettingsStore } from '../store/useStore';

const languages = [
  { code: 'en-US', name: 'English (USA)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'pt-PT', name: 'Português (Portugal)' },
  { code: 'es-LA', name: 'Español (América Latina)' },
  { code: 'es-ES', name: 'Español (España)' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'ja', name: '日本語' },
];

type SettingsScreen = 'main' | 'language' | 'ai' | 'cloudSync';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState<SettingsScreen>('main');
  const [isClosing, setIsClosing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    cloudSync,
    setLighthouseApiKey,
    setSyncPassphrase,
    setAutoSync,
    clearCloudSyncSettings,
  } = useSettingsStore();

  const [lighthouseKey, setLighthouseKey] = useState('');
  const [syncPassphrase, setSyncPassphraseLocal] = useState('');
  const [autoSync, setAutoSyncLocal] = useState(false);
  const [showLighthouseKey, setShowLighthouseKey] = useState(false);
  const [showSyncPassphrase, setShowSyncPassphrase] = useState(false);

  useEffect(() => {
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    }

    // Load cloud sync settings
    setLighthouseKey(cloudSync.lighthouseApiKey);
    setSyncPassphraseLocal(cloudSync.syncPassphrase);
    setAutoSyncLocal(cloudSync.autoSync);
  }, [cloudSync]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleSave = () => {
    // Save AI API key
    if (apiKey.trim()) {
      setStoredApiKey(apiKey.trim());
    } else {
      removeStoredApiKey();
    }

    // Save cloud sync settings
    setLighthouseApiKey(lighthouseKey.trim());
    setSyncPassphrase(syncPassphrase.trim());
    setAutoSync(autoSync);

    setSaved(true);
    setTimeout(() => {
      handleClose();
    }, 1000);
  };

  const handleRemove = () => {
    setApiKey('');
    removeStoredApiKey();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const handleClearCloudSync = () => {
    setLighthouseKey('');
    setSyncPassphraseLocal('');
    setAutoSyncLocal(false);
    clearCloudSyncSettings();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const renderMainScreen = () => (
    <div className="space-y-3">
      {/* Language Option */}
      <button
        onClick={() => setCurrentScreen('language')}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <LanguageIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">{t('settings.language.title')}</h3>
            <p className="text-sm text-gray-600">{t('settings.language.description')}</p>
          </div>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
      </button>

      {/* AI Autocomplete Option */}
      <button
        onClick={() => setCurrentScreen('ai')}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">{t('settings.aiAutocomplete')}</h3>
            <p className="text-sm text-gray-600">{t('settings.aiDescription')}</p>
          </div>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
      </button>

      {/* Cloud Sync Option */}
      <button
        onClick={() => setCurrentScreen('cloudSync')}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <CloudIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">{t('settings.cloudSync.title')}</h3>
            <p className="text-sm text-gray-600">{t('settings.cloudSync.description')}</p>
          </div>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
      </button>
    </div>
  );

  const renderLanguageScreen = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentScreen('main')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
      >
        <ArrowLeftIcon width={20} />
        <span>{t('settings.title')}</span>
      </button>

      <div className="flex items-center gap-2 mb-3">
        <LanguageIcon width={20} className="text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">{t('settings.language.title')}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        {t('settings.language.description')}
      </p>

      <div className="space-y-2">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => {
              i18n.changeLanguage(language.code);
              localStorage.setItem('agenda-language', language.code);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors border ${
              i18n.language === language.code
                ? 'bg-indigo-50 text-indigo-700 font-medium border-indigo-200'
                : 'text-gray-700 hover:bg-gray-50 border-gray-200'
            }`}
          >
            {language.name}
          </button>
        ))}
      </div>
    </div>
  );

  const renderAIScreen = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentScreen('main')}
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
          onClick={() => setCurrentScreen('main')}
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

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">{t('settings.saved')}</p>
        </div>
      )}
    </div>
  );

  const renderCloudSyncScreen = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentScreen('main')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
      >
        <ArrowLeftIcon width={20} />
        <span>{t('settings.title')}</span>
      </button>

      <div className="flex items-center gap-2 mb-3">
        <CloudIcon width={20} className="text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">{t('settings.cloudSync.title')}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        {t('settings.cloudSync.description')}
      </p>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-indigo-800 mb-2">
          <strong>{t('settings.cloudSync.howToGetKey')}</strong>
        </p>
        <ol className="text-sm text-indigo-700 space-y-1 list-decimal list-inside">
          <li>{t('settings.cloudSync.step1')}</li>
          <li>{t('settings.cloudSync.step2')}</li>
          <li>{t('settings.cloudSync.step3')}</li>
        </ol>
        <a
          href="https://files.lighthouse.storage/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-800 underline"
        >
          {t('settings.cloudSync.getKeyLink')} →
        </a>
      </div>

      <div className="space-y-4">
        {/* Lighthouse API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <KeyIcon width={16} />
              {t('settings.cloudSync.apiKey')}
            </div>
          </label>
          <div className="relative">
            <input
              type={showLighthouseKey ? 'text' : 'password'}
              value={lighthouseKey}
              onChange={(e) => setLighthouseKey(e.target.value)}
              placeholder={t('settings.cloudSync.apiKeyPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24"
            />
            <button
              type="button"
              onClick={() => setShowLighthouseKey(!showLighthouseKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              {showLighthouseKey ? t('settings.hide') : t('settings.show')}
            </button>
          </div>
        </div>

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
        <div className="flex items-center gap-3">
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

        {(lighthouseKey || syncPassphrase) && (
          <button
            onClick={handleClearCloudSync}
            className="text-sm text-red-600 hover:text-red-700"
          >
            {t('settings.cloudSync.clearSettings')}
          </button>
        )}

        <p className="text-xs text-gray-500">
          {t('settings.cloudSync.storageNote')}
        </p>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <button
          onClick={() => setCurrentScreen('main')}
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

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">{t('settings.saved')}</p>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
          isClosing ? 'animate-slideDown' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        {currentScreen === 'main' && renderMainScreen()}
        {currentScreen === 'language' && renderLanguageScreen()}
        {currentScreen === 'ai' && renderAIScreen()}
        {currentScreen === 'cloudSync' && renderCloudSyncScreen()}
      </div>
    </div>
  );
}
