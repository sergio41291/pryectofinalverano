#!/bin/bash

#=============================================================================
# LearnMind AI - Hybrid Deployment Script
# Docker: Solo servicios de infraestructura (Postgres, MongoDB, Redis, MinIO, Nginx)
# Native: Backend y Frontend corriendo directamente en el VPS con PM2
#=============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directories
PROJECT_ROOT="/home/sw1/pryectofinalverano"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
LOGS_DIR="${PROJECT_ROOT}/logs"

echo -e "${BLUE}=======================================================================${NC}"
echo -e "${BLUE}          LearnMind AI - Hybrid Deployment                              ${NC}"
echo -e "${BLUE}=======================================================================${NC}"

# Step 1: Check prerequisites
echo -e "\n${YELLOW}[1/9] Verificando prerrequisitos...${NC}"

command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: Docker no está instalado${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Error: Docker Compose no está instalado${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js no está instalado${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm no está instalado${NC}"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo -e "${RED}Error: PM2 no está instalado. Ejecuta: npm install -g pm2${NC}"; exit 1; }

echo -e "${GREEN}✓ Todos los prerrequisitos están instalados${NC}"

# Step 2: Check .env file
echo -e "\n${YELLOW}[2/9] Verificando archivo .env...${NC}"

if [ ! -f "${PROJECT_ROOT}/.env" ]; then
    echo -e "${RED}Error: Archivo .env no encontrado${NC}"
    echo "Copia .env.production a .env y configúralo:"
    echo "  cp ${PROJECT_ROOT}/.env.production ${PROJECT_ROOT}/.env"
    echo "  nano ${PROJECT_ROOT}/.env"
    exit 1
fi

echo -e "${GREEN}✓ Archivo .env encontrado${NC}"

# Step 3: Create logs directory
echo -e "\n${YELLOW}[3/9] Creando directorios necesarios...${NC}"

mkdir -p "${LOGS_DIR}"
mkdir -p "${BACKEND_DIR}/credentials"

echo -e "${GREEN}✓ Directorios creados${NC}"

# Step 4: Stop existing services
echo -e "\n${YELLOW}[4/9] Deteniendo servicios existentes...${NC}"

# Stop PM2 processes
pm2 stop all || true
pm2 delete all || true

# Stop Docker containers
cd "${PROJECT_ROOT}"
docker-compose -f docker-compose.infrastructure.yml down || true

echo -e "${GREEN}✓ Servicios detenidos${NC}"

# Step 5: Start infrastructure services with Docker
echo -e "\n${YELLOW}[5/9] Iniciando servicios de infraestructura (Docker)...${NC}"

cd "${PROJECT_ROOT}"
docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for services to be healthy
echo "Esperando a que los servicios estén saludables..."
sleep 10

# Check health
docker-compose -f docker-compose.infrastructure.yml ps

echo -e "${GREEN}✓ Servicios de infraestructura iniciados${NC}"

# Step 6: Setup and build backend
echo -e "\n${YELLOW}[6/9] Configurando backend...${NC}"

cd "${BACKEND_DIR}"

# Install dependencies (solo si no existen)
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del backend..."
    npm install --production
else
    echo "Dependencias del backend ya instaladas"
fi

# Build backend
echo "Compilando backend..."
npm run build

# Run migrations
echo "Ejecutando migraciones de base de datos..."
npm run migration:run || echo "Migraciones ya ejecutadas o no necesarias"

echo -e "${GREEN}✓ Backend configurado${NC}"

# Step 7: Setup and build frontend
echo -e "\n${YELLOW}[7/9] Configurando frontend...${NC}"

cd "${FRONTEND_DIR}"

# Install dependencies (solo si no existen)
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del frontend..."
    npm install --production
else
    echo "Dependencias del frontend ya instaladas"
fi

# Build frontend
echo "Compilando frontend..."
npm run build

echo -e "${GREEN}✓ Frontend configurado${NC}"

# Step 8: Setup OCR service (Python)
echo -e "\n${YELLOW}[8/9] Configurando servicio OCR...${NC}"

cd "${BACKEND_DIR}"

# Check if virtual environment exists
if [ ! -d "venv_ocr" ]; then
    echo "Creando entorno virtual de Python..."
    python3 -m venv venv_ocr
    source venv_ocr/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    deactivate
else
    echo "Entorno virtual ya existe"
fi

echo -e "${GREEN}✓ Servicio OCR configurado${NC}"

# Step 9: Start applications with PM2
echo -e "\n${YELLOW}[9/9] Iniciando aplicaciones con PM2...${NC}"

cd "${PROJECT_ROOT}"

# Start all applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

echo -e "${GREEN}✓ Aplicaciones iniciadas con PM2${NC}"

# Display status
echo -e "\n${BLUE}=======================================================================${NC}"
echo -e "${BLUE}                    Deployment Completado                               ${NC}"
echo -e "${BLUE}=======================================================================${NC}"

echo -e "\n${GREEN}Servicios de infraestructura (Docker):${NC}"
docker-compose -f docker-compose.infrastructure.yml ps

echo -e "\n${GREEN}Aplicaciones (PM2):${NC}"
pm2 list

echo -e "\n${BLUE}=======================================================================${NC}"
echo -e "${GREEN}URLs de acceso:${NC}"
echo -e "  Frontend:  ${BLUE}https://learnmind-ai.jkhoster.com${NC}"
echo -e "  API:       ${BLUE}https://learnmind-ai.jkhoster.com/api${NC}"
echo -e "  API Docs:  ${BLUE}https://learnmind-ai.jkhoster.com/api/docs${NC}"
echo -e "  Health:    ${BLUE}https://learnmind-ai.jkhoster.com/api/health${NC}"

echo -e "\n${GREEN}Comandos útiles:${NC}"
echo -e "  Ver logs PM2:              ${BLUE}pm2 logs${NC}"
echo -e "  Ver logs Docker:           ${BLUE}docker-compose -f docker-compose.infrastructure.yml logs -f${NC}"
echo -e "  Reiniciar backend:         ${BLUE}pm2 restart learnmind-backend${NC}"
echo -e "  Reiniciar frontend:        ${BLUE}pm2 restart learnmind-frontend${NC}"
echo -e "  Ver estado:                ${BLUE}pm2 status${NC}"
echo -e "  Ver monitoreo:             ${BLUE}pm2 monit${NC}"

echo -e "\n${BLUE}=======================================================================${NC}"
echo -e "${GREEN}Deployment completado exitosamente! 🚀${NC}"
echo -e "${BLUE}=======================================================================${NC}"
