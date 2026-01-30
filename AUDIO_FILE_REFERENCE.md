# Audio AI Summary - File Location Reference

## 📂 Mapa de Cambios por Archivo

### 1. Backend - Core Logic

#### `backend/src/modules/audio/audio.processor.ts`
```
Cambios:
├── Línea 11: + import { AiService } from '../ai/ai.service'
├── Línea 12: + import { StorageService } from '../storage/storage.service'
├── Línea 27: + private readonly aiService: AiService,
├── Línea 28: + private readonly storageService: StorageService,
├── Línea 37: const { uploadId, audioResultId, language, userId } = job.data ← +userId
├── Líneas 85-106: NUEVA SECCIÓN - Generación de resumen con Claude
├── Líneas 108-141: NUEVA SECCIÓN - Almacenamiento en MinIO
└── Líneas 157-161: UPDATE - Agregar summary al upload
```

#### `backend/src/modules/audio/audio.controller.ts`
```
Cambios:
├── Línea 28: Actualizar tipo de retorno
│            ├── + summary?: string
│            └── + extractedText?: string
├── Línea 35: + summary: result.summary || undefined
└── Línea 36: + extractedText: result.summary || result.transcription || undefined
```

### 2. Backend - Database

#### `backend/src/modules/audio/entities/audio-result.entity.ts`
```
Cambios:
└── Después de @Column('text', { nullable: true })
    transcription: string;
    
    AGREGAR:
    ├── @Column('text', { nullable: true })
    ├── summary: string;
    ├── @Column('varchar', { nullable: true })
    ├── transcriptionMinioPath: string;
    ├── @Column('varchar', { nullable: true })
    ├── summaryMinioPath: string;
    ├── @Column('varchar', { nullable: true })
    └── audioMinioPath: string;
```

#### `backend/src/modules/uploads/entities/upload.entity.ts`
```
Cambios:
└── Después de @Column({ type: 'text', nullable: true })
    extractedText?: string;
    
    AGREGAR:
    ├── @Column({ type: 'text', nullable: true })
    └── summary?: string;
```

#### `backend/src/migrations/1740000001000-AddAudioSummaryAndStoragePaths.ts`
```
NUEVO ARCHIVO COMPLETO
├── Migration class: AddAudioSummaryAndStoragePaths1740000001000
├── up() method: Agregar columnas
└── down() method: Remover columnas
```

### 3. Backend - Services

#### `backend/src/modules/storage/storage.service.ts`
```
Cambios:
├── Línea 91: async uploadSummary(..., type: string = 'summary') ← +parámetro
├── Líneas 93-106: Condicionales para type (transcription/summary/otro)
├── Línea 109: Usar objectName diferente según type
├── Líneas 119-133: NUEVO MÉTODO uploadAudioFile()
│                   ├── async uploadAudioFile(userId, uploadId, fileBuffer, fileName)
│                   ├── objectName: audio/files/{userId}/{uploadId}-{fileName}
│                   └── return: path
```

### 4. Frontend - UI

#### `frontend/src/components/SummaryModal.tsx`
```
Cambios:
├── Línea 75: + const [audioSummary, setAudioSummary] = useState<string>('')
├── Línea 118: + setAudioSummary(data?.summary || data?.extractedText || '')
├── Línea 153: + <AudioUploadModal ... /> ← Usa componente existente
├── Línea 233: + setAudioSummary('') ← En limpieza
├── Líneas 347-400: REEMPLAZO TOTAL - UI de resultado de audio
│                   ├── Antes: Mostraba transcripción
│                   ├── Ahora: Muestra resumen
│                   ├── + Información de archivos en MinIO
│                   └── + Botones mejorados
```

## 🔍 Navegación Rápida

### Para entender la lógica de generación de resumen:
```
→ backend/src/modules/audio/audio.processor.ts
  Líneas 85-106: Generación de resumen
```

