# 📖 Guía de Instalación - Paddle OCR

## 🎯 ¿Qué es Paddle OCR?

**PaddleOCR** es un framework de extracción de texto de imágenes desarrollado por Baidu. Es:
- ✅ **Gratuito** (código abierto)
- ✅ **Rápido** (C++)
- ✅ **Preciso** (>95% en español)
- ✅ **Multi-idioma** (>80 idiomas)
- ✅ **Ligero** (~400MB descargado)

**Alternativas:** Tesseract (gratis pero menos preciso), Google Vision (pago)

---

## ⚙️ Instalación Paso a Paso

### Windows

#### 1️⃣ Instalar Python 3.11

```bash
# Descargar de: https://www.python.org/downloads/
# O instalar via Chocolatey:
choco install python

# Verificar
python --version  # Debe ser 3.9 o superior
```

**IMPORTANTE:** Durante la instalación, marcar "Add Python to PATH"

#### 2️⃣ Crear Virtual Environment (recomendado)

```bash
# En la carpeta backend/
cd backend

# Crear venv
python -m venv venv

# Activar (Windows)
venv\Scripts\activate

# Deberías ver (venv) al inicio de la terminal
```

#### 3️⃣ Instalar Dependencias Python

```bash
# Activar venv primero (si no está activado)
venv\Scripts\activate

# Instalar paquetes
pip install --upgrade pip
pip install paddleocr pillow pdf2image numpy opencv-python

# Verificar instalación
python -c "import paddleocr; print('✅ PaddleOCR instalado')"
```

**Tiempo esperado:** 5-10 minutos (descarga modelos la primera vez)

#### 4️⃣ Instalar Poppler (para soporte PDF)

```bash
# Opción A: Chocolatey (recomendado)
choco install poppler

# Opción B: Manual
# Descargar: https://github.com/oschwartz10612/poppler-windows/releases/
# Extraer a: C:\Program Files\poppler
# Agregar a PATH: C:\Program Files\poppler\Library\bin
```

---

### macOS

```bash
# Instalar Python (si no lo tienes)
brew install python@3.11

# Crear venv
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install paddleocr pillow pdf2image numpy opencv-python

# Instalar poppler para PDF
brew install poppler
```

---

### Linux (Ubuntu/Debian)

```bash
# Instalar Python y pip
sudo apt-get update
sudo apt-get install python3.11 python3.11-venv

# Crear venv
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip setuptools wheel
pip install paddleocr pillow pdf2image numpy opencv-python

# Instalar poppler para PDF
sudo apt-get install poppler-utils

# Para GPU (CUDA)
pip install paddlepaddle-gpu
```

---

## 🧪 Verificar Instalación

### Test 1: Importar librerías

```bash
# Activar venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Probar importar
python -c "
import paddleocr
import cv2
import numpy as np
import PIL
print('✅ Todas las librerías importadas correctamente')
"
```

### Test 2: Ejecutar OCR en una imagen

```bash
# Crear una imagen de prueba o usar una existente
python backend/scripts/paddle_ocr_service.py "ruta/a/imagen.jpg" "output.json"
```

**Esperado:**
```
✅ OCR completed. Results saved to output.json
Confidence: 92.34%
```

---

## 🔌 Integración en Backend NestJS

### 1️⃣ Crear servicio wrapper

```typescript
// backend/src/modules/processing/services/ocr.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class OcrService {
  private pythonScript = path.join(
    __dirname,
    '../../scripts/paddle_ocr_service.py'
  );

  /**
   * Extraer texto de imagen
   */
  async extractFromImage(imagePath: string): Promise<any> {
    if (!fs.existsSync(imagePath)) {
      throw new BadRequestException('Image file not found');
    }

    const outputPath = `${imagePath}.json`;

    try {
      // Ejecutar script Python
      const { stdout, stderr } = await execAsync(
        `python ${this.pythonScript} "${imagePath}" "${outputPath}"`,
        { timeout: 60000 } // 60 segundos timeout
      );

      if (stderr) {
        console.error('Python warning:', stderr);
      }

      // Leer resultado
      const result = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

      // Limpiar archivo temporal
      fs.unlinkSync(outputPath);

      return result;
    } catch (error) {
      throw new BadRequestException(`OCR failed: ${error.message}`);
    }
  }

  /**
   * Extraer texto de PDF
   */
  async extractFromPdf(pdfPath: string): Promise<any> {
    // Convertir a imágenes y procesar
    // (implementación en Fase 2)
  }
}
```

