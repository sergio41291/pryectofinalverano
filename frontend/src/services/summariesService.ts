import api from './api';

export interface Summary {
  id: string;
  userId: string;
  title: string;
  sourceText: string;
  summaryContent: string;
  language: string;
  style: 'bullet-points' | 'paragraph' | 'executive';
  sourceFileName?: string;
  sourceCharCount?: number;
  summaryCharCount?: number;
  createdAt: string;
  updatedAt: string;
  groupId?: string | null;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

const summariesService = {
  // Compartir resumen con un grupo
  async shareWithGroup(summaryId: string, groupId: string): Promise<Summary> {
    const response = await api.post<{ success: boolean; data: Summary }>(
      `/processing/summaries/${summaryId}/share-with-group/${groupId}`
    );
    return response.data.data;
  },

  // Dejar de compartir resumen con el grupo
  async unshareFromGroup(summaryId: string): Promise<Summary> {
    const response = await api.delete<{ success: boolean; data: Summary }>(
      `/processing/summaries/${summaryId}/unshare-from-group`
    );
    return response.data.data;
  },

  // Obtener todos los resúmenes del usuario
  async getMySummaries(page: number = 1, limit: number = 10): Promise<Summary[]> {
    const response = await api.get<Summary[]>(`/processing/summaries?page=${page}&limit=${limit}`);
    return response.data;
  },
};

export default summariesService;
