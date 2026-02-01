import React, { useState } from 'react';
import { Network, X } from 'lucide-react';
import { MindMapGenerator } from '../components/MindMapGenerator';
import { MindMapVisualization } from '../components/MindMapVisualization';
import { MindMapsList } from '../components/MindMapsList';
import type { MindMap } from '../services/mindMapService';

export const MindMaps: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'list'>('generate');
  const [viewingMindMap, setViewingMindMap] = useState<MindMap | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGenerated = (mindMap: MindMap) => {
    setViewingMindMap(mindMap);
    setRefreshTrigger((prev) => prev + 1);
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Mapas Mentales</h1>
            <p className="text-gray-600 mt-1">Visualiza conceptos y sus relaciones con IA</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'generate'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Generar
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mis Mapas Mentales
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <MindMapGenerator onGenerated={handleGenerated} />
            
            {viewingMindMap && (
              <div className="relative">
                <button
                  onClick={handleCloseVisualization}
                  className="absolute top-4 right-4 z-10 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                  title="Cerrar visualización"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <MindMapVisualization
                  structure={viewingMindMap.structure}
                  title={viewingMindMap.title}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'list' && (
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
                />
              </div>
            ) : (
              <MindMapsList
                refreshTrigger={refreshTrigger}
                onViewMindMap={handleViewMindMap}
              />
            )}
          </div>
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
              <p className="font-medium mb-2">¿Cómo funcionan?</p>
              <p>
                Nuestra IA analiza tu texto, identifica los conceptos principales, secundarios y
                sus conexiones, generando automáticamente un mapa visual interactivo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
