import { X, Upload, File, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function UploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1); // 1: Seleccionar, 2: Subiendo, 3: Éxito

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
              <h2 className="mb-2 text-xl font-bold text-gray-800">Procesando archivo...</h2>
              <p className="text-sm text-gray-500">Nuestra IA está analizando el contenido.</p>
              <button onClick={() => setStep(3)} className="mt-8 text-sm font-medium text-blue-600">Simular éxito</button>
            </div>
          )}

          {step === 3 && (
            <div className="py-6">
              <CheckCircle2 size={64} className="mx-auto mb-6 text-green-500" />
              <h2 className="mb-2 text-2xl font-bold text-gray-800">¡Listo para estudiar!</h2>
              <p className="mb-8 text-sm text-gray-500">Tu material ha sido procesado correctamente.</p>
              <button 
                onClick={onClose}
                className="w-full py-3 font-bold text-white transition-colors bg-blue-600 rounded-xl hover:bg-blue-700"
              >
                Ir a mis materiales
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}