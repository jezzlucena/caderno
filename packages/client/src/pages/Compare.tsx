import { Helmet } from 'react-helmet-async'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import {
  ShieldCheckIcon,
  LockClosedIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  BellAlertIcon,
  UserGroupIcon,
  ServerStackIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  MinusIcon,
} from '@heroicons/react/24/outline'

type FeatureStatus = 'yes' | 'no' | 'partial' | 'n/a'

interface ComparisonFeature {
  name: string
  caderno: FeatureStatus
  googleKeep: FeatureStatus
  appleJournal: FeatureStatus
  evernote: FeatureStatus
  dayOne: FeatureStatus
  standardNotes: FeatureStatus
  notion: FeatureStatus
}

const comparisonFeatures: ComparisonFeature[] = [
  {
    name: 'End-to-End Encryption (All Content)',
    caderno: 'yes',
    googleKeep: 'no',
    appleJournal: 'yes',
    evernote: 'partial',
    dayOne: 'yes',
    standardNotes: 'yes',
    notion: 'no',
  },
  {
    name: 'Zero-Knowledge Architecture',
    caderno: 'yes',
    googleKeep: 'no',
    appleJournal: 'partial',
    evernote: 'no',
    dayOne: 'yes',
    standardNotes: 'yes',
    notion: 'no',
  },
  {
    name: 'Dead Man\'s Switch',
    caderno: 'yes',
    googleKeep: 'no',
    appleJournal: 'no',
    evernote: 'no',
    dayOne: 'no',
    standardNotes: 'no',
    notion: 'no',
  },
  {
    name: 'Open Source',
    caderno: 'yes',
    googleKeep: 'no',
    appleJournal: 'no',
    evernote: 'no',
    dayOne: 'no',
    standardNotes: 'yes',
    notion: 'no',
  },
  {
    name: 'Self-Hostable',
    caderno: 'yes',
    googleKeep: 'no',
    appleJournal: 'no',
    evernote: 'no',
    dayOne: 'no',
    standardNotes: 'yes',
    notion: 'no',
  },
  {
    name: 'Federated (ActivityPub)',
    caderno: 'yes',
    googleKeep: 'no',
    appleJournal: 'no',
    evernote: 'no',
    dayOne: 'no',
    standardNotes: 'no',
    notion: 'no',
  },
  {
    name: 'No Data Monetization',
    caderno: 'yes',
    googleKeep: 'no',
    appleJournal: 'yes',
    evernote: 'yes',
    dayOne: 'yes',
    standardNotes: 'yes',
    notion: 'yes',
  },
  {
    name: 'Cross-Platform',
    caderno: 'yes',
    googleKeep: 'yes',
    appleJournal: 'no',
    evernote: 'yes',
    dayOne: 'yes',
    standardNotes: 'yes',
    notion: 'yes',
  },
  {
    name: 'Free Tier Available',
    caderno: 'yes',
    googleKeep: 'yes',
    appleJournal: 'yes',
    evernote: 'partial',
    dayOne: 'partial',
    standardNotes: 'yes',
    notion: 'yes',
  },
  {
    name: 'Markdown Support',
    caderno: 'yes',
    googleKeep: 'no',
    appleJournal: 'no',
    evernote: 'partial',
    dayOne: 'yes',
    standardNotes: 'yes',
    notion: 'yes',
  },
  {
    name: 'Third-Party Security Audit',
    caderno: 'partial',
    googleKeep: 'n/a',
    appleJournal: 'n/a',
    evernote: 'no',
    dayOne: 'yes',
    standardNotes: 'yes',
    notion: 'yes',
  },
  {
    name: 'No Vendor Lock-in',
    caderno: 'yes',
    googleKeep: 'no',
    appleJournal: 'no',
    evernote: 'no',
    dayOne: 'no',
    standardNotes: 'yes',
    notion: 'no',
  },
]

function FeatureIcon({ status }: { status: FeatureStatus }) {
  switch (status) {
    case 'yes':
      return <CheckIcon className="w-5 h-5 text-success mx-auto" />
    case 'no':
      return <XMarkIcon className="w-5 h-5 text-error mx-auto" />
    case 'partial':
      return <MinusIcon className="w-5 h-5 text-warning mx-auto" />
    case 'n/a':
      return <span className="text-base-content/40 text-xs">N/A</span>
  }
}

