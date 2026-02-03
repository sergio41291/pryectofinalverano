# LearnMind AI - Deployment Guide

## VPS Production Deployment to learnmind-ai.jkhoster.com

### Server Information
- **IP**: 89.117.75.145
- **Domain**: learnmind-ai.jkhoster.com
- **OS**: Ubuntu 22.04+ (recommended)
- **Method**: Docker Compose with build on server

---

## Prerequisites on VPS

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
```

### 3. Install Docker Compose
```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 4. Install Git
```bash
sudo apt install git -y
git --version
```

### 5. Configure Firewall
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## Deployment Steps

### 1. Clone Repository on VPS
```bash
cd /opt
sudo git clone https://github.com/yourusername/learnmind-ai.git
sudo chown -R $USER:$USER learnmind-ai
cd learnmind-ai
```

### 2. Configure Environment Variables
```bash
# Copy production environment template
cp .env.production .env

# Edit with production credentials
nano .env
```

**Required Changes in .env:**
```bash
# Change ALL passwords
DB_PASSWORD=YourStrongPostgresPassword123!
MONGO_PASSWORD=YourStrongMongoPassword456!
REDIS_PASSWORD=YourStrongRedisPassword789!
MINIO_ROOT_PASSWORD=YourStrongMinioPassword!

# Set JWT secrets (must be 32+ characters)
JWT_SECRET=YourRandomJWTSecret32CharactersMinimum!
JWT_REFRESH_SECRET=YourRandomRefreshSecret32CharsMin!

# Add API keys
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxx
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxx
GOOGLE_CLOUD_PROJECT_ID=your-project-id
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx

# SMTP is already configured for jkhoster.com
SMTP_PASSWORD=Cambiamejk1!.
```

### 3. Add Google Cloud Credentials
```bash
# Create credentials directory
mkdir -p backend/credentials

# Copy your Google Cloud key
nano backend/credentials/google-cloud-key.json
# Paste your Google Cloud JSON key
```

### 4. Make Scripts Executable
```bash
chmod +x deploy.sh
chmod +x setup-ssl.sh
```

### 5. Run Deployment
```bash
./deploy.sh
```

**The deployment script will:**
1. ✅ Create necessary directories
2. ✅ Stop existing containers
3. ✅ Build backend (compile on server)
4. ✅ Build frontend (compile on server)
5. ✅ Start infrastructure services (PostgreSQL, MongoDB, Redis, MinIO)
6. ✅ Wait for databases to be ready
7. ✅ Run database migrations (creates all tables)
8. ✅ Start backend service
9. ✅ Start frontend service
10. ✅ Obtain SSL certificate
11. ✅ Start Nginx reverse proxy

### 6. Verify Deployment
```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check backend health
curl https://learnmind-ai.jkhoster.com/api/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

---

## SSL Certificate Setup

The SSL certificate is automatically obtained during deployment. If you need to set it up manually:

```bash
./setup-ssl.sh
```

**Certificate Auto-Renewal:**
- The `certbot` container runs every 12 hours to check and renew certificates
- Certificates are valid for 90 days
- Renewal happens automatically 30 days before expiration

---

## Database Migrations

### Run Migrations Manually
```bash
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:run
```

### Revert Last Migration
```bash
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:revert
```

### Generate New Migration
```bash
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:generate -- -n MigrationName
```

---

## Service Management

### Start All Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop All Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Specific Service
```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
docker-compose -f docker-compose.prod.yml restart nginx
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Check Service Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

---

## Updating Application

### Pull Latest Changes
```bash
cd /opt/learnmind-ai
git pull origin main
```

### Rebuild and Deploy
```bash
./deploy.sh
```

### Update Without Rebuilding
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## Backup & Restore

### Backup Database
```bash
# PostgreSQL backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U learnmind_user learnmind_production > backup_$(date +%Y%m%d).sql

# MongoDB backup
docker-compose -f docker-compose.prod.yml exec mongodb mongodump --authenticationDatabase admin -u learnmind_mongo -p PASSWORD --out /backup
```

### Restore Database
```bash
# PostgreSQL restore
cat backup_20241220.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U learnmind_user -d learnmind_production

# MongoDB restore
docker-compose -f docker-compose.prod.yml exec mongodb mongorestore --authenticationDatabase admin -u learnmind_mongo -p PASSWORD /backup
```

---

## Monitoring

### Check System Resources
```bash
# Docker stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# Check logs size
du -sh nginx/logs/
```

### Health Endpoints
- **Backend**: https://learnmind-ai.jkhoster.com/api/health
- **Frontend**: https://learnmind-ai.jkhoster.com/health

---

## Troubleshooting

### Services Not Starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(80|443|3001|5432|27017|6379|9000)'

# Restart Docker daemon
sudo systemctl restart docker
```

### SSL Certificate Issues
```bash
# Check certificate status
docker-compose -f docker-compose.prod.yml run --rm certbot certificates

# Renew manually
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Force renewal
docker-compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal
```

### Database Connection Issues
```bash
# Check if databases are healthy
docker-compose -f docker-compose.prod.yml ps

# Test PostgreSQL connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U learnmind_user -d learnmind_production -c "SELECT 1;"

# Test MongoDB connection
docker-compose -f docker-compose.prod.yml exec mongodb mongosh -u learnmind_mongo -p PASSWORD --authenticationDatabase admin
```

### Frontend Not Loading
```bash
# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Check nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Backend API Errors
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Check environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep -E '(DB_|REDIS_|MONGO_|JWT_)'

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

---

## Security Recommendations

### 1. Change Default Passwords
```bash
# Generate strong passwords
openssl rand -base64 32

# Update .env file with new passwords
nano .env
```

### 2. Enable Automatic Security Updates
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 3. Setup Fail2Ban
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Regular Backups
```bash
# Create backup script
cat > /opt/learnmind-ai/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
docker-compose -f /opt/learnmind-ai/docker-compose.prod.yml exec postgres pg_dump -U learnmind_user learnmind_production > /opt/backups/db_$DATE.sql
find /opt/backups/ -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/learnmind-ai/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /opt/learnmind-ai/backup.sh
```

---

## Performance Optimization

### 1. Enable Docker Log Rotation
```bash
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

### 2. Increase File Descriptors
```bash
# Add to /etc/security/limits.conf
echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf
```

### 3. Optimize Nginx
The nginx.conf already includes:
- ✅ Gzip compression
- ✅ Static file caching
- ✅ Rate limiting
- ✅ Connection keep-alive
- ✅ Security headers

---

## URLs

- **Frontend**: https://learnmind-ai.jkhoster.com
- **Backend API**: https://learnmind-ai.jkhoster.com/api
- **API Documentation**: https://learnmind-ai.jkhoster.com/api/docs
- **Health Check**: https://learnmind-ai.jkhoster.com/api/health
- **MinIO Console**: http://89.117.75.145:9001

---

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f [service]`
2. Review [Troubleshooting](#troubleshooting) section
3. Check GitHub Issues
4. Contact support team
