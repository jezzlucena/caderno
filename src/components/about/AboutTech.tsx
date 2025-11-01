import reactLogo from '../../assets/react-logo.svg';
import typescriptLogo from '../../assets/typescript-logo.svg';
import nodejsLogo from '../../assets/nodejs-logo.svg';
import viteLogo from '../../assets/vite-logo.svg';
import tailwindLogo from '../../assets/tailwind-logo.svg';
import dockerLogo from '../../assets/docker-logo.svg';

export default function AboutTech() {
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
      <h3 className="text-xl font-bold text-gray-800">Tech Stack</h3>
      <p className="text-gray-700 leading-relaxed">Modern, secure, and open-source technologies powering Caderno.</p>
      
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
          <TechCard title="Frontend" bgColor="bg-blue-50" borderColor="border-blue-200">
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• <strong>React 18</strong> with <strong>TypeScript</strong></li>
              <li>• <strong>Vite</strong> for build tooling</li>
              <li>• <strong>TailwindCSS</strong> for styling</li>
              <li>• <strong>Zustand</strong> for state management</li>
              <li>• <strong>TipTap</strong> for rich text editing</li>
              <li>• <strong>i18next</strong> for internationalization</li>
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title="Storage" bgColor="bg-green-50" borderColor="border-green-200">
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• <strong>IndexedDB</strong> (local-first)</li>
              <li>• <strong>LocalStorage</strong> for settings</li>
              <li>• No cookies, no tracking</li>
              <li>• Offline-capable by default</li>
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title="Backend" bgColor="bg-purple-50" borderColor="border-purple-200">
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• <strong>Node.js</strong> with <strong>Express</strong></li>
              <li>• <strong>SQLite</strong> for persistence</li>
              <li>• <strong>JWT</strong> authentication</li>
              <li>• <strong>RESTful API</strong> design</li>
              <li>• <strong>Puppeteer</strong> for PDF generation</li>
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title="Security" bgColor="bg-red-50" borderColor="border-red-200">
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• <strong>Web Crypto API</strong> for E2EE</li>
              <li>• <strong>AES-256-GCM</strong> encryption</li>
              <li>• <strong>PBKDF2</strong> key derivation</li>
              <li>• <strong>TLS 1.3</strong> for transport</li>
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title="Deployment" bgColor="bg-amber-50" borderColor="border-amber-200">
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Federated, self-hostable architecture</li>
              <li>• <strong>Progressive Web App (PWA)</strong> support</li>
              <li>• Open source (<strong>MIT License</strong>)</li>
              <li>• <strong>Docker</strong> support for easy deployment</li>
              <li>• <strong>IPFS</strong> integration for decentralized storage</li>
            </ul>
          </TechCard>
        </div>

        <div className="break-inside-avoid mb-4">
          <TechCard title="AI Integration" bgColor="bg-indigo-50" borderColor="border-indigo-200">
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• <strong>OpenAI</strong> / <strong>Anthropic</strong> API support</li>
              <li>• <strong>HuggingFace</strong> model integration</li>
              <li>• AI-powered autocomplete suggestions</li>
              <li>• Automatic entry summarization</li>
            </ul>
          </TechCard>
        </div>
      </div>
    </div>
  );
}
