import { useState, useEffect } from 'react'
import { type DecryptedSwitch } from '../stores/switchesStore'

// Format milliseconds to human-readable string
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) {
    const remainingDays = days % 365
    if (remainingDays > 0) {
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`
    }
    return `${years} year${years !== 1 ? 's' : ''}`
  }
  if (months > 0) {
    const remainingDays = days % 30
    if (remainingDays > 0) {
      return `${months} month${months !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`
    }
    return `${months} month${months !== 1 ? 's' : ''}`
  }
  if (days > 0) {
    const remainingHours = hours % 24
    if (remainingHours > 0) {
      return `${days} day${days !== 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
    }
    return `${days} day${days !== 1 ? 's' : ''}`
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60
    if (remainingMinutes > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}, ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
}

interface SwitchCardProps {
  switchData: DecryptedSwitch
  onCheckIn: () => void
  onDelete: () => void
}

export function SwitchCard({ switchData, onCheckIn, onDelete }: SwitchCardProps) {
  const [now, setNow] = useState(new Date())

  // Update timer every second for active switches
  useEffect(() => {
    if (switchData.hasTriggered || !switchData.isActive) return

    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [switchData.hasTriggered, switchData.isActive])

  const deadline = new Date(new Date(switchData.lastCheckIn).getTime() + switchData.timerMs)
  const msRemaining = deadline.getTime() - now.getTime()
  const secondsRemaining = Math.max(0, Math.floor(msRemaining / 1000))
  const minutesRemaining = Math.max(0, Math.floor(secondsRemaining / 60))
  const hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)))
  const daysRemaining = Math.floor(hoursRemaining / 24)
  const secondsInMinute = secondsRemaining - minutesRemaining * 60
  const minutesInHour = minutesRemaining - hoursRemaining * 60
  const hoursInDay = hoursRemaining % 24

  const isExpiringSoon = hoursRemaining < 24
  const isExpired = msRemaining <= 0

  return (
    <div className={`card bg-base-100 shadow-xl ios-card animate-fade-in-up ${switchData.hasTriggered ? 'border-2 border-error' : ''}`}>
      <div className="card-body p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h2 className="card-title text-base sm:text-lg flex-wrap gap-2">
              {switchData.name}
              {switchData.hasTriggered && (
                <span className="badge badge-error badge-sm sm:badge-md">TRIGGERED</span>
              )}
              {!switchData.hasTriggered && !switchData.isActive && (
                <span className="badge badge-ghost badge-sm sm:badge-md">Paused</span>
              )}
              {!switchData.hasTriggered && switchData.isActive && isExpiringSoon && (
                <span className="badge badge-warning badge-sm sm:badge-md">Expiring Soon</span>
              )}
              {switchData.encryptedPayload && (
                <span className="badge badge-info badge-sm sm:badge-md">PDF Attached</span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-base-content/70">
              Timer: {formatDuration(switchData.timerMs)}
            </p>
          </div>

          <div className="flex gap-2">
            {!switchData.hasTriggered && switchData.isActive && (
              <button className="btn btn-success btn-sm" onClick={onCheckIn}>
                Check In
              </button>
            )}
            <button className="btn btn-ghost btn-sm text-error" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>

        {!switchData.hasTriggered && switchData.isActive && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Time Remaining</span>
              <span className={`font-mono ${isExpiringSoon ? 'text-warning font-bold' : ''}`}>
                {isExpired ? 'Expired!' : `${daysRemaining}d ${hoursInDay < 10 ? '0' : ''}${hoursInDay}h ${minutesInHour < 10 ? '0' : ''}${minutesInHour}m ${secondsInMinute < 10 ? '0' : ''}${secondsInMinute}s`}
              </span>
            </div>
            <progress
              className={`progress w-full ${isExpiringSoon ? 'progress-warning' : 'progress-success'}`}
              value={Math.max(0, msRemaining)}
              max={switchData.timerMs}
            />
            <p className="text-xs text-base-content/50 mt-1">
              Deadline: {deadline.toLocaleString()}
            </p>
          </div>
        )}

        {switchData.hasTriggered && switchData.triggeredAt && (
          <div className="mt-2 text-error text-sm">
            Triggered on: {new Date(switchData.triggeredAt).toLocaleString()}
          </div>
        )}

        <div className="mt-4">
          <p className="font-medium">Recipients ({switchData.recipients.length}):</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {switchData.recipients.map((r) => (
              <span key={r.id} className="badge badge-outline text-sm">
                {r.name} ({r.email})
              </span>
            ))}
          </div>
        </div>

        {switchData.triggerMessage && (
          <div className="mt-4 p-3 bg-base-200 rounded-lg">
            <p className="text-sm font-medium">Trigger Message:</p>
            <p className="text-sm text-base-content/70 whitespace-pre-wrap">
              {switchData.triggerMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
