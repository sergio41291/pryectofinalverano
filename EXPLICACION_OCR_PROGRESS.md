# 📊 Flujo del Procesamiento OCR en Tiempo Real

## 🎯 ¿Cómo Funciona?

Cuando el usuario sube un archivo, el sistema muestra el progreso en **4 fases distintas**, cada una con su mensaje y animación:

---

## **Fase 1: SUBIENDO ARCHIVO** 🚀
```
┌────────────────────────────────┐
│      [Progress: 30%]            │
│      ░░░░░░░░░░░░░░░░░░░░░░    │
│                                 │
│         ⚙️ Spinner             │
│                                 │
│    "Subiendo archivo..."        │
│                                 │
│    ✓ Extrayendo texto           │
│    ⏳ Generando resumen        │
│    ⏸ Completado               │
└────────────────────────────────┘
```

### ¿Qué pasa en el backend?
- El servidor recibe el archivo
- Verifica tamaño y formato
- Inicia el procesamiento

---

## **Fase 2: EXTRAYENDO TEXTO** 📄
```
┌────────────────────────────────┐
│      [Progress: 50%]            │
│      ██████░░░░░░░░░░░░░░░     │
│                                 │
│         ⚙️ Spinner             │
│                                 │
│  "Extrayendo texto del         │
│   documento..."                 │
│                                 │
│    ✓ Extrayendo texto           │
│    ⏳ Generando resumen        │
│    ⏸ Completado               │
└────────────────────────────────┘
```

### ¿Qué pasa en el backend?
- Se descarga el archivo de MinIO
- Se ejecuta PaddleOCR (librería Python)
- Se extrae TODO el texto de las imágenes/PDF
- Procesa todas las páginas
- **Guarda en caché para futuras búsquedas**

---

## **Fase 3: GENERANDO RESUMEN CON IA** 🤖
```
┌────────────────────────────────┐
│      [Progress: 75%]            │
│      ███████░░░░░░░░░░░░░     │
│                                 │
│         ✨ Spinner (pulsing)   │
│                                 │
│  "Generando resumen con IA..."  │
│                                 │
│    ✓ Extrayendo texto           │
│    ✓ Generando resumen          │
│    ⏸ Completado               │
└────────────────────────────────┘
```

### ¿Qué pasa en el backend?
- Toma el texto extraído
- **Próximamente**: Enviará a Claude Haiku para resumir
- Por ahora: Usa fragmento del texto como "resumen"

---

## **Fase 4: COMPLETADO - MOSTRAR RESUMEN** ✅
```
┌────────────────────────────────┐
│      [Progress: 100%]           │
│      ████████████████████████  │
│                                 │
│      ✅ Tu Resumen está Listo   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ El texto extraído del    │   │
│  │ documento aparece aquí.  │   │
│  │ Puedes scrollear si es   │   │
│  │ muy largo...             │   │
│  │                          │   │
│  │ [Scroll disponible]      │   │
│  └──────────────────────────┘   │
│                                 │
│  [Ver en Detalle] [Procesar Otro]
└────────────────────────────────┘
```

### ¿Qué pasa?
- El spinner **desaparece completamente**
- El resumen se muestra en una caja scrolleable
- El usuario puede:
  - 👁️ Ver el resumen completo en detalle
  - 🔄 Procesar otro archivo
  - 📋 Copiar el resumen

---

## **Arquitectura de Comunicación** 🔌

### Frontend (React)
```
┌─────────────────┐
│  UploadModal.tsx│ ← Hook: useOcrProgress()
│  ┌───────────────┐
│  │ Estado Local: │
│  │ - step        │
│  │ - message     │
│  │ - progress    │
│  │ - summary     │
│  │ - error       │
│  └───────────────┘
└─────────────────┘
        ↑
        │ WebSocket
        │ escucha
        ↓
┌─────────────────────────────┐
│  Backend WebSocket Gateway  │
│  (ocr-websocket.gateway.ts) │
│                             │
│  → ocr:uploading event      │
│  → ocr:extracting event     │
│  → ocr:generating event     │
│  → ocr:completed event      │
│  → ocr:error event          │
└─────────────────────────────┘
        ↑
        │ Emite eventos
        ↓
┌──────────────────────────────┐
│  OcrProcessor (Bull Queue)   │
│  (ocr.processor.ts)          │
│                              │
│  1. Emite: notifyUploading() │
│  2. Emite: notifyExtracting()│
│  3. Ejecuta PaddleOCR        │
│  4. Emite: notifyGenerating()│
│  5. Procesa resultado        │
│  6. Emite: notifyCompleted() │
└──────────────────────────────┘
```

