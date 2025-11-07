import { useState } from 'react'
import { toast } from 'react-toastify'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import { api } from '../../services/api'

interface LoginModalProps {
  onClose: () => void
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { t } = useTranslation()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { setAuth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = isSignUp
        ? await api.signUp(email, password)
        : await api.signIn(email, password)

      localStorage.setItem('token', data.token);
      setAuth(data.user, data.token)
      
      // Fetch subscription info
      try {
        const subData = await api.getSubscription()
        if (subData.subscription) {
          setAuth({ ...data.user, subscription: subData.subscription }, data.token)
        }
      } catch (err) {
        console.error('Error fetching subscription:', err)
      }

      toast.success(isSignUp ? t('modal.login.success.accountCreated') : t('modal.login.success.signedIn'))
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('modal.login.error.generic'))
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = (provider: 'google' | 'github' | 'microsoft' | 'apple') => {
    const oauthUrl = api.getOAuthUrl(provider)
    window.location.href = oauthUrl
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-slideUp">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isSignUp ? t('modal.login.title.createAccount') : t('modal.login.title.signIn')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('modal.login.form.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t('modal.login.form.emailPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('modal.login.form.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t('modal.login.form.passwordPlaceholder')}
            />
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">{t('modal.login.form.passwordRequirement')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('modal.login.button.loading') : isSignUp ? t('modal.login.button.signUp') : t('modal.login.button.signIn')}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t('modal.login.divider.orContinueWith')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {t('modal.login.oauth.google')}
          </button>
          <button
            onClick={() => handleOAuth('github')}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {t('modal.login.oauth.github')}
          </button>
          <button
            onClick={() => handleOAuth('microsoft')}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {t('modal.login.oauth.microsoft')}
          </button>
          <button
            onClick={() => handleOAuth('apple')}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {t('modal.login.oauth.apple')}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            {isSignUp ? t('modal.login.toggle.alreadyHaveAccount') : t('modal.login.toggle.dontHaveAccount')}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          {t('modal.login.footer.description')}
        </p>
      </div>
    </div>
  )
}
