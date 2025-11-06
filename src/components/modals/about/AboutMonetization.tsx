import { useTranslation } from 'react-i18next';

export default function AboutMonetization() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('about.sustainability.title')}</h3>
      <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('about.sustainability.description') }} />
      <div className="space-y-3">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💼 {t('about.sustainability.saas')}</h4>
          <p className="text-sm text-blue-800">{t('about.sustainability.saasDesc')}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">🏢 {t('about.sustainability.enterprise')}</h4>
          <p className="text-sm text-green-800">{t('about.sustainability.enterpriseDesc')}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">❤️ {t('about.sustainability.donations')}</h4>
          <p className="text-sm text-purple-800">{t('about.sustainability.donationsDesc')}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-red-900 mb-2">🚫 {t('about.sustainability.never')}</h4>
          <p className="text-sm text-red-800">{t('about.sustainability.neverDesc')}</p>
        </div>
      </div>
      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>{t('about.sustainability.transparentFinance')}</strong> {t('about.sustainability.transparentFinanceDesc')}
        </p>
      </div>
    </div>
  );
}
