#!/bin/bash
# LearnMind AI - Verificación de Requisitos

echo "🔍 Verificando requisitos de LearnMind AI..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TOTAL=0
OK=0

check_command() {
    local cmd=$1
    local name=$2
    
    ((TOTAL++))
    
    if command -v $cmd &> /dev/null; then
        echo -e "${GREEN}✅${NC} $name está instalado"
        ((OK++))
    else
        echo -e "${RED}❌${NC} $name NO está instalado"
        echo "   → Instalar desde: $3"
    fi
    echo ""
}

# Verificar requisitos
echo "📦 REQUISITOS PRINCIPALES"
echo "=========================="
check_command "docker" "Docker" "https://www.docker.com/products/docker-desktop"
check_command "docker-compose" "Docker Compose" "Incluido en Docker Desktop"
check_command "git" "Git" "https://git-scm.com/"
check_command "node" "Node.js" "https://nodejs.org/"
check_command "npm" "NPM" "Incluido en Node.js"
check_command "python" "Python 3.9+" "https://www.python.org/"

echo ""
echo "🔌 SERVICIOS DOCKER"
echo "===================="

if command -v docker &> /dev/null; then
    if docker-compose ps &> /dev/null 2>&1; then
        echo -e "${YELLOW}ℹ️${NC}  Docker está corriendo"
        
        # Verificar servicios específicos
        if docker ps --filter "name=learnpmind_postgres" --format "{{.Names}}" | grep -q .; then
            echo -e "${GREEN}✅${NC} PostgreSQL está activo"
            ((OK++))
        else
            echo -e "${RED}❌${NC} PostgreSQL NO está activo"
            echo "   → Ejecutar: docker-compose up -d"
        fi
        ((TOTAL++))
        
        if docker ps --filter "name=learnpmind_redis" --format "{{.Names}}" | grep -q .; then
            echo -e "${GREEN}✅${NC} Redis está activo"
            ((OK++))
        else
            echo -e "${RED}❌${NC} Redis NO está activo"
        fi
        ((TOTAL++))
        
        if docker ps --filter "name=learnpmind_mongodb" --format "{{.Names}}" | grep -q .; then
            echo -e "${GREEN}✅${NC} MongoDB está activo"
            ((OK++))
        else
            echo -e "${RED}❌${NC} MongoDB NO está activo"
        fi
        ((TOTAL++))
        
        if docker ps --filter "name=learnpmind_minio" --format "{{.Names}}" | grep -q .; then
            echo -e "${GREEN}✅${NC} MinIO está activo"
            ((OK++))
        else
            echo -e "${RED}❌${NC} MinIO NO está activo"
        fi
        ((TOTAL++))
    else
        echo -e "${RED}❌${NC} Docker Compose no está ejecutándose"
        echo "   → Ejecutar: docker-compose up -d"
    fi
else
    echo -e "${YELLOW}⚠️${NC}  Docker no disponible (verificar instalación)"
fi

echo ""
echo "🐍 PYTHON PACKAGES"
echo "=================="

if command -v python &> /dev/null; then
    if python -c "import paddleocr" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} PaddleOCR instalado"
        ((OK++))
    else
        echo -e "${RED}❌${NC} PaddleOCR NO instalado"
        echo "   → Instalar: pip install paddleocr"
    fi
    ((TOTAL++))
    
    if python -c "import cv2" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} OpenCV instalado"
        ((OK++))
    else
        echo -e "${RED}❌${NC} OpenCV NO instalado"
        echo "   → Instalar: pip install opencv-python"
    fi
    ((TOTAL++))
fi

echo ""
echo "📂 ARCHIVOS CONFIGURACIÓN"
echo "========================="

if [ -f ".env" ]; then
    echo -e "${GREEN}✅${NC} Archivo .env existe"
    ((OK++))
else
    echo -e "${RED}❌${NC} Archivo .env NO existe"
    echo "   → Copiar: cp .env.example .env"
fi
((TOTAL++))

if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅${NC} Archivo .env.example existe"
    ((OK++))
else
    echo -e "${RED}❌${NC} Archivo .env.example NO existe"
fi
((TOTAL++))

if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✅${NC} Archivo docker-compose.yml existe"
    ((OK++))
else
    echo -e "${RED}❌${NC} Archivo docker-compose.yml NO existe"
fi
((TOTAL++))

echo ""
echo "📚 DOCUMENTACIÓN"
echo "==============="

if [ -f "ROADMAP.md" ]; then
    echo -e "${GREEN}✅${NC} ROADMAP.md existe"
    ((OK++))
else
    echo -e "${YELLOW}⚠️${NC}  ROADMAP.md no encontrado"
fi
((TOTAL++))

if [ -f "QUICKSTART.md" ]; then
    echo -e "${GREEN}✅${NC} QUICKSTART.md existe"
    ((OK++))
else
    echo -e "${YELLOW}⚠️${NC}  QUICKSTART.md no encontrado"
fi
((TOTAL++))

echo ""
echo "🎯 RESULTADO FINAL"
echo "=================="
echo -e "Verificaciones pasadas: ${GREEN}${OK}/${TOTAL}${NC}"
echo ""

if [ $OK -eq $TOTAL ]; then
    echo -e "${GREEN}🎉 ¡LISTO PARA COMENZAR!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Leer QUICKSTART.md"
    echo "2. Revisar ROADMAP.md"
    echo "3. Configurar variables en .env"
    echo "4. npm install en frontend y backend"
    exit 0
elif [ $OK -ge $((TOTAL - 3)) ]; then
    echo -e "${YELLOW}⚠️  CASI LISTO${NC}"
    echo ""
    echo "Faltan pocos requisitos. Revisa los detalles arriba."
    exit 1
else
    echo -e "${RED}❌ PENDIENTES IMPORTANTES${NC}"
    echo ""
    echo "Instala los requisitos faltantes antes de continuar."
    exit 2
fi
