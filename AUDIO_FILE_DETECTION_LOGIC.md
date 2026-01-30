# 🎯 Audio File Detection & Automatic Routing Logic

**Fecha**: 29 de Enero de 2026  
**Módulo**: Uploads Controller  
**Estado**: ✅ Implementado

## 📋 Descripción General

Ahora el sistema detecta automáticamente el tipo de archivo subido y lo enruta al servicio apropiado:

- **Archivos de Audio** → Servicio de Transcripción Audio (AssemblyAI)
- **Documentos/Imágenes** → Servicio OCR (PaddleOCR)
- **Otros tipos** → Error con mensaje de archivo no soportado

## 🔄 Flujo de Procesamiento

### 1️⃣ Upload de Archivo

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario sube archivo (Audio/PDF/Imagen)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  UploadsController.uploadFile()                             │
│  - Crea registro en base de datos                           │
│  - Almacena archivo temporalmente en memoria               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Detectar tipo de archivo (MIME type)  │
        │  isAudioFile() vs isImageOrPdfFile()   │
        └─────────────────────────────────────────┘
                    │              │
           ┌────────┘              └────────┐
           │                                 │
           ▼ (Audio)                        ▼ (Document)
    ┌────────────────┐            ┌─────────────────┐
    │ Audio Service  │            │  OCR Service    │
    │ AssemblyAI API │            │  PaddleOCR      │
    │ Bull Queue     │            │  Bull Queue     │
    └────────────────┘            └─────────────────┘
           │                                 │
           ▼                                 ▼
    ┌────────────────┐            ┌─────────────────┐
    │ Transcription  │            │ Text Extract    │
    │ (Audio Result) │            │ (OCR Result)    │
    └────────────────┘            └─────────────────┘
           │                                 │
           └────────────────┬────────────────┘
                            │
                            ▼
                ┌──────────────────────────┐
                │  IA Summarization (Next) │
                │  - Resumen del texto     │
                │  - Puntos clave          │
                │  - Categorización        │
                └──────────────────────────┘
```

## 🎵 Tipos de Archivo Detectados

### Audio Soportado
```typescript
- audio/mpeg           // MP3
- audio/wav            // WAV
- audio/x-wav          // WAV (alternativo)
- audio/mp4            // M4A
- audio/x-m4a          // M4A (alternativo)
- audio/ogg            // OGG/Opus
- audio/opus           // Opus
- audio/flac           // FLAC
- audio/aac            // AAC
- audio/webm           // WebM Audio
```

### Documentos Soportados (OCR)
```typescript
- application/pdf      // PDF
- image/jpeg           // JPG
- image/jpg            // JPG (alternativo)
- image/png            // PNG
- image/tiff           // TIFF
- image/x-tiff         // TIFF (alternativo)
- image/webp           // WebP
- image/bmp            // BMP
- image/gif            // GIF
```

## 📝 Cambios Implementados

### 1. UploadsController
**Archivo**: `backend/src/modules/uploads/uploads.controller.ts`

```typescript
// Nuevo: Importar AudioService
import { AudioService } from '../audio/audio.service';

// Nuevo: Inyectar en constructor
constructor(
  private readonly uploadsService: UploadsService,
  private readonly ocrService: OcrService,
  private readonly audioService: AudioService, // ← Nuevo
)

// Modificado: uploadFile() con lógica de detección
async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
  // ... crear upload ...
  
  // Detectar tipo
  const isAudio = this.isAudioFile(file.mimetype);
  const isImageOrPdf = this.isImageOrPdfFile(file.mimetype);
  
  if (isAudio) {
    await this.audioService.initiateAudioProcessing({...});
  } else if (isImageOrPdf) {
    await this.ocrService.initiateOcrProcessing({...});
  } else {
    throw new BadRequestException('Unsupported file type');
  }
}

// Nuevos: Métodos de detección
private isAudioFile(mimeType: string): boolean { ... }
private isImageOrPdfFile(mimeType: string): boolean { ... }
```

### 2. UploadsModule
**Archivo**: `backend/src/modules/uploads/uploads.module.ts`

```typescript
// Nuevo: Importar AudioModule
import { AudioModule } from '../audio/audio.module';

