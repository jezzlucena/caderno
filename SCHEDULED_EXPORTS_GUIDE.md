# Scheduled PDF Exports Feature Guide

## Overview

The Agenda journal app now includes a **Scheduled PDF Exports** feature that allows you to automatically send PDF compilations of your journal entries via email and SMS on a recurring schedule. This feature runs on a self-hostable federated server that you can deploy anywhere.

## Visual Guide

### Main Interface - Accessing Scheduled Exports

```
┌─────────────────────────────────────────────────────────────┐
│  Agenda                                    ☰ Menu ←─────────┐│
├─────────────────────────────────────────────────────────────┤│
│                                                              ││
│  Your Journal Entries...                                    ││
│                                                              ││
└─────────────────────────────────────────────────────────────┘│
                                                                │
  Click Menu → Scheduled Exports ─────────────────────────────┘
```

### Settings Screen - Server Configuration

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                              ✕    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 🌐 Language                                      > │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ✨ AI Autocomplete                               > │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ☁️ Cloud Sync                                     > │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 🕐 Scheduled Exports                              > │←───┤
│  │ Configure automated PDF exports server             │    │
│  └────────────────────────────────────────────────────┘    │
│  ↑ Click here to configure server connection               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Server Configuration Screen

```
┌─────────────────────────────────────────────────────────────┐
│  ← Settings      Scheduled Exports                     ✕    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Setup Instructions                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. Set up and run your Agenda Server              │    │
│  │ 2. Generate an API key                             │    │
│  │ 3. Enter your server URL and API key below        │    │
│  │ → View Setup Guide ────────────────────────────── │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Server URL                                                  │
│  ┌────────────────────────────────────────────┐            │
│  │ http://localhost:3001                      │←─ Enter    │
│  └────────────────────────────────────────────┘   here     │
│                                                              │
│  🔑 API Key                                                 │
│  ┌────────────────────────────────────────────┐ [Show]     │
│  │ abc123••••••••••••••••••••••••••••         │←─ Paste    │
│  └────────────────────────────────────────────┘   here     │
│  Generate by POSTing to /api/auth/register                  │
│                                                              │
│                                          [Cancel]  [Save]   │
└─────────────────────────────────────────────────────────────┘
```

### Scheduled Exports Modal - Create Schedule

```
┌─────────────────────────────────────────────────────────────┐
│  Scheduled Exports                                     ✕    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  3 schedules configured              [+ New Schedule] ←─────┤
│                                                       Click  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Weekly Review                          ▶️  🗑️       │    │
│  │ Every Monday at 9 AM                               │    │
│  │ Recipients: 2 | Type: all                          │    │
│  │ Last run: Today at 9:00 AM                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Monthly Summary                        ▶️  🗑️       │    │
│  │ First day of each month                            │    │
│  │ Recipients: 1 | Type: date_range                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│                                                   [Close]    │
└─────────────────────────────────────────────────────────────┘
```

### Create Schedule Form

```
┌─────────────────────────────────────────────────────────────┐
│  Scheduled Exports                                     ✕    │
├─────────────────────────────────────────────────────────────┤
│  ← Back to list                                             │
│                                                              │
│  Schedule Name                                               │
│  ┌────────────────────────────────────────────┐            │
│  │ Weekly Review                              │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  Frequency                                                   │
│  ┌────────────────────────────────────────────┐            │
│  │ Every Monday at 9 AM                    ▼  │←─ Select   │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  Entry Selection                                             │
│  ┌────────────────────────────────────────────┐            │
│  │ All entries                             ▼  │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  Recipients                                                  │
│  ┌─────────┬─────────────────────────────────┬─────┐      │
│  │ Email ▼ │ user@example.com                │ 🗑️  │      │
│  └─────────┴─────────────────────────────────┴─────┘      │
│  ┌─────────┬─────────────────────────────────┬─────┐      │
│  │ SMS   ▼ │ +1234567890                     │ 🗑️  │      │
│  └─────────┴─────────────────────────────────┴─────┘      │
│  + Add recipient                                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           [Create Schedule]                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### System Architecture - How It Works

```
┌──────────────────┐
│ Agenda App       │
│ (Your Browser)   │
│                  │
│  📝 Journal      │
│  📅 Schedules    │
└────────┬─────────┘
         │
         │ 1. Configure schedule
         │    + entries data
         ↓
