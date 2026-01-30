# 🚀 Guía de Instalación Rápida - LearnMind AI

## Requisitos del Sistema

LearnMind AI requiere varias dependencias del sistema operativo para funcionar correctamente. Esta guía te ayudará a instalarlas.

---

## ⚡ Instalación Rápida (Recomendado)

### Windows
```powershell
# Ejecutar como administrador
powershell -ExecutionPolicy Bypass -File install-requirements.ps1
```

### Linux / macOS
```bash
bash install-requirements.sh
chmod +x install-requirements.sh  # (si es necesario)
```

---

## 📋 Requisitos Mínimos

### Sistema Operativo
- Windows 10+ / Ubuntu 18.04+ / macOS 10.14+
- 4GB RAM mínimo (8GB recomendado)
- 10GB espacio libre en disco

### Lenguajes/Runtimes
- **Node.js** 16.x+ (para frontend y backend)
- **Python** 3.8+ (para scripts de OCR)
- **Docker** (para servicios: PostgreSQL, Redis, MinIO)

### Herramientas Esenciales
- **Poppler** - Conversión de PDF a imagen (REQUERIDO)
- **FFmpeg** - Procesamiento de audio (REQUERIDO)
- **Tesseract** - OCR alternativo (OPCIONAL)

---

## 📦 Dependencias Principales

### Python (OCR & Audio)
```
paddleocr==3.4.0      # OCR con redes neuronales
easyocr>=1.7.0        # OCR alternativo
pytesseract>=0.3.10   # Interfaz para Tesseract
pdf2image>=1.16.3     # PDF a imagen
pdfminer.six>=20230228 # Extracción de texto
ocrmypdf>=14.0.0      # OCR para PDFs
Pillow>=10.0.0        # Procesamiento de imágenes
opencv-python>=4.8.0  # Visión por computadora
```

### Node.js (Frontend y Backend)
- Verifica `frontend/package.json` y `backend/package.json`

---

## 🔧 Instalación Manual por SO

### Windows 10/11

#### 1. Python 3.8+
```powershell
# Opción A: Desde https://www.python.org/downloads/
# Opción B: Con Chocolatey
choco install python
```

#### 2. Visual C++ Build Tools (OBLIGATORIO)
```powershell
# Necesario para compilar paquetes Python
choco install visualstudio2022buildtools
```

#### 3. Poppler
```powershell
choco install poppler
# Agrega a PATH: C:\Program Files\poppler\Library\bin
```

#### 4. FFmpeg
```powershell
choco install ffmpeg
```

#### 5. Tesseract (opcional)
```powershell
choco install tesseract
```

#### 6. Dependencias Python
```powershell
cd backend
python -m venv venv_ocr
.\venv_ocr\Scripts\Activate.ps1
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Ubuntu/Debian

#### 1. Actualizar sistema
```bash
sudo apt update
sudo apt upgrade -y
```

#### 2. Build tools
```bash
sudo apt install -y build-essential gcc g++ make libssl-dev libffi-dev
```

#### 3. Python 3
```bash
sudo apt install -y python3 python3-venv python3-dev python3-pip
```

#### 4. Poppler
```bash
sudo apt install -y poppler-utils
```

#### 5. FFmpeg
```bash
sudo apt install -y ffmpeg
```

#### 6. Tesseract (opcional)
```bash
sudo apt install -y tesseract-ocr tesseract-ocr-spa
```

#### 7. Dependencias de imagen
```bash
sudo apt install -y libjpeg-dev zlib1g-dev
```

#### 8. Dependencias Python
```bash
cd backend
python3 -m venv venv_ocr
source venv_ocr/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### macOS

#### 1. Homebrew (si no está instalado)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Xcode Command Line Tools
```bash
xcode-select --install
```

#### 3. Python 3
```bash
brew install python3
```

#### 4. Poppler
```bash
brew install poppler
```

#### 5. FFmpeg
```bash
brew install ffmpeg
```

#### 6. Tesseract (opcional)
```bash
brew install tesseract
```

#### 7. Dependencias Python
```bash
cd backend
python3 -m venv venv_ocr
source venv_ocr/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

---

## ✅ Verificación de Instalación

### Windows
```powershell
powershell -ExecutionPolicy Bypass -File check-requirements.ps1
```

### Linux / macOS
```bash
bash check-requirements.sh
```

Debería mostrar un resumen con ✅ para todas las dependencias.

---

## 🧠 Descargar Modelos de OCR

Los modelos de PaddleOCR se descargan automáticamente, pero puedes pre-descargarlos:

```bash
cd backend
source venv_ocr/bin/activate  # (en Windows: .\venv_ocr\Scripts\Activate.ps1)
python scripts/setup_ocr_models.py
```

**Nota:** La primera descarga tardará 10-20 minutos y ocupará ~2-5GB

---

## 🚀 Próximos Pasos

Una vez completada la instalación:

1. **Configura variables de entorno**
   ```bash
   cp .env.example .env
   # Edita .env con tus valores
   ```

2. **Instala dependencias Node.js**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Inicia los servicios Docker**
   ```bash
   docker-compose up -d
   ```

4. **Inicia el desarrollo**
   ```bash
   npm run dev
   ```

---

## 🔍 Troubleshooting

### "Poppler not found"
- **Windows:** Agrega `C:\Program Files\poppler\Library\bin` a PATH
- **Linux:** `sudo apt install poppler-utils`
- **macOS:** `brew install poppler`

### "Visual C++ Build Tools missing" (Windows)
- Descarga desde: https://visualstudio.microsoft.com/downloads/

### "Permission denied" (Linux/macOS)
- Usa `sudo` o asegúrate que el virtual environment esté activo

### Módulos Python no se instalan
```bash
pip install --upgrade setuptools wheel
pip install -r requirements.txt --no-cache-dir
```

### Modelos de OCR muy grandes
- Primera descarga: 5-15 minutos
- Almacenamiento: `~/.paddleocr/models` (~2-5GB)
- Las siguientes ejecuciones serán rápidas

---

## 📚 Documentación Adicional

- **[SYSTEM_REQUIREMENTS.md](SYSTEM_REQUIREMENTS.md)** - Guía detallada por SO
- **[QUICKSTART.md](QUICKSTART.md)** - Inicio rápido del proyecto
- **[PADDLE_OCR_SETUP.md](PADDLE_OCR_SETUP.md)** - Configuración de PaddleOCR
- **[requirements.txt](backend/requirements.txt)** - Todas las dependencias Python

---

## 💡 Tips

- Usa un **virtual environment** para Python (recomendado)
- Verifica que el **PATH** esté configurado correctamente
- Actualiza **pip** antes de instalar paquetes
- En sistemas lentos, la primera instalación puede tardar 30-60 minutos
- Ten al menos **10GB de espacio libre** en disco

---

**Última actualización:** 29 de Enero de 2026  
**Versión:** 2.0
