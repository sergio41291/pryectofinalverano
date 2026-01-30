#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import json
import os
import tempfile
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime

try:
    import ocrmypdf
    OCRMYPDF_AVAILABLE = True
except ImportError:
    OCRMYPDF_AVAILABLE = False
    ocrmypdf = None

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    easyocr = None

try:
    from pdfminer.high_level import extract_text
    PDFMINER_AVAILABLE = True
except ImportError:
    PDFMINER_AVAILABLE = False
    extract_text = None

try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False
    convert_from_path = None


# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Changed from DEBUG to INFO to reduce noise
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress debug logs from external libraries
logging.getLogger('PIL').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('ocrmypdf').setLevel(logging.WARNING)


class OCRService:
    def __init__(self, language: str = 'es'):
        """Initialize OCR service with specified language."""
        # Store original 2-letter code
        self.original_language = language
        
        # Map 2-letter ISO codes to 3-letter ISO codes for Tesseract/OCRmyPDF
        self.language_mapping_tesseract = {
            'es': 'spa',  # Spanish
            'en': 'eng',  # English
            'de': 'deu',  # German
            'fr': 'fra',  # French
            'it': 'ita',  # Italian
            'pt': 'por',  # Portuguese
        }
        
        # Use 3-letter code for OCRmyPDF/Tesseract, 2-letter for EasyOCR
        self.language_tesseract = self.language_mapping_tesseract.get(language, language)
        self.language_easyocr = language  # EasyOCR uses 2-letter codes
        
        self.reader = None
        self.backend = None
        self._initialize_ocr()

    def _check_ocrmypdf_available(self) -> bool:
        """Check if OCRmyPDF can actually be used (has Ghostscript dependency)."""
        if not OCRMYPDF_AVAILABLE:
            return False
        try:
            import shutil
            # Check if ghostscript is available in PATH
            gs_found = any([
                shutil.which('gswin64c'),
                shutil.which('gswin32c'),
                shutil.which('gs')
            ])
            return gs_found
        except:
            return False

    def _initialize_ocr(self):
        """Initialize OCR backend - decision will be made per file based on type."""
        print(f"[OCR] Initializing OCR with language: {self.original_language}")
        
        # Check what backends are available (but don't initialize yet)
        self.ocrmypdf_available_with_gs = OCRMYPDF_AVAILABLE and self._check_ocrmypdf_available()
        self.easyocr_available = EASYOCR_AVAILABLE
        
        if self.ocrmypdf_available_with_gs:
            print(f"[OCR] OCRmyPDF + Ghostscript available for PDFs")
        else:
            print(f"[OCR] OCRmyPDF not available (Ghostscript missing)")
        
        if self.easyocr_available:
            print(f"[OCR] EasyOCR available for images and PDF fallback")
        else:
            print(f"[ERROR] EasyOCR not available!")
        
        # Initialize EasyOCR now (will be used for images and as fallback)
        if EASYOCR_AVAILABLE:
            try:
                # Use 2-letter code for EasyOCR
                self.reader = easyocr.Reader([self.language_easyocr], gpu=False)
                self.backend = 'easyocr'
                return
            except Exception as e:
                print(f"[ERROR] EasyOCR initialization failed: {e}")
                self.reader = None
        
        # No backend available
        raise RuntimeError(
            f"No OCR backend available: EasyOCR required but not available. "
            f"OCRMYPDF: {OCRMYPDF_AVAILABLE}, EASYOCR: {EASYOCR_AVAILABLE}"
        )

    def extract_text_with_ocrmypdf(self, pdf_path: str) -> Dict[str, Any]:
        """Process PDF with OCRmyPDF and extract text."""
        temp_dir = tempfile.gettempdir()
        output_pdf = os.path.join(
            temp_dir,
            f"ocr_output_{os.path.splitext(os.path.basename(pdf_path))[0]}.pdf"
        )
        
        try:
            print(f"[OCRmyPDF] Procesando PDF con OCRmyPDF: {pdf_path}")
            
            # Process PDF with OCRmyPDF using 3-letter Tesseract code
            result = ocrmypdf.ocr(
                pdf_path,
                output_pdf,
                language=self.language_tesseract,
                skip_text=False,
                deskew=True,
                progress_bar=False,
                force_ocr=True  # Force OCR even for PDFs with text (Tagged PDFs)
            )
            
            if result != ocrmypdf.ExitCode.ok:
                raise RuntimeError(f"OCRmyPDF failed with exit code: {result}")
            
            print(f"[OCRmyPDF] PDF procesado exitosamente")
            print(f"[OCRmyPDF] Extrayendo texto con pdfminer...")
            
            # Extract text from OCR'd PDF
            if not PDFMINER_AVAILABLE:
                raise RuntimeError("pdfminer.six not installed")
            
            extracted_text = extract_text(output_pdf)
            
            print(f"[OCRmyPDF] Texto extraído: {len(extracted_text)} caracteres")
            
            result = {
                'success': True,
                'text': extracted_text,
                'itemCount': len(extracted_text.split()),
                'pageCount': 1,
                'backend': 'ocrmypdf',
                'processingTime': datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            print(f"[ERROR] OCRmyPDF error: {e}")
            raise
        finally:
            # Clean up temporary PDF
            if os.path.exists(output_pdf):
                try:
                    os.remove(output_pdf)
                except:
                    pass

    def extract_text_with_pdf2image_easyocr(self, pdf_path: str) -> Dict[str, Any]:
        """Process PDF with pdf2image + EasyOCR."""
        if not PDF2IMAGE_AVAILABLE:
            raise RuntimeError("pdf2image not installed")
        
        temp_dir = tempfile.gettempdir()
        temp_image_paths = []
        
        try:
            print(f"[PDF2Image+EasyOCR] Convirtiendo PDF a imágenes: {pdf_path}")
            
            # Convert PDF pages to PIL images
            images = convert_from_path(pdf_path, dpi=200)
            print(f"[PDF2Image+EasyOCR] Convertidas {len(images)} páginas del PDF")
            
            # Save each page as temporary PNG
            for i, image in enumerate(images):
                temp_image_path = os.path.join(
                    temp_dir,
                    f"ocr_pdf_page_{i:03d}_{os.path.basename(pdf_path)}.png"
                )
                image.save(temp_image_path, 'PNG')
                temp_image_paths.append(temp_image_path)
                print(f"[PDF2Image+EasyOCR] Página {i+1} guardada en: {temp_image_path}")
            
            # Process all images with EasyOCR
            all_results = []
            page_results = []
            
            for page_idx, image_path in enumerate(temp_image_paths):
                try:
                    print(f"[PDF2Image+EasyOCR] Procesando página {page_idx + 1}/{len(temp_image_paths)}")
                    
                    results = self.reader.readtext(image_path, detail=1)
                    page_text = ' '.join([item[1] for item in results])
                    
                    page_results.append({
                        'page': page_idx + 1,
                        'text': page_text,
                        'itemCount': len(results)
                    })
                    
                    all_results.extend(results)
                    print(f"[PDF2Image+EasyOCR] Página {page_idx + 1} completada: {len(results)} elementos")
                    
                except Exception as e:
                    print(f"[ERROR] Error procesando página {page_idx + 1}: {e}")
                    raise
            
            # Combine all text
            full_text = '\n\n'.join([p['text'] for p in page_results])
            
            return {
                'success': True,
                'text': full_text,
                'itemCount': len(all_results),
                'pageCount': len(page_results),
                'pageResults': page_results,
                'backend': 'easyocr+pdf2image',
                'processingTime': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[ERROR] PDF2Image+EasyOCR error: {e}")
            raise
        finally:
            # Clean up temporary images
            for path in temp_image_paths:
                try:
                    os.remove(path)
                except:
                    pass

    def extract_text_with_easyocr(self, input_path: str) -> Dict[str, Any]:
        """Process image with EasyOCR."""
        try:
            print(f"[EasyOCR] Procesando archivo con EasyOCR: {input_path}")
            
            results = self.reader.readtext(input_path, detail=1)
            text = '\n'.join([item[1] for item in results])
            
            return {
                'success': True,
                'text': text,
                'itemCount': len(results),
                'pageCount': 1,
                'backend': 'easyocr',
                'processingTime': datetime.now().isoformat()
            }
                
        except Exception as e:
            print(f"[ERROR] EasyOCR error: {e}")
            raise

    def extract_text(self, input_path: str) -> Dict[str, Any]:
        """
        Extract text from document (PDF or image).
        Strategy:
        - PDF: Try OCRmyPDF first (if Ghostscript available), fallback to pdf2image+EasyOCR
        - Image: Use EasyOCR directly
        """
        try:
            print(f"\n{'='*60}")
            print(f"[MAIN] Procesando archivo: {input_path}")
            print(f"[MAIN] Idioma: {self.original_language}")
            print(f"{'='*60}\n")

            is_pdf = input_path.lower().endswith('.pdf')
            
            # PDF: Try OCRmyPDF first (if Ghostscript available), fallback to EasyOCR
            if is_pdf:
                if self.ocrmypdf_available_with_gs:
                    print(f"[MAIN] Backend: ocrmypdf (PDF optimized)")
                    try:
                        return self.extract_text_with_ocrmypdf(input_path)
                    except Exception as e:
                        print(f"[WARNING] OCRmyPDF failed, fallback to EasyOCR: {e}")
                        print(f"[MAIN] Backend: easyocr (fallback)")
                        return self.extract_text_with_pdf2image_easyocr(input_path)
                else:
                    # OCRmyPDF not available, use EasyOCR with pdf2image
                    print(f"[MAIN] Backend: easyocr+pdf2image (OCRmyPDF not available)")
                    return self.extract_text_with_pdf2image_easyocr(input_path)
            
            # Image: Use EasyOCR
            else:
                print(f"[MAIN] Backend: easyocr (image)")
                return self.extract_text_with_easyocr(input_path)
            
        except Exception as e:
            print(f"[ERROR] Excepción en extract_text: {e}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            raise


def main():
    """Main entry point for OCR processing."""
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python ocr_service.py <input_file> <output_file> [language]'
        }))
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    language = sys.argv[3] if len(sys.argv) > 3 else 'es'

    try:
        # Create OCR service
        ocr = OCRService(language=language)
        
        # Process file
        result = ocr.extract_text(input_file)
        
        # Save output
        print(f"[OK] Guardando resultado en: {output_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"[SUCCESS] ¡Procesamiento completado exitosamente!")
        
    except Exception as e:
        print(f"[ERROR] Fallo en OCR: Error durante OCR: {e}")
        # Save error to output file
        error_result = {
            'success': False,
            'error': str(e),
            'text': '',
            'itemCount': 0,
            'pageCount': 0,
            'processingTime': datetime.now().isoformat()
        }
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(error_result, f, ensure_ascii=False, indent=2)
        print(f"[OK] Guardando resultado en: {output_file}")
        print(f"[SUCCESS] ¡Procesamiento completado exitosamente!")
        sys.exit(1)


if __name__ == '__main__':
    main()
