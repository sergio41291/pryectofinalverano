import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { UploadModal } from '../components/UploadModal';
import { SummaryModal } from '../components/SummaryModal';
import { TranslateModal } from '../components/TranslateModal';
import { MindMapModal } from '../components/MindMapModal';
import { AudioUploadModal } from '../components/AudioUploadModal';
import { AudioViewModal } from '../components/AudioViewModal';
import { AudioResultsList } from '../components/AudioResultsList';
import { AudioResults } from '../components/AudioResults';
import { AudioSummaryModal } from '../components/AudioSummaryModal';
import { AudioQuestionnaireModal } from '../components/AudioQuestionnaireModal';
import { QuestionnaireGeneratorModal } from '../components/QuestionnaireGeneratorModal';
import { QuestionnairesList } from '../components/QuestionnairesList';
import { Summaries } from './Summaries';
import { MindMaps } from './MindMaps';
import { Translations } from './Translations';
import { Groups } from './Groups';
import { aiService } from '../services/aiService';
import { type AudioResult } from '../services/audioService';
import { useOcrProgress } from '../hooks/useOcrProgress';
import { useAudioHistory } from '../hooks/useAudioHistory';
import {
  Upload,
  FileText,
  BrainCircuit,
  Video,
  Music,
  Users,
  Sparkles,
  FolderOpen,
  Loader,
  AlertCircle,
  Copy,
  X,
  Headphones,
  Network,
  Languages,
} from 'lucide-react';

