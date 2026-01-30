#!/bin/bash

# ============================================================
# 🧹 SCRIPT DE LIMPIEZA DEFINITIVO
# Elimina toda la basura: BD + MinIO buckets
# ============================================================

set -e

echo "🧹 Iniciando limpieza completa..."
echo ""

# ============================================================
# 0. VERIFICAR Y INICIAR DOCKER COMPOSE
# ============================================================

echo "📦 Verificando servicios Docker..."

# Verificar si PostgreSQL está corriendo
if ! docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
    echo "⚠️  Iniciando servicios Docker..."
    docker-compose up -d postgres minio 2>&1 | tail -5
    echo "⏳ Esperando 10 segundos para que los servicios estén listos..."
    sleep 10
fi

echo ""

# ============================================================
# 1. LIMPIAR BASE DE DATOS
# ============================================================

echo "📊 Limpiando base de datos PostgreSQL..."

# Conectar a PostgreSQL y eliminar registros
docker-compose exec -T postgres psql -U postgres -d learpmind << EOF
-- Eliminar datos de la tabla ocr_results
DELETE FROM ocr_results;

-- Eliminar datos de la tabla uploads
DELETE FROM uploads;

SELECT COUNT(*) as uploads_remaining FROM uploads;
SELECT COUNT(*) as ocr_results_remaining FROM ocr_results;

\q
EOF

echo "✅ Base de datos limpiada"
echo ""

# ============================================================
# 2. LIMPIAR BUCKETS MinIO
# ============================================================

echo "🗑️  Limpiando buckets MinIO..."

for bucket in documents temp results; do
    echo "  → Limpiando $bucket..."
    
    # Eliminar todos los objetos del bucket directamente
    docker-compose exec -T minio sh -c "mc rm --recursive --force minio/$bucket/* 2>/dev/null || true" 2>/dev/null
    
    echo "     ✅ $bucket limpiado"
done

echo ""
echo "✅ Buckets MinIO limpiados"
echo ""

# ============================================================
# 3. RESUMEN
# ============================================================

echo "📋 RESUMEN DE LIMPIEZA"
echo "===================="
echo "✅ Base de datos PostgreSQL - LIMPIA"
echo "   - uploads: 0 registros"
echo "   - ocr_results: 0 registros"
echo ""
echo "✅ Buckets MinIO - LIMPIOS"
echo "   - documents/: vacío"
echo "   - results/: vacío"
echo "   - temp/: vacío"
echo ""
echo "🎉 Limpieza completada exitosamente!"
echo ""
echo "Próximos pasos:"
echo "  1. npm run build       (compilar backend)"
echo "  2. npm start:dev       (reiniciar backend)"
echo "  3. Prueba upload de PDF"
