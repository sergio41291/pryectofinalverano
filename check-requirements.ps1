# LearnMind AI - Verificación de Requisitos (Windows PowerShell)
# Ejecutar con: powershell -ExecutionPolicy Bypass -File check-requirements.ps1

Write-Host "🔍 Verificando requisitos de LearnMind AI..." -ForegroundColor Green
Write-Host ""

# Contadores
$TOTAL = 0
$OK = 0

function Check-Command {
    param(
        [string]$Command,
        [string]$Name,
        [string]$InstallUrl
    )
    
    $script:TOTAL++
    
    try {
        $null = & $Command --version 2>&1
        Write-Host "✅ $Name está instalado" -ForegroundColor Green
        $script:OK++
    }
    catch {
        Write-Host "❌ $Name NO está instalado" -ForegroundColor Red
        Write-Host "   → Instalar desde: $InstallUrl" -ForegroundColor Yellow
    }
    Write-Host ""
}

function Check-File {
    param(
        [string]$FilePath,
        [string]$Name
    )
    
    $script:TOTAL++
    
    if (Test-Path $FilePath) {
        Write-Host "✅ $Name existe" -ForegroundColor Green
        $script:OK++
    }
    else {
        Write-Host "❌ $Name NO existe" -ForegroundColor Red
    }
    Write-Host ""
}

# REQUISITOS PRINCIPALES
Write-Host "📦 REQUISITOS PRINCIPALES" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Check-Command "docker" "Docker" "https://www.docker.com/products/docker-desktop"
Check-Command "docker-compose" "Docker Compose" "Incluido en Docker Desktop"
Check-Command "git" "Git" "https://git-scm.com/"
Check-Command "node" "Node.js" "https://nodejs.org/"
Check-Command "npm" "NPM" "Incluido en Node.js"
Check-Command "python" "Python 3.9+" "https://www.python.org/"

# SERVICIOS DOCKER
Write-Host ""
Write-Host "🔌 SERVICIOS DOCKER" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

try {
    $containers = docker ps --format "{{.Names}}" 2>$null
    
    if ($containers) {
        Write-Host "ℹ️  Docker está corriendo" -ForegroundColor Yellow
        
        # PostgreSQL
        $TOTAL++
        if ($containers -match "learnpmind_postgres") {
            Write-Host "✅ PostgreSQL está activo" -ForegroundColor Green
            $OK++
        }
        else {
            Write-Host "❌ PostgreSQL NO está activo" -ForegroundColor Red
            Write-Host "   → Ejecutar: docker-compose up -d" -ForegroundColor Yellow
        }
        Write-Host ""
        
        # Redis
        $TOTAL++
        if ($containers -match "learnpmind_redis") {
            Write-Host "✅ Redis está activo" -ForegroundColor Green
            $OK++
        }
        else {
            Write-Host "❌ Redis NO está activo" -ForegroundColor Red
        }
        Write-Host ""
        
        # MongoDB
        $TOTAL++
        if ($containers -match "learnpmind_mongodb") {
            Write-Host "✅ MongoDB está activo" -ForegroundColor Green
            $OK++
        }
        else {
            Write-Host "❌ MongoDB NO está activo" -ForegroundColor Red
        }
        Write-Host ""
        
        # MinIO
        $TOTAL++
        if ($containers -match "learnpmind_minio") {
            Write-Host "✅ MinIO está activo" -ForegroundColor Green
            $OK++
        }
        else {
            Write-Host "❌ MinIO NO está activo" -ForegroundColor Red
        }
        Write-Host ""
    }
    else {
        Write-Host "❌ Docker Compose no está ejecutándose" -ForegroundColor Red
        Write-Host "   → Ejecutar: docker-compose up -d" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️  No se pudo verificar Docker" -ForegroundColor Yellow
}

# PYTHON PACKAGES
Write-Host ""
Write-Host "🐍 PYTHON PACKAGES" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

try {
    $TOTAL++
    python -c "import paddleocr" 2>$null
    if ($?) {
        Write-Host "✅ PaddleOCR instalado" -ForegroundColor Green
        $OK++
    }
    else {
        Write-Host "❌ PaddleOCR NO instalado" -ForegroundColor Red
        Write-Host "   → Instalar: pip install paddleocr" -ForegroundColor Yellow
    }
    Write-Host ""
    
    $TOTAL++
    python -c "import cv2" 2>$null
    if ($?) {
        Write-Host "✅ OpenCV instalado" -ForegroundColor Green
        $OK++
    }
    else {
        Write-Host "❌ OpenCV NO instalado" -ForegroundColor Red
        Write-Host "   → Instalar: pip install opencv-python" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️  Python no disponible" -ForegroundColor Yellow
}
Write-Host ""

# ARCHIVOS CONFIGURACIÓN
Write-Host ""
Write-Host "📂 ARCHIVOS CONFIGURACIÓN" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

Check-File ".env" "Archivo .env"
Check-File ".env.example" "Archivo .env.example"
Check-File "docker-compose.yml" "Archivo docker-compose.yml"

# DOCUMENTACIÓN
Write-Host ""
Write-Host "📚 DOCUMENTACIÓN" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

Check-File "ROADMAP.md" "ROADMAP.md"
Check-File "QUICKSTART.md" "QUICKSTART.md"
Check-File "CLAUDE_STREAMING_GUIDE.md" "CLAUDE_STREAMING_GUIDE.md"
Check-File "PADDLE_OCR_SETUP.md" "PADDLE_OCR_SETUP.md"

# RESULTADO FINAL
Write-Host ""
Write-Host "🎯 RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Verificaciones pasadas: $OK/$TOTAL" -ForegroundColor Green
Write-Host ""

if ($OK -eq $TOTAL) {
    Write-Host "🎉 ¡LISTO PARA COMENZAR!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Green
    Write-Host "1. Leer QUICKSTART.md" -ForegroundColor White
    Write-Host "2. Revisar ROADMAP.md" -ForegroundColor White
    Write-Host "3. Configurar variables en .env" -ForegroundColor White
    Write-Host "4. npm install en frontend y backend" -ForegroundColor White
    exit 0
}
elseif ($OK -ge ($TOTAL - 3)) {
    Write-Host "⚠️  CASI LISTO" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Faltan pocos requisitos. Revisa los detalles arriba." -ForegroundColor White
    exit 1
}
else {
    Write-Host "❌ PENDIENTES IMPORTANTES" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instala los requisitos faltantes antes de continuar." -ForegroundColor White
    exit 2
}
