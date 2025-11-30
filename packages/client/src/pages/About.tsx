import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

export function About() {
  return (
    <div className="min-h-screen bg-base-200 animate-fade-in flex flex-col">
      <Navbar currentPage="about" />
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body prose max-w-none">
            <h1>About Caderno</h1>

            <p className="lead text-lg">
              Caderno is a privacy-first, end-to-end encrypted journaling platform
              designed for people who value their digital privacy and personal security.
            </p>

            <h2>What is Caderno?</h2>
            <p>
              "Caderno" means "notebook" in Portuguese. We chose this name because, like a
              traditional paper notebook, your digital journal should be completely private—readable
              only by you. Unlike cloud-based note apps that can read your data, Caderno
              ensures that your thoughts remain truly yours.
            </p>

            <h2>End-to-End Encryption</h2>
            <p>
              Every journal entry you create is encrypted on your device before it ever leaves
              your browser. We use industry-standard AES-256-GCM encryption with keys derived
              from your password using PBKDF2. This means:
            </p>
            <ul>
              <li><strong>Zero-knowledge architecture:</strong> We cannot read your journal entries, even if we wanted to</li>
              <li><strong>No backdoors:</strong> Your password never leaves your device</li>
              <li><strong>Client-side encryption:</strong> Data is encrypted before transmission</li>
              <li><strong>Unique keys per user:</strong> Each user has their own encryption salt</li>
            </ul>

            <h2>Dead Man's Switch</h2>
            <p>
              One of our unique features is the Dead Man's Switch—a safety mechanism that allows
              you to designate trusted contacts who will be notified if you don't check in within
              a specified time period. This feature is especially valuable for:
            </p>
            <ul>
              <li>Journalists working in dangerous environments</li>
              <li>Activists who face personal risks</li>
              <li>Anyone who wants a digital safety net</li>
              <li>People who want to share important information posthumously</li>
            </ul>
            <p>
              You can attach encrypted PDF exports of selected journal entries to your switch.
              The decryption key is only shared with recipients when the switch triggers, ensuring
              your privacy until that moment.
            </p>

            <h2>Federation (ActivityPub)</h2>
            <p>
              Caderno supports ActivityPub federation, allowing you to optionally connect
              with the broader fediverse (Mastodon, Pleroma, and other compatible platforms).
              You can choose to publish selected entries publicly while keeping your private
              journal completely separate and encrypted.
            </p>

            <h2>Open Source</h2>
            <p>
              We believe that security software should be transparent and auditable. Caderno
              is open source, meaning anyone can inspect our code to verify that we do exactly what
              we say—nothing more, nothing less.
            </p>

            <h2>Our Commitment</h2>
            <p>
              Your privacy is not a feature—it's the foundation of everything we build. We will never:
            </p>
            <ul>
              <li>Sell or share your data with third parties</li>
              <li>Show you advertisements</li>
              <li>Track your behavior for profit</li>
              <li>Compromise on encryption for "convenience"</li>
            </ul>

            <div className="divider"></div>

            <p className="text-sm text-base-content/60">
              Questions or feedback? We'd love to hear from you. Caderno is built by
              people who care deeply about digital privacy and personal security.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
