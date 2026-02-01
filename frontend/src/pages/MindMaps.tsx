import React, { useState } from 'react';
import { Network, X } from 'lucide-react';
import { MindMapVisualization } from '../components/MindMapVisualization';
import { MindMapsList } from '../components/MindMapsList';
import type { MindMap } from '../services/mindMapService';

export const MindMaps: React.FC = () => {
  const [viewingMindMap, setViewingMindMap] = useState<MindMap | null>(null);

  const handleViewMindMap = (mindMap: MindMap) => {
    setViewingMindMap(mindMap);
  };

  const handleCloseVisualization = () => {
    setViewingMindMap(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Network className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Mapas Mentales</h1>
            <p className="text-gray-600 mt-1">Visualiza y gestiona tus mapas mentales guardados</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {viewingMindMap ? (
          <div className="relative">
            <button
              onClick={handleCloseVisualization}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
              title="Volver a la lista"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <MindMapVisualization
              structure={viewingMindMap.structure}
              title={viewingMindMap.title}
              mindMapId={viewingMindMap.id}
            />
          </div>
        ) : (
          <MindMapsList
            onViewMindMap={handleViewMindMap}
          />
        )}
      </div>

      {/* Info Box */}
      {!viewingMindMap && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-3">🧠 Sobre los Mapas Mentales</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-800">
            <div>
              <p className="font-medium mb-2">¿Qué son?</p>
              <p>
                Los mapas mentales son representaciones visuales de conceptos y sus relaciones,
                perfectos para estudiar, organizar ideas y entender temas complejos.
              </p>
            </div>
            <div>
              <p className="font-medium mb-2">¿Cómo generarlos?</p>
              <p>
                Ve a la sección <span className="font-semibold">IA Lab</span> y haz clic en el card de "Mapas Mentales".
                Podrás subir un archivo nuevo o seleccionar uno existente para generar tu mapa mental.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
