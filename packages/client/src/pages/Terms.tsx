import { Navbar } from '../components/Navbar'

export function Terms() {
  return (
    <div className="min-h-screen bg-base-200 animate-fade-in">
      <Navbar currentPage="terms" />
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body prose max-w-none">
            <h1>Terms of Service</h1>
            <p className="text-sm text-base-content/60">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Caderno ("the Service"), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Caderno is an end-to-end encrypted journaling platform that allows users to
              create, store, and manage personal journal entries. The Service also includes optional
              features such as Dead Man's Switches and ActivityPub federation.
            </p>

            <h2>3. User Accounts</h2>
            <p>To use the Service, you must:</p>
            <ul>
              <li>Create an account with a valid email address</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Be at least 13 years of age (or the minimum age in your jurisdiction)</li>
            </ul>
            <p>
              You are responsible for all activities that occur under your account. Due to our
              end-to-end encryption, we cannot recover your data if you lose your password.
            </p>

            <h2>4. User Responsibilities</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purposes</li>
              <li>Attempt to circumvent security measures</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2>5. Encryption and Data Access</h2>
            <p>
              Your journal entries are encrypted using keys derived from your password. This means:
            </p>
            <ul>
              <li>We cannot access, read, or decrypt your journal entries</li>
              <li>We cannot recover your data if you forget your password</li>
              <li>You are solely responsible for maintaining access to your account</li>
            </ul>

            <h2>6. Dead Man's Switch Feature</h2>
            <p>
              The Dead Man's Switch feature allows you to configure automatic notifications to
              designated recipients if you fail to check in within a specified period. By using
              this feature, you:
            </p>
            <ul>
              <li>Accept responsibility for the content shared through triggered switches</li>
              <li>Confirm you have the right to share any attached content with recipients</li>
              <li>Understand that triggered switches cannot be recalled once sent</li>
            </ul>

            <h2>7. Federation and Public Content</h2>
            <p>
              If you enable ActivityPub federation and publish content publicly, that content:
            </p>
            <ul>
              <li>Is not encrypted and may be visible to anyone on the internet</li>
              <li>May be cached or stored by other federated servers</li>
              <li>Cannot be fully deleted once distributed to other servers</li>
            </ul>

            <h2>8. Intellectual Property</h2>
            <p>
              You retain all rights to the content you create. By using the Service, you grant us
              a limited license to store and transmit your encrypted data as necessary to provide
              the Service.
            </p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" without warranties of any kind, either express or
              implied. We do not guarantee that the Service will be uninterrupted, secure, or
              error-free.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages resulting from your use
              of or inability to use the Service.
            </p>

            <h2>11. Data Loss</h2>
            <p>
              Due to the encrypted nature of the Service, we cannot guarantee data recovery in
              case of:
            </p>
            <ul>
              <li>Lost or forgotten passwords</li>
              <li>Technical failures</li>
              <li>Account deletion</li>
            </ul>
            <p>
              We strongly recommend maintaining your own backups of important information.
            </p>

            <h2>12. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account at any time for violations
              of these terms. You may also delete your account at any time. Upon termination, your
              encrypted data will be permanently deleted.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. We will notify users of
              significant changes via email or through the Service. Continued use after changes
              constitutes acceptance of the new terms.
            </p>

            <h2>14. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws,
              without regard to conflict of law principles.
            </p>

            <h2>15. Contact</h2>
            <p>
              If you have questions about these Terms of Service, please contact us through the
              appropriate channels provided in the application.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
