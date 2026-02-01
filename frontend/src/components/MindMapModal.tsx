import { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Music, Image, AlertCircle, Loader, CheckCircle2, Network } from 'lucide-react';
import { ocrService } from '../services/api';
import type { Upload as UploadType } from '../services/api';
import { API_CONFIG } from '../config/api';
import type { OcrProgressState } from '../hooks/useOcrProgress';
import { ExistingFilesSection, type ExistingFile } from './ExistingFilesSection';
import { mindMapService, type MindMapStructure } from '../services/mindMapService';
import { MindMapVisualization } from './MindMapVisualization';

interface MindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMindMapGenerated?: (mindMap: MindMapStructure) => void;
  ocrState?: OcrProgressState;
  ocrReset?: () => void;
}

const ALLOWED_TYPES = {
  pdf: { mime: 'application/pdf', icon: FileText, label: 'PDF' },
  image: { mime: ['image/jpeg', 'image/png', 'image/gif'], icon: Image, label: 'Imagen' },
  audio: { mime: ['audio/mpeg', 'audio/wav', 'audio/ogg'], icon: Music, label: 'Audio' },
};

export function MindMapModal({ isOpen, onClose, onMindMapGenerated, ocrState, ocrReset }: MindMapModalProps) {
  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingExisting, setProcessingExisting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Para manejar el estado de carga de audios
  const [uploadedFile, setUploadedFile] = useState<UploadType | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioProcessing, setAudioProcessing] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState<string>('');
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Para generación de mapas mentales
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMindMap, setGeneratedMindMap] = useState<MindMapStructure | null>(null);
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  // Para almacenar datos del OCR completado
  const [completedOcrData, setCompletedOcrData] = useState<{
    uploadId: string;
    extractedText: string;
  } | null>(null);

  // Usar estado global de OCR si está disponible
  const ocrProgress = ocrState || {
    step: 'idle' as const,
    message: '',
    progress: 0,
  };

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
        
        if (status === 'processing') {
          setAudioProgress(50);
        } else if (status === 'completed') {
          setAudioProgress(100);
          setAudioTranscription(data?.transcription || '');
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

    pollingIntervalRef.current = setInterval(checkAudioStatus, 2000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [uploadedFile, audioProcessing]);

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
      
      const isAudio = file.type.includes('audio') || file.name.match(/\.(mp3|wav|ogg)$/i);
      
      if (isAudio) {
        setUploadedFile(uploadData);
        setAudioProcessing(true);
        setAudioProgress(10);
      } else {
        setUploadedFile(uploadData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateMindMap = async (text: string) => {
    if (!text || text.trim().length < 50) {
      setError('El texto es demasiado corto. Se requieren al menos 50 caracteres.');
      return;
    }

    if (text.trim().length > 10000) {
      setError('El texto es demasiado largo. Máximo 10,000 caracteres.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await mindMapService.generateMindMap({
        text,
        language,
      });

      setGeneratedMindMap(response.data.structure);
      
      if (onMindMapGenerated) {
        onMindMapGenerated(response.data.structure);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el mapa mental');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExistingFileSelect = async (file: ExistingFile) => {
    try {
      setProcessingExisting(true);
      setError(null);
      
      let extractedText = '';
      
      if (file.mimeType && file.mimeType.includes('audio')) {
        const response = await fetch(`${API_CONFIG.apiUrl}/api/audio/status/${file.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener la transcripción del audio');
        }
        
        const data = await response.json();
        extractedText = data?.transcription || '';
      } else {
        const result = await ocrService.getOcrResult(file.id);
        if (typeof result.extractedText === 'string') {
          extractedText = result.extractedText;
        } else if (result.extractedText && typeof result.extractedText === 'object') {
          const ext = result.extractedText as any;
          extractedText = ext.text || '';
        } else if (result.rawText) {
          extractedText = result.rawText;
        }
      }

      if (!extractedText) {
        throw new Error('No se pudo obtener el texto del archivo');
      }

      await handleGenerateMindMap(extractedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo existente');
    } finally {
      setProcessingExisting(false);
    }
  };

  const handleClose = () => {
    setTab('new');
    setUploadedFile(null);
    setAudioProcessing(false);
    setAudioProgress(0);
    setAudioTranscription('');
    setCompletedOcrData(null);
    setGeneratedMindMap(null);
    setError(null);
    if (ocrReset) {
      ocrReset();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Network className="text-purple-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Generar Mapa Mental</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 transition-colors hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-8 pt-6 border-b border-gray-200">
          <button
            onClick={() => setTab('new')}
            className={`pb-3 px-4 font-medium transition-colors border-b-2 ${
              tab === 'new'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Nuevo Archivo
          </button>
          <button
            onClick={() => setTab('existing')}
            className={`pb-3 px-4 font-medium transition-colors border-b-2 ${
              tab === 'existing'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Archivos Existentes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Mostrar mapa mental generado */}
          {generatedMindMap && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="text-green-600" size={20} />
                  <h3 className="font-bold text-green-900">¡Mapa Mental Generado!</h3>
                </div>
                <p className="text-sm text-green-700">
                  El mapa mental se ha guardado automáticamente. Puedes verlo en la sección "Mapas Mentales".
                </p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-4">Vista Previa:</h4>
                <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden">
                  <MindMapVisualization structure={generatedMindMap} readOnly={true} />
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setGeneratedMindMap(null);
                    setUploadedFile(null);
                    setCompletedOcrData(null);
                    setAudioTranscription('');
                    setError(null);
                    if (ocrReset) ocrReset();
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Generar Otro
                </button>
              </div>
            </div>
          )}

          {/* Tab Nuevo Archivo */}
          {tab === 'new' && !generatedMindMap && (
            <div>
              {!uploadedFile && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*,audio/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-purple-100 rounded-2xl">
                      <Upload className="text-purple-600" size={48} />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Arrastra tu archivo o haz clic para seleccionar
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Soporta PDF, imágenes (JPG, PNG, GIF) y audios (MP3, WAV, OGG)
                  </p>
                  <p className="text-sm text-gray-500">Tamaño máximo: 100 MB</p>

                  {isUploading && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                      <Loader className="animate-spin text-purple-600" size={24} />
                      <p className="text-sm text-purple-600 font-medium">Subiendo archivo...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Procesamiento de archivo subido */}
              {uploadedFile && !completedOcrData && !audioTranscription && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    {audioProcessing ? (
                      <>
                        <Music className="text-blue-600 flex-shrink-0" size={24} />
                        <div className="flex-1">
                          <h3 className="font-bold text-blue-900 mb-2">Procesando Audio</h3>
                          <p className="text-sm text-blue-700 mb-4">
                            Estamos transcribiendo tu archivo de audio...
                          </p>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${audioProgress}%` }}
                            />
                          </div>
                        </div>
                      </>
                    ) : ocrProgress.step !== 'idle' ? (
                      <>
                        <Loader className="animate-spin text-blue-600 flex-shrink-0" size={24} />
                        <div className="flex-1">
                          <h3 className="font-bold text-blue-900 mb-2">{ocrProgress.message}</h3>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${ocrProgress.progress}%` }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Loader className="animate-spin text-blue-600 flex-shrink-0" size={24} />
                        <div className="flex-1">
                          <h3 className="font-bold text-blue-900 mb-2">Procesando archivo</h3>
                          <p className="text-sm text-blue-700">Por favor espera...</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Texto extraído - Generar mapa mental */}
              {(completedOcrData || audioTranscription) && !isGenerating && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="text-green-600" size={20} />
                    <h3 className="font-bold text-gray-900">Texto Extraído</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {(completedOcrData?.extractedText || audioTranscription).slice(0, 500)}
                      {(completedOcrData?.extractedText || audioTranscription).length > 500 && '...'}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma del Mapa Mental
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleGenerateMindMap(completedOcrData?.extractedText || audioTranscription)}
                    className="w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Network size={20} />
                    Generar Mapa Mental
                  </button>
                </div>
              )}

              {/* Generando mapa mental */}
              {isGenerating && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <Loader className="animate-spin text-purple-600" size={24} />
                    <div>
                      <h3 className="font-bold text-purple-900 mb-1">Generando Mapa Mental</h3>
                      <p className="text-sm text-purple-700">
                        Estamos creando tu mapa mental con IA...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Archivos Existentes */}
          {tab === 'existing' && !generatedMindMap && (
            <div>
              {processingExisting || isGenerating ? (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-8">
                  <div className="flex flex-col items-center gap-4">
                    <Loader className="animate-spin text-purple-600" size={48} />
                    <div className="text-center">
                      <h3 className="font-bold text-purple-900 mb-2 text-lg">
                        {processingExisting && !isGenerating && 'Extrayendo texto del archivo...'}
                        {isGenerating && 'Generando Mapa Mental con IA...'}
                      </h3>
                      <p className="text-sm text-purple-700">
                        {processingExisting && !isGenerating && 'Procesando el contenido del archivo seleccionado'}
                        {isGenerating && 'Estamos analizando el texto y creando tu mapa mental'}
                      </p>
                    </div>
                    
                    {/* Progress steps */}
                    <div className="flex items-center gap-3 mt-4">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                        processingExisting ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        <CheckCircle2 size={16} />
                        Extrayendo texto
                      </div>
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                        isGenerating ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        <Network size={16} />
                        Generando mapa
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ExistingFilesSection
                  onSelectFile={handleExistingFileSelect}
                  isLoading={false}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
