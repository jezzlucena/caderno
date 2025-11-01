import { useTranslation } from 'react-i18next';
import { LanguageIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

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

interface SettingsLanguageProps {
  onBack: () => void;
}

export default function SettingsLanguage({ onBack }: SettingsLanguageProps) {
  const { t, i18n } = useTranslation();

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
}
