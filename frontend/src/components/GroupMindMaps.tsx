import { useState, useEffect } from 'react';
import { Brain, User, Calendar, Loader } from 'lucide-react';
import groupsService from '../services/groupsService';
import { type MindMap } from '../services/mindMapsService';

interface GroupMindMapsProps {
  groupId: string;
}

export function GroupMindMaps({ groupId }: GroupMindMapsProps) {
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMindMaps();
  }, [groupId]);

  const loadMindMaps = async () => {
    try {
      setLoading(true);
      const data = await groupsService.getGroupMindMaps(groupId);
      setMindMaps(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading mind maps');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMindMap = (mindMapId: string) => {
    // Navegar a la página de visualización del mapa mental
    window.location.href = `/mind-maps/${mindMapId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  if (mindMaps.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <Brain size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No mind maps shared yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Group members can share mind maps with this group.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mindMaps.map((mindMap) => (
          <div
            key={mindMap.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewMindMap(mindMap.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Brain size={24} className="text-purple-600" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                {mindMap.language.toUpperCase()}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {mindMap.title}
            </h3>

            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {mindMap.sourceText.substring(0, 100)}...
            </p>

            <div className="space-y-2 text-sm text-gray-600">
              {mindMap.user && (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span>{mindMap.user.fullName || mindMap.user.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span>{new Date(mindMap.createdAt).toLocaleDateString('es-ES')}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-xs text-gray-500">Nodes:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {mindMap.nodeCount || mindMap.structure.nodes.length}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Chars:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {mindMap.sourceCharCount || mindMap.sourceText.length}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewMindMap(mindMap.id);
              }}
              className="mt-4 w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              View Mind Map
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
