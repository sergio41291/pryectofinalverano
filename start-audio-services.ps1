#!/usr/bin/env powershell

# LearnMind Audio System - Startup Script
# This script starts the backend and frontend in separate terminals

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "LearnMind Audio Processing System" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
$nodeCheck = node --version 2>$null
if ($null -eq $nodeCheck) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js $nodeCheck found" -ForegroundColor Green

# Check if Docker is running (for database)
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerCheck = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Docker is not running or not accessible" -ForegroundColor Yellow
    Write-Host "  Make sure MongoDB and Redis are running before starting the backend" -ForegroundColor Yellow
} else {
    Write-Host "✓ Docker is accessible" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host ""

# Get the workspace root
$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start backend
Write-Host "1. Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$workspaceRoot\backend'; npm run start:dev" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "2. Starting frontend development server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$workspaceRoot\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Services Starting" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Wait 10-15 seconds for both services to fully start" -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend will open automatically when ready" -ForegroundColor Yellow
Write-Host ""
Write-Host "To test audio upload:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "2. Login with your credentials" -ForegroundColor White
Write-Host "3. Click 'Audio' tab" -ForegroundColor White
Write-Host "4. Upload an MP3, WAV, or M4A file" -ForegroundColor White
Write-Host "5. Check browser console (F12) for detailed logs" -ForegroundColor White
Write-Host ""
Write-Host "Debug Guide:" -ForegroundColor Cyan
Write-Host "See AUDIO_DEBUG_GUIDE.md for troubleshooting steps" -ForegroundColor White
Write-Host ""