export function Compare() {
  return (
    <div className="min-h-screen bg-base-200 animate-fade-in flex flex-col">
      <Helmet>
        <title>Caderno vs Others - See Why Privacy Matters</title>
        <meta name="description" content="Compare Caderno to Google Keep, Notion, Evernote & more. Only Caderno offers Dead Man's Switch, true E2E encryption, and open source transparency. Try free." />
        <meta property="og:title" content="Caderno vs Others - See Why Privacy Matters" />
        <meta property="og:description" content="Compare Caderno to Google Keep, Notion, Evernote & more. Only Caderno offers Dead Man's Switch, true E2E encryption, and open source transparency. Try free." />
        <meta property="og:image" content="/marketing-compare-square.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Caderno vs Others - See Why Privacy Matters" />
        <meta name="twitter:description" content="Compare Caderno to Google Keep, Notion, Evernote & more. Only Caderno offers Dead Man's Switch, true E2E encryption, and open source transparency. Try free." />
        <meta name="twitter:image" content="/marketing-compare-square.png" />
      </Helmet>
      <Navbar currentPage="compare" />

      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Why Choose <span className="text-primary">Caderno</span>?
          </h1>
          <p className="text-lg text-base-content/70 max-w-3xl mx-auto">
            See how Caderno compares to other journaling and note-taking apps.
            Built for journalists, whistleblowers, activists, and anyone who values
            true privacy and security.
          </p>
        </div>

        {/* Key Differentiators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <ShieldCheckIcon className="w-12 h-12 text-primary mb-2" />
              <h3 className="card-title text-lg">True E2E Encryption</h3>
              <p className="text-sm text-base-content/70">
                AES-256-GCM encryption happens in your browser. We never see your data.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <BellAlertIcon className="w-12 h-12 text-primary mb-2" />
              <h3 className="card-title text-lg">Dead Man's Switch</h3>
              <p className="text-sm text-base-content/70">
                Unique safety feature. Auto-notify trusted contacts if you can't check in.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <GlobeAltIcon className="w-12 h-12 text-primary mb-2" />
              <h3 className="card-title text-lg">Federated & Open</h3>
              <p className="text-sm text-base-content/70">
                Connect with the fediverse via ActivityPub. Decentralized by design.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <CodeBracketIcon className="w-12 h-12 text-primary mb-2" />
              <h3 className="card-title text-lg">100% Open Source</h3>
              <p className="text-sm text-base-content/70">
                Fully auditable code. Self-host on your own server for complete control.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="card bg-base-100 shadow-xl mb-12">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="bg-base-200">Feature</th>
                    <th className="bg-primary/10 text-primary text-center">Caderno</th>
                    <th className="text-center">Google Keep</th>
                    <th className="text-center">Apple Journal</th>
                    <th className="text-center">Evernote</th>
                    <th className="text-center">Day One</th>
                    <th className="text-center">Standard Notes</th>
                    <th className="text-center">Notion</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature) => (
                    <tr key={feature.name}>
                      <td className="font-medium">{feature.name}</td>
                      <td className="bg-primary/5 text-center">
                        <FeatureIcon status={feature.caderno} />
                      </td>
                      <td className="text-center">
                        <FeatureIcon status={feature.googleKeep} />
                      </td>
                      <td className="text-center">
                        <FeatureIcon status={feature.appleJournal} />
                      </td>
                      <td className="text-center">
                        <FeatureIcon status={feature.evernote} />
                      </td>
                      <td className="text-center">
                        <FeatureIcon status={feature.dayOne} />
                      </td>
                      <td className="text-center">
                        <FeatureIcon status={feature.standardNotes} />
                      </td>
                      <td className="text-center">
                        <FeatureIcon status={feature.notion} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-6 mt-4 text-sm text-base-content/60">
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-success" /> Yes
              </div>
              <div className="flex items-center gap-2">
                <MinusIcon className="w-4 h-4 text-warning" /> Partial
              </div>
              <div className="flex items-center gap-2">
                <XMarkIcon className="w-4 h-4 text-error" /> No
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Comparisons */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center mb-8">Detailed Comparisons</h2>

          {/* vs Google Keep */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl">
                <span className="text-primary">Caderno</span> vs Google Keep
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <EyeSlashIcon className="w-5 h-5 text-primary" />
                    Privacy & Security
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Google Keep encrypts data in transit and at rest, but <strong>not end-to-end</strong>.
                    Google employees can theoretically access your notes, and the service operates on
                    an advertising-based revenue model. Caderno uses true end-to-end encryption—we
                    cannot read your journal entries even if we wanted to.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ServerStackIcon className="w-5 h-5 text-primary" />
                    Data Control
                  </h4>
                  <p className="text-sm text-base-content/70">
                    With Google Keep, your data lives on Google's servers with no option to self-host.
                    Caderno lets you run your own instance, giving you complete control over your data
                    and who can access it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* vs Apple Journal */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl">
                <span className="text-primary">Caderno</span> vs Apple Journal
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <LockClosedIcon className="w-5 h-5 text-primary" />
                    Platform Independence
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Apple Journal is <strong>iPhone-only</strong>—no Mac, iPad, Android, or web access.
                    Caderno works on any platform with a web browser, and our code is open source so
                    anyone can build native apps.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-primary" />
                    Federation & Sharing
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Apple Journal is a closed ecosystem with no social features. Caderno integrates
                    with the fediverse via ActivityPub, letting you optionally share public entries
                    while keeping private entries encrypted.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* vs Evernote */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl">
                <span className="text-primary">Caderno</span> vs Evernote
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-primary" />
                    Encryption Coverage
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Evernote only offers <strong>partial encryption</strong>—you can encrypt selected
                    text within notes on desktop, but not entire notes, notebooks, or attachments.
                    Caderno encrypts <strong>everything</strong> by default, including titles and content.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BellAlertIcon className="w-5 h-5 text-primary" />
                    Safety Features
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Evernote has no equivalent to Caderno's Dead Man's Switch. For journalists and
                    activists working in high-risk environments, this feature can be life-saving—ensuring
                    critical information reaches trusted contacts if something happens.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* vs Day One */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl">
                <span className="text-primary">Caderno</span> vs Day One
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CodeBracketIcon className="w-5 h-5 text-primary" />
                    Transparency
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Day One offers excellent end-to-end encryption, but it's <strong>closed source</strong>.
                    You have to trust their implementation without being able to verify it. Caderno is
                    fully open source—anyone can audit our encryption code.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ServerStackIcon className="w-5 h-5 text-primary" />
                    Self-Hosting & Federation
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Day One requires using their cloud service. Caderno can be self-hosted, and our
                    ActivityPub federation means your journal can be part of a decentralized network
                    free from any single company's control.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* vs Standard Notes */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl">
                <span className="text-primary">Caderno</span> vs Standard Notes
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BellAlertIcon className="w-5 h-5 text-primary" />
                    Dead Man's Switch
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Standard Notes is an excellent privacy-focused app with strong encryption. However,
                    it lacks Caderno's unique <strong>Dead Man's Switch</strong> feature—a critical safety
                    mechanism for at-risk users who need to ensure their information gets out.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-primary" />
                    Federation
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Standard Notes is a standalone service. Caderno embraces the <strong>fediverse</strong>
                    through ActivityPub, allowing optional social sharing while maintaining privacy—a
                    unique combination for journaling apps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* vs Notion */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl">
                <span className="text-primary">Caderno</span> vs Notion
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <EyeSlashIcon className="w-5 h-5 text-primary" />
                    True Privacy
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Notion explicitly <strong>does not offer end-to-end encryption</strong>, citing
                    performance concerns. Your data is visible to Notion employees and subject to
                    legal warrants. Caderno ensures only you can read your journal—no exceptions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-primary" />
                    Mission-Driven
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Notion is a general-purpose workspace tool. Caderno is <strong>purpose-built</strong>
                    for sensitive journaling—designed from the ground up for journalists, whistleblowers,
                    activists, and survivors who face real threats.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="card bg-primary text-primary-content mt-12">
          <div className="card-body text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to Take Control of Your Privacy?</h2>
            <p className="mb-4 opacity-90">
              Join Caderno and experience true privacy-first journaling with features
              designed to protect those who need it most.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a href="/register" className="btn btn-secondary">
                Create Free Account
              </a>
              <a href="/about" className="btn btn-ghost btn-outline border-primary-content text-primary-content hover:bg-primary-content hover:text-primary">
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Sources */}
        <div className="card bg-base-100 shadow-xl mt-8">
          <div className="card-body">
            <h3 className="card-title text-lg">Sources & References</h3>
            <p className="text-sm text-base-content/70 mb-4">
              The information in this comparison is based on publicly available documentation and
              third-party analyses as of December 2025:
            </p>
            <ul className="text-sm text-base-content/70 space-y-1 list-disc list-inside">
              <li>
                <a href="https://standardnotes.com/compare/google-keep-alternative" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Standard Notes: Google Keep Alternative Comparison
                </a>
              </li>
              <li>
                <a href="https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Apple Newsroom: Journal App Launch
                </a>
              </li>
              <li>
                <a href="https://help.evernote.com/hc/en-us/articles/208314128-What-type-of-encryption-does-Evernote-use" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Evernote: Encryption Documentation
                </a>
              </li>
              <li>
                <a href="https://dayoneapp.com/features/end-to-end-encryption/" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Day One: End-to-End Encryption
                </a>
              </li>
              <li>
                <a href="https://standardnotes.com/features" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Standard Notes: Features
                </a>
              </li>
              <li>
                <a href="https://www.notion.com/help/security-and-privacy" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Notion: Security Practices
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
