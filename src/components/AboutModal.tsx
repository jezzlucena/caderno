import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import AboutMission from './about/AboutMission';
import AboutVision from './about/AboutVision';
import AboutEthos from './about/AboutEthos';
import AboutPrivacy from './about/AboutPrivacy';
import AboutSecurity from './about/AboutSecurity';
import AboutMonetization from './about/AboutMonetization';
import AboutTech from './about/AboutTech';
import AboutDownloads from './about/AboutDownloads';

interface AboutModalProps {
  onClose: () => void;
  initialTab?: TabId;
}

type TabId = 'mission' | 'vision' | 'ethos' | 'privacy' | 'security' | 'monetization' | 'tech' | 'downloads';

export default function AboutModal({ onClose, initialTab = 'mission' }: AboutModalProps) {
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Measure content height whenever activeTab changes
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height + 74);
    }
  }, [activeTab]);

  // Watch for initialTab changes (from URL navigation)
  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Read initial URL on mount
  useEffect(() => {
    const hash = window.location.hash;
    const hashToTab: Record<string, TabId> = {
      '#about': 'mission',
      '#about/vision': 'vision',
      '#about/ethos': 'ethos',
      '#about/privacy': 'privacy',
      '#about/security': 'security',
      '#about/monetization': 'monetization',
      '#about/tech': 'tech',
      '#about/downloads': 'downloads',
    };
    
    const tabFromUrl = hashToTab[hash];
    if (tabFromUrl && tabFromUrl !== initialTab) {
      setActiveTab(tabFromUrl);
    }
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleTabClick = (tabId: TabId) => {
    // Update URL when tab is clicked
    const tabToHash: Record<TabId, string> = {
      mission: '#about',
      vision: '#about/vision',
      ethos: '#about/ethos',
      privacy: '#about/privacy',
      security: '#about/security',
      monetization: '#about/monetization',
      tech: '#about/tech',
      downloads: '#about/downloads',
    };
    window.location.hash = tabToHash[tabId];
    setActiveTab(tabId);
  };

  const tabs = [
    { id: 'mission' as const, label: t('about.tabs.mission'), icon: '🎯' },
    { id: 'vision' as const, label: t('about.tabs.vision'), icon: '🔭' },
    { id: 'ethos' as const, label: t('about.tabs.ethos'), icon: '⚖️' },
    { id: 'privacy' as const, label: t('about.tabs.privacy'), icon: '🔒' },
    { id: 'security' as const, label: t('about.tabs.security'), icon: '🛡️' },
    { id: 'monetization' as const, label: t('about.tabs.sustainability'), icon: '💰' },
    { id: 'tech' as const, label: t('about.tabs.techStack'), icon: '⚙️' },
    { id: 'downloads' as const, label: t('about.tabs.downloads'), icon: '📥' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'mission':
        return <AboutMission />;
      case 'vision':
        return <AboutVision />;
      case 'ethos':
        return <AboutEthos />;
      case 'privacy':
        return <AboutPrivacy />;
      case 'security':
        return <AboutSecurity />;
      case 'monetization':
        return <AboutMonetization />;
      case 'tech':
        return <AboutTech />;
      case 'downloads':
        return <AboutDownloads />;
      default:
        return <AboutMission />;
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col ${
          isClosing ? 'animate-slideDown' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t('about.title')}</h2>
              <p className="text-sm text-gray-600">{t('about.tagline')}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-4 pt-4 bg-indigo-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`h-12 pl-4 pr-6 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border-2 rounded-b-none border-indigo-200 bg-indigo-50 z-10 ${
                activeTab === tab.id
                  ? 'bg-white border-b-0'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1 rounded-full bg-white h-8 w-8 inline-flex items-center justify-center">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div 
          className="overflow-y-auto p-6 z-5 border-t-2 border-indigo-200 -mt-0.5"
          style={{
            height: contentHeight > 0 ? `${contentHeight}px` : 'auto',
            transition: 'height 300ms ease-in-out',
            maxHeight: 'calc(90vh - 200px)', // Account for header and tabs
          }}
        >
          <div 
            ref={contentRef}
            key={activeTab} 
            className="animate-fadeIn"
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
