# Docker Setup - LearnMind

Complete application stack with all services containerized.

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Development (Hot Reload)

```bash
# Copy environment file
cp .env.docker .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs (Swagger)**: http://localhost:3001/api
- **MinIO Console**: http://localhost:9001
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### Production Build

```bash
# Build images
docker-compose build

# Run in detached mode
docker-compose up -d

# Check health
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Access

```bash
# PostgreSQL
docker-compose exec postgres psql -U postgres -d learpmind

# MongoDB
docker-compose exec mongodb mongosh -u admin -p mongodb

# Redis CLI
docker-compose exec redis redis-cli -a redis123
```

### Reset Everything

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (deletes data)
docker-compose down -v

# Rebuild and start fresh
docker-compose up --build
```

## Services

### PostgreSQL (postgres:16-alpine)
- **Port**: 5432
- **User**: postgres
- **Password**: postgres
- **Database**: learpmind_dev

### MongoDB (mongo:7.0)
- **Port**: 27017
- **Username**: admin
- **Password**: mongodb
- **Database**: learpmind_dev

### Redis (redis:7-alpine)
- **Port**: 6379
- **Password**: redis123

### MinIO (minio/minio:latest)
- **Port**: 9000 (API)
- **Port**: 9001 (Console)
- **Access Key**: minioadmin
- **Secret Key**: minioadmin123
- **Buckets**: documents, temp, results

### Backend (NestJS)
- **Port**: 3001
- **Health**: GET /health
- **API Docs**: GET /api

### Frontend (React/Vite)
- **Port**: 3000
- **Built with nginx**

## Development Notes

### Backend Development
- Source code is mounted as volume for hot reload
- Changes to `backend/src/**` automatically trigger compilation
- Requires `npm run build` after TypeScript changes

### Frontend Development
- For hot reload during development, use `npm run dev` locally
- Docker image is pre-built static version with nginx

### Environment Variables
- Development: See `.env` files in backend/ and frontend/
- Docker: See `.env.docker` in root

## Troubleshooting

### Port already in use
```bash
# Find and kill process on port
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Rebuild without cache
```bash
docker-compose build --no-cache
```

### Service not starting
```bash
# Check logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>
```

### Clear everything and start fresh
```bash
docker-compose down -v
docker system prune -a --volumes
docker-compose up --build
```

## Network

Services communicate via Docker bridge network `learpmind_network`:
- Backend → PostgreSQL: `postgres:5432`
- Backend → MongoDB: `mongodb:27017`
- Backend → Redis: `redis:6379`
- Backend → MinIO: `minio:9000`
- Frontend → Backend: `backend:3001` (via nginx reverse proxy)

External access uses localhost with port mapping.

## Security Notes

**Development Only**:
- Weak passwords (change in production)
- No SSL/TLS
- All services exposed
- Hot reload enabled

**Production**:
- Change all default credentials
- Use strong JWT_SECRET
- Enable SSL/TLS
- Implement proper authentication
- Use environment-specific configs
- Consider reverse proxy (Traefik, nginx)
