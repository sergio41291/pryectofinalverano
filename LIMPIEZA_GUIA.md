# 🧹 LIMPIEZA - SOLUCIÓN DEFINITIVA

## Situación Actual
Después de restaurar la estructura de 3 buckets en MinIO, necesitas limpiar:
- **Base de datos**: Todos los registros inválidos de `uploads` y `ocr_results`
- **MinIO bucket `documents`**: Todos los archivos basura acumulados

## Scripts de Limpieza

### OPCIÓN 1: Si usas Windows/PowerShell
```powershell
.\cleanup.ps1
```

### OPCIÓN 2: Si usas Linux/Mac/WSL/Bash
```bash
./cleanup.sh
```

## ¿Qué hace cada script?

✅ **Paso 1: Limpia Base de Datos PostgreSQL**
- Elimina TODOS los registros de tabla `uploads`
- Elimina TODOS los registros de tabla `ocr_results`
- Resetea los auto-increment para empezar en 1

✅ **Paso 2: Limpia Buckets MinIO**
- Elimina TODOS los archivos del bucket `documents/`
- Deja intactos los buckets `results/` y `temp/` (están vacíos de todas formas)

✅ **Paso 3: Muestra confirmación**
- Verifica que todo quedó limpio

## Paso a Paso

```bash
# 1. Asegúrate que docker-compose está corriendo
docker-compose ps

# 2. Ejecuta el script de limpieza
.\cleanup.ps1                # Windows PowerShell
# O
./cleanup.sh                 # Linux/Mac/Bash

# 3. Espera a que termine (muestra ✅)

# 4. Compila backend
cd backend
npm run build

# 5. Reinicia backend
npm start:dev

# 6. Prueba: sube un PDF
# - Debe guardarse en documents/
# - OCR debe guardarse en results/ocr/
# - Resumen debe guardarse en results/summaries/
```

## ¿Qué pasa si da error?

### Error: "command not found: docker-compose"
```bash
# Intenta con:
docker compose ps    # (docker con espacio, versión más nueva)
```

### Error: "Cannot connect to PostgreSQL"
```bash
# Verifica que el contenedor PostgreSQL está corriendo:
docker-compose ps | grep postgres
```

### Error: "Cannot connect to MinIO"
```bash
# Verifica que MinIO está corriendo:
docker-compose ps | grep minio
```

## Archivos de Limpieza Disponibles

```
c:\work\U\pryectofinalverano\
├── cleanup.ps1          ← Script Windows (RECOMENDADO para Windows)
└── cleanup.sh           ← Script Bash (RECOMENDADO para Linux/Mac)
```

## Cambios en el Código

✅ `storage.service.ts` - Restaurados 3 buckets
✅ `ocr.processor.ts` - OCR guarda en `results/ocr/`
✅ Resúmenes guardan en `results/summaries/`
✅ Archivos fallidos van a `temp/`

**No hay más scripts duplicados, no hay más basura acumulada.**

## Próximas Pruebas

Después de ejecutar `cleanup.ps1`:

1. **Upload PDF**
   - Verifica en MinIO que se guardó en `documents/user-id/filename.pdf`

2. **OCR extrae**
   - Verifica en MinIO que se guardó en `results/ocr/user-id/uploadId-ocr.txt`

3. **Resumen genera**
   - Verifica en MinIO que se guardó en `results/summaries/user-id/uploadId-summary.txt`

4. **Download funciona**
   - Usuario puede descargar el resumen

**¡Fin del proceso de limpieza!** 🎉
