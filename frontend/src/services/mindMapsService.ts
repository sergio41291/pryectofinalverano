import api from './api';

export interface MindMapNode {
  id: string;
  label: string;
  type?: 'root' | 'branch' | 'leaf';
  level?: number;
  position?: { x: number; y: number };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'default' | 'straight' | 'smoothstep';
}

export interface MindMapStructure {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  metadata?: {
    totalNodes: number;
    totalEdges: number;
    maxLevel: number;
    generatedAt: Date;
  };
}

export interface MindMap {
  id: string;
  userId: string;
  title: string;
  sourceText: string;
  structure: MindMapStructure;
  language: string;
  sourceCharCount?: number;
  nodeCount?: number;
  createdAt: string;
  updatedAt: string;
  groupId?: string | null;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

const mindMapsService = {
  // Compartir mapa mental con un grupo
  async shareWithGroup(mindMapId: string, groupId: string): Promise<MindMap> {
    const response = await api.post<{ success: boolean; data: MindMap }>(
      `/mind-maps/${mindMapId}/share-with-group/${groupId}`
    );
    return response.data.data;
  },

  // Dejar de compartir mapa mental con el grupo
  async unshareFromGroup(mindMapId: string): Promise<MindMap> {
    const response = await api.delete<{ success: boolean; data: MindMap }>(
      `/mind-maps/${mindMapId}/unshare-from-group`
    );
    return response.data.data;
  },

  // Obtener todos los mapas mentales del usuario
  async getMyMindMaps(page: number = 1, limit: number = 10): Promise<{ data: MindMap[]; total: number }> {
    const response = await api.get<{ success: boolean; data: MindMap[]; total: number }>(
      `/mind-maps?page=${page}&limit=${limit}`
    );
    return { data: response.data.data, total: response.data.total };
  },
};

export default mindMapsService;
