# Caderno

A privacy-first, self-hosted digital journal web application.

**[Live Demo](https://cadernoapp.com)** | **[Landing Page](https://hub.cadernoapp.com)**

## Features

- **Privacy-focused**: Your data stays on your server
- **Rich text editing**: Lexical-powered editor with markdown shortcuts
- **Safety Timer**: Ensure your journal reaches loved ones if you can't check in
- **Multi-language**: English, Spanish, and Portuguese (Brazil)
- **Passkey authentication**: Modern, passwordless login option
- **Export/Import**: JSON and PDF export support

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lexical, Zustand
- **Backend**: Express, MongoDB, Node.js
- **Auth**: Argon2id, WebAuthn (Passkeys), Magic Links
- **Deployment**: pnpm monorepo, Docker Compose

## Quick Start

### Development

1. **Prerequisites**
   - Node.js 20+
   - pnpm 9+
   - MongoDB (or use Docker)

2. **Start MongoDB**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Start development servers**
   ```bash
   pnpm dev
   ```

   This starts:
   - API server at http://localhost:3001
   - Web app at http://localhost:5173

### Production (Docker)

```bash
# Build and run all services
docker compose up -d --build

# Access the application
open http://localhost
```

## Project Structure

```
caderno/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   └── api/                    # Express backend
├── packages/
│   └── shared/                 # Shared types & validation (Zod)
├── docker/
│   └── nginx/                  # Reverse proxy config
├── docker-compose.yml          # Full stack / production deployment
└── docker-compose.dev.yml      # MongoDB only (development)
```

## Configuration

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

Most settings can be configured through the UI during onboarding.

## API Endpoints

### Health
- `GET /api/v1/health` - Health check

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with password
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/methods` - Get available auth methods

### Magic Link
- `POST /api/v1/auth/magic-link/request` - Request magic link
- `POST /api/v1/auth/magic-link/verify` - Verify magic link

### Passkey Authentication
- `POST /api/v1/auth/passkey/register/options` - Get registration options (authenticated)
- `POST /api/v1/auth/passkey/register/verify` - Verify registration (authenticated)
- `GET /api/v1/auth/passkey/login/options` - Get login options
- `POST /api/v1/auth/passkey/login/verify` - Verify login
- `GET /api/v1/auth/passkeys` - List user passkeys (authenticated)
- `DELETE /api/v1/auth/passkeys/:id` - Remove passkey (authenticated)

### Journal Entries
- `GET /api/v1/entries` - List entries
- `GET /api/v1/entries/tags` - Get all tags
- `POST /api/v1/entries` - Create entry
- `GET /api/v1/entries/:id` - Get entry
- `PUT /api/v1/entries/:id` - Update entry
- `DELETE /api/v1/entries/:id` - Delete entry

### Export/Import
- `GET /api/v1/export/json` - Export as JSON
- `GET /api/v1/export/pdf` - Export as PDF
- `POST /api/v1/import/json` - Import from JSON

### Settings
- `GET /api/v1/settings/onboarding/status` - Get onboarding status
- `POST /api/v1/settings/onboarding/complete` - Complete onboarding (authenticated)
- `GET /api/v1/settings/info` - Get app info
- `GET /api/v1/settings/preferences` - Get user preferences (authenticated)
- `PUT /api/v1/settings/preferences` - Update preferences (authenticated)
- `GET /api/v1/settings/smtp` - Get SMTP settings (authenticated)
- `PUT /api/v1/settings/smtp` - Update SMTP settings (authenticated)

### Safety Timer
- `GET /api/v1/safety-timer` - Get timer status
- `PUT /api/v1/safety-timer` - Update timer config
- `POST /api/v1/safety-timer/check-in` - Check in / reset timer
- `POST /api/v1/safety-timer/recipients` - Add recipient
- `PUT /api/v1/safety-timer/recipients/:id` - Update recipient
- `DELETE /api/v1/safety-timer/recipients/:id` - Delete recipient
- `POST /api/v1/safety-timer/reminders` - Add reminder
- `DELETE /api/v1/safety-timer/reminders/:id` - Delete reminder
- `POST /api/v1/safety-timer/verify-smtp` - Verify SMTP configuration
- `POST /api/v1/safety-timer/test` - Send test email

## License

MIT