---

## **Hook WebSocket - useOcrProgress.ts** 🎣

```typescript
// Uso en UploadModal:
const { state, reset } = useOcrProgress();

// state contiene:
{
  step: 'extracting' | 'uploading' | 'generating' | 'completed' | 'error',
  message: 'Extrayendo texto...',
  progress: 50,      // 0-100
  summary?: '...',   // Texto extraído
  error?: '...'      // Si hay error
}

// Escucha automáticamente WebSocket:
- ocr:uploading    → setState({ step: 'uploading', progress: 30 })
- ocr:extracting   → setState({ step: 'extracting', progress: 50 })
- ocr:generating   → setState({ step: 'generating', progress: 75 })
- ocr:completed    → setState({ step: 'completed', progress: 100, summary: '...' })
- ocr:error        → setState({ step: 'error', error: '...' })
```

---

## **Animaciones CSS** 🎬

### Spinner Gradiente Giratorio
```css
.absolute.inset-0.rounded-full.bg-gradient-to-r.from-blue-400.to-indigo-600.animate-spin
↓
Gira continuamente en 1s
Gradiente azul → índigo
```

### Icono Pulsante (Sparkles)
```css
.animate-pulse
↓
Fade in/out cada 2 segundos
Efecto "resplandor"
```

### Barra de Progreso
```css
width: `${progress}%`
transition: width 500ms ease-out
↓
Animación suave de crecimiento
```

### Indicadores de Proceso
```css
Círculo verde (✓) = Completado
Círculo gris (⏳) = En progreso
Círculo gris (⏸) = Pendiente
```

---

## **Casos de Error** ❌

Si algo falla durante cualquier fase:

```
┌──────────────────────────────┐
│      ⚠️ Error al procesar    │
│                              │
│  "El archivo no es válido"   │
│   o                          │
│  "Error de conexión"         │
│                              │
│  [Intentar Nuevamente]       │
└──────────────────────────────┘
```

El usuario puede:
- Reintentar el upload
- Seleccionar otro archivo
- Procesar más tarde

---

## **Timeline de un Upload Real** ⏱️

```
T=0s     → Usuario hace click en archivo
T=0.5s   → "Subiendo archivo..." (30%) → Spinner comienza
T=1s     → "Extrayendo texto..." (50%) → Spinner continúa
T=5s     → PaddleOCR extrae todo
T=8s     → "Generando resumen..." (75%) → Spinner pulsa
T=10s    → Spinner desaparece
T=10s    → ✅ Resumen aparece en pantalla
           Usuario puede leerlo/copiar/descargar
```

---

## **Ventajas del Sistema** 🎁

✅ **Feedback en Tiempo Real**: El usuario ve qué está pasando  
✅ **Animaciones Suaves**: No se ve como un proceso aburrido  
✅ **Granularidad**: Sabe exactamente en qué fase está  
✅ **Manejo de Errores**: Entiende qué salió mal  
✅ **Escalable**: Fácil agregar más etapas (p.ej., "Guardando en base de datos")  
✅ **WebSocket**: Comunicación bidireccional en tiempo real

---

## **Próximos Pasos** 🚀

1. **Integración con Claude Haiku**
   - En fase de "Generando resumen", llamar a Claude
   - Resumir el texto extraído en 1-2 párrafos

2. **Streaming de Texto**
   - Mostrar el resumen "escribiéndose" carácter por carácter
   - Efecto typing animation

3. **Historial de Resúmenes**
   - Guardar todos los resúmenes del usuario
   - Mostrar en el sidebar para acceso rápido

4. **Opciones Avanzadas**
   - Elegir idioma de salida
   - Elegir estilo de resumen (conciso, detallado, bullets)
   - Exportar como PDF/Word

---

**¡Sistema completamente funcional y listo para usar! 🎉**
