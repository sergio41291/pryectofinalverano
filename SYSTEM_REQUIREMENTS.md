# 📋 Guía de Instalación de Requerimientos para LearnMind AI

## 🎯 Resumen General

El proyecto LearnMind AI requiere varias dependencias del sistema operativo además de las dependencias Python. Este documento guía la instalación de todos los requerimientos necesarios.

---

## 🪟 Windows 10/11

### 1. **Python 3.8+** (si no está instalado)
```powershell
# Descargar desde: https://www.python.org/downloads/
# O instalar con Chocolatey:
choco install python
```

### 2. **Visual C++ Build Tools** (OBLIGATORIO)
```powershell
# Opción A: Installer directo
# Descargar desde: https://visualstudio.microsoft.com/downloads/
# Seleccionar "Desktop development with C++"

# Opción B: Con Chocolatey
choco install visualstudio2022buildtools
```

### 3. **Poppler** (para PDF a Imagen)
```powershell
# Con Chocolatey
choco install poppler

# O descarga manualmente desde:
# https://github.com/oschwartz10612/poppler-windows/releases/

# Si lo instalas manualmente, agrega la ruta al PATH:
# C:\Program Files\poppler\Library\bin
```

### 4. **FFmpeg** (para procesamiento de audio)
```powershell
# Con Chocolatey
choco install ffmpeg

# O descarga desde: https://ffmpeg.org/download.html
```

### 5. **Tesseract OCR** (opcional pero recomendado)
```powershell
# Con Chocolatey
choco install tesseract

# O descarga desde: https://github.com/UB-Mannheim/tesseract/wiki

# Si lo instalas manualmente, configura la variable de entorno:
# TESSDATA_PREFIX = C:\Program Files\Tesseract-OCR\tessdata
```

### 6. **Instalar dependencias Python**
```powershell
# Navegar al directorio del proyecto
cd backend

# Crear virtual environment (recomendado)
python -m venv venv_ocr
.\venv_ocr\Scripts\Activate.ps1

# Instalar requerimientos
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### 7. **Verificar instalación**
```powershell
# Ejecutar script de verificación
python check-requirements.ps1

# O verificar manualmente
python -c "import paddleocr; print('✅ PaddleOCR OK')"
python -c "import easyocr; print('✅ EasyOCR OK')"
python -c "import pytesseract; print('✅ Tesseract OK')"
python -c "import pdf2image; print('✅ pdf2image OK')"
```

---

## 🐧 Linux (Ubuntu/Debian)

### 1. **Python 3.8+**
```bash
sudo apt update
sudo apt install python3 python3-venv python3-dev
```

### 2. **Build Tools**
```bash
sudo apt install build-essential gcc g++ make libssl-dev libffi-dev
```

### 3. **Poppler**
```bash
sudo apt install poppler-utils
```

### 4. **FFmpeg**
```bash
sudo apt install ffmpeg
```

### 5. **Tesseract OCR** (opcional)
```bash
sudo apt install tesseract-ocr
sudo apt install tesseract-ocr-spa  # Paquete de idioma español
```

### 6. **Dependencias de imagen**
```bash
sudo apt install libjpeg-dev zlib1g-dev
```

### 7. **Instalar dependencias Python**
```bash
cd backend

# Crear virtual environment
python3 -m venv venv_ocr
source venv_ocr/bin/activate

# Instalar requerimientos
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### 8. **Verificar instalación**
```bash
bash check-requirements.sh
```

---

## 🍎 macOS

### 1. **Homebrew** (si no está instalado)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. **Python 3.8+**
```bash
brew install python3
```

### 3. **Build Tools**
```bash
# Instalar Xcode Command Line Tools
xcode-select --install
```

### 4. **Poppler**
```bash
brew install poppler
```

### 5. **FFmpeg**
```bash
brew install ffmpeg
```

### 6. **Tesseract OCR** (opcional)
```bash
brew install tesseract
```

