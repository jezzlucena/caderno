import { useTranslation } from 'react-i18next';
import reactLogo from '../../assets/react-logo.svg';
import typescriptLogo from '../../assets/typescript-logo.svg';
import nodejsLogo from '../../assets/nodejs-logo.svg';
import viteLogo from '../../assets/vite-logo.svg';
import tailwindLogo from '../../assets/tailwind-logo.svg';
import dockerLogo from '../../assets/docker-logo.svg';

export default function AboutTech() {
  const { t } = useTranslation();
  
  const TechCard = ({ 
    title, 
    children,
    bgColor,
    borderColor
  }: { 
    title: string; 
    children: React.ReactNode;
    bgColor: string;
    borderColor: string;
  }) => {
    return (
      <div className={`${bgColor} ${borderColor} border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}>
        <h4 className="font-bold text-gray-900 mb-3">{title}</h4>
        {children}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('about.techStack.title')}</h3>
      <p className="text-gray-700 leading-relaxed">{t('about.techStack.description')}</p>
      
      {/* Logo Wall */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <img src={reactLogo} alt="React" className="w-12 h-12 object-contain mb-2" />
          <span className="text-xs font-semibold text-gray-700">React</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <img src={typescriptLogo} alt="TypeScript" className="w-12 h-12 object-contain mb-2" />
          <span className="text-xs font-semibold text-gray-700">TypeScript</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <img src={nodejsLogo} alt="Node.js" className="w-12 h-12 object-contain mb-2" />
          <span className="text-xs font-semibold text-gray-700">Node.js</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <img src={viteLogo} alt="Vite" className="w-12 h-12 object-contain mb-2" />
          <span className="text-xs font-semibold text-gray-700">Vite</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <img src={tailwindLogo} alt="TailwindCSS" className="w-12 h-12 object-contain mb-2" />
          <span className="text-xs font-semibold text-gray-700">TailwindCSS</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <img src={dockerLogo} alt="Docker" className="w-12 h-12 object-contain mb-2" />
          <span className="text-xs font-semibold text-gray-700">Docker</span>
        </div>
      </div>

      {/* Tech Cards - Masonry Layout */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
        <div className="break-inside-avoid mb-4">
          <TechCard title={t('about.techStack.frontend')} bgColor="bg-blue-50" borderColor="border-blue-200">
            <ul className="text-sm text-gray-700 space-y-2">
              {(t('about.techStack.frontendItems', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
              ))}
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title={t('about.techStack.storage')} bgColor="bg-green-50" borderColor="border-green-200">
            <ul className="text-sm text-gray-700 space-y-2">
              {(t('about.techStack.storageItems', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title={t('about.techStack.backend')} bgColor="bg-purple-50" borderColor="border-purple-200">
            <ul className="text-sm text-gray-700 space-y-2">
              {(t('about.techStack.backendItems', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
              ))}
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title={t('about.techStack.security')} bgColor="bg-red-50" borderColor="border-red-200">
            <ul className="text-sm text-gray-700 space-y-2">
              {(t('about.techStack.securityItems', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
              ))}
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title={t('about.techStack.deployment')} bgColor="bg-amber-50" borderColor="border-amber-200">
            <ul className="text-sm text-gray-700 space-y-2">
              {(t('about.techStack.deploymentItems', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
              ))}
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title={t('about.techStack.aiIntegration')} bgColor="bg-indigo-50" borderColor="border-indigo-200">
            <ul className="text-sm text-gray-700 space-y-2">
              {(t('about.techStack.aiIntegrationItems', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
              ))}
            </ul>
          </TechCard>
        </div>
      </div>
    </div>
  );
}
