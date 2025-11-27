import { Navbar } from '../components/Navbar'

export function Privacy() {
  return (
    <div className="min-h-screen bg-base-200 animate-fade-in">
      <Navbar currentPage="privacy" />
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body prose max-w-none">
            <h1>Privacy Policy</h1>
            <p className="text-sm text-base-content/60">Last updated: {new Date().toLocaleDateString()}</p>

            <p className="lead text-lg">
              Your privacy is the foundation of Project Caderno. This policy explains how we handle
              your data and why our zero-knowledge architecture means your journal entries remain
              truly private.
            </p>

            <h2>1. Our Privacy Commitment</h2>
            <p>
              Project Caderno is built on a simple principle: <strong>your private thoughts should
              remain private</strong>. Unlike traditional cloud services, we've designed our system
              so that we physically cannot read your journal entries, even if compelled to do so.
            </p>

            <h2>2. Data We Collect</h2>

            <h3>2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li><strong>Email address:</strong> Used for authentication and account recovery</li>
              <li><strong>Password hash:</strong> Your password is never stored—only a cryptographic hash</li>
              <li><strong>Encryption salt:</strong> A unique random value used to derive your encryption keys</li>
            </ul>

            <h3>2.2 Encrypted Journal Data</h3>
            <p>Your journal entries are:</p>
            <ul>
              <li>Encrypted on your device before transmission</li>
              <li>Stored as encrypted blobs that we cannot decrypt</li>
              <li>Only decryptable with keys derived from your password</li>
            </ul>
            <p>
              <strong>We cannot read your journal entries.</strong> The encryption keys exist only
              in your browser session and are never transmitted to our servers.
            </p>

            <h3>2.3 Technical Data</h3>
            <p>We may collect minimal technical data necessary to operate the Service:</p>
            <ul>
              <li>Server logs (IP addresses, request timestamps)</li>
              <li>Error reports (without encrypted content)</li>
            </ul>

            <h2>3. How We Use Your Data</h2>
            <p>We use your data solely to:</p>
            <ul>
              <li>Authenticate you and maintain your session</li>
              <li>Store and sync your encrypted journal entries</li>
              <li>Send you important account notifications</li>
              <li>Operate the Dead Man's Switch feature (if enabled)</li>
              <li>Facilitate ActivityPub federation (if enabled)</li>
            </ul>

            <h2>4. End-to-End Encryption</h2>
            <p>Our encryption implementation ensures:</p>
            <ul>
              <li><strong>AES-256-GCM encryption:</strong> Military-grade encryption for all journal entries</li>
              <li><strong>PBKDF2 key derivation:</strong> Your password is used to derive encryption keys locally</li>
              <li><strong>Per-entry IVs:</strong> Each entry uses a unique initialization vector</li>
              <li><strong>Zero-knowledge design:</strong> Encryption/decryption happens entirely in your browser</li>
            </ul>

            <h2>5. Data Retention</h2>
            <ul>
              <li><strong>Active accounts:</strong> Your encrypted data is retained as long as your account is active</li>
              <li><strong>Deleted entries:</strong> Removed from our servers promptly upon deletion</li>
              <li><strong>Account deletion:</strong> All associated data is permanently deleted</li>
              <li><strong>Backups:</strong> Encrypted data may persist in backups for up to 30 days</li>
            </ul>

            <h2>6. Dead Man's Switch</h2>
            <p>When you use the Dead Man's Switch feature:</p>
            <ul>
              <li>Recipient email addresses are stored to send notifications</li>
              <li>Attached PDFs are encrypted with a separate key</li>
              <li>The decryption key is only revealed when the switch triggers</li>
              <li>Triggered notifications cannot be recalled</li>
            </ul>

            <h2>7. Federation and Public Content</h2>
            <p>If you enable ActivityPub federation:</p>
            <ul>
              <li>Your public profile information may be visible to other servers</li>
              <li>Published entries are <strong>not encrypted</strong> and publicly visible</li>
              <li>Your private journal remains encrypted and separate</li>
              <li>You control what, if anything, is published publicly</li>
            </ul>

            <h2>8. Third-Party Services</h2>
            <p>We minimize third-party dependencies. Currently:</p>
            <ul>
              <li><strong>Email delivery:</strong> We use email services to send account notifications</li>
              <li><strong>No analytics:</strong> We do not use third-party analytics or tracking</li>
              <li><strong>No advertising:</strong> We will never show ads or sell your data</li>
            </ul>

            <h2>9. Data Security</h2>
            <p>We protect your data through:</p>
            <ul>
              <li>End-to-end encryption for all journal content</li>
              <li>HTTPS/TLS for all data transmission</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular security audits</li>
              <li>Open-source code for transparency</li>
            </ul>

            <h2>10. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> View all data associated with your account</li>
              <li><strong>Export:</strong> Download your encrypted data</li>
              <li><strong>Delete:</strong> Permanently delete your account and all data</li>
              <li><strong>Portability:</strong> Your data belongs to you</li>
            </ul>

            <h2>11. Children's Privacy</h2>
            <p>
              Project Caderno is not intended for children under 13 (or the applicable age in your
              jurisdiction). We do not knowingly collect data from children.
            </p>

            <h2>12. International Data</h2>
            <p>
              Your encrypted data may be stored on servers in various locations. However, because
              the data is encrypted with keys we don't possess, the physical location of storage
              does not affect the privacy of your content.
            </p>

            <h2>13. Law Enforcement</h2>
            <p>
              If compelled by law to provide user data, we can only provide:
            </p>
            <ul>
              <li>Account information (email, creation date)</li>
              <li>Encrypted data blobs (which we cannot decrypt)</li>
            </ul>
            <p>
              <strong>We cannot provide decrypted journal content because we do not have the keys.</strong>
            </p>

            <h2>14. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Significant changes will be
              communicated via email or through the Service. Your continued use constitutes
              acceptance of the updated policy.
            </p>

            <h2>15. Contact Us</h2>
            <p>
              For privacy-related questions or concerns, please contact us through the appropriate
              channels provided in the application.
            </p>

            <div className="divider"></div>

            <p className="text-sm text-base-content/60">
              This privacy policy reflects our commitment to your privacy. Our zero-knowledge
              architecture isn't just a feature—it's a fundamental design principle that ensures
              your journal remains truly yours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
