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

export function SummaryModal({ isOpen, onClose, onSummaryStart }: SummaryModalProps) {
  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingFiles, setExistingFiles] = useState<UploadType[]>([]);
  const [processingExisting, setProcessingExisting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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
      const response = await uploadService.listUploads();
      setExistingFiles(response.data || []);
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

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.pdf')) return FileText;
    if (['jpg', 'jpeg', 'png', 'gif'].some(ext => fileName.toLowerCase().endsWith(ext))) return Image;
    if (['mp3', 'wav', 'ogg'].some(ext => fileName.toLowerCase().endsWith(ext))) return Music;
    return FileText;
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
      const upload = await uploadService.uploadFile(file);

      // Obtener el OCR resultado (puede estar vacío inicialmente)
      try {
        const ocrResult = await ocrService.getOcrResult(upload.id);
        onSummaryStart?.({
          uploadId: upload.id,
          ocrText: ocrResult.rawText || '',
        });
      } catch {
        // Si no hay OCR aún, continuamos con texto vacío
        onSummaryStart?.({
          uploadId: upload.id,
          ocrText: '',
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo');
    } finally {
      setIsUploading(false);
    }
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
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {existingFiles.map((file) => {
                    const Icon = getFileIcon(file.fileName);
                    return (
                      <button
                        key={file.id}
                        onClick={() => handleSelectExisting(file.id)}
                        disabled={processingExisting}
                        className="w-full flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left disabled:opacity-50"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Icon className="text-gray-600" size={20} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{file.fileName}</h4>
                          <p className="text-sm text-gray-500">
                            {(file.fileSize / 1024).toFixed(2)} KB • {new Date(file.uploadedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        {processingExisting && (
                          <Loader className="flex-shrink-0 animate-spin text-blue-600" size={20} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
