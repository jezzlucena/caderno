const API_URL = import.meta.env.VITE_HUB_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private getToken(): string | null {
    const authStorage = localStorage.getItem('caderno-auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed.state?.token || null
    }
    return null
  }

  private async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
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

  async signIn(email: string, password: string) {
    return this.fetch('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signUp(email: string, password: string) {
    return this.fetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getCurrentUser() {
    return this.fetch('/auth/me')
  }

  async getSubscription() {
    return this.fetch('/checkout/subscription')
  }

  async signOut() {
    return this.fetch('/auth/signout', { method: 'POST' })
  }

  getOAuthUrl(provider: 'google' | 'github' | 'microsoft' | 'apple') {
    return `${API_URL}/auth/${provider}`
  }
}

export const api = new ApiClient()
