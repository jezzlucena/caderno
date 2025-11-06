import { useTranslation } from 'react-i18next';

export default function AboutPrivacy() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('about.privacyTab.title')}</h3>
      <p className="text-gray-700 leading-relaxed">{t('about.privacyTab.description')}</p>
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">🔐 {t('about.privacyTab.e2ee')}</h4>
          <p className="text-sm text-gray-700">{t('about.privacyTab.e2eeDesc')}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">🌐 {t('about.privacyTab.federated')}</h4>
          <p className="text-sm text-gray-700">{t('about.privacyTab.federatedDesc')}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">🚫 {t('about.privacyTab.noTracking')}</h4>
          <p className="text-sm text-gray-700">{t('about.privacyTab.noTrackingDesc')}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">👤 {t('about.privacyTab.userControl')}</h4>
          <p className="text-sm text-gray-700">{t('about.privacyTab.userControlDesc')}</p>
        </div>
      </div>
    </div>
  );
}
