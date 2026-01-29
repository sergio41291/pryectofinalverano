# LearnMind AI - Phase 1 Quick Start (Windows PowerShell)
# Ejecutar: powershell -ExecutionPolicy Bypass -File .\start-phase1.ps1

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  LearnMind AI - Phase 1 Quick Start        ║" -ForegroundColor Cyan
Write-Host "║  Windows PowerShell Edition                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuración
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

# Función para validar requisitos
function Test-Requirement {
    param(
        [string]$Command,
        [string]$Name,
        [string]$MinVersion
    )
    
    try {
        $result = & $Command --version 2>$null | Select-Object -First 1
        Write-Host "✅ $Name`: $result" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $Name`: NOT FOUND" -ForegroundColor Red
        return $false
    }
}

# Verificar requisitos
Write-Host "📋 Checking Requirements..." -ForegroundColor Yellow
Write-Host ""

$hasNode = Test-Requirement "node" "Node.js"
$hasNpm = Test-Requirement "npm" "NPM"
$hasPython = Test-Requirement "python" "Python"
$hasGit = Test-Requirement "git" "Git"

Write-Host ""

if (-not ($hasNode -and $hasNpm -and $hasPython)) {
    Write-Host "❌ Missing required dependencies!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install:" -ForegroundColor Yellow
    Write-Host "  - Node.js from https://nodejs.org/" -ForegroundColor Gray
    Write-Host "  - Python from https://www.python.org/" -ForegroundColor Gray
    exit 1
}

# Menú de opciones
Write-Host "Select operation:" -ForegroundColor Cyan
Write-Host "  1. Install dependencies (npm + pip)" -ForegroundColor Gray
Write-Host "  2. Start backend (npm run start:dev)" -ForegroundColor Gray
Write-Host "  3. Start frontend (npm run dev)" -ForegroundColor Gray
Write-Host "  4. Run tests (npm run test)" -ForegroundColor Gray
Write-Host "  5. Run full test suite (bash run-tests.sh)" -ForegroundColor Gray
Write-Host "  6. Health check (curl http://localhost:3001/api/health)" -ForegroundColor Gray
Write-Host "  7. Open Frontend (http://localhost:5173)" -ForegroundColor Gray
Write-Host "  8. Verify environment (bash verify-environment.sh)" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter number (1-8)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔧 Installing Dependencies..." -ForegroundColor Cyan
        
        Push-Location $backendDir
        Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
        npm install
        
        Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow
        pip install -r requirements.txt
        Pop-Location
        
        Push-Location $frontendDir
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
        Pop-Location
        
        Write-Host ""
        Write-Host "✅ Dependencies installed!" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "🚀 Starting Backend (localhost:3001)..." -ForegroundColor Cyan
        Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        Push-Location $backendDir
        npm run start:dev
        Pop-Location
    }
    
    "3" {
        Write-Host ""
        Write-Host "⚡ Starting Frontend (localhost:5173)..." -ForegroundColor Cyan
        Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        Push-Location $frontendDir
        npm run dev
        Pop-Location
    }
    
    "4" {
        Write-Host ""
        Write-Host "🧪 Running Unit Tests..." -ForegroundColor Cyan
        Push-Location $backendDir
        npm run test
        Pop-Location
    }
    
    "5" {
        Write-Host ""
        Write-Host "📊 Running Full Test Suite..." -ForegroundColor Cyan
        Write-Host "   This will run: unit tests, E2E tests, and load tests" -ForegroundColor Gray
        Write-Host ""
        
        Push-Location $backendDir
        
        # Check if bash is available
        if (Get-Command bash -ErrorAction SilentlyContinue) {
            bash run-tests.sh
        }
        else {
            Write-Host "⚠️  Git Bash not found. Running individual tests..." -ForegroundColor Yellow
            Write-Host ""
            npm run test
            npm run test:e2e
        }
        
        Pop-Location
    }
    
    "6" {
        Write-Host ""
        Write-Host "🏥 Checking API Health..." -ForegroundColor Cyan
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing
            Write-Host "✅ API is running!" -ForegroundColor Green
            Write-Host $response.Content -ForegroundColor White
        }
        catch {
            Write-Host "❌ API is not running" -ForegroundColor Red
            Write-Host "   Start backend: option 2" -ForegroundColor Gray
        }
    }
    
    "7" {
        Write-Host ""
        Write-Host "🌐 Opening Frontend..." -ForegroundColor Cyan
        Start-Process "http://localhost:5173"
        Write-Host "✅ Frontend opened in default browser" -ForegroundColor Green
    }
    
    "8" {
        Write-Host ""
        Write-Host "🔍 Verifying Environment..." -ForegroundColor Cyan
        Push-Location $backendDir
        
        if (Get-Command bash -ErrorAction SilentlyContinue) {
            bash verify-environment.sh
        }
        else {
            Write-Host "⚠️  Bash not found. Manual checks:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "PostgreSQL: $(if (Test-Connection localhost -TcpPort 5432 -ErrorAction SilentlyContinue) { 'Running' } else { 'Not running' })" -ForegroundColor Gray
            Write-Host "Redis:      $(if (Test-Connection localhost -TcpPort 6379 -ErrorAction SilentlyContinue) { 'Running' } else { 'Not running' })" -ForegroundColor Gray
            
            if (Test-Path "requirements.txt") {
                Write-Host "Python deps: Checking..." -ForegroundColor Gray
                python -c "import paddleocr; print('PaddleOCR: OK')" 2>$null || Write-Host "PaddleOCR: NOT INSTALLED" -ForegroundColor Red
            }
        }
        
        Pop-Location
    }
    
    default {
        Write-Host "Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
