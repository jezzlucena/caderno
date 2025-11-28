import { eq, and, lt, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { deadManSwitches, switchRecipients, users } from '../db/schema.js'
import { sendSwitchTriggeredEmail } from './email.service.js'

const CHECK_INTERVAL_MS = 60 * 1000 // Check every minute

/**
 * Check for expired switches and trigger them
 */
async function checkExpiredSwitches(): Promise<void> {
  try {
    // Find all active, non-triggered switches where lastCheckIn + timerMs has passed
    const expiredSwitches = await db.query.deadManSwitches.findMany({
      where: and(
        eq(deadManSwitches.isActive, true),
        eq(deadManSwitches.hasTriggered, false)
      ),
      with: {
        recipients: true,
        user: true
      }
    })

    const now = new Date()

    if (expiredSwitches.length > 0) {
      console.log(`[Scheduler] Found ${expiredSwitches.length} active switch(es) to check`)
    }

    for (const switchData of expiredSwitches) {
      // Ensure timerMs is a number (it comes from bigint column)
      const timerMs = Number(switchData.timerMs)
      const lastCheckInTime = switchData.lastCheckIn.getTime()
      const deadline = new Date(lastCheckInTime + timerMs)
      const msRemaining = deadline.getTime() - now.getTime()

      console.log(`[Scheduler] Switch ID ${switchData.id}: lastCheckIn=${switchData.lastCheckIn.toISOString()}, timerMs=${timerMs}, deadline=${deadline.toISOString()}, msRemaining=${msRemaining}`)

      if (now > deadline) {
        console.log(`[Scheduler] Switch ID ${switchData.id} has expired. Triggering...`)

        // Mark as triggered
        await db.update(deadManSwitches)
          .set({
            hasTriggered: true,
            triggeredAt: now,
            updatedAt: now
          })
          .where(eq(deadManSwitches.id, switchData.id))

        // Prepare payload info if available
        const payloadInfo = switchData.encryptedPayload && switchData.payloadKey
          ? { switchId: switchData.id, payloadKey: switchData.payloadKey }
          : undefined

        // Send emails to all recipients
        // Note: Switch name is E2EE encrypted, so we use switch ID for identification
        console.log(`[Scheduler] Sending trigger emails to ${switchData.recipients.length} recipient(s)`)

        for (const recipient of switchData.recipients) {
          try {
            console.log(`[Scheduler] Attempting to send email to ${recipient.email}...`)
            await sendSwitchTriggeredEmail(
              recipient.email,
              recipient.name || recipient.email,
              switchData.id,
              switchData.triggerMessage || 'This is an automated message from a Dead Man\'s Switch.',
              switchData.user.email,
              payloadInfo
            )
            console.log(`[Scheduler] Successfully sent trigger email to ${recipient.email}${payloadInfo ? ' (with payload link)' : ''}`)
          } catch (emailError) {
            console.error(`[Scheduler] Failed to send email to ${recipient.email}:`, emailError instanceof Error ? emailError.message : emailError)
            console.error(`[Scheduler] Full error:`, emailError)
          }
        }

        console.log(`[Scheduler] Switch ID ${switchData.id} triggered successfully`)
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error checking expired switches:', error)
  }
}

/**
 * Start the background scheduler
 */
export function startScheduler(): void {
  console.log('[Scheduler] Starting Dead Man\'s Switch scheduler...')
  console.log(`[Scheduler] Checking for expired switches every ${CHECK_INTERVAL_MS / 1000} seconds`)

  // Run immediately on startup
  checkExpiredSwitches()

  // Then run periodically
  setInterval(checkExpiredSwitches, CHECK_INTERVAL_MS)
}

/**
 * Get status of all switches for a user (useful for debugging/admin)
 */
export async function getSwitchStatuses(userId: number) {
  const switches = await db.query.deadManSwitches.findMany({
    where: eq(deadManSwitches.userId, userId),
    with: {
      recipients: true
    }
  })

  return switches.map(s => {
    const timerMs = Number(s.timerMs)
    const deadline = new Date(s.lastCheckIn.getTime() + timerMs)
    const now = new Date()
    const msRemaining = deadline.getTime() - now.getTime()
    const hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)))
    const daysRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60 * 24)))

    return {
      id: s.id,
      // Note: name is E2EE encrypted, use encryptedName if needed
      encryptedName: s.encryptedName,
      isActive: s.isActive,
      hasTriggered: s.hasTriggered,
      timerMs,
      lastCheckIn: s.lastCheckIn,
      deadline,
      daysRemaining,
      hoursRemaining,
      recipientCount: s.recipients.length
    }
  })
}
