@echo off
REM Set environment variables BEFORE starting Node
setx PADDLE_USE_MKLDNN 0
setx MKLDNN_VERBOSE 0
setx OMP_NUM_THREADS 1
setx OPENBLAS_NUM_THREADS 1

REM Restart any existing Node processes
taskkill /F /IM node.exe 2>nul

REM Change to backend directory and start the server
cd /d "C:\work\U\pryectofinalverano\backend"
npm run start:dev
