# Caderno Server - Production Guide

## Overview

This document provides guidance for deploying and operating the Caderno Server in production environments.

## Production Features

### 1. Advanced Logging (Winston)
- Structured JSON logging for all operations
- Separate log files for errors and combined logs
- Configurable log levels via environment variables
- Console output in development mode with colored formatting

**Log Files:**
- `logs/scheduler-error.log` - Error-level logs only
- `logs/scheduler-combined.log` - All logs

**Configuration:**
```bash
LOG_LEVEL=info  # Options: error, warn, info, debug, verbose
```

### 2. Retry Mechanisms
- Automatic retry with exponential backoff for failed schedule executions
- Configurable retry count and delay
- Per-schedule retry tracking

**Configuration:**
```bash
SCHEDULER_MAX_RETRIES=3                    # Default: 3
SCHEDULER_RETRY_DELAY_MS=60000             # Default: 60000 (1 minute)
SCHEDULER_BACKOFF_MULTIPLIER=2             # Default: 2
```

### 3. Timeout Protection
- Global execution timeout per schedule
- Individual timeouts for PDF generation, email, and SMS operations
- Prevents hanging operations from blocking the scheduler

**Configuration:**
```bash
SCHEDULER_EXECUTION_TIMEOUT_MS=300000      # Default: 300000 (5 minutes)
```

### 4. Graceful Shutdown
- Waits for active executions to complete (up to 30 seconds)
- Properly closes database connections
- Stops all cron tasks cleanly
- Handles SIGTERM and SIGINT signals

### 5. Monitoring & Metrics

#### Health Check Endpoint
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T22:00:00.000Z",
  "uptime": 3600.5,
  "scheduler": {
    "status": "healthy",
    "activeSchedules": 5,
    "activeExecutions": 0,
    "totalSchedules": 5
  }
}
```

**Status Levels:**
- `healthy` - All schedules functioning normally
- `degraded` - 20-50% failure rate on schedules
- `unhealthy` - >50% failure rate on schedules

#### Metrics Endpoint
```bash
GET /metrics
```

Response includes detailed per-schedule metrics:
```json
{
  "timestamp": "2025-10-29T22:00:00.000Z",
  "uptime": 3600.5,
  "scheduler": {
    "status": "healthy",
    "activeSchedules": 5,
    "activeExecutions": 0,
    "totalSchedules": 5,
    "metrics": {
      "schedule-id-1": {
        "totalExecutions": 100,
        "successfulExecutions": 98,
        "failedExecutions": 2,
        "lastExecutionTime": 5432,
        "averageExecutionTime": 4821
      }
    }
  }
}
```

### 6. Security Features
- Non-root user in Docker container (nodejs:1001)
- Helmet middleware for HTTP security headers
- Rate limiting on API endpoints
- CORS configuration with allowed origins
- Input validation and sanitization

### 7. Error Handling
- Comprehensive try-catch blocks with proper error propagation
- Detailed error logging with stack traces
- Execution logs stored in database
- Graceful degradation on non-critical failures

## Environment Variables

### Required
```bash
# Server Configuration
SERVER_PORT=3001
NODE_ENV=production

# Email Configuration (Required for email functionality)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com

# Database
DATABASE_PATH=./database/caderno.db
```

### Optional
```bash
# CORS
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100        # Max requests per window

# Scheduler Configuration
SCHEDULER_MAX_RETRIES=3
SCHEDULER_RETRY_DELAY_MS=60000
SCHEDULER_BACKOFF_MULTIPLIER=2
SCHEDULER_EXECUTION_TIMEOUT_MS=300000

# Logging
LOG_LEVEL=info

# SMS (Optional - Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Docker Deployment

### Building the Image
```bash
cd caderno/server
docker build -t caderno-server:latest .
```

### Running with Docker
```bash
docker run -d \
  --name caderno-server \
  -p 3001:3001 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/database:/app/database \
  --env-file .env \
  --restart unless-stopped \
  caderno-server:latest
```

### Docker Compose
See `docker-compose.yml` for a complete setup with volumes and environment configuration.

### Health Check
The Docker image includes a built-in health check that runs every 30 seconds:
```bash
docker ps  # Check health status in STATUS column
```

## Monitoring Best Practices

### 1. Log Monitoring
Monitor log files for errors and warnings:
```bash
# Watch error logs
tail -f logs/scheduler-error.log

# Filter for specific schedule
grep "scheduleId" logs/scheduler-combined.log | grep "schedule-123"
```

