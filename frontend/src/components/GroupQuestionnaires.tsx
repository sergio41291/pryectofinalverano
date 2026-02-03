import { useState, useEffect } from 'react';
import { FileText, User, Calendar, Loader } from 'lucide-react';
import groupsService from '../services/groupsService';
import { type Questionnaire } from '../services/questionnairesService';

interface GroupQuestionnairesProps {
  groupId: string;
}

export function GroupQuestionnaires({ groupId }: GroupQuestionnairesProps) {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestionnaires();
  }, [groupId]);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      const data = await groupsService.getGroupQuestionnaires(groupId);
      setQuestionnaires(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuestionnaire = (questionnaireId: string) => {
    // Navegar a la página de respuesta del cuestionario
    window.location.href = `/share/${questionnaireId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="animate-spin text-blue-600" />
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

  if (questionnaires.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No questionnaires shared yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Group owners can share questionnaires with this group.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questionnaires.map((questionnaire) => (
          <div
            key={questionnaire.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewQuestionnaire(questionnaire.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-blue-600" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                questionnaire.status === 'published'
                  ? 'bg-green-100 text-green-700'
                  : questionnaire.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {questionnaire.status}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {questionnaire.name}
            </h3>

            {questionnaire.description && (
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {questionnaire.description}
              </p>
            )}

            <div className="space-y-2 text-sm text-gray-600">
              {questionnaire.user && (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span>{questionnaire.user.fullName || questionnaire.user.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span>{new Date(questionnaire.createdAt).toLocaleDateString('es-ES')}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-xs text-gray-500">Responses:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {questionnaire.totalResponses}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Avg Score:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {parseFloat(String(questionnaire.averageScore)).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewQuestionnaire(questionnaire.id);
              }}
              className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View & Answer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
