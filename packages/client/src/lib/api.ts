const API_BASE = '/api'

interface ApiOptions {
  method?: string
  body?: unknown
  token?: string | null
}

export interface ApiErrorData {
  accountStatus?: 'banned' | 'suspended'
  bannedOn?: string
  suspendedUntil?: string
}

export class ApiError extends Error {
  public data?: ApiErrorData

  constructor(public status: number, message: string, data?: ApiErrorData) {
    super(message)
    this.name = 'ApiError'
    this.data = data
  }
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await response.json()

  if (!response.ok) {
    const errorData: ApiErrorData = {}
    if (data.accountStatus) errorData.accountStatus = data.accountStatus
    if (data.bannedOn) errorData.bannedOn = data.bannedOn
    if (data.suspendedUntil) errorData.suspendedUntil = data.suspendedUntil
    throw new ApiError(response.status, data.error || 'Request failed', errorData)
  }

  return data
}

// Auth API functions
export interface User {
  id: number
  email: string
  emailVerified: boolean
  keySalt: string
  role: 'admin' | 'moderator' | 'user'
  username: string | null
  profileVisibility: 'public' | 'restricted' | 'private'
  theme: 'light' | 'dark' | 'system'
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface UpdateProfileData {
  username?: string
  profileVisibility?: 'public' | 'restricted' | 'private'
  theme?: 'light' | 'dark' | 'system'
  displayName?: string | null
  bio?: string | null
}

export const authApi = {
  register: (email: string, password: string, username: string, profileVisibility: 'public' | 'restricted' | 'private') =>
    api<AuthResponse>('/auth/register', { method: 'POST', body: { email, password, username, profileVisibility } }),

  login: (emailOrUsername: string, password: string) =>
    api<AuthResponse>('/auth/login', { method: 'POST', body: { emailOrUsername, password } }),

  verifyEmail: (token: string) =>
    api<{ message: string }>(`/auth/verify-email/${token}`),

  me: (token: string) =>
    api<{ user: User }>('/auth/me', { token }),

  updateProfile: (data: UpdateProfileData) =>
    api<{ user: User; message: string }>('/auth/profile', { method: 'PUT', body: data, token: getAuthToken() }),

  checkUsername: (username: string) =>
    api<{ available: boolean; reason?: string }>(`/auth/check-username/${username}`, { token: getAuthToken() }),

  checkUsernamePublic: (username: string) =>
    api<{ available: boolean; reason?: string }>(`/auth/username-available/${username}`),

  checkEmail: (email: string) =>
    api<{ available: boolean; reason?: string }>(`/auth/check-email/${encodeURIComponent(email)}`, { token: getAuthToken() }),

  updateEmail: (email: string) =>
    api<{ user: User; message: string }>('/auth/email', { method: 'PUT', body: { email }, token: getAuthToken() }),

  resendVerificationEmail: () =>
    api<{ message: string }>('/auth/resend-verification', { method: 'POST', token: getAuthToken() }),

  verifyPassword: (password: string) =>
    api<{ valid: boolean }>('/auth/verify-password', { method: 'POST', body: { password }, token: getAuthToken() })
}

// Entries API
export interface Entry {
  id: number
  userId: number
  encryptedTitle: string
  encryptedContent: string
  iv: string
  createdAt: string
  updatedAt: string
}

interface CreateEntryData {
  encryptedTitle: string
  encryptedContent: string
  iv: string
}

interface ImportEntryData {
  encryptedTitle: string
  encryptedContent: string
  iv: string
  createdAt: string
  updatedAt: string
}

// Helper to get token from auth store
function getAuthToken(): string | null {
  const stored = localStorage.getItem('caderno-auth')
  if (!stored) return null
  try {
    const { state } = JSON.parse(stored)
    return state?.token || null
  } catch {
    return null
  }
}

export const entriesApi = {
  list: () =>
    api<{ entries: Entry[] }>('/entries', { token: getAuthToken() }),

  get: (id: number) =>
    api<{ entry: Entry }>(`/entries/${id}`, { token: getAuthToken() }),

  create: (data: CreateEntryData) =>
    api<{ entry: Entry }>('/entries', { method: 'POST', body: data, token: getAuthToken() }),

  import: (data: ImportEntryData) =>
    api<{ entry: Entry }>('/entries/import', { method: 'POST', body: data, token: getAuthToken() }),

  update: (id: number, data: CreateEntryData) =>
    api<{ entry: Entry }>(`/entries/${id}`, { method: 'PUT', body: data, token: getAuthToken() }),

  delete: (id: number) =>
    api<{ message: string }>(`/entries/${id}`, { method: 'DELETE', token: getAuthToken() })
}

// Dead Man's Switch API
export interface SwitchRecipient {
  id: number
  switchId: number
  email: string
  name: string | null
  createdAt: string
}

export interface DeadManSwitch {
  id: number
  userId: number
  // E2EE encrypted name fields
  encryptedName: string
  iv: string
  timerMs: number
  lastCheckIn: string
  isActive: boolean
  triggerMessage: string | null
  encryptedPayload: string | null
  payloadIv: string | null
  hasPayload: boolean
  hasTriggered: boolean
  triggeredAt: string | null
  createdAt: string
  updatedAt: string
  recipients: SwitchRecipient[]
}

interface CreateSwitchData {
  // E2EE encrypted name fields
  encryptedName: string
  iv: string
  timerMs: number
  triggerMessage?: string
  recipients: { email: string; name?: string }[]
  encryptedPayload?: string
  payloadIv?: string
  payloadKey?: string
}

interface UpdateSwitchData {
  // E2EE encrypted name fields (must be provided together)
  encryptedName?: string
  iv?: string
  timerMs?: number
  triggerMessage?: string
  isActive?: boolean
  recipients?: { email: string; name?: string }[]
}

export const switchesApi = {
  list: () =>
    api<{ switches: DeadManSwitch[] }>('/switches', { token: getAuthToken() }),

  get: (id: number) =>
    api<{ switch: DeadManSwitch }>(`/switches/${id}`, { token: getAuthToken() }),

  create: (data: CreateSwitchData) =>
    api<{ switch: DeadManSwitch }>('/switches', { method: 'POST', body: data, token: getAuthToken() }),

  update: (id: number, data: UpdateSwitchData) =>
    api<{ switch: DeadManSwitch }>(`/switches/${id}`, { method: 'PUT', body: data, token: getAuthToken() }),

  delete: (id: number) =>
    api<{ message: string }>(`/switches/${id}`, { method: 'DELETE', token: getAuthToken() }),

  checkIn: (id: number) =>
    api<{ switch: DeadManSwitch; message: string; nextDeadline: string }>(
      `/switches/${id}/check-in`,
      { method: 'POST', token: getAuthToken() }
    ),

  checkInAll: () =>
    api<{ message: string; switches: DeadManSwitch[] }>(
      '/switches/check-in-all',
      { method: 'POST', token: getAuthToken() }
    )
}

// Federation API
export interface FederationProfile {
  username: string | null
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  federationEnabled: boolean
  hasKeys: boolean
  actorUrl: string | null
  handle: string | null
  followerCount: number
  followingCount: number
}

export type NoteVisibility = 'public' | 'followers' | 'private'

export interface PublicEntry {
  id: number
  title: string
  content: string
  visibility: NoteVisibility
  activityId: string
  published: string
}

export interface FeedEntry {
  id: string
  title: string
  content: string
  visibility: NoteVisibility
  published: string
  author: {
    username: string
    displayName: string | null
    actorUrl: string
    isLocal: boolean
    isOwnPost?: boolean
  }
}

export interface PaginatedFeedResponse {
  entries: FeedEntry[]
  nextCursor: string | null
  hasMore: boolean
}

interface UpdateFederationProfile {
  federationEnabled?: boolean
}

interface PublishEntryData {
  title: string
  content: string
  visibility?: NoteVisibility
}

interface UpdateNoteData {
  title?: string
  content?: string
  visibility?: NoteVisibility
}

export const federationApi = {
  getProfile: () =>
    api<{ profile: FederationProfile }>('/federation/profile', { token: getAuthToken() }),

  setup: () =>
    api<{ message: string; profile: FederationProfile }>(
      '/federation/setup',
      { method: 'POST', token: getAuthToken() }
    ),

  updateProfile: (data: UpdateFederationProfile) =>
    api<{ message: string }>(
      '/federation/profile',
      { method: 'PUT', body: data, token: getAuthToken() }
    ),

  publish: (data: PublishEntryData) =>
    api<{ message: string; entry: PublicEntry }>(
      '/federation/publish',
      { method: 'POST', body: data, token: getAuthToken() }
    ),

  getPublished: () =>
    api<{ entries: PublicEntry[] }>('/federation/published', { token: getAuthToken() }),

  updateNote: (id: number, data: UpdateNoteData) =>
    api<{ message: string; entry: PublicEntry }>(
      `/federation/published/${id}`,
      { method: 'PUT', body: data, token: getAuthToken() }
    ),

  unpublish: (id: number) =>
    api<{ message: string }>(
      `/federation/published/${id}`,
      { method: 'DELETE', token: getAuthToken() }
    ),

  getFollowers: () =>
    api<{ followers: { actorUrl: string; since: string }[] }>(
      '/federation/followers',
      { token: getAuthToken() }
    ),

  getFollowing: () =>
    api<{ following: { actorUrl: string; pending: boolean; since: string }[] }>(
      '/federation/following',
      { token: getAuthToken() }
    ),

  follow: (handle: string) =>
    api<{ message: string; following: { actorUrl: string; pending: boolean; displayName: string | null; username: string } }>(
      '/federation/follow',
      { method: 'POST', body: { handle }, token: getAuthToken() }
    ),

  unfollow: (actorUrl: string) =>
    api<{ message: string }>(
      `/federation/follow?actorUrl=${encodeURIComponent(actorUrl)}`,
      { method: 'DELETE', token: getAuthToken() }
    ),

  lookup: (handle: string) =>
    api<{ user: { actorUrl: string; username: string; displayName: string | null; bio: string | null; isLocal: boolean } }>(
      `/federation/lookup?handle=${encodeURIComponent(handle)}`,
      { token: getAuthToken() }
    ),

  getFeed: (cursor?: string, limit?: number) => {
    const params = new URLSearchParams()
    if (cursor) params.append('cursor', cursor)
    if (limit) params.append('limit', limit.toString())
    const queryString = params.toString()
    return api<PaginatedFeedResponse>(
      `/federation/feed${queryString ? `?${queryString}` : ''}`,
      { token: getAuthToken() }
    )
  }
}

// Profile API
export interface PublicProfile {
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  entryCount: number | null
  switchCount: number | null
  createdAt: string
  isOwnProfile: boolean
  profileVisibility: 'public' | 'restricted' | 'private'
  isFollowing: boolean
  isFollowPending: boolean
  isRestricted: boolean
}

export interface FollowRequest {
  id: number
  type: 'local' | 'remote'
  follower: {
    id: number | null
    username: string | null
    displayName: string | null
    avatarUrl: string | null
    actorUrl: string | null
  }
  createdAt: string
}

export interface ProfileNote {
  id: number
  title: string
  content: string
  visibility: NoteVisibility
  published: string
}

export interface ProfileNotesResponse {
  notes: ProfileNote[]
  isOwner: boolean
  isFollower: boolean
}

export interface SingleNoteResponse {
  note: ProfileNote
  author: {
    username: string
    displayName: string | null
  }
  isOwner: boolean
}

export const profileApi = {
  getPublicProfile: (username: string) =>
    api<PublicProfile>(`/profile/${username}`, { token: getAuthToken() }),

  getNotes: (username: string) =>
    api<ProfileNotesResponse>(`/profile/${username}/notes`, { token: getAuthToken() }),

  getNote: (username: string, noteId: number) =>
    api<SingleNoteResponse>(`/profile/${username}/notes/${noteId}`, { token: getAuthToken() }),

  follow: (username: string) =>
    api<{ message: string; status: 'following' | 'pending' }>(`/profile/${username}/follow`, { method: 'POST', token: getAuthToken() }),

  unfollow: (username: string) =>
    api<{ message: string }>(`/profile/${username}/follow`, { method: 'DELETE', token: getAuthToken() }),

  getFollowRequests: () =>
    api<{ requests: FollowRequest[] }>('/profile/follow-requests', { token: getAuthToken() }),

  acceptFollowRequest: (id: number, type: 'local' | 'remote' = 'local') =>
    api<{ message: string }>(`/profile/follow-requests/${id}/accept?type=${type}`, { method: 'POST', token: getAuthToken() }),

  rejectFollowRequest: (id: number, type: 'local' | 'remote' = 'local') =>
    api<{ message: string }>(`/profile/follow-requests/${id}/reject?type=${type}`, { method: 'POST', token: getAuthToken() })
}

// Support API
export interface SupportRequestData {
  category: 'security' | 'privacy' | 'harassment' | 'threat' | 'account' | 'bug' | 'feature' | 'other'
  email: string
  subject: string
  message: string
  isUrgent: boolean
}

export const supportApi = {
  submit: (data: SupportRequestData) =>
    api<{ message: string }>('/support', { method: 'POST', body: data })
}

// Admin API
export interface BannedNote {
  id: number
  title: string
  content: string
  bannedOn: string | null
  published: string | null
  userId: number
  author: {
    username: string | null
    displayName: string | null
    email: string
  }
}

export interface ModerationUser {
  id: number
  username: string | null
  email: string
  displayName: string | null
  role: 'admin' | 'moderator' | 'user'
  bannedOn: string | null
  suspendedUntil: string | null
  createdAt: string
}

// Platform API (public)
export interface PlatformSettingsData {
  displayName: string
}

export const platformApi = {
  getSettings: () =>
    api<PlatformSettingsData>('/platform'),

  updateSettings: (displayName: string) =>
    api<{ message: string; displayName: string }>('/admin/platform', {
      method: 'PUT',
      body: { displayName },
      token: getAuthToken()
    })
}

export const adminApi = {
  // Notes
  getBannedNotes: () =>
    api<{ notes: BannedNote[] }>('/admin/notes/banned', { token: getAuthToken() }),

  banNote: (id: number) =>
    api<{ message: string }>(`/admin/notes/${id}/ban`, { method: 'POST', token: getAuthToken() }),

  unbanNote: (id: number) =>
    api<{ message: string }>(`/admin/notes/${id}/unban`, { method: 'POST', token: getAuthToken() }),

  // Users
  getBannedUsers: () =>
    api<{ users: ModerationUser[] }>('/admin/users/banned', { token: getAuthToken() }),

  getSuspendedUsers: () =>
    api<{ users: ModerationUser[] }>('/admin/users/suspended', { token: getAuthToken() }),

  searchUser: (query: string) =>
    api<{ user: ModerationUser | null }>(`/admin/users/search?q=${encodeURIComponent(query)}`, { token: getAuthToken() }),

  banUser: (identifier: string) =>
    api<{ message: string }>('/admin/users/ban', { method: 'POST', body: { identifier }, token: getAuthToken() }),

  unbanUser: (identifier: string) =>
    api<{ message: string }>('/admin/users/unban', { method: 'POST', body: { identifier }, token: getAuthToken() }),

  suspendUser: (identifier: string, suspendedUntil: string) =>
    api<{ message: string }>('/admin/users/suspend', { method: 'POST', body: { identifier, suspendedUntil }, token: getAuthToken() }),

  unsuspendUser: (identifier: string) =>
    api<{ message: string }>('/admin/users/unsuspend', { method: 'POST', body: { identifier }, token: getAuthToken() })
}

// Setup API (for initial admin creation)
export interface SetupStatus {
  needsSetup: boolean
}

export const setupApi = {
  getStatus: () =>
    api<SetupStatus>('/setup/status'),

  createAdmin: (email: string, password: string, username: string) =>
    api<AuthResponse>('/setup/admin', { method: 'POST', body: { email, password, username } })
}

// Notifications API
export type NotificationType = 'new_post' | 'follow_request' | 'follow_accepted'

export interface NotificationActor {
  id: number
  username: string | null
  displayName: string | null
  avatarUrl: string | null
}

export interface Notification {
  id: number
  type: NotificationType
  isRead: boolean
  createdAt: string
  referenceId: number | null
  referenceType: 'public_entry' | 'local_follower' | 'remote_follower' | null
  actorActorUrl: string | null
  actor: NotificationActor | null
}

export interface NotificationListResponse {
  notifications: Notification[]
  nextCursor: string | null
  hasMore: boolean
}

export const notificationApi = {
  list: (cursor?: string, limit?: number) => {
    const params = new URLSearchParams()
    if (cursor) params.append('cursor', cursor)
    if (limit) params.append('limit', limit.toString())
    const queryString = params.toString()
    return api<NotificationListResponse>(
      `/notifications${queryString ? `?${queryString}` : ''}`,
      { token: getAuthToken() }
    )
  },

  getUnreadCount: () =>
    api<{ count: number }>('/notifications/unread-count', { token: getAuthToken() }),

  toggleRead: (id: number, isRead: boolean) =>
    api<{ notification: Notification }>(`/notifications/${id}/read`, {
      method: 'PUT',
      body: { isRead },
      token: getAuthToken()
    }),

  markAllAsRead: () =>
    api<{ message: string; count: number }>('/notifications/read-all', {
      method: 'PUT',
      token: getAuthToken()
    }),

  delete: (id: number) =>
    api<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
      token: getAuthToken()
    })
}

