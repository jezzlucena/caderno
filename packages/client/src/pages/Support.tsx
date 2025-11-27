import { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { supportApi, ApiError } from '../lib/api'

type SupportCategory =
  | 'security'
  | 'privacy'
  | 'harassment'
  | 'threat'
  | 'account'
  | 'bug'
  | 'feature'
  | 'other'

const categoryInfo: Record<SupportCategory, { label: string; description: string }> = {
  security: {
    label: 'Security Concern',
    description: 'Report a security vulnerability or suspicious activity on your account'
  },
  privacy: {
    label: 'Privacy Issue',
    description: 'Concerns about your data privacy or how your information is handled'
  },
  harassment: {
    label: 'Harassment or Abuse',
    description: 'Report harassment, abuse, or threatening behavior from other users'
  },
  threat: {
    label: 'Threat Model Consultation',
    description: 'Get guidance on protecting yourself from specific threats (journalists, activists, at-risk individuals)'
  },
  account: {
    label: 'Account Issues',
    description: 'Problems with login, password recovery, or account access'
  },
  bug: {
    label: 'Bug Report',
    description: 'Report a technical issue or unexpected behavior'
  },
  feature: {
    label: 'Feature Request',
    description: 'Suggest a new feature or improvement'
  },
  other: {
    label: 'Other',
    description: 'General questions or feedback'
  }
}

export function Support() {
  const [category, setCategory] = useState<SupportCategory | ''>('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return

    setIsLoading(true)
    setError(null)

    try {
      await supportApi.submit({
        category,
        email,
        subject,
        message,
        isUrgent
      })
      setSubmitted(true)
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : 'Failed to submit support request. Please try again later.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-base-200 animate-fade-in">
        <Navbar currentPage="support" />
        <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <div className="text-6xl mb-4">✓</div>
              <h1 className="text-2xl font-bold mb-4">Request Submitted</h1>
              <p className="text-base-content/70 mb-6">
                Thank you for reaching out. We take all support requests seriously and will
                respond as quickly as possible.
              </p>
              {isUrgent && (
                <div className="alert alert-info mb-6">
                  <span>
                    Your request has been marked as urgent. For immediate safety concerns,
                    please also contact local emergency services if applicable.
                  </span>
                </div>
              )}
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSubmitted(false)
                  setCategory('')
                  setEmail('')
                  setSubject('')
                  setMessage('')
                  setIsUrgent(false)
                  setError(null)
                }}
              >
                Submit Another Request
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200 animate-fade-in">
      <Navbar currentPage="support" />
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body prose max-w-none">
            <h1>Contact Support</h1>

            <p className="lead text-lg">
              We're here to help. Whether you have a security concern, need assistance with
              your account, or want to report an issue, please reach out.
            </p>

            <div className="alert alert-warning mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>Immediate danger?</strong> If you are in immediate physical danger,
                please contact your local emergency services first.
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 not-prose">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">What can we help you with?</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.entries(categoryInfo) as [SupportCategory, typeof categoryInfo[SupportCategory]][]).map(([key, info]) => (
                    <label
                      key={key}
                      className={`relative card bg-base-200 cursor-pointer transition-all hover:bg-base-300 ${
                        category === key ? 'ring-2 ring-primary bg-primary/10' : ''
                      }`}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="category"
                            className="radio radio-primary mt-1"
                            checked={category === key}
                            onChange={() => setCategory(key)}
                          />
                          <div>
                            <div className="font-semibold">{info.label}</div>
                            <div className="text-sm text-base-content/60">{info.description}</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {(category === 'security' || category === 'harassment' || category === 'threat') && (
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-semibold">This is urgent</span>
                      <p className="text-sm text-base-content/60">
                        Check this if you need immediate assistance due to an active threat
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Your Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="email@example.com"
                />
                <label className="label">
                  <span className="label-text-alt">We'll use this to respond to your request</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Subject</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Message</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-40"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Please provide as much detail as possible..."
                />
              </div>

              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="font-semibold mb-2">Your Privacy</h3>
                  <p className="text-sm text-base-content/70">
                    Support requests are handled confidentially. We only use your information
                    to address your concern and will never share it with third parties.
                    For security reports, we follow responsible disclosure practices.
                  </p>
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setError(null)}
                  >
                    &times;
                  </button>
                </div>
              )}

              <button
                type="submit"
                className={`btn w-full ${isUrgent ? 'btn-warning' : 'btn-primary'}`}
                disabled={!category || isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : isUrgent ? (
                  'Submit Urgent Request'
                ) : (
                  'Submit Request'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
