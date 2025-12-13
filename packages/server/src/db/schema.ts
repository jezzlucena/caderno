import { pgTable, serial, text, timestamp, boolean, integer, bigint, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  keySalt: text('key_salt').notNull(),
  role: text('role').default('user').notNull(), // 'admin' | 'moderator' | 'user'
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpires: timestamp('email_verification_expires'),
  // ActivityPub federation fields
  username: text('username').unique(),                      // Unique handle for federation (@username@domain)
  displayName: text('display_name'),                        // Public display name
  bio: text('bio'),                                         // Public biography/summary
  avatarUrl: text('avatar_url'),                            // Public avatar URL
  publicKey: text('public_key'),                            // RSA public key for HTTP Signatures
  privateKey: text('private_key'),                          // RSA private key for signing requests
  federationEnabled: boolean('federation_enabled').default(false).notNull(), // Opt-in to federation
  profileVisibility: text('profile_visibility').default('private').notNull(), // 'public' | 'restricted' | 'private'
  // Moderation fields
  bannedOn: timestamp('banned_on'),                            // Timestamp when user was permanently banned (null = not banned)
  suspendedUntil: timestamp('suspended_until'),                // Timestamp when temporary suspension expires (null = not suspended)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // All content is E2EE encrypted client-side
  encryptedTitle: text('encrypted_title').notNull(),    // Encrypted title
  encryptedContent: text('encrypted_content').notNull(), // Encrypted markdown content
  iv: text('iv').notNull(),                              // Initialization vector for AES-GCM
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Dead Man's Switch - the safety mechanism
export const deadManSwitches = pgTable('dead_man_switches', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // E2EE encrypted name (client-side encryption)
  encryptedName: text('encrypted_name').notNull(),       // Encrypted name/description of the switch
  iv: text('iv').notNull(),                              // Initialization vector for AES-GCM
  timerMs: bigint('timer_ms', { mode: 'number' }).notNull().default(604800000), // Milliseconds before trigger if no check-in (default 7 days)
  lastCheckIn: timestamp('last_check_in').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  // Message sent to recipients when triggered (plaintext - user composes this)
  triggerMessage: text('trigger_message'),
  // For entry sharing: encrypted PDF payload (encrypted with payloadKey)
  encryptedPayload: text('encrypted_payload'),           // Optional: encrypted PDF for release
  payloadIv: text('payload_iv'),                         // IV for the encrypted payload
  payloadKey: text('payload_key'),                       // Encryption key for payload (sent in trigger email)
  hasTriggered: boolean('has_triggered').default(false).notNull(),
  triggeredAt: timestamp('triggered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Recipients who receive notification when switch triggers
export const switchRecipients = pgTable('switch_recipients', {
  id: serial('id').primaryKey(),
  switchId: integer('switch_id').notNull().references(() => deadManSwitches.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name'),                                    // Optional display name
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// ActivityPub Followers - tracks follow relationships
export const followers = pgTable('followers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followerActorUrl: text('follower_actor_url').notNull(),   // Full ActivityPub actor URL of follower
  followerInbox: text('follower_inbox').notNull(),          // Inbox URL for delivering activities
  followerSharedInbox: text('follower_shared_inbox'),       // Shared inbox (optional, for efficiency)
  accepted: boolean('accepted').default(true).notNull(),    // Whether follow was accepted
  followActivityId: text('follow_activity_id'),             // Original Follow activity ID for Accept response
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// ActivityPub Following - users this user follows
export const following = pgTable('following', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetActorUrl: text('target_actor_url').notNull(),       // Full ActivityPub actor URL being followed
  pending: boolean('pending').default(true).notNull(),      // Waiting for Accept
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Local Followers - for non-federated following within the same instance
export const localFollowers = pgTable('local_followers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),        // User being followed
  followerId: integer('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // User doing the following
  accepted: boolean('accepted').default(false).notNull(),   // Pending vs approved (for restricted profiles)
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueFollow: unique().on(table.userId, table.followerId)
}))

// Public entries - entries published via ActivityPub (plaintext, opt-in)
// Visibility: 'public' = visible to everyone, 'followers' = only followers, 'private' = only the author
export const publicEntries = pgTable('public_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entryId: integer('entry_id').references(() => entries.id, { onDelete: 'set null' }), // Link to original encrypted entry (optional)
  title: text('title').notNull(),                           // Plaintext title (user chose to publish)
  content: text('content').notNull(),                       // Plaintext content (user chose to publish)
  visibility: text('visibility').default('public').notNull(), // 'public' | 'followers' | 'private'
  activityId: text('activity_id').notNull().unique(),       // ActivityPub activity ID (URL)
  published: timestamp('published').defaultNow().notNull(),
  bannedOn: timestamp('banned_on'),                         // When note was banned/removed (null = not banned)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Relations for easier querying
export const usersRelations = relations(users, ({ many }) => ({
  entries: many(entries),
  publicEntries: many(publicEntries),
  followers: many(followers),
  following: many(following),
  localFollowers: many(localFollowers, { relationName: 'userFollowers' }),
  localFollowing: many(localFollowers, { relationName: 'userFollowing' }),
  switches: many(deadManSwitches),
  notifications: many(notifications, { relationName: 'userNotifications' }),
  actedNotifications: many(notifications, { relationName: 'actorNotifications' }),
  passkeys: many(passkeys)
}))

export const deadManSwitchesRelations = relations(deadManSwitches, ({ one, many }) => ({
  user: one(users, {
    fields: [deadManSwitches.userId],
    references: [users.id]
  }),
  recipients: many(switchRecipients)
}))

export const switchRecipientsRelations = relations(switchRecipients, ({ one }) => ({
  switch: one(deadManSwitches, {
    fields: [switchRecipients.switchId],
    references: [deadManSwitches.id]
  })
}))

export const followersRelations = relations(followers, ({ one }) => ({
  user: one(users, {
    fields: [followers.userId],
    references: [users.id]
  })
}))

export const followingRelations = relations(following, ({ one }) => ({
  user: one(users, {
    fields: [following.userId],
    references: [users.id]
  })
}))

export const localFollowersRelations = relations(localFollowers, ({ one }) => ({
  user: one(users, {
    fields: [localFollowers.userId],
    references: [users.id],
    relationName: 'userFollowers'
  }),
  follower: one(users, {
    fields: [localFollowers.followerId],
    references: [users.id],
    relationName: 'userFollowing'
  })
}))

export const publicEntriesRelations = relations(publicEntries, ({ one }) => ({
  user: one(users, {
    fields: [publicEntries.userId],
    references: [users.id]
  }),
  entry: one(entries, {
    fields: [publicEntries.entryId],
    references: [entries.id]
  })
}))

// Platform Settings - global configuration for the instance (single row)
export const platformSettings = pgTable('platform_settings', {
  id: serial('id').primaryKey(),
  displayName: text('display_name').default('Caderno').notNull(),  // Platform display name (up to 30 chars)
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Notifications - user notifications for follows, posts, etc.
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // Recipient
  type: text('type').notNull(), // 'new_post' | 'follow_request' | 'follow_accepted'
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'cascade' }), // Local user who triggered it
  actorActorUrl: text('actor_actor_url'), // For remote ActivityPub actors
  referenceId: integer('reference_id'), // ID of related entity (publicEntry.id, localFollower.id, etc.)
  referenceType: text('reference_type'), // 'public_entry' | 'local_follower' | 'remote_follower'
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: 'userNotifications'
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: 'actorNotifications'
  })
}))

// Passkeys - WebAuthn credentials for passwordless authentication
export const passkeys = pgTable('passkeys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(), // Base64URL encoded credential ID
  publicKey: text('public_key').notNull(), // Base64URL encoded public key
  counter: bigint('counter', { mode: 'number' }).notNull().default(0), // Signature counter for replay attack prevention
  deviceType: text('device_type').notNull(), // 'singleDevice' | 'multiDevice'
  backedUp: boolean('backed_up').notNull().default(false), // Whether credential is backed up
  transports: text('transports'), // JSON array of transports (usb, ble, nfc, internal, etc.)
  name: text('name'), // User-provided name for the passkey
  // PRF extension support for E2EE key derivation
  prfSupported: boolean('prf_supported').default(false).notNull(), // Whether passkey supports PRF extension
  prfSalt: text('prf_salt'), // Salt used for PRF evaluation (base64url)
  encryptedMasterKey: text('encrypted_master_key'), // User's master encryption key encrypted with PRF-derived key
  masterKeyIv: text('master_key_iv'), // IV for master key encryption
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at')
})

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, {
    fields: [passkeys.userId],
    references: [users.id]
  })
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Entry = typeof entries.$inferSelect
export type NewEntry = typeof entries.$inferInsert
export type DeadManSwitch = typeof deadManSwitches.$inferSelect
export type NewDeadManSwitch = typeof deadManSwitches.$inferInsert
export type SwitchRecipient = typeof switchRecipients.$inferSelect
export type NewSwitchRecipient = typeof switchRecipients.$inferInsert
export type Follower = typeof followers.$inferSelect
export type NewFollower = typeof followers.$inferInsert
export type Following = typeof following.$inferSelect
export type NewFollowing = typeof following.$inferInsert
export type LocalFollower = typeof localFollowers.$inferSelect
export type NewLocalFollower = typeof localFollowers.$inferInsert
export type PublicEntry = typeof publicEntries.$inferSelect
export type NewPublicEntry = typeof publicEntries.$inferInsert
export type PlatformSettings = typeof platformSettings.$inferSelect
export type NewPlatformSettings = typeof platformSettings.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type Passkey = typeof passkeys.$inferSelect
export type NewPasskey = typeof passkeys.$inferInsert
