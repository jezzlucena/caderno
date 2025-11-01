import { useTranslation } from 'react-i18next';

export default function AboutSecurity() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('about.security.title')}</h3>
      <p className="text-gray-700 leading-relaxed">{t('about.security.description')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h4 className="font-semibold text-blue-900 text-sm mb-1">{t('about.security.encryption')}</h4>
          <p className="text-xs text-blue-800">{t('about.security.encryptionDesc')}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <h4 className="font-semibold text-green-900 text-sm mb-1">{t('about.security.federatedSecurity')}</h4>
          <p className="text-xs text-green-800">{t('about.security.federatedSecurityDesc')}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <h4 className="font-semibold text-purple-900 text-sm mb-1">{t('about.security.userFeatures')}</h4>
          <p className="text-xs text-purple-800">{t('about.security.userFeaturesDesc')}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <h4 className="font-semibold text-amber-900 text-sm mb-1">{t('about.security.auditing')}</h4>
          <p className="text-xs text-amber-800">{t('about.security.auditingDesc')}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <h4 className="font-semibold text-red-900 text-sm mb-1">{t('about.security.deadManSwitch')}</h4>
          <p className="text-xs text-red-800">{t('about.security.deadManSwitchDesc')}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <h4 className="font-semibold text-indigo-900 text-sm mb-1">{t('about.security.improvement')}</h4>
          <p className="text-xs text-indigo-800">{t('about.security.improvementDesc')}</p>
        </div>
      </div>
    </div>
  );
}