┌───────────────────────────────────────────┐
│ Agenda Server (Self-Hosted)              │
│                                           │
│  ┌─────────────┐    ┌─────────────┐     │
│  │ SQLite DB   │    │ Scheduler   │     │
│  │ (Encrypted) │←───│ (Cron Jobs) │     │
│  └─────────────┘    └──────┬──────┘     │
│                             │            │
│  2. Store + Schedule        │            │
│                             │            │
│  ┌─────────────┐    ┌──────▼──────┐    │
│  │ PDF Gen     │←───│ Trigger     │    │
│  │ (Puppeteer) │    │ (on time)   │    │
│  └──────┬──────┘    └─────────────┘    │
└─────────┼────────────────────────────────┘
          │
          │ 3. Generate PDF
          ↓
┌──────────────────┐      ┌──────────────────┐
│ Email Service    │      │ SMS Service      │
│ (SMTP)           │      │ (Twilio)         │
│                  │      │                  │
│  📧 Send PDF     │      │  📱 Send Notice  │
└────────┬─────────┘      └────────┬─────────┘
         │                          │
         │ 4. Deliver               │
         ↓                          ↓
┌──────────────────┐      ┌──────────────────┐
│ 📬 Recipients    │      │ 📱 Recipients    │
│ user@email.com   │      │ +1234567890      │
└──────────────────┘      └──────────────────┘
```

### Example: Weekly Export Flow

```
Monday 9:00 AM
     │
     ↓
┌─────────────────────────────────────┐
│ Cron Trigger: "0 9 * * 1"           │
│ Schedule: "Weekly Review"           │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ 1. Fetch entries from database      │
│ 2. Decrypt with passphrase          │
│ 3. Filter by selection criteria     │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ Generate PDF with Puppeteer:        │
│  - Professional template            │
│  - All selected entries             │
│  - Formatted and styled             │
└──────────────┬──────────────────────┘
               │
               ├─────────────┬─────────────┐
               │             │             │
               ↓             ↓             ↓
         📧 Email      📧 Email      📱 SMS
       user1@...     user2@...    +123...
```

## 🎯 What This Feature Does

- **Automated Scheduling**: Set up recurring PDF exports using cron expressions (weekly, monthly, daily, etc.)
- **Entry Selection**: Choose to export all entries, specific entries, or entries within a date range
- **Email Delivery**: Receive beautifully formatted PDFs via email with customizable recipients
- **SMS Notifications**: Get SMS alerts when exports are sent (optional)
- **Self-Hosted**: Deploy your own server for complete privacy and control
- **Federated**: Each user can run their own server instance

## 📋 Prerequisites

Before setting up scheduled exports, you'll need:

1. **Node.js 18+** and npm installed
2. **SMTP Server Credentials** (e.g., Gmail, SendGrid, or any SMTP provider)
3. **(Optional) Twilio Account** for SMS notifications

## 🚀 Quick Start Guide

### Step 1: Set Up the Server

#### 1.1 Navigate to Server Directory
```bash
cd agenda-server
```

#### 1.2 Install Dependencies
```bash
npm install
```

#### 1.3 Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Required Configuration (.env):**
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database
DATABASE_PATH=./data/agenda.db

# Authentication
JWT_SECRET=your-secure-secret-key-change-this
API_KEY_SALT=your-api-key-salt-change-this

# Email Configuration (REQUIRED)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Configuration (OPTIONAL)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

**Gmail Setup:**
1. Enable 2-factor authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use this 16-character password in `SMTP_PASS`

#### 1.4 Start the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

**Using Docker:**
```bash
docker-compose up -d
```

The server will start on port 3001 (or your configured PORT).

### Step 2: Generate an API Key

You need an API key to authenticate with your server.

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/auth/register
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "abc123...",
    "api_key": "your-64-character-api-key-here",
    "created_at": 1234567890
  },
  "message": "API key created successfully. Store it securely - it will not be shown again."
}
```

**⚠️ Important:** Save this API key securely! You won't be able to retrieve it again.

### Step 3: Connect the Frontend

