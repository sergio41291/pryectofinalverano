# LearnMind AI - Installation Script for Windows
# Ejecutar con: powershell -ExecutionPolicy Bypass -File install-requirements.ps1
# Este script instalará automáticamente todas las dependencias necesarias

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  LearnMind AI - Instalador de Dependencias (Windows)       ║" -ForegroundColor Cyan
Write-Host "║  Este script instalará automáticamente todos los requisitos║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Este script requiere ejecutarse como administrador" -ForegroundColor Yellow
    Write-Host "Por favor, ejecuta PowerShell como administrador y vuelve a intentar" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Ejecutándose como administrador" -ForegroundColor Green
Write-Host ""

# 1. Verificar e instalar Chocolatey
Write-Host "📦 PASO 1: Verificar Chocolatey" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "✅ Chocolatey instalado" -ForegroundColor Green
} else {
    Write-Host "✅ Chocolatey ya está instalado" -ForegroundColor Green
}
Write-Host ""

# 2. Instalar Visual C++ Build Tools
Write-Host "🔨 PASO 2: Verificar Visual C++ Build Tools" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
$vcpp = Get-ChildItem "HKLM:\SOFTWARE\Classes\Installer\Products\" | Get-ItemProperty | Where-Object -FilterScript {$_.ProductName -match "Visual C\+\+"}
if (-not $vcpp) {
    Write-Host "Instalando Visual C++ Build Tools..." -ForegroundColor Yellow
    Write-Host "⚠️  Nota: Esto puede tardar 10-30 minutos" -ForegroundColor Yellow
    choco install visualstudio2022buildtools -y --force
    Write-Host "✅ Visual C++ Build Tools instalado" -ForegroundColor Green
} else {
    Write-Host "✅ Visual C++ Build Tools ya está instalado" -ForegroundColor Green
}
Write-Host ""

# 3. Instalar Poppler
Write-Host "📄 PASO 3: Instalar Poppler (para PDF)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
if (-not (Get-Command pdfimages -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Poppler..." -ForegroundColor Yellow
    choco install poppler -y
    Write-Host "✅ Poppler instalado" -ForegroundColor Green
} else {
    Write-Host "✅ Poppler ya está instalado" -ForegroundColor Green
}
Write-Host ""

# 4. Instalar FFmpeg
Write-Host "🎬 PASO 4: Instalar FFmpeg (para Audio)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando FFmpeg..." -ForegroundColor Yellow
    choco install ffmpeg -y
    Write-Host "✅ FFmpeg instalado" -ForegroundColor Green
} else {
    Write-Host "✅ FFmpeg ya está instalado" -ForegroundColor Green
}
Write-Host ""

# 5. Instalar Tesseract (opcional)
Write-Host "🔤 PASO 5: Instalar Tesseract OCR (opcional)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
$installTesseract = Read-Host "¿Deseas instalar Tesseract OCR? (s/n)"
if ($installTesseract -eq 's' -or $installTesseract -eq 'S' -or $installTesseract -eq 'y' -or $installTesseract -eq 'Y') {
    if (-not (Get-Command tesseract -ErrorAction SilentlyContinue)) {
        Write-Host "Instalando Tesseract..." -ForegroundColor Yellow
        choco install tesseract -y
        Write-Host "✅ Tesseract instalado" -ForegroundColor Green
    } else {
        Write-Host "✅ Tesseract ya está instalado" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  Tesseract omitido (instalable más tarde si es necesario)" -ForegroundColor Yellow
}
Write-Host ""

# 6. Instalar dependencias Python
Write-Host "🐍 PASO 6: Instalar dependencias Python" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Navegar al directorio backend
if (Test-Path "backend\requirements.txt") {
    cd backend
    
    # Crear virtual environment si no existe
    if (-not (Test-Path "venv_ocr")) {
        Write-Host "Creando virtual environment..." -ForegroundColor Yellow
        python -m venv venv_ocr
        Write-Host "✅ Virtual environment creado" -ForegroundColor Green
    } else {
        Write-Host "✅ Virtual environment ya existe" -ForegroundColor Green
    }
    Write-Host ""
    
    # Activar virtual environment
    Write-Host "Activando virtual environment..." -ForegroundColor Yellow
    .\venv_ocr\Scripts\Activate.ps1
    Write-Host "✅ Virtual environment activado" -ForegroundColor Green
    Write-Host ""
    
    # Actualizar pip
    Write-Host "Actualizando pip..." -ForegroundColor Yellow
    python -m pip install --upgrade pip setuptools wheel
    Write-Host "✅ pip actualizado" -ForegroundColor Green
    Write-Host ""
    
    # Instalar requerimientos
    Write-Host "Instalando dependencias Python..." -ForegroundColor Yellow
    Write-Host "⚠️  Esto puede tardar 15-30 minutos la primera vez" -ForegroundColor Yellow
    pip install -r requirements.txt
    Write-Host "✅ Dependencias Python instaladas" -ForegroundColor Green
    Write-Host ""
    
    cd ..
} else {
    Write-Host "❌ No se encontró backend/requirements.txt" -ForegroundColor Red
    Write-Host "Verifica la estructura del proyecto" -ForegroundColor Red
    exit 1
}

# 7. Descargar modelos de OCR
Write-Host "🧠 PASO 7: Descargar modelos de OCR" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
$downloadModels = Read-Host "¿Deseas descargar los modelos de OCR ahora? (s/n - puede tardar 10-20 minutos)"
if ($downloadModels -eq 's' -or $downloadModels -eq 'S' -or $downloadModels -eq 'y' -or $downloadModels -eq 'Y') {
    Write-Host "Descargando modelos..." -ForegroundColor Yellow
    Write-Host "⚠️  Primera descarga tardará 10-20 minutos" -ForegroundColor Yellow
    
    cd backend
    .\venv_ocr\Scripts\Activate.ps1
    python scripts/setup_ocr_models.py
    cd ..
    
    Write-Host "✅ Modelos descargados" -ForegroundColor Green
} else {
    Write-Host "⏭️  Modelos omitidos (puedes descargarlos ejecutando: python backend/scripts/setup_ocr_models.py)" -ForegroundColor Yellow
}
Write-Host ""

# 8. Verificación final
Write-Host "✔️  PASO 8: Verificación Final" -ForegroundColor Cyan
Write-Host "=============================@" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ejecutando verificación de requerimientos..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File check-requirements.ps1
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🎉 ¡INSTALACIÓN COMPLETADA!                              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Green
Write-Host "1. Revisa el archivo SYSTEM_REQUIREMENTS.md para más detalles" -ForegroundColor White
Write-Host "2. Configura las variables de entorno en .env" -ForegroundColor White
Write-Host "3. Instala dependencias frontend: cd frontend && npm install" -ForegroundColor White
Write-Host "4. Instala dependencias backend: cd backend && npm install" -ForegroundColor White
Write-Host "5. Ejecuta: docker-compose up -d" -ForegroundColor White
Write-Host "6. Inicia el proyecto: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Documentación importante:" -ForegroundColor Cyan
Write-Host "  📄 SYSTEM_REQUIREMENTS.md - Guía detallada de requisitos" -ForegroundColor White
Write-Host "  📄 QUICKSTART.md - Inicio rápido del proyecto" -ForegroundColor White
Write-Host "  📄 PADDLE_OCR_SETUP.md - Configuración específica de PaddleOCR" -ForegroundColor White
Write-Host ""
