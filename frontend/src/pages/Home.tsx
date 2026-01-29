import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { OCRResults } from '../components/OCRResults';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Upload,
  FileText,
  BrainCircuit,
  LogOut,
  Loader,
  AlertCircle,
} from 'lucide-react';
import type { Upload as UploadType, OcrResult } from '../services/api';
import { uploadService, ocrService } from '../services/api';

export function Home() {
  const { logout } = useAuth();
  const { isConnected, notifications, clearNotifications } = useWebSocket();
  
  const [uploads, setUploads] = useState<UploadType[]>([]);
  const [ocrResults, setOcrResults] = useState<Map<string, OcrResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Cargar uploads al iniciar
  useEffect(() => {
    loadUploads();
  }, []);

  // Escuchar notificaciones de OCR
  useEffect(() => {
    notifications.forEach((notif) => {
      if (notif.status === 'completed' && notif.result) {
        setOcrResults((prev) => new Map(prev).set(notif.uploadId, {
          id: notif.uploadId,
          uploadId: notif.uploadId,
          rawText: notif.result!.text,
          confidence: notif.result!.confidence,
          language: notif.result!.language,
          processedAt: new Date().toISOString(),
        }));
        setProcessingId(null);
      } else if (notif.status === 'failed') {
        setError(notif.message || 'Error al procesar OCR');
        setProcessingId(null);
      }
    });
    if (notifications.length > 0) {
      clearNotifications();
    }
  }, [notifications, clearNotifications]);

  const loadUploads = async () => {
    try {
      setIsLoading(true);
      const response = await uploadService.listUploads();
      setUploads(response.data);
      
      // Cargar resultados de OCR para cada upload
      for (const upload of response.data) {
        try {
          const result = await ocrService.getOcrResult(upload.id);
          setOcrResults((prev) => new Map(prev).set(upload.id, result));
        } catch {
          // Sin resultado aún
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      
      // Subir archivo
      const upload = await uploadService.uploadFile(file);
      setUploads((prev) => [upload, ...prev]);
      
      // Iniciar OCR automáticamente
      setProcessingId(upload.id);
      await ocrService.processOcr(upload.id, 'es');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Documentos</h1>
              <p className="text-gray-600 mt-1">
                WebSocket: <span className={isConnected ? 'text-green-600 font-medium' : 'text-red-600'}>
                  {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                </span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-w-6xl mx-auto">
          {/* Upload Area */}
          <div className="mb-10">
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="font-semibold text-gray-900 mb-1">
                  {isUploading ? 'Subiendo...' : 'Sube tu documento aquí'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {isUploading
                    ? 'Por favor espera...'
                    : 'PDF, imágenes o documentos (máx 100MB)'}
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp"
                  className="hidden"
                />
              </div>
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-gap gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Status */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-blue-600 mr-2" size={24} />
              <span className="text-gray-600">Cargando documentos...</span>
            </div>
          )}

          {/* Documents List */}
          {!isLoading && uploads.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900">Sin documentos</h3>
              <p className="text-gray-600">Sube tu primer documento para comenzar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {uploads.map((upload) => {
                const result = ocrResults.get(upload.id);
                const isProcessing = processingId === upload.id;

                return (
                  <div key={upload.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg text-blue-600">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{upload.fileName}</h3>
                          <p className="text-sm text-gray-500">
                            {(upload.fileSize / 1024).toFixed(2)} KB • {new Date(upload.uploadedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isProcessing ? (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Loader className="animate-spin" size={16} />
                            <span className="text-sm font-medium">Procesando...</span>
                          </div>
                        ) : result ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            ✓ Completado
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              setProcessingId(upload.id);
                              try {
                                await ocrService.processOcr(upload.id, 'es');
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Error al procesar');
                                setProcessingId(null);
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <BrainCircuit size={16} className="inline mr-2" />
                            Procesar con IA
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Show OCR Result if Available */}
                    {result && <OCRResults result={result} fileName={upload.fileName} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}