1. **Open Agenda App**: Launch your Agenda journal application
2. **Open Menu**: Click the hamburger menu (≡) in the top-right corner
3. **Select "Scheduled Exports"**: Click on the "Scheduled Exports" option
4. **Enter Server Details**:
   - Server URL: `http://localhost:3001` (or your server's URL)
   - API Key: Paste the API key from Step 2
5. **Click "Connect"**: The app will verify the connection

### Step 4: Create Your First Schedule

Once connected, you can create scheduled exports:

1. **Click "New Schedule"**
2. **Fill in the details**:
   - **Schedule Name**: e.g., "Weekly Review"
   - **Frequency**: Choose from presets or use custom cron expression
     - Every Monday at 9 AM
     - First day of each month
     - Every day at noon
     - Every 6 hours
   - **Entry Selection**:
     - All entries
     - Date range (select start and end dates)
   - **Recipients**:
     - Add email addresses (for PDF delivery)
     - Add phone numbers (for SMS notifications)
3. **Click "Create Schedule"**

Your schedule is now active and will run automatically!

## 📅 Scheduling Options

### Preset Schedules

| Preset | Cron Expression | Description |
|--------|----------------|-------------|
| Weekly | `0 9 * * 1` | Every Monday at 9 AM |
| Monthly | `0 0 1 * *` | First day of each month at midnight |
| Daily | `0 12 * * *` | Every day at noon |
| Every 6 Hours | `0 */6 * * *` | Four times per day |

### Custom Cron Expressions

Format: `minute hour day month weekday`

Examples:
- `0 8 * * *` - Every day at 8 AM
- `0 20 * * 5` - Every Friday at 8 PM
- `30 9 1 * *` - 9:30 AM on the 1st of each month
- `0 */4 * * *` - Every 4 hours

[Learn more about cron syntax](https://crontab.guru/)

## 🔧 Managing Schedules

### View Schedules
- Open "Scheduled Exports" from the menu
- See all active schedules with their status and last run time

### Run Manually
- Click the ▶️ (play) icon next to any schedule
- The export will be generated and sent immediately

### Delete Schedule
- Click the 🗑️ (trash) icon next to any schedule
- Confirm the deletion

### Edit Schedule
- Currently: Delete and recreate
- Future: Direct editing support

## 📧 Email Template

Recipients receive a beautifully formatted email with:
- Professional HTML design
- Entry count and generation timestamp
- PDF attachment with all selected entries
- Privacy reminder
- Mobile-responsive layout

## 📱 SMS Notifications

If configured with Twilio, recipients receive:
```
📱 Agenda Journal: Your scheduled export with X entries has been sent to your email. Check your inbox!
```

## 🔒 Security & Privacy

### Data Protection
- All journal entries are AES-encrypted before storage on the server
- API keys are hashed with salt
- Transport encryption via HTTPS (recommended for production)

### Best Practices
1. Use strong, unique passwords for SMTP and API keys
2. Deploy server behind HTTPS (use Let's Encrypt for free SSL)
3. Regularly backup your database (`agenda-server/data/agenda.db`)
4. Keep your API key secret and never commit to version control
5. Use environment variables for all sensitive configuration

### Rate Limiting
The server includes built-in rate limiting:
- 100 requests per 15 minutes per IP
- Prevents abuse and ensures fair usage

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
cd agenda-server
docker-compose up -d
```

### Manual Docker

```bash
# Build image
docker build -t agenda-server .

# Run container
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.env:/app/.env \
  --name agenda-server \
  agenda-server
```

### Docker Management

```bash
# View logs
docker-compose logs -f

# Stop server
docker-compose down

# Restart server
docker-compose restart

# Update and rebuild
docker-compose down
docker-compose build
docker-compose up -d
```

## 🛠️ Troubleshooting

### Server Won't Start

**Check logs:**
```bash
cd agenda-server
npm run dev
```

**Common issues:**
- Port 3001 already in use → Change `PORT` in `.env`
- Missing dependencies → Run `npm install`
- Invalid environment variables → Check `.env` syntax

### Email Not Sending

1. **Verify SMTP credentials** in `.env`
2. **Test connection** from server logs
3. **Check spam folder** in recipient's email
4. **Gmail-specific**:
   - Enable 2FA
   - Use App Password, not regular password
   - Allow "Less secure app access" if not using App Password

### PDF Generation Fails

**On Linux:**
```bash
# Install Chromium dependencies
sudo apt-get install -y chromium-browser

# Or for Alpine/Docker:
apk add chromium nss freetype harfbuzz ca-certificates ttf-freefont
```

**Check logs:**
- Look for Puppeteer errors
- Ensure sufficient memory (2GB+ recommended)

### Connection Failed in Frontend

1. **Verify server is running:** `curl http://localhost:3001/health`
2. **Check API key:** Re-generate if needed
3. **CORS issues:** Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
4. **Firewall:** Ensure port 3001 is accessible

### Schedule Not Executing

1. **Check schedule status** in the UI (enabled/disabled)
2. **Verify cron expression** at [crontab.guru](https://crontab.guru)
3. **Check server logs** for execution errors
4. **Ensure entries are stored** on the server

## 📚 API Reference

### Authentication
All requests (except `/api/auth/register`) require the `X-API-Key` header.

### Endpoints

#### Create API Key
```bash
POST /api/auth/register
```

#### Verify API Key
```bash
GET /api/auth/verify
Headers: X-API-Key: your-api-key
```

#### Create Schedule
```bash
POST /api/schedules
Headers: 
  X-API-Key: your-api-key
  Content-Type: application/json
Body:
{
  "name": "Weekly Export",
  "cron_expression": "0 9 * * 1",
  "entry_selection_type": "all",
  "recipients": [
    { "type": "email", "value": "user@example.com" },
    { "type": "sms", "value": "+1234567890" }
  ],
  "entries_data": [...],
  "passphrase": "encryption-key"
}
```

#### List Schedules
```bash
GET /api/schedules
Headers: X-API-Key: your-api-key
```

#### Execute Schedule Manually
```bash
POST /api/schedules/:id/execute
Headers: X-API-Key: your-api-key
```

#### Delete Schedule
```bash
DELETE /api/schedules/:id
Headers: X-API-Key: your-api-key
```

Full API documentation available in `agenda-server/README.md`.

## 🗂️ File Structure

```
agenda/
├── agenda-server/                 # Federated server
│   ├── src/
│   │   ├── config/               # Database configuration
│   │   ├── models/               # Data models
│   │   ├── middleware/           # Authentication
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Business logic
│   │   └── index.ts              # Server entry point
│   ├── templates/                # PDF HTML template
│   ├── data/                     # SQLite database (created at runtime)
│   ├── logs/                     # Server logs (created at runtime)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md                 # Server documentation
├── src/
│   └── components/
│       └── ScheduledExportsModal.tsx  # Frontend UI
└── SCHEDULED_EXPORTS_GUIDE.md    # This file
```

## 🔄 Backup & Recovery

### Backup Database
```bash
cd agenda-server
cp data/agenda.db backup/agenda-$(date +%Y%m%d).db
```

### Automated Backup (cron)
```bash
# Add to crontab
0 2 * * * cp /path/to/agenda-server/data/agenda.db /path/to/backup/agenda-$(date +\%Y\%m\%d).db
```

### Restore Database
```bash
cd agenda-server
cp backup/agenda-20251015.db data/agenda.db
docker-compose restart  # If using Docker
```

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T21:10:00.000Z",
  "uptime": 3600,
  "activeSchedules": 3
}
```

### View Logs
```bash
# Development
cd agenda-server
npm run dev

# Docker
docker-compose logs -f

# Log file (if configured)
tail -f agenda-server/logs/server.log
```

## 🎓 Advanced Topics

### Custom Cron Schedules
Create complex schedules using cron syntax:
```
* * * * * - Every minute
0 0 * * 0 - Weekly on Sunday at midnight
0 9 * * 1-5 - Weekdays at 9 AM
0 */2 * * * - Every 2 hours
```

### Multiple Server Instances
Each user can run their own server for complete privacy:
1. Deploy server on your infrastructure
2. Use unique API keys per user
3. Configure CORS for your frontend domain

### Production Deployment
1. **Use HTTPS:** Configure reverse proxy (nginx/Caddy)
2. **Environment:** Set `NODE_ENV=production`
3. **Process Manager:** Use PM2 or systemd
4. **Monitoring:** Set up uptime monitoring
5. **Backups:** Automate database backups

## 🤝 Support

### Getting Help
- Server logs: `docker-compose logs -f` or `npm run dev`
- GitHub Issues: [Report bugs or request features]
- Documentation: `agenda-server/README.md`

### Common Questions

**Q: Can I use a different email provider?**
A: Yes! Any SMTP server works (Gmail, Outlook, SendGrid, Mailgun, etc.)

**Q: Is SMS required?**
A: No, SMS is optional. You can use email-only delivery.

**Q: Can I self-host on my home network?**
A: Yes, but ensure proper security and use HTTPS.

**Q: How much does it cost?**
A: The server is free. You only pay for:
- SMTP service (Gmail is free for personal use)
- Twilio SMS (optional, pay-per-message)
- Server hosting (can run on free tiers)

**Q: Can multiple users share one server?**
A: Yes, each user needs their own API key.

## 🎉 You're All Set!

Your scheduled PDF exports feature is now ready to use. Start by creating your first schedule and enjoy automated journal backups delivered right to your inbox!

---

Built with ❤️ for privacy-focused journaling
