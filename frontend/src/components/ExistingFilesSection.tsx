import { useState, useEffect } from 'react';
import { Music, FileText, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { getApiUrl } from '../config/api';

export interface ExistingFile {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  ocrText?: string;
  transcription?: string;
  extractedText?: string;
  type: 'audio' | 'pdf' | 'image';
}

interface ExistingFilesSectionProps {
  onSelectFile: (file: ExistingFile) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 6;

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
  return 'Documento';
};

export function ExistingFilesSection({ onSelectFile, isLoading = false }: ExistingFilesSectionProps) {
  const [audioFiles, setAudioFiles] = useState<ExistingFile[]>([]);
  const [otherFiles, setOtherFiles] = useState<ExistingFile[]>([]);
  const [audioPage, setAudioPage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExistingFiles();
  }, []);

  const loadExistingFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiUrl()}/uploads`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error loading files');
      }

      const data = await response.json();
      
      // Manejar diferentes formatos de respuesta
      let files: any[] = [];
      if (Array.isArray(data)) {
        files = data;
      } else if (data.data && Array.isArray(data.data)) {
        files = data.data;
      } else if (data.uploads && Array.isArray(data.uploads)) {
        files = data.uploads;
      } else {
        console.warn('Unexpected API response format:', data);
        setAudioFiles([]);
        setOtherFiles([]);
        return;
      }

      
      // Log de la estructura del primer archivo
      if (files.length > 0) {
        // Mostrar específicamente los campos de nombre
      }

      // Para ahora, mostrar TODOS los archivos (no filtrar por texto)
      // El texto se procesará cuando el usuario seleccione un archivo
      const audio = files.filter((f) => f.type === 'audio' || f.mimeType?.includes('audio'));
      const others = files.filter((f) => f.type !== 'audio' && !f.mimeType?.includes('audio'));

      setAudioFiles(audio);
      setOtherFiles(others);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading files');
      console.error('Load files error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="animate-spin text-blue-600 mr-3" size={24} />
        <span className="text-gray-600">Cargando archivos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (audioFiles.length === 0 && otherFiles.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-center">
        <div>
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No hay archivos procesados aún. Carga uno en la pestaña "Nuevo Archivo"</p>
        </div>
      </div>
    );
  }

  const audioStart = (audioPage - 1) * ITEMS_PER_PAGE;
  const audioEnd = audioStart + ITEMS_PER_PAGE;
  const audioPageData = audioFiles.slice(audioStart, audioEnd);
  const audioPageCount = Math.ceil(audioFiles.length / ITEMS_PER_PAGE);

  const otherStart = (otherPage - 1) * ITEMS_PER_PAGE;
  const otherEnd = otherStart + ITEMS_PER_PAGE;
  const otherPageData = otherFiles.slice(otherStart, otherEnd);
  const otherPageCount = Math.ceil(otherFiles.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      {/* Audio Files Section */}
      {audioFiles.length > 0 && (
        <div>
          <div className="mb-4 pb-2 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Music size={20} className="text-purple-600" />
              Archivos de Audio ({audioFiles.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tamaño</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {audioPageData.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-purple-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{(file as any).originalFilename || (file as any).fileName || (file as any).name || 'Audio'}</td>
                    <td className="px-4 py-3 text-gray-600">{getFileTypeLabel(file.mimeType)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(file.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatFileSize(file.fileSize)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectFile(file)}
                        className="px-4 py-1 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors"
                      >
                        Usar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {audioPageCount > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
              <span>Página {audioPage} de {audioPageCount}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setAudioPage(Math.max(1, audioPage - 1))}
                  disabled={audioPage === 1}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <button
                  onClick={() => setAudioPage(Math.min(audioPageCount, audioPage + 1))}
                  disabled={audioPage === audioPageCount}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Other Files Section */}
      {otherFiles.length > 0 && (
        <div>
          <div className="mb-4 pb-2 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Otros Archivos ({otherFiles.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tamaño</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {otherPageData.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-blue-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{(file as any).originalFilename || (file as any).fileName || (file as any).name || 'Documento'}</td>
                    <td className="px-4 py-3 text-gray-600">{getFileTypeLabel(file.mimeType)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(file.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatFileSize(file.fileSize)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectFile(file)}
                        className="px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
                      >
                        Usar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {otherPageCount > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
              <span>Página {otherPage} de {otherPageCount}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOtherPage(Math.max(1, otherPage - 1))}
                  disabled={otherPage === 1}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <button
                  onClick={() => setOtherPage(Math.min(otherPageCount, otherPage + 1))}
                  disabled={otherPage === otherPageCount}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
