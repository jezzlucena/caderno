export default function AboutEthos() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Ethos</h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        Grounded in <strong>transparency, resilience, and empowerment</strong>, guided by privacy, security, and social accountability.
      </p>
      <div className="space-y-3">
        <div className="border-l-4 border-indigo-600 pl-4">
          <h4 className="font-semibold text-gray-800">Transparency</h4>
          <p className="text-sm text-gray-700">Fully open-source with no hidden backdoors. Anyone can inspect and contribute to the code.</p>
        </div>
        <div className="border-l-4 border-green-600 pl-4">
          <h4 className="font-semibold text-gray-800">Privacy</h4>
          <p className="text-sm text-gray-700">Built on E2E encryption. We don't collect or monetize personal data—period.</p>
        </div>
        <div className="border-l-4 border-blue-600 pl-4">
          <h4 className="font-semibold text-gray-800">Security & Resilience</h4>
          <p className="text-sm text-gray-700">Decentralized architecture with no single point of failure. Robust against outages and censorship.</p>
        </div>
        <div className="border-l-4 border-purple-600 pl-4">
          <h4 className="font-semibold text-gray-800">Empowerment & Advocacy</h4>
          <p className="text-sm text-gray-700">Self-hosting capability returns power to the people. We stand with whistleblowers and activists.</p>
        </div>
        <div className="border-l-4 border-amber-600 pl-4">
          <h4 className="font-semibold text-gray-800">Accountability & Integrity</h4>
          <p className="text-sm text-gray-700">Create immutable records that serve as evidence, ensuring truth finds a way out.</p>
        </div>
      </div>
    </div>
  );
}
