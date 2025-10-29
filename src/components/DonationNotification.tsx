import { useState, useEffect } from 'react'
import { XMarkIcon, HeartIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/useAuthStore'

export default function DonationNotification() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const { hasPaidSubscription } = useAuthStore()

  useEffect(() => {
    // Don't show notification if user has paid subscription
    if (hasPaidSubscription()) {
      setIsDismissed(true)
      return
    }

    // Check if user has dismissed the notification
    const dismissed = localStorage.getItem('donation-notification-dismissed')
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    // Show notification after a delay (non-intrusive)
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10000) // Show after 10 seconds

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('donation-notification-dismissed', 'true')
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
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border-2 border-blue-200 p-4 animate-slide-in z-50">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-4">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center">
          <HeartIcon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">Support Open Source</h3>
          <p className="text-sm text-gray-600 mb-3">
            We're a small business focused on ethics & privacy. No ads, no data selling—ever! 
            Your support helps us keep Caderno free and open source. ❤️
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleSupport}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              View Plans
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Maybe Later
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">
            Subscribe to turn off these notifications
          </p>
        </div>
      </div>
    </div>
  )
}
