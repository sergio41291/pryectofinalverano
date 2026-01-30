"""
LearnMind AI - PaddleOCR Service
Servicio de OCR usando PaddleOCR 3.4.0 (API oficial con soporte nativo para PDF)
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any
import os

from paddleocr import PaddleOCR


class PaddleOCRService:
    """Servicio OCR usando PaddleOCR 3.4.0 con soporte nativo para PDF"""

    def __init__(self, lang: str = "es"):
        """
        Inicializar PaddleOCR
        
        Args:
            lang: Código de idioma (ej: 'es' para español por defecto)
        """
        self.lang = lang
        try:
            print(f"[OCR] Inicializando OCR con idioma: {lang}")
            self.ocr = PaddleOCR(
                lang=lang,
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False
            )
            print(f"[OCR] OCR inicializado exitosamente")
        except Exception as e:
            print(f"[ERROR] Error inicializando OCR: {e}")
            raise

    def extract_text(self, input_path: str) -> Dict[str, Any]:
        """
        Extraer texto de una imagen o PDF usando PaddleOCR
        PaddleOCR soporta PDF nativo según documentación oficial
        
        Args:
            input_path: Ruta a la imagen o PDF
            
        Returns:
            Diccionario con resultados del OCR
        """
        try:
            # Verificar que el archivo existe
            if not Path(input_path).exists():
                return {
                    "success": False,
                    "error": f"Archivo no encontrado: {input_path}"
                }

            file_type = "PDF" if input_path.lower().endswith('.pdf') else "Imagen"
            print(f"[DEBUG] Iniciando OCR con PaddleOCR para {file_type}: {input_path}")
            
            # PaddleOCR 3.4.0 soporta PDF directamente según documentación oficial
            # https://www.paddleocr.ai/latest/version3.x/pipeline_usage/OCR.html#22-python
            result = self.ocr.predict(input_path)
            
            if not result or len(result) == 0:
                print(f"[WARNING] OCR returned empty result for: {input_path}")
                return {
                    "success": False,
                    "error": "OCR returned empty result"
                }

            # Procesar resultados
            text_lines = []
            full_text = ""
            confidence_scores = []

            if result and len(result) > 0:
                for line in result:
                    if line:
                        for word_info in line:
                            bbox, (text, confidence) = word_info
                            text_lines.append({
                                "text": text,
                                "confidence": float(confidence),
                                "bbox": [
                                    [float(p[0]), float(p[1])] for p in bbox
                                ]
                            })
                            full_text += text + " "
                            confidence_scores.append(float(confidence))

            return {
                "success": True,
                "file": input_path,
                "file_type": file_type,
                "full_text": full_text.strip(),
                "text": full_text.strip(),
                "lines": text_lines,
                "statistics": {
                    "total_lines": len(text_lines),
                    "average_confidence": (
                        sum(confidence_scores) / len(confidence_scores)
                        if confidence_scores else 0
                    )
                }
            }

        except Exception as e:
            print(f"[ERROR] Excepción en extract_text: {e}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "error": f"Error durante OCR: {str(e)}"
            }

    def process_file(self, input_path: str, output_path: str, lang: str = "es") -> None:
        """
        Procesar un archivo (PDF o imagen) y guardar resultados en JSON
        
        Args:
            input_path: Ruta al archivo de entrada (PDF o imagen)
            output_path: Ruta al archivo JSON de salida
            lang: Idioma para OCR
        """
        print(f"\n============================================================")
        print(f"[MAIN] Procesando archivo: {input_path}")
        print(f"[MAIN] Idioma: {lang}")
        print(f"============================================================\n")
        
        try:
            # Procesar directamente (PaddleOCR soporta PDF nativo)
            result = self.extract_text(input_path)
            
            if not result.get('success'):
                print(f"[ERROR] Fallo en OCR: {result.get('error', 'Unknown error')}")
                final_result = {
                    "success": False,
                    "error": result.get('error', 'Unknown error'),
                    "pages": []
                }
            else:
                # Exito - guardar resultado
                print(f"[OK] OCR exitoso")
                final_result = {
                    "success": True,
                    "file": input_path,
                    "extracted_text": result.get('text', ''),
                    "full_result": result,
                    "pages": [result]  # PaddleOCR retorna todo en una llamada para PDF
                }
            
            # Guardar resultado en JSON
            print(f"[OK] Resultado guardado en: {output_path}")
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(final_result, f, ensure_ascii=False, indent=2)

                for page_num, image_path in enumerate(temp_images, 1):
                    print(f"[MAIN] Procesando página {page_num}/{len(temp_images)}")
                    result = self.extract_text(image_path)
                    all_results.append(result)
            else:
                print(f"[MAIN] Detectado archivo de imagen")
                result = self.extract_text(input_path)
                all_results.append(result)
            
            # Combinar resultados
            combined_text = ""
            combined_lines = []
            all_confidences = []
            
            for result in all_results:
                if result.get("success"):
                    combined_text += result.get("full_text", "") + "\n"
                    combined_lines.extend(result.get("lines", []))
                    stats = result.get("statistics", {})
                    if stats.get("average_confidence"):
                        all_confidences.append(stats.get("average_confidence"))
            
            final_result = {
                "success": any(r.get("success") for r in all_results),
                "full_text": combined_text.strip(),
                "text": combined_text.strip(),
                "lines": combined_lines,
                "statistics": {
                    "total_lines": len(combined_lines),
                    "average_confidence": (
                        sum(all_confidences) / len(all_confidences)
                        if all_confidences else 0
                    ),
                    "pages_processed": len(all_results)
                }
            }
            
            # Guardar resultado como JSON
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(final_result, f, ensure_ascii=False, indent=2)
            
            print(f"\n[OK] Resultado guardado en: {output_path}")
            print(f"[SUCCESS] Procesamiento completado!\n")
            
        finally:
            # Limpiar imágenes temporales
            for temp_image in temp_images:
                try:
                    if os.path.exists(temp_image):
                        os.remove(temp_image)
                        print(f"[CLEANUP] Eliminado: {temp_image}")
                except Exception as e:
                    print(f"[CLEANUP] Error eliminando {temp_image}: {e}")


def main():
    """Función principal para uso desde línea de comandos"""
    if len(sys.argv) < 3:
        print("Uso: python paddle_ocr_service.py <archivo> <output.json> [idioma]")
        print("Ejemplo: python paddle_ocr_service.py test.pdf output.json es")
        print("Idiomas soportados: es (español), en (inglés), fr (francés), etc.")
        sys.exit(1)

    input_file = sys.argv[1]
    output_json = sys.argv[2]
    lang = sys.argv[3] if len(sys.argv) > 3 else "es"

    try:
        service = PaddleOCRService(lang=lang)
        service.process_file(input_file, output_json, lang)
    except Exception as e:
        print(f"[ERROR] Procesamiento fallido: {e}")
        import traceback
        print(traceback.format_exc())
        
        # Guardar error en JSON
        error_result = {
            "success": False,
            "error": str(e)
        }
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(error_result, f, ensure_ascii=False, indent=2)
        
        sys.exit(1)


if __name__ == "__main__":
    main()

