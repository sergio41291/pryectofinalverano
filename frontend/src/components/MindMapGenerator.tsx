import React, { useState } from 'react';
import { Sparkles, Loader, AlertCircle } from 'lucide-react';
import { mindMapService } from '../services/mindMapService';
import type { MindMap } from '../services/mindMapService';

interface MindMapGeneratorProps {
  onGenerated: (mindMap: MindMap) => void;
}

export const MindMapGenerator: React.FC<MindMapGeneratorProps> = ({ onGenerated }) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('es');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (text.trim().length < 50) {
      setError('El texto debe tener al menos 50 caracteres para generar un mapa mental útil');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await mindMapService.generateMindMap({
        text: text.trim(),
        title: title.trim() || undefined,
        language,
      });

      onGenerated(response.data);
      setText('');
      setTitle('');
    } catch (err: any) {
      console.error('Error generating mind map:', err);
      setError(err.response?.data?.message || err.message || 'Error al generar el mapa mental');
    } finally {
      setLoading(false);
    }
  };

  const charCount = text.length;
  const isValidLength = charCount >= 50 && charCount <= 10000;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Sparkles className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Generar Mapa Mental</h2>
          <p className="text-sm text-gray-600">Escribe o pega el texto para crear un mapa mental automáticamente</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título (opcional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Conceptos de Inteligencia Artificial"
            maxLength={500}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texto para analizar
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pega aquí el texto del que quieres generar un mapa mental. Debe tener al menos 50 caracteres. Puedes pegar contenido de documentos, artículos, notas de clase, etc."
            rows={12}
            maxLength={10000}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-sm ${
                isValidLength
                  ? 'text-green-600'
                  : charCount > 10000
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {charCount} / 10000 caracteres
              {charCount < 50 && charCount > 0 && ` (mínimo 50)`}
            </span>
          </div>
        </div>

        {/* Language Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idioma
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="pt">Português</option>
            <option value="it">Italiano</option>
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!isValidLength || loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generando mapa mental...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generar Mapa Mental
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Consejos</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Usa textos con ideas claras y bien estructuradas</li>
          <li>• Textos más largos generan mapas más completos</li>
          <li>• El mapa mostrará conceptos principales y sus relaciones</li>
          <li>• Puedes descargar el resultado como JSON para editarlo</li>
        </ul>
      </div>
    </div>
  );
};
