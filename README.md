# Caderno

A privacy-first, self-hosted digital journal web application.

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
docker compose -f docker-compose.prod.yml up -d --build

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
├── docker-compose.yml          # Full stack development
├── docker-compose.dev.yml      # MongoDB only
└── docker-compose.prod.yml     # Production deployment
```

## Configuration

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

Most settings can be configured through the UI during onboarding.

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with password
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/passkey/*` - Passkey authentication
- `POST /api/v1/auth/magic-link/*` - Magic link authentication

### Journal Entries
- `GET /api/v1/entries` - List entries
- `POST /api/v1/entries` - Create entry
- `GET /api/v1/entries/:id` - Get entry
- `PUT /api/v1/entries/:id` - Update entry
- `DELETE /api/v1/entries/:id` - Delete entry

### Export/Import
- `GET /api/v1/export/json` - Export as JSON
- `GET /api/v1/export/pdf` - Export as PDF
- `POST /api/v1/import/json` - Import from JSON

### Safety Timer
- `GET /api/v1/safety-timer` - Get timer status
- `PUT /api/v1/safety-timer` - Update timer config
- `POST /api/v1/safety-timer/check-in` - Reset timer

## License

MIT
