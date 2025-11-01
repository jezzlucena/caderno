export default function AboutVision() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Vision</h3>
      <p className="text-gray-700 leading-relaxed">
        A world where <strong>personal narratives and critical truths are preserved securely, transparently, and resiliently</strong> — beyond the reach of any authority.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">🏛️ Ethical Sanctuary</h4>
          <p className="text-sm text-blue-800">An ethical digital sanctuary fostering transparency and resilience against oppression.</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">💪 Empowerment</h4>
          <p className="text-sm text-green-800">Empowered individuals speak truth to power, ensuring voices cannot be erased.</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">🌐 Federation</h4>
          <p className="text-sm text-purple-800">User-operated servers worldwide form a censorship-resistant network.</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-2">🔐 New Standard</h4>
          <p className="text-sm text-amber-800">Normalizing E2E encryption, decentralization, and user autonomy as defaults.</p>
        </div>
      </div>
    </div>
  );
}
