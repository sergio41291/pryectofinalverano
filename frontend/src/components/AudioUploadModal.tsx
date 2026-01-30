import { useState, useRef } from 'react';
import { Upload as UploadIcon, Loader, AlertCircle } from 'lucide-react';
import { uploadService } from '../services/api';
import { audioService, type AudioResult } from '../services/audioService';

interface AudioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: AudioResult) => void;
}

const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/webm'];
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.webm'];
const ACCEPT_ATTRIBUTE = 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.webm';

export function AudioUploadModal({ isOpen, onClose, onSuccess }: AudioUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const languages = [
    { code: '', name: 'Detectar automáticamente' },
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'Inglés' },
    { code: 'fr', name: 'Francés' },
    { code: 'de', name: 'Alemán' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Portugués' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!SUPPORTED_FORMATS.includes(file.type) && !SUPPORTED_EXTENSIONS.includes(fileExtension)) {
        setError('Formato de audio no soportado. Por favor usa MP3, WAV, M4A, AAC, FLAC, OGG o WEBM.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!SUPPORTED_FORMATS.includes(file.type) && !SUPPORTED_EXTENSIONS.includes(fileExtension)) {
        setError('Formato de audio no soportado. Por favor usa MP3, WAV, M4A, AAC, FLAC, OGG o WEBM.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const processAudio = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setError('');
      setProgress(10);

      // Upload file
      console.log('[AudioUploadModal] Starting upload for file:', selectedFile.name);
      const upload = await uploadService.uploadFile(selectedFile);
      console.log('[AudioUploadModal] Upload response:', upload);
      setProgress(30);

      // Start transcription
      console.log('[AudioUploadModal] Initiating audio processing for uploadId:', upload.id);
      const processResponse = await audioService.processAudio(upload.id, language || undefined);
      console.log('[AudioUploadModal] Audio processing initiated:', processResponse);
      setProgress(50);

      // Poll for result
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes with 5-second intervals

      console.log('[AudioUploadModal] Starting polling for audio result...');
      while (attempts < maxAttempts) {
        try {
          console.log(`[AudioUploadModal] Polling attempt ${attempts + 1}/${maxAttempts}`);
          const result = await audioService.getAudioResult(upload.id);
          console.log('[AudioUploadModal] Poll result:', result);
          
          if (result.status === 'completed') {
            console.log('[AudioUploadModal] Audio processing completed successfully');
            setProgress(100);
            onSuccess(result);
            setTimeout(() => {
              resetForm();
              onClose();
            }, 500);
            return;
          } else if (result.status === 'failed') {
            console.error('[AudioUploadModal] Audio processing failed:', result.errorMessage);
            throw new Error(result.errorMessage || 'Error durante la transcripción');
          }

          // Still processing
          console.log(`[AudioUploadModal] Status: ${result.status}, continuing to poll...`);
          setProgress(50 + (attempts / maxAttempts) * 40);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (pollError: any) {
          console.error('[AudioUploadModal] Poll error:', {
            status: pollError.response?.status,
            statusText: pollError.response?.statusText,
            message: pollError.message,
            data: pollError.response?.data,
          });
          if (pollError.response?.status === 404) {
            // Result not found yet, continue polling
            console.log('[AudioUploadModal] Result not found yet (404), continuing polling...');
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else {
            throw pollError;
          }
        }
      }

      throw new Error('Tiempo de espera agotado. La transcripción tardó demasiado.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al procesar el audio');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setLanguage('');
    setProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Transcribir Audio</h2>

        {!isProcessing ? (
          <>
            {!selectedFile ? (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <UploadIcon size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Arrastra un archivo de audio o haz clic para seleccionar</p>
                  <p className="text-xs text-gray-400 mt-2">MP3, WAV, M4A, AAC, FLAC, OGG, WEBM</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_ATTRIBUTE}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Archivo seleccionado:</p>
                  <p className="text-sm text-gray-600 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma (opcional)
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={processAudio}
                disabled={!selectedFile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Transcribir
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <Loader size={40} className="mx-auto animate-spin text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Procesando audio...</p>
              <p className="text-xs text-gray-500 mt-1">Por favor espera mientras tu audio se transcribe</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
