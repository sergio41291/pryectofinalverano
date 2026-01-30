#!/usr/bin/env powershell

param()

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "INICIANDO LIMPIEZA COMPLETA (BD + MinIO)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar y iniciar Docker Compose
Write-Host "[INFO] Verificando servicios Docker..." -ForegroundColor Cyan

$postgresStatus = docker-compose ps postgres 2>&1 | Select-String "Up"
if (-not $postgresStatus) {
    Write-Host "[INFO] Iniciando PostgreSQL..." -ForegroundColor Yellow
    docker-compose up -d postgres 2>&1 | Out-Null
    Start-Sleep -Seconds 3
}

$minioStatus = docker-compose ps minio 2>&1 | Select-String "Up"
if (-not $minioStatus) {
    Write-Host "[INFO] Iniciando MinIO..." -ForegroundColor Yellow
    docker-compose up -d minio 2>&1 | Out-Null
    Start-Sleep -Seconds 3
}

Write-Host "[OK] Servicios disponibles" -ForegroundColor Green
Write-Host ""

# Limpiar base de datos
Write-Host "[STEP 1] Limpiando base de datos PostgreSQL..." -ForegroundColor Cyan

$pgCommand = @"
DELETE FROM ocr_results;
DELETE FROM uploads;
"@

try {
    $pgCommand | docker-compose exec -T postgres psql -U postgres -d learpmind 2>&1 | Out-Null
    Write-Host "[OK] Base de datos limpiada" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error limpiando base de datos" -ForegroundColor Red
}

Write-Host ""

# Limpiar MinIO
Write-Host "[STEP 2] Limpiando buckets MinIO..." -ForegroundColor Cyan

$buckets = @('documents', 'results', 'temp')

foreach ($bucket in $buckets) {
    try {
        Write-Host "     [INFO] Limpiando $bucket..." -ForegroundColor Yellow
        docker-compose exec minio sh -c "rm -rf /data/$bucket/* /data/$bucket/.*" 2>&1 | Out-Null
        Write-Host "     [OK] $bucket limpiado" -ForegroundColor Green
    } catch {
        Write-Host "     [WARN] Error en $bucket" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
