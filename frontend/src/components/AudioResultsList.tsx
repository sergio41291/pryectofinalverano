import { Download, Eye, Trash2, Clock, Globe } from 'lucide-react';
import type { AudioResult } from '../services/audioService';
import { useState } from 'react';

interface AudioResultsListProps {
  results: AudioResult[];
  onView: (result: AudioResult) => void;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
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
  onView,
  onDelete,
  loading = false,
}: AudioResultsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDownload = (result: AudioResult) => {
    const element = document.createElement('a');
    const file = new Blob([result.transcription], { type: 'text/plain' });
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
      <div className="text-center py-12">
        <p className="text-gray-500">No hay transcripciones aún.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Archivo</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Idioma</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded text-blue-600">
                    <Globe size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {result.uploadId.slice(0, 8)}...
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe size={16} />
                  {result.languageDetails?.language || result.language || 'Auto-detectado'}
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    result.status
                  )}`}
                >
                  {result.status === 'processing' && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2"></div>
                  )}
                  {getStatusLabel(result.status)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  {new Date(result.completedAt || result.createdAt).toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(result)}
                    disabled={result.status !== 'completed'}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Ver transcripción"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleDownload(result)}
                    disabled={result.status !== 'completed'}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Descargar como texto"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(result.id)}
                    disabled={deletingId === result.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
