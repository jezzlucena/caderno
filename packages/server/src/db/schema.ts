import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  keySalt: text('key_salt').notNull(),
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
  profilePublic: boolean('profile_public').default(false).notNull(),         // Public profile visibility
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
  timerDays: integer('timer_days').notNull().default(7), // Days before trigger if no check-in
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

// Public entries - entries published via ActivityPub (plaintext, opt-in)
export const publicEntries = pgTable('public_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entryId: integer('entry_id').references(() => entries.id, { onDelete: 'set null' }), // Link to original encrypted entry (optional)
  title: text('title').notNull(),                           // Plaintext title (user chose to publish)
  content: text('content').notNull(),                       // Plaintext content (user chose to publish)
  activityId: text('activity_id').notNull().unique(),       // ActivityPub activity ID (URL)
  published: timestamp('published').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Relations for easier querying
export const usersRelations = relations(users, ({ many }) => ({
  entries: many(entries),
  publicEntries: many(publicEntries),
  followers: many(followers),
  following: many(following),
  switches: many(deadManSwitches)
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
export type PublicEntry = typeof publicEntries.$inferSelect
export type NewPublicEntry = typeof publicEntries.$inferInsert
