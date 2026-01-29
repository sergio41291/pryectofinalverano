# Script para limpiar archivos en MinIO
# Uso: .\scripts\cleanup-minio.ps1

$buckets = @("documents", "temp", "results")

foreach ($bucket in $buckets) {
    Write-Host "Limpiando bucket: $bucket" -ForegroundColor Cyan
    
    $files = docker-compose exec -T minio mc ls "myminio/$bucket" --recursive 2>&1 | Select-String -Pattern "^\[" -NotMatch
    
    if ($files) {
        $fileCount = @($files).Count
        Write-Host "Encontrados $fileCount archivo(s) en $bucket" -ForegroundColor Yellow
        
        # Eliminar todos los archivos del bucket
        docker-compose exec -T minio mc rm "myminio/$bucket" --recursive --force 2>&1 | Out-Null
        
        Write-Host "✓ Bucket $bucket limpiado" -ForegroundColor Green
    } else {
        Write-Host "✓ Bucket $bucket vacío" -ForegroundColor Green
    }
}

Write-Host "`nLimpieza completada" -ForegroundColor Green