### 2️⃣ Crear controlador

```typescript
// backend/src/modules/processing/controllers/ocr.controller.ts

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { OcrService } from '../services/ocr.service';

@Controller('processing/ocr')
@UseGuards(AuthGuard('jwt'))
export class OcrController {
  constructor(private ocrService: OcrService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async extractText(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validar formato
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/pdf',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('File format not supported');
    }

    // Procesar
    const result = await this.ocrService.extractFromImage(file.path);

    return {
      success: true,
      data: result,
    };
  }
}
```

---

## ⚙️ Configuración de Variables de Entorno

```env
# .env

# Paddle OCR
PADDLE_OCR_LANG=es
PADDLE_OCR_GPU=false
PADDLE_OCR_ENABLE=true
PADDLE_MODELS_PATH=./models  # Cache de modelos

# Python
PYTHON_PATH=/path/to/python  # Path al ejecutable Python
PYTHON_VENV=/path/to/venv    # Path al virtual environment
```

---

## 📊 Configuración de Rendimiento

### Para CPU (Recomendado para desarrollo)

```python
ocr = PaddleOCR(
    use_gpu=False,           # No usar GPU
    enable_mkldnn=True,      # Optimización multi-threading
    det_db_box_thresh=0.5,   # Threshold de detección
    rec_batch_num=6,         # Batch size
    max_side_len=960,        # Tamaño máximo de imagen
)
```

**Tiempo:** 5-10 segundos por página

### Para GPU (Producción)

```python
ocr = PaddleOCR(
    use_gpu=True,
    gpu_id=0,
    det_db_box_thresh=0.5,
    rec_batch_num=32,
    max_side_len=1280,
)
```

**Tiempo:** 1-2 segundos por página (requiere NVIDIA CUDA)

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'paddleocr'"

```bash
# Asegúrate que venv está activado
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Reinstalar
pip uninstall paddleocr -y
pip install paddleocr
```

### "python: command not found"

```bash
# Verificar instalación de Python
python --version

# Si no funciona, agregar a PATH
# Windows: C:\Users\TU_USUARIO\AppData\Local\Programs\Python\Python311
# Mac/Linux: /usr/local/bin/python3
```

### "Timeout exceeded"

OCR tarda demasiado. Soluciones:

```python
# 1. Reducir resolución
img = cv2.resize(img, (img.shape[1]//2, img.shape[0]//2))

# 2. Reducir batch size
rec_batch_num=3

# 3. Usar GPU si disponible
use_gpu=True
```

### "PDF2Image no encuentra poppler"

```bash
# Windows
pip install python-poppler-qt5

# Mac
brew install poppler

# Linux
sudo apt-get install poppler-utils
```

---

## 📈 Optimización

### Caché de Modelos

```bash
# Los modelos se descargan automáticamente a:
# Windows: C:\Users\TU_USUARIO\.paddleocr
# Linux/Mac: ~/.paddleocr

# Para custom path:
export PADDLE_HOME=/custom/path
```

### Batch Processing

Para procesar múltiples documentos:

```python
def process_batch(image_paths):
    ocr = PaddleOCR(lang='es')
    results = []
    
    for img_path in image_paths:
        result = ocr.ocr(img_path)
        results.append(result)
    
    return results
```

---

## 🔄 Próximos Pasos

### Fase 1 (Actual)
- [x] Instalar Paddle OCR
- [x] Crear servicio Python
- [x] Integrar con NestJS
- [ ] Crear endpoint `/processing/ocr`

### Fase 2
- [ ] Agregar soporte para PDF
- [ ] Implementar caché en Redis
- [ ] Agregar procesamiento asincrónico (Bull queue)

### Fase 3
- [ ] Traducción automática de OCR
- [ ] Corrección ortográfica
- [ ] Extracción de estructura (tablas, headings)

---

## 📚 Referencias

- [PaddleOCR GitHub](https://github.com/PaddlePaddle/PaddleOCR)
- [Documentación oficial](https://paddleocr.readthedocs.io/)
- [Idiomas soportados](https://github.com/PaddlePaddle/PaddleOCR/blob/release/2.7/README.md)

---

*Guía actualizada: Enero 29, 2026*
