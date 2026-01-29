#!/bin/bash
# Verificación de ambiente para Phase 1 - LearnMind AI
# Valida que todas las dependencias estén instaladas y el sistema está listo para pruebas

set -e

echo "🔍 LearnMind AI - Phase 1 Environment Verification"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Función para verificar comando
check_command() {
    local cmd=$1
    local name=$2
    
    if command -v $cmd &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        echo -e "${GREEN}✅${NC} $name: $version"
    else
        echo -e "${RED}❌${NC} $name: NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
}

# Función para verificar archivo
check_file() {
    local file=$1
    local name=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $name: Found"
    else
        echo -e "${RED}❌${NC} $name: NOT FOUND at $file"
        ERRORS=$((ERRORS + 1))
    fi
}

# Función para verificar servicio
check_service() {
    local port=$1
    local name=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $name (port $port): RUNNING"
    else
        echo -e "${YELLOW}⚠️${NC} $name (port $port): NOT RUNNING"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo "📋 System Requirements:"
echo "----------------------"
check_command "node" "Node.js"
check_command "npm" "NPM"
check_command "python" "Python"
check_command "git" "Git"
echo ""

echo "🗄️  Database Setup:"
echo "-------------------"
check_service 5432 "PostgreSQL"
check_service 6379 "Redis"
echo ""

echo "📦 Backend Files:"
echo "-----------------"
check_file "./package.json" "package.json"
check_file "./src/main.ts" "main.ts"
check_file "./requirements.txt" "requirements.txt"
check_file "./scripts/paddle_ocr_service.py" "paddle_ocr_service.py"
echo ""

echo "🔧 Node Modules:"
echo "----------------"
if [ -d "./node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules: Installed ($(ls -1 node_modules | wc -l) packages)"
else
    echo -e "${YELLOW}⚠️${NC} node_modules: NOT INSTALLED - Run: npm install"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "🐍 Python Dependencies:"
echo "----------------------"
# Verificar PaddleOCR
if python -c "import paddleocr; print(paddleocr.__version__)" 2>/dev/null; then
    VERSION=$(python -c "import paddleocr; print(paddleocr.__version__)" 2>/dev/null)
    echo -e "${GREEN}✅${NC} PaddleOCR: $VERSION"
else
    echo -e "${YELLOW}⚠️${NC} PaddleOCR: NOT INSTALLED - Run: pip install -r requirements.txt"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar Pillow
if python -c "from PIL import Image; print('OK')" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Pillow: Installed"
else
    echo -e "${YELLOW}⚠️${NC} Pillow: NOT INSTALLED - Run: pip install Pillow"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar numpy
if python -c "import numpy" 2>/dev/null; then
    VERSION=$(python -c "import numpy; print(numpy.__version__)" 2>/dev/null)
    echo -e "${GREEN}✅${NC} NumPy: $VERSION"
else
    echo -e "${YELLOW}⚠️${NC} NumPy: NOT INSTALLED - Run: pip install numpy"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "📋 Configuration Files:"
echo "----------------------"
check_file "./.env" ".env"
check_file "./tsconfig.json" "tsconfig.json"
check_file "./load-test-config.yml" "load-test-config.yml"
check_file "./run-tests.sh" "run-tests.sh"
echo ""

echo "🧪 Frontend Status:"
echo "-------------------"
if [ -d "../frontend" ]; then
    if [ -f "../frontend/package.json" ]; then
        echo -e "${GREEN}✅${NC} Frontend project found"
    fi
else
    echo -e "${YELLOW}⚠️${NC} Frontend folder not found"
fi
echo ""

echo "📊 Summary:"
echo "----------"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED - Ready for testing!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warnings - Some optional components missing${NC}"
    echo "   Run: npm install && pip install -r requirements.txt"
    exit 0
else
    echo -e "${RED}❌ $ERRORS ERRORS FOUND - Fix issues before testing${NC}"
    exit 1
fi
