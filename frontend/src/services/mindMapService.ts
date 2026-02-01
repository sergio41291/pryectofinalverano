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
  title: string;
  language: string;
  sourceCharCount: number;
  nodeCount: number;
  structure: MindMapStructure;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateMindMapRequest {
  text: string;
  title?: string;
  language?: string;
}

export const mindMapService = {
  /**
   * Generate mind map from text
   */
  async generateMindMap(data: GenerateMindMapRequest): Promise<{ success: boolean; data: MindMap }> {
    const response = await api.post('/mind-maps/generate', data);
    return response.data;
  },

  /**
   * Get all mind maps with pagination
   */
  async getMindMaps(page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    data: MindMap[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await api.get('/mind-maps', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get specific mind map
   */
  async getMindMap(id: string): Promise<{ success: boolean; data: MindMap }> {
    const response = await api.get(`/mind-maps/${id}`);
    return response.data;
  },

  /**
   * Delete mind map
   */
  async deleteMindMap(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/mind-maps/${id}`);
    return response.data;
  },

  /**
   * Download mind map as JSON
   */
  async downloadMindMap(id: string, title: string): Promise<void> {
    const response = await api.get(`/mind-maps/${id}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_mindmap.json`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default mindMapService;
