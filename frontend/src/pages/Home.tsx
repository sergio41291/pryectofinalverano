import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { UploadModal } from '../components/UploadModal';
import { SummaryModal } from '../components/SummaryModal';
import { aiService } from '../services/aiService';
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
} from 'lucide-react';

export function Home() {
  const [seccion, setSeccion] = useState('inicio');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryResult, setGeneratedSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

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
              <div onClick={() => setIsSummaryModalOpen(true)} className="p-6 transition-all bg-white border border-gray-100 shadow-sm cursor-pointer rounded-2xl hover:shadow-md group">
                <div className="flex items-center justify-center w-12 h-12 mb-4 text-blue-600 transition-colors bg-blue-100 rounded-xl group-hover:bg-blue-600 group-hover:text-white">
                  <BrainCircuit size={24} />
                </div>
                <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Procesar con IA</h3>
                <p className="text-sm text-gray-500">Resúmenes y mapas mentales.</p>
              </div>
            </div>

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
                  <h3 className="text-lg font-bold text-gray-900">📋 Resumen Generado</h3>
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="p-8 text-white shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl">
                <h3 className="mb-2 text-xl font-bold text-white">Resumen Automático</h3>
                <p className="mb-4 text-sm text-blue-100">Extrae lo más importante de tus PDFs en segundos.</p>
                <button
                  onClick={() => setIsSummaryModalOpen(true)}
                  disabled={isGeneratingSummary}
                  className="px-6 py-2 text-sm font-bold text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {isGeneratingSummary ? (
                    <>
                      <Loader className="inline animate-spin mr-2" size={16} />
                      Generando...
                    </>
                  ) : (
                    'Probar ahora'
                  )}
                </button>
              </div>
              <div className="p-8 transition-all bg-white border border-gray-100 shadow-sm rounded-3xl hover:shadow-md">
                <h3 className="mb-2 font-sans text-xl font-bold text-gray-800">Generar Cuestionario</h3>
                <p className="mb-4 text-sm text-gray-500">Crea preguntas de estudio basadas en tu material.</p>
                <button
                  onClick={() => {}}
                  className="px-6 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Empezar
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
        onClose={() => setIsUploadModalOpen(false)}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
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
          } catch (err) {
            setSummaryError(err instanceof Error ? err.message : 'Error al generar el resumen');
            console.error('Summary error:', err);
          } finally {
            setIsGeneratingSummary(false);
          }
        }}
      />
    </div>
  );
}