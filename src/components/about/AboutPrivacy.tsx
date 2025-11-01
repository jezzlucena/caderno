export default function AboutPrivacy() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Privacy</h3>
      <p className="text-gray-700 leading-relaxed">Privacy is paramount and the foundation of our platform.</p>
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">🔐 End-to-End Encryption</h4>
          <p className="text-sm text-gray-700">All entries are E2EE by default. Only you (and your intended recipients) can decrypt them—not us, not anyone.</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">🌐 Federated Storage</h4>
          <p className="text-sm text-gray-700">Choose your own server or a trusted host. No centralized data silos vulnerable to mass surveillance.</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">🚫 No Tracking</h4>
          <p className="text-sm text-gray-700">We don't track, profile, or monetize your data. No advertising, no data mining—your data serves only you.</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">👤 User Control</h4>
          <p className="text-sm text-gray-700">Export, delete, or manage your data anytime. Offline-first with optional sync. You're always in control.</p>
        </div>
      </div>
    </div>
  );
}
