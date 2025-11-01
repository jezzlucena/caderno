export default function AboutMission() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Mission</h3>
      <p className="text-gray-700 leading-relaxed">
        Caderno is a <strong>privacy-first, decentralized journaling platform</strong> dedicated to protecting personal truths and empowering those who speak truth to power.
      </p>
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h4 className="font-semibold text-indigo-900 mb-2">Core Purpose</h4>
        <p className="text-sm text-indigo-800">
          Provide journalists, whistleblowers, survivors, and activists with a secure digital space to document experiences without fear of censorship or surveillance.
        </p>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-800">Key Features:</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          <li><strong>Encrypted Storage:</strong> Journal entries in encrypted "pantries" on decentralized cloud you control</li>
          <li><strong>Safety Mechanism:</strong> Optional timed alarm (dead man's switch) delivers entries to trusted contacts</li>
          <li><strong>Federated Infrastructure:</strong> Self-hostable, putting control in the hands of the people</li>
          <li><strong>Evidence Preservation:</strong> Safeguards protecting users from those who might silence them</li>
        </ul>
      </div>
    </div>
  );
}
