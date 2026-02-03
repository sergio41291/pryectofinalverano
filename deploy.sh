#!/bin/bash

# =============================================================================
# LearnMind AI - Production Deployment Script
# VPS: 89.117.75.145
# Domain: learnmind-ai.jkhoster.com
# =============================================================================

set -e  # Exit on error

echo "=========================================="
echo "LearnMind AI - Production Deployment"
echo "=========================================="
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "ERROR: .env.production file not found!"
    echo "Please create .env.production with your production credentials."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "Step 1: Creating necessary directories..."
mkdir -p nginx/ssl/live/learnmind-ai.jkhoster.com
mkdir -p nginx/logs
mkdir -p backend/credentials

echo "Step 2: Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

echo "Step 3: Removing old images..."
docker-compose -f docker-compose.prod.yml rm -f || true

echo "Step 4: Building backend (compiling on server)..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

echo "Step 5: Building frontend (compiling on server)..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend

echo "Step 6: Starting infrastructure services..."
docker-compose -f docker-compose.prod.yml up -d postgres mongodb redis minio minio-init

echo "Step 7: Waiting for databases to be ready (60 seconds)..."
sleep 60

echo "Step 8: Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:run

echo "Step 9: Starting backend service..."
docker-compose -f docker-compose.prod.yml up -d backend

echo "Step 10: Waiting for backend to be healthy (30 seconds)..."
sleep 30

echo "Step 11: Starting frontend service..."
docker-compose -f docker-compose.prod.yml up -d frontend

echo "Step 12: Obtaining SSL certificate..."
./setup-ssl.sh

echo "Step 13: Starting Nginx reverse proxy..."
docker-compose -f docker-compose.prod.yml up -d nginx certbot

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Services Status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "Application URLs:"
echo "  - Frontend: https://learnmind-ai.jkhoster.com"
echo "  - Backend API: https://learnmind-ai.jkhoster.com/api"
echo "  - Health Check: https://learnmind-ai.jkhoster.com/api/health"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f [service_name]"
echo ""
echo "To stop all services:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo ""
