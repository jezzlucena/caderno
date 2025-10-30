# Caderno Server - Federated Scheduled Export Server

A self-hostable server for scheduling automated PDF exports of your Caderno journal entries with email and SMS delivery.

## Features

- 🕐 **Flexible Scheduling**: Create schedules using cron expressions
- 📄 **PDF Generation**: Server-side PDF compilation with Puppeteer
- 📧 **Email Delivery**: Send PDFs via SMTP to multiple recipients
- 📱 **SMS Notifications**: Optional SMS alerts via Twilio
- 🔒 **Encrypted Storage**: AES encryption for journal entries
- 🔑 **API Key Authentication**: Secure access control
- 🗄️ **SQLite Database**: Lightweight, self-contained storage
- 📊 **Execution Logs**: Track delivery history and status

## Prerequisites

- Node.js 18+ and npm
- SMTP server credentials (e.g., Gmail, SendGrid)
- (Optional) Twilio account for SMS notifications

## Installation

```bash
# Navigate to server directory
cd caderno-server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Configuration

Edit the `.env` file with your settings:

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_PATH=./data/caderno.db

# Authentication
JWT_SECRET=your-secure-secret-key
API_KEY_SALT=your-api-key-salt

# Email (required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS (optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

### Gmail Setup

1. Enable 2-factor authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the app password in `SMTP_PASS`

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

## API Documentation

### Authentication

All API requests (except `/api/auth/register`) require an API key in the `X-API-Key` header.

#### Register (Get API Key)

```bash
POST /api/auth/register
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "abc123...",
    "api_key": "your-api-key-here",
    "created_at": 1234567890
  },
  "message": "API key created successfully..."
}
```

**Important:** Save the API key securely - it's only shown once!

#### Verify API Key

```bash
GET /api/auth/verify
Headers: X-API-Key: your-api-key
```

### Schedules

#### Create Schedule

```bash
POST /api/schedules
Headers: X-API-Key: your-api-key
Content-Type: application/json

{
  "name": "Weekly Export",
  "cron_expression": "0 9 * * 1",
  "entry_selection_type": "all",
  "recipients": [
    { "type": "email", "value": "user@example.com" },
    { "type": "sms", "value": "+1234567890" }
  ],
  "entries_data": [...],
  "passphrase": "encryption-passphrase"
}
```

**Cron Expression Examples:**
- `0 9 * * 1` - Every Monday at 9 AM
- `0 0 1 * *` - First day of each month at midnight
- `0 12 * * *` - Every day at noon
- `0 */6 * * *` - Every 6 hours

**Entry Selection Types:**
- `all` - Export all entries
- `specific` - Export specific entry IDs (requires `entry_ids` array)
- `date_range` - Export entries within date range (requires `date_range_start` and `date_range_end`)

#### List Schedules

```bash
GET /api/schedules
Headers: X-API-Key: your-api-key
```

#### Get Schedule Details

```bash
GET /api/schedules/:id
Headers: X-API-Key: your-api-key
```

#### Update Schedule

```bash
PUT /api/schedules/:id
Headers: X-API-Key: your-api-key
Content-Type: application/json

{
  "name": "Updated Name",
  "enabled": false
}
```

#### Delete Schedule

```bash
DELETE /api/schedules/:id
Headers: X-API-Key: your-api-key
```

#### Manually Execute Schedule

```bash
POST /api/schedules/:id/execute
Headers: X-API-Key: your-api-key
```

### Health Check

```bash
GET /health
```

## Docker Deployment

```bash
# Build image
docker build -t caderno-server .

# Run container
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.env:/app/.env \
  --name caderno-server \
  caderno-server
```

### Docker Compose

```yaml
version: '3.8'

services:
  caderno-server:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    env_file:
      - .env
    restart: unless-stopped
```

## Project Structure

```
caderno-server/
├── src/
│   ├── config/
│   │   └── database.ts          # SQLite configuration
│   ├── models/
│   │   ├── user.ts              # User model
│   │   └── schedule.ts          # Schedule models
│   ├── middleware/
│   │   └── auth.ts              # Authentication
│   ├── routes/
│   │   ├── auth.ts              # Auth endpoints
│   │   └── schedules.ts         # Schedule endpoints
│   ├── services/
│   │   ├── pdfGenerator.ts      # PDF generation
│   │   ├── emailService.ts      # Email sending
│   │   ├── smsService.ts        # SMS sending
│   │   └── scheduler.ts         # Cron scheduler
│   └── index.ts                 # Entry point
├── templates/
│   └── pdf-template.html        # PDF layout
├── data/                        # Database (created at runtime)
├── logs/                        # Log files (created at runtime)
├── package.json
├── tsconfig.json
└── .env.example
```

## Security Considerations

1. **API Keys**: Store securely, never commit to version control
2. **HTTPS**: Always use HTTPS in production
3. **Encryption**: Journal entries are encrypted with user passphrase
4. **Rate Limiting**: Built-in rate limiting (100 requests per 15 minutes)
5. **CORS**: Configure `ALLOWED_ORIGINS` for your domain
6. **Environment Variables**: Never expose `.env` file

## Troubleshooting

### PDF Generation Fails

Puppeteer requires additional dependencies on Linux:

```bash
# Ubuntu/Debian
apt-get install -y chromium-browser

# Alpine Linux (Docker)
apk add chromium nss freetype harfbuzz ca-certificates ttf-freefont
```

### Email Delivery Issues

1. Check SMTP credentials
2. Enable "Less secure app access" (Gmail legacy)
3. Use App Passwords with 2FA (recommended)
4. Check firewall rules for port 587

### Database Locked

SQLite uses WAL mode. Ensure:
- Only one server instance per database
- Proper file permissions
- No NFS/network filesystems

## Performance

- **Concurrent Schedules**: No hard limit, depends on system resources
- **PDF Generation**: ~1-2 seconds per entry
- **Database**: Suitable for 1000s of schedules
- **Memory**: ~50MB base + ~100MB per active PDF generation

## Backup

```bash
# Backup database
cp data/caderno.db backup/caderno-$(date +%Y%m%d).db

# Automated backup (cron)
0 2 * * * cp /path/to/data/caderno.db /path/to/backup/caderno-$(date +\%Y\%m\%d).db
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Report bug]
- Documentation: [Full docs]

---

Built with ❤️ for privacy-focused journaling
