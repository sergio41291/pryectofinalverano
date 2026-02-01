import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import api from '../services/api';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Questionnaire {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

export function Share() {
  const token = window.location.pathname.split('/')[2];
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authType, setAuthType] = useState<'password' | 'email' | null>(null);
  const [unavailableDate, setUnavailableDate] = useState<Date | null>(null);
  const [unavailableReason, setUnavailableReason] = useState<'future' | 'expired' | null>(null);

  useEffect(() => {
    loadQuestionnaire();
  }, [token]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/questionnaires/share/${token}`);
      setQuestionnaire(response.data);
      setAnswers(new Array(response.data.questions.length).fill(null));
      setError(null);
      setNeedsAuth(false);
      setUnavailableDate(null);
    } catch (err: any) {
      const errorData = err.response?.data;
      
      if ((err.response?.status === 403 || err.response?.status === 400 || err.response?.status === 425 || err.response?.status === 410) && errorData?.requiresType) {
        if (errorData.requiresType === 'date') {
          // Handle date-based unavailability
          setUnavailableDate(new Date(errorData.availableFrom || errorData.availableUntil));
          setUnavailableReason(errorData.availableFrom ? 'future' : 'expired');
          setNeedsAuth(false);
        } else if (errorData.requiresType === 'password' || errorData.requiresType === 'email') {
          // Handle authentication-based restriction
          setNeedsAuth(true);
          setAuthType(errorData.requiresType);
          setUnavailableDate(null);
        }
      } else {
        setError(errorData?.message || 'Cuestionario no encontrado o acceso denegado');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post(`/questionnaires/share/${token}/auth`, {
        password: authType === 'password' ? password : undefined,
        email: authType === 'email' ? email : undefined,
      });
      setQuestionnaire(response.data.questionnaire);
      setAnswers(new Array(response.data.questionnaire.questions.length).fill(null));
      setNeedsAuth(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Autenticación fallida');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!respondentName) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    if (answers.some((a) => a === null)) {
      setError('Por favor responde todas las preguntas');
      return;
    }

    try {
      await api.post(`/questionnaires/${questionnaire?.id}/responses`, {
        respondentName,
        respondentEmail: email || undefined,
        answers: answers.map((answer, index) => ({
          questionId: questionnaire!.questions[index].id,
          selectedAnswer: answer,
        })),
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar respuestas');
    }
  };

  if (unavailableDate && unavailableReason) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {unavailableReason === 'future' ? 'Acceso Restringido' : 'Cuestionario Expirado'}
          </h1>
          <p className="text-gray-600 mb-4">
            {unavailableReason === 'future' 
              ? 'Este cuestionario aún no está disponible. Se abrirá en:' 
              : 'Este cuestionario ya no está disponible. Estuvo disponible hasta:'}
          </p>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900 font-semibold text-lg">
              {formatDate(unavailableDate)}
            </p>
          </div>

          {unavailableReason === 'future' && (
            <p className="text-sm text-gray-500 text-center">
              Vuelve a intentar acceder en esa fecha para responder el cuestionario.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por responder!</h1>
          <p className="text-gray-600">Tus respuestas han sido registradas correctamente.</p>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
          <p className="text-gray-600 mb-6">
            {authType === 'password' ? 'Este cuestionario está protegido por contraseña.' : 'Este cuestionario requiere verificación de correo.'}
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authType === 'password' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            )}

            {authType === 'email' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ingresa tu correo"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              {loading ? 'Verificando...' : 'Verificar Acceso'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Cuestionario no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{questionnaire.name}</h1>
          {questionnaire.description && (
            <p className="text-gray-600 mb-4">{questionnaire.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Tu Información</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Ingresa tu nombre"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo (opcional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-6">
            {questionnaire.questions.map((question, qIndex) => (
              <div key={question.id} className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {qIndex + 1}. {question.question}
                </h3>

                <div className="space-y-3">
                  {question.options.map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{ borderColor: answers[qIndex] === optIndex ? '#3b82f6' : '#e5e7eb' }}>
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={optIndex}
                        checked={answers[qIndex] === optIndex}
                        onChange={() => handleAnswerChange(qIndex, optIndex)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            Enviar Respuestas
          </button>
        </form>
      </div>
    </div>
  );
}
