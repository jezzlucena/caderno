import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { sendSupportRequestEmail } from '../services/email.service.js'
import { emailLimiter } from '../middleware/rateLimit.js'

export const supportRouter: RouterType = Router()

// Apply email rate limiting (3 requests/hour) to prevent spam
supportRouter.use(emailLimiter)

// Category labels for the email
const categoryLabels: Record<string, string> = {
  security: 'Security Concern',
  privacy: 'Privacy Issue',
  harassment: 'Harassment or Abuse',
  threat: 'Threat Model Consultation',
  account: 'Account Issues',
  bug: 'Bug Report',
  feature: 'Feature Request',
  other: 'Other'
}

// Validation schema
const supportRequestSchema = z.object({
  category: z.enum(['security', 'privacy', 'harassment', 'threat', 'account', 'bug', 'feature', 'other']),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message must be less than 5000 characters'),
  isUrgent: z.boolean().default(false)
})

// POST /api/support
supportRouter.post('/', async (req, res) => {
  try {
    const data = supportRequestSchema.parse(req.body)

    await sendSupportRequestEmail({
      category: data.category,
      categoryLabel: categoryLabels[data.category],
      email: data.email,
      subject: data.subject,
      message: data.message,
      isUrgent: data.isUrgent
    })

    res.status(200).json({ message: 'Support request submitted successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    console.error('Support request failed:', error)
    res.status(500).json({ error: 'Failed to submit support request. Please try again later.' })
  }
})
