import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon, KeyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '../../store/useStore';
import { toast } from 'react-toastify';

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

      <div className="flex items-center gap-2 mb-3">
        <ClockIcon width={20} className="text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">Scheduled Exports</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Configure your server connection for automated scheduled PDF exports
      </p>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 mb-3 border border-amber-200">
        <p className="text-xs text-amber-800 mb-2 font-semibold">
          Quick Setup: Start server → Generate API key → Configure below
        </p>
        <div className="text-xs text-amber-700 space-y-1">
          <p>• Run server: <code className="bg-white px-1 py-0.5 rounded text-[10px]">cd caderno/server && npm run dev</code></p>
          <p>• Generate key using button below or via command:</p>
          <div className="relative group ml-2">
            <div className="bg-gray-900 text-gray-100 p-1.5 rounded font-mono text-[9px] overflow-x-auto pr-12">
              curl -X POST http://localhost:3002/api/auth/register
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('curl -X POST http://localhost:3002/api/auth/register');
                toast.success('Command copied!');
              }}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-white text-[9px] rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Copy"
            >
              Copy
            </button>
          </div>
        </div>
        <a
          href="https://github.com/jezzlucena/caderno/blob/main/SCHEDULED_EXPORTS_GUIDE.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs text-amber-600 hover:text-amber-800 underline"
        >
          Full Guide →
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
            placeholder="http://localhost:3002"
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
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24 resize-none font-mono text-sm"
              style={{
                minHeight: '3.5rem',
                maxHeight: '12rem',
                overflow: 'auto'
              }}
            />
            <button
              type="button"
              onClick={() => setShowScheduledExportsApiKey(!showScheduledExportsApiKey)}
              className="absolute right-2 top-3 text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              {showScheduledExportsApiKey ? t('settings.hide') : t('settings.show')}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500 flex-1">
              Generate by POSTing to /api/auth/register
            </p>
            <div className="relative group">
              <button
                onClick={handleGenerateApiKeyClick}
                disabled={isGeneratingApiKey || !scheduledExportsServerUrl.trim()}
                className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isGeneratingApiKey ? 'Generating...' : 'Generate'}
              </button>
              {!scheduledExportsServerUrl.trim() && !isGeneratingApiKey && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
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

        {(scheduledExportsServerUrl || scheduledExportsApiKey) && (
          <button
            onClick={handleClear}
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