### 7. **Instalar dependencias Python**
```bash
cd backend

# Crear virtual environment
python3 -m venv venv_ocr
source venv_ocr/bin/activate

# Instalar requerimientos
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

---

## 📦 Dependencias Python Detalladas

| Paquete | Versión | Propósito |
|---------|---------|----------|
| **paddleocr** | 3.4.0 | OCR multiidioma con redes neuronales |
| **easyocr** | ≥1.7.0 | OCR alternativo con soporte multilingual |
| **pytesseract** | ≥0.3.10 | Interfaz Python para Tesseract |
| **pdf2image** | ≥1.16.3 | Conversión de PDF a imágenes |
| **pdfminer.six** | ≥20230228 | Extracción de texto de PDFs |
| **ocrmypdf** | ≥14.0.0 | OCR para PDFs con preservación de formato |
| **Pillow** | ≥10.0.0 | Procesamiento de imágenes |
| **opencv-python** | ≥4.8.0 | Procesamiento de visión por computadora |
| **numpy** | ≥1.20.0 | Computación numérica |
| **pandas** | ≥1.5.0 | Análisis de datos |
| **requests** | ≥2.31.0 | Cliente HTTP |
| **aiohttp** | ≥3.9.0 | Cliente HTTP asincrónico |
| **python-dotenv** | ≥1.0.0 | Variables de entorno |

---

## ✅ Checklist de Instalación

### Windows
- [ ] Python 3.8+ instalado y en PATH
- [ ] Visual C++ Build Tools instalados
- [ ] Poppler instalado y en PATH
- [ ] FFmpeg instalado y en PATH
- [ ] Tesseract instalado (opcional)
- [ ] Virtual environment creado (`venv_ocr`)
- [ ] `pip install -r requirements.txt` ejecutado
- [ ] Script de verificación ejecutado exitosamente

### Linux
- [ ] Python 3.8+ instalado
- [ ] Build tools instalados
- [ ] Poppler instalado con `apt`
- [ ] FFmpeg instalado con `apt`
- [ ] Tesseract instalado (opcional)
- [ ] Virtual environment creado (`venv_ocr`)
- [ ] `pip install -r requirements.txt` ejecutado
- [ ] Script de verificación ejecutado exitosamente

### macOS
- [ ] Homebrew instalado
- [ ] Python 3.8+ instalado
- [ ] Xcode Command Line Tools instalados
- [ ] Poppler instalado con `brew`
- [ ] FFmpeg instalado con `brew`
- [ ] Tesseract instalado (opcional)
- [ ] Virtual environment creado (`venv_ocr`)
- [ ] `pip install -r requirements.txt` ejecutado
- [ ] Script de verificación ejecutado exitosamente

---

## 🔧 Troubleshooting

### Error: "poppler not found"
**Solución:** Asegurate de que Poppler esté en el PATH del sistema
- Windows: Agrega `C:\Program Files\poppler\Library\bin` a PATH
- Linux: `sudo apt install poppler-utils`
- macOS: `brew install poppler`

### Error: "No module named 'paddle'"
**Solución:** Reinstala paddleocr en el virtual environment
```bash
pip uninstall paddleocr
pip install paddleocr==3.4.0
```

### Error: "Visual C++ Build Tools missing"
**Solución:** Instala Visual C++ Build Tools
- Windows: Descarga desde https://visualstudio.microsoft.com/

### Error: "Permission denied" (Linux/macOS)
**Solución:** Usa `sudo` o ejecuta en virtual environment
```bash
python3 -m venv venv_ocr
source venv_ocr/bin/activate
pip install -r requirements.txt
```

### Modelos de OCR muy grandes (2-5 GB)
**Info:** PaddleOCR descarga modelos automáticamente
- Primera ejecución tardará 5-15 minutos
- Los modelos se cachean en `~/.paddleocr/models`
- Ejecuciones posteriores serán rápidas

---

## 🚀 Próximos Pasos

Una vez instalados todos los requerimientos:

1. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus valores
   ```

2. **Inicializar modelos de OCR**
   ```bash
   python backend/scripts/setup_ocr_models.py
   ```

3. **Iniciar el backend**
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Iniciar el frontend**
   ```bash
   cd frontend
   npm run dev
   ```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa el archivo `check-requirements.sh` (Linux) o `check-requirements.ps1` (Windows)
2. Consulta la documentación oficial de cada herramienta
3. Verifica que el virtual environment esté activado
4. Intenta con `pip install --upgrade -r requirements.txt`

---

**Última actualización:** 29 de Enero de 2026  
**Versión:** 1.0
