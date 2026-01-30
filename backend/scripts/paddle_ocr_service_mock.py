"""
LearnMind AI - PaddleOCR Service (MOCK VERSION FOR TESTING)
Mock version that returns sample OCR results without requiring PaddleOCR to be installed
"""

import json
import sys
from pathlib import Path
import os

def main():
    """Función principal para uso desde línea de comandos"""
    if len(sys.argv) < 3:
        print("Uso: python paddle_ocr_service_mock.py <archivo> <output.json> [idioma]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_json = sys.argv[2]
    lang = sys.argv[3] if len(sys.argv) > 3 else "es"

    print(f"\n{'='*60}")
    print(f"[MOCK] Procesando archivo: {input_file}")
    print(f"[MOCK] Idioma: {lang}")
    print(f"{'='*60}\n")
    
    try:
        # Generate mock OCR results
        mock_text = """Este es un documento de prueba. 
        Contiene múltiples líneas de texto para demostrar que el sistema OCR está funcionando correctamente.
        Se puede extraer texto de documentos PDF e imágenes.
        El sistema utiliza PaddleOCR para reconocimiento óptico de caracteres.
        Los resultados son procesados y almacenados en la base de datos.
        También se generan resúmenes automáticos usando Claude API."""
        
        result = {
            "success": True,
            "file": input_file,
            "file_type": "pdf" if input_file.lower().endswith('.pdf') else "image",
            "pages": 1,
            "full_text": mock_text,
            "text": mock_text,
            "lines": [
                {
                    "text": line.strip(),
                    "confidence": 0.95,
                    "bbox": [[0, 0], [100, 0], [100, 20], [0, 20]]
                }
                for line in mock_text.split('\n') if line.strip()
            ],
            "statistics": {
                "total_lines": len([l for l in mock_text.split('\n') if l.strip()]),
                "total_pages": 1,
                "average_confidence": 0.95
            }
        }
        
        # Save result as JSON
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"[OK] Resultado guardado en: {output_json}")
        print(f"[OK] Texto extraído: {len(mock_text)} caracteres\n")
        
    except Exception as e:
        print(f"\n[FATAL] Error fatal: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
