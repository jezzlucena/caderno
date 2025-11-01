export default function AboutMonetization() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Sustainability</h3>
      <p className="text-gray-700 leading-relaxed">
        Sustainable funding that <strong>aligns with our values</strong>—never compromising user trust.
      </p>
      <div className="space-y-3">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💼 Open-Source SaaS</h4>
          <p className="text-sm text-blue-800">Optional managed hosting for users who prefer convenience. Software remains free and self-hostable.</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">🏢 Enterprise Support</h4>
          <p className="text-sm text-green-800">Custom solutions, priority support, and consulting for organizations like NGOs and journalism outlets.</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">❤️ Donations & Sponsorships</h4>
          <p className="text-sm text-purple-800">Community funding through platforms like Open Collective. Grants from digital rights foundations.</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-red-900 mb-2">🚫 Never</h4>
          <p className="text-sm text-red-800">No advertisements. No data sales. No user analytics for profit. No paywalls that hinder basic access.</p>
        </div>
      </div>
      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Transparent Finance:</strong> Open accounting of how the project is funded. Profits reinvested into the mission.
        </p>
      </div>
    </div>
  );
}
