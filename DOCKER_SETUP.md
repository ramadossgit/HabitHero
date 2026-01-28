# Docker Setup Guide - Habit Heroes

## Overview

This guide covers deploying Habit Heroes using Docker for consistent, reproducible deployments across any environment.

---

## Prerequisites

- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Docker Compose v2.0+
- 4GB RAM minimum, 8GB recommended
- 5GB free disk space

---

## Quick Start with Docker Compose

### 1. Start Everything (Database + App)

```bash
# Navigate to project directory
cd HabitHero

# Generate session secret
export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 2. Access Application

Open browser: **http://localhost:5000**

### 3. Stop Services

```bash
docker-compose down

# To remove volumes (CAUTION: Deletes database data)
docker-compose down -v
```

---

## What Gets Created

Docker Compose creates:

1. **PostgreSQL Container** (`habithero-db`)
   - Image: `postgres:16-alpine`
   - Port: 5432 (mapped to host)
   - Volume: `postgres_data` (persistent storage)
   - Healthcheck: Every 10s

2. **Application Container** (`habithero-app`)
   - Built from Dockerfile
   - Port: 5000 (mapped to host)
   - Depends on PostgreSQL
   - Auto-restarts on failure

3. **Docker Network** (`habithero-network`)
   - Isolated network for app and database communication

---

## Production Deployment

### Option 1: Docker Compose (Simple)

1. **Create production `.env` file:**

   ```bash
   # .env
   SESSION_SECRET=<your_generated_64_char_secret>
   STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
   ```

2. **Update docker-compose.yml for production:**

   ```yaml
   environment:
     NODE_ENV: production
     PORT: 5000
     DATABASE_URL: postgresql://habithero:secure_password@postgres:5432/habithero
     SESSION_SECRET: ${SESSION_SECRET}
     STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
   ```

3. **Deploy:**

   ```bash
   docker-compose up -d
   ```

### Option 2: Standalone Docker (Advanced)

1. **Build image:**

   ```bash
   docker build -t habithero:latest .
   ```

2. **Run PostgreSQL:**

   ```bash
   docker run -d \
     --name habithero-db \
     -e POSTGRES_USER=habithero \
     -e POSTGRES_PASSWORD=secure_password \
     -e POSTGRES_DB=habithero \
     -v habithero_data:/var/lib/postgresql/data \
     -p 5432:5432 \
     postgres:16-alpine
   ```

3. **Run Application:**

   ```bash
   docker run -d \
     --name habithero-app \
     --link habithero-db:postgres \
     -e DATABASE_URL=postgresql://habithero:secure_password@habithero-db:5432/habithero \
     -e SESSION_SECRET=your_secret \
     -p 5000:5000 \
     habithero:latest
   ```

---

## Database Migration

### Initial Setup

After starting containers:

```bash
# Access app container
docker-compose exec app sh

# Inside container - push database schema
npx drizzle-kit push

# Exit container
exit
```

### Automatic Migration

Add to Dockerfile `CMD` (optional):

```dockerfile
CMD ["sh", "-c", "npx drizzle-kit push && node dist/index.js"]
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session encryption key | 64-char hex string |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `STRIPE_SECRET_KEY` | Stripe API key | None (disables subscriptions) |

---

## Docker Commands Cheat Sheet

### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f app

# Check status
docker-compose ps

# Execute command in container
docker-compose exec app sh
```

### Database Operations

```bash
# Backup database
docker-compose exec postgres pg_dump -U habithero habithero > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U habithero habithero

# Access PostgreSQL shell
docker-compose exec postgres psql -U habithero habithero
```

### Image Management

```bash
# Build image
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Pull latest images
docker-compose pull

# Remove unused images
docker image prune -a
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect habithero_postgres_data

