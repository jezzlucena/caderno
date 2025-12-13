import { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import {
  ShieldCheckIcon,
  EyeSlashIcon,
  LockClosedIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  BellAlertIcon,
  ServerStackIcon,
  UserGroupIcon,
  SparklesIcon,
  HeartIcon,
  ScaleIcon,
  HandRaisedIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  GiftIcon,
  NoSymbolIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CpuChipIcon,
  CircleStackIcon,
  PaintBrushIcon,
  CubeIcon,
  CloudIcon,
  KeyIcon,
  UserIcon,
  AcademicCapIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'

type TabId = 'mission' | 'vision' | 'values' | 'privacy' | 'security' | 'sustainability' | 'tech' | 'dev'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'mission', label: 'Mission', icon: <ShieldCheckIcon className="w-4 h-4" /> },
  { id: 'vision', label: 'Vision', icon: <SparklesIcon className="w-4 h-4" /> },
  { id: 'values', label: 'Values', icon: <HeartIcon className="w-4 h-4" /> },
  { id: 'privacy', label: 'Privacy', icon: <EyeSlashIcon className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <LockClosedIcon className="w-4 h-4" /> },
  { id: 'sustainability', label: 'Sustainability', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
  { id: 'tech', label: 'Tech Stack', icon: <CpuChipIcon className="w-4 h-4" /> },
  { id: 'dev', label: 'Dev', icon: <UserIcon className="w-4 h-4" /> },
]

// Reusable Feature Card Component
function FeatureCard({ icon, title, description, className = '' }: {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}) {
  return (
    <div className={`card bg-base-200 shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <div className="card-body p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1">{title}</h3>
            <p className="text-sm text-base-content/70">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Citation Badge Component
function CitationBadge({ source, url }: { source: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-base-200 rounded-full hover:bg-base-300 transition-colors text-base-content/70 hover:text-primary"
    >
      <DocumentTextIcon className="w-3 h-3" />
      {source}
    </a>
  )
}

// Value Card Component
function ValueCard({ icon, title, description, citation }: {
  icon: React.ReactNode
  title: string
  description: string
  citation?: { source: string; url: string }
}) {
  return (
    <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-lg border border-base-300">
      <div className="card-body p-6">
        <div className="p-3 bg-primary/10 rounded-xl text-primary w-fit mb-3">
          {icon}
        </div>
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm text-base-content/70 flex-grow">{description}</p>
        {citation && (
          <div className="mt-3">
            <CitationBadge source={citation.source} url={citation.url} />
          </div>
        )}
      </div>
    </div>
  )
}

// Comparison Row Component
function ComparisonRow({ feature, caderno, others }: {
  feature: string
  caderno: boolean
  others: boolean | 'partial'
}) {
  return (
    <div className="flex items-center py-3 border-b border-base-200 last:border-0">
      <span className="flex-grow text-sm">{feature}</span>
      <div className="flex gap-8">
        <div className="w-20 flex justify-center">
          {caderno ? (
            <CheckCircleIcon className="w-5 h-5 text-success" />
          ) : (
            <XCircleIcon className="w-5 h-5 text-error" />
          )}
        </div>
        <div className="w-20 flex justify-center">
          {others === true ? (
            <CheckCircleIcon className="w-5 h-5 text-success" />
          ) : others === 'partial' ? (
            <span className="text-xs text-warning font-medium">Partial</span>
          ) : (
            <XCircleIcon className="w-5 h-5 text-error" />
          )}
        </div>
      </div>
    </div>
  )
}

// SVG Illustrations
function ShieldNotebookSVG() {
  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32 mx-auto">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      <path d="M60 10L20 30v30c0 25 17 45 40 50 23-5 40-25 40-50V30L60 10z" fill="url(#shieldGrad)" opacity="0.2" />
      <path d="M60 10L20 30v30c0 25 17 45 40 50 23-5 40-25 40-50V30L60 10z" stroke="url(#shieldGrad)" strokeWidth="2" fill="none" />
      <rect x="42" y="35" width="36" height="45" rx="3" fill="#ffffff" stroke="#4a5568" strokeWidth="1.5" />
      <line x1="48" y1="45" x2="72" y2="45" stroke="#cbd5e0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="52" x2="68" y2="52" stroke="#cbd5e0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="59" x2="70" y2="59" stroke="#cbd5e0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="66" x2="62" y2="66" stroke="#cbd5e0" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="60" cy="95" r="8" fill="url(#shieldGrad)" />
      <path d="M57 95l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NetworkSVG() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full max-w-md mx-auto h-32">
      <defs>
        <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      <line x1="40" y1="60" x2="100" y2="30" stroke="url(#netGrad)" strokeWidth="2" opacity="0.5" />
      <line x1="40" y1="60" x2="100" y2="90" stroke="url(#netGrad)" strokeWidth="2" opacity="0.5" />
      <line x1="100" y1="30" x2="160" y2="60" stroke="url(#netGrad)" strokeWidth="2" opacity="0.5" />
      <line x1="100" y1="90" x2="160" y2="60" stroke="url(#netGrad)" strokeWidth="2" opacity="0.5" />
      <line x1="100" y1="30" x2="100" y2="90" stroke="url(#netGrad)" strokeWidth="2" opacity="0.5" />
      <circle cx="40" cy="60" r="12" fill="url(#netGrad)" />
      <circle cx="100" cy="30" r="12" fill="url(#netGrad)" />
      <circle cx="100" cy="90" r="12" fill="url(#netGrad)" />
      <circle cx="160" cy="60" r="12" fill="url(#netGrad)" />
      <circle cx="40" cy="60" r="6" fill="#fff" />
      <circle cx="100" cy="30" r="6" fill="#fff" />
      <circle cx="100" cy="90" r="6" fill="#fff" />
      <circle cx="160" cy="60" r="6" fill="#fff" />
    </svg>
  )
}

function SecuritySVG() {
  return (
    <svg viewBox="0 0 200 100" fill="none" className="w-full max-w-lg mx-auto h-24">
      <defs>
        <linearGradient id="secGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      {/* Client */}
      <rect x="10" y="30" width="40" height="40" rx="4" fill="url(#secGrad)" opacity="0.2" stroke="url(#secGrad)" strokeWidth="1.5" />
      <text x="30" y="55" textAnchor="middle" fontSize="8" fill="#667eea" fontWeight="600">Client</text>
      {/* Arrow 1 */}
      <path d="M55 50h25" stroke="url(#secGrad)" strokeWidth="2" />
      <path d="M75 45l5 5-5 5" stroke="url(#secGrad)" strokeWidth="2" fill="none" />
      <text x="67" y="43" textAnchor="middle" fontSize="6" fill="#667eea">E2E</text>
      {/* Server */}
      <rect x="85" y="25" width="50" height="50" rx="4" fill="url(#secGrad)" opacity="0.2" stroke="url(#secGrad)" strokeWidth="1.5" />
      <text x="110" y="55" textAnchor="middle" fontSize="8" fill="#667eea" fontWeight="600">Server</text>
      <LockClosedIcon className="w-4 h-4" x="102" y="30" />
      {/* Arrow 2 */}
      <path d="M140 50h25" stroke="url(#secGrad)" strokeWidth="2" />
      <path d="M160 45l5 5-5 5" stroke="url(#secGrad)" strokeWidth="2" fill="none" />
      <text x="152" y="43" textAnchor="middle" fontSize="6" fill="#667eea">TLS</text>
      {/* Recipient */}
      <rect x="170" y="30" width="40" height="40" rx="4" fill="url(#secGrad)" opacity="0.2" stroke="url(#secGrad)" strokeWidth="1.5" />
      <text x="190" y="55" textAnchor="middle" fontSize="7" fill="#667eea" fontWeight="600">Recipient</text>
    </svg>
  )
}

// Tab Content Components
function MissionTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <ShieldNotebookSVG />
        <h2 className="text-2xl font-bold mt-4 mb-2">Protecting Those Who Speak Truth to Power</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          Project Caderno is a privacy-first, decentralized journaling platform dedicated to
          safeguarding personal truths and empowering those who document reality.
        </p>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-primary" />
          Who We Serve
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Journalists', 'Whistleblowers', 'Survivors', 'Activists', 'Privacy Advocates'].map((user) => (
            <span key={user} className="px-3 py-1 bg-base-100 rounded-full text-sm font-medium shadow-sm">
              {user}
            </span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FeatureCard
          icon={<LockClosedIcon className="w-6 h-6" />}
          title="Encrypted Journal Pantries"
          description="Your entries are encrypted on your device before transmission. Only you hold the keys to your thoughts."
        />
        <FeatureCard
          icon={<BellAlertIcon className="w-6 h-6" />}
          title="Dead Man's Switch"
          description="Set a timed alarm that automatically delivers your journal to trusted contacts if you can't check in."
        />
        <FeatureCard
          icon={<ServerStackIcon className="w-6 h-6" />}
          title="Self-Hostable & Federated"
          description="Run your own server or join a trusted community. No single company controls your data."
        />
        <FeatureCard
          icon={<DocumentTextIcon className="w-6 h-6" />}
          title="Evidence Preservation"
          description="Document truth with integrity. Cryptographic timestamps ensure your records can serve as evidence."
        />
      </div>

      <div className="text-center pt-4">
        <CitationBadge source="Internet Society" url="https://www.internetsociety.org/resources/doc/2021/factsheet-how-encryption-can-protect-advocacy-groups-and-social-change-movements/" />
      </div>
    </div>
  )
}

function VisionTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <NetworkSVG />
        <h2 className="text-2xl font-bold mt-4 mb-2">A Future Where Truth Cannot Be Erased</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          We envision a world where personal narratives and critical truths are preserved securely,
          transparently, and resiliently -- beyond the reach of any single authority or adversary.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card bg-base-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <EyeSlashIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Privacy as Default</h3>
          </div>
          <p className="text-sm text-base-content/70">
            End-to-end encryption, decentralization, and user autonomy as standard expectations -- not premium features.
          </p>
        </div>

        <div className="card bg-base-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <GlobeAltIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Federation Ecosystem</h3>
          </div>
          <p className="text-sm text-base-content/70">
            A rich network of user-operated servers worldwide, collectively forming a censorship-resistant platform.
          </p>
        </div>

        <div className="card bg-base-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <HandRaisedIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">User Empowerment</h3>
          </div>
          <p className="text-sm text-base-content/70">
            Empowered individuals speak truth to power and hold the powerful accountable without fear.
          </p>
        </div>

        <div className="card bg-base-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FingerPrintIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Your Data, Your Control</h3>
          </div>
          <p className="text-sm text-base-content/70">
            Each user owns their data, controls their narrative, and can trust their private thoughts remain secure.
          </p>
        </div>
      </div>

      <blockquote className="border-l-4 border-primary pl-4 italic text-base-content/70">
        "Technology should guarantee that voices cannot be erased. Caderno sets a new standard for journaling
        by normalizing encryption and decentralization."
      </blockquote>
    </div>
  )
}

function ValuesTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Our Core Values</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          Caderno's ethos is grounded in transparency, resilience, and empowerment -- guided by a
          commitment to privacy, security, and social accountability.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ValueCard
          icon={<CodeBracketIcon className="w-8 h-8" />}
          title="Transparency"
          description="Fully open-source. No hidden backdoors. Anyone can inspect or contribute to the code. We maintain clear communication with our community."
          citation={{ source: "Standard Notes", url: "https://standardnotes.com/compare/google-keep-alternative" }}
        />
        <ValueCard
          icon={<EyeSlashIcon className="w-8 h-8" />}
          title="Privacy"
          description="Privacy is a fundamental human right. E2E encryption by default. We don't collect or monetize personal data. Only you can read your entries."
          citation={{ source: "ACLU", url: "https://www.aclu.org/news/privacy-technology/the-vital-role-of-end-to-end-encryption" }}
        />
        <ValueCard
          icon={<ShieldCheckIcon className="w-8 h-8" />}
          title="Security & Resilience"
          description="Robust cybersecurity for high-risk users. Decentralized architecture with no single point of failure. Constant vigilance against threats."
          citation={{ source: "Cipherwill", url: "https://www.cipherwill.com/blog/why-dead-mans-switch-need-end-to-end-encryption-1fb6d63626188008a410ea6fea4bfaae" }}
        />
        <ValueCard
          icon={<HandRaisedIcon className="w-8 h-8" />}
          title="Empowerment"
          description="User autonomy and freedom of expression. Self-host on servers you control. Power is returned to the people. We stand with truth-tellers."
          citation={{ source: "Internet Society", url: "https://www.internetsociety.org/resources/doc/2021/factsheet-how-encryption-can-protect-advocacy-groups-and-social-change-movements/" }}
        />
        <ValueCard
          icon={<ScaleIcon className="w-8 h-8" />}
          title="Accountability"
          description="Document truth with integrity. Immutable records through cryptographic timestamps. Help users hold the powerful accountable."
        />
      </div>

      <div className="bg-base-200 rounded-xl p-6 text-center">
        <p className="text-sm text-base-content/70 italic">
          "These principles aren't just words on paper -- they are the guiding light in every decision,
          feature, and policy associated with Caderno."
        </p>
      </div>
    </div>
  )
}

function PrivacyTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Privacy by Design</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          Your journal entry isn't just a private thought -- it could be sensitive information that, if exposed,
          might endanger the writer or others. We take that responsibility seriously.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="card bg-base-200 p-6">
        <h3 className="font-semibold mb-4">How We Compare</h3>
        <div className="mb-2 flex items-center justify-end gap-8 text-sm font-medium text-base-content/60">
          <span className="w-20 text-center text-primary">Caderno</span>
          <span className="w-20 text-center">Others*</span>
        </div>
        <ComparisonRow feature="End-to-End Encryption" caderno={true} others={false} />
        <ComparisonRow feature="Zero-Knowledge Architecture" caderno={true} others={false} />
        <ComparisonRow feature="Open Source Code" caderno={true} others={false} />
        <ComparisonRow feature="Self-Hostable" caderno={true} others={false} />
        <ComparisonRow feature="No Data Monetization" caderno={true} others="partial" />
        <ComparisonRow feature="Federated/Decentralized" caderno={true} others={false} />
        <p className="text-xs text-base-content/50 mt-3">*Compared to Google Keep, Notion, and typical cloud note apps</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FeatureCard
          icon={<LockClosedIcon className="w-6 h-6" />}
          title="AES-256-GCM Encryption"
          description="Industry-standard encryption with keys derived from your password. Data encrypted on your device before transmission."
        />
        <FeatureCard
          icon={<EyeSlashIcon className="w-6 h-6" />}
          title="Zero-Knowledge"
          description="Not even Caderno developers or server admins can read your encrypted entries. No backdoors, ever."
        />
        <FeatureCard
          icon={<ServerStackIcon className="w-6 h-6" />}
          title="Decentralized Storage"
          description="Choose your own server or pick a trusted host. No centralized data silos that are attractive targets."
        />
        <FeatureCard
          icon={<NoSymbolIcon className="w-6 h-6" />}
          title="No Tracking"
          description="No analytics profiling, no content scanning, no advertising. Your data serves only you."
        />
      </div>

      <div className="bg-gradient-to-r from-warning/10 to-error/10 rounded-xl p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <span className="text-warning">Did you know?</span>
        </h3>
        <p className="text-sm text-base-content/70">
          Google Keep operates on an advertising-based model and lacks end-to-end encryption.
          Employees could theoretically read your notes. With Caderno, that's mathematically impossible.
        </p>
        <div className="mt-3">
          <CitationBadge source="Standard Notes Research" url="https://standardnotes.com/compare/google-keep-alternative" />
        </div>
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Defense in Depth</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          Our security philosophy: "Trust no one, verify everything" -- not even us. Security relies on
          mathematics and design, not on trusting people or companies.
        </p>
      </div>

      <div className="card bg-base-200 p-6">
        <h3 className="font-semibold mb-4 text-center">How Your Data Flows</h3>
        <SecuritySVG />
        <p className="text-xs text-center text-base-content/50 mt-2">
          End-to-end encrypted: even if the server is compromised, your data remains unreadable
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          icon={<LockClosedIcon className="w-6 h-6" />}
          title="State-of-the-Art Encryption"
          description="AES-256, RSA/ECC, TLS 1.3. Post-quantum algorithms as they become practical."
        />
        <FeatureCard
          icon={<ServerStackIcon className="w-6 h-6" />}
          title="Federated Security"
          description="Each server is separate. A breach affects only that server, not the entire network."
        />
        <FeatureCard
          icon={<FingerPrintIcon className="w-6 h-6" />}
          title="Multi-Factor Auth"
          description="TOTP, hardware key support. Strong passphrases encouraged for encryption keys."
        />
        <FeatureCard
          icon={<BellAlertIcon className="w-6 h-6" />}
          title="Encrypted Dead Man's Switch"
          description="Journal packages encrypted with recipient keys. No single point of compromise."
        />
        <FeatureCard
          icon={<CodeBracketIcon className="w-6 h-6" />}
          title="Open Source Auditing"
          description="Anyone can inspect our code. We welcome third-party security audits."
        />
        <FeatureCard
          icon={<ArrowPathIcon className="w-6 h-6" />}
          title="Continuous Improvement"
          description="Regular updates, vulnerability monitoring, and incident response procedures."
        />
      </div>

      <div className="bg-base-200 rounded-xl p-6">
        <h3 className="font-semibold mb-3">Protection Against Threats</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Server hardening & rate limiting</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Database encryption at rest</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Signed & verified client apps</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Certificate pinning</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Supply chain attack prevention</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Anti-tampering detection</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <CitationBadge source="Cipherwill Research" url="https://www.cipherwill.com/blog/why-dead-mans-switch-need-end-to-end-encryption-1fb6d63626188008a410ea6fea4bfaae" />
      </div>
    </div>
  )
}

function SustainabilityTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Sustainable by Design</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          Traditional profit models (selling data, advertising) are off the table. We fund development
          in ways that enhance, rather than compromise, user trust.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FeatureCard
          icon={<ServerStackIcon className="w-6 h-6" />}
          title="Open-Source SaaS Hosting"
          description="Optional managed hosting for those who don't want to run their own server. Pay for convenience, not for access to your data."
        />
        <FeatureCard
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
          title="Enterprise Solutions"
          description="Support contracts and customized deployments for organizations like newsrooms and NGOs."
        />
        <FeatureCard
          icon={<GiftIcon className="w-6 h-6" />}
          title="Donations & Sponsorships"
          description="Community funding through Open Collective. Grants from digital rights foundations and privacy advocacy groups."
        />
        <FeatureCard
          icon={<SparklesIcon className="w-6 h-6" />}
          title="Optional Premium Add-ons"
          description="Advanced features for power users that don't compromise the core free experience."
        />
      </div>

      <div className="card bg-gradient-to-r from-error/10 to-warning/10 border border-error/20">
        <div className="card-body">
          <h3 className="card-title text-lg flex items-center gap-2">
            <NoSymbolIcon className="w-6 h-6 text-error" />
            What We'll Never Do
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <XCircleIcon className="w-4 h-4 text-error shrink-0" />
              <span>Monetize through ads or user data analytics</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircleIcon className="w-4 h-4 text-error shrink-0" />
              <span>Sell or share user information with anyone</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircleIcon className="w-4 h-4 text-error shrink-0" />
              <span>Impose paywalls that hinder basic access for those in need</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircleIcon className="w-4 h-4 text-error shrink-0" />
              <span>Compromise on encryption for "convenience" or profit</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-base-200 rounded-xl p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-primary" />
          Transparency in Finance
        </h3>
        <p className="text-sm text-base-content/70">
          We maintain open accounting of how the project is funded. Donations through Open Collective
          are public. We share high-level revenue numbers in annual reports. Your subscription
          dollars go toward developers, servers, security audits, and community outreach -- not
          executive bonuses.
        </p>
        <div className="mt-4">
          <CitationBadge source="Scaleway (Open Source Monetization)" url="https://www.scaleway.com/en/blog/how-to-monetize-your-open-source-project/" />
        </div>
      </div>

      <blockquote className="border-l-4 border-primary pl-4 italic text-base-content/70">
        "We succeed only by making a tool people find valuable enough to support -- not by betraying their trust."
      </blockquote>
    </div>
  )
}

// Tech Stack Card Component
function TechCard({ icon, title, children, colorClass = 'text-primary' }: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  colorClass?: string
}) {
  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 bg-primary/10 rounded-lg ${colorClass}`}>
            {icon}
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <ul className="space-y-2 text-sm">
          {children}
        </ul>
      </div>
    </div>
  )
}

function TechItem({ name, description, url }: { name: string; description: string; url?: string }) {
  const nameElement = url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-base-content hover:text-primary transition-colors underline decoration-dotted underline-offset-2">
      <strong>{name}</strong>
    </a>
  ) : (
    <strong className="text-base-content">{name}</strong>
  )

  return (
    <li className="flex items-start gap-2">
      <span className="text-primary mt-1">•</span>
      <span>{nameElement} <span className="text-base-content/70">— {description}</span></span>
    </li>
  )
}

