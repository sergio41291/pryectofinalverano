# Flujo de Progreso del OCR en Tiempo Real

## 🔄 Arquitectura de Progreso

```
USUARIO SUBE ARCHIVO
        ↓
  [CLIENTE FRONTEND]
        ↓
  Envía POST /api/uploads/upload
        ↓
  [BACKEND - OcrProcessor]
        ↓
  1️⃣ notifyUploading()
     └─→ "Subiendo archivo..." (progress: 30%)
        ↓
  2️⃣ notifyExtracting()
     └─→ "Extrayendo texto del documento..." (progress: 50%)
        ↓
  Ejecuta PaddleOCR en Python
  (Extrae todo el texto del archivo)
        ↓
  3️⃣ notifyGenerating()
     └─→ "Generando resumen con IA..." (progress: 75%)
        ↓
  Procesa el texto extraído
        ↓
  4️⃣ notifyOcrCompletedWithSummary()
     └─→ "Resumen completado" (progress: 100%)
     └─→ Envía el resumen extraído
        ↓
  [CLIENTE FRONTEND - WebSocket]
        ↓
  Actualiza estado visualmente
  └─→ Spinner desaparece gradualmente
  └─→ Muestra el resumen en pantalla
```

## 📊 Estados Visuales en el Modal

### Estado 1: IDLE (Seleccionar Archivo)
```
┌─────────────────────────────────┐
│  ☁️ Resumen Automático           │
│  Sube un archivo para extraer    │
│  texto y generar un resumen      │
│                                   │
│  [Área de Drop File]             │
│  Arrastra tu archivo aquí        │
└─────────────────────────────────┘
```

### Estado 2: UPLOADING → EXTRACTING → GENERATING
```
┌─────────────────────────────────┐
│         [Progress Bar]            │
│         ███░░░░░░░░ 50%          │
│                                   │
│      [Animated Spinner]          │
│      ✨ (pulsing icon)           │
│                                   │
│  "Extrayendo texto..."           │
│                                   │
│  ✓ Extrayendo texto              │
│  ⏳ Generando resumen con IA    │
│  ⏸ Completado                   │
└─────────────────────────────────┘
```

### Estado 3: COMPLETED (Mostrar Resumen)
```
┌─────────────────────────────────┐
│         ✅ Tu Resumen            │
│                                   │
│  ┌───────────────────────────┐   │
│  │ Lorem ipsum dolor sit      │   │
│  │ amet, consectetur...       │   │
│  │                            │   │
│  │ [Scrollable si es largo]   │   │
│  └───────────────────────────┘   │
│                                   │
│  [Ver en Detalle] [Procesar Otro]│
└─────────────────────────────────┘
```

### Estado 4: ERROR
```
┌─────────────────────────────────┐
│      ⚠️ Error al procesar        │
│                                   │
│  "Archivo no soportado"          │
│                                   │
│  [Intentar Nuevamente]           │
└─────────────────────────────────┘
```

## 🔌 WebSocket Events - Frontend Hook

```typescript
// useOcrProgress.ts emite estos eventos:

{
  event: 'ocr:uploading',
  data: {
    uploadId: '...',
    message: 'Subiendo archivo...',
    progress: 30
  }
}
→ setState({ step: 'uploading', ... })

{
  event: 'ocr:extracting',
  data: {
    uploadId: '...',
    message: 'Extrayendo texto...',
    progress: 50
  }
}
→ setState({ step: 'extracting', ... })

{
  event: 'ocr:generating',
  data: {
    uploadId: '...',
    message: 'Generando resumen...',
    progress: 75
  }
}
→ setState({ step: 'generating', ... })

{
  event: 'ocr:completed',
  data: {
    uploadId: '...',
    message: 'Resumen completado',
    progress: 100,
    summary: '...' // Texto extraído o resumen generado
  }
}
→ setState({ step: 'completed', summary: '...', ... })

{
  event: 'ocr:error',
  data: {
    uploadId: '...',
    error: 'Mensaje de error'
  }
}
→ setState({ step: 'error', error: '...', ... })
```

## 📱 Animaciones en Pantalla

### Spinner Gradiente
```css
.spinner {
  animation: spin 2s linear infinite;
  background: linear-gradient(90deg, #3b82f6, #4f46e5);
  border-radius: 9999px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Icono Pulsante
```css
.icon {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Barra de Progreso
```css
.progress-bar {
  transition: width 500ms ease-out;
}
```

## 🎯 Checklist de Completitud

- ✅ Hook WebSocket (`useOcrProgress.ts`)
  - ✅ Conecta a WebSocket automáticamente
  - ✅ Escucha eventos de progreso
  - ✅ Actualiza estado local
  - ✅ Manejo de errores

- ✅ Frontend Component (`UploadModal.tsx`)
  - ✅ Estado IDLE - Seleccionar archivo
  - ✅ Estados de progreso - Uploading, Extracting, Generating
  - ✅ Estado COMPLETED - Mostrar resumen
  - ✅ Estado ERROR - Mostrar error
  - ✅ Barra de progreso visual
  - ✅ Indicadores de proceso (checkmarks)
  - ✅ Spinner animado

- ✅ Backend Gateway (`ocr-websocket.gateway.ts`)
  - ✅ notifyUploading()
  - ✅ notifyExtracting()
  - ✅ notifyGenerating()
  - ✅ notifyOcrCompletedWithSummary()
  - ✅ notifyOcrErrorWithSummary()

- ✅ Backend Processor (`ocr.processor.ts`)
  - ✅ Emite event al iniciar upload
  - ✅ Emite event al iniciar extracción
  - ✅ Emite event al iniciar generación de resumen
  - ✅ Emite event al completar con resumen
  - ✅ Emite event de error

## 🚀 Próximos Pasos (Opcionales)

1. **Integración con Claude Haiku**
   - Cambiar el resumen del texto extraído a una llamada a Claude
   - Emitir el resumen con streaming carácter por carácter

2. **Persistencia de Historiales**
   - Mostrar resúmenes previos en el sidebar
   - Permitir descargar resúmenes como PDF/TXT

3. **Validación de Archivos**
   - Validar tamaño antes de subir
   - Validar formato de archivo

4. **Pruebas E2E**
   - Simular upload completo
   - Verificar transiciones de estado
   - Probar manejo de errores