# Remove volume (CAUTION: Deletes data)
docker volume rm habithero_postgres_data
```

---

## Troubleshooting

### Issue: Container won't start

**Check logs:**
```bash
docker-compose logs app
docker-compose logs postgres
```

**Common causes:**
- Port 5000 or 5432 already in use
- Insufficient permissions
- Invalid environment variables

---

### Issue: Database connection fails

**Verify PostgreSQL is healthy:**
```bash
docker-compose ps
# Look for "healthy" status on postgres service
```

**Check connection from app container:**
```bash
docker-compose exec app sh
nc -zv postgres 5432
```

---

### Issue: Port already in use

**Find process using port:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

**Or change port in docker-compose.yml:**
```yaml
ports:
  - "3000:5000"  # Map host port 3000 to container port 5000
```

---

### Issue: Permission denied

**Linux/macOS only:**

Add user to docker group:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

### Issue: Out of disk space

**Clean up Docker:**
```bash
# Remove unused containers, images, networks
docker system prune -a

# Remove unused volumes
docker volume prune
```

---

## Production Best Practices

### 1. Use External Database

Don't run PostgreSQL in Docker for production. Use managed services:

- **AWS RDS** (PostgreSQL)
- **Google Cloud SQL**
- **Azure Database for PostgreSQL**
- **Neon** (Serverless PostgreSQL)
- **Supabase**

Update `DATABASE_URL` to point to external database.

### 2. Secure Secrets

Use secrets management:

```yaml
# docker-compose.yml
services:
  app:
    secrets:
      - session_secret
      - stripe_key
    environment:
      SESSION_SECRET_FILE: /run/secrets/session_secret
      STRIPE_SECRET_KEY_FILE: /run/secrets/stripe_key

secrets:
  session_secret:
    external: true
  stripe_key:
    external: true
```

### 3. Set Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 4. Enable Logging

Use external logging driver:

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 5. Health Checks

Already configured in docker-compose.yml:

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "...health check script..."]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 40s
```

---

## Orchestration Platforms

### Deploy to Kubernetes

Create Kubernetes manifests:

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: habithero
spec:
  replicas: 3
  selector:
    matchLabels:
      app: habithero
  template:
    metadata:
      labels:
        app: habithero
    spec:
      containers:
      - name: habithero
        image: your-registry/habithero:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: habithero-secrets
              key: database-url
        - name: SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: habithero-secrets
              key: session-secret
```

Deploy:
```bash
kubectl apply -f k8s/
```

### Deploy to AWS ECS

1. **Build and push image:**
   ```bash
   docker build -t habithero:latest .
   docker tag habithero:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/habithero:latest
   docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/habithero:latest
   ```

2. **Create ECS task definition and service via AWS Console**

### Deploy to Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT-ID/habithero

# Deploy
gcloud run deploy habithero \
  --image gcr.io/PROJECT-ID/habithero \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=xxx,SESSION_SECRET=xxx
```

---

## Multi-Stage Build Explanation

The Dockerfile uses multi-stage builds for efficiency:

### Stage 1: Builder
- Installs ALL dependencies (including devDependencies)
- Compiles TypeScript to JavaScript
- Builds Vite frontend
- Output: `dist/` directory with compiled code

### Stage 2: Production
- Starts with clean Node.js image
- Installs ONLY production dependencies
- Copies compiled code from builder stage
- Runs as non-root user for security
- Final image ~200MB (vs ~800MB single-stage)

---

## Monitoring

### Health Endpoint

Add to `server/index.ts`:

```typescript
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Container Stats

```bash
# Real-time stats
docker stats habithero-app

# Logs with timestamps
docker-compose logs --timestamps app
```

---

## Next Steps

1. ✅ Test locally with Docker Compose
2. ✅ Set up external PostgreSQL for production
3. ✅ Configure secrets management
4. ✅ Set up CI/CD pipeline for automated builds
5. ✅ Deploy to production environment
6. ✅ Set up monitoring and alerting

---

## Support

- **Docker Docs:** https://docs.docker.com
- **Docker Compose Reference:** https://docs.docker.com/compose/compose-file/
- **Best Practices:** https://docs.docker.com/develop/dev-best-practices/
