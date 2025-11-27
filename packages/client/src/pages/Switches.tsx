import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useSwitchesStore } from '../stores/switchesStore'
import { useCryptoStore } from '../stores/cryptoStore'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { Navbar } from '../components/Navbar'
import { CreateSwitchModal } from '../components/CreateSwitchModal'
import { SwitchCard } from '../components/SwitchCard'
import { EmailVerificationRequiredModal } from '../components/EmailVerificationRequiredModal'

export function Switches() {
  const { user } = useAuthStore()
  const { isKeyReady } = useCryptoStore()
  const { switches, isLoading, error, fetchSwitches, createSwitch, deleteSwitch, checkIn, checkInAll } = useSwitchesStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isKeyReady) {
      fetchSwitches()
    }
  }, [isKeyReady])

  const handleCheckInAll = async () => {
    try {
      const count = await checkInAll()
      setCheckInMessage(`Checked in to ${count} switch(es). Timers have been reset.`)
      setTimeout(() => setCheckInMessage(null), 5000)
    } catch {
      // Error handled by store
    }
  }

  const handleCheckIn = async (id: number) => {
    try {
      const result = await checkIn(id)
      setCheckInMessage(`Check-in successful! Next deadline: ${new Date(result.nextDeadline).toLocaleString()}`)
      setTimeout(() => setCheckInMessage(null), 5000)
    } catch {
      // Error handled by store
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this switch? This cannot be undone.')) {
      await deleteSwitch(id)
    }
  }

  const handleNewSwitch = () => {
    if (!user?.emailVerified) {
      setShowVerificationModal(true)
      return
    }
    setShowCreateModal(true)
  }

  // Show unlock prompt if encryption key is not ready
  if (!isKeyReady) {
    return <UnlockPrompt />
  }

  return (
    <div className="min-h-screen bg-base-200 animate-fade-in">
      <Navbar currentPage="switches" />

      <div className="container mx-auto p-3 sm:p-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Dead Man's Switches</h1>
            <p className="text-sm sm:text-base text-base-content/70">
              Safety mechanisms that notify your contacts if you don't check in
            </p>
            <p className="text-xs text-base-content/50 mt-1">
              You can close this window. Email notifications are handled by the server.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {switches.filter(s => s.isActive && !s.hasTriggered).length > 0 && (
              <button className="btn btn-success btn-sm sm:btn-md" onClick={handleCheckInAll}>
                Check All
              </button>
            )}
            <button className="btn btn-primary btn-sm sm:btn-md" onClick={handleNewSwitch}>
              + New Switch
            </button>
          </div>
        </div>

        {checkInMessage && (
          <div className="alert alert-success mb-4">
            <span>{checkInMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {isLoading && switches.length === 0 ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : switches.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-12">
              <div className="text-6xl mb-4">⏰</div>
              <h2 className="card-title">No Switches Yet</h2>
              <p className="text-base-content/70 max-w-md">
                Create a Dead Man's Switch to notify trusted contacts if you don't check in regularly.
                This is useful for journalists, activists, or anyone who wants an extra safety measure.
              </p>
              <button className="btn btn-primary mt-4" onClick={handleNewSwitch}>
                Create Your First Switch
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {switches.map((s) => (
              <SwitchCard
                key={s.id}
                switchData={s}
                onCheckIn={() => handleCheckIn(s.id)}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateSwitchModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            await createSwitch(data)
            setShowCreateModal(false)
          }}
        />
      )}

      {showVerificationModal && (
        <EmailVerificationRequiredModal onClose={() => setShowVerificationModal(false)} />
      )}
    </div>
  )
}
