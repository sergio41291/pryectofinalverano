import { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Music, Image, AlertCircle, Loader } from 'lucide-react';
import { uploadService, ocrService } from '../services/api';
import type { Upload as UploadType } from '../services/api';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSummaryStart?: (data: { uploadId: string; ocrText: string }) => void;
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

export function SummaryModal({ isOpen, onClose, onSummaryStart }: SummaryModalProps) {
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

  // Cargar archivos existentes cuando se abre el modal
  useEffect(() => {
    if (isOpen && tab === 'existing') {
      loadExistingFiles();
    }
  }, [isOpen, tab]);

  const loadExistingFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const response = await uploadService.listUploads(1, 100); // Get more files to ensure we have completed ones
      
      // Filter only files with completed OCR processing
      // A file is considered completed if it has extractedText with content
      const completedFiles = (response.data || [])
        .filter(file => file.extractedText && file.extractedText.trim().length > 0)
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
      await uploadService.uploadFile(file);

      // Show text input option since OCR is processing in background
      setShowTextInput(true);
      setError('El archivo se está procesando. Puedes ingresar el texto manualmente o esperar a que se procese.');
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
      const ocrResult = await ocrService.getOcrResult(uploadId);
      onSummaryStart?.({
        uploadId,
        ocrText: ocrResult.rawText || '',
      });
      onClose();
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

      <div className="relative w-full max-w-2xl bg-white shadow-2xl rounded-3xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resumen Automático</h2>
          <p className="text-gray-600 mb-6">Sube un nuevo archivo o selecciona uno que ya hayas procesado</p>

          {/* Pestañas */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setTab('new')}
              className={`px-4 py-3 font-medium transition-colors ${
                tab === 'new'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📤 Nuevo Archivo
            </button>
            <button
              onClick={() => setTab('existing')}
              className={`px-4 py-3 font-medium transition-colors ${
                tab === 'existing'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📂 Archivos Existentes
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Tab: Nuevo Archivo */}
          {tab === 'new' && (
            <div>
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
            </div>
          )}

          {/* Tab: Archivos Existentes */}
          {tab === 'existing' && (
            <div>
              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="animate-spin text-blue-600 mr-2" size={24} />
                  <span className="text-gray-600">Cargando archivos...</span>
                </div>
              ) : existingFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No tienes archivos subidos aún</p>
                  <button
                    onClick={() => setTab('new')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Subir el primero
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre del archivo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha de carga</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Tamaño</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="max-h-96 overflow-y-auto block">
                      {existingFiles.map((file, index) => (
                        <tr
                          key={file.id}
                          className={`border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">
                            {file.originalFileName || file.fileName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {getFileTypeLabel(file.mimeType || 'application/octet-stream')}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDate(file.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {formatFileSize(file.fileSize || 0)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleSelectExisting(file.id)}
                              disabled={processingExisting}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingExisting ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                <FileText size={16} />
                              )}
                              Usar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
