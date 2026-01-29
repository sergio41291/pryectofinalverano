"""
LearnMind AI - Paddle OCR Service
Servicio de OCR usando PaddleOCR para extracción de texto
"""

import os
import sys
import json
import base64
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from io import BytesIO

# Importar PaddleOCR
from paddleocr import PaddleOCR
from PIL import Image
import numpy as np

class PaddleOCRService:
    """
    Servicio de OCR con Paddle OCR
    Soporta idiomas múltiples y devuelve resultados estructurados
    """
    
    def __init__(
        self,
        lang: str = 'es',
        lang_main: str = 'en',
        gpu: bool = False,
        gpu_id: int = 0,
        show_log: bool = False,
        use_angle_cls: bool = True,
        use_dilation: bool = False,
    ):
        """
        Inicializar PaddleOCR
        
        Args:
            lang: Idioma principal (español 'es')
            lang_main: Idioma secundario
            gpu: Usar GPU si está disponible
            gpu_id: ID de GPU a usar
            show_log: Mostrar logs de paddle
            use_angle_cls: Usar clasificador de ángulos
            use_dilation: Usar dilatación de imagen
        """
        self.lang = [lang, lang_main] if lang != lang_main else [lang]
        self.gpu = gpu
        self.show_log = show_log
        
        # Inicializar OCR
        self.ocr = PaddleOCR(
            use_gpu=gpu,
            gpu_id=gpu_id,
            lang=self.lang,
            show_log=show_log,
            use_angle_cls=use_angle_cls,
            use_dilation=use_dilation,
            enable_mkldnn=not gpu,  # MKLDNN para CPU
            det_db_thresh=0.3,
            det_db_box_thresh=0.5,
            rec_batch_num=6,
            max_side_len=960,
        )
        
    def extract_from_image(
        self,
        image_path: str,
        return_boxes: bool = False,
        confidence_threshold: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Extraer texto de una imagen
        
        Args:
            image_path: Ruta a la imagen
            return_boxes: Retornar coordenadas de bounding boxes
            confidence_threshold: Umbral mínimo de confianza
            
        Returns:
            Dict con texto extraído y metadatos
        """
        try:
            # Verificar que el archivo existe
            if not os.path.exists(image_path):
                return {
                    'success': False,
                    'error': f'File not found: {image_path}'
                }
            
            # Realizar OCR
            result = self.ocr.ocr(image_path, cls=True)
            
            # Procesar resultados
            return self._process_ocr_result(
                result,
                return_boxes=return_boxes,
                confidence_threshold=confidence_threshold
            )
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def extract_from_bytes(
        self,
        image_bytes: bytes,
        filename: str = 'image.jpg',
        return_boxes: bool = False,
        confidence_threshold: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Extraer texto de bytes de imagen
        
        Args:
            image_bytes: Bytes de la imagen
            filename: Nombre del archivo (para referencia)
            return_boxes: Retornar coordenadas
            confidence_threshold: Umbral de confianza
            
        Returns:
            Dict con resultados
        """
        try:
            # Convertir bytes a imagen PIL
            image = Image.open(BytesIO(image_bytes))
            
            # Convertir a numpy array
            image_array = np.array(image)
            
            # Si es escala de grises, convertir a BGR (3 canales)
            if len(image_array.shape) == 2:
                image_array = np.stack([image_array] * 3, axis=-1)
            
            # Realizar OCR
            result = self.ocr.ocr(image_array, cls=True)
            
            return self._process_ocr_result(
                result,
                filename=filename,
                return_boxes=return_boxes,
                confidence_threshold=confidence_threshold
            )
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def extract_from_pdf(
        self,
        pdf_path: str,
        return_boxes: bool = False,
        confidence_threshold: float = 0.0,
        max_pages: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Extraer texto de un PDF (página por página)
        
        Args:
            pdf_path: Ruta al PDF
            return_boxes: Retornar coordenadas
            confidence_threshold: Umbral de confianza
            max_pages: Máximo de páginas a procesar
            
        Returns:
            Dict con resultados por página
        """
        try:
            import pdf2image
            
            # Convertir PDF a imágenes
            images = pdf2image.convert_from_path(pdf_path, first_page=1, last_page=max_pages)
            
            all_results = []
            total_text = ""
            
            for page_num, image in enumerate(images, 1):
                # Convertir PIL image a numpy array
                image_array = np.array(image)
                
                # OCR en imagen
                result = self.ocr.ocr(image_array, cls=True)
                
                processed = self._process_ocr_result(
                    result,
                    return_boxes=return_boxes,
                    confidence_threshold=confidence_threshold
                )
                
                if processed['success']:
                    all_results.append({
                        'page_number': page_num,
                        'text': processed['text'],
                        'raw_text': processed['raw_text'],
                        'confidence': processed['confidence'],
                        'boxes': processed.get('boxes', [])
                    })
                    total_text += f"\n--- Página {page_num} ---\n{processed['text']}"
            
            return {
                'success': True,
                'total_pages': len(images),
                'pages': all_results,
                'full_text': total_text,
                'average_confidence': sum(p['confidence'] for p in all_results) / len(all_results) if all_results else 0
            }
            
        except ImportError:
            return {
                'success': False,
                'error': 'pdf2image is required for PDF support. Install with: pip install pdf2image'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _process_ocr_result(
        self,
        ocr_result: List,
        filename: str = "",
        return_boxes: bool = False,
        confidence_threshold: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Procesar resultado bruto de PaddleOCR
        
        Args:
            ocr_result: Resultado del OCR
            filename: Nombre del archivo
            return_boxes: Retornar bounding boxes
            confidence_threshold: Umbral de confianza
            
        Returns:
            Dict procesado
        """
        if not ocr_result or not ocr_result[0]:
            return {
                'success': False,
                'error': 'No text detected in image'
            }
        
        texts = []
        boxes = []
        confidences = []
        
        for line in ocr_result[0]:
            box, (text, confidence) = line
            
            # Filtrar por confianza
            if confidence >= confidence_threshold:
                texts.append(text)
                confidences.append(confidence)
                
                if return_boxes:
                    boxes.append({
                        'text': text,
                        'confidence': float(confidence),
                        'box': box  # [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
                    })
        
        raw_text = '\n'.join(texts)
        
        # Limpiar texto
        cleaned_text = self._clean_text(raw_text)
        
        result = {
            'success': True,
            'filename': filename,
            'text': cleaned_text,
            'raw_text': raw_text,
            'confidence': float(np.mean(confidences)) if confidences else 0.0,
            'text_count': len(texts),
            'box_count': len(boxes) if return_boxes else 0,
        }
        
        if return_boxes:
            result['boxes'] = boxes
        
        return result
    
    @staticmethod
    def _clean_text(text: str) -> str:
        """
        Limpiar texto extraído
        
        Args:
            text: Texto sin procesar
            
        Returns:
            Texto limpiado
        """
        # Remover espacios múltiples
        text = ' '.join(text.split())
        
        # Remover caracteres especiales problemáticos
        # pero mantener acentos y caracteres del idioma
        
        return text


# ============================================
# SCRIPT STANDALONE PARA TESTING
# ============================================

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python paddle_ocr_service.py <image_path> <output_json_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_path = sys.argv[2]
    
    # Inicializar servicio
    ocr_service = PaddleOCRService(
        lang='es',
        gpu=False,
        show_log=False
    )
    
    # Extraer texto
    result = ocr_service.extract_from_image(image_path, return_boxes=True)
    
    # Guardar resultado
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"✅ OCR completed. Results saved to {output_path}")
    print(f"Confidence: {result.get('confidence', 0):.2%}")
