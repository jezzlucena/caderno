import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, followers, following, publicEntries } from '../db/schema.js'
import { env } from '../config/env.js'
import { requireHttpSignature } from '../middleware/httpSignature.js'
import { signRequest, generateDigest } from '../services/httpSignature.service.js'
import { randomUUID } from 'crypto'

// ActivityPub activity validation schema
const activitySchema = z.object({
  '@context': z.union([z.string(), z.array(z.any())]),
  id: z.string().url().max(2000).optional(),
  type: z.string().min(1).max(50),
  actor: z.string().url().max(2000),
  object: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  target: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  to: z.array(z.string()).optional(),
  cc: z.array(z.string()).optional()
}).passthrough() // Allow additional ActivityPub fields

export const activityPubRouter: RouterType = Router()

// Content-Type for ActivityPub
const AP_CONTENT_TYPE = 'application/activity+json'
const AP_ACCEPT = 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"'

// Helper to build actor URL
function getActorUrl(username: string): string {
  return `${env.SERVER_URL}/users/${username}`
}

// Helper to build various URLs
function getInboxUrl(username: string): string {
  return `${env.SERVER_URL}/users/${username}/inbox`
}

function getOutboxUrl(username: string): string {
  return `${env.SERVER_URL}/users/${username}/outbox`
}

function getFollowersUrl(username: string): string {
  return `${env.SERVER_URL}/users/${username}/followers`
}

function getFollowingUrl(username: string): string {
  return `${env.SERVER_URL}/users/${username}/following`
}

// ============================================
// WebFinger - User Discovery
// ============================================

