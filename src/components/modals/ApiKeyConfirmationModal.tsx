import { useTranslation } from 'react-i18next';

interface ApiKeyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ApiKeyConfirmationModal({ isOpen, onClose, onConfirm }: ApiKeyConfirmationModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-3">{t('modal.apiKeyConfirmation.title')}</h3>
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-700">
            {t('modal.apiKeyConfirmation.description')}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 font-semibold mb-2">{t('modal.apiKeyConfirmation.warning.header')}</p>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li dangerouslySetInnerHTML={{ __html: t('modal.apiKeyConfirmation.warning.unavailable') }} />
              <li>{t('modal.apiKeyConfirmation.warning.noManagement')}</li>
              <li dangerouslySetInnerHTML={{ __html: t('modal.apiKeyConfirmation.warning.stillExecute') }} />
              <li>{t('modal.apiKeyConfirmation.warning.serverMemory')}</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            {t('modal.apiKeyConfirmation.advisory')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t('modal.apiKeyConfirmation.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            {t('modal.apiKeyConfirmation.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
