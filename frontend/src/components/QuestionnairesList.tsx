import { useState, useEffect } from 'react';
import { Download, Trash2, Share2, BarChart3, Loader, Users } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { StatsModal } from './StatsModal';
import { ShareWithGroupModal } from './ShareWithGroupModal';
import api from '../services/api';

interface Questionnaire {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  totalResponses: number;
  averageScore: number | string;
  createdAt: string;
  updatedAt: string;
  groupId?: string | null;
}

export function QuestionnairesList() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [shareWithGroupModalOpen, setShareWithGroupModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      const response = await api.get('/questionnaires');
      setQuestionnaires(Array.isArray(response.data) ? response.data : response.data.questionnaires || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const downloadQuestionnaire = async (id: string, format: 'json' | 'pdf' | 'csv') => {
    try {
      const response = await api.get(`/questionnaires/${id}/download/${format}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questionnaire.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error downloading questionnaire');
    }
  };

  const deleteQuestionnaire = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this questionnaire?')) {
      return;
    }

    try {
      await api.delete(`/questionnaires/${id}`);
      setQuestionnaires(questionnaires.filter((q) => q.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting questionnaire');
    }
  };

  const openShareModal = (id: string, name: string) => {
    setSelectedId(id);
    setSelectedName(name);
    setShareModalOpen(true);
  };

  const openStatsModal = (id: string, name: string) => {
    setSelectedId(id);
    setSelectedName(name);
    setStatsModalOpen(true);
  };

  const openShareWithGroupModal = (id: string, name: string, groupId: string | null | undefined) => {
    setSelectedId(id);
    setSelectedName(name);
    setSelectedGroupId(groupId || null);
    setShareWithGroupModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-3xl border border-gray-100">
        <Loader size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (questionnaires.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No questionnaires yet.</p>
        <p className="text-gray-400 text-sm">Create your first questionnaire from the IA Lab section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Responses</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Avg Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {questionnaires.map((questionnaire) => (
                <tr key={questionnaire.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{questionnaire.name}</p>
                    {questionnaire.description && (
                      <p className="text-xs text-gray-500 mt-1">{questionnaire.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {new Date(questionnaire.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      questionnaire.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : questionnaire.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {questionnaire.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{questionnaire.totalResponses}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {parseFloat(String(questionnaire.averageScore)).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button 
                          id={`download-btn-${questionnaire.id}`}
                          onClick={() => setDownloadDropdownOpen(downloadDropdownOpen === questionnaire.id ? null : questionnaire.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                        >
                          <Download size={14} />
                          Download
                        </button>
                        {downloadDropdownOpen === questionnaire.id && (
                          <div className="fixed w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50" style={{
                            top: `${(document.getElementById(`download-btn-${questionnaire.id}`)?.getBoundingClientRect().bottom || 0) + 8}px`,
                            right: `${window.innerWidth - (document.getElementById(`download-btn-${questionnaire.id}`)?.getBoundingClientRect().right || 0)}px`
                          }}>
                            <button
                              onClick={() => {
                                downloadQuestionnaire(questionnaire.id, 'json');
                                setDownloadDropdownOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => {
                                downloadQuestionnaire(questionnaire.id, 'pdf');
                                setDownloadDropdownOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() => {
                                downloadQuestionnaire(questionnaire.id, 'csv');
                                setDownloadDropdownOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                            >
                              CSV
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => openShareModal(questionnaire.id, questionnaire.name)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-xs font-medium"
                        title="Share"
                      >
                        <Share2 size={14} />
                      </button>

                      <button
                        onClick={() => openShareWithGroupModal(questionnaire.id, questionnaire.name, questionnaire.groupId)}
                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs font-medium ${
                          questionnaire.groupId
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        }`}
                        title={questionnaire.groupId ? "Shared with group" : "Share with group"}
                      >
                        <Users size={14} />
                        {questionnaire.groupId && <span className="text-xs">✓</span>}
                      </button>

                      <button
                        onClick={() => openStatsModal(questionnaire.id, questionnaire.name)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium"
                        title="Statistics"
                      >
                        <BarChart3 size={14} />
                      </button>

                      <button
                        onClick={() => deleteQuestionnaire(questionnaire.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                        title="Delete"
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

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        questionnaireId={selectedId}
        questionnaireName={selectedName}
        onShareConfigured={loadQuestionnaires}
      />

      <StatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        questionnaireId={selectedId}
        questionnaireName={selectedName}
      />

      <ShareWithGroupModal
        isOpen={shareWithGroupModalOpen}
        onClose={() => setShareWithGroupModalOpen(false)}
        questionnaireId={selectedId}
        questionnaireName={selectedName}
        currentGroupId={selectedGroupId}
        onSuccess={loadQuestionnaires}
      />
    </div>
  );
}
