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
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}No ejecutes este script como root. Usa un usuario normal con sudo.${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "\n${YELLOW}[1/8] Actualizando sistema...${NC}"
sudo apt-get update
sudo apt-get upgrade -y
echo -e "${GREEN}✓ Sistema actualizado${NC}"

# Step 2: Install Docker
echo -e "\n${YELLOW}[2/8] Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker instalado${NC}"
else
    echo -e "${GREEN}✓ Docker ya está instalado${NC}"
fi

# Step 3: Install Docker Compose
echo -e "\n${YELLOW}[3/8] Instalando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose instalado${NC}"
else
    echo -e "${GREEN}✓ Docker Compose ya está instalado${NC}"
fi

# Step 4: Install Node.js (v20 LTS)
echo -e "\n${YELLOW}[4/8] Instalando Node.js 20 LTS...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js instalado: $(node -v)${NC}"
else
    echo -e "${GREEN}✓ Node.js ya está instalado: $(node -v)${NC}"
fi

# Step 5: Install PM2
echo -e "\n${YELLOW}[5/8] Instalando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    sudo npm install -g serve  # Para servir el frontend
    echo -e "${GREEN}✓ PM2 instalado${NC}"
else
    echo -e "${GREEN}✓ PM2 ya está instalado${NC}"
fi

# Step 6: Install Python 3 and pip
echo -e "\n${YELLOW}[6/8] Instalando Python 3...${NC}"
sudo apt-get install -y python3 python3-pip python3-venv
echo -e "${GREEN}✓ Python instalado: $(python3 --version)${NC}"

# Step 7: Configure firewall
echo -e "\n${YELLOW}[7/8] Configurando firewall...${NC}"
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
echo -e "${GREEN}✓ Firewall configurado${NC}"

# Step 8: Create project directory
echo -e "\n${YELLOW}[8/8] Creando directorio del proyecto...${NC}"
sudo mkdir -p /opt/learnmind-ai
sudo chown -R $USER:$USER /opt/learnmind-ai
echo -e "${GREEN}✓ Directorio creado: /opt/learnmind-ai${NC}"

echo -e "\n${BLUE}=======================================================================${NC}"
echo -e "${GREEN}VPS Setup completado exitosamente! ✓${NC}"
echo -e "${BLUE}=======================================================================${NC}"

echo -e "\n${YELLOW}IMPORTANTE:${NC}"
echo -e "  1. ${RED}Cierra sesión y vuelve a conectar para aplicar cambios de Docker${NC}"
echo -e "  2. Clona el proyecto en /opt/learnmind-ai:"
echo -e "     ${BLUE}cd /opt/learnmind-ai${NC}"
echo -e "     ${BLUE}git clone https://github.com/tu-usuario/learnmind-ai.git .${NC}"
echo -e "  3. Configura .env:"
echo -e "     ${BLUE}cp .env.production .env${NC}"
echo -e "     ${BLUE}nano .env${NC}"
echo -e "  4. Ejecuta deployment:"
echo -e "     ${BLUE}chmod +x deploy-hybrid.sh${NC}"
echo -e "     ${BLUE}./deploy-hybrid.sh${NC}"

echo -e "\n${GREEN}Sistema listo para deployment! 🚀${NC}"
