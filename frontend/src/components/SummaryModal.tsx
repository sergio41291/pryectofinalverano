import { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Music, Image, AlertCircle, Loader, CheckCircle2, Sparkles, Download, RotateCw } from 'lucide-react';
import { uploadService, ocrService } from '../services/api';
import type { Upload as UploadType } from '../services/api';
import { API_CONFIG } from '../config/api';
import type { OcrProgressState } from '../hooks/useOcrProgress';
import { ExistingFilesSection, type ExistingFile } from './ExistingFilesSection';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSummaryStart?: (data: { uploadId: string; ocrText: string; fileName?: string; isExistingFile?: boolean }) => void;
  ocrState?: OcrProgressState;
  ocrReset?: () => void;
}

const ALLOWED_TYPES = {
  pdf: { mime: 'application/pdf', icon: FileText, label: 'PDF' },
  image: { mime: ['image/jpeg', 'image/png', 'image/gif'], icon: Image, label: 'Imagen' },
  audio: { mime: ['audio/mpeg', 'audio/wav', 'audio/ogg'], icon: Music, label: 'Audio' },
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Helper function to format date in Spanish
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  return date.toLocaleDateString('es-ES', options);
};

// Helper function to get file type label
const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'Documento PDF';
  if (mimeType.includes('image')) return 'Imagen';
  if (mimeType.includes('audio') || mimeType.includes('mpeg')) return 'Archivo de Audio';
  if (mimeType.includes('video')) return 'Video';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Documento Word';
  if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) return 'Hoja de Cálculo';
  return 'Documento';
};

