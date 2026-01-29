import { X, Upload, File, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

export function UploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1); // 1: Seleccionar, 2: Subiendo, 3: Resumen automático, 4: Éxito

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-100">
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Caja del Modal */}
      <div className="relative w-full max-w-md overflow-hidden duration-200 bg-white shadow-2xl rounded-3xl animate-in fade-in zoom-in">
        <button onClick={onClose} className="absolute text-gray-400 top-4 right-4 hover:text-gray-600">
          <X size={24} />
        </button>

        <div className="p-8 text-center">
          {step === 1 && (
            <>
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 text-blue-600 rounded-full bg-blue-50">
                <Upload size={40} />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-800">Subir Material</h2>
              <p className="mb-8 text-sm text-gray-500">Sube tus PDFs, imágenes o audios para que la IA los procese.</p>
              
              <div className="p-8 mb-6 transition-all border-2 border-gray-200 border-dashed cursor-pointer rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 group">
                <input type="file" className="hidden" id="fileInput" onChange={() => setStep(2)} />
                <label htmlFor="fileInput" className="cursor-pointer">
                  <File className="mx-auto mb-2 text-gray-300 group-hover:text-blue-400" size={32} />
                  <span className="block text-sm font-medium text-gray-600">Arrastra tus archivos aquí</span>
                  <span className="text-xs text-gray-400">o haz clic para buscar</span>
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="py-12">
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <h2 className="mb-2 text-xl font-bold text-gray-800">Subiendo archivo...</h2>
              <p className="text-sm text-gray-500">Por favor espera mientras procesamos tu contenido.</p>
              <button onClick={() => setStep(3)} className="mt-8 text-sm font-medium text-blue-600">Siguiente</button>
            </div>
          )}

          {step === 3 && (
            <div className="py-12">
              {/* Fondo con gradiente animado */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50"></div>
              
              <div className="relative">
                {/* Spinner personalizado */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                </div>
                
                <h2 className="mb-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Resumen Automático
                </h2>
                <p className="text-sm text-gray-600 mb-2">Nuestro sistema de IA está procesando tu archivo</p>
                
                {/* Puntos animados */}
                <div className="flex justify-center gap-1 mt-4">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
                
                <p className="text-xs text-gray-400 mt-6">Esto puede tomar algunos segundos...</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-6">
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16">
                  <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-800">¡Resumen Generado!</h2>
              <p className="mb-8 text-sm text-gray-500">Tu material ha sido procesado correctamente y el resumen está listo.</p>
              <button 
                onClick={onClose}
                className="w-full py-3 font-bold text-white transition-colors bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700"
              >
                Ver Resumen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}