import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyIcon, ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '../../../store/useStore';
import { toast } from 'react-toastify';
import CommandBox from '../../CommandBox';

interface SettingsScheduledExportsProps {
  onBack: () => void;
  onSave: () => void;
  onShowApiKeyConfirmation: () => void;
}

export default function SettingsScheduledExports({ onBack, onSave, onShowApiKeyConfirmation }: SettingsScheduledExportsProps) {
  const { t } = useTranslation();
  const { scheduledExports, setScheduledExportsServerUrl, setScheduledExportsApiKey, clearScheduledExportsSettings } = useSettingsStore();
  
  const [scheduledExportsServerUrl, setScheduledExportsServerUrlLocal] = useState(scheduledExports.serverUrl);
  const [scheduledExportsApiKey, setScheduledExportsApiKeyLocal] = useState(scheduledExports.apiKey);
  const [showScheduledExportsApiKey, setShowScheduledExportsApiKey] = useState(false);
  const [isGeneratingApiKey, setIsGeneratingApiKey] = useState(false);

  const handleSave = () => {
    setScheduledExportsServerUrl(scheduledExportsServerUrl.trim());
    setScheduledExportsApiKey(scheduledExportsApiKey.trim());
    toast.success(t('settings.saved'));
    onSave();
  };

  const handleClear = () => {
    setScheduledExportsServerUrlLocal('');
    setScheduledExportsApiKeyLocal('');
    clearScheduledExportsSettings();
    toast.success('Scheduled exports settings cleared');
  };

  const handleGenerateApiKeyClick = () => {
    // Validate server URL before showing confirmation
    if (!scheduledExportsServerUrl.trim()) {
      toast.error('Server URL is required');
      return;
    }

    // Validate URL format
    try {
      new URL(scheduledExportsServerUrl.trim());
    } catch {
      toast.error('Invalid Server URL format');
      return;
    }

    // Store refs for the callback
    const refs = {
      serverUrl: scheduledExportsServerUrl,
      setApiKey: setScheduledExportsApiKeyLocal,
      setShowApiKey: setShowScheduledExportsApiKey,
      setIsGenerating: setIsGeneratingApiKey
    };

    // Store in component state for callback access
    (window as unknown as { __apiKeyGenerationRefs: typeof refs }).__apiKeyGenerationRefs = refs;
    
    // Show confirmation modal
    onShowApiKeyConfirmation();
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
        Configure your server connection for automated scheduled PDF exports
      </p>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 mb-3 border border-amber-200">
        <p className="text-amber-800 mb-2 font-semibold">
          Quick Setup: Start server → Generate API key → Configure below
        </p>
        <div className="text-amber-700 space-y-1">
          <p>• Run server:</p>
          <CommandBox command="cd caderno/server && npm run dev" />

          <p>• Generate key using button below or via command:</p>
          <CommandBox command="curl -X POST http://localhost:3002/api/auth/register" />
        </div>
        <a
          href="https://github.com/jezzlucena/caderno/blob/main/SCHEDULED_EXPORTS_GUIDE.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-amber-600 hover:text-amber-800 underline"
        >
          Full Guide →
        </a>
      </div>

      <div className="relative space-y-4">
        {/* Server URL */}
        <div className="mt-4">
          <label className="absolute px-2 pt-1 block text-[11px] font-medium text-gray-700" htmlFor="server-url">
            Server URL
          </label>
          <input
            type="url"
            id="server-url"
            value={scheduledExportsServerUrl}
            onChange={(e) => setScheduledExportsServerUrlLocal(e.target.value)}
            placeholder="http://localhost:3002"
            className="text-sm w-full px-2 pt-5 pb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            The URL where your Caderno Server is running
          </p>
        </div>

        {/* API Key */}
        <div className="relative mt-4">
          <label className="absolute px-2 pt-1 block text-[11px] font-medium text-gray-700">
            <div className="flex items-center gap-1">
              <KeyIcon width={12} />
              API Key
            </div>
          </label>
          <div className="relative">
            <textarea
              value={showScheduledExportsApiKey ? scheduledExportsApiKey : scheduledExportsApiKey.replace(/./g, '•')}
              onChange={(e) => {
                // If showing, update directly; if hidden, need to track actual value
                if (showScheduledExportsApiKey) {
                  setScheduledExportsApiKeyLocal(e.target.value);
                } else {
                  // When hidden, we need to figure out what was typed
                  // This is complex, so let's auto-show when user starts typing
                  setShowScheduledExportsApiKey(true);
                  setScheduledExportsApiKeyLocal(e.target.value);
                }
              }}
              placeholder="Enter your API key"
              rows={1}
              className="text-xs w-full px-2 pt-5 pb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24 resize-none font-mono"
              style={{
                minHeight: '3rem',
                maxHeight: '12rem',
                overflow: 'auto'
              }}
            />
            <button
              type="button"
              onClick={() => setShowScheduledExportsApiKey(!showScheduledExportsApiKey)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              {showScheduledExportsApiKey ? t('settings.hide') : t('settings.show')}
            </button>
          </div>
          <div className="flex items-top gap-2">
            <p className="text-gray-500 flex-1 text-xs">
              Generate by POSTing to /api/auth/register
            </p>
            <div className="relative group">
              <button
                onClick={handleGenerateApiKeyClick}
                disabled={isGeneratingApiKey || !scheduledExportsServerUrl.trim()}
                className="text-sm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isGeneratingApiKey ? <ArrowPathIcon width={18} className="animate-spin" /> : <ArrowPathIcon width={18} />}
              </button>
              {!scheduledExportsServerUrl.trim() && !isGeneratingApiKey && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                    Server URL is required and must be valid
                    <div className="absolute top-full right-4 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify- mt-6">
        <div className="flex-1">
          {(scheduledExportsServerUrl || scheduledExportsApiKey) && (
            <button
              onClick={handleClear}
              className="block mt-1 text-xs text-red-600 hover:text-red-700"
            >
              Clear Settings
            </button>
          )}
          <p className="text-left flex-1 text-gray-500 text-xs">
            Settings are stored locally in your browser for security
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
