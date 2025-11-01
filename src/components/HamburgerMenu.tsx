import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bars3Icon, 
  XMarkIcon, 
  Cog6ToothIcon, 
  FolderPlusIcon, 
  ArrowDownTrayIcon, 
  DocumentArrowDownIcon, 
  CloudIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
import ExportModal from './ExportModal';
import ImportModal from './ImportModal';
import SettingsModal from './SettingsModal';
import ExportPDFModal from './ExportPDFModal';
import CloudSyncModal from './CloudSyncModal';
import ScheduledExportsModal from './ScheduledExportsModal';
import AboutModal from './AboutModal';

export default function HamburgerMenu() {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [isClosingMenu, setIsClosingMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialScreen, setSettingsInitialScreen] = useState<'main' | 'language' | 'ai' | 'cloudSync' | 'scheduledExports'>('main');
  const [showExportPDFModal, setShowExportPDFModal] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [showScheduledExportsModal, setShowScheduledExportsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleCloseMenu = () => {
    setIsClosingMenu(true);
    setTimeout(() => {
      setShowMenu(false);
      setIsClosingMenu(false);
    }, 200);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg border border-gray-300"
          title="Menu"
        >
          <span className="transition-transform duration-200" style={{ transform: showMenu ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            {showMenu ? <XMarkIcon width={20} /> : <Bars3Icon width={20} />}
          </span>
        </button>
        
        {showMenu && (
          <div
            className={`absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[250px] ${
              isClosingMenu ? 'animate-slideOut' : ''
            }`}
            style={{
              animation: isClosingMenu ? 'slideOut 0.2s ease-in forwards' : 'slideIn 0.2s ease-out forwards',
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
              @keyframes slideOut {
                from {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
                to {
                  opacity: 0;
                  transform: translateY(-10px) scale(0.95);
                }
              }
            `}</style>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSettingsInitialScreen('main');
                  setShowSettingsModal(true);
                  handleCloseMenu();
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
                  handleCloseMenu();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <FolderPlusIcon width={20} />
                <span className="font-medium">{t('journalList.import')}</span>
              </button>

              <button
                onClick={() => {
                  setShowExportModal(true);
                  handleCloseMenu();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon width={20} />
                <span className="font-medium">{t('journalList.export')}</span>
              </button>

              <button
                onClick={() => {
                  setShowExportPDFModal(true);
                  handleCloseMenu();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <DocumentArrowDownIcon width={20} />
                <span className="font-medium">{t('exportPDF.title')}</span>
              </button>

              <button
                onClick={() => {
                  setShowCloudSyncModal(true);
                  handleCloseMenu();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <CloudIcon width={20} />
                <span className="font-medium">{t('cloudSync.title')}</span>
              </button>

              <button
                onClick={() => {
                  setShowScheduledExportsModal(true);
                  handleCloseMenu();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ClockIcon width={20} />
                <span className="font-medium">Scheduled Exports</span>
              </button>

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={() => {
                  setShowAboutModal(true);
                  handleCloseMenu();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={20} height={20}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <span className="font-medium">About</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for menu */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          style={{
            animation: isClosingMenu ? 'fadeOut 0.2s ease-in forwards' : 'fadeIn 0.2s ease-out forwards',
          }}
          onClick={handleCloseMenu}
        ></div>
      )}

      {/* Modals */}
      {showSettingsModal && (
        <SettingsModal 
          onClose={() => {
            setShowSettingsModal(false);
            setSettingsInitialScreen('main');
          }}
          initialScreen={settingsInitialScreen}
        />
      )}
      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
      {showExportPDFModal && <ExportPDFModal onClose={() => setShowExportPDFModal(false)} />}
      {showCloudSyncModal && (
        <CloudSyncModal 
          onClose={() => setShowCloudSyncModal(false)}
          onOpenSettings={(screen) => {
            setShowCloudSyncModal(false);
            setSettingsInitialScreen(screen);
            setShowSettingsModal(true);
          }}
        />
      )}
      {showScheduledExportsModal && (
        <ScheduledExportsModal 
          onClose={() => setShowScheduledExportsModal(false)}
          onOpenSettings={(screen) => {
            setShowScheduledExportsModal(false);
            setSettingsInitialScreen(screen);
            setShowSettingsModal(true);
          }}
        />
      )}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
