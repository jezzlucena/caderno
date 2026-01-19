import { useEffect, useState } from 'react';
import { OrbitalBackground } from './components/OrbitalBackground';

function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Caderno" className="w-8 h-8" />
            <span className="text-xl font-semibold text-slate-900 dark:text-white transition-colors">Caderno</span>
          </div>
          <nav className="flex items-center gap-10">
            <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
            <a href="#safety-timer" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Safety Timer</a>
            <a href="#mission" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Mission</a>
            <a href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</a>
            <a href="#contact" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact</a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <OrbitalBackground className="z-0" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pointer-events-none">
          <div className="card-glass p-12">
            <img src="/logo.svg" alt="Caderno" className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">
              Caderno
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 transition-colors">
              A privacy-first, self-hosted digital journal.<br />
              Your thoughts. Your data. Your control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://caderno.jezzlucena.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-lg pointer-events-auto"
              >
                Try Live Demo
              </a>
              <a
                href="https://github.com/jezzlucena/caderno"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-lg pointer-events-auto"
              >
                View Source Code
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-800/50 transition-colors">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-4 transition-colors">
            Why Caderno?
          </h2>
          <p className="text-xl text-center text-slate-600 dark:text-slate-300 mb-16 max-w-2xl mx-auto transition-colors">
            Built for people who value their privacy and want complete control over their personal data.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Privacy First</h3>
              <p className="text-slate-600 dark:text-slate-300 transition-colors">
                Your journal entries never leave your server. No third-party tracking, no data harvesting, no compromises.
              </p>
            </div>
            <div className="card">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Self-Hosted</h3>
              <p className="text-slate-600 dark:text-slate-300 transition-colors">
                Deploy on your own infrastructure with Docker. Full control over your data, backups, and security.
              </p>
            </div>
            <div className="card">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Open Source</h3>
              <p className="text-slate-600 dark:text-slate-300 transition-colors">
                Fully open source under MIT license. Audit the code, contribute features, or fork it for your needs.
              </p>
            </div>
            <div className="card">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Passkey Support</h3>
              <p className="text-slate-600 dark:text-slate-300 transition-colors">
                Modern passwordless authentication with passkeys. Secure, convenient, and phishing-resistant.
              </p>
            </div>
            <div className="card">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Import & Export</h3>
              <p className="text-slate-600 dark:text-slate-300 transition-colors">
                Your data is yours. Export anytime in standard formats. No vendor lock-in, ever.
              </p>
            </div>
            <div className="card">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Safety Timer</h3>
              <p className="text-slate-600 dark:text-slate-300 transition-colors">
                Set up check-in reminders and designate trusted contacts for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Timer Section */}
      <section id="safety-timer" className="py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/50 rounded-full mb-6 transition-colors">
              <svg className="w-10 h-10 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">
              Safety Timer
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto transition-colors">
              Your story matters. The Safety Timer ensures your voice is heard, even when you can't speak for yourself.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 transition-colors">
                Protection Against Ill Intent
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed transition-colors">
                Life can be unpredictable. Whether you're concerned about personal safety, traveling alone, or simply want
                peace of mind, the Safety Timer acts as your silent guardian. If something prevents you from checking in,
                your designated trusted contacts will be automatically notified.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
                This isn't just a feature - it's a statement that your well-being matters, and that someone will always
                know if you need help.
              </p>
            </div>
            <div className="card p-8 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-900 border-primary-200 dark:border-primary-800">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white transition-colors">Regular Check-ins</h4>
                    <p className="text-slate-600 dark:text-slate-300 transition-colors">Set your own schedule for periodic safety confirmations</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white transition-colors">Trusted Contacts</h4>
                    <p className="text-slate-600 dark:text-slate-300 transition-colors">Designate people you trust to receive alerts if needed</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white transition-colors">Automatic Alerts</h4>
                    <p className="text-slate-600 dark:text-slate-300 transition-colors">Email notifications sent automatically when check-ins are missed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 card p-8 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
              <blockquote className="text-lg italic text-slate-600 dark:text-slate-300 mb-6 transition-colors">
                "Your journal is more than a record of events - it's your perspective, your truth, your side of the story.
                The Safety Timer ensures that if something happens to you, your narrative doesn't disappear with you."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white transition-colors">Your Story, Protected</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Because everyone deserves to be heard</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 transition-colors">
                Control Your Own Narrative
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed transition-colors">
                Your journal entries contain your truth - your experiences, your thoughts, your perspective on events.
                In situations where others might try to rewrite history or silence your voice, your documented experiences
                become invaluable.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed transition-colors">
                The Safety Timer empowers you to ensure that if you're unable to speak for yourself, your trusted contacts
                can access what you've chosen to share. Your perspective matters, and it deserves to be preserved.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Document important events and interactions
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Keep a secure, timestamped record
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Ensure your voice can be heard when it matters most
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission" className="py-24 bg-slate-50 dark:bg-slate-800/50 transition-colors">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-16 transition-colors">
            Our Mission & Vision
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-4 transition-colors">Mission</h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
                To empower individuals with a secure, private space for self-reflection. We believe that personal thoughts
                and memories deserve the highest level of protection, and that privacy is a fundamental right, not a premium feature.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-4 transition-colors">Vision</h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
                A world where everyone has access to tools that respect their privacy and autonomy. We envision Caderno
                as the gold standard for personal journaling - simple enough for anyone to use, yet powerful enough
                for those who demand complete control over their data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-4 transition-colors">
            Simple, Honest Pricing
          </h2>
          <p className="text-xl text-center text-slate-600 dark:text-slate-300 mb-16 max-w-2xl mx-auto transition-colors">
            Caderno is free and open source. Forever. We also offer managed hosting for those who prefer convenience.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card p-8 border-2 border-primary-200 dark:border-primary-800">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Self-Hosted</h3>
                <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-4 transition-colors">Free</div>
                <p className="text-slate-600 dark:text-slate-300 mb-6 transition-colors">Forever. No strings attached.</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Full feature access
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete source code
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Docker deployment
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Community support
                  </li>
                </ul>
                <a
                  href="https://github.com/jezzlucena/caderno"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full"
                >
                  Get Started
                </a>
              </div>
            </div>
            <div className="card p-8 border-2 border-primary-600 dark:border-primary-400 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                Coming Soon
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Managed Hosting</h3>
                <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-4 transition-colors">
                  $10<span className="text-lg font-normal text-slate-600 dark:text-slate-300 transition-colors">/mo</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6 transition-colors">+ actual hosting costs</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Everything in Self-Hosted
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Hassle-free setup
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Automatic updates
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                </ul>
                <a
                  href="#contact"
                  className="btn-primary w-full"
                >
                  Contact for Early Access
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/50 transition-colors">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">
            Support the Project
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto transition-colors">
            Caderno is maintained by a passionate developer committed to privacy. Your sponsorship helps keep the project alive and growing.
          </p>
          <a
            href="https://github.com/sponsors/jezzlucena"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-lg inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Become a Sponsor
          </a>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">
            Get in Touch
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto transition-colors">
            Have questions, feedback, or want to discuss managed hosting? We'd love to hear from you.
          </p>
          <a
            href="mailto:jezzlucena@gmail.com"
            className="btn-primary text-lg inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            jezzlucena@gmail.com
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 dark:bg-slate-950 transition-colors">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Caderno" className="w-8 h-8" />
              <span className="text-lg font-semibold text-white">Caderno</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/jezzlucena/caderno"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://caderno.jezzlucena.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Live Demo
              </a>
              <a
                href="https://github.com/sponsors/jezzlucena"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Sponsor
              </a>
              <a
                href="mailto:jezzlucena@gmail.com"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Caderno. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
