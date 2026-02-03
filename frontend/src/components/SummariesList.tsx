import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, Trash2, Loader, Users } from 'lucide-react';
import { ShareSummaryWithGroupModal } from './ShareSummaryWithGroupModal';

interface Summary {
  id: string;
  title: string;
  language: string;
  style: string;
  sourceCharCount: number;
  summaryCharCount: number;
  sourceFileName: string;
  createdAt: string;
  updatedAt: string;
  groupId?: string | null;
}

interface SummariesListProps {
  refreshTrigger?: number;
}

export const SummariesList: React.FC<SummariesListProps> = ({ refreshTrigger }) => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);

  const limit = 10;

  const fetchSummaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/processing/summaries`, {
        params: { page, limit },
      });
      
      // Handle the response structure
      const data = response.data?.data || response.data || [];
      const totalCount = response.data?.total || 0;
      
      setSummaries(Array.isArray(data) ? data : []);
      setTotal(totalCount);
    } catch (err: any) {
      console.error('❌ Error fetching summaries:', err);
      console.error('Error response:', err.response);
      const errorMsg = err.response?.data?.message || err.message || 'Error al cargar resúmenes';
      setError(errorMsg);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, [page, refreshTrigger]);

  const handleDownload = async (summaryId: string, title: string) => {
    setDownloading(summaryId);
    try {
      const response = await api.get(`/processing/summaries/${summaryId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al descargar resumen');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (summaryId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este resumen?')) return;

    setDeleting(summaryId);
    try {
      await api.delete(`/processing/summaries/${summaryId}`);
      setSummaries(summaries.filter(s => s.id !== summaryId));
      setTotal(total - 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar resumen');
    } finally {
      setDeleting(null);
    }
  };

  const openShareModal = (summary: Summary) => {
    setSelectedSummary(summary);
    setShareModalOpen(true);
  };

  const handleShareSuccess = () => {
    fetchSummaries();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStyleBadge = (style: string) => {
    const styles: Record<string, string> = {
      'bullet-points': 'bg-blue-100 text-blue-800',
      paragraph: 'bg-green-100 text-green-800',
      executive: 'bg-purple-100 text-purple-800',
    };
    return styles[style] || 'bg-gray-100 text-gray-800';
  };

  if (loading && summaries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
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

      {loading && !summaries?.length ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={40} className="animate-spin text-blue-600" />
        </div>
      ) : !summaries || summaries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No tienes resúmenes guardados</p>
          <p className="text-sm text-gray-400">
            Genera tu primer resumen usando la funcionalidad de OCR o Audio
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{summary.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStyleBadge(summary.style)}`}>
                        {summary.style}
                      </span>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {summary.language.toUpperCase()}
                      </span>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {summary.summaryCharCount} caracteres
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {summary.sourceFileName && `De: ${summary.sourceFileName} • `}
                      Creado: {formatDate(summary.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openShareModal(summary)}
                      className={`p-2 rounded-lg transition-colors ${
                        summary.groupId 
                          ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                          : 'text-orange-600 hover:bg-orange-50'
                      }`}
                      title={summary.groupId ? 'Compartido con grupo' : 'Compartir con grupo'}
                    >
                      <Users className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(summary.id, summary.title)}
                      disabled={downloading === summary.id}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Descargar resumen"
                    >
                      {downloading === summary.id ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(summary.id)}
                      disabled={deleting === summary.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar resumen"
                    >
                      {deleting === summary.id ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => (p * limit < total ? p + 1 : p))}
                  disabled={page * limit >= total}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedSummary && (
        <ShareSummaryWithGroupModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedSummary(null);
          }}
          summaryId={selectedSummary.id}
          summaryTitle={selectedSummary.title}
          currentGroupId={selectedSummary.groupId || null}
          onSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
};
