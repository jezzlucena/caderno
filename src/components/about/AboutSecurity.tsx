export default function AboutSecurity() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Cybersecurity</h3>
      <p className="text-gray-700 leading-relaxed">Defense-in-depth strategy to protect high-risk users.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h4 className="font-semibold text-blue-900 text-sm mb-1">State-of-the-Art Encryption</h4>
          <p className="text-xs text-blue-800">AES-256, E2EE for journal content, TLS 1.3 for network. Data protected at rest and in transit.</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <h4 className="font-semibold text-green-900 text-sm mb-1">Federated Security</h4>
          <p className="text-xs text-green-800">Each server operates independently. Breach of one doesn't affect others—no single honeypot.</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <h4 className="font-semibold text-purple-900 text-sm mb-1">User Security Features</h4>
          <p className="text-xs text-purple-800">Multi-factor authentication, app lock, panic mode, and anti-tampering detection.</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <h4 className="font-semibold text-amber-900 text-sm mb-1">Security Auditing</h4>
          <p className="text-xs text-amber-800">Open-source for community review. Third-party audits. Responsible disclosure program.</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <h4 className="font-semibold text-red-900 text-sm mb-1">Dead Man's Switch</h4>
          <p className="text-xs text-red-800">Encrypted package released to trusted contacts if user is unable to check in. Deters coercion.</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <h4 className="font-semibold text-indigo-900 text-sm mb-1">Continuous Improvement</h4>
          <p className="text-xs text-indigo-800">Regular updates, incident response plans, and ongoing threat monitoring.</p>
        </div>
      </div>
    </div>
  );
}
