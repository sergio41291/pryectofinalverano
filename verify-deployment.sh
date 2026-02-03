#!/bin/bash
# =============================================================================
# Verificación Pre-Deployment para Producción
# =============================================================================

set -e

echo "=========================================="
echo "LearnMind AI - Verificación Pre-Deployment"
echo "=========================================="
echo ""

ERRORS=0

# Verificar que existe .env.production
if [ ! -f ".env.production" ]; then
    echo "❌ ERROR: Archivo .env.production no encontrado"
    echo "   Ejecuta: cp .env.production .env"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Archivo .env.production encontrado"
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ ERROR: Docker no está instalado"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Docker instalado: $(docker --version | head -n1)"
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ ERROR: Docker Compose no está instalado"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Docker Compose instalado: $(docker-compose --version | head -n1)"
fi

# Verificar archivos críticos
CRITICAL_FILES=(
    "docker-compose.prod.yml"
    "Dockerfile.backend.prod"
    "Dockerfile.frontend.prod"
    "nginx/nginx.conf"
    "deploy.sh"
    "setup-ssl.sh"
)

echo ""
echo "Verificando archivos críticos..."
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ ERROR: $file no encontrado"
        ERRORS=$((ERRORS + 1))
    fi
done

# Verificar directorio credentials
echo ""
echo "Verificando directorios..."
if [ -d "backend/credentials" ]; then
    echo "✅ backend/credentials existe"
else
    echo "⚠️  ADVERTENCIA: backend/credentials no existe (se creará automáticamente)"
fi

# Verificar permisos de scripts
echo ""
echo "Verificando permisos de scripts..."
if [ -x "deploy.sh" ]; then
    echo "✅ deploy.sh es ejecutable"
else
    echo "⚠️  ADVERTENCIA: deploy.sh no es ejecutable"
    echo "   Ejecuta: chmod +x deploy.sh"
fi

if [ -x "setup-ssl.sh" ]; then
    echo "✅ setup-ssl.sh es ejecutable"
else
    echo "⚠️  ADVERTENCIA: setup-ssl.sh no es ejecutable"
    echo "   Ejecuta: chmod +x setup-ssl.sh"
fi

# Resumen
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ VERIFICACIÓN EXITOSA"
    echo "=========================================="
    echo ""
    echo "El sistema está listo para deployment."
    echo ""
    echo "Próximos pasos:"
    echo "1. Revisa y edita .env.production con tus credenciales"
    echo "2. Asegúrate de tener las API keys (Anthropic, Google, Stripe)"
    echo "3. Ejecuta: ./deploy.sh"
    echo ""
else
    echo "❌ VERIFICACIÓN FALLÓ - $ERRORS ERROR(ES)"
    echo "=========================================="
    echo ""
    echo "Por favor corrige los errores antes de deployar."
    echo ""
    exit 1
fi
