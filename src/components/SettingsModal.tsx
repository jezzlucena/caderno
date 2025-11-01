import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, SparklesIcon, CloudIcon, LanguageIcon, ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import SettingsLanguage from './settings/SettingsLanguage';
import SettingsAI from './settings/SettingsAI';
import SettingsCloudSync from './settings/SettingsCloudSync';
import SettingsScheduledExports from './settings/SettingsScheduledExports';
import ApiKeyConfirmationModal from './ApiKeyConfirmationModal';

type SettingsScreen = 'main' | 'language' | 'ai' | 'cloudSync' | 'scheduledExports';

interface SettingsModalProps {
  onClose: () => void;
  initialScreen?: SettingsScreen;
}

export default function SettingsModal({ onClose, initialScreen = 'main' }: SettingsModalProps) {
  const { t } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState<SettingsScreen>('main'); // Always start at main
  const [isClosing, setIsClosing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('left');
  const [highlightedSection, setHighlightedSection] = useState<SettingsScreen | null>(null);
  const [showApiKeyConfirmation, setShowApiKeyConfirmation] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Measure content height whenever currentScreen changes
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [currentScreen, isTransitioning]);

  // Handle educational animation for non-main initial screens OR direct navigation
  useEffect(() => {
    if (initialScreen !== 'main' && currentScreen === 'main') {
      // Educational animation: show click animation then navigate
      setTimeout(() => {
        setHighlightedSection(initialScreen);
        setTimeout(() => {
          setHighlightedSection(null);
          navigateToScreen(initialScreen);
        }, 800); // Show highlight for 800ms before navigating
      }, 400); // Wait 400ms after modal opens
    }
  }, []);

  // Watch for initialScreen changes (from URL navigation while modal is open)
  useEffect(() => {
    // Skip on initial mount - let the educational animation handle it
    if (currentScreen === 'main' && initialScreen !== 'main') {
      return;
    }
    
    if (initialScreen !== currentScreen && currentScreen !== 'main') {
      const direction = initialScreen === 'main' ? 'right' : 'left';
      setTransitionDirection(direction);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentScreen(initialScreen);
        setIsTransitioning(false);
      }, 300);
    }
  }, [initialScreen]);

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
    
    // Update URL
    const screenToHash: Record<SettingsScreen, string> = {
      main: '#settings',
      language: '#settings/language',
      ai: '#settings/ai',
      cloudSync: '#settings/cloudSync',
      scheduledExports: '#settings/scheduledExports',
    };
    window.location.hash = screenToHash[screen];
    
    setTimeout(() => {
      setCurrentScreen(screen);
      setIsTransitioning(false);
    }, 300);
  };

  const handleSaveAndClose = () => {
    setTimeout(() => {
      handleClose();
    }, 500);
  };

  const handleConfirmApiKeyGeneration = async () => {
    setShowApiKeyConfirmation(false);
    
    // Get refs from window
    const refs = (window as unknown as { __apiKeyGenerationRefs?: {
      serverUrl: string;
      setApiKey: (key: string) => void;
      setShowApiKey: (show: boolean) => void;
      setIsGenerating: (isGenerating: boolean) => void;
    }}).__apiKeyGenerationRefs;
    if (!refs) return;
    
    const { serverUrl, setApiKey, setShowApiKey, setIsGenerating } = refs;
    
    setIsGenerating(true);

    try {
      // Remove trailing slash from server URL to avoid double slashes
      const baseUrl = serverUrl.trim().replace(/\/$/, '');
      
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.api_key) {
        setApiKey(data.data.api_key);
        setShowApiKey(true);
        toast.success('API key generated successfully');
      } else {
        toast.error(data.message || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
      toast.error('Network error. Please check your server URL and try again.');
    } finally {
      setIsGenerating(false);
      // Clean up refs
      delete (window as unknown as { __apiKeyGenerationRefs?: unknown }).__apiKeyGenerationRefs;
    }
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
            <h3 className="font-semibold text-gray-800">{t('scheduledExports.title')}</h3>
            <p className="text-sm text-gray-600">{t('scheduledExports.description')}</p>
          </div>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
      </button>
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
        className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl flex flex-col ${
          isClosing ? 'animate-slideDown' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '90vh',
        }}
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
          className="overflow-y-auto"
          style={{
            height: contentHeight > 0 ? `${contentHeight}px` : 'auto',
            transition: 'height 300ms ease-in-out',
            maxHeight: 'calc(90vh - 120px)', // Account for header
          }}
        >
          <div 
            ref={contentRef}
            className={`transition-all duration-300 ${
              isTransitioning
                ? transitionDirection === 'left'
                  ? 'opacity-0 -translate-x-4'
                  : 'opacity-0 translate-x-4'
                : 'opacity-100 translate-x-0'
            }`}
          >
            {currentScreen === 'main' && renderMainScreen()}
            {currentScreen === 'language' && <SettingsLanguage onBack={() => navigateToScreen('main')} />}
            {currentScreen === 'ai' && <SettingsAI onBack={() => navigateToScreen('main')} onSave={handleSaveAndClose} />}
            {currentScreen === 'cloudSync' && <SettingsCloudSync onBack={() => navigateToScreen('main')} onSave={handleSaveAndClose} />}
            {currentScreen === 'scheduledExports' && <SettingsScheduledExports onBack={() => navigateToScreen('main')} onSave={handleSaveAndClose} onShowApiKeyConfirmation={() => setShowApiKeyConfirmation(true)} />}
          </div>
        </div>
      </div>
      
      {/* API Key Confirmation Modal - Rendered at app level */}
      <ApiKeyConfirmationModal 
        isOpen={showApiKeyConfirmation}
        onClose={() => setShowApiKeyConfirmation(false)}
        onConfirm={handleConfirmApiKeyGeneration}
      />
    </div>
  );
}
