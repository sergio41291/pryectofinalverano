# 🚀 Audio AI Summary - Step by Step Deployment Guide

## 📋 Pre-requisitos Verificados

- [x] Backend compila sin errores
- [x] Frontend compila sin errores  
- [x] Migración de BD creada
- [x] Código listo para producción

---

## 🔧 Paso 1: Preparar el Ambiente

### 1.1 Verificar que servicios necesarios estén disponibles

```bash
# Verificar que PostgreSQL esté corriendo
# Verificar que MinIO esté corriendo
# Verificar variables de ambiente:

echo $ASSEMBLYAI_API_KEY   # Debe tener valor
echo $MINIO_HOST           # Debe tener valor
echo $DATABASE_URL         # Debe tener valor
echo $CLAUDE_API_KEY       # Debe tener valor
```

### 1.2 Hacer backup de la base de datos (IMPORTANTE)

```bash
# Hacer backup del PostgreSQL
pg_dump -h localhost -U user -d learpmind > backup_before_migration.sql

# Hacer backup de MinIO (opcional pero recomendado)
# Usa MC (MinIO Client) para hacer backup
```

---

## 📦 Paso 2: Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

**Esperado:** `npm install` sin errores

---

## 🏗️ Paso 3: Compilar Código

### 3.1 Backend

```bash
cd backend
npm run build
```

**Esperado:**
```
✓ Successfully compiled NestJS project
No errors
```

### 3.2 Frontend

```bash
cd frontend
npm run build
```

**Esperado:**
```
✓ built in 2.06s
No TypeScript errors
```

---

## 🗄️ Paso 4: Ejecutar Migración

### 4.1 Verificar que la migración existe

```bash
ls -la src/migrations | grep 1740000001000
```

**Esperado:** Ver archivo `1740000001000-AddAudioSummaryAndStoragePaths.ts`

### 4.2 Ejecutar la migración

```bash
cd backend
npm run migration:run
```

**Esperado:**
```
Query: CREATE TABLE IF NOT EXISTS "typeorm_metadata" ...
Migration 1740000001000-AddAudioSummaryAndStoragePaths has been executed successfully.
```

### 4.3 Verificar que los campos se crearon

```bash
# Conectarse a la BD
psql -h localhost -U user -d learpmind

# En psql, ejecutar:
\d audio_results

# Esperado: Ver las columnas:
# - summary
# - transcriptionMinioPath
# - summaryMinioPath
# - audioMinioPath

\d uploads

# Esperado: Ver la columna:
# - summary
```

---

## 🚀 Paso 5: Iniciar Servicios

### 5.1 Terminal 1: Iniciar Backend

```bash
cd backend
npm start
```

**Esperado:**
```
[NestFactory] Starting Nest application...
Listening on port 3000
Logger connected to MongoDB
...
[AudioModule] Audio module initialized
```

### 5.2 Terminal 2: Iniciar Frontend

```bash
cd frontend
npm run dev
```

