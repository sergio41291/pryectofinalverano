import { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuestionnaireModalProps {
  isOpen: boolean;
  audioResultId: string;
  onClose: () => void;
}

export function AudioQuestionnaireModal({
  isOpen,
  audioResultId,
  onClose,
}: QuestionnaireModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateQuestionnaire();
    }
  }, [isOpen]);

  const generateQuestionnaire = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);

    console.log('Generating questionnaire for audioResultId:', audioResultId);

    try {
      const response = await fetch(
        `${getApiUrl()}/processing/audio/${audioResultId}/questionnaire`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            difficulty: 'medium',
            numQuestions: 5,
          }),
        }
      );

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error('Error generating questionnaire');
      }

      const data = await response.json();
      console.log('Questionnaire data:', data);
      if (data.success && data.data) {
        // Si data.data es un array, usarlo directamente
        // Si es un objeto con un array dentro, buscar el array
        const questionsArray = Array.isArray(data.data) 
          ? data.data 
          : Array.isArray(data.data.questions)
          ? data.data.questions
          : Object.values(data.data).find((val): val is any[] => Array.isArray(val)) || [];
        
        console.log('Questions array:', questionsArray);
        setQuestions(questionsArray);
      }
    } catch (err) {
      console.error('Questionnaire error:', err);
      setError(err instanceof Error ? err.message : 'Error generating questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return { correct, total: questions.length };
  };

  if (!isOpen) return null;

  if (loading && questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
          <Loader className="animate-spin text-purple-600" size={40} />
          <p className="text-gray-700 font-semibold">Generando cuestionario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Error</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={generateQuestionnaire}
            className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Intentar de Nuevo
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const score = calculateScore();
  const isAnswered = selectedAnswers[currentQuestion.id] !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b">
          <h2 className="text-xl font-bold">Cuestionario Interactivo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {showResults ? (
            // Results View
            <div className="space-y-8">
              {/* Score Summary */}
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {score.correct}/{score.total}
                </div>
                <p className="text-gray-600 text-lg mb-4">
                  {((score.correct / score.total) * 100).toFixed(0)}% correcto
                </p>
              </div>

              {/* Review Answers */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Revisión de Respuestas</h3>
                {questions.map((question, idx) => {
                  const userAnswer = selectedAnswers[question.id];
                  const isCorrectAnswer = userAnswer === question.correctAnswer;
                  return (
                    <div key={question.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        {isCorrectAnswer ? (
                          <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                        ) : (
                          <XCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {idx + 1}. {question.question}
                          </p>
                        </div>
                      </div>

                      <div className="ml-8 space-y-2">
                        {question.options.map((option, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-lg text-sm ${
                              optIdx === question.correctAnswer
                                ? 'bg-green-100 text-green-800 font-semibold'
                                : optIdx === userAnswer && !isCorrectAnswer
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <span className="font-semibold">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>{' '}
                            {option}
                            {optIdx === question.correctAnswer && (
                              <span className="ml-2">✓ Respuesta correcta</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {!isCorrectAnswer && (
                        <div className="ml-8 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Explicación:</p>
                          <p className="text-sm text-blue-700">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers({});
                    setShowResults(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Intentar de Nuevo
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            // Question View
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 font-semibold">
                  Pregunta {currentQuestionIndex + 1} de {questions.length}
                </p>
                <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{
                      width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  {currentQuestion.question}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        handleSelectAnswer(currentQuestion.id, idx)
                      }
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        selectedAnswers[currentQuestion.id] === idx
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-semibold text-gray-900">
                        {String.fromCharCode(65 + idx)}.
                      </span>{' '}
                      <span className="text-gray-700">{option}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>

                {currentQuestionIndex === questions.length - 1 && isAnswered ? (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Ver Resultados
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!isAnswered || currentQuestionIndex === questions.length - 1}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
