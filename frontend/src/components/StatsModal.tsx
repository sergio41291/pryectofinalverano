import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaireId: string;
  questionnaireName: string;
}

interface QuestionStat {
  questionIndex: number;
  questionText: string;
  correctCount: number;
  totalResponses: number;
  accuracy: number | string;
}

interface Stats {
  totalResponses: number;
  averageScore: number | string;
  highestScore: number | string;
  lowestScore: number | string;
  questionStats: QuestionStat[];
  responses: Array<{
    respondentName: string;
    respondentEmail: string;
    score: number | string;
    submittedAt: string;
  }>;
}

export function StatsModal({ isOpen, onClose, questionnaireId, questionnaireName }: StatsModalProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && questionnaireId) {
      loadStats();
    }
  }, [isOpen, questionnaireId]);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/questionnaires/${questionnaireId}/stats`);
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl p-8 bg-white rounded-2xl shadow-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Estadísticas: {questionnaireName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {loading && <div className="text-center py-8 text-gray-500">Cargando estadísticas...</div>}

        {error && <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm mb-4">{error}</div>}

        {stats && (
          <div className="space-y-6">
            {/* Resumen General */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Total de Respuestas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalResponses}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Puntuación Promedio</p>
                <p className="text-2xl font-bold text-green-600">{parseFloat(String(stats.averageScore)).toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Puntuación Más Alta</p>
                <p className="text-2xl font-bold text-purple-600">{parseFloat(String(stats.highestScore)).toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600">Puntuación Más Baja</p>
                <p className="text-2xl font-bold text-orange-600">{parseFloat(String(stats.lowestScore)).toFixed(1)}%</p>
              </div>
            </div>

            {/* Precisión por Pregunta */}
            {stats.questionStats.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Precisión por Pregunta</h3>
                <div className="space-y-3">
                  {stats.questionStats.map((q, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {idx + 1}. {q.questionText.substring(0, 50)}...
                        </p>
                        <span className="text-sm font-bold text-gray-900">{parseFloat(String(q.accuracy)).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${q.accuracy}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {q.correctCount} de {q.totalResponses} respuestas correctas
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Respuestas */}
            {stats.responses.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Histórico de Respuestas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Respondente</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Correo</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Puntuación</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.responses.map((response, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-900">{response.respondentName}</td>
                          <td className="py-2 px-3 text-gray-600 text-xs">{response.respondentEmail}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${parseFloat(String(response.score)) >= 70 ? 'bg-green-100 text-green-700' : parseFloat(String(response.score)) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {parseFloat(String(response.score)).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-500 text-xs">{new Date(response.submittedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {stats.totalResponses === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Aún no hay respuestas para este cuestionario</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
