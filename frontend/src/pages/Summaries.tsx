import React from 'react';
import { SummariesList } from '../components/SummariesList';
import { FileText } from 'lucide-react';

export const Summaries: React.FC = () => {
  return (
    <div className="bg-gray-50">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Resúmenes</h1>
              <p className="text-gray-600 mt-1">
                Accede a todos tus resúmenes generados y descárgalos
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <SummariesList />
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Descarga tus resúmenes en formato de texto</li>
            <li>• Puedes generar resúmenes desde archivos PDF, imágenes o audio</li>
            <li>• Los resúmenes se guardan automáticamente en la nube</li>
            <li>• Selecciona diferentes estilos: Viñetas, Párrafo o Ejecutivo</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
