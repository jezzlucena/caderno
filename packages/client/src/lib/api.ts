const API_BASE = '/api'

interface ApiOptions {
  method?: string
  body?: unknown
  token?: string | null
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
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
    throw new ApiError(response.status, data.error || 'Request failed')
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
  profilePublic: boolean
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
  profilePublic?: boolean
  displayName?: string | null
  bio?: string | null
}

export const authApi = {
  register: (email: string, password: string, username: string, profilePublic: boolean) =>
    api<AuthResponse>('/auth/register', { method: 'POST', body: { email, password, username, profilePublic } }),

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

  resendVerificationEmail: () =>
    api<{ message: string }>('/auth/resend-verification', { method: 'POST', token: getAuthToken() })
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

export interface PublicEntry {
  id: number
  title: string
  content: string
  activityId: string
  published: string
}

export interface FeedEntry {
  id: string
  title: string
  content: string
  published: string
  author: {
    username: string
    displayName: string | null
    actorUrl: string
    isLocal: boolean
  }
}

interface SetupFederationData {
  username: string
  displayName?: string
  bio?: string
}

interface UpdateFederationProfile {
  displayName?: string
  bio?: string
  federationEnabled?: boolean
}

interface PublishEntryData {
  title: string
  content: string
}

export const federationApi = {
  getProfile: () =>
    api<{ profile: FederationProfile }>('/federation/profile', { token: getAuthToken() }),

  setup: (data: SetupFederationData) =>
    api<{ message: string; profile: FederationProfile }>(
      '/federation/setup',
      { method: 'POST', body: data, token: getAuthToken() }
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

  getFeed: () =>
    api<{ entries: FeedEntry[] }>('/federation/feed', { token: getAuthToken() })
}

// Profile API
export interface PublicProfile {
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  entryCount: number
  switchCount: number
  createdAt: string
}

export const profileApi = {
  getPublicProfile: (username: string) =>
    api<PublicProfile>(`/profile/${username}`)
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
