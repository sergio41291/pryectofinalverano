import { Download, Trash2, Clock, Music, Sparkles, BookOpen } from 'lucide-react';
import type { AudioResult } from '../services/audioService';
import { useState } from 'react';

interface AudioResultsListProps {
  results: AudioResult[];
  onView: (result: AudioResult) => void;
  onDelete: (id: string) => Promise<void>;
  onDownload?: (result: AudioResult) => void;
  onAIAction?: (action: 'summary' | 'quiz', result: AudioResult) => void;
  loading?: boolean;
  page?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'processing':
      return 'bg-blue-100 text-blue-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    completed: 'Completado',
    processing: 'Procesando',
    failed: 'Error',
    pending: 'Pendiente',
  };
  return labels[status] || status;
};

export function AudioResultsList({
  results,
  onDelete,
  onDownload,
  onAIAction,
  loading = false,
  page = 1,
  total = 0,
  onPageChange,
}: AudioResultsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  const handleDownload = (result: AudioResult) => {
    if (onDownload) {
      onDownload(result);
      return;
    }

    const element = document.createElement('a');
    const file = new Blob([result.transcription || ''], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcription_${result.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta transcripción?')) {
      return;
    }
    try {
      setDeletingId(id);
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <Music size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No hay transcripciones aún.</p>
        <p className="text-gray-400 text-sm">Carga un audio para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabla de transcripciones */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Archivo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Idioma</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg text-purple-600">
                        <Music size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">Audio {result.uploadId.slice(0, 8)}</span>
                        <span className="text-xs text-gray-500">ID: {result.id.slice(0, 12)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {result.language || 'Auto-detectado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-gray-400" />
                      {new Date(result.completedAt || result.createdAt).toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(result.status)}`}>
                      {getStatusLabel(result.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(result)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                        title="Descargar transcripción"
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">Descargar</span>
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === result.id ? null : result.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium"
                          title="Acciones de IA"
                        >
                          <Sparkles size={14} />
                          <span className="hidden sm:inline">IA Lab</span>
                        </button>
                        
                        {openDropdownId === result.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-10">
                            <button
                              onClick={() => {
                                console.log('Summary button clicked');
                                onAIAction?.('summary', result);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 transition-colors"
                            >
                              <Sparkles size={16} className="text-purple-500" />
                              Generar Resumen
                            </button>
                            <button
                              onClick={() => {
                                onAIAction?.('quiz', result);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 transition-colors"
                            >
                              <BookOpen size={16} className="text-blue-500" />
                              Generar Cuestionario
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(result.id)}
                        disabled={deletingId === result.id}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{results.length}</span> de <span className="font-semibold">{total}</span> transcripciones
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <div className="text-sm text-gray-600">
              Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
            </div>
            <button
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
