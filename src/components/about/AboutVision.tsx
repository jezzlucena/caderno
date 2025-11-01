import { useTranslation } from 'react-i18next';

export default function AboutVision() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('about.vision.title')}</h3>
      <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('about.vision.description') }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">🏛️ {t('about.vision.sanctuary')}</h4>
          <p className="text-sm text-blue-800">{t('about.vision.sanctuaryDesc')}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">💪 {t('about.vision.empowerment')}</h4>
          <p className="text-sm text-green-800">{t('about.vision.empowermentDesc')}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">🌐 {t('about.vision.federation')}</h4>
          <p className="text-sm text-purple-800">{t('about.vision.federationDesc')}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-2">🔐 {t('about.vision.standard')}</h4>
          <p className="text-sm text-amber-800">{t('about.vision.standardDesc')}</p>
        </div>
      </div>
    </div>
  );
}