// GET /.well-known/webfinger?resource=acct:username@domain
activityPubRouter.get('/.well-known/webfinger', async (req, res) => {
  try {
    const resource = req.query.resource as string

    if (!resource) {
      res.status(400).json({ error: 'Missing resource parameter' })
      return
    }

    // Parse acct: URI
    const match = resource.match(/^acct:([^@]+)@(.+)$/)
    if (!match) {
      res.status(400).json({ error: 'Invalid resource format. Expected acct:username@domain' })
      return
    }

    const [, username, domain] = match

    // Verify domain matches this server
    if (domain !== env.FEDERATION_DOMAIN) {
      res.status(404).json({ error: 'User not found on this server' })
      return
    }

    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    })

    if (!user || !user.federationEnabled) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Return WebFinger response (JRD format)
    const webfingerResponse = {
      subject: `acct:${username}@${env.FEDERATION_DOMAIN}`,
      aliases: [
        getActorUrl(username)
      ],
      links: [
        {
          rel: 'self',
          type: AP_CONTENT_TYPE,
          href: getActorUrl(username)
        },
        {
          rel: 'http://webfinger.net/rel/profile-page',
          type: 'text/html',
          href: `${env.VITE_APP_URL}/user/${username}`
        },
        {
          // Caderno instance identifier - used to verify federation partners
          rel: 'https://caderno.app/ns/instance',
          type: 'application/json',
          href: `${env.SERVER_URL}/api/health`
        }
      ]
    }

    res.setHeader('Content-Type', 'application/jrd+json')
    res.json(webfingerResponse)
  } catch (error) {
    console.error('WebFinger error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// Actor - User Profile (ActivityPub)
// ============================================

// GET /users/:username - Actor endpoint
activityPubRouter.get('/users/:username', async (req, res) => {
  try {
    const { username } = req.params

    // Check Accept header for ActivityPub
    const accept = req.get('Accept') || ''
    const wantsActivityPub = accept.includes('application/activity+json') ||
                              accept.includes('application/ld+json')

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    })

    if (!user || !user.federationEnabled) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // If not requesting ActivityPub, redirect to profile page
    if (!wantsActivityPub) {
      res.redirect(`${env.VITE_APP_URL}/user/${username}`)
      return
    }

    // Return Actor object
    const actor = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1'
      ],
      id: getActorUrl(username),
      type: 'Person',
      preferredUsername: username,
      name: user.displayName || username,
      summary: user.bio || '',
      inbox: getInboxUrl(username),
      outbox: getOutboxUrl(username),
      followers: getFollowersUrl(username),
      following: getFollowingUrl(username),
      url: `${env.VITE_APP_URL}/user/${username}`,
      published: user.createdAt.toISOString(),
      // Public key for HTTP Signatures
      publicKey: user.publicKey ? {
        id: `${getActorUrl(username)}#main-key`,
        owner: getActorUrl(username),
        publicKeyPem: user.publicKey
      } : undefined,
      // Optional fields
      ...(user.avatarUrl && {
        icon: {
          type: 'Image',
          mediaType: 'image/png',
          url: user.avatarUrl
        }
      }),
      endpoints: {
        sharedInbox: `${env.SERVER_URL}/inbox`
      }
    }

    res.setHeader('Content-Type', AP_CONTENT_TYPE)
    res.json(actor)
  } catch (error) {
    console.error('Actor endpoint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// Outbox - Published Activities
// ============================================

// GET /users/:username/outbox - List published activities
activityPubRouter.get('/users/:username/outbox', async (req, res) => {
  try {
    const { username } = req.params
    const page = req.query.page === 'true'

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    })

    if (!user || !user.federationEnabled) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Get public entries count
    const entries = await db.query.publicEntries.findMany({
      where: eq(publicEntries.userId, user.id),
      orderBy: (entries, { desc }) => [desc(entries.published)]
    })

    const outboxUrl = getOutboxUrl(username)

    if (!page) {
      // Return OrderedCollection
      const collection = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: outboxUrl,
        type: 'OrderedCollection',
        totalItems: entries.length,
        first: `${outboxUrl}?page=true`,
        last: `${outboxUrl}?page=true`
      }

      res.setHeader('Content-Type', AP_CONTENT_TYPE)
      res.json(collection)
      return
    }

    // Return OrderedCollectionPage with activities
    const items = entries.map(entry => ({
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: entry.activityId,
      type: 'Create',
      actor: getActorUrl(username),
      published: entry.published.toISOString(),
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: [getFollowersUrl(username)],
      object: {
        id: `${env.SERVER_URL}/entries/${entry.id}`,
        type: 'Note',
        attributedTo: getActorUrl(username),
        content: `<h1>${escapeHtml(entry.title)}</h1>\n${markdownToHtml(entry.content)}`,
        published: entry.published.toISOString(),
        to: ['https://www.w3.org/ns/activitystreams#Public'],
        cc: [getFollowersUrl(username)]
      }
    }))

    const collectionPage = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${outboxUrl}?page=true`,
      type: 'OrderedCollectionPage',
      partOf: outboxUrl,
      totalItems: entries.length,
      orderedItems: items
    }

    res.setHeader('Content-Type', AP_CONTENT_TYPE)
    res.json(collectionPage)
  } catch (error) {
    console.error('Outbox endpoint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// Followers Collection
// ============================================

// GET /users/:username/followers
activityPubRouter.get('/users/:username/followers', async (req, res) => {
  try {
    const { username } = req.params

    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    })

    if (!user || !user.federationEnabled) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const followersList = await db.query.followers.findMany({
      where: eq(followers.userId, user.id)
    })

    const followersUrl = getFollowersUrl(username)

    const collection = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: followersUrl,
      type: 'OrderedCollection',
      totalItems: followersList.length,
      orderedItems: followersList.map(f => f.followerActorUrl)
    }

    res.setHeader('Content-Type', AP_CONTENT_TYPE)
    res.json(collection)
  } catch (error) {
    console.error('Followers endpoint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// Following Collection
// ============================================

// GET /users/:username/following
activityPubRouter.get('/users/:username/following', async (req, res) => {
  try {
    const { username } = req.params

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      with: {
        following: true
      }
    })

    if (!user || !user.federationEnabled) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const followingUrl = getFollowingUrl(username)

    const collection = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: followingUrl,
      type: 'OrderedCollection',
      totalItems: user.following?.length || 0,
      orderedItems: user.following?.map(f => f.targetActorUrl) || []
    }

    res.setHeader('Content-Type', AP_CONTENT_TYPE)
    res.json(collection)
  } catch (error) {
    console.error('Following endpoint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// Inbox - Receive Activities
// ============================================

// POST /users/:username/inbox - Receive activities (with HTTP Signature verification)
activityPubRouter.post('/users/:username/inbox', requireHttpSignature, async (req, res) => {
  try {
    const { username } = req.params
    const verifiedActor = (req as any).verifiedActor

    // Log incoming request details for debugging
    console.log(`[ActivityPub] Inbox request for ${username}`)
    console.log(`[ActivityPub] Content-Type: ${req.get('Content-Type')}`)
    console.log(`[ActivityPub] Body type: ${typeof req.body}`)
    console.log(`[ActivityPub] Body is null/undefined: ${req.body == null}`)

    // Check if body was parsed
    if (req.body === undefined || req.body === null) {
      console.error('[ActivityPub] Request body was not parsed!')
      console.error('[ActivityPub] This usually means the Content-Type is not recognized by Express JSON parser')
      console.error('[ActivityPub] Expected: application/activity+json, application/ld+json, or application/json')
      res.status(400).json({ error: 'Request body not parsed - check Content-Type header' })
      return
    }

    // Validate incoming activity
    const parseResult = activitySchema.safeParse(req.body)
    if (!parseResult.success) {
      console.warn('[ActivityPub] Invalid activity received:', parseResult.error.issues)
      console.warn('[ActivityPub] Raw body received:', JSON.stringify(req.body, null, 2))
      res.status(400).json({ error: 'Invalid activity format' })
      return
    }
    const activity = parseResult.data

    console.log(`[ActivityPub] Received verified activity for ${username} from ${verifiedActor?.actorUrl}:`, JSON.stringify(activity, null, 2))

    // Find user (include profileVisibility for follow request handling)
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: {
        id: true,
        username: true,
        publicKey: true,
        privateKey: true,
        federationEnabled: true,
        profileVisibility: true
      }
    })

    if (!user || !user.federationEnabled) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Handle different activity types
    switch (activity.type) {
      case 'Follow':
        await handleFollow(user, activity)
        break
      case 'Undo':
        // Check if object is an object (not string) with type 'Follow'
        if (typeof activity.object === 'object' && activity.object !== null && activity.object.type === 'Follow') {
          await handleUnfollow(user.id, activity)
        }
        break
      case 'Accept':
        // Handle accepted follow request - update our following status
        await handleAccept(user, activity)
        break
      case 'Reject':
        // Handle rejected follow request - remove our pending follow
        await handleReject(user, activity)
        break
      case 'Update':
        // Handle updated note from remote user
        console.log(`[ActivityPub] Received Update activity from ${activity.actor}`)
        // Remote feeds are fetched dynamically, so updates are handled on next fetch
        break
      case 'Delete':
        // Handle deleted note from remote user
        console.log(`[ActivityPub] Received Delete activity from ${activity.actor} for ${typeof activity.object === 'string' ? activity.object : activity.object?.id}`)
        // Remote feeds are fetched dynamically, so deletes are handled on next fetch
        break
      case 'Create':
        // Handle new note from remote user (usually delivered when following)
        console.log(`[ActivityPub] Received Create activity from ${activity.actor}`)
        // Remote feeds are fetched dynamically from outbox
        break
      default:
        console.log(`[ActivityPub] Unhandled activity type: ${activity.type}`)
    }

    res.status(202).json({ status: 'accepted' })
  } catch (error) {
    console.error('Inbox endpoint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /inbox - Shared inbox for all users (with HTTP Signature verification)
activityPubRouter.post('/inbox', requireHttpSignature, async (req, res) => {
  try {
    const verifiedActor = (req as any).verifiedActor

    // Validate incoming activity
    const parseResult = activitySchema.safeParse(req.body)
    if (!parseResult.success) {
      console.warn('[ActivityPub] Invalid activity received on shared inbox:', parseResult.error.issues)
      res.status(400).json({ error: 'Invalid activity format' })
      return
    }
    const activity = parseResult.data

    console.log(`[ActivityPub] Received verified activity on shared inbox from ${verifiedActor?.actorUrl}:`, JSON.stringify(activity, null, 2))

    // Route to appropriate user based on activity recipients
    // For now, just log the activity
    res.status(202).json({ status: 'accepted' })
  } catch (error) {
    console.error('Shared inbox error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// Activity Handlers
// ============================================

interface UserWithKeys {
  id: number
  username: string | null
  publicKey: string | null
  privateKey: string | null
  profileVisibility?: string
}

async function handleFollow(user: UserWithKeys, activity: any): Promise<void> {
  const followerActorUrl = activity.actor
  const followActivityId = activity.id

  // Fetch follower's actor to get their inbox
  let followerInbox = `${followerActorUrl}/inbox` // Default fallback
  let followerSharedInbox: string | undefined

  try {
    const actorResponse = await fetch(followerActorUrl, {
      headers: { Accept: AP_CONTENT_TYPE }
    })
    if (actorResponse.ok) {
      const actorData = await actorResponse.json()
      if (actorData.inbox) {
        followerInbox = actorData.inbox
      }
      if (actorData.endpoints?.sharedInbox) {
        followerSharedInbox = actorData.endpoints.sharedInbox
      }
    }
  } catch (error) {
    console.warn(`[ActivityPub] Could not fetch follower actor: ${followerActorUrl}`, error)
  }

  // For restricted profiles, require approval before accepting
  const autoAccept = user.profileVisibility === 'public'

  // Store the follower (pending approval if restricted profile)
  await db.insert(followers).values({
    userId: user.id,
    followerActorUrl,
    followerInbox,
    followerSharedInbox,
    accepted: autoAccept,
    followActivityId
  }).onConflictDoNothing()

  if (autoAccept) {
    console.log(`[ActivityPub] New follower (auto-accepted): ${followerActorUrl}`)
    // Send Accept activity back to follower
    if (user.privateKey && user.username) {
      await sendAcceptActivity(user, followerActorUrl, followerInbox, activity)
    }
  } else {
    console.log(`[ActivityPub] New follow request (pending approval): ${followerActorUrl}`)
    // Don't send Accept yet - wait for user approval
  }
}

async function handleUnfollow(userId: number, activity: any): Promise<void> {
  const followerActorUrl = activity.actor

  await db.delete(followers)
    .where(eq(followers.followerActorUrl, followerActorUrl))

  console.log(`[ActivityPub] Unfollowed by: ${followerActorUrl}`)
}

/**
 * Handle an Accept activity - our follow request was accepted
 * The Accept's object contains the original Follow activity we sent
 */
async function handleAccept(user: UserWithKeys, activity: any): Promise<void> {
  const acceptingActor = activity.actor // The remote user who accepted our follow

  // The object should be the original Follow activity
  const followObject = activity.object

  // Extract the actor who sent the original Follow (should be a local user)
  let originalFollowActor: string | undefined
  if (typeof followObject === 'object' && followObject !== null) {
    originalFollowActor = followObject.actor
  } else if (typeof followObject === 'string') {
    // Sometimes the object is just the Follow activity ID
    console.log(`[ActivityPub] Accept object is a string (activity ID): ${followObject}`)
  }

  console.log(`[ActivityPub] Follow request accepted by ${acceptingActor}`)
  console.log(`[ActivityPub] Original follow actor: ${originalFollowActor}`)

  // Find the local user who sent the follow request
  // The original follow actor should be a local user URL like https://our-server/users/username
  const localUserMatch = originalFollowActor?.match(new RegExp(`^${env.SERVER_URL}/users/([^/]+)$`))

  if (localUserMatch) {
    const localUsername = localUserMatch[1]

    // Find the local user
    const localUser = await db.query.users.findFirst({
      where: eq(users.username, localUsername)
    })

    if (localUser) {
      // Update the following record to mark it as accepted (not pending)
      const result = await db.update(following)
        .set({ pending: false })
        .where(and(
          eq(following.userId, localUser.id),
          eq(following.targetActorUrl, acceptingActor)
        ))

      console.log(`[ActivityPub] Updated follow status for ${localUsername} -> ${acceptingActor} to accepted`)
    } else {
      console.warn(`[ActivityPub] Could not find local user ${localUsername} to update follow status`)
    }
  } else {
    // Fallback: try to find any pending follow to this actor and accept it
    // This handles cases where the Accept doesn't include full Follow object
    console.log(`[ActivityPub] Trying fallback: finding any pending follow to ${acceptingActor}`)

    const result = await db.update(following)
      .set({ pending: false })
      .where(and(
        eq(following.targetActorUrl, acceptingActor),
        eq(following.pending, true)
      ))

    console.log(`[ActivityPub] Fallback: Updated pending follows to ${acceptingActor}`)
  }
}

/**
 * Handle a Reject activity - our follow request was rejected
 */
async function handleReject(user: UserWithKeys, activity: any): Promise<void> {
  const rejectingActor = activity.actor
  const followObject = activity.object

  let originalFollowActor: string | undefined
  if (typeof followObject === 'object' && followObject !== null) {
    originalFollowActor = followObject.actor
  }

  console.log(`[ActivityPub] Follow request rejected by ${rejectingActor}`)

  // Find the local user who sent the follow request
  const localUserMatch = originalFollowActor?.match(new RegExp(`^${env.SERVER_URL}/users/([^/]+)$`))

  if (localUserMatch) {
    const localUsername = localUserMatch[1]

    const localUser = await db.query.users.findFirst({
      where: eq(users.username, localUsername)
    })

    if (localUser) {
      // Remove the rejected follow
      await db.delete(following)
        .where(and(
          eq(following.userId, localUser.id),
          eq(following.targetActorUrl, rejectingActor)
        ))

      console.log(`[ActivityPub] Removed rejected follow for ${localUsername} -> ${rejectingActor}`)
    }
  } else {
    // Fallback: remove any pending follow to this actor
    await db.delete(following)
      .where(and(
        eq(following.targetActorUrl, rejectingActor),
        eq(following.pending, true)
      ))

    console.log(`[ActivityPub] Fallback: Removed pending follows to ${rejectingActor}`)
  }
}

// ============================================
// Activity Delivery (with HTTP Signatures)
// ============================================

/**
 * Send a signed Accept activity in response to a Follow request
 */
export async function sendAcceptActivity(
  user: UserWithKeys,
  followerActorUrl: string,
  followerInbox: string,
  originalActivity: any
): Promise<boolean> {
  if (!user.username || !user.privateKey) {
    console.warn('[ActivityPub] Cannot send Accept: missing username or private key')
    return false
  }

  const actorUrl = getActorUrl(user.username)
  const acceptActivity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${env.SERVER_URL}/activities/${randomUUID()}`,
    type: 'Accept',
    actor: actorUrl,
    object: originalActivity
  }

  return await deliverActivity(user, followerInbox, acceptActivity)
}

