# Audio AI Summary - Testing Guide

## Pre-requisitos
1. Base de datos debe estar ejecutándose
2. MinIO debe estar disponible
3. AssemblyAI debe estar configurado (ASSEMBLYAI_API_KEY en .env)
4. Claude API debe estar configurada (en AiService)

## Pasos para Probar

### 1. Ejecutar la Migración
```bash
cd backend
npm run migration:run
```

Esto agregará los nuevos campos a las tablas:
- `audio_results.summary`
- `audio_results.transcriptionMinioPath`
- `audio_results.summaryMinioPath`
- `audio_results.audioMinioPath`
- `uploads.summary`

### 2. Iniciar los Servicios
```bash
# Backend
cd backend
npm start

# Frontend (en otra terminal)
cd frontend
npm run dev
```

### 3. Probar el Flujo Completo

1. **Abrir la aplicación**: http://localhost:5173
2. **Navegar al modal de Resumen**: Haz clic en "Subir archivos"
3. **Subir un archivo de audio**:
   - Selecciona la pestaña "Nuevo Archivo"
   - Sube un archivo MP3/WAV
   - Verás un spinner de progreso
4. **Esperar procesamiento**:
   - El frontend hace polling cada 2 segundos
   - Backend transcribe con AssemblyAI
   - Backend genera resumen con Claude
   - Backend guarda archivos en MinIO
5. **Verificar Resultado**:
   - Deberías ver un mensaje de éxito ✓
   - Título: "Tu Resumen de Audio está Listo"
   - Contenido: Resumen de IA (no transcripción completa)
   - Información: Archivos guardados en MinIO (audio, transcripción, resumen)

### 4. Verificar Archivos en MinIO

Los archivos estarán en la carpeta `results`:

```
results/
├── audio/
│   ├── files/
│   │   └── {userId}/{uploadId}-originalAudioFile.wav
│   └── transcriptions/
│       └── {userId}/{uploadId}-transcription.txt
└── summaries/
    └── {userId}/{uploadId}-summary.txt
```

### 5. Verificar Base de Datos

En la tabla `audio_results`, deberías ver:
- `id`: UUID único
- `transcription`: Texto completo transcrito
- `summary`: Resumen generado por IA
- `transcriptionMinioPath`: Ruta al archivo de transcripción en MinIO
- `summaryMinioPath`: Ruta al archivo de resumen en MinIO
- `audioMinioPath`: Ruta al archivo de audio original en MinIO
- `status`: 'completed'

## Logs Esperados

En la consola del backend, deberías ver:

```
[AudioProcessor] Processing audio job X for upload Y
[AudioProcessor] File uploaded to AssemblyAI: https://...
[AudioProcessor] Transcription submitted to AssemblyAI with ID: Z
[AudioProcessor] Generating AI summary for audio Y
[AudioProcessor] AI summary generated for audio Y
[AudioProcessor] Transcription saved to MinIO at audio/transcriptions/.../...
[AudioProcessor] Summary saved to MinIO at summaries/.../...
[AudioProcessor] Audio file saved to MinIO at audio/files/.../...
[AudioProcessor] Audio processing completed for job X
```

## Solución de Problemas

### El audio no se procesa
- Verifica que ASSEMBLYAI_API_KEY esté en `.env`
- Verifica que la conexión a MinIO esté correcta
- Revisa los logs del backend

### El resumen no se genera
- Verifica que Claude API esté configurada en `AiService`
- Verifica que haya tokens disponibles
- Revisa los logs: "Failed to generate AI summary"

### Los archivos no se guardan en MinIO
- Verifica que MinIO esté ejecutándose
- Verifica credenciales de MinIO en `StorageService`
- Revisa los logs: "Failed to save files to MinIO"

### El frontend no muestra el resumen
- Abre la consola del navegador (F12)
- Verifica que el polling esté funcionando (network tab)
- Verifica que `audioSummary` state esté siendo actualizado

## Comportamiento Esperado

### Before (Anterior)
```
✓ Transcripción desde AssemblyAI
✗ Resumen de IA
✗ Almacenamiento en MinIO
```

### After (Ahora)
```
✓ Transcripción desde AssemblyAI
✓ Resumen de IA (Claude)
✓ Almacenamiento en MinIO (3 archivos)
✓ UI bonita con información clara
✓ Descarga de resumen disponible
```

## Rollback (Si es necesario)

Si necesitas revertir los cambios:

```bash
# Revertir la migración
cd backend
npm run migration:revert
```

Esto eliminará los nuevos campos de las tablas.

