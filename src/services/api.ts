const API_URL = import.meta.env.VITE_HUB_API_URL || 'http://localhost:3001/api'

interface User {
  id: string
  email: string
  subscription?: {
    planId: string
    status: string
  }
}

interface AuthResponse {
  user: User
  token: string
}

interface SubscriptionResponse {
  subscription?: {
    planId: string
    status: string
  }
}

class ApiClient {
  private getToken(): string | null {
    const authStorage = localStorage.getItem('caderno-auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed.state?.token || null
    }
    return null
  }

  private async fetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    return data
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return this.fetch<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signUp(email: string, password: string): Promise<AuthResponse> {
    return this.fetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.fetch<User>('/auth/me')
  }

  async getSubscription(): Promise<SubscriptionResponse> {
    return this.fetch<SubscriptionResponse>('/checkout/subscription')
  }

  async signOut(): Promise<void> {
    return this.fetch<void>('/auth/signout', { method: 'POST' })
  }

  getOAuthUrl(provider: 'google' | 'github' | 'microsoft' | 'apple') {
    return `${API_URL}/auth/${provider}`
  }
}

export const api = new ApiClient()
