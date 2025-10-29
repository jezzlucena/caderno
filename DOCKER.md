# Docker Setup Guide for Caderno

This guide explains how to run Caderno using Docker Compose with both frontend and server services.

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (usually included with Docker Desktop)
- Caderno Hub running (either locally or remotely)

## Quick Start

### 1. Prepare Environment Variables

Copy the Docker environment file:
```bash
cp .env.docker .env
```

Edit `.env` to configure your setup:
```bash
# Most important: Set your Caderno Hub API URL
VITE_HUB_API_URL=http://host.docker.internal:3001/api
```

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Server** (scheduled exports): http://localhost:3002

## Services Overview

### Frontend Service

**Purpose**: Serves the Caderno web application

**Port**: 5173

**Environment Variables:**
- `VITE_HUB_API_URL` - URL to caderno-hub API (required)

**Volumes:**
- Source code mounted for hot-reload during development

### Server Service

**Purpose**: Handles scheduled exports (PDF/email/SMS)

**Port**: 3002

**Environment Variables:**
- Server configuration (PORT, NODE_ENV)
- Database path
- Authentication secrets
- Email (SMTP) configuration
- SMS (Twilio) configuration
- CORS settings

**Volumes:**
- `./server/data` - SQLite database persistence
- `./server/logs` - Application logs

## Configuration

### Connecting to Caderno Hub

#### Option 1: Caderno Hub Running Outside Docker (Recommended for Development)

```bash
# In .env file
VITE_HUB_API_URL=http://host.docker.internal:3001/api
```

This allows the Docker container to connect to services running on your host machine.

#### Option 2: Caderno Hub in Same Docker Network

```bash
# In .env file
VITE_HUB_API_URL=http://caderno-hub-server:3001/api
```

Then ensure caderno-hub is in the same Docker network:
```yaml
networks:
  caderno-network:
    external: true
```

#### Option 3: Caderno Hub in Production

```bash
# In .env file
VITE_HUB_API_URL=https://api.caderno-hub.com/api
```

### Email Configuration (Optional)

For scheduled email exports:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in `SMTP_PASS`

### SMS Configuration (Optional)

For scheduled SMS notifications:

```bash
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Docker Compose Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f server
```

### Building and Updating

```bash
# Rebuild containers
docker-compose build

# Rebuild and restart
docker-compose up -d --build

# Pull latest images
docker-compose pull
```

### Maintenance

```bash
# Check service status
docker-compose ps

# Execute command in container
docker-compose exec frontend sh
docker-compose exec server sh

# View resource usage
docker stats
```

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Stop, remove containers, and volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## Development Workflow

### Hot Reload

Both frontend and server support hot reload in development:

1. **Frontend**: Edit files in `./src` - changes reflect immediately
2. **Server**: Edit files in `./server/src` - server restarts automatically

### Debugging

#### View Frontend Logs
```bash
docker-compose logs -f frontend
```

#### View Server Logs
```bash
docker-compose logs -f server
```

#### Enter Container Shell
```bash
# Frontend
docker-compose exec frontend sh

# Server
docker-compose exec server sh
```

#### Check Environment Variables
```bash
# Frontend
docker-compose exec frontend env | grep VITE

# Server
docker-compose exec server env
```

## Production Deployment

### 1. Update Environment Variables

```bash
# .env file for production
VITE_HUB_API_URL=https://api.caderno-hub.com/api
NODE_ENV=production
JWT_SECRET=strong-random-secret-here
API_KEY_SALT=another-strong-secret
```

### 2. Build Production Images

```bash
docker-compose -f docker-compose.yml build
```

### 3. Security Considerations

- [ ] Use strong secrets for `JWT_SECRET` and `API_KEY_SALT`
- [ ] Enable HTTPS for all services
- [ ] Configure proper CORS origins
- [ ] Use Docker secrets for sensitive data
- [ ] Implement rate limiting
- [ ] Regular security updates

### 4. Persistent Data

Ensure database and logs persist:

```yaml
volumes:
  - caderno-data:/app/server/data
  - caderno-logs:/app/server/logs
```

## Troubleshooting

### Issue: Can't connect to Caderno Hub

**Symptoms:** Login fails, "Failed to fetch" errors

**Solutions:**
1. Check `VITE_HUB_API_URL` is correct
2. Verify caderno-hub is running: `curl http://localhost:3001/api/health`
3. Check Docker network connectivity
4. Use `host.docker.internal` instead of `localhost` for host services

### Issue: Frontend not accessible

**Symptoms:** Can't access http://localhost:5173

**Solutions:**
1. Check service is running: `docker-compose ps`
2. Check logs: `docker-compose logs frontend`
3. Verify port 5173 is not in use: `lsof -i :5173`
4. Restart service: `docker-compose restart frontend`

### Issue: Server health check failing

**Symptoms:** Server container constantly restarting

**Solutions:**
1. Check logs: `docker-compose logs server`
2. Verify database path is writable
3. Check environment variables are set correctly
4. Disable healthcheck temporarily to debug

### Issue: Permission errors with volumes

**Symptoms:** Can't write to database or logs

**Solutions:**
```bash
# Fix permissions
sudo chown -R $USER:$USER ./server/data
sudo chown -R $USER:$USER ./server/logs
```

### Issue: Out of memory

**Symptoms:** Containers crashing, slow performance

**Solutions:**
```bash
# Increase Docker memory limit (Docker Desktop > Settings > Resources)
# Or add to docker-compose.yml:
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Advanced Configuration

### Custom Network

Connect to external services:

```yaml
networks:
  caderno-network:
    external: true
  external-network:
    external: true
```

### Multiple Environments

```bash
# Development
docker-compose -f docker-compose.yml up -d

# Production
docker-compose -f docker-compose.prod.yml up -d

# Staging
docker-compose -f docker-compose.staging.yml up -d
```

### Health Checks

Customize health check intervals:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5173"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Resource Monitoring

```bash
# View resource usage
docker stats

# View specific service
docker stats caderno-frontend caderno-server

# Export metrics
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## Backup and Restore

### Backup Database

```bash
# Backup server database
docker-compose exec server tar czf /backup/db-$(date +%Y%m%d).tar.gz /app/data

# Copy to host
docker cp caderno-server:/backup/db-*.tar.gz ./backups/
```

### Restore Database

```bash
# Copy backup to container
docker cp ./backups/db-20231028.tar.gz caderno-server:/backup/

# Extract in container
docker-compose exec server tar xzf /backup/db-20231028.tar.gz -C /app
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Caderno ENV Setup](./ENV_SETUP.md)
- [Caderno Hub Docker Setup](../caderno-hub/DOCKER.md)

## Support

For issues specific to Docker setup:
1. Check logs with `docker-compose logs`
2. Verify environment variables are set
3. Ensure caderno-hub is accessible
4. Review this troubleshooting guide

For application-specific issues, see the main [README.md](./README.md)
