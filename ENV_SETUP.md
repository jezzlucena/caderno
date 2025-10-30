# Environment Variables Setup Guide

This guide covers all environment variables needed for Caderno and its integration with Caderno Hub.

## Caderno Frontend (.env)

Create a `.env` file in the `caderno/` directory:

```bash
# Required for Authentication with Caderno Hub
VITE_HUB_API_URL=http://localhost:3002/api
```

**Configuration:**
- `VITE_HUB_API_URL` - URL to your caderno-hub backend API
  - Local development: `http://localhost:3002/api`
  - Production: `https://your-caderno-hub-domain.com/api`

## Caderno Server (.env)

If using the scheduled exports feature, create a `.env` file in `caderno/server/`:

```bash
# Server Configuration
SERVER_PORT=3002
NODE_ENV=development

# Database
DATABASE_PATH=./data/caderno.db

# Authentication
JWT_SECRET=your-secret-key-here-change-in-production
API_KEY_SALT=your-api-key-salt-here

# Email Configuration (Nodemailer) - Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Configuration (Twilio) - Optional
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/server.log
```

**Note:** The caderno server is only needed if you're using scheduled exports. For basic authentication with caderno-hub, only the frontend `.env` is required.

## Caderno Hub Server (.env)

Create a `.env` file in `caderno-hub/server/`:

```bash
# Database
MONGO_URL=mongodb://localhost:27017/caderno-hub

# JWT Secret
JWT_SECRET=your-secret-key-change-this-in-production

# Session Secret (for OAuth)
SESSION_SECRET=your-session-secret-change-this-in-production

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server Port
SERVER_PORT=3002

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_PLUS_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PLUS_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
```

## Caderno Hub Frontend (.env)

Create a `.env` file in `caderno-hub/`:

```bash
VITE_API_URL=http://localhost:3002/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Quick Setup Checklist

### Minimal Setup (Authentication Only)

- [ ] **Caderno Frontend**: Create `caderno/.env` with `VITE_HUB_API_URL`
- [ ] **Caderno Hub Server**: Create `caderno-hub/server/.env` with MongoDB URI and JWT secret
- [ ] **Caderno Hub Frontend**: Create `caderno-hub/.env` with API URL

### Full Setup (With Stripe Subscriptions)

- [ ] **All Minimal Setup steps above**
- [ ] **Stripe Account**: Create at stripe.com
- [ ] **Stripe Products**: Create Plus and Pro plans
- [ ] **Stripe Keys**: Add to caderno-hub server `.env`
- [ ] **Stripe Publishable Key**: Add to caderno-hub frontend `.env`
- [ ] **Webhook Secret**: Set up Stripe CLI or production webhook

### Optional: OAuth Providers

- [ ] **Google OAuth**: Configure in Google Cloud Console
- [ ] **GitHub OAuth**: Configure in GitHub Settings
- [ ] **Microsoft OAuth**: Configure in Azure Portal
- [ ] **Apple OAuth**: Configure in Apple Developer Portal

### Optional: Scheduled Exports

- [ ] **Caderno Server**: Create `caderno/server/.env`
- [ ] **Email Service**: Configure SMTP settings
- [ ] **SMS Service**: Configure Twilio settings

## Environment Variable Validation

### Testing Caderno Connection

```bash
# In caderno directory
echo $VITE_HUB_API_URL
# Should output: http://localhost:3001/api (or your hub URL)
```

### Testing Caderno Hub

```bash
# In caderno-hub/server directory
node -e "console.log(process.env.JWT_SECRET ? 'JWT_SECRET is set' : 'JWT_SECRET is missing')"
```

## Common Issues

### Issue: "Failed to fetch" or CORS errors
**Solution:** Ensure `FRONTEND_URL` in caderno-hub server matches your caderno URL

### Issue: "401 Unauthorized" when signing in
**Solution:** Verify `VITE_HUB_API_URL` points to the correct caderno-hub API

### Issue: "Stripe is not configured"
**Solution:** Check all Stripe environment variables are set in caderno-hub server

### Issue: OAuth not working
**Solution:** Verify OAuth provider credentials and callback URLs match your configuration

## Production Considerations

### Security
- [ ] Use strong, unique values for `JWT_SECRET` and `SESSION_SECRET`
- [ ] Never commit `.env` files to version control
- [ ] Use environment-specific values (production vs development)
- [ ] Enable HTTPS for all production endpoints
- [ ] Use production Stripe keys (start with `sk_live_` and `pk_live_`)

### URLs
- [ ] Update `VITE_HUB_API_URL` to production caderno-hub URL
- [ ] Update `FRONTEND_URL` in caderno-hub to production caderno URL
- [ ] Configure proper CORS `ALLOWED_ORIGINS`

### Database
- [ ] Use MongoDB Atlas or managed MongoDB for production
- [ ] Ensure proper backups are configured
- [ ] Use connection string with authentication

## Example Production Configuration

### Caderno Frontend
```bash
VITE_HUB_API_URL=https://api.caderno-hub.com/api
```

### Caderno Hub Server
```bash
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/caderno-hub
JWT_SECRET=complex-random-secret-key-here
SESSION_SECRET=another-complex-secret-here
FRONTEND_URL=https://caderno.com
SERVER_PORT=3002
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Caderno Hub Frontend
```bash
VITE_API_URL=https://api.caderno-hub.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Need Help?

- **Stripe Setup**: See `caderno-hub/STRIPE_SETUP.md`
- **OAuth Setup**: See `caderno-hub/OAUTH_SETUP.md`
- **Webhook Debugging**: See `caderno-hub/WEBHOOK_DEBUG.md`
- **Docker Setup**: See `caderno-hub/DOCKER.md`
