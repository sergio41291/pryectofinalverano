import { X, Upload, File, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { useOcrProgress } from '../hooks/useOcrProgress';
import { useRef } from 'react';

export function UploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { state, reset } = useOcrProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/uploads/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      // El estado se actualiza vía WebSocket
    } catch (error) {
      console.error('Error al subir archivo:', error);
    }
  };

  const handleReset = () => {
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-100">
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Caja del Modal */}
      <div className="relative w-full max-w-2xl overflow-hidden duration-200 bg-white shadow-2xl rounded-3xl animate-in fade-in zoom-in">
        <button onClick={onClose} className="absolute text-gray-400 top-4 right-4 hover:text-gray-600 z-10">
          <X size={24} />
        </button>

        <div className="p-8">
          {/* Paso 1: Seleccionar archivo */}
          {state.step === 'idle' && (
            <>
              <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 text-blue-600 rounded-full bg-blue-50">
                  <Upload size={40} />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-800">Resumen Automático</h2>
                <p className="mb-8 text-sm text-gray-500">Sube un archivo para extraer texto y generar un resumen con IA</p>
              </div>
              
              <div className="p-8 mb-6 transition-all border-2 border-gray-200 border-dashed cursor-pointer rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 group">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  id="fileInput" 
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                />
                <label htmlFor="fileInput" className="cursor-pointer block">
                  <File className="mx-auto mb-2 text-gray-300 group-hover:text-blue-400" size={32} />
                  <span className="block text-sm font-medium text-gray-600">Arrastra tu archivo aquí</span>
                  <span className="text-xs text-gray-400">o haz clic para buscar</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 text-center">Formatos soportados: PDF, JPG, PNG, GIF (máx 100MB)</p>
            </>
          )}

          {/* Pasos 2-4: Procesamiento */}
          {(state.step === 'uploading' || state.step === 'extracting' || state.step === 'generating') && (
            <div className="py-8">
              {/* Barra de progreso */}
              <div className="mb-8">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${state.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{state.progress}% completado</p>
              </div>

              {/* Spinner */}
              <div className="flex justify-center mb-8">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Mensaje de estado */}
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                {state.message}
              </h2>

              {/* Indicadores de proceso */}
              <div className="space-y-2 mt-8">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${state.progress >= 40 ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`w-2 h-2 rounded-full ${state.progress >= 40 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className={`text-sm ${state.progress >= 40 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                    Extrayendo texto
                  </span>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${state.progress >= 70 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className={`w-2 h-2 rounded-full ${state.progress >= 70 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className={`text-sm ${state.progress >= 70 ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                    Generando resumen con IA
                  </span>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${state.progress >= 100 ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`w-2 h-2 rounded-full ${state.progress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className={`text-sm ${state.progress >= 100 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                    Completado
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Paso 5: Resultado */}
          {state.step === 'completed' && (
            <div className="py-8">
              <div className="flex justify-center mb-6">
                <CheckCircle2 size={64} className="text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Tu Resumen está Listo</h2>

              {/* Caja del resumen */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200 max-h-64 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                  {state.summary}
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 font-bold text-white transition-colors bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700"
                >
                  Ver en Detalle
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 py-3 font-bold text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Procesar Otro
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {state.step === 'error' && (
            <div className="py-8">
              <div className="flex justify-center mb-6">
                <AlertCircle size={64} className="text-red-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Error al procesar</h2>
              <p className="text-sm text-red-600 text-center mb-6">{state.error}</p>

              {/* Botón para reintentar */}
              <button 
                onClick={handleReset}
                className="w-full py-3 font-bold text-white transition-colors bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700"
              >
                Intentar Nuevamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}