#!/bin/bash

# LearnMind AI - Installation Script for Linux/macOS
# Ejecutar con: bash install-requirements.sh
# Este script instalará automáticamente todas las dependencias necesarias

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  LearnMind AI - Instalador de Dependencias                ║"
echo "║  Este script instalará automáticamente todos los requisitos║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Detectar OS
OS_TYPE="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_TYPE="linux"
    DISTRO=$(lsb_release -si 2>/dev/null || echo "unknown")
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
fi

echo "Sistema operativo detectado: $OS_TYPE"
echo ""

# Función para instalar en Ubuntu/Debian
install_ubuntu() {
    echo "🐧 INSTALACIÓN PARA UBUNTU/DEBIAN"
    echo "===================================="
    echo ""
    
    # Actualizar repositorios
    echo "📦 PASO 1: Actualizar repositorios"
    echo "==================================="
    sudo apt update
    echo ""
    
    # Build tools
    echo "🔨 PASO 2: Instalar Build Tools"
    echo "================================"
    sudo apt install -y build-essential gcc g++ make libssl-dev libffi-dev
    echo "✅ Build tools instalados"
    echo ""
    
    # Python
    echo "🐍 PASO 3: Instalar Python 3"
    echo "============================="
    sudo apt install -y python3 python3-venv python3-dev python3-pip
    echo "✅ Python instalado"
    echo ""
    
    # Poppler
    echo "📄 PASO 4: Instalar Poppler"
    echo "============================"
    sudo apt install -y poppler-utils
    echo "✅ Poppler instalado"
    echo ""
    
    # FFmpeg
    echo "🎬 PASO 5: Instalar FFmpeg"
    echo "==========================="
    sudo apt install -y ffmpeg
    echo "✅ FFmpeg instalado"
    echo ""
    
    # Tesseract (opcional)
    echo "🔤 PASO 6: ¿Instalar Tesseract OCR? (opcional)"
    echo "=============================================="
    read -p "¿Instalar Tesseract? (s/n): " install_tesseract
    if [[ "$install_tesseract" == "s" || "$install_tesseract" == "S" || "$install_tesseract" == "y" || "$install_tesseract" == "Y" ]]; then
        sudo apt install -y tesseract-ocr tesseract-ocr-spa
        echo "✅ Tesseract instalado"
    else
        echo "⏭️  Tesseract omitido"
    fi
    echo ""
    
    # Dependencias de imagen
    echo "📦 PASO 7: Instalar dependencias de imagen"
    echo "==========================================="
    sudo apt install -y libjpeg-dev zlib1g-dev
    echo "✅ Dependencias de imagen instaladas"
    echo ""
}

# Función para instalar en macOS
install_macos() {
    echo "🍎 INSTALACIÓN PARA MACOS"
    echo "=========================="
    echo ""
    
    # Homebrew
    echo "📦 PASO 1: Verificar Homebrew"
    echo "=============================="
    if ! command -v brew &> /dev/null; then
        echo "Instalando Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        echo "✅ Homebrew instalado"
    else
        echo "✅ Homebrew ya está instalado"
    fi
    echo ""
    
    # Xcode Command Line Tools
    echo "🔨 PASO 2: Verificar Xcode Command Line Tools"
    echo "=============================================="
    if ! xcode-select --print-path &> /dev/null; then
        echo "Instalando Xcode Command Line Tools..."
        xcode-select --install
        echo "✅ Xcode Command Line Tools instalados"
    else
        echo "✅ Xcode Command Line Tools ya están instalados"
    fi
    echo ""
    
    # Python
    echo "🐍 PASO 3: Instalar Python 3"
    echo "============================="
    brew install python3
    echo "✅ Python instalado"
    echo ""
    
    # Poppler
    echo "📄 PASO 4: Instalar Poppler"
    echo "============================"
    brew install poppler
    echo "✅ Poppler instalado"
    echo ""
    
    # FFmpeg
    echo "🎬 PASO 5: Instalar FFmpeg"
    echo "==========================="
    brew install ffmpeg
    echo "✅ FFmpeg instalado"
    echo ""
    
    # Tesseract (opcional)
    echo "🔤 PASO 6: ¿Instalar Tesseract OCR? (opcional)"
    echo "=============================================="
    read -p "¿Instalar Tesseract? (s/n): " install_tesseract
    if [[ "$install_tesseract" == "s" || "$install_tesseract" == "S" || "$install_tesseract" == "y" || "$install_tesseract" == "Y" ]]; then
        brew install tesseract
        echo "✅ Tesseract instalado"
    else
        echo "⏭️  Tesseract omitido"
    fi
    echo ""
}

# Instalación específica del OS
if [[ "$OS_TYPE" == "linux" ]]; then
    if [[ "$DISTRO" == "Ubuntu" || "$DISTRO" == "Debian" ]]; then
        install_ubuntu
    else
        echo "⚠️  Distribución no soportada: $DISTRO"
        echo "Adapta el script manualmente según tu distribución"
        exit 1
    fi
elif [[ "$OS_TYPE" == "macos" ]]; then
    install_macos
else
    echo "❌ Sistema operativo no soportado"
    exit 1
fi

# Dependencias Python (común para todos)
echo "🐍 PASO FINAL: Instalar dependencias Python"
echo "============================================"
echo ""

cd backend || {
    echo "❌ No se encontró el directorio backend"
    exit 1
}

# Crear virtual environment
echo "Creando virtual environment..."
python3 -m venv venv_ocr
echo "✅ Virtual environment creado"
echo ""

# Activar virtual environment
echo "Activando virtual environment..."
source venv_ocr/bin/activate
echo "✅ Virtual environment activado"
echo ""

# Actualizar pip
echo "Actualizando pip..."
pip install --upgrade pip setuptools wheel
echo "✅ pip actualizado"
echo ""

# Instalar requerimientos
echo "Instalando dependencias Python..."
echo "⚠️  Esto puede tardar 15-30 minutos la primera vez"
pip install -r requirements.txt
echo "✅ Dependencias Python instaladas"
echo ""

# Descargar modelos de OCR
echo "🧠 ¿Descargar modelos de OCR?"
echo "============================="
read -p "¿Descargar los modelos de OCR ahora? (s/n - puede tardar 10-20 minutos): " download_models
if [[ "$download_models" == "s" || "$download_models" == "S" || "$download_models" == "y" || "$download_models" == "Y" ]]; then
    echo "Descargando modelos..."
    echo "⚠️  Primera descarga tardará 10-20 minutos"
    python scripts/setup_ocr_models.py
    echo "✅ Modelos descargados"
else
    echo "⏭️  Modelos omitidos (puedes descargarlos ejecutando: python scripts/setup_ocr_models.py)"
fi
echo ""

cd ..

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✔️  ¡INSTALACIÓN COMPLETADA!                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximos pasos:"
echo "1. Revisa el archivo SYSTEM_REQUIREMENTS.md para más detalles"
echo "2. Configura las variables de entorno en .env"
echo "3. Instala dependencias frontend: cd frontend && npm install"
echo "4. Instala dependencias backend: cd backend && npm install"
echo "5. Ejecuta: docker-compose up -d"
echo "6. Inicia el proyecto: npm run dev"
echo ""
echo "Documentación importante:"
echo "  📄 SYSTEM_REQUIREMENTS.md - Guía detallada de requisitos"
echo "  📄 QUICKSTART.md - Inicio rápido del proyecto"
echo "  📄 PADDLE_OCR_SETUP.md - Configuración específica de PaddleOCR"
echo ""
