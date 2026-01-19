const API_BASE = '/api/v1';

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && this.accessToken) {
      // Try to refresh the token
      const refreshed = await this.refresh();
      if (refreshed) {
        // Retry the request with new token
        (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });

        if (!retryResponse.ok) {
          const error = await retryResponse.json();
          throw new Error(error.error?.message || 'Request failed');
        }

        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async refresh(): Promise<boolean> {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          this.accessToken = data.accessToken;
          return true;
        }

        this.accessToken = null;
        return false;
      } catch {
        this.accessToken = null;
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Auth
  async register(email: string, password: string) {
    const data = await this.request<{
      accessToken: string;
      expiresIn: number;
      user: User;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.accessToken = data.accessToken;
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{
      accessToken: string;
      expiresIn: number;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.accessToken = data.accessToken;
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.accessToken = null;
  }

  async refreshToken() {
    const data = await this.request<{
      accessToken: string;
      expiresIn: number;
      user: User;
    }>('/auth/refresh', { method: 'POST' });
    this.accessToken = data.accessToken;
    return data;
  }

  async getAuthMethods(email: string) {
    return this.request<{
      password: boolean;
      passkey: boolean;
      magicLink: boolean;
    }>(`/auth/methods?email=${encodeURIComponent(email)}`);
  }

  async requestMagicLink(email: string) {
    return this.request<{ success: boolean; message: string }>(
      '/auth/magic-link/request',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  }

  async verifyMagicLink(token: string) {
    const data = await this.request<{
      accessToken: string;
      expiresIn: number;
      user: User;
    }>('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    this.accessToken = data.accessToken;
    return data;
  }

  // Passkeys
  async getPasskeyRegistrationOptions(name?: string) {
    return this.request<PublicKeyCredentialCreationOptionsJSON>(
      '/auth/passkey/register/options',
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      }
    );
  }

  async verifyPasskeyRegistration(response: unknown, name?: string) {
    return this.request<{ id: string; name: string; createdAt: string }>(
      '/auth/passkey/register/verify',
      {
        method: 'POST',
        body: JSON.stringify({ response, name }),
      }
    );
  }

  async getPasskeyLoginOptions(email: string) {
    return this.request<PublicKeyCredentialRequestOptionsJSON>(
      `/auth/passkey/login/options?email=${encodeURIComponent(email)}`
    );
  }

  async verifyPasskeyLogin(email: string, response: unknown) {
    const data = await this.request<{
      accessToken: string;
      expiresIn: number;
      user: User;
    }>('/auth/passkey/login/verify', {
      method: 'POST',
      body: JSON.stringify({ email, response }),
    });
    this.accessToken = data.accessToken;
    return data;
  }

  async listPasskeys() {
    return this.request<{
      passkeys: Passkey[];
    }>('/auth/passkeys');
  }

  async deletePasskey(id: string) {
    return this.request<{ success: boolean }>(`/auth/passkeys/${id}`, {
      method: 'DELETE',
    });
  }

  // Entries
  async listEntries(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<PaginatedResponse<Entry>>(
      `/entries${query ? `?${query}` : ''}`
    );
  }

  async getEntry(id: string) {
    return this.request<Entry>(`/entries/${id}`);
  }

  async createEntry(data: CreateEntryInput) {
    return this.request<Entry>('/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEntry(id: string, data: UpdateEntryInput) {
    return this.request<Entry>(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntry(id: string) {
    return this.request<void>(`/entries/${id}`, { method: 'DELETE' });
  }

  async getTags() {
    return this.request<{ tags: string[] }>('/entries/tags');
  }

  // Export/Import
  async exportJson(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE}/export/json${query ? `?${query}` : ''}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        credentials: 'include',
      }
    );
    return response.blob();
  }

  async exportPdf(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE}/export/pdf${query ? `?${query}` : ''}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        credentials: 'include',
      }
    );
    return response.blob();
  }

  async importJson(data: unknown) {
    return this.request<{
      imported: number;
      skipped: number;
      errors: { index: number; error: string }[];
    }>('/import/json', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Safety Timer
  async getSafetyTimer() {
    return this.request<SafetyTimerStatus>('/safety-timer');
  }

  async updateSafetyTimer(data: UpdateSafetyTimerInput) {
    return this.request<SafetyTimerStatus>('/safety-timer', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async checkIn() {
    return this.request<SafetyTimerStatus>('/safety-timer/check-in', {
      method: 'POST',
    });
  }

  async addRecipient(data: CreateRecipientInput) {
    return this.request<SafetyTimerStatus>('/safety-timer/recipients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecipient(id: string, data: Partial<CreateRecipientInput>) {
    return this.request<SafetyTimerStatus>(`/safety-timer/recipients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecipient(id: string) {
    return this.request<SafetyTimerStatus>(`/safety-timer/recipients/${id}`, {
      method: 'DELETE',
    });
  }

  async addReminder(data: CreateReminderInput) {
    return this.request<SafetyTimerStatus>('/safety-timer/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteReminder(id: string) {
    return this.request<SafetyTimerStatus>(`/safety-timer/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  async verifySmtp(config: SmtpConfig) {
    return this.request<{ success: boolean }>('/safety-timer/verify-smtp', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async sendTestEmail(config: SmtpConfig & { recipientEmail: string }) {
    return this.request<{ success: boolean }>('/safety-timer/test', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Settings
  async getOnboardingStatus() {
    return this.request<OnboardingStatus>('/settings/onboarding/status');
  }

  async completeOnboarding(data: { instanceName?: string }) {
    return this.request<{ success: boolean }>('/settings/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPreferences() {
    return this.request<{
      preferences: UserPreferences;
      email: string;
      authMethods: string[];
    }>('/settings/preferences');
  }

  async updatePreferences(data: Partial<UserPreferences>) {
    return this.request<{ preferences: UserPreferences }>(
      '/settings/preferences',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async getSmtpSettings() {
    return this.request<SmtpSettingsResponse>('/settings/smtp');
  }

  async updateSmtpSettings(config: SmtpConfig) {
    return this.request<{ success: boolean }>('/settings/smtp', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getAppInfo() {
    return this.request<{ instanceName: string; version: string }>(
      '/settings/info'
    );
  }
}

// Types
interface User {
  id: string;
  email: string;
  preferences: UserPreferences;
  authMethods: string[];
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'pt-BR';
  editorFontSize: number;
}

interface Passkey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  deviceType: string;
  backedUp: boolean;
}

interface Entry {
  id: string;
  title: string;
  content: Record<string, unknown>;
  plainText: string;
  tags: string[];
  includeInSafetyTimer: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface CreateEntryInput {
  title: string;
  content: Record<string, unknown>;
  plainText: string;
  tags?: string[];
  includeInSafetyTimer?: boolean;
}

interface UpdateEntryInput {
  title?: string;
  content?: Record<string, unknown>;
  plainText?: string;
  tags?: string[];
  includeInSafetyTimer?: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface Reminder {
  id: string;
  reminderMinutesBefore: number;
}

interface SafetyTimerStatus {
  isEnabled: boolean;
  timerDurationMinutes: number;
  warningPeriodDays: number;
  lastResetAt: string;
  nextDeliveryAt: string;
  status: string;
  recipients: Recipient[];
  reminders: Reminder[];
  smtpConfigured: boolean;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  personalMessage?: string;
  entryFilter: string;
  filterTags?: string[];
}

interface CreateRecipientInput {
  name: string;
  email: string;
  personalMessage?: string;
  entryFilter: 'all' | 'tagged';
  filterTags?: string[];
}

interface CreateReminderInput {
  reminderMinutesBefore: number;
}

interface UpdateSafetyTimerInput {
  isEnabled?: boolean;
  timerDurationMinutes?: number;
  warningPeriodDays?: number;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromAddress: string;
  fromName?: string;
}

interface SmtpSettingsResponse {
  configured: boolean;
  config: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    fromAddress: string;
    fromName: string;
  } | null;
}

interface OnboardingStatus {
  isComplete: boolean;
  currentStep: number;
  hasUser: boolean;
  hasSmtp: boolean;
}

export const api = new ApiClient();
export type {
  User,
  UserPreferences,
  Passkey,
  Entry,
  CreateEntryInput,
  UpdateEntryInput,
  PaginatedResponse,
  SafetyTimerStatus,
  Recipient,
  Reminder,
  CreateRecipientInput,
  CreateReminderInput,
  UpdateSafetyTimerInput,
  SmtpConfig,
  SmtpSettingsResponse,
  OnboardingStatus,
};
