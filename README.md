# Caderno

A privacy-first, federated journaling platform with end-to-end encryption and dead man's switch capabilities.

## Mission & Vision

**Caderno** is a privacy-first, decentralized journaling platform dedicated to safeguarding personal truths and empowering those who speak truth to power. Our mission is to provide journalists, whistleblowers, survivors, and activists with a secure digital space to document their experiences without fear of censorship or surveillance.

Users can record daily reflections or sensitive testimony in encrypted journals that **they** control. A core feature is an optional safety mechanism (a *dead man's switch*): users may set a timed alarm that, if triggered, automatically compiles and delivers their journal entries as an encrypted PDF to pre-selected email addresses.

Our vision is a world where personal narratives and critical truths are preserved securely, transparently, and resiliently -- beyond the reach of any single authority or adversary. By **federating** the platform via ActivityPub, we envision a rich ecosystem of user-operated servers around the world, collectively forming a network that is highly available and censorship-resistant.

## Features

- **End-to-End Encryption (E2EE)** - All journal entries are encrypted client-side using AES-256-GCM before being stored on the server. Only you can read your entries.
- **Dead Man's Switch** - Set up safety mechanisms that automatically send your journal entries to trusted contacts if you don't check in within a specified time period.
- **PDF Compilation** - When a switch triggers, entries are compiled into a beautifully formatted PDF with proper markdown rendering.
- **Federation (ActivityPub)** - Connect with other Caderno instances and the wider fediverse (Mastodon, Pleroma, etc.) to publish public entries.
- **Self-Hostable** - Run your own Caderno server for complete control over your data.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, DaisyUI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with email verification
- **Encryption**: Web Crypto API (AES-256-GCM, PBKDF2)
- **Federation**: ActivityPub protocol with HTTP Signatures

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- [pnpm](https://pnpm.io/) v8 or higher
- [Docker](https://www.docker.com/) and Docker Compose (for containerized setup)
- PostgreSQL 16 (if running locally without Docker)

## Quick Start with Docker

The easiest way to get Caderno running is with Docker Compose:

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/caderno.git
   cd caderno
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**

   Edit `.env` and set at minimum:
   ```env
   JWT_SECRET=your-secret-key-at-least-32-characters-long
   ```

4. **Start the services**
   ```bash
   docker compose up
   ```

5. **Access the application**
   - Frontend: http://localhost:8085
   - Backend API: http://localhost:5055

## Local Development Setup

For development without Docker:

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/caderno.git
   cd caderno
   pnpm install
   ```

2. **Set up PostgreSQL**

   Make sure PostgreSQL is running locally, then create the database:
   ```bash
   createdb caderno
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**

   Edit `.env`:
   ```env
   DATABASE_URL=postgres://your_user:your_password@localhost:5432/caderno
   JWT_SECRET=your-secret-key-at-least-32-characters-long
   ```

5. **Push database schema**
   ```bash
   cd packages/server
   pnpm db:push
   ```

6. **Start development servers**

   From the root directory:
   ```bash
   pnpm dev
   ```

   Or start each package separately:
   ```bash
   # Terminal 1 - Server
   cd packages/server
   pnpm dev

   # Terminal 2 - Client
   cd packages/client
   pnpm dev
   ```

7. **Access the application**
   - Frontend: http://localhost:8085
   - Backend API: http://localhost:5055

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://caderno:caderno@db:5432/caderno` |
| `PORT` | Server port | `5055` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Required |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `SENDGRID_API_KEY` | SendGrid API key | - |
| `SENDGRID_FROM_EMAIL` | Sender email address | `noreply@caderno.app` |
| `SENDGRID_FROM_NAME` | Sender display name | `Caderno` |
| `SUPPORT_EMAIL` | Support email address | `support@caderno.app` |
| `VITE_APP_URL` | Frontend application URL, used for backend and frontend | `http://localhost:8085` |
| `CLIENT_URL` | Client URL for CORS | `http://localhost:8085` |
| `FEDERATION_ENABLED` | Enable ActivityPub federation | `true` |
| `FEDERATION_DOMAIN` | Domain for ActivityPub handles | `localhost:5055` |
| `SERVER_URL` | Public URL of the server | `http://localhost:5055` |

## Setting Up Federation

Federation allows your Caderno instance to interact with other ActivityPub-compatible platforms like Mastodon.

### Requirements for Federation

1. **Public HTTPS URL** - Federation requires your server to be accessible from the internet over HTTPS. Most ActivityPub servers reject HTTP connections.

2. **Proper domain configuration** - Your `FEDERATION_DOMAIN` should match how users will search for your users (e.g., `@username@yourdomain.com`).

### Local Development with ngrok

For testing federation locally, use [ngrok](https://ngrok.com/) to expose your server:

1. **Start ngrok**
   ```bash
   ngrok http 5055
   ```

2. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

3. **Update your `.env` file**
   ```env
   FEDERATION_DOMAIN=abc123.ngrok.io
   SERVER_URL=https://abc123.ngrok.io
   ```

4. **Restart your server** to apply the changes

### Production Setup

For production deployment:

```env
FEDERATION_ENABLED=true
FEDERATION_DOMAIN=yourdomain.com
SERVER_URL=https://yourdomain.com
```

### Using Federation

1. **Enable Federation** - Navigate to the Federation page in the app and click "Setup Federation"

2. **Choose a Username** - This will be your ActivityPub handle (e.g., `@yourname@yourdomain.com`)

3. **Publish Entries** - Optionally publish public entries that will be visible to your followers in the fediverse

4. **Get Followed** - Other ActivityPub users can search for your handle and follow you

### Federation Endpoints

When federation is enabled, the following endpoints become available:

| Endpoint | Description |
|----------|-------------|
| `/.well-known/webfinger` | User discovery (WebFinger) |
| `/users/:username` | Actor profile (ActivityPub) |
| `/users/:username/inbox` | Receive activities |
| `/users/:username/outbox` | Published activities |
| `/users/:username/followers` | Followers collection |
| `/users/:username/following` | Following collection |
| `/inbox` | Shared inbox |

## Project Structure

```
caderno/
├── packages/
│   ├── client/          # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── lib/         # Crypto, API, PDF generation
│   │   │   ├── pages/
│   │   │   └── stores/      # Zustand stores
│   │   └── ...
│   └── server/          # Express backend
│       ├── src/
│       │   ├── config/
│       │   ├── db/          # Drizzle schema
│       │   ├── middleware/
│       │   ├── routes/
│       │   └── services/
│       └── ...
├── docker-compose.yml
├── Dockerfile.client
├── Dockerfile.server
└── ...
```

## Security Considerations

- **Never share your encryption password** - Your journal entries are encrypted with a key derived from your password. If you lose it, your entries cannot be recovered.
- **Use a strong JWT secret in production** - The default is for development only.
- **Enable HTTPS in production** - Especially required for federation.
- **Regularly check in** - If you have dead man's switches active, remember to check in before they trigger.

## API Documentation

For detailed API documentation, see [docs/API.md](docs/API.md).

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

Caderno is built for journalists, whistleblowers, survivors, activists, and anyone who needs a secure space to document their truth. We stand with those who speak truth to power.

---

**Your story, your control.**
