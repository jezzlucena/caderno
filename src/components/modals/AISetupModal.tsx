import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AISetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function AISetupModal({ isOpen, onClose, onOpenSettings }: AISetupModalProps) {
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('caderno-ai-setup-dismissed', 'true');
    }
    onClose();
  };

  const handleGoToSettings = () => {
    handleDismiss();
    onOpenSettings();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={handleDismiss}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('aiSetup.title')}</h2>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <SparklesIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {t('aiSetup.header.title')}
            </h3>
            <p className="text-gray-600">
              {t('aiSetup.header.description')}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 space-y-4">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">1</span>
              {t('aiSetup.step1.title')}
            </h4>
            <p className="text-sm text-gray-700 ml-8" dangerouslySetInnerHTML={{ __html: t('aiSetup.step1.description') }} />

            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">2</span>
              {t('aiSetup.step2.title')}
            </h4>
            <div className="text-sm text-gray-700 ml-8 space-y-2">
              <p>{t('aiSetup.step2.description')}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t('aiSetup.step2.listItem1')}</li>
                <li>{t('aiSetup.step2.listItem2')}</li>
                <li>{t('aiSetup.step2.listItem3')}</li>
                <li>{t('aiSetup.step2.listItem4')}</li>
              </ul>
            </div>

            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">3</span>
              {t('aiSetup.step3.title')}
            </h4>
            <p className="text-sm text-gray-700 ml-8">
              {t('aiSetup.step3.description')} <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">{t('aiSetup.step3.shortcut')}</kbd>
            </p>
          </div>

          {/* Don't Show Again Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="dontShowAgain" className="text-sm text-gray-700 cursor-pointer">
              {t('aiSetup.checkbox.dontShowAgain')}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoToSettings}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Cog6ToothIcon width={20} />
              <span>{t('aiSetup.buttons.goToSettings')}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {dontShowAgain ? t('aiSetup.buttons.dontShowAgain') : t('aiSetup.buttons.maybeLater')}
            </button>
          </div>

          {/* Help Link */}
          <div className="text-center">
            <a
              href="https://github.com/jezzlucena/caderno/blob/main/AI_AUTOCOMPLETE_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              {t('aiSetup.helpLink')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
