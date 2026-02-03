import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader, CheckCircle2, Languages, Download, Copy, AlertCircle, FileText } from 'lucide-react';
import { uploadService, ocrService } from '../services/api';
import type { Upload as UploadType } from '../services/api';
import { API_CONFIG } from '../config/api';
import type { OcrProgressState } from '../hooks/useOcrProgress';
import { ExistingFilesSection } from './ExistingFilesSection';
import translationsService from '../services/translationsService';

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocrState?: OcrProgressState;
  ocrReset?: () => void;
}

export function TranslateModal({ isOpen, onClose, ocrState, ocrReset }: TranslateModalProps) {
  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingExisting, setProcessingExisting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [manualText, setManualText] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedFile, setUploadedFile] = useState<UploadType | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioProcessing, setAudioProcessing] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState<string>('');
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [completedOcrData, setCompletedOcrData] = useState<{
    uploadId: string;
    extractedText: string;
  } | null>(null);

  const [existingFileData, setExistingFileData] = useState<{
    uploadId: string;
    fileName: string;
    extractedText: string;
  } | null>(null);

  // Estados para traducción
  const [languages, setLanguages] = useState<any[]>([]);
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [translating, setTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{
    original: string;
    translated: string;
    sourceLanguage: string;
    targetLanguage: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const ocrProgress = ocrState || {
    step: 'idle' as const,
    message: '',
    progress: 0,
  };

  // Cargar idiomas soportados
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const langs = await translationsService.getSupportedLanguages();
        setLanguages(langs.filter(l => l.code !== 'es')); // Excluir español (idioma fuente por defecto)
      } catch (err) {
        console.error('Error loading languages:', err);
      }
    };
    loadLanguages();
  }, []);

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

  // Polling para audio
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
          },
        });

        if (!response.ok) {
          throw new Error('Error al verificar el estado del audio');
        }

        const data = await response.json();

        if (data.status === 'completed') {
          setAudioProgress(100);
          setAudioTranscription(data.transcription || '');
          setAudioProcessing(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setCompletedOcrData({
            uploadId: uploadedFile.id,
            extractedText: data.transcription || '',
          });
        } else if (data.status === 'processing') {
          setAudioProgress(data.progress || 50);
        } else if (data.status === 'failed') {
          setError('Error al procesar el audio');
          setAudioProcessing(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (err: any) {
        console.error('Error checking audio status:', err);
      }
    };

    pollingIntervalRef.current = setInterval(checkAudioStatus, 3000);
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [uploadedFile, audioProcessing]);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadedFile(null);
    setCompletedOcrData(null);
    setAudioProcessing(false);
    setAudioTranscription('');
    setTranslationResult(null);

    try {
      const upload = await uploadService.uploadFile(file);
      setUploadedFile(upload);

      if (file.type.startsWith('audio/')) {
        setAudioProcessing(true);
        setAudioProgress(0);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el archivo');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleExistingFileSelect = async (file: any) => {
    setProcessingExisting(true);
    setError(null);
    setTranslationResult(null);

    try {
      let extractedText = '';

      // Adaptar la estructura del archivo
      const fileId = file.id;
      const mimeType = file.mimeType || '';

      // Primero intentar obtener el texto del archivo directamente
      if (file.transcription) {
        extractedText = file.transcription;
      } else if (file.extractedText) {
        if (typeof file.extractedText === 'string') {
          extractedText = file.extractedText;
        } else if (file.extractedText.text) {
          extractedText = file.extractedText.text;
        }
      } else if (file.ocrText) {
        extractedText = file.ocrText;
      }

      // Si no hay texto directo, intentar obtenerlo del backend
      if (!extractedText) {
        if (mimeType.startsWith('audio/')) {
          try {
            const statusResponse = await fetch(`${API_CONFIG.apiUrl}/api/audio/status/${fileId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              },
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.status === 'completed' && statusData.transcription) {
                extractedText = statusData.transcription;
              }
            }
          } catch (audioErr) {
            console.warn('Error fetching audio transcription:', audioErr);
          }
        } else {
          try {
            const ocrResult = await ocrService.getOcrResult(fileId);
            if (typeof ocrResult.extractedText === 'string') {
              extractedText = ocrResult.extractedText;
            } else if (ocrResult.extractedText && typeof ocrResult.extractedText === 'object') {
              extractedText = (ocrResult.extractedText as any).text || '';
            } else if (ocrResult.rawText) {
              extractedText = ocrResult.rawText;
            }
          } catch (ocrErr) {
            console.warn('Error fetching OCR result:', ocrErr);
          }
        }
      }

      if (!extractedText) {
        throw new Error('Este archivo no tiene texto extraído. Por favor, procesa el archivo primero.');
      }

      setExistingFileData({
        uploadId: fileId,
        fileName: file.originalFilename || file.fileName || 'archivo',
        extractedText,
      });

      setCompletedOcrData({
        uploadId: fileId,
        extractedText,
      });
    } catch (err: any) {
      console.error('Error processing existing file:', err);
      setError(err.message || 'Error al procesar archivo existente');
    } finally {
      setProcessingExisting(false);
    }
  };

  const handleTranslate = async () => {
    const textToTranslate = manualText || completedOcrData?.extractedText || audioTranscription;

    if (!textToTranslate) {
      setError('No hay texto para traducir');
      return;
    }

    setTranslating(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const result = await translationsService.translateText(
        textToTranslate,
        targetLanguage,
        'es'
      );

      setTranslationResult({
        original: result.original,
        translated: result.translated,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
      });
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'Error al traducir el texto');
    } finally {
      setTranslating(false);
    }
  };

  const handleSaveTranslation = async () => {
    if (!translationResult) return;

    try {
      const fileName = uploadedFile?.fileName || existingFileData?.fileName || undefined;
      const title = `Traducción ${translationResult.sourceLanguage.toUpperCase()} → ${translationResult.targetLanguage.toUpperCase()} - ${fileName || new Date().toLocaleDateString()}`;

      await translationsService.saveTranslation({
        title,
        originalText: translationResult.original,
        translatedText: translationResult.translated,
        sourceLanguage: translationResult.sourceLanguage,
        targetLanguage: translationResult.targetLanguage,
        sourceFileName: fileName,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        handleReset();
      }, 2000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Error al guardar la traducción');
    }
  };

  const handleCopyTranslation = () => {
    if (translationResult?.translated) {
      navigator.clipboard.writeText(translationResult.translated);
    }
  };

  const handleReset = () => {
    setTab('new');
    setError(null);
    setUploadedFile(null);
    setCompletedOcrData(null);
    setExistingFileData(null);
    setManualText('');
    setShowTextInput(false);
    setTranslationResult(null);
    setAudioProcessing(false);
    setAudioTranscription('');
    setAudioProgress(0);
    setSaveSuccess(false);
    if (ocrReset) ocrReset();
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleCloseModal = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const showTranslateButton = completedOcrData || manualText.trim().length > 0 || audioTranscription;
  const textToTranslate = manualText || completedOcrData?.extractedText || audioTranscription;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Languages className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Traducir Texto</h2>
              <p className="text-purple-100 text-sm mt-1">
                Carga un archivo o escribe texto para traducir
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setTab('new')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                tab === 'new'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Nuevo Archivo
            </button>
            <button
              onClick={() => setTab('existing')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                tab === 'existing'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Archivos Existentes
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">Traducción guardada exitosamente</p>
            </div>
          )}

          {/* Tab: Nuevo Archivo */}
          {tab === 'new' && (
            <div className="space-y-6">
              {/* Option: Text Input */}
              <div>
                <button
                  onClick={() => setShowTextInput(!showTextInput)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">
                    {showTextInput ? 'Ocultar entrada de texto' : 'Escribir o pegar texto'}
                  </span>
                </button>

                {showTextInput && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto a traducir
                    </label>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Escribe o pega aquí el texto que deseas traducir..."
                    />
                  </div>
                )}
              </div>

              {/* Upload Area */}
              {!showTextInput && (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    dragActive
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Arrastra y suelta tu archivo aquí
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    o haz clic para seleccionar
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,image/*,audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                  </button>
                  <p className="text-xs text-gray-400 mt-4">
                    Formatos soportados: PDF, Imágenes (JPG, PNG, GIF), Audio (MP3, WAV, OGG)
                  </p>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader className="h-5 w-5 text-blue-600 animate-spin" />
                    <p className="text-blue-900 font-medium">Subiendo archivo...</p>
                  </div>
                </div>
              )}

              {/* OCR Progress */}
              {ocrProgress.step !== 'idle' && ocrProgress.step !== 'completed' && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader className="h-5 w-5 text-blue-600 animate-spin" />
                    <p className="text-blue-900 font-medium">{ocrProgress.message}</p>
                  </div>
                  {ocrProgress.progress > 0 && (
                    <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${ocrProgress.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Audio Processing */}
              {audioProcessing && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader className="h-5 w-5 text-blue-600 animate-spin" />
                    <p className="text-blue-900 font-medium">Transcribiendo audio...</p>
                  </div>
                  {audioProgress > 0 && (
                    <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Text Preview */}
              {(completedOcrData || audioTranscription) && !translationResult && (
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Texto Extraído
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {textToTranslate}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Archivos Existentes */}
          {tab === 'existing' && (
            <div className="space-y-6">
              <ExistingFilesSection
                onSelectFile={handleExistingFileSelect}
                isLoading={processingExisting}
              />
            </div>
          )}

          {/* Translation Controls */}
          {showTranslateButton && !translationResult && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma de destino
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleTranslate}
                disabled={translating}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
              >
                {translating ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Traduciendo...
                  </>
                ) : (
                  <>
                    <Languages className="h-5 w-5" />
                    Traducir Ahora
                  </>
                )}
              </button>
            </div>
          )}

          {/* Translation Result */}
          {translationResult && (
            <div className="mt-6 space-y-4">
              <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Traducción Completada
                  </h3>
                  <button
                    onClick={handleCopyTranslation}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    title="Copiar traducción"
                  >
                    <Copy className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/50 p-4 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Original ({translationResult.sourceLanguage.toUpperCase()})
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {translationResult.original}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <p className="text-xs font-medium text-purple-600 mb-2">
                      Traducción ({translationResult.targetLanguage.toUpperCase()})
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {translationResult.translated}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveTranslation}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold"
                  >
                    <Download className="h-5 w-5" />
                    Guardar Traducción
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Nueva Traducción
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
