import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, KeyIcon, SparklesIcon, CloudIcon, LanguageIcon, ChevronRightIcon, ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
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

type SettingsScreen = 'main' | 'language' | 'ai' | 'cloudSync' | 'scheduledExports';

interface SettingsModalProps {
  onClose: () => void;
  initialScreen?: SettingsScreen;
}

export default function SettingsModal({ onClose, initialScreen = 'main' }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState<SettingsScreen>('main');
  const [isClosing, setIsClosing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('left');
  const [highlightedSection, setHighlightedSection] = useState<SettingsScreen | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    cloudSync,
    scheduledExports,
    setLighthouseApiKey,
    setSyncPassphrase,
    setAutoSync,
    clearCloudSyncSettings,
    setScheduledExportsServerUrl,
    setScheduledExportsApiKey,
    clearScheduledExportsSettings,
  } = useSettingsStore();

  const [lighthouseKey, setLighthouseKey] = useState('');
  const [syncPassphrase, setSyncPassphraseLocal] = useState('');
  const [autoSync, setAutoSyncLocal] = useState(false);
  const [showLighthouseKey, setShowLighthouseKey] = useState(false);
  const [showSyncPassphrase, setShowSyncPassphrase] = useState(false);

  const [scheduledExportsServerUrl, setScheduledExportsServerUrlLocal] = useState('');
  const [scheduledExportsApiKey, setScheduledExportsApiKeyLocal] = useState('');
  const [showScheduledExportsApiKey, setShowScheduledExportsApiKey] = useState(false);

  useEffect(() => {
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    }

    // Load cloud sync settings
    setLighthouseKey(cloudSync.lighthouseApiKey);
    setSyncPassphraseLocal(cloudSync.syncPassphrase);
    setAutoSyncLocal(cloudSync.autoSync);

    // Load scheduled exports settings
    setScheduledExportsServerUrlLocal(scheduledExports.serverUrl);
    setScheduledExportsApiKeyLocal(scheduledExports.apiKey);

    // Educational animation: if initialScreen is not 'main', show click animation
    if (initialScreen !== 'main') {
      setTimeout(() => {
        setHighlightedSection(initialScreen);
        setTimeout(() => {
          setHighlightedSection(null);
          navigateToScreen(initialScreen);
        }, 800); // Show highlight for 800ms before navigating
      }, 400); // Wait 400ms after modal opens
    }
  }, [cloudSync, scheduledExports, initialScreen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const navigateToScreen = (screen: SettingsScreen) => {
    const direction = screen === 'main' ? 'right' : 'left';
    setTransitionDirection(direction);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentScreen(screen);
      setIsTransitioning(false);
    }, 300);
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

    // Save scheduled exports settings
    setScheduledExportsServerUrl(scheduledExportsServerUrl.trim());
    setScheduledExportsApiKey(scheduledExportsApiKey.trim());

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

  const handleClearScheduledExports = () => {
    setScheduledExportsServerUrlLocal('');
    setScheduledExportsApiKeyLocal('');
    clearScheduledExportsSettings();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const renderMainScreen = () => (
    <div className="space-y-3">
      {/* Language Option */}
      <button
        onClick={() => navigateToScreen('language')}
        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-all border border-gray-200 ${
          highlightedSection === 'language'
            ? 'bg-indigo-100 border-indigo-400 scale-105 shadow-lg animate-pulse'
            : ''
        }`}
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
        onClick={() => navigateToScreen('ai')}
        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-all border border-gray-200 ${
          highlightedSection === 'ai'
            ? 'bg-indigo-100 border-indigo-400 scale-105 shadow-lg animate-pulse'
            : ''
        }`}
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
        onClick={() => navigateToScreen('cloudSync')}
        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-all border border-gray-200 ${
          highlightedSection === 'cloudSync'
            ? 'bg-indigo-100 border-indigo-400 scale-105 shadow-lg animate-pulse'
            : ''
        }`}
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

      {/* Scheduled Exports Option */}
      <button
        onClick={() => navigateToScreen('scheduledExports')}
        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-all border border-gray-200 ${
          highlightedSection === 'scheduledExports'
            ? 'bg-indigo-100 border-indigo-400 scale-105 shadow-lg animate-pulse'
            : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <ClockIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">Scheduled Exports</h3>
            <p className="text-sm text-gray-600">Configure automated PDF exports server</p>
          </div>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
      </button>
    </div>
  );

  const renderLanguageScreen = () => (
    <div className="space-y-4">
      <button
        onClick={() => navigateToScreen('main')}
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
              localStorage.setItem('caderno-language', language.code);
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
        onClick={() => navigateToScreen('main')}
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
          onClick={() => navigateToScreen('main')}
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

  const renderScheduledExportsScreen = () => (
    <div className="space-y-4">
      <button
        onClick={() => navigateToScreen('main')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
      >
        <ArrowLeftIcon width={20} />
        <span>{t('settings.title')}</span>
      </button>

      <div className="flex items-center gap-2 mb-3">
        <ClockIcon width={20} className="text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">Scheduled Exports</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Configure your server connection for automated scheduled PDF exports
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-800 mb-2">
          <strong>📘 Setup Instructions</strong>
        </p>
        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
          <li>Set up and run your Caderno Server (see caderno-server folder)</li>
          <li>Generate an API key by POSTing to /api/auth/register</li>
          <li>Enter your server URL and API key below</li>
          <li>Use the "Scheduled Exports" menu option to manage schedules</li>
        </ol>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-amber-600 hover:text-amber-800 underline"
        >
          View Setup Guide →
        </a>
      </div>

      <div className="space-y-4">
        {/* Server URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Server URL
          </label>
          <input
            type="url"
            value={scheduledExportsServerUrl}
            onChange={(e) => setScheduledExportsServerUrlLocal(e.target.value)}
            placeholder="http://localhost:3001"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            The URL where your Caderno Server is running
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <KeyIcon width={16} />
              API Key
            </div>
          </label>
          <div className="relative">
            <input
              type={showScheduledExportsApiKey ? 'text' : 'password'}
              value={scheduledExportsApiKey}
              onChange={(e) => setScheduledExportsApiKeyLocal(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24"
            />
            <button
              type="button"
              onClick={() => setShowScheduledExportsApiKey(!showScheduledExportsApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              {showScheduledExportsApiKey ? t('settings.hide') : t('settings.show')}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Generate this by POSTing to /api/auth/register on your server
          </p>
        </div>

        {(scheduledExportsServerUrl || scheduledExportsApiKey) && (
          <button
            onClick={handleClearScheduledExports}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear Settings
          </button>
        )}

        <p className="text-xs text-gray-500">
          Settings are stored locally in your browser for security
        </p>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <button
          onClick={() => navigateToScreen('main')}
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
        onClick={() => navigateToScreen('main')}
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
          onClick={() => navigateToScreen('main')}
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

        <div 
          className={`transition-all duration-300 ${
            isTransitioning
              ? transitionDirection === 'left'
                ? 'opacity-0 -translate-x-4'
                : 'opacity-0 translate-x-4'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {currentScreen === 'main' && renderMainScreen()}
          {currentScreen === 'language' && renderLanguageScreen()}
          {currentScreen === 'ai' && renderAIScreen()}
          {currentScreen === 'cloudSync' && renderCloudSyncScreen()}
          {currentScreen === 'scheduledExports' && renderScheduledExportsScreen()}
        </div>
      </div>
    </div>
  );
}
