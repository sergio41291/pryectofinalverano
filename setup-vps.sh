#!/bin/bash

#=============================================================================
# LearnMind AI - VPS Initial Setup Script
# Prepara el VPS con todas las dependencias necesarias
#=============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=======================================================================${NC}"
echo -e "${BLUE}          LearnMind AI - VPS Setup                                     ${NC}"
echo -e "${BLUE}=======================================================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Este script debe ejecutarse como root${NC}"
    echo -e "Ejecuta: ${BLUE}sudo ./setup-vps.sh${NC}"
    exit 1
fi

# Get the actual user if running with sudo
ACTUAL_USER="${SUDO_USER:-$USER}"
if [ "$ACTUAL_USER" = "root" ]; then
    ACTUAL_USER="sw1"
fi

echo -e "${GREEN}Ejecutando como root, configurando para usuario: $ACTUAL_USER${NC}\n"

# Step 1: Update system
echo -e "\n${YELLOW}[1/8] Actualizando sistema...${NC}"
apt-get update
apt-get upgrade -y
echo -e "${GREEN}✓ Sistema actualizado${NC}"

# Step 2: Install Docker
echo -e "\n${YELLOW}[2/8] Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $ACTUAL_USER
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker instalado${NC}"
else
    echo -e "${GREEN}✓ Docker ya está instalado${NC}"
fi

# Step 3: Install Docker Compose
echo -e "\n${YELLOW}[3/8] Instalando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose instalado${NC}"
else
    echo -e "${GREEN}✓ Docker Compose ya está instalado${NC}"
fi

# Step 4: Install Node.js (v20 LTS)
echo -e "\n${YELLOW}[4/8] Instalando Node.js 20 LTS...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js instalado: $(node -v)${NC}"
else
    echo -e "${GREEN}✓ Node.js ya está instalado: $(node -v)${NC}"
fi

# Step 5: Install PM2
echo -e "\n${YELLOW}[5/8] Instalando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    npm install -g serve  # Para servir el frontend
    echo -e "${GREEN}✓ PM2 instalado${NC}"
else
    echo -e "${GREEN}✓ PM2 ya está instalado${NC}"
fi

# Step 6: Install Python 3 and pip
echo -e "\n${YELLOW}[6/8] Instalando Python 3...${NC}"
apt-get install -y python3 python3-pip python3-venv
echo -e "${GREEN}✓ Python instalado: $(python3 --version)${NC}"

# Step 7: Configure firewall
echo -e "\n${YELLOW}[7/8] Configurando firewall...${NC}"
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
echo -e "${GREEN}✓ Firewall configurado${NC}"

# Step 8: Create project directory
echo -e "\n${YELLOW}[8/8] Creando directorio del proyecto...${NC}"
mkdir -p /home/sw1/pryectofinalverano
chown -R sw1:sw1 /home/sw1/pryectofinalverano
echo -e "${GREEN}✓ Directorio creado: /home/sw1/pryectofinalverano${NC}"

echo -e "\n${BLUE}=======================================================================${NC}"
echo -e "${GREEN}VPS Setup completado exitosamente! ✓${NC}"
echo -e "${BLUE}=======================================================================${NC}"

echo -e "\n${YELLOW}IMPORTANTE:${NC}"
echo -e "  1. ${RED}Si instaló Docker por primera vez, cierra sesión y reconecta${NC}"
echo -e "     ${BLUE}exit${NC}"
echo -e "     ${BLUE}ssh sw1@tu-servidor${NC}"
echo -e ""
echo -e "  2. Clona el proyecto en /home/sw1/pryectofinalverano:"
echo -e "     ${BLUE}cd /home/sw1/pryectofinalverano${NC}"
echo -e "     ${BLUE}git clone https://github.com/sergio41291/pryectofinalverano.git .${NC}"
echo -e ""
echo -e "  3. Configura .env:"
echo -e "     ${BLUE}cp .env.hybrid .env${NC}"
echo -e "     ${BLUE}nano .env${NC}"
echo -e "     ${YELLOW}(Cambia todas las contraseñas y API keys)${NC}"
echo -e ""
echo -e "  4. Ejecuta deployment:"
echo -e "     ${BLUE}chmod +x deploy-hybrid.sh${NC}"
echo -e "     ${BLUE}./deploy-hybrid.sh${NC}"

echo -e "\n${GREEN}Sistema listo para deployment! 🚀${NC}"
