import sgMail from '@sendgrid/mail'
import { env } from '../config/env.js'

// Initialize SendGrid client
function initSendGrid(): boolean {
  if (!env.SENDGRID_API_KEY) {
    return false
  }
  sgMail.setApiKey(env.SENDGRID_API_KEY)
  return true
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, replyTo } = options

  // Check if SendGrid is configured
  if (!initSendGrid()) {
    if (env.NODE_ENV === 'development') {
      console.warn('[Email] SendGrid not configured. Email not sent.')
      console.log('[DEV] Would have sent email:')
      console.log(`  To: ${to}`)
      console.log(`  Subject: ${subject}`)
      return
    }
    throw new Error('Email service not configured. Please configure SendGrid.')
  }

  const msg: sgMail.MailDataRequired = {
    to,
    from: {
      email: env.SENDGRID_FROM_EMAIL,
      name: env.SENDGRID_FROM_NAME
    },
    subject,
    html
  }

  if (replyTo) {
    msg.replyTo = replyTo
  }

  const [response] = await sgMail.send(msg)
  console.log(`[Email] Sent to ${to}: ${response.statusCode}`)
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${env.VITE_APP_URL}/verify-email/${token}`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Welcome to Caderno</h1>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}"
         style="display: inline-block; padding: 12px 24px; background-color: #570df8; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
        Verify Email
      </a>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 24 hours.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #999; font-size: 12px;">
        If you didn't create a Caderno account, you can safely ignore this email.
      </p>
    </div>
  `

  await sendEmail({
    to: email,
    subject: 'Verify your Caderno account',
    html
  })
  console.log(`Verification email sent to ${email}`)
}

export async function sendSwitchTriggeredEmail(
  recipientEmail: string,
  recipientName: string,
  _switchId: number,
  message: string,
  senderEmail: string,
  payloadInfo?: { switchId: number; payloadKey: string }
): Promise<void> {
  // Build payload section if available
  let payloadSection = ''
  if (payloadInfo) {
    const unlockUrl = `${env.VITE_APP_URL}/unlock/${payloadInfo.switchId}#${payloadInfo.payloadKey}`
    payloadSection = `
      <div style="background-color: #e3f2fd; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #2196f3;">
        <h3 style="margin-top: 0; color: #1565c0;">
          📄 Journal Entries Available
        </h3>
        <p style="color: #333; margin-bottom: 16px;">
          The switch owner has included journal entries for you to access. Click the button below to download the PDF.
        </p>
        <a href="${unlockUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #2196f3; color: white; text-decoration: none; border-radius: 8px;">
          Download Journal PDF
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 12px; margin-bottom: 0;">
          Or copy this link: <a href="${unlockUrl}" style="word-break: break-all;">${unlockUrl}</a>
        </p>
      </div>
    `
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f44336; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Dead Man's Switch Activated</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear ${recipientName},</p>
        <p>
          A Dead Man's Switch has been triggered.
          This means the owner of this switch has not checked in within the specified time period.
        </p>

        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #333;">Message from the switch owner:</h3>
          <p style="white-space: pre-wrap; color: #333;">${message}</p>
        </div>

        ${payloadSection}

        <p style="color: #666; font-size: 14px;">
          This switch was created by: <strong>${senderEmail}</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

        <p style="color: #999; font-size: 12px;">
          This is an automated message from Caderno, a privacy-first journaling platform.
          The switch owner designated you as a recipient for this notification.
        </p>
      </div>
    </div>
  `

  await sendEmail({
    to: recipientEmail,
    subject: `[IMPORTANT] Dead Man's Switch Triggered`,
    html
  })
}

export interface SupportRequestData {
  category: string
  categoryLabel: string
  email: string
  subject: string
  message: string
  isUrgent: boolean
}

export async function sendSupportRequestEmail(data: SupportRequestData): Promise<void> {
  const { category, categoryLabel, email, subject, message, isUrgent } = data

  const urgentPrefix = isUrgent ? '[URGENT] ' : ''
  const urgentBadge = isUrgent
    ? '<span style="background-color: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">URGENT</span>'
    : ''

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${isUrgent ? '#f44336' : '#570df8'}; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Support Request${urgentBadge}</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666; width: 120px;">Category</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${categoryLabel}</strong> (${category})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">From</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Subject</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${subject}</strong></td>
          </tr>
        </table>

        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="margin-top: 0; color: #333;">Message</h3>
          <p style="white-space: pre-wrap; color: #333; margin-bottom: 0;">${message}</p>
        </div>

        <p style="color: #666; font-size: 12px; margin-bottom: 0;">
          Reply directly to this email to respond to the user.
        </p>
      </div>
      <div style="padding: 16px; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          Received at ${new Date().toISOString()} via Caderno Support Form
        </p>
      </div>
    </div>
  `

  try {
    await sendEmail({
      to: env.SUPPORT_EMAIL,
      subject: `${urgentPrefix}[Caderno Support] ${categoryLabel}: ${subject}`,
      html,
      replyTo: email
    })
    console.log(`Support request email sent from ${email}`)
  } catch (error) {
    console.error('Failed to send support request email:', error)
    throw error
  }
}