### 2. Health Checks
Set up external monitoring to poll the `/health` endpoint:
```bash
# Example with curl
curl http://localhost:3001/health

# Set up alerts if status is not "healthy"
```

### 3. Metrics Collection
Regularly collect metrics for analysis:
```bash
# Example: Collect metrics every 5 minutes
*/5 * * * * curl http://localhost:3001/metrics >> /var/log/caderno-metrics.log
```

### 4. Database Backups
Regularly backup the SQLite database:
```bash
# Example backup script
sqlite3 database/caderno.db ".backup database/caderno-backup-$(date +%Y%m%d).db"
```

## Performance Tuning

### 1. Concurrent Executions
The scheduler prevents concurrent executions of the same schedule to avoid resource conflicts. Monitor `activeExecutions` to ensure schedules aren't backing up.

### 2. Timeout Configuration
Adjust timeouts based on your workload:
- Small PDFs (<10 entries): Use default timeouts
- Large PDFs (>100 entries): Increase `SCHEDULER_EXECUTION_TIMEOUT_MS`

### 3. Retry Configuration
- High-priority schedules: Lower `SCHEDULER_RETRY_DELAY_MS`
- Resource-intensive operations: Increase `SCHEDULER_BACKOFF_MULTIPLIER`

### 4. Database Optimization
SQLite is configured with WAL mode for better concurrent access. For high-load scenarios, consider:
```bash
# Check database size
ls -lh database/caderno.db

# Vacuum database periodically
sqlite3 database/caderno.db "VACUUM;"
```

## Troubleshooting

### Schedule Not Executing
1. Check if schedule is enabled in database
2. Verify cron expression is valid
3. Check logs for errors: `tail -f logs/scheduler-error.log`
4. Verify environment variables are set correctly
5. Check `/metrics` endpoint for schedule status

### High Memory Usage
1. Monitor PDF generation for large entry sets
2. Check for memory leaks in Puppeteer: ensure browser closes properly
3. Review active executions count
4. Consider restarting service during low-traffic periods

### Email Delivery Failures
1. Verify SMTP credentials and configuration
2. Check SMTP server connection and firewall rules
3. Review email logs in `logs/scheduler-error.log`
4. Test SMTP connection manually

### Database Locked Errors
1. Ensure only one instance of the server is running
2. Check for long-running queries
3. Verify WAL mode is enabled: `sqlite3 database/caderno.db 'PRAGMA journal_mode;'`
4. Consider using a different database path if on NFS

## Scaling Considerations

### Horizontal Scaling
The server is currently designed for single-instance deployment due to SQLite. For horizontal scaling:
1. Migrate to PostgreSQL or MySQL
2. Use distributed task queue (Redis + Bull)
3. Implement distributed locking mechanism

### Vertical Scaling
For single-instance scaling:
- Increase memory allocation for Node.js: `NODE_OPTIONS=--max-old-space-size=4096`
- Optimize PDF generation by batching entries
- Use faster storage (SSD) for database

## Security Checklist

- [ ] Change default ports if publicly exposed
- [ ] Use strong SMTP credentials
- [ ] Enable HTTPS/TLS for all external connections
- [ ] Regularly update Docker base image and dependencies
- [ ] Implement API authentication for `/metrics` endpoint in production
- [ ] Set up firewall rules to restrict access
- [ ] Enable audit logging for critical operations
- [ ] Regularly backup encryption keys and database
- [ ] Monitor for suspicious activity in logs
- [ ] Keep Node.js and dependencies updated

## Maintenance

### Regular Tasks
- **Daily**: Monitor health endpoint and error logs
- **Weekly**: Review metrics and performance trends
- **Monthly**: Backup database, rotate logs, update dependencies
- **Quarterly**: Security audit, performance testing

### Log Rotation
Configure log rotation to prevent disk space issues:
```bash
# Example logrotate configuration
/app/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

## Support

For issues and questions:
1. Check this documentation
2. Review logs in `logs/` directory
3. Check GitHub issues
4. Consult the main README.md

## Version History

### v1.0.0 (Production-Ready)
- Advanced logging with Winston
- Retry mechanisms with exponential backoff
- Timeout protection for all operations
- Graceful shutdown handling
- Comprehensive metrics and health checks
- Security hardening
- Docker production optimizations
- Non-root user in containers
- Health check endpoints