// Passkey API (WebAuthn)
export interface PasskeyInfo {
  id: number
  credentialId: string
  name: string | null
  deviceType: string
  backedUp: boolean
  createdAt: string
  lastUsedAt: string | null
  prfSupported?: boolean
}

export interface PasskeyRegistrationOptions {
  options: unknown // WebAuthn options from server
  challengeKey: string
  prfSalt: string // Salt for PRF evaluation
}

export interface PasskeyRegistrationResult {
  success: boolean
  passkey: PasskeyInfo | null
  prfSupported: boolean
  prfSalt?: string
}

export interface PasskeyAuthenticationOptions {
  options: unknown // WebAuthn options from server
  challengeKey: string
  prfSalts?: { [credentialId: string]: string } // PRF salts per credential
}

export interface PasskeyAuthResponse extends AuthResponse {
  encryptedMasterKey?: string
  masterKeyIv?: string
  prfSalt?: string
}

export const passkeyApi = {
  // Check if user has passkeys (public)
  checkHasPasskeys: (emailOrUsername: string) =>
    api<{ hasPasskeys: boolean }>(`/passkey/check/${encodeURIComponent(emailOrUsername)}`),

  // Get registration options (protected - for adding passkey to existing account)
  getRegistrationOptions: () =>
    api<PasskeyRegistrationOptions>('/passkey/register/options', {
      method: 'POST',
      token: getAuthToken()
    }),

  // Verify registration (protected)
  verifyRegistration: (challengeKey: string, response: unknown, name?: string) =>
    api<PasskeyRegistrationResult>('/passkey/register/verify', {
      method: 'POST',
      body: { challengeKey, response, name },
      token: getAuthToken()
    }),

  // Store encrypted master key for a passkey (protected)
  storeEncryptedKey: (passkeyId: number, encryptedMasterKey: string, masterKeyIv: string) =>
    api<{ success: boolean }>(`/passkey/${passkeyId}/encrypted-key`, {
      method: 'POST',
      body: { encryptedMasterKey, masterKeyIv },
      token: getAuthToken()
    }),

  // Get authentication options (public - for login)
  getAuthenticationOptions: (emailOrUsername?: string) =>
    api<PasskeyAuthenticationOptions>('/passkey/authenticate/options', {
      method: 'POST',
      body: { emailOrUsername }
    }),

  // Verify authentication (public - login with passkey)
  verifyAuthentication: (challengeKey: string, response: unknown) =>
    api<PasskeyAuthResponse>('/passkey/authenticate/verify', {
      method: 'POST',
      body: { challengeKey, response }
    }),

  // List user's passkeys (protected)
  list: () =>
    api<{ passkeys: PasskeyInfo[] }>('/passkey/list', { token: getAuthToken() }),

  // Delete a passkey (protected)
  delete: (id: number) =>
    api<{ success: boolean; message: string }>(`/passkey/${id}`, {
      method: 'DELETE',
      token: getAuthToken()
    }),

  // Rename a passkey (protected)
  rename: (id: number, name: string) =>
    api<{ passkey: PasskeyInfo }>(`/passkey/${id}`, {
      method: 'PUT',
      body: { name },
      token: getAuthToken()
    })
}