// Logo Wall Component - displays logos of key technologies
function LogoWall() {
  const logos = [
    { name: 'React', url: 'https://react.dev', logo: '/assets/logos/react.svg' },
    { name: 'TypeScript', url: 'https://www.typescriptlang.org', logo: '/assets/logos/typescript.svg' },
    { name: 'Node.js', url: 'https://nodejs.org', logo: '/assets/logos/nodejs.svg' },
    { name: 'PostgreSQL', url: 'https://www.postgresql.org', logo: '/assets/logos/postgresql.svg' },
    { name: 'Docker', url: 'https://www.docker.com', logo: '/assets/logos/docker.svg' },
    { name: 'Tailwind CSS', url: 'https://tailwindcss.com', logo: '/assets/logos/tailwindcss.svg' },
    { name: 'Vite', url: 'https://vite.dev', logo: '/assets/logos/vite.svg' },
  ]

  return (
    <div className="card bg-gradient-to-r from-base-200 to-base-300 shadow-md mb-6">
      <div className="card-body p-6">
        <h3 className="font-semibold text-center mb-5 text-base-content/80">Powered By</h3>
        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8">
          {logos.map((logo) => (
            <a
              key={logo.name}
              href={logo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 hover:scale-110 transition-transform duration-200 group"
              title={logo.name}
            >
              <img
                src={logo.logo}
                alt={`${logo.name} logo`}
                className="w-10 h-10 sm:w-12 sm:h-12 group-hover:drop-shadow-lg transition-all"
              />
              <span className="text-xs text-base-content/60 group-hover:text-base-content transition-colors">
                {logo.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function TechStackTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Built with Modern Technologies</h2>
        <p className="text-base-content/70 max-w-2xl mx-auto">
          Caderno is built on a modern, security-focused stack designed for privacy, performance, and reliability.
          Every technology choice reflects our commitment to user safety.
        </p>
      </div>

      <LogoWall />

      <div className="grid md:grid-cols-2 gap-4">
        {/* Frontend Core */}
        <TechCard icon={<CodeBracketIcon className="w-6 h-6" />} title="Frontend Core">
          <TechItem name="React 19" description="Latest UI framework with concurrent features" url="https://react.dev" />
          <TechItem name="TypeScript" description="Type-safe JavaScript for reliability" url="https://www.typescriptlang.org" />
          <TechItem name="Vite" description="Lightning-fast build tool & dev server" url="https://vite.dev" />
          <TechItem name="React Router 7" description="Client-side navigation" url="https://reactrouter.com" />
        </TechCard>

        {/* Styling & UI */}
        <TechCard icon={<PaintBrushIcon className="w-6 h-6" />} title="Styling & UI">
          <TechItem name="Tailwind CSS 4" description="Utility-first CSS framework" url="https://tailwindcss.com" />
          <TechItem name="DaisyUI 5" description="Beautiful component library" url="https://daisyui.com" />
          <TechItem name="Heroicons" description="Hand-crafted SVG icons" url="https://heroicons.com" />
        </TechCard>

        {/* State & Data */}
        <TechCard icon={<CubeIcon className="w-6 h-6" />} title="State & Data">
          <TechItem name="Zustand" description="Lightweight state management" url="https://github.com/pmndrs/zustand" />
          <TechItem name="marked" description="Markdown parsing & rendering" url="https://github.com/markedjs/marked" />
          <TechItem name="jsPDF" description="Client-side PDF generation" url="https://github.com/parallax/jsPDF" />
          <TechItem name="React Helmet" description="Document head management" url="https://github.com/staylor/react-helmet-async" />
        </TechCard>

        {/* Backend Runtime */}
        <TechCard icon={<ServerStackIcon className="w-6 h-6" />} title="Backend Runtime">
          <TechItem name="Node.js 22+" description="JavaScript runtime (LTS)" url="https://nodejs.org" />
          <TechItem name="Express 5" description="Minimal web framework" url="https://expressjs.com" />
          <TechItem name="TypeScript" description="End-to-end type safety" url="https://www.typescriptlang.org" />
          <TechItem name="tsx" description="TypeScript execution for dev" url="https://github.com/privatenumber/tsx" />
        </TechCard>

        {/* Database */}
        <TechCard icon={<CircleStackIcon className="w-6 h-6" />} title="Database">
          <TechItem name="PostgreSQL 16" description="Enterprise relational database" url="https://www.postgresql.org" />
          <TechItem name="Drizzle ORM" description="Type-safe SQL query builder" url="https://orm.drizzle.team" />
          <TechItem name="Zod" description="Runtime schema validation" url="https://zod.dev" />
        </TechCard>

        {/* Security & Auth */}
        <TechCard icon={<KeyIcon className="w-6 h-6" />} title="Security & Auth">
          <TechItem name="Argon2id" description="OWASP-recommended password hashing" url="https://github.com/ranisalt/node-argon2" />
          <TechItem name="JWT (jose)" description="Secure token authentication" url="https://github.com/panva/jose" />
          <TechItem name="AES-256-GCM" description="Military-grade E2E encryption" url="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt" />
          <TechItem name="PBKDF2" description="Key derivation (100k iterations)" url="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey" />
          <TechItem name="Helmet.js" description="HTTP security headers" url="https://helmetjs.github.io" />
        </TechCard>

        {/* Federation & Standards */}
        <TechCard icon={<GlobeAltIcon className="w-6 h-6" />} title="Federation & Standards">
          <TechItem name="ActivityPub" description="W3C decentralized social protocol" url="https://www.w3.org/TR/activitypub/" />
          <TechItem name="HTTP Signatures" description="Server-to-server authentication" url="https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures" />
          <TechItem name="RSA-SHA256" description="Cryptographic request signing" url="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign" />
          <TechItem name="JSON-LD" description="Linked data format" url="https://json-ld.org" />
          <TechItem name="Web Crypto API" description="Browser-native cryptography" url="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API" />
        </TechCard>

        {/* Infrastructure */}
        <TechCard icon={<CloudIcon className="w-6 h-6" />} title="Infrastructure">
          <TechItem name="Docker" description="Container runtime" url="https://www.docker.com" />
          <TechItem name="Docker Compose" description="Multi-container orchestration" url="https://docs.docker.com/compose/" />
          <TechItem name="pnpm" description="Fast, disk-efficient package manager" url="https://pnpm.io" />
          <TechItem name="SendGrid" description="Transactional email delivery" url="https://sendgrid.com" />
        </TechCard>
      </div>

      {/* Architecture Summary */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <CpuChipIcon className="w-5 h-5 text-primary" />
          Architecture Highlights
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>End-to-end TypeScript</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Zero-knowledge encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Federated architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Monorepo with workspaces</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>Container-ready deployment</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>100% open source</span>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center text-sm text-base-content/60">
        <p>
          Target: <strong>ES2022</strong> • Node: <strong>≥22</strong> • Package Manager: <strong>pnpm 9.14</strong>
        </p>
      </div>
    </div>
  )
}

// Skill Badge Component
function SkillBadge({ skill }: { skill: string }) {
  return (
    <span className="px-3 py-1 bg-base-100 rounded-full text-sm font-medium shadow-sm">
      {skill}
    </span>
  )
}

function DevTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <UserIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Jezz Lucena</h2>
        <p className="text-primary font-medium mb-2">Full Stack Engineer</p>
        <p className="text-base-content/70 max-w-xl mx-auto">
          Passionate about building exceptional end-user experiences. Creator of Caderno.
        </p>
      </div>

      {/* Education */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-primary" />
          Education
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>B.S. in Computer Engineering</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
            <span>M.S. in Interactive Media & Game Development</span>
          </div>
        </div>
      </div>

      {/* Technical Expertise */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card bg-base-200 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <CodeBracketIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">Languages</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['JavaScript', 'TypeScript', 'Python', 'Phoenix/Elixir'].map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
            <p className="text-xs text-base-content/60 mt-2">13+ programming languages</p>
          </div>
        </div>

        <div className="card bg-base-200 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <PaintBrushIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">Frontend</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['React', 'Next.js', 'Vue 3', 'Nuxt', 'UX/UI'].map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ServerStackIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">Backend</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Django', 'Ruby on Rails', 'RESTful APIs', 'PostgreSQL'].map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <CubeIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">Practices</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Object-Oriented Design', 'Agile', 'Test Automation'].map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Strengths */}
      <div className="card bg-base-200 p-6">
        <h3 className="font-semibold mb-4">Key Strengths</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm">Creative, detail-oriented approach</span>
          </div>
          <div className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm">Full-stack with customer empathy</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm">Continuous learner</span>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <blockquote className="border-l-4 border-primary pl-4 italic text-base-content/70">
        "Working with Jezz was a pleasure... His creative, detail oriented approach was very valuable in the product creation process."
        <footer className="mt-2 text-sm font-medium text-base-content/60">
          — Chris Bennett, CEO at Wonderschool
        </footer>
      </blockquote>

      {/* GitHub Sponsors CTA */}
      <div className="card bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/20 shadow-lg">
        <div className="card-body text-center">
          <div className="p-3 bg-pink-500/20 rounded-xl w-fit mx-auto mb-3">
            <HeartIcon className="w-10 h-10 text-pink-500" />
          </div>
          <h3 className="card-title text-xl justify-center">Support Caderno's Development</h3>
          <p className="text-base-content/70 mb-4">
            Help keep Caderno free, open-source, and privacy-focused. Your sponsorship directly supports development, security audits, and infrastructure costs.
          </p>
          <a
            href="https://github.com/sponsors/jezzlucena"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary gap-2"
          >
            <HeartIcon className="w-5 h-5" />
            Become a Sponsor
          </a>
        </div>
      </div>

      {/* Social Links */}
      <div className="flex flex-wrap justify-center gap-4">
        <a
          href="https://github.com/jezzlucena"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm gap-2"
        >
          <CodeBracketIcon className="w-4 h-4" />
          GitHub
        </a>
        <a
          href="https://linkedin.com/in/jezzlucena"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm gap-2"
        >
          <UserGroupIcon className="w-4 h-4" />
          LinkedIn
        </a>
        <a
          href="mailto:[email protected]"
          className="btn btn-outline btn-sm gap-2"
        >
          <EnvelopeIcon className="w-4 h-4" />
          Email
        </a>
      </div>
    </div>
  )
}

export function About() {
  const [activeTab, setActiveTab] = useState<TabId>('mission')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mission':
        return <MissionTab />
      case 'vision':
        return <VisionTab />
      case 'values':
        return <ValuesTab />
      case 'privacy':
        return <PrivacyTab />
      case 'security':
        return <SecurityTab />
      case 'sustainability':
        return <SustainabilityTab />
      case 'tech':
        return <TechStackTab />
      case 'dev':
        return <DevTab />
    }
  }

  return (
    <div className="min-h-screen bg-base-200 animate-fade-in flex flex-col">
      <Navbar currentPage="about" />

      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">About Caderno</h1>
          <p className="text-base-content/70">
            "Caderno" means "notebook" in Portuguese. Like a paper notebook, your digital journal should be truly private.
          </p>
        </div>

        {/* Old-School Tabs */}
        <div className="relative">
          {/* Tab Navigation - Desktop */}
          <div className="hidden sm:flex -mb-px overflow-x-auto overflow-y-hidden px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-3 font-medium text-sm transition-all relative
                  border-t-2 border-l border-r rounded-t-lg -mb-px whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-base-100 border-primary border-b-base-100 text-primary z-10'
                    : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-300'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Navigation - Mobile Dropdown */}
          <div className="sm:hidden mb-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabId)}
              className="select select-bordered w-full"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Content */}
          <div className="card bg-base-100 shadow-xl border border-primary">
            <div className="card-body p-6 sm:p-8">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-8 text-sm text-base-content/60">
          <p>
            Questions or feedback? We'd love to hear from you.{' '}
            <a href="/support" className="link link-primary">Contact us</a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
