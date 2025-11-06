import { useTranslation } from 'react-i18next';

export default function AboutEthos() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('about.ethos.title')}</h3>
      <p className="text-gray-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: t('about.ethos.description') }} />
      <div className="space-y-3">
        <div className="border-l-4 border-indigo-600 pl-4">
          <h4 className="font-semibold text-gray-800">{t('about.ethos.transparency')}</h4>
          <p className="text-sm text-gray-700">{t('about.ethos.transparencyDesc')}</p>
        </div>
        <div className="border-l-4 border-green-600 pl-4">
          <h4 className="font-semibold text-gray-800">{t('about.ethos.privacy')}</h4>
          <p className="text-sm text-gray-700">{t('about.ethos.privacyDesc')}</p>
        </div>
        <div className="border-l-4 border-blue-600 pl-4">
          <h4 className="font-semibold text-gray-800">{t('about.ethos.security')}</h4>
          <p className="text-sm text-gray-700">{t('about.ethos.securityDesc')}</p>
        </div>
        <div className="border-l-4 border-purple-600 pl-4">
          <h4 className="font-semibold text-gray-800">{t('about.ethos.empowerment')}</h4>
          <p className="text-sm text-gray-700">{t('about.ethos.empowermentDesc')}</p>
        </div>
        <div className="border-l-4 border-amber-600 pl-4">
          <h4 className="font-semibold text-gray-800">{t('about.ethos.accountability')}</h4>
          <p className="text-sm text-gray-700">{t('about.ethos.accountabilityDesc')}</p>
        </div>
      </div>
    </div>
  );
}