**Esperado:**
```
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## 🧪 Paso 6: Testing Completo

### 6.1 Verificar que Backend está respondiendo

```bash
curl http://localhost:3000/health
```

**Esperado:** `{"status":"ok"}`

### 6.2 Abrir la Aplicación

```
Abrir navegador: http://localhost:5173
```

### 6.3 Test Case 1: Subir un Audio

1. Haz clic en "Subir archivos" (modal)
2. Haz clic en "Nuevo Archivo"
3. Selecciona un archivo MP3 o WAV (< 100MB)
4. Espera a que se suba

**Esperado:** Ver spinner de progreso

### 6.4 Test Case 2: Verificar Procesamiento

1. El frontend hace polling cada 2 segundos
2. Deberías ver en consola del backend:
   ```
   [AudioProcessor] Processing audio job X for upload Y
   [AudioProcessor] File uploaded to AssemblyAI
   [AudioProcessor] Transcription submitted
   [AudioProcessor] Generating AI summary for audio Y
   [AudioProcessor] AI summary generated
   [AudioProcessor] Transcription saved to MinIO
   [AudioProcessor] Summary saved to MinIO
   [AudioProcessor] Audio file saved to MinIO
   [AudioProcessor] Audio processing completed
   ```

### 6.5 Test Case 3: Verificar Resultado

1. Cuando el procesamiento termine (puede tomar 1-5 minutos)
2. Deberías ver:
   ```
   ✓ Tu Resumen de Audio está Listo
   
   📝 Resumen de IA
   [Texto del resumen - 200-300 caracteres]
   
   ✓ Archivos guardados en MinIO:
   • Archivo de audio original
   • Transcripción completa
   • Resumen de IA
   
   [Descargar Resumen] [Procesar Otro Audio]
   ```

### 6.6 Test Case 4: Descargar Resumen

1. Haz clic en "Descargar Resumen"
2. Se descargará un archivo `resumen_audio.txt`
3. Abre el archivo y verifica que contenga el resumen

**Esperado:** Archivo contiene el resumen de IA

### 6.7 Test Case 5: Verificar MinIO

1. Abre MinIO Browser (http://localhost:9001)
2. Navega a bucket `results`
3. Deberías ver:
   ```
   results/
   ├── audio/
   │   ├── files/
   │   │   └── {your-user-id}/{upload-id}-audioFile.wav
   │   └── transcriptions/
   │       └── {your-user-id}/{upload-id}-transcription.txt
   └── summaries/
       └── {your-user-id}/{upload-id}-summary.txt
   ```

### 6.8 Test Case 6: Verificar Base de Datos

```bash
# Conectar a BD
psql -h localhost -U user -d learpmind

# En psql:
SELECT 
  id,
  transcription,
  summary,
  transcriptionMinioPath,
  summaryMinioPath,
  audioMinioPath
FROM audio_results
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Esperado:** Ver los campos llenos con los datos del audio que acabas de subir

---

## ✅ Paso 7: Verificación Final

### Checklist de Validación

- [ ] Backend está compilado y corriendo
- [ ] Frontend está compilado y corriendo
- [ ] Migración se ejecutó sin errores
- [ ] BD tiene nuevos campos
- [ ] Audio se procesó completamente
- [ ] UI muestra resumen (no transcripción)
- [ ] Información de MinIO está visible
- [ ] Archivo se puede descargar
- [ ] MinIO contiene 3 archivos
- [ ] BD tiene rutas guardadas

---

## 🔍 Troubleshooting

### Problema: "ASSEMBLYAI_API_KEY not set"
```
Solución: Verificar que .env tiene ASSEMBLYAI_API_KEY=your_key
```

### Problema: "Migration not found"
```
Solución: Verificar que 1740000001000-...ts existe en src/migrations/
```

### Problema: "Cannot connect to MinIO"
```
Solución: Verificar que MinIO está corriendo
         Verificar credenciales en .env
```

### Problema: "Audio no se procesa"
```
Solución: Ver logs del backend
         Verificar AssemblyAI API key
         Verificar conexión a internet
```

### Problema: "UI muestra transcripción en lugar de resumen"
```
Solución: Esperar un poco más (IA está generando)
         Si pasa mucho tiempo, verificar logs del backend
```

### Problema: "Archivos no se guardan en MinIO"
```
Solución: Verificar que MinIO está corriendo
         Verificar logs: "Failed to save files to MinIO"
```

---

## 📊 Performance Esperado

| Tarea | Tiempo Esperado |
|-------|-----------------|
| Subida del audio | 1-5 segundos |
| Transcripción | 1-2 minutos |
| Generación de resumen | 10-30 segundos |
| **Total** | **2-3 minutos** |

---

## 🎉 Éxito

Si llegaste aquí sin errores:

```
✅ Audio AI Summary Implementation
✅ Database Migration Applied
✅ All Tests Passed
✅ Ready for Production

Congratulations! 🎊
```

---

## 📞 Contacto para Soporte

Si tienes problemas:

1. Verifica los logs del backend
2. Abre la consola del navegador (F12)
3. Verifica que todas las API keys estén en .env
4. Verifica que todos los servicios estén corriendo

---

## 🔄 Rollback (Si es Necesario)

```bash
# Revertir la migración
cd backend
npm run migration:revert

# Restaurar BD desde backup
psql -h localhost -U user -d learpmind < backup_before_migration.sql
```

