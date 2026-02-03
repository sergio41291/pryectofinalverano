# =============================================================================
# Verificación Pre-Deployment para Producción (PowerShell)
# =============================================================================

$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "LearnMind AI - Verificación Pre-Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$ERRORS = 0

# Verificar que existe .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ ERROR: Archivo .env.production no encontrado" -ForegroundColor Red
    Write-Host "   Ejecuta: cp .env.production .env" -ForegroundColor Yellow
    $ERRORS++
} else {
    Write-Host "✅ Archivo .env.production encontrado" -ForegroundColor Green
}

# Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Docker no está instalado" -ForegroundColor Red
    $ERRORS++
}

# Verificar Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose instalado: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Docker Compose no está instalado" -ForegroundColor Red
    $ERRORS++
}

# Verificar archivos críticos
$CRITICAL_FILES = @(
    "docker-compose.prod.yml",
    "Dockerfile.backend.prod",
    "Dockerfile.frontend.prod",
    "nginx\nginx.conf",
    "deploy.sh",
    "deploy.ps1",
    "setup-ssl.sh"
)

Write-Host ""
Write-Host "Verificando archivos críticos..." -ForegroundColor Yellow
foreach ($file in $CRITICAL_FILES) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: $file no encontrado" -ForegroundColor Red
        $ERRORS++
    }
}

# Verificar directorio credentials
Write-Host ""
Write-Host "Verificando directorios..." -ForegroundColor Yellow
if (Test-Path "backend\credentials") {
    Write-Host "✅ backend\credentials existe" -ForegroundColor Green
} else {
    Write-Host "⚠️  ADVERTENCIA: backend\credentials no existe (se creará automáticamente)" -ForegroundColor Yellow
}

# Verificar directorio nginx
if (Test-Path "nginx") {
    Write-Host "✅ nginx\ existe" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: nginx\ no existe" -ForegroundColor Red
    $ERRORS++
}

# Resumen
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
if ($ERRORS -eq 0) {
    Write-Host "✅ VERIFICACIÓN EXITOSA" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "El sistema está listo para deployment." -ForegroundColor White
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Revisa y edita .env.production con tus credenciales" -ForegroundColor White
    Write-Host "2. Asegúrate de tener las API keys (Anthropic, Google, Stripe)" -ForegroundColor White
    Write-Host "3. En el servidor VPS, ejecuta: ./deploy.sh" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ VERIFICACIÓN FALLÓ - $ERRORS ERROR(ES)" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Por favor corrige los errores antes de deployar." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
