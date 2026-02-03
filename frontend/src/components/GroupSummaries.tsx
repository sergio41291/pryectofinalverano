import { useState, useEffect } from 'react';
import { FileText, User, Calendar, Loader } from 'lucide-react';
import groupsService from '../services/groupsService';
import { type Summary } from '../services/summariesService';

interface GroupSummariesProps {
  groupId: string;
}

export function GroupSummaries({ groupId }: GroupSummariesProps) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummaries();
  }, [groupId]);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const data = await groupsService.getGroupSummaries(groupId);
      setSummaries(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading summaries');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSummary = (summaryId: string) => {
    // Navegar a la vista del resumen (puedes ajustar esto según tu ruta)
    window.location.href = `/summaries/${summaryId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No summaries shared yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Group members can share summaries with this group.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewSummary(summary.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-green-600" />
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {summary.language.toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {summary.style === 'bullet-points' ? 'Bullets' : summary.style === 'paragraph' ? 'Paragraph' : 'Executive'}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {summary.title}
            </h3>

            <p className="text-sm text-gray-500 mb-4 line-clamp-3">
              {summary.summaryContent.substring(0, 150)}...
            </p>

            <div className="space-y-2 text-sm text-gray-600">
              {summary.user && (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span>{summary.user.fullName || summary.user.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span>{new Date(summary.createdAt).toLocaleDateString('es-ES')}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-xs text-gray-500">Source:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {summary.sourceCharCount || 0} chars
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Summary:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {summary.summaryCharCount || 0} chars
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewSummary(summary.id);
              }}
              className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              View Summary
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
