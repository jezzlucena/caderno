import { useTranslation } from 'react-i18next';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function AboutDownloads() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('about.downloads.title')}</h3>
      <p className="text-gray-700 leading-relaxed">
        {t('about.downloads.description')}
      </p>
      <div className="space-y-3">
        <a
          href="/src/assets/Caderno_Mission_and_Vision_Document.md"
          download
          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
        >
          <ArrowDownTrayIcon className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
          <div className="flex-1">
            <div className="font-semibold text-gray-800 group-hover:text-indigo-600">{t('about.downloads.markdown')}</div>
            <div className="text-sm text-gray-600">{t('about.downloads.markdownDesc')}</div>
          </div>
        </a>
        <a
          href="/src/assets/Caderno_Mission_and_Vision_Document.pdf"
          download
          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
        >
          <ArrowDownTrayIcon className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
          <div className="flex-1">
            <div className="font-semibold text-gray-800 group-hover:text-indigo-600">{t('about.downloads.pdf')}</div>
            <div className="text-sm text-gray-600">{t('about.downloads.pdfDesc')}</div>
          </div>
        </a>
        <a
          href="/src/assets/Caderno_Mission_and_Vision_Document.docx"
          download
          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
        >
          <ArrowDownTrayIcon className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
          <div className="flex-1">
            <div className="font-semibold text-gray-800 group-hover:text-indigo-600">{t('about.downloads.word')}</div>
            <div className="text-sm text-gray-600">{t('about.downloads.wordDesc')}</div>
          </div>
        </a>
      </div>
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
        <p className="text-sm text-blue-800">
          <strong>{t('about.downloads.note')}</strong> {t('about.downloads.noteDesc')}
        </p>
      </div>
    </div>
  );
}