### Para entender el almacenamiento:
```
→ backend/src/modules/audio/audio.processor.ts
  Líneas 108-141: Almacenamiento en MinIO
  
→ backend/src/modules/storage/storage.service.ts
  Línea 91: Método uploadSummary (actualizado)
  Línea 119: Método uploadAudioFile (nuevo)
```

### Para entender la API:
```
→ backend/src/modules/audio/audio.controller.ts
  Líneas 24-43: Endpoint GET /api/audio/status/:uploadId
```

### Para entender la UI:
```
→ frontend/src/components/SummaryModal.tsx
  Línea 75: Estado audioSummary
  Línea 118: Actualización de estado
  Líneas 347-400: Renderizado de UI
```

### Para entender la base de datos:
```
→ backend/src/modules/audio/entities/audio-result.entity.ts
  Nuevos campos: summary, transcriptionMinioPath, summaryMinioPath, audioMinioPath
  
→ backend/src/modules/uploads/entities/upload.entity.ts
  Nuevo campo: summary
  
→ backend/src/migrations/1740000001000-...
  Migración completa
```

## 📋 Checklist de Verificación por Archivo

### ✅ audio.processor.ts
- [x] Imports agregados
- [x] Constructor inyecta servicios
- [x] Parámetro userId extraído
- [x] Lógica de IA agregada
- [x] Lógica de almacenamiento agregada
- [x] Update de upload incluye summary

### ✅ audio-result.entity.ts
- [x] Campo summary agregado
- [x] Campo transcriptionMinioPath agregado
- [x] Campo summaryMinioPath agregado
- [x] Campo audioMinioPath agregado

### ✅ upload.entity.ts
- [x] Campo summary agregado

### ✅ audio.controller.ts
- [x] Tipo de retorno actualizado
- [x] Summary en respuesta
- [x] ExtractedText en respuesta

### ✅ storage.service.ts
- [x] uploadSummary actualizado con type
- [x] uploadAudioFile nuevo método

### ✅ Migración
- [x] Archivo creado
- [x] up() method completo
- [x] down() method completo

### ✅ SummaryModal.tsx
- [x] Estado audioSummary
- [x] Polling actualizado
- [x] Limpieza de estado
- [x] UI rediseñada

## 🎯 Ubicación de Cambios Clave

### Donde se genera el resumen
```
audio.processor.ts
Línea 88: const summaryGenerator = this.aiService.streamSummarize({...})
```

### Donde se guarda en MinIO
```
audio.processor.ts
Líneas 112-141: Tres llamadas a storageService
```

### Donde se actualiza la API
```
audio.controller.ts
Línea 35-36: return { status, transcription, summary, extractedText }
```

### Donde se muestra en UI
```
SummaryModal.tsx
Líneas 365-375: {audioSummary ? (...) : (...)}
```

## 📊 Estadísticas por Archivo

| Archivo | Líneas Modificadas | Tipo |
|---------|-------------------|------|
| audio.processor.ts | ~80 | Lógica principal |
| audio-result.entity.ts | 4 | Entidad |
| upload.entity.ts | 3 | Entidad |
| audio.controller.ts | 4 | API |
| storage.service.ts | ~40 | Servicio |
| 1740000001000.ts | ~50 | Migración |
| SummaryModal.tsx | ~50 | UI |
| **TOTAL** | ~231 | |

## 🔗 Dependencias Entre Cambios

```
audio.processor.ts
├── Usa: AiService (existente)
├── Usa: StorageService (extendido)
└── Actualiza: AudioResult (nuevos campos)

AudioResult (nuevos campos)
└── Require: Migración de BD

SummaryModal.tsx (UI)
└── Usa: Endpoint /api/audio/status/:uploadId (actualizado)

storage.service.ts
└── Usado por: audio.processor.ts (nuevo)
```

## ✅ Verificación de Integridad

- [x] Todos los imports existen
- [x] Todos los servicios están inyectables
- [x] Todos los campos de BD tienen migración
- [x] Todos los cambios de UI son consistentes
- [x] No hay circular dependencies
- [x] No hay breaking changes