/**
 * Send a signed Reject activity in response to a Follow request
 */
export async function sendRejectActivity(
  user: UserWithKeys,
  followerActorUrl: string,
  followerInbox: string,
  originalActivity: any
): Promise<boolean> {
  if (!user.username || !user.privateKey) {
    console.warn('[ActivityPub] Cannot send Reject: missing username or private key')
    return false
  }

  const actorUrl = getActorUrl(user.username)
  const rejectActivity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${env.SERVER_URL}/activities/${randomUUID()}`,
    type: 'Reject',
    actor: actorUrl,
    object: originalActivity
  }

  return await deliverActivity(user, followerInbox, rejectActivity)
}

/**
 * Deliver an activity to a remote inbox with HTTP Signature
 */
export async function deliverActivity(
  user: UserWithKeys,
  inboxUrl: string,
  activity: any
): Promise<boolean> {
  if (!user.username || !user.privateKey) {
    console.warn('[ActivityPub] Cannot deliver activity: missing username or private key')
    return false
  }

  try {
    const url = new URL(inboxUrl)
    const body = JSON.stringify(activity)

    // Sign the request
    const signedHeaders = signRequest({
      keyId: `${getActorUrl(user.username)}#main-key`,
      privateKey: user.privateKey,
      method: 'POST',
      path: url.pathname,
      host: url.host,
      body
    })

    const activityType = activity?.type || 'Unknown'
    console.log(`[ActivityPub] Delivering ${activityType} activity to ${inboxUrl}`)
    console.log(`[ActivityPub] Activity payload:`, JSON.stringify(activity, null, 2))

    const headers = {
      ...signedHeaders,
      'Content-Type': AP_CONTENT_TYPE,
      Accept: AP_CONTENT_TYPE
    }

    const response = await fetch(inboxUrl, {
      method: 'POST',
      headers,
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[ActivityPub] Delivery failed (${response.status}): ${errorText}`)
      console.error(`[ActivityPub] Failed activity type: ${activityType}`)
      console.error(`[ActivityPub] Failed activity payload:`, JSON.stringify(activity, null, 2))
      console.error(`[ActivityPub] Request headers:`, JSON.stringify(headers, null, 2))
      return false
    }

    console.log(`[ActivityPub] ${activityType} activity delivered successfully to ${inboxUrl}`)
    return true
  } catch (error) {
    console.error(`[ActivityPub] Delivery error to ${inboxUrl}:`, error)
    console.error(`[ActivityPub] Failed activity:`, JSON.stringify(activity, null, 2))
    return false
  }
}

/**
 * Deliver an activity to all accepted followers only
 */
export async function deliverToFollowers(user: UserWithKeys, activity: any): Promise<void> {
  const followersList = await db.query.followers.findMany({
    where: and(
      eq(followers.userId, user.id),
      eq(followers.accepted, true)
    )
  })

  console.log(`[ActivityPub] Delivering activity to ${followersList.length} accepted followers`)

  // Deliver to each follower's inbox (in parallel with some concurrency limit)
  const deliveryPromises = followersList.map(follower =>
    deliverActivity(user, follower.followerInbox, activity)
  )

  const results = await Promise.allSettled(deliveryPromises)
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length
  console.log(`[ActivityPub] Delivered to ${successful}/${followersList.length} followers`)
}

// ============================================
// Helper Functions
// ============================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  // In production, use a proper library like marked
  return markdown
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}
