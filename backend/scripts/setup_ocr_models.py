"""
LearnMind AI - Setup OCR Models
Descarga y cachea los modelos de PaddleOCR para uso offline posterior
Ejecutar una sola vez: python setup_ocr_models.py
"""

import os
import sys
import time
from pathlib import Path

print("=" * 60)
print("🚀 LearnMind AI - OCR Model Setup")
print("=" * 60)
print()

# Crear directorio de cache
cache_dir = Path.home() / ".paddleocr" / "models"
cache_dir.mkdir(parents=True, exist_ok=True)

print(f"📁 Directorio de modelos: {cache_dir}")
print()

# Intentar importar PaddleOCR
try:
    from paddleocr import PaddleOCR
    print("✅ PaddleOCR instalado correctamente")
except ImportError:
    print("❌ Error: PaddleOCR no está instalado")
    print("   Instala con: pip install paddleocr")
    sys.exit(1)

print()
print("📥 Descargando modelos de OCR...")
print("   (Esta operación puede tardar 5-15 minutos la primera vez)")
print("   (Se guardará en caché para uso offline)")
print()

try:
    start_time = time.time()
    
    # Descargar modelos para español e inglés
    print("   • Inicializando modelo multilingual (ch)...")
    ocr = PaddleOCR(
        lang='ch',  # Modelo multilingual que incluye español e inglés
    )
    
    # Realizar un OCR de prueba para asegurar que todo esté descargado
    print("   • Realizando OCR de prueba...")
    test_img = os.path.join(os.path.dirname(__file__), '../../credentials/test.jpg')
    
    if os.path.exists(test_img):
        result = ocr.ocr(test_img, cls=True)
        print(f"   ✓ OCR de prueba exitoso")
    else:
        print(f"   ℹ️  Imagen de prueba no encontrada (normal)")
    
    elapsed = time.time() - start_time
    
    print()
    print("=" * 60)
    print("✅ Setup completado exitosamente!")
    print(f"⏱️  Tiempo total: {elapsed:.1f} segundos")
    print("=" * 60)
    print()
    print("📝 Próximos pasos:")
    print("   1. Los modelos están en caché y se usarán automáticamente")
    print("   2. En el QUICKSTART, ejecuta: python backend/scripts/paddle_ocr_service.py")
    print("   3. El OCR ahora usará modelos reales en lugar del modo test")
    print()
    
except Exception as e:
    print()
    print("=" * 60)
    print(f"❌ Error durante la descarga: {str(e)[:100]}")
    print("=" * 60)
    print()
    print("Soluciones posibles:")
    print("  • Verifica tu conexión a internet")
    print("  • Intenta de nuevo en unos minutos")
    print("  • El script OCR seguirá funcionando en modo test/mock")
    print()
    sys.exit(1)
