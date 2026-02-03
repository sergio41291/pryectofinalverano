import api from './api';

export interface Questionnaire {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  totalResponses: number;
  averageScore: number | string;
  createdAt: string;
  updatedAt: string;
  groupId?: string | null;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

const questionnairesService = {
  // Compartir cuestionario con un grupo
  async shareWithGroup(questionnaireId: string, groupId: string): Promise<Questionnaire> {
    const response = await api.post<Questionnaire>(
      `/questionnaires/${questionnaireId}/share-with-group/${groupId}`
    );
    return response.data;
  },

  // Dejar de compartir cuestionario con el grupo
  async unshareFromGroup(questionnaireId: string): Promise<Questionnaire> {
    const response = await api.delete<Questionnaire>(
      `/questionnaires/${questionnaireId}/unshare-from-group`
    );
    return response.data;
  },

  // Obtener todos los cuestionarios del usuario
  async getMyQuestionnaires(): Promise<Questionnaire[]> {
    const response = await api.get<Questionnaire[]>('/questionnaires');
    return response.data;
  },
};

export default questionnairesService;