export function SummaryModal({ isOpen, onClose, onSummaryStart, ocrState, ocrReset }: SummaryModalProps) {
  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingFiles, setExistingFiles] = useState<UploadType[]>([]);
  const [processingExisting, setProcessingExisting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [manualText, setManualText] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Para manejar el estado de carga de audios
  const [uploadedFile, setUploadedFile] = useState<UploadType | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioProcessing, setAudioProcessing] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState<string>('');
  const [audioSummary, setAudioSummary] = useState<string>('');
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Para paginación de archivos
  const [audioFilesPage, setAudioFilesPage] = useState(1);
  const [otherFilesPage, setOtherFilesPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Para almacenar datos del OCR completado
  const [completedOcrData, setCompletedOcrData] = useState<{
    uploadId: string;
    extractedText: string;
  } | null>(null);

  // Para rastrear si estamos usando un archivo existente
  const [isExistingFileMode, setIsExistingFileMode] = useState(false);
  const [existingFileData, setExistingFileData] = useState<{
    uploadId: string;
    fileName: string;
    extractedText: string;
  } | null>(null);

  // Usar estado global de OCR si está disponible
  const ocrProgress = ocrState || {
    step: 'idle' as const,
    message: '',
    progress: 0,
  };

  // Cargar archivos existentes cuando se abre el modal
  useEffect(() => {
    if (isOpen && tab === 'existing') {
      loadExistingFiles();
    }
  }, [isOpen, tab]);

  // Obtener el texto extractado cuando el OCR está completado
  useEffect(() => {
    if (ocrProgress.step === 'completed' && uploadedFile && !completedOcrData) {
      const fetchOcrResult = async () => {
        try {
          const result = await ocrService.getOcrResult(uploadedFile.id);
          let extractedText = '';
          if (typeof result.extractedText === 'string') {
            extractedText = result.extractedText;
          } else if (result.extractedText && typeof result.extractedText === 'object') {
            const ext = result.extractedText as any;
            extractedText = ext.text || '';
          } else if (result.rawText) {
            extractedText = result.rawText;
          }
          setCompletedOcrData({
            uploadId: uploadedFile.id,
            extractedText,
          });
        } catch (err) {
          console.error('Error fetching OCR result:', err);
        }
      };
      fetchOcrResult();
    }
  }, [ocrProgress.step, uploadedFile, completedOcrData]);

  // Polling para verificar el estado del audio
  useEffect(() => {
    if (!uploadedFile || !audioProcessing) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const checkAudioStatus = async () => {
      try {
        const response = await fetch(`${API_CONFIG.apiUrl}/api/audio/status/${uploadedFile.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const status = data?.status || 'pending';
        
        // Actualizar progreso basado en el estado
        if (status === 'processing') {
          setAudioProgress(50);
        } else if (status === 'completed') {
          setAudioProgress(100);
          setAudioTranscription(data?.transcription || '');
          setAudioSummary(data?.summary || data?.extractedText || '');
          setAudioProcessing(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (status === 'error') {
          setError(data?.error || 'Error al procesar el audio');
          setAudioProcessing(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error checking audio status:', err);
      }
    };

    // Hacer polling cada 2 segundos
    pollingIntervalRef.current = setInterval(checkAudioStatus, 2000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [uploadedFile, audioProcessing]);

  const loadExistingFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const response = await uploadService.listUploads(1, 100); // Get more files to ensure we have completed ones
      
      // Filter only files with completed processing (OCR or Audio)
      // A file is considered completed if:
      // - For OCR: has extractedText with content
      // - For Audio: status is 'completed' or has transcription/summary
      const completedFiles = (response.data || [])
        .filter((file: any) => {
          // Check for OCR completed files
          const extractedText = file.extractedText as any;
          const ocrText = extractedText?.text || '';
          const hasOcrContent = typeof ocrText === 'string' && ocrText.trim().length > 0;
          
          // Check for Audio completed files
          const isAudioCompleted = file.status === 'completed' || (file.mimeType && file.mimeType.includes('audio'));
          
          return hasOcrContent || isAudioCompleted;
        })
        .sort((a, b) => {
          // Sort by creation date, most recent first
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      
      setExistingFiles(completedFiles);
    } catch (err) {
      setError('Error al cargar archivos');
      console.error(err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const isValidFileType = (file: File): boolean => {
    const isPdf = file.type === ALLOWED_TYPES.pdf.mime;
    const isImage = Array.isArray(ALLOWED_TYPES.image.mime) && ALLOWED_TYPES.image.mime.includes(file.type);
    const isAudio = Array.isArray(ALLOWED_TYPES.audio.mime) && ALLOWED_TYPES.audio.mime.includes(file.type);
    return isPdf || isImage || isAudio;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);

    if (!isValidFileType(file)) {
      setError('Solo se permiten PDF, imágenes (JPG, PNG, GIF) y audios (MP3, WAV, OGG)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('El archivo no puede pesar más de 100MB');
      return;
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_CONFIG.apiUrl}/api/uploads`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const uploadData = await response.json();
      
      // Detectar si es audio
      const isAudio = file.type.includes('audio') || file.name.match(/\.(mp3|wav|ogg)$/i);
      
      if (isAudio) {
        // Para audios, iniciar polling
        setUploadedFile(uploadData);
        setAudioProcessing(true);
        setAudioProgress(30);
      } else {
        // Para PDF e imágenes, confiar en WebSocket
        // El estado se actualiza vía WebSocket desde useOcrProgress
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualTextSubmit = () => {
    if (!manualText.trim()) {
      setError('Por favor ingresa el texto a resumir');
      return;
    }

    onSummaryStart?.({
      uploadId: '',
      ocrText: manualText.trim(),
    });

    setManualText('');
    setShowTextInput(false);
    onClose();
  };

  const handleSelectExisting = async (uploadId: string) => {
    setProcessingExisting(true);
    setError(null);

    try {
      // Encontrar el archivo en existingFiles para saber su tipo
      const file = existingFiles.find(f => f.id === uploadId);
      
      if (!file) {
        setError('Archivo no encontrado');
        setProcessingExisting(false);
        return;
      }
      // PRIMERO: Verificar si ya existe un resumen en la tabla summaries
      try {
        const token = localStorage.getItem('authToken');
        const summariesResponse = await fetch(`${API_CONFIG.apiUrl}/api/processing/summaries?page=1&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (summariesResponse.ok) {
          const summariesData = await summariesResponse.json();
          const summaries = summariesData.data || [];
          
          // Buscar un resumen que coincida con este archivo
          const fileName = file.originalFileName || `file_${uploadId}`;
          const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
          const existingSummary = summaries.find((s: any) => 
            s.sourceFileName === fileName || 
            s.title.includes(fileNameWithoutExt)
          );
          
          if (existingSummary) {
            console.log('✅ Found existing summary, no need to regenerate:', existingSummary);
            
            // Mostrar el resumen existente
            setTab('new');
            setUploadedFile(file);
            setIsExistingFileMode(true);
            setAudioTranscription(existingSummary.sourceText || '');
            setAudioSummary(existingSummary.summaryContent);
            setAudioProgress(100);
            setProcessingExisting(false);
            
            // Mostrar mensaje informativo
            setError(null);
            return; // SALIR - No regenerar
          }
        }
      } catch (err) {
        console.warn('Error checking for existing summaries:', err);
        // Continuar con el flujo normal si hay error
      }
      const isAudio = file.mimeType?.includes('audio');

      if (isAudio) {
        // Para audios, obtener el resultado de audio del servidor
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_CONFIG.apiUrl}/api/audio/${uploadId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener el resultado de audio');
        }

        const audioResult = await response.json();
        
        // Si el audio tiene resumen, migrarlo automáticamente a la tabla summaries
        if (audioResult.summary && audioResult.summary.trim().length > 0) {
          try {
            console.log('🔄 Migrating audio summary to summaries table...');
            const { aiService } = await import('../services/aiService');
            const fileName = file.originalFileName || `audio_${uploadId}`;
            await aiService.saveSummary({
              title: fileName.replace(/\.[^/.]+$/, ''),
              sourceText: audioResult.transcription || 'Audio transcription',
              summaryContent: audioResult.summary,
              language: audioResult.language || 'es',
              style: 'bullet-points',
              sourceFileName: fileName,
            });
            console.log('✅ Audio summary migrated successfully');
          } catch (migrateErr) {
            console.warn('Failed to migrate audio summary:', migrateErr);
          }
        }
        
        // Establecer el archivo subido
        setUploadedFile(file);
        
        // Cambiar al tab "new" para mostrar los resultados
        setTab('new');
        
        // Si el audio ya está completado y tiene transcripción
        if (audioResult.status === 'completed' && audioResult.transcription) {
          // Mostrar los resultados existentes inmediatamente
          setAudioTranscription(audioResult.transcription);
          
          // Si tiene resumen, mostrarlo; si no, generar uno
          if (audioResult.summary) {
            setAudioSummary(audioResult.summary);
            setAudioProgress(100);
          } else {
            // Generar resumen basado en la transcripción existente
            setAudioProgress(50);
            setAudioSummary('Generando resumen...');
            
            try {
              const summaryResponse = await fetch(
                `${API_CONFIG.apiUrl}/api/processing/summarize`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    text: audioResult.transcription,
                    style: 'bullet-points',
                    maxTokens: 1024,
                  }),
                }
              );

              if (summaryResponse.ok) {
                // Leer el stream de respuesta
                const reader = summaryResponse.body?.getReader();
                const decoder = new TextDecoder();
                let fullSummary = '';
                
                if (reader) {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    // Parsear líneas SSE
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                      if (line.startsWith('data: ')) {
                        try {
                          const data = JSON.parse(line.slice(6));
                          if (data.content) {
                            fullSummary += data.content;
                            setAudioSummary(fullSummary);
                          }
                        } catch (e) {
                          // Ignorar líneas que no sean JSON válido
                        }
                      }
                    }
                  }
                }
                
                if (!fullSummary) {
                  setAudioSummary(audioResult.transcription);
                }
              } else {
                // Si falla, usar la transcripción como resumen
                setAudioSummary(audioResult.transcription);
              }
            } catch (err) {
              // Si falla generar resumen, usar transcripción
              console.warn('Error generando resumen:', err);
              setAudioSummary(audioResult.transcription);
            }
            
            setAudioProgress(100);
          }
        } else if (audioResult.status === 'processing') {
          // Si aún está procesando, iniciar polling
          setAudioProgress(30);
          setAudioSummary('El audio se encuentra en procesamiento...');
          
          // Iniciar polling del status
          const pollInterval = setInterval(async () => {
            try {
              const statusResponse = await fetch(`${API_CONFIG.apiUrl}/api/audio/status/${uploadId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              
              if (statusResponse.ok) {
                const status = await statusResponse.json();
                
                if (status.status === 'completed') {
                  clearInterval(pollInterval);
                  setAudioTranscription(status.transcription || '');
                  setAudioSummary(status.summary || status.transcription || '');
                  setAudioProgress(100);
                } else if (status.status === 'error') {
                  clearInterval(pollInterval);
                  setError(`Error procesando audio: ${status.error}`);
                  setAudioProgress(0);
                } else {
                  setAudioProgress(Math.min(80, (audioProgress || 0) + 10));
                }
              }
            } catch (err) {
              console.error('Error polling audio status:', err);
            }
          }, 3000);
        } else if (audioResult.status === 'failed') {
          setError(`Error procesando audio: ${audioResult.errorMessage}`);
          setAudioProgress(0);
        } else {
          // Pendiente o estado desconocido
          setAudioProgress(20);
          setAudioSummary('El audio está siendo procesado. Por favor espere...');
        }
        
      } else {
        // Para OCR, obtener el resultado de OCR y mostrar en el modal
        // Cambiar al tab "new" para mostrar los resultados
        setTab('new');
        setUploadedFile(file);
        setIsExistingFileMode(true);
        
        try {
          const ocrResult = await ocrService.getOcrResult(uploadId);
          
          // Extraer el texto según la estructura del resultado
          let extractedTextValue = '';
          let summary = '';
          
          if (typeof ocrResult.extractedText === 'string') {
            extractedTextValue = ocrResult.extractedText;
          } else if (ocrResult.extractedText && typeof ocrResult.extractedText === 'object') {
            const ext = ocrResult.extractedText as any;
            extractedTextValue = ext.text || '';
            summary = ext.summary || '';
          } else if (ocrResult.rawText) {
            extractedTextValue = ocrResult.rawText;
          }
          
          // Guardar datos del archivo existente
          setExistingFileData({
            uploadId,
            fileName: file.originalFileName,
            extractedText: extractedTextValue,
          });
          
          // Si existe el resultado, mostrar en el modal usando los campos de audio
          setAudioTranscription(extractedTextValue);
          setAudioSummary(summary || extractedTextValue);
          setAudioProgress(100);
          
          // No llamar a onSummaryStart para evitar que se cierre el modal
        } catch (err: any) {
          // Si el OcrResult aún no existe, es porque aún está procesando
          // Notificar al usuario y dejar que el WebSocket lo actualice
          console.warn('OCR result not yet available, file may still be processing:', err);
          
          // Mostrar estado de procesamiento llamando al callback
          // El padre iniciará el flujo de monitoreo vía WebSocket
          onSummaryStart?.({
            uploadId,
            ocrText: '',
            fileName: file.originalFileName,
            isExistingFile: true,
          });
        }
      }
    } catch (err) {
      setError('Error al obtener el procesamiento del archivo');
      console.error(err);
    } finally {
      setProcessingExisting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 pb-6 flex-shrink-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Resumen Automático</h2>
          <p className="text-gray-600 mb-8">Sube un nuevo archivo o selecciona uno que ya hayas procesado</p>

          {/* Pestañas */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setTab('new')}
              className={`px-6 py-3 font-medium text-lg transition-colors ${
                tab === 'new'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📤 Nuevo Archivo
            </button>
            <button
              onClick={() => setTab('existing')}
              className={`px-6 py-3 font-medium text-lg transition-colors ${
                tab === 'existing'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📂 Archivos Existentes
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="px-8 pb-8 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Tab: Nuevo Archivo */}
          {tab === 'new' && (
            <div>
              {/* Mostrar resultado cuando audio está completado */}
              {audioProgress === 100 && (audioSummary || audioTranscription) && (
                <div className="py-8">
                  <div className="flex justify-center mb-6">
                    <CheckCircle2 size={64} className="text-green-500" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Tu Resumen de Audio está Listo</h2>

                  {/* Caja del resumen */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {audioSummary ? (
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-3">📝 Resumen de IA</h3>
                          <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                            {audioSummary}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-3">📝 Transcripción</h3>
                          <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                            {audioTranscription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info sobre lo que se guardó */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-gray-700">
                    <p className="font-semibold mb-2">✓ Archivos guardados en MinIO:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Archivo de audio original</li>
                      <li>Transcripción completa</li>
                      <li>Resumen de IA</li>
                    </ul>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        // Descargar resumen como archivo
                        const content = audioSummary || audioTranscription;
                        const element = document.createElement('a');
                        const file = new Blob([content], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = audioSummary ? 'resumen_audio.txt' : 'transcripcion.txt';
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="w-full py-3 font-bold text-white transition-colors bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar {audioSummary ? 'Resumen' : 'Transcripción'}
                    </button>
                    <button 
                      onClick={() => {
                        setAudioProcessing(false);
                        setAudioProgress(0);
                        setAudioTranscription('');
                        setAudioSummary('');
                        setUploadedFile(null);
                        setShowTextInput(false);
                        setManualText('');
                        setIsExistingFileMode(false);
                        setExistingFileData(null);
                      }}
                      className="w-full py-3 font-bold text-white transition-colors bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      Procesar Otro Audio
                    </button>
                  </div>
                </div>
              )}

              {/* Mostrar resultado cuando está completado (OCR) */}
              {ocrProgress.step === 'completed' && (
                <div className="py-8">
                  <div className="flex justify-center mb-6">
                    <CheckCircle2 size={64} className="text-green-500" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Tu Resumen está Listo</h2>

                  {/* Caja del resumen */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200 max-h-96 overflow-y-auto">
                    <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                      {ocrProgress.summary || 'Resumen disponible en detalle'}
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        // Descargar resumen como archivo
                        const element = document.createElement('a');
                        const file = new Blob([ocrProgress.summary || ''], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = 'resumen.txt';
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="w-full py-3 font-bold text-white transition-colors bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Resumen
                    </button>
                    <button 
                      onClick={() => {
                        ocrReset?.();
                        setShowTextInput(false);
                        setManualText('');
                        setCompletedOcrData(null);
                        setUploadedFile(null);
                      }}
                      className="w-full py-3 font-bold text-white transition-colors bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      Procesar Otro
                    </button>
                  </div>
                </div>
              )}

              {/* Mostrar progreso si está en proceso (OCR o Audio) */}
              {(ocrProgress.step !== 'idle' && ocrProgress.step !== 'completed') || audioProcessing ? (
                <div className="py-8">
                  {/* Barra de progreso */}
                  <div className="mb-8">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${audioProcessing ? audioProgress : ocrProgress.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{Math.round(audioProcessing ? audioProgress : ocrProgress.progress)}% completado</p>
                  </div>

                  {/* Spinner */}
                  <div className="flex justify-center mb-8">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                        {audioProcessing ? (
                          <Music className="w-8 h-8 text-indigo-600 animate-pulse" />
                        ) : (
                          <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mensaje de estado */}
                  <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                    {audioProcessing ? 'Procesando audio...' : ocrProgress.message}
                  </h2>

                  {/* Indicadores de proceso */}
                  <div className="space-y-2 mt-8">
                    {audioProcessing ? (
                      <>
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${audioProgress >= 30 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <div className={`w-2 h-2 rounded-full ${audioProgress >= 30 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm ${audioProgress >= 30 ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                            Subiendo archivo
                          </span>
                        </div>

                        <div className={`flex items-center gap-3 p-3 rounded-lg ${audioProgress >= 50 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <div className={`w-2 h-2 rounded-full ${audioProgress >= 50 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm ${audioProgress >= 50 ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                            Transcribiendo con IA
                          </span>
                        </div>

                        <div className={`flex items-center gap-3 p-3 rounded-lg ${audioProgress >= 100 ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <div className={`w-2 h-2 rounded-full ${audioProgress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm ${audioProgress >= 100 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                            Completado
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ocrProgress.progress >= 40 ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <div className={`w-2 h-2 rounded-full ${ocrProgress.progress >= 40 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm ${ocrProgress.progress >= 40 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                            Extrayendo texto
                          </span>
                        </div>

                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ocrProgress.progress >= 70 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <div className={`w-2 h-2 rounded-full ${ocrProgress.progress >= 70 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm ${ocrProgress.progress >= 70 ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                            Generando resumen con IA
                          </span>
                        </div>

                        <div className={`flex items-center gap-3 p-3 rounded-lg ${ocrProgress.progress >= 100 ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <div className={`w-2 h-2 rounded-full ${ocrProgress.progress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm ${ocrProgress.progress >= 100 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                            Completado
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mostrar resumen en vivo si está siendo generado */}
                  {!audioProcessing && ocrProgress.step === 'generating' && ocrProgress.summary && (
                    <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <h3 className="font-bold text-gray-800 mb-3">Resumen siendo generado:</h3>
                      <div className="max-h-48 overflow-y-auto">
                        <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                          {ocrProgress.summary}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Mostrar formulario si NO está en progreso (OCR o Audio) Y no hay resumen de audio mostrándose */}
              {ocrProgress.step === 'idle' && !audioProcessing && !(audioProgress === 100 && (audioSummary || audioTranscription)) && (
                <>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                    <h3 className="font-semibold text-gray-900 mb-2">Arrastra tus archivos aquí</h3>
                    <p className="text-gray-600 text-sm mb-4">o</p>
                    <label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.ogg"
                        disabled={isUploading}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
                      >
                        {isUploading ? (
                          <>
                            <Loader className="inline animate-spin mr-2" size={16} />
                            Subiendo...
                          </>
                        ) : (
                          'Seleccionar Archivo'
                        )}
                      </button>
                    </label>
                    <p className="text-xs text-gray-500 mt-4">
                      Formatos permitidos: PDF, JPG, PNG, GIF, MP3, WAV, OGG (máx 100MB)
                    </p>
                  </div>

                  {/* Manual text input after file upload */}
                  {showTextInput && (
                    <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Ingresa el texto manualmente</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        El archivo se está procesando en background. Puedes ingresar el texto ahora para generar el resumen.
                      </p>
                      <textarea
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="Pega el texto aquí o espera a que se procese el OCR..."
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                      />
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleManualTextSubmit}
                          disabled={!manualText.trim()}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
                        >
                          Generar Resumen
                        </button>
                        <button
                          onClick={() => {
                            setShowTextInput(false);
                            setManualText('');
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: Archivos Existentes */}
          {tab === 'existing' && (
            <ExistingFilesSection
              onSelectFile={(file: ExistingFile) => {
                handleSelectExisting(file.id);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
