# Implementación de Limpieza de Archivos en MinIO

## Problema Identificado
- Cuando las subidas de archivos fallan, quedan archivos huérfanos en el bucket
- Si el procesamiento de OCR falla, los archivos persisten sin servir propósito
- Esto puede llenar el almacenamiento innecesariamente

## Solución Implementada

### 1. **Rollback en Caso de Error de Subida** 
   - **Archivo**: `backend/src/modules/uploads/uploads.controller.ts`
   - **Cambio**: En el método `uploadFile()`, si `ocrService.initiateOcrProcessing()` falla:
     1. Se llama a `uploadsService.deleteUploadAndFile(upload.id)`
     2. Se elimina el archivo del bucket MinIO
     3. Se elimina el registro de la base de datos
     4. Se retorna error al cliente

### 2. **Rollback en Caso de Error de OCR**
   - **Archivo**: `backend/src/modules/ocr/ocr.processor.ts`
   - **Cambio**: En el handler del job de Bull, si el procesamiento falla:
     1. Se marca como `status: 'failed'` en la BD
     2. Se llama a `uploadsService.deleteUploadAndFile(uploadId)`
     3. Se elimina el archivo y el registro de la BD
     4. Se notifica al usuario vía WebSocket

### 3. **Nuevos Métodos Agregados**

#### `StorageService.deleteDocumentInternal(path: string)`
```typescript
// Elimina archivos sin validación de usuario (uso interno)
// Best-effort: no lanza error si el archivo no existe
// Se usa durante rollback/limpieza
```

#### `UploadsService.deleteUploadAndFile(uploadId: string)`
```typescript
// Elimina tanto el archivo como el registro de la BD
// 1. Intenta eliminar el archivo de MinIO
// 2. Elimina el registro de Upload y OcrResults en cascada
// 3. Logging de errores pero continúa ejecución
```

### 4. **Flujo de Limpieza**

#### Caso 1: Error en Subida de Archivo
```
Usuario intenta subir archivo
    ↓
uploadService.createFromFile() → OK (archivo en MinIO, registro en BD)
    ↓
ocrService.initiateOcrProcessing() → FALLA
    ↓
Capturar error en try/catch
    ↓
uploadsService.deleteUploadAndFile(upload.id)
    ↓
✓ Archivo eliminado de MinIO
✓ Registros eliminados de BD
    ↓
Retornar error al cliente: "OCR processing failed. File has been removed."
```

#### Caso 2: Error en Procesamiento de OCR
```
Job de Bull intenta procesar OCR
    ↓
executeOcrService() → FALLA
    ↓
Capturar error en catch block
    ↓
Marcar OcrResult como 'failed'
    ↓
uploadsService.deleteUploadAndFile(uploadId)
    ↓
✓ Archivo eliminado de MinIO
✓ Upload y OcrResults eliminados de BD
    ↓
Notificar usuario vía WebSocket
```

### 5. **Manejo de Errores Robusto**
- Ambos métodos de limpieza usan best-effort approach
- Si falla la eliminación del archivo en MinIO, se continúa con la BD
- Si falla la BD, se registra el error pero no se propaga
- Garantiza que al menos se intente limpiar

### 6. **Script de Limpieza Manual**
   - **Archivo**: `scripts/cleanup-minio.ps1`
   - **Función**: Limpiar todos los buckets si es necesario
   - **Uso**: `powershell -ExecutionPolicy Bypass -File scripts\cleanup-minio.ps1`
   - **Buckets limpiados**: documents, temp, results

## Beneficios

✅ **Prevención de Fuga de Almacenamiento**
- Archivos no se quedan huérfanos
- Espacio se libera automáticamente ante errores

✅ **Integridad de Datos**
- Registros de BD y archivos en sincronía
- Sin archivos sin registros o registros sin archivos

✅ **User Experience**
- Errores claros al usuario
- No hay sorpresas con archivos fallidos

✅ **Auditoria**
- Logs detallados de eliminaciones
- Trazabilidad completa de qué y por qué se eliminó

## Configuración en docker-compose.yml
```yaml
minio-init:
  entrypoint: >
    /bin/sh -c "
    until /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin123; do echo 'waiting'; sleep 1; done;
    /usr/bin/mc mb myminio/documents;    # Bucket para archivos originales
    /usr/bin/mc mb myminio/temp;         # Bucket para procesamiento temporal
    /usr/bin/mc mb myminio/results;      # Bucket para resultados procesados
    /usr/bin/mc version enable myminio/documents;
    exit 0;
    "
```

**Nota**: Los 3 buckets se crean automáticamente pero solo se usa `documents` actualmente. `temp` y `results` pueden usarse en futuras optimizaciones.
