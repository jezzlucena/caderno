import { useState, useEffect } from 'react'
import { XMarkIcon, HeartIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/useAuthStore'
import { DONATION_NOTIFICATION_TIMEOUT_MS } from '../util/constants';

interface DonationNotificationProps {
  urgent?: boolean;
  onDismiss?: () => void
  style?: React.CSSProperties
}

export default function DonationNotification({ urgent, onDismiss, style }: DonationNotificationProps) {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const { hasPaidSubscription } = useAuthStore()

  useEffect(() => {
    // Don't show notification if user has paid subscription
    if (hasPaidSubscription()) {
      setIsDismissed(true)
      return
    }

    // Show notification after a delay (non-intrusive)
    if (!urgent) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, DONATION_NOTIFICATION_TIMEOUT_MS)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [hasPaidSubscription, urgent])

  const handleDismiss = () => {
    onDismiss?.()
    setIsVisible(false)
    setIsDismissed(true)
  }

  const handleSupport = () => {
    window.open('https://caderno-hub.example.com/pricing', '_blank')
    handleDismiss()
  }

  if (isDismissed || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border-2 border-blue-200 py-4 px-6 animate-slide-in z-50" style={style}>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={t('donationNotification.dismiss')}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-4">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center">
          <HeartIcon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{t('donationNotification.title')}</h3>
          <p className="text-sm text-gray-600 mb-3">
            {t('donationNotification.description')}
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleSupport}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {t('donationNotification.viewPlans')}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {t('donationNotification.maybeLater')}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">
            {t('donationNotification.subscribeNote')}
          </p>
        </div>
      </div>
    </div>
  )
}
