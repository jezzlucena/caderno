import { useTranslation } from 'react-i18next';

export default function AboutMission() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('about.mission.title')}</h3>
      <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('about.mission.description') }} />
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h4 className="font-semibold text-indigo-900 mb-2">{t('about.mission.corePurpose')}</h4>
        <p className="text-sm text-indigo-800">
          {t('about.mission.corePurposeDesc')}
        </p>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-800">{t('about.mission.keyFeatures')}</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          <li>{t('about.mission.feature1')}</li>
          <li>{t('about.mission.feature2')}</li>
          <li>{t('about.mission.feature3')}</li>
          <li>{t('about.mission.feature4')}</li>
        </ul>
      </div>
    </div>
  );
}
