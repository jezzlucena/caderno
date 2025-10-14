import { PlusIcon, DocumentTextIcon, TrashIcon, ClockIcon, ArrowDownTrayIcon, Cog6ToothIcon, FolderPlusIcon, DocumentArrowDownIcon, CloudIcon, SparklesIcon, CalendarIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useJournalStore } from '../store/useStore';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ExportModal from './ExportModal';
import ImportModal from './ImportModal';
import SettingsModal from './SettingsModal';
import ExportPDFModal from './ExportPDFModal';
import CloudSyncModal from './CloudSyncModal';

export default function JournalList() {
  const { entries, addEntry, deleteEntry, setCurrentEntry } = useJournalStore();
  const { t } = useTranslation();
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [isClosingNewEntry, setIsClosingNewEntry] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExportPDFModal, setShowExportPDFModal] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleCloseNewEntry = () => {
    setIsClosingNewEntry(true);
    setTimeout(() => {
      setShowNewEntryModal(false);
      setIsClosingNewEntry(false);
    }, 300);
  };

  const handleCreateEntry = () => {
    if (newEntryTitle.trim()) {
      addEntry(newEntryTitle.trim());
      setNewEntryTitle('');
      handleCloseNewEntry();
    }
  };

  const handleSelectEntry = (id: string) => {
    setCurrentEntry(id);
  };

  const handleDeleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('journalList.deleteConfirm'))) {
      deleteEntry(id);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return t('journalList.today');
    if (days === 1) return t('journalList.yesterday');
    if (days < 7) return t('journalList.daysAgo', { count: days });

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getPreviewText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html.replaceAll(/<(br|h\d|p)>/gi, '').replaceAll(/<\/(br|h\d|p)>/gi, '\n');
    const text = temp.textContent || temp.innerText || '';
    return text.length > 100 && !text.endsWith('...') ? text.substring(0, 100) + '...' : text;
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 overflow-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DocumentTextIcon width={32} className="text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{t('app.name')}</h1>
                <p className="text-sm text-gray-600">{t('app.tagline')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg border border-gray-300"
              title="Menu"
            >
              <span className="transition-transform duration-200" style={{ transform: showMenu ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                {showMenu ? <XMarkIcon width={20} /> : <Bars3Icon width={20} />}
              </span>
            </button>
          </div>
        </header>

        {/* Hamburger Menu Dropdown */}
        {showMenu && (
          <div
            className="fixed top-20 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[250px]"
            style={{
              animation: 'slideIn 0.2s ease-out forwards',
            }}
          >
            <style>{`
              @keyframes slideIn {
                from {
                  opacity: 0;
                  transform: translateY(-10px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}</style>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowSettingsModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Cog6ToothIcon width={20} />
                <span className="font-medium">{t('settings.settings')}</span>
              </button>

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={() => {
                  setShowImportModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <FolderPlusIcon width={20} />
                <span className="font-medium">{t('journalList.import')}</span>
              </button>

              <button
                onClick={() => {
                  setShowExportModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon width={20} />
                <span className="font-medium">{t('journalList.export')}</span>
              </button>

              <button
                onClick={() => {
                  setShowExportPDFModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <DocumentArrowDownIcon width={20} />
                <span className="font-medium">{t('exportPDF.title')}</span>
              </button>

              <button
                onClick={() => {
                  setShowCloudSyncModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <CloudIcon width={20} />
                <span className="font-medium">{t('cloudSync.title')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Backdrop for menu */}
        {showMenu && (
          <div
            className="fixed inset-0 bg-black/10 z-40"
            style={{
              animation: 'fadeIn 0.2s ease-out forwards',
            }}
            onClick={() => setShowMenu(false)}
          ></div>
        )}

        <main>
          {entries.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <DocumentTextIcon width={64} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('journalList.noEntries')}</h2>
              <p className="text-gray-500 mb-6">{t('journalList.noEntriesDescription')}</p>
              <button
                onClick={() => setShowNewEntryModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {t('journalList.createEntry')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleSelectEntry(entry.id)}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer p-6 group ${
                    entry.isAISummarizing ? 'shimmer' : ''
                  }`}
                  style={entry.isAISummarizing ? {
                    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.1) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                  } : undefined}
                >
                  <style>{`
                    @keyframes shimmer {
                      0% {
                        background-position: -200% 0;
                      }
                      100% {
                        background-position: 200% 0;
                      }
                    }
                  `}</style>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                        {entry.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        <SparklesIcon className="inline-block -mt-0.5" width={18} />
                        {' '}
                        <span>{entry.summary || getPreviewText(entry.content)}</span>
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon width={14} />
                          <span>{t('journalList.created', { date: formatDate(entry.createdAt) })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ClockIcon width={14} />
                          <span>{t('journalList.updated', { date: formatDate(entry.updatedAt) })}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteEntry(entry.id, e)}
                      className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete entry"
                    >
                      <TrashIcon width={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button - Create Entry */}
      <button
        onClick={() => setShowNewEntryModal(true)}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-4 rounded-full transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-110 z-50"
        title={t('journalList.newEntry')}
        style={{
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <PlusIcon width={28} height={28} />
      </button>

      {/* New Entry Modal */}
      {showNewEntryModal && (
        <div
          className={`fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 ${
            isClosingNewEntry ? 'animate-fadeOut' : 'animate-fadeIn'
          }`}
          onClick={handleCloseNewEntry}
        >
          <div
            className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-md ${
              isClosingNewEntry ? 'animate-slideDown' : 'animate-slideUp'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('modal.newEntry.title')}</h2>
            <input
              type="text"
              value={newEntryTitle}
              onChange={(e) => setNewEntryTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateEntry()}
              placeholder={t('modal.newEntry.placeholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  handleCloseNewEntry();
                  setNewEntryTitle('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('modal.newEntry.cancel')}
              </button>
              <button
                onClick={handleCreateEntry}
                disabled={!newEntryTitle.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('modal.newEntry.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}

      {/* Export Modal */}
      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}

      {/* Import Modal */}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}

      {/* Export PDF Modal */}
      {showExportPDFModal && <ExportPDFModal onClose={() => setShowExportPDFModal(false)} />}

      {/* Cloud Sync Modal */}
      {showCloudSyncModal && <CloudSyncModal onClose={() => setShowCloudSyncModal(false)} />}
    </div>
  );
}
