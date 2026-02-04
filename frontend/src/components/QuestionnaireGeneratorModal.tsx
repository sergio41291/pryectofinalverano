import { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ExistingFilesSection, type ExistingFile } from './ExistingFilesSection';
import { getApiUrl } from '../config/api';

interface QuestionnaireGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  preloadedText?: string;
  preloadedFileName?: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export function QuestionnaireGeneratorModal({
  isOpen,
  onClose,
  preloadedText = '',
  preloadedFileName = '',
}: QuestionnaireGeneratorModalProps) {
  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [uploadedText, setUploadedText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'selectQuestions' | 'questions' | 'results'>('upload');

  // Si hay texto precargado, inicializar el modal en ese estado
  useEffect(() => {
    if (preloadedText) {
      setUploadedText(preloadedText);
      setUploadedFileName(preloadedFileName || 'Transcripción de Audio');
      setStep('selectQuestions');
    }
  }, [preloadedText, preloadedFileName]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${getApiUrl()}/api/uploads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Error uploading file');
      }

      const uploadData = await uploadResponse.json();
      const uploadId = uploadData.id;

      setUploadedFileName(file.name);
      let extractedText = '';

      if (file.type === 'application/pdf' || file.type.includes('image')) {
        const ocrResponse = await fetch(
          `${getApiUrl()}/api/ocr/${uploadId}/process`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!ocrResponse.ok) {
          throw new Error('Error processing OCR');
        }

        const ocrData = await ocrResponse.json();
        console.log('OCR response data:', ocrData);
        
        // Usar uploadId para buscar el resultado (no el ocrResultId)
        const uploadIdForCheck = ocrData.uploadId;
        
        // Esperar a que el OCR se procese completamente con reintentos
        let retries = 0;
        const maxRetries = 20; // 20 reintentos x 1 segundo = 20 segundos máximo
        let resultFound = false;

        while (retries < maxRetries && !resultFound) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo entre intentos

          try {
            console.log(`OCR check attempt ${retries + 1}/${maxRetries}, checking endpoint: /api/ocr/${uploadIdForCheck}`);
            
            const resultResponse = await fetch(
              `${getApiUrl()}/api/ocr/${uploadIdForCheck}`,
              {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
              }
            );

            console.log(`OCR result response status: ${resultResponse.status}`);

            if (resultResponse.ok) {
              const resultData = await resultResponse.json();
              console.log('OCR result data:', resultData);
              
              if (resultData.extractedText) {
                // El extractedText puede ser:
                // 1. Un objeto: {text: "...", confidence: ..., language: ...}
                // 2. Una cadena JSON: "{\"text\": \"...\", ...}"
                // 3. Una cadena plana: "text..."
                
                if (typeof resultData.extractedText === 'object') {
                  // Es un objeto, extraer el campo text
                  extractedText = resultData.extractedText.text || '';
                } else if (typeof resultData.extractedText === 'string') {
                  // Es una cadena, intentar parsear como JSON
                  try {
                    const parsed = JSON.parse(resultData.extractedText);
                    extractedText = parsed.text || resultData.extractedText;
                  } catch (e) {
                    // No es JSON, usar la cadena directamente
                    extractedText = resultData.extractedText;
                  }
                }
                
                console.log('Extracted text length:', extractedText.length);
                resultFound = true;
              }
            }
          } catch (e) {
            console.error(`OCR check attempt ${retries + 1} failed:`, e);
            // Ignorar errores y reintentar
          }

          retries++;
        }

        if (!resultFound) {
          throw new Error('OCR processing took too long. Please try again.');
        }
      } else if (file.type.includes('audio')) {
        const audioResponse = await fetch(
          `${getApiUrl()}/api/audio/${uploadId}/process`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!audioResponse.ok) {
          throw new Error('Error processing audio');
        }

        const audioData = await audioResponse.json();
        console.log('Audio response data:', audioData);
        
        // Usar uploadId para buscar el resultado (no el audioResultId)
        const uploadIdForCheck = audioData.uploadId;
        
        // Esperar a que el audio se procese completamente con reintentos
        let retries = 0;
        const maxRetries = 30; // 30 reintentos x 1 segundo = 30 segundos máximo
        let resultFound = false;

        while (retries < maxRetries && !resultFound) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo entre intentos

          try {
            console.log(`Audio check attempt ${retries + 1}/${maxRetries}, checking endpoint: /api/audio/${uploadIdForCheck}`);
            
            const resultResponse = await fetch(
              `${getApiUrl()}/api/audio/${uploadIdForCheck}`,
              {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
              }
            );

            console.log(`Audio result response status: ${resultResponse.status}`);

            if (resultResponse.ok) {
              const resultData = await resultResponse.json();
              console.log('Audio result data:', resultData);
              
              if (resultData.transcription) {
                extractedText = resultData.transcription;
                console.log('Extracted transcription length:', extractedText.length);
                resultFound = true;
              }
            }
          } catch (e) {
            console.error(`Audio check attempt ${retries + 1} failed:`, e);
            // Ignorar errores y reintentar
          }

          retries++;
        }

        if (!resultFound) {
          throw new Error('Audio processing took too long. Please try again.');
        }
      }

      if (!extractedText) {
        throw new Error('No text could be extracted from the file');
      }

      setUploadedText(extractedText);
      setStep('selectQuestions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing file');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Asegurarse de que uploadedText es una cadena válida
      let textToSend = uploadedText;
      if (typeof textToSend === 'object' && textToSend !== null) {
        // Si es un objeto, intentar extraer el text
        if ('text' in textToSend) {
          textToSend = (textToSend as any).text;
        } else {
          // Si no tiene text, convertir a string
          textToSend = JSON.stringify(textToSend);
        }
      }

      if (typeof textToSend !== 'string' || textToSend.trim().length === 0) {
        throw new Error('No valid text to generate questionnaire from');
      }

      const response = await fetch(`${getApiUrl()}/api/processing/questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          text: textToSend,
          language: 'es',
          numQuestions: numQuestions,
        }),
      });

      if (!response.ok) {
        throw new Error('Error generating questionnaire');
      }

      const data = await response.json();

      let questionsArray: Question[] = [];
      if (data.data) {
        if (Array.isArray(data.data)) {
          questionsArray = data.data;
        } else if (data.data.questions && Array.isArray(data.data.questions)) {
          questionsArray = data.data.questions;
        } else {
          const arrayValue = Object.values(data.data).find(
            (val): val is Question[] => Array.isArray(val)
          );
          if (arrayValue) {
            questionsArray = arrayValue;
          }
        }
      }

      if (!questionsArray || questionsArray.length === 0) {
        throw new Error('No questions were generated');
      }

      // Convertir correctAnswer de texto a índice si es necesario
      const normalizedQuestions = questionsArray.map((q: any) => {
        let correctAnswerIndex = q.correctAnswer;
        
        // Si correctAnswer es un string, buscar su índice en las opciones
        if (typeof q.correctAnswer === 'string') {
          const answerText = q.correctAnswer.trim().toLowerCase();
          correctAnswerIndex = q.options.findIndex((opt: string) => 
            opt.trim().toLowerCase() === answerText
          );
          
          // Si no encontró coincidencia exacta, intentar con trim simple
          if (correctAnswerIndex === -1) {
            correctAnswerIndex = q.options.findIndex((opt: string) => 
              opt === q.correctAnswer
            );
          }
          
          // Si aún no encontró, usar el índice 0 por defecto y loguear error
          if (correctAnswerIndex === -1) {
            console.warn(`Could not find answer "${q.correctAnswer}" in options:`, q.options);
            correctAnswerIndex = 0;
          }
        }
        
        return {
          ...q,
          correctAnswer: correctAnswerIndex
        };
      });

      setQuestions(normalizedQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setStep('questions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const saveQuestionnaire = async () => {
    if (questions.length === 0 || !uploadedFileName) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiUrl()}/api/questionnaires`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: uploadedFileName.replace(/\.[^/.]+$/, ''),
          description: `Generated from ${uploadedFileName}`,
          questions: questions,
          status: 'published',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save questionnaire');
      }

      setError('Questionnaire saved successfully');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving questionnaire');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Main Modal Container
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 pb-6 flex-shrink-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Generar Cuestionario</h2>
          <p className="text-gray-600 mb-8">Sube un nuevo archivo o selecciona uno que ya hayas procesado</p>

          {/* Pestañas */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setTab('new')}
              className={`px-6 py-3 font-medium text-lg transition-colors ${
                tab === 'new'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✨ Nuevo Archivo
            </button>
            <button
              onClick={() => setTab('existing')}
              className={`px-6 py-3 font-medium text-lg transition-colors ${
                tab === 'existing'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📁 Archivos Existentes
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="px-8 pb-8 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Tab: Nuevo Archivo */}
          {tab === 'new' && (
            <div>
              {step === 'upload' && (
                <div className="space-y-6">
                  <p className="text-center text-gray-600">
                    Carga un archivo para generar un cuestionario automáticamente.
                  </p>

                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                      dragActive
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                        <Upload size={32} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Arrastra tus archivos aquí</p>
                        <p className="text-sm text-gray-500">o haz clic para seleccionar</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.ogg,.m4a"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Seleccionar Archivo
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Formatos permitidos: PDF, JPG, PNG, GIF, MP3, WAV, OGG (máx 100MB)</p>
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Loader className="animate-spin text-blue-600" size={20} />
                      <span className="text-sm text-gray-600">Procesando archivo...</span>
                    </div>
                  )}
                </div>
              )}

              {step === 'selectQuestions' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      ¿Cuántas preguntas deseas generar?
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{numQuestions}</div>
                        <p className="text-xs text-gray-500">preguntas</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {[1, 5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          onClick={() => setNumQuestions(num)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            numQuestions === num
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setStep('upload');
                        setUploadedText('');
                        setError(null);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={generateQuestions}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Generando...' : 'Generar Preguntas'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'questions' && questions.length > 0 && !showResults && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Pregunta {currentQuestionIndex + 1} de {questions.length}
                    </h3>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg mb-6">
                    <p className="text-lg font-semibold text-gray-900 mb-6">
                      {questions[currentQuestionIndex].question}
                    </p>

                    <div className="space-y-3">
                      {questions[currentQuestionIndex].options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedAnswers({
                              ...selectedAnswers,
                              [currentQuestionIndex]: idx,
                            });
                          }}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all font-medium ${
                            selectedAnswers[currentQuestionIndex] === idx
                              ? 'border-blue-600 bg-blue-100 text-gray-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() =>
                        setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                      }
                      disabled={currentQuestionIndex === 0}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      ← Anterior
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                      <button
                        onClick={() => setShowResults(true)}
                        className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Ver Resultados →
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Siguiente →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {showResults && questions.length > 0 && (
                <div className="space-y-6">
                  <div className="bg-green-50 p-8 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-6">
                      <CheckCircle2 size={28} className="text-green-600" />
                      <h2 className="text-2xl font-bold text-green-900">¡Cuestionario Completado!</h2>
                    </div>

                    {/* Puntuación */}
                    <div className="bg-white rounded-lg p-6 mb-6 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Puntuación Final</p>
                          <p className="text-4xl font-bold text-green-600">
                            {questions.reduce((acc, q, idx) => acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0), 0)} / {questions.length}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">Porcentaje</p>
                          <p className="text-4xl font-bold text-blue-600">
                            {Math.round((questions.reduce((acc, q, idx) => acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0), 0) / questions.length) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detalle de respuestas */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900">Detalle de Respuestas:</h4>
                      {questions.map((question, idx) => {
                        const selected = selectedAnswers[idx];
                        const isCorrect = selected === question.correctAnswer;

                        return (
                          <div key={idx} className={`border-l-4 pl-4 py-3 rounded ${
                            isCorrect 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-red-500 bg-red-50'
                          }`}>
                            <p className="font-semibold text-gray-900 mb-2">
                              Pregunta {idx + 1}: {question.question}
                            </p>
                            <p className={`text-sm font-semibold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
                            </p>
                            {!isCorrect && selected !== undefined && (
                              <p className="text-sm text-gray-700 mb-2">
                                <span className="font-semibold">Tu respuesta:</span> {question.options[selected]}
                              </p>
                            )}
                            <p className="text-sm text-gray-700 mb-2">
                              <span className="font-semibold">Respuesta correcta:</span>{' '}
                              {question.options[question.correctAnswer]}
                            </p>
                            <p className="text-sm text-gray-600 italic">{question.explanation}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowResults(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Revisar Respuestas
                    </button>
                    <button
                      onClick={saveQuestionnaire}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Guardando...' : 'Guardar Cuestionario'}
                    </button>
                    <button
                      onClick={() => {
                        setShowResults(false);
                        setStep('upload');
                        setQuestions([]);
                        setSelectedAnswers({});
                        setUploadedText('');
                        setError(null);
                      }}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Nuevo Cuestionario
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Archivos Existentes */}
          {tab === 'existing' && (
            <ExistingFilesSection
              onSelectFile={async (file: ExistingFile) => {
                console.log('onSelectFile called with file:', file);
                setLoading(true);
                setError(null);
                
                try {
                  const isAudio = file.mimeType?.includes('audio');
                  console.log('Is audio?', isAudio, 'mimeType:', file.mimeType);
                  let extractedText = '';
                  
                  if (isAudio) {
                    // Para audios, obtener el resultado directamente desde /api/audio/{uploadId}
                    const token = localStorage.getItem('authToken');
                    console.log('Fetching audio from:', `${getApiUrl()}/api/audio/${file.id}`);
                    const response = await fetch(`${getApiUrl()}/api/audio/${file.id}`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      }
                    });

                    console.log('Audio response status:', response.status, response.ok);
                    if (response.ok) {
                      const audioResult = await response.json();
                      console.log('Audio result:', audioResult);
                      extractedText = audioResult.transcription || '';
                      console.log('Extracted text:', extractedText.substring(0, 100));
                    } else {
                      console.error('Audio response not ok');
                    }
                  } else {
                    // Para PDFs e imágenes, obtener el resultado de OCR
                    const token = localStorage.getItem('authToken');
                    console.log('Fetching OCR from:', `${getApiUrl()}/api/ocr/${file.id}`);
                    const response = await fetch(`${getApiUrl()}/api/ocr/${file.id}`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      }
                    });

                    console.log('OCR response status:', response.status, response.ok);
                    if (response.ok) {
                      const ocrResult = await response.json();
                      console.log('OCR result:', ocrResult);
                      extractedText = ocrResult.extractedText?.text || ocrResult.extractedText || '';
                      console.log('Extracted text:', extractedText.substring(0, 100));
                    } else {
                      console.error('OCR response not ok');
                    }
                  }
                  
                  console.log('Final extracted text length:', extractedText.length);
                  if (extractedText && extractedText.trim().length > 0) {
                    console.log('Setting uploaded text and moving to selectQuestions step');
                    setUploadedText(extractedText);
                    setUploadedFileName((file as any).originalFilename || (file as any).fileName || (file as any).name || 'File');
                    setTab('new');
                    setStep('selectQuestions');
                  } else {
                    console.error('No extracted text found');
                    setError('No se pudo obtener el texto del archivo. Por favor intenta con otro archivo.');
                  }
                } catch (err) {
                  console.error('Error in onSelectFile:', err);
                  setError('Error al cargar el archivo. Por favor intenta de nuevo.');
                } finally {
                  console.log('Setting loading to false');
                  setLoading(false);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
