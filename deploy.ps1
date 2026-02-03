# =============================================================================
# LearnMind AI - Production Deployment Script (PowerShell)
# VPS: 89.117.75.145
# Domain: learnmind-ai.jkhoster.com
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "LearnMind AI - Production Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.production exists
if (-not (Test-Path .env.production)) {
    Write-Host "ERROR: .env.production file not found!" -ForegroundColor Red
    Write-Host "Please create .env.production with your production credentials." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "nginx/ssl/live/learnmind-ai.jkhoster.com" | Out-Null
New-Item -ItemType Directory -Force -Path "nginx/logs" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/credentials" | Out-Null

Write-Host "Step 2: Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down 2>$null

Write-Host "Step 3: Removing old images..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml rm -f 2>$null

Write-Host "Step 4: Building backend (compiling on server)..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache backend

Write-Host "Step 5: Building frontend (compiling on server)..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache frontend

Write-Host "Step 6: Starting infrastructure services..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d postgres mongodb redis minio minio-init

Write-Host "Step 7: Waiting for databases to be ready (60 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host "Step 8: Running database migrations..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:run

Write-Host "Step 9: Starting backend service..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d backend

Write-Host "Step 10: Waiting for backend to be healthy (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "Step 11: Starting frontend service..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d frontend

Write-Host "Step 12: SSL certificate setup..." -ForegroundColor Yellow
Write-Host "Note: Run setup-ssl.ps1 separately after DNS is configured" -ForegroundColor Cyan

Write-Host "Step 13: Starting Nginx reverse proxy..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d nginx certbot

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml ps
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "  - Frontend: https://learnmind-ai.jkhoster.com" -ForegroundColor White
Write-Host "  - Backend API: https://learnmind-ai.jkhoster.com/api" -ForegroundColor White
Write-Host "  - Health Check: https://learnmind-ai.jkhoster.com/api/health" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.prod.yml logs -f [service_name]" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host ""