export function Home() {
  // Inicializar socket de OCR al cargar el componente
  const { state, reset } = useOcrProgress();
  const { results: audioResults, loading: audioLoading, refresh: refreshAudio, page: audioPage, total: audioTotal, loadResults: audioLoadResults } = useAudioHistory();
  
  const [seccion, setSeccion] = useState('inicio');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [isMindMapModalOpen, setIsMindMapModalOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryResult, setGeneratedSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [audioResult, setAudioResult] = useState<AudioResult | null>(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [viewingAudio, setViewingAudio] = useState<AudioResult | null>(null);
  
  // IA Lab States
  const [showAudioSummary, setShowAudioSummary] = useState(false);
  const [showAudioQuestionnaire, setShowAudioQuestionnaire] = useState(false);
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [selectedAudioTranscription, setSelectedAudioTranscription] = useState<string>('');
  const [selectedAudioFileName, setSelectedAudioFileName] = useState<string>('');
  const [showQuestionnaireGenerator, setShowQuestionnaireGenerator] = useState(false);

  const misArchivos = [
    { nombre: 'Clase de Historia.pdf', tipo: 'PDF', fecha: 'Hace 2 horas', icon: FileText, color: 'text-red-500' },
    { nombre: 'Audio_Biologia.mp3', tipo: 'Audio', fecha: 'Ayer', icon: Music, color: 'text-purple-500' },
    { nombre: 'Resumen_Calculo.mp4', tipo: 'Video', fecha: '20 Ene', icon: Video, color: 'text-blue-500' },
  ];

  const renderContenido = () => {
    switch (seccion) {
      case 'inicio':
        return (
          <>
            <header className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Mi Inicio</h1>
                <p className="text-gray-500">Bienvenido a tu biblioteca inteligente.</p>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-6 mb-10 md:grid-cols-3">
              <div onClick={() => setIsUploadModalOpen(true)} className="p-6 transition-all bg-white border border-gray-100 shadow-sm cursor-pointer rounded-2xl hover:shadow-md group">
                <div className="flex items-center justify-center w-12 h-12 mb-4 text-green-600 transition-colors bg-green-100 rounded-xl group-hover:bg-green-600 group-hover:text-white">
                  <FileText size={24} />
                </div>
                <h3 className="font-bold text-gray-800 group-hover:text-green-600">OCR de Documentos</h3>
                <p className="text-sm text-gray-500">Extrae texto de imágenes y PDFs.</p>
              </div>

              <div onClick={() => setIsAudioModalOpen(true)} className="p-6 transition-all bg-white border border-gray-100 shadow-sm cursor-pointer rounded-2xl hover:shadow-md group">
                <div className="flex items-center justify-center w-12 h-12 mb-4 text-purple-600 transition-colors bg-purple-100 rounded-xl group-hover:bg-purple-600 group-hover:text-white">
                  <Headphones size={24} />
                </div>
                <h3 className="font-bold text-gray-800 group-hover:text-purple-600">Transcribir Audio</h3>
                <p className="text-sm text-gray-500">Convierte audio a texto con IA.</p>
              </div>

              <div onClick={() => setIsSummaryModalOpen(true)} className="p-6 transition-all bg-white border border-gray-100 shadow-sm cursor-pointer rounded-2xl hover:shadow-md group">
                <div className="flex items-center justify-center w-12 h-12 mb-4 text-blue-600 transition-colors bg-blue-100 rounded-xl group-hover:bg-blue-600 group-hover:text-white">
                  <BrainCircuit size={24} />
                </div>
                <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Procesar con IA</h3>
                <p className="text-sm text-gray-500">Resúmenes y mapas mentales.</p>
              </div>
            </div>

            {/* Mostrar resultado de transcripción de audio si existe */}
            {audioResult && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Transcripción Completada</h2>
                <AudioResults result={audioResult} fileName={audioFileName} />
                <button
                  onClick={() => {
                    setAudioResult(null);
                    setAudioFileName('');
                  }}
                  className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Procesar Otro Audio
                </button>
              </div>
            )}

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Materiales Recientes</h2>
                <button onClick={() => setSeccion('materiales')} className="text-sm font-semibold text-blue-600 hover:underline">Ver todos</button>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {misArchivos.map((archivo, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 transition-all bg-white border border-gray-200 shadow-sm cursor-pointer rounded-xl hover:border-blue-300 hover:shadow-md">
                    <div className={`${archivo.color} bg-gray-50 p-3 rounded-lg`}><archivo.icon size={24} /></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800 truncate">{archivo.nombre}</h4>
                      <p className="text-xs text-gray-500">{archivo.tipo} • {archivo.fecha}</p>
                    </div>
                  </div>
                ))}

                <div
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center justify-center gap-2 p-4 text-gray-500 transition-all border-2 border-gray-300 border-dashed shadow-sm cursor-pointer rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-white"
                >
                  <Upload size={20} />
                  <span className="text-sm font-medium">Subir nuevo</span>
                </div>
              </div>
            </section>
          </>
        );

      case 'materiales':
        return (
          <div>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-gray-800">Mis Materiales</h1>
                <p className="text-gray-500">Organiza y gestiona todos tus documentos cargados.</p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Upload size={18} /> Subir Archivo
              </button>
            </div>
            <div className="p-20 text-center bg-white border border-gray-100 shadow-sm rounded-3xl">
              <FolderOpen size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-400">Aquí verás tu lista completa de archivos muy pronto.</p>
            </div>
          </div>
        );

      case 'transcripciones':
        return (
          <div>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-gray-800">Mis Transcripciones</h1>
                <p className="text-gray-500">Gestiona y descarga tus transcripciones de audio.</p>
              </div>
              <button
                onClick={() => setIsAudioModalOpen(true)}
                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
              >
                <Headphones size={18} /> Nuevo Audio
              </button>
            </div>

            {audioLoading && !audioResults?.length ? (
              <div className="flex items-center justify-center p-20 bg-white rounded-3xl border border-gray-100">
                <Loader size={40} className="animate-spin text-blue-600" />
              </div>
            ) : audioResults?.length > 0 ? (
              <AudioResultsList
                results={audioResults}
                loading={audioLoading}
                page={audioPage}
                total={audioTotal}
                onView={(result) => setViewingAudio(result)}
                onPageChange={(newPage) => audioLoadResults(newPage)}
                onDelete={async () => {
                  try {
                    // Delete would need to be implemented in audioService
                    refreshAudio();
                  } catch (err) {
                    console.error('Error deleting audio result:', err);
                  }
                }}
                onAIAction={(action, result) => {
                  if (action === 'summary') {
                    setSelectedAudioId(result.id);
                    setSelectedAudioFileName(result.fileName || 'Audio');
                    setSelectedAudioTranscription(result.transcription || '');
                    setShowAudioSummary(true);
                  } else if (action === 'quiz') {
                    setSelectedAudioId(result.id);
                    setSelectedAudioTranscription(result.transcription || '');
                    setShowQuestionnaireGenerator(true);
                  }
                }}
              />
            ) : (
              <div className="p-20 text-center bg-white border border-gray-100 shadow-sm rounded-3xl">
                <Headphones size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-400">Carga archivos de audio para transcribir. Soporta MP3, WAV, M4A, AAC, FLAC, OGG y WEBM.</p>
              </div>
            )}
          </div>
        );

      case 'ia':
        return (
          <div>
            <h1 className="flex items-center gap-3 mb-2 text-3xl font-bold text-gray-800">
              IA Lab <Sparkles className="text-blue-600" />
            </h1>
            <p className="mb-8 text-gray-500">El laboratorio inteligente para potenciar tu cerebro.</p>

            {/* Mostrar resultado del resumen si existe */}
            {summaryResult && (
              <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">📋 Resumen Generado</h3>
                    <p className="text-sm text-green-700 mt-1">✓ Se guardó automáticamente en "Mis Resúmenes"</p>
                  </div>
                  <button
                    onClick={() => setGeneratedSummary(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="bg-white p-4 rounded-lg max-h-96 overflow-y-auto mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {summaryResult}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(summaryResult);
                    setCopiedToClipboard(true);
                    setTimeout(() => setCopiedToClipboard(false), 2000);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <Copy size={16} className="inline mr-2" />
                  {copiedToClipboard ? 'Copiado!' : 'Copiar Resumen'}
                </button>
              </div>
            )}

            {/* Mostrar error si hay */}
            {summaryError && (
              <div className="mb-8 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                {summaryError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-3xl transition-all hover:shadow-md hover:border-blue-300 cursor-pointer group">
                <h3 className="mb-2 text-xl font-bold text-gray-900">Resumen Automático</h3>
                <p className="mb-4 text-sm text-gray-600">Extrae lo más importante de tus PDFs en segundos.</p>
                <button
                  onClick={() => setIsSummaryModalOpen(true)}
                  disabled={isGeneratingSummary}
                  className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isGeneratingSummary ? (
                    <>
                      <Loader className="inline animate-spin mr-2" size={16} />
                      Generando...
                    </>
                  ) : (
                    <>
                      <span className="group-hover:hidden">Empezar</span>
                      <span className="hidden group-hover:inline">Probar ahora</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-3xl transition-all hover:shadow-md hover:border-blue-300 cursor-pointer group">
                <h3 className="mb-2 font-sans text-xl font-bold text-gray-900">Generar Cuestionario</h3>
                <p className="mb-4 text-sm text-gray-600">Crea preguntas de estudio basadas en tu material.</p>
                <button
                  onClick={() => setShowQuestionnaireGenerator(true)}
                  className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <span className="group-hover:hidden">Empezar</span>
                  <span className="hidden group-hover:inline">Probar ahora</span>
                </button>
              </div>
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-3xl transition-all hover:shadow-md hover:border-purple-300 cursor-pointer group">
                <h3 className="mb-2 font-sans text-xl font-bold text-gray-900">Mapas Mentales</h3>
                <p className="mb-4 text-sm text-gray-600">Visualiza conceptos complejos en diagramas interactivos.</p>
                <button
                  onClick={() => setIsMindMapModalOpen(true)}
                  className="px-6 py-2 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Network size={16} />
                  <span className="group-hover:hidden">Empezar</span>
                  <span className="hidden group-hover:inline">Probar ahora</span>
                </button>
              </div>
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-3xl transition-all hover:shadow-md hover:border-indigo-300 cursor-pointer group">
                <h3 className="mb-2 font-sans text-xl font-bold text-gray-900">Traducir</h3>
                <p className="mb-4 text-sm text-gray-600">Traduce documentos y texto a más de 10 idiomas.</p>
                <button
                  onClick={() => setIsTranslateModalOpen(true)}
                  className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Languages size={16} />
                  <span className="group-hover:hidden">Empezar</span>
                  <span className="hidden group-hover:inline">Probar ahora</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'comunidades':
        return (
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-800">Comunidades</h1>
            <p className="mb-8 text-gray-500">Aprende y comparte con otros estudiantes de LearnMind AI.</p>
            <div className="flex flex-col items-center justify-center p-20 border-2 border-white bg-blue-50 rounded-3xl">
              <Users size={48} className="mb-4 text-blue-400" />
              <h3 className="text-xl font-bold text-blue-800">Próximamente</h3>
              <p className="text-blue-600/60">Estamos preparando el espacio para colaborar con tu clase.</p>
            </div>
          </div>
        );

      case 'grupos':
        return <Groups />;

      case 'cuestionarios':
        return (
          <div>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-gray-800">Mis Cuestionarios</h1>
                <p className="text-gray-500">Organiza, comparte y gestiona tus cuestionarios.</p>
              </div>
            </div>
            <QuestionnairesList />
          </div>
        );

      case 'resumenes':
        return <Summaries />;

      case 'mapas-mentales':
        return <MindMaps />;

      case 'traducciones':
        return <Translations />;

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar seccionActual={seccion} setSeccion={setSeccion} />

      <main className="flex-1 p-8 ml-64">
        {renderContenido()}
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          reset();
        }}
        ocrState={state}
        ocrReset={reset}
      />

      <AudioUploadModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onSuccess={(result) => {
          setAudioResult(result);
          setIsAudioModalOpen(false);
          refreshAudio();
          // Set audio file name based on result
          setAudioFileName(`audio_${result.id}.mp3`);
        }}
      />

      <AudioViewModal
        result={viewingAudio}
        onClose={() => setViewingAudio(null)}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => {
          setIsSummaryModalOpen(false);
          reset();
        }}
        ocrState={state}
        ocrReset={reset}
        onSummaryStart={async (data) => {
          // Validate that we have text to summarize
          if (!data.ocrText || data.ocrText.trim().length === 0) {
            setSummaryError('El archivo aún se está procesando. Por favor, espera a que el OCR se complete.');
            return;
          }

          setIsSummaryModalOpen(false);
          setIsGeneratingSummary(true);
          setSummaryError(null);
          setGeneratedSummary(''); // Reset para streaming

          try {
            let fullSummary = '';
            
            // Usar streaming de Claude API
            const generator = aiService.streamSummarize({
              text: data.ocrText || '',
              language: 'es',
              style: 'bullet-points',
              maxTokens: 1024,
            });

            for await (const chunk of generator) {
              fullSummary += chunk;
              setGeneratedSummary(fullSummary);
            }

            // Guardar el resumen automáticamente después de generarlo
            let savedSuccessfully = false;
            try {
              const fileName = data.fileName || `resumen_${new Date().toISOString().slice(0, 10)}`;
              const result = await aiService.saveSummary({
                title: fileName.replace(/\.[^/.]+$/, ''), // Eliminar extensión
                sourceText: data.ocrText,
                summaryContent: fullSummary,
                language: 'es',
                style: 'bullet-points',
                sourceFileName: fileName,
              });
              console.log('Summary saved successfully:', result);
              savedSuccessfully = true;
            } catch (saveErr: any) {
              console.error('Error saving summary:', saveErr);
              const errorMsg = saveErr.response?.data?.message || saveErr.message || 'Error al guardar el resumen';
              setSummaryError(`Resumen generado pero no se pudo guardar: ${errorMsg}`);
            }
          } catch (err) {
            setSummaryError(err instanceof Error ? err.message : 'Error al generar el resumen');
            console.error('Summary error:', err);
          } finally {
            setIsGeneratingSummary(false);
          }
        }}
      />

      <MindMapModal
        isOpen={isMindMapModalOpen}
        onClose={() => {
          setIsMindMapModalOpen(false);
          reset();
        }}
        ocrState={state}
        ocrReset={reset}
        onMindMapGenerated={(mindMap) => {
          console.log('Mind map generated:', mindMap);
          // No cerrar el modal - dejar que el usuario vea la vista previa
        }}
      />

      <TranslateModal
        isOpen={isTranslateModalOpen}
        onClose={() => {
          setIsTranslateModalOpen(false);
          reset();
        }}
        ocrState={state}
        ocrReset={reset}
      />

      <AudioSummaryModal
        audioFileName={selectedAudioFileName}
        audioTranscription={selectedAudioTranscription}
        onClose={() => {
          setShowAudioSummary(false);
          setSelectedAudioId('');
          setSelectedAudioFileName('');
          setSelectedAudioTranscription
          setShowAudioSummary(false);
          setSelectedAudioId('');
        }}
      />
      <AudioQuestionnaireModal
        isOpen={showAudioQuestionnaire}
        audioResultId={selectedAudioId}
        onClose={() => {
          setShowAudioQuestionnaire(false);
          setSelectedAudioId('');
        }}
      />
      <QuestionnaireGeneratorModal
        isOpen={showQuestionnaireGenerator}
        preloadedText={selectedAudioTranscription}
        preloadedFileName={`Audio ${selectedAudioId.slice(0, 8)}`}
        onClose={() => {
          setShowQuestionnaireGenerator(false);
          setSelectedAudioId('');
          setSelectedAudioTranscription('');
        }}
      />
    </div>
  );
}