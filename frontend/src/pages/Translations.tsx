import React from 'react';
import { TranslationsList } from '../components/TranslationsList';
import { Languages } from 'lucide-react';

export const Translations: React.FC = () => {
  return (
    <div className="bg-gray-50">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Languages className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Traducciones</h1>
              <p className="text-gray-600 mt-1">
                Accede a todas tus traducciones guardadas
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <TranslationsList />
        </div>

        {/* Tips */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Traduce texto desde archivos PDF, imágenes o audio</li>
            <li>• Soportamos 10 idiomas diferentes</li>
            <li>• Las traducciones se guardan automáticamente</li>
            <li>• Puedes copiar el texto traducido con un clic</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