@Module({
  imports: [
    // ...
    forwardRef(() => AudioModule), // ← Nuevo
  ],
})
export class UploadsModule {}
```

## 📊 Response del Upload

### Antes (siempre OCR)
```json
{
  "id": "upload-123",
  "fileName": "documento",
  "status": "pending"
}
```

### Ahora (con información de tipo)
```json
{
  "id": "upload-123",
  "fileName": "entrevista",
  "fileType": "audio",
  "processingType": "transcription",
  "status": "pending",
  "mimeType": "audio/mpeg"
}
```

## 🔍 Logs en Consola del Backend

```
[UploadsController] File uploaded: entrevista.mp3, Type: AUDIO
[UploadsController] Routing to Audio Service: upload-123
[AudioService] Processing audio file: upload-123
[AudioProcessor] Transcribing audio with AssemblyAI: job-456
```

vs

```
[UploadsController] File uploaded: factura.pdf, Type: OCR
[UploadsController] Routing to OCR Service: upload-123
[OcrService] Processing PDF: upload-123
[OcrProcessor] Extracting text with PaddleOCR: job-789
```

## 📱 Frontend (próximo paso)

El frontend debe estar preparado para mostrar diferentes interfaces según el tipo:

```typescript
// AudioUploadModal.tsx - mostrar solo para audio
// OcrUploadModal.tsx - mostrar solo para documentos

// O un único componente que detecte y renderice apropiadamente
const uploadType = response.processingType; // "audio" o "ocr"
```

## ✅ Beneficios

1. ✅ **Automatización**: No requiere selección manual de servicio
2. ✅ **Inteligencia**: Detecta el tipo de archivo automáticamente
3. ✅ **Escalabilidad**: Fácil agregar nuevos tipos (video, etc)
4. ✅ **Logging claro**: Fácil rastrear qué servicio procesa cada archivo
5. ✅ **Seguridad**: Rechaza tipos de archivo no soportados
6. ✅ **Pipeline IA**: Preparado para procesamiento con Claude (resumen, categorización)

## 🚀 Próximos Pasos

1. **Pipeline IA Completo**
   - Transcribir audio con AssemblyAI
   - Extraer texto con OCR
   - Procesar resultado con Claude IA para:
     - Resumen automático
     - Extracción de puntos clave
     - Categorización

2. **Frontend**
   - Unificar upload modal
   - Mostrar tipo de procesamiento
   - Mostrar resultados apropiados

3. **Mejoras**
   - Soporte para video (extraer audio + transcribir)
   - Procesamiento en lotes
   - WebSocket para progreso en tiempo real

## 🔧 Cómo Probar

### Subir un archivo de Audio
```bash
curl -X POST http://localhost:3000/uploads \
  -H "Authorization: Bearer <token>" \
  -F "file=@entrevista.mp3"

# Response
{
  "processingType": "transcription",
  "fileType": "audio"
}
```

### Subir un Documento
```bash
curl -X POST http://localhost:3000/uploads \
  -H "Authorization: Bearer <token>" \
  -F "file=@documento.pdf"

# Response
{
  "processingType": "ocr",
  "fileType": "document"
}
```

### Subir archivo no soportado
```bash
curl -X POST http://localhost:3000/uploads \
  -H "Authorization: Bearer <token>" \
  -F "file=@archivo.exe"

# Response
{
  "message": "Unsupported file type: application/x-msdownload. Supported: Audio (mp3, wav, m4a, ogg) or Document (pdf, image)",
  "error": "Bad Request"
}
```

## 📚 Referencias

- **Audio Service**: `backend/src/modules/audio/audio.service.ts`
- **OCR Service**: `backend/src/modules/ocr/ocr.service.ts`
- **Uploads Controller**: `backend/src/modules/uploads/uploads.controller.ts`
- **AssemblyAI API**: https://www.assemblyai.com/docs
- **PaddleOCR**: https://github.com/PaddleOCR/PaddleOCR

---

**Implementado por**: GitHub Copilot  
**Versión**: 1.0  
**Estado**: Production Ready ✅
