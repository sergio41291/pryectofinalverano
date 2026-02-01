import React, { useState, useEffect } from 'react';
import { Download, Trash2, Loader, Eye, Calendar, Hash } from 'lucide-react';
import { mindMapService, type MindMap } from '../services/mindMapService';

interface MindMapsListProps {
  refreshTrigger?: number;
  onViewMindMap?: (mindMap: MindMap) => void;
}

export const MindMapsList: React.FC<MindMapsListProps> = ({ refreshTrigger, onViewMindMap }) => {
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const limit = 9;

  const fetchMindMaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mindMapService.getMindMaps(page, limit);
      setMindMaps(response.data);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Error fetching mind maps:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar mapas mentales');
      setMindMaps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMindMaps();
  }, [page, refreshTrigger]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${title}"?`)) return;

    setDeleting(id);
    try {
      await mindMapService.deleteMindMap(id);
      setMindMaps(mindMaps.filter((mm) => mm.id !== id));
      setTotal(total - 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar mapa mental');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (id: string, title: string) => {
    setDownloading(id);
    try {
      await mindMapService.downloadMindMap(id, title);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al descargar mapa mental');
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && mindMaps.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {!loading && mindMaps.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">No tienes mapas mentales guardados</p>
          <p className="text-sm text-gray-400">
            Genera tu primer mapa mental desde la pestaña "Generar"
          </p>
        </div>
      ) : (
        <>
          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mindMaps.map((mindMap) => (
              <div
                key={mindMap.id}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all group"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {mindMap.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      <Hash className="w-3 h-3" />
                      {mindMap.nodeCount} nodos
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {mindMap.language.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-4 text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Creado: {formatDate(mindMap.createdAt.toString())}</span>
                  </div>
                  <div>
                    <span>{mindMap.sourceCharCount} caracteres analizados</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewMindMap?.(mindMap)}
                    className="flex-1 py-2 px-3 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleDownload(mindMap.id, mindMap.title)}
                    disabled={downloading === mindMap.id}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Descargar JSON"
                  >
                    {downloading === mindMap.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(mindMap.id, mindMap.title)}
                    disabled={deleting === mindMap.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deleting === mindMap.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => (p * limit < total ? p + 1 : p))}
                  disabled={page * limit >= total}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